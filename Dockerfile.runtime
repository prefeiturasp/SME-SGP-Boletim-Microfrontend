FROM nginx:1.27-alpine AS runtime

ENV NGINX_ENVSUBST_OUTPUT_DIR=/usr/share/nginx/html

COPY dist /usr/share/nginx/html
COPY docker/env.js.template /etc/nginx/templates/env.js.template

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
