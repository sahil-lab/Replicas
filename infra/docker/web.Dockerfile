FROM node:22-bookworm-slim AS source
WORKDIR /workspace
ENV NODE_OPTIONS="--max-old-space-size=384" \
    GOMAXPROCS=2 \
    RAYON_NUM_THREADS=2
COPY package.json package-lock.json .npmrc ./
COPY apps/web/package.json ./apps/web/package.json
RUN npm ci
COPY . .

FROM source AS check
CMD ["sh", "-c", "npm run format:check && npm run lint && npx tsc --noEmit && npm run test:web && npm run build:web"]

FROM source AS build
RUN npm run build:web

FROM nginxinc/nginx-unprivileged:stable-alpine AS runtime
COPY infra/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/apps/web/dist /usr/share/nginx/html
EXPOSE 8080
