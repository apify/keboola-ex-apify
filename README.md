# Apifier Keboola Extractor

Apifier extractor for Keboola Connection

## Test

### Sample configuration

Before run, you need to have one of configuration in `path_to_data_folder` folder.

#### To run a crawler

```
{
  "parameters": {
    "userId": "Apifier user ID",
    "#token": "Apifier API token"
    "crawlerId": "H8Xo8nhNDHJkmEfJG",
    "crawlerSettings": {}
  }
}
```

#### To list crawlers:
```
{
  "action": "listCrawlers",
  "parameters": {
    "userId": "Apifier user ID",
    "#token": "Apifier API token"
  }
}
```

### Run in Docker

`cd keboola-ex-apify-docker`

`docker build --tag=test .`

`docker run --volume=path_to_data_folder test`

### Run without docker

`cd keboola-ex-apify`

`node_modules/.bin/babel-node --presets es2015,stage-0 ./src/index.js --data=path_to_data_folder`

## Deploy

1. Commit last version to github and create tag.

2. Update tag of keboola-ex-apify to latest number in dockerfile of keboola-ex-apify-docker.

3. Push keboola-ex-apify-docker to docker hub:

`docker login`

`cd keboola-ex-apify-docker`

`docker build -t apify/keboola-extractor:latest .`

`docker push apify/keboola-extractor:latest`

