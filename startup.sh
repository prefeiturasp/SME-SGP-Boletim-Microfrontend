#!/bin/sh
set -eu

envsubst '${VITE_SGP_API} ${VITE_BOLETIM_VERSAO}' < /usr/share/nginx/html/env.js.template > /tmp/env.js
exec nginx -g 'daemon off;'
