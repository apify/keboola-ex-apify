FROM radektomasek/keboola-base-node
MAINTAINER Apifier <info@apifier.com>

WORKDIR /home

RUN git clone https://github.com/Apifier/keboola-ex-apify ./ && npm install

ENTRYPOINT node_modules/.bin/babel-node --presets es2015,stage-0 ./src/index.js --data=/data
