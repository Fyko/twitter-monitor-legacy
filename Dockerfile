FROM node:12-alpine

LABEL name "Twitter Monitor Legacy"

WORKDIR /usr/twitter-monitor-legacy

COPY package.json pnpm-lock.yaml ./

RUN apk add --update \
&& apk add --no-cache ca-certificates \
&& apk add --no-cache --virtual .build-deps git curl build-base python g++ make \
&& curl -L https://unpkg.com/@pnpm/self-installer | node \
&& pnpm i \
&& apk del .build-deps

COPY . .

ENV OWNERS= \
	COLOR= \
	TOKEN= \
	MONGO= \
	CONSUMER_KEY= \
	CONSUMER_SECRET= \
	ACCESS_TOKEN= \
	ACCESS_TOKEN_SECRET=

RUN pnpm run build
CMD ["node", "."]

