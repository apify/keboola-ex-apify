FROM node:18

MAINTAINER Apify <info@apify.com>

WORKDIR /usr/src/app

COPY . .

RUN npm install

ENV NPM_CONFIG_UPDATE_NOTIFIER="false"

CMD [ "npm", "start", "--silent" ]
