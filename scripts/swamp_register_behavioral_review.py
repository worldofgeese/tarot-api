#!/usr/bin/env python3
"""Swamp Integration Pilot for Behavioral Review Reports.

This script registers behavioral review reports as Swamp-discoverable artifacts.

PILOT STATUS:
- Creates simple JSON manifests for behavioral review reports
- Makes reports discoverable through file-based indexing
- Does NOT yet integrate with full Swamp report/model system (requires upstream support)
- Serves as proof-of-concept for Swamp behavioral review integration

LOAD-BEARING:
- Actually creates .swamp/behavioral-reviews/ index
- Parses behavioral review reports and extracts metadata
- Creates machine-readable manifests for downstream tooling

ASPIRATIONAL (requires future work):
- Full Swamp model integration with schema validation
- Swamp workflow integration for automated report generation
- Swamp report registry integration for `swamp report get behavioral-review-*`
"""
import json
import re
import sys
from pathlib import Path
from datetime import datetime


def parse_behavioral_review(report_path: Path) -> dict:
    """Parse a behavioral review markdown report and extract metadata."""
    content = report_path.read_text()

    # Extract test results
    test_passed = bool(re.search(r"Test Result.*PASSED", content, re.I))
    pass_count = 0
    fail_count = 0

    pass_match = re.search(r"(\d+)\s+pass", content)
    fail_match = re.search(r"(\d+)\s+fail", content)

    if pass_match:
        pass_count = int(pass_match.group(1))
    if fail_match:
        fail_count = int(fail_match.group(1))

    # Extract timestamp from filename or content
    timestamp_match = re.search(r"(\d{8}-\d{6})", report_path.name)
    if timestamp_match:
        timestamp = datetime.strptime(timestamp_match.group(1), "%Y%m%d-%H%M%S").isoformat()
    else:
        timestamp = datetime.fromtimestamp(report_path.stat().st_mtime).isoformat()

    # Extract pages tested
    pages_tested = re.findall(r"\*\*(\w+ Page)\*\*", content)

    # Extract recommendations
    recommendations = []
    if "✅ All behavioral tests passed" in content:
        recommendations.append("All tests passed - ready for merge")
    if "⚠️" in content or "warning" in content.lower():
        recommendations.append("Warnings present - review recommended")

    return {
        "report_file": str(report_path),
        "report_name": report_path.stem,
        "timestamp": timestamp,
        "test_result": "PASSED" if test_passed else "UNKNOWN",
        "tests_passed": pass_count,
        "tests_failed": fail_count,
        "pages_tested": pages_tested,
        "recommendations": recommendations,
        "experiment": "EX-012",
        "artifact_type": "behavioral-review",
    }


def register_behavioral_reviews() -> int:
    """Main function - register behavioral review reports in Swamp index."""
    print("🌊 Swamp Behavioral Review Integration (Pilot)")
    print("=" * 60)

    reports_dir = Path("reports")
    if not reports_dir.exists():
        print("⚠️  No reports/ directory found")
        return 0

    # Create Swamp behavioral reviews index directory
    swamp_index = Path(".swamp/behavioral-reviews")
    swamp_index.mkdir(parents=True, exist_ok=True)

    # Find all behavioral review reports
    behavioral_reviews = list(reports_dir.glob("behavioral-review-*.md"))

    if not behavioral_reviews:
        print("⚠️  No behavioral review reports found")
        print(f"   Searched: {reports_dir}/behavioral-review-*.md")
        return 0

    print(f"Found {len(behavioral_reviews)} behavioral review report(s)")
    print()

    registered = []
    for report_path in behavioral_reviews:
        try:
            metadata = parse_behavioral_review(report_path)
            manifest_name = f"{report_path.stem}.json"
            manifest_path = swamp_index / manifest_name

            manifest_path.write_text(json.dumps(metadata, indent=2))
            registered.append(metadata)

            status_icon = "✅" if metadata["test_result"] == "PASSED" else "⚠️"
            print(f"{status_icon} Registered: {report_path.name}")
            print(f"   Tests: {metadata['tests_passed']} passed, {metadata['tests_failed']} failed")
            print(f"   Manifest: {manifest_path}")

        except Exception as e:
            print(f"❌ Failed to parse {report_path.name}: {e}")

    print()
    print(f"✅ Registered {len(registered)} behavioral review report(s)")
    print()
    print("Swamp index location:")
    print(f"  {swamp_index}/")
    print()
    print("PILOT STATUS:")
    print("  ✓ Reports parsed and indexed")
    print("  ✓ Machine-readable manifests created")
    print("  ✓ Discoverable through file-based indexing")
    print("  - Full Swamp model integration (requires upstream support)")
    print("  - Swamp workflow integration (requires upstream support)")
    print("  - `swamp report get` integration (requires registry support)")
    print()
    print("Next steps:")
    print("  - Extend Swamp model schema for behavioral reviews")
    print("  - Create Swamp workflow that calls behavioral_review.py")
    print("  - Register report type in Swamp registry")

    return 0


if __name__ == "__main__":
    sys.exit(register_behavioral_reviews())
