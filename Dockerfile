FROM node:22-bookworm-slim AS build

WORKDIR /app
RUN chown node:node /app
USER node

COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --legacy-peer-deps --no-audit --no-fund

COPY --chown=node:node index.html tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts .env.production ./
COPY --chown=node:node scripts ./scripts
COPY --chown=node:node src ./src

RUN cp .env.production .env && npm run build

FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

COPY --chown=101:101 --from=build /app/dist /usr/share/nginx/html
COPY --chown=101:101 docker/env.js.template /usr/share/nginx/html/env.js.template
COPY --chown=101:101 configuracoes/default.conf /etc/nginx/conf.d/default.conf
COPY --chown=101:101 startup.sh /startup.sh

USER root
RUN chmod 755 /startup.sh

USER 101:101

EXPOSE 8080

ENTRYPOINT ["/startup.sh"]
