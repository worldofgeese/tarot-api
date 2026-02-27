import { describe, test, expect } from "bun:test";
import { getSpread, listSpreads } from "../src/spreads";

describe("Spread Definitions Module", () => {
  test("listSpreads returns 3 spreads", () => {
    const spreads = listSpreads();
    expect(spreads.length).toBe(3);
  });

  test("getSpread('three-card') returns correct definition with 3 positions", () => {
    const spread = getSpread("three-card");
    expect(spread).toBeDefined();
    expect(spread?.id).toBe("three-card");
    expect(spread?.name).toBeDefined();
    expect(spread?.description).toBeDefined();
    expect(spread?.positions).toBeDefined();
    expect(spread?.positions.length).toBe(3);
    expect(spread?.positions[0].name).toBeDefined();
    expect(spread?.positions[0].meaning).toBeDefined();
  });

  test("getSpread('celtic-cross') returns 10 positions", () => {
    const spread = getSpread("celtic-cross");
    expect(spread).toBeDefined();
    expect(spread?.id).toBe("celtic-cross");
    expect(spread?.positions.length).toBe(10);
  });

  test("getSpread('horseshoe') returns 7 positions", () => {
    const spread = getSpread("horseshoe");
    expect(spread).toBeDefined();
    expect(spread?.id).toBe("horseshoe");
    expect(spread?.positions.length).toBe(7);
  });

  test("getSpread('invalid') returns undefined", () => {
    const spread = getSpread("invalid");
    expect(spread).toBeUndefined();
  });
});
