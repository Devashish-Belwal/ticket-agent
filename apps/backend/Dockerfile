FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile 2>/dev/null || bun install

# Copy source code
COPY src/ ./src/
COPY tsconfig.json ./
COPY .env ./.env

# Expose the port
EXPOSE 3000

# Start the server
CMD ["bun", "run", "start"]
