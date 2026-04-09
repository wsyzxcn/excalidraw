FROM --platform=${BUILDPLATFORM} node:18 AS build

WORKDIR /opt/node_app

COPY . .

RUN --mount=type=cache,target=/root/.cache/yarn \
    npm_config_target_arch=${TARGETARCH} yarn --network-timeout 600000

RUN npm_config_target_arch=${TARGETARCH} yarn build:remote-projects-api

FROM --platform=${TARGETPLATFORM} node:18-alpine

WORKDIR /opt/node_app

COPY --from=build /opt/node_app/node_modules ./node_modules
COPY --from=build /opt/node_app/services/remote-projects-api/package.json ./services/remote-projects-api/package.json
COPY --from=build /opt/node_app/services/remote-projects-api/dist ./services/remote-projects-api/dist

ENV PORT=4000
ENV EXCALIDRAW_PROJECTS_ROOT=/data/projects

WORKDIR /opt/node_app/services/remote-projects-api

EXPOSE 4000

CMD ["node", "dist/main.js"]
