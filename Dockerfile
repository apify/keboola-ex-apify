FROM node:18

MAINTAINER Apify <info@apify.com>

WORKDIR /usr/src/app

COPY . .

RUN npm install

CMD [ "npm", "start", "--silent" ]
