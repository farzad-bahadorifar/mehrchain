FROM node:22-bookworm-slim AS base
RUN apt-get update \
    && apt-get install --no-install-recommends -y ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS build
COPY package.json package-lock.json ./
RUN npm ci --include=dev --legacy-peer-deps
COPY . .
ARG NF_GIT_SHA
ENV NX_DAEMON=false
RUN NF_GIT_SHA="$NF_GIT_SHA" npm run build:backend:release

FROM base AS runtime
ENV NODE_ENV=production PORT=3000
COPY --from=build /app/dist/mehrchain-backend/package*.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/dist/mehrchain-backend/ ./
USER node
EXPOSE 3000
CMD ["node", "main.js"]
