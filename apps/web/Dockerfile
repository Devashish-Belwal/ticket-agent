FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lock* ./
RUN bun install

# Copy application source
COPY . .

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
ENV BACKEND_URL=http://backend:3000
RUN bun run build

EXPOSE 3001

CMD ["bun", "run", "start"]
