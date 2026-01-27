# syntax = docker/dockerfile:1
# =====================================================
# CRM Copilot - Production Dockerfile
# Multi-stage build for Next.js + Prisma + SQLite
# =====================================================

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=22.11.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Next.js/Prisma"

# Next.js/Prisma app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"

# Install pnpm
ARG PNPM_VERSION=10.28.2
RUN npm install -g pnpm@$PNPM_VERSION


# Throw-away build stage to reduce size of final image
FROM base AS build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp openssl pkg-config python-is-python3

# Install node modules
COPY package.json pnpm-lock.yaml ./
COPY prisma .
RUN pnpm install --frozen-lockfile --prod=false

# Generate Prisma Client
RUN npx prisma generate

# Copy application code
COPY . .

# Skip env validation during build (secrets not available)
ENV SKIP_ENV_VALIDATION=1

# Build application
RUN pnpm build

# Unset for runtime (validation will run at startup)
ENV SKIP_ENV_VALIDATION=


# Final stage for app image
FROM base

# Install packages needed for deployment
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y ca-certificates openssl && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

# Copy built application
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/package.json ./package.json

# Setup sqlite3 on a separate volume
RUN mkdir -p /data
VOLUME /data

# Start the server
EXPOSE 3000
ENV DATABASE_URL="file:/data/prod.db"
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Run migrations then start the app
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
