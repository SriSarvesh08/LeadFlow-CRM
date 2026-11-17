FROM node:22-bookworm-slim AS dependencies

WORKDIR /workspace

ARG SERVICE_DIR
ARG SERVICE_PORT

COPY shared/package.json shared/package-lock.json ./shared/
COPY ${SERVICE_DIR}/package.json ${SERVICE_DIR}/package-lock.json ./${SERVICE_DIR}/

RUN npm ci --omit=dev --prefix ./shared \
  && npm ci --omit=dev --prefix ./${SERVICE_DIR}

COPY shared/ ./shared/
COPY ${SERVICE_DIR}/ ./${SERVICE_DIR}/

FROM node:22-bookworm-slim AS runtime

ARG SERVICE_DIR
ARG SERVICE_PORT

ENV NODE_ENV=production

WORKDIR /workspace

COPY --from=dependencies --chown=node:node /workspace/shared ./shared
COPY --from=dependencies --chown=node:node /workspace/${SERVICE_DIR} ./${SERVICE_DIR}

USER node
WORKDIR /workspace/${SERVICE_DIR}

EXPOSE ${SERVICE_PORT}

CMD ["node", "src/server.js"]
