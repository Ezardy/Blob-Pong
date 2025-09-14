FROM alpine:3.22.1

ARG PONG_PORT=3000

RUN apk upgrade --no-cache
RUN apk add --no-cache npm sed

RUN adduser -DH www

RUN install -d -o www -g www -m 2770 /var/log/blob/npm/_logs && npm config set cache /var/log/blob/npm/ --global

COPY --chown=www . /opt/blob-pong

WORKDIR /opt/blob-pong

RUN npm install && rm package-lock.json
RUN sed -i "s/port: 3000/port: ${PONG_PORT}/" server.js && apk del sed
RUN npm run build && rm -rf public/ src/ index.html tsconfig.json vite.config.ts && npm prune --omit=dev

USER www

ENTRYPOINT [ "npm", "run", "start" ]