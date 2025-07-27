FROM node:current-slim AS build
WORKDIR /usr/src/app

RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/*
RUN npm i -g pnpm

COPY . .

RUN pnpm install
RUN pnpm build

FROM node:current-slim AS run
WORKDIR /usr/src/app

RUN apt-get update && apt-get upgrade -y && apt-get install -y -q --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/package.json ./

ENV NODE_ENV production
ARG BUILD_ID
ENV BUILD_ID ${BUILD_ID}

CMD ["node", "dist/relay.js"]
