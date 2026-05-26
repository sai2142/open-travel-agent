FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/agent-core/package.json packages/agent-core/
COPY packages/provider-mock/package.json packages/provider-mock/
COPY packages/provider-duffel/package.json packages/provider-duffel/
RUN npm ci

FROM deps AS build
COPY tsconfig.base.json tsconfig.json ./
COPY packages/ packages/
COPY src/ src/
RUN npx tsc -b packages/shared-types packages/agent-core packages/provider-mock packages/provider-duffel

FROM node:22-slim AS runtime
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared-types/node_modules ./packages/shared-types/node_modules
COPY --from=deps /app/packages/agent-core/node_modules ./packages/agent-core/node_modules
COPY --from=deps /app/packages/provider-mock/node_modules ./packages/provider-mock/node_modules
COPY --from=deps /app/packages/provider-duffel/node_modules ./packages/provider-duffel/node_modules
COPY --from=build /app/packages/ ./packages/
COPY --from=build /app/src/ ./src/
COPY package.json tsconfig.base.json tsconfig.json ./

ENV NODE_ENV=production
ENTRYPOINT ["npx", "tsx", "src/cli.ts"]
CMD ["--help"]
