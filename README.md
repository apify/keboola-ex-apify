# Apify Keboola Extractor

Apify extractor for Keboola Connection

## Test

### Sample configuration

Before run, you need to have one of configuration in `path_to_data_folder` folder.

#### To run a crawler

```
{
  "parameters": {
    "userId": "Apify user ID",
    "#token": "Apify API token"
    "crawlerId": "H8Xo8nhNDHJkmEfJG",
    "crawlerSettings": {}
  }
}
```

#### To get results from existing execution

```
{
  "parameters": {
    "executionId": "Execution Id"
  }
}
```

#### To list crawlers:
```
{
  "action": "listCrawlers",
  "parameters": {
    "userId": "Apify user ID",
    "#token": "Apify API token"
  }
}
```

### Run in Docker

`docker build --tag=test-ex .`

`docker run --volume=path_to_data_folder:/data/ test-ex`

### Run without docker

`npm run dev`

### Run docker image on top of Keboola platform
Follow instruction on https://developers.keboola.com/extend/component/deployment/#test-live-configurations.

### Run tests in node js app

`DATA_DIR=path_to_data_folder APIFY_TEST_USER_ID=testUserIs APIFY_TEST_TOKEN=testUserToken npm run test`

### Run test in build docker container

`docker build --tag=test-ex .`

`docker run -e DATA_DIR=path_to_data_folder -e APIFY_TEST_USER_ID=testUserIs -e APIFY_TEST_TOKEN=testUserToken test-ex npm test`

## Deploy

Deploy process was build regarding keboola developer portals recommendations.
https://developers.keboola.com/extend/component/deployment/https://developers.keboola.com/extend/component/deployment/tag

1. Commit last version to github and create tag.

2. Tags with proper version like `x.y.z` goes to public version on production extractor! Other tags like `x.y.z-beta` goes to private version and you can test it on top of Keboola platform.

