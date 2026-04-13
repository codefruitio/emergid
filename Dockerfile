FROM node:20-alpine AS base

# Install dependencies for better-sqlite3 native build
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy standalone build and static assets
COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static
COPY --from=base /app/public ./public
COPY --from=base /app/drizzle ./drizzle
COPY --from=base /app/src/lib/db/migrate.mjs ./src/lib/db/migrate.mjs
COPY --from=base /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3
COPY --from=base /app/node_modules/drizzle-orm ./node_modules/drizzle-orm
COPY --from=base /app/node_modules/bindings ./node_modules/bindings
COPY --from=base /app/node_modules/file-uri-to-path ./node_modules/file-uri-to-path
COPY --from=base /app/node_modules/prebuild-install ./node_modules/prebuild-install

EXPOSE 3000

CMD ["sh", "-c", "node src/lib/db/migrate.mjs && node server.js"]
