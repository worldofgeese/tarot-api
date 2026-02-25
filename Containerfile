FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy application files
COPY . .

# Seed the database
RUN bun run seed

# Expose port
EXPOSE 3000

# Start the application
CMD ["bun", "run", "start"]
