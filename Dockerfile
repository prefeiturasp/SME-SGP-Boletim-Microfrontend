FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps --no-audit --no-fund

COPY index.html tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts .env.production ./
COPY scripts ./scripts
COPY src ./src

RUN cp .env.production .env && npm run build

FROM nginx:1.27-alpine AS runtime

ENV NGINX_ENVSUBST_OUTPUT_DIR=/usr/share/nginx/html

COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/env.js.template /etc/nginx/templates/env.js.template

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
