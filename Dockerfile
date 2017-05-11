FROM radektomasek/keboola-base-node
MAINTAINER Lubos Turek <lubos.turek@gmail.com>

WORKDIR /home

RUN git clone https://github.com/apifier/keebola-ex-apify ./ && npm install

ENTRYPOINT node_modules/.bin/babel-node --presets es2015,stage-0 ./src/index.js --data=/data
