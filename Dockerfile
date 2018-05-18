FROM node:carbon

MAINTAINER Apify <info@apify.com>

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --only=production

COPY . .

CMD [ "npm", "start" ]
