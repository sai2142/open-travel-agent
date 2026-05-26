FROM node:22-slim
WORKDIR /app
COPY package*.json ./
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/agent-core/package.json packages/agent-core/
COPY packages/provider-mock/package.json packages/provider-mock/
COPY packages/provider-duffel/package.json packages/provider-duffel/
RUN npm ci
COPY tsconfig.base.json tsconfig.json ./
COPY packages/ packages/
COPY src/ src/
ENTRYPOINT ["npx", "tsx", "src/cli.ts"]
