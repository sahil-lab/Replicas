FROM mcr.microsoft.com/playwright:v1.65.0-noble
WORKDIR /workspace
ENV NODE_OPTIONS="--max-old-space-size=384"
COPY package.json package-lock.json .npmrc ./
COPY apps/web/package.json ./apps/web/package.json
RUN npm ci
COPY playwright.config.ts .
COPY tests/e2e ./tests/e2e
CMD ["npm", "run", "test:e2e"]
