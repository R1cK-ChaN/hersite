FROM node:22-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

# Install system deps for sharp (image processing) and git
RUN apk add --no-cache git python3 make g++

WORKDIR /app

# Copy all source code
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile --ignore-scripts

# Build everything (shared -> editor -> server via Turborepo)
RUN pnpm build

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "apps/server/dist/index.js"]
