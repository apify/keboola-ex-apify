# Apify Keboola Extractor

You can use it to connect data from [Apify platform](https://apify.com/) into [Keboola platform](https://www.keboola.com/).

## Resources

* [Apify/Keboola integration tutorial](https://help.apify.com/en/articles/2003234-keboola-integration)
* [Apify component on Keboola](https://components.keboola.com/components/apify.apify) page on Keboola developer platform
* [Keboola documentation for developers](https://developers.keboola.com/overview/)
* [Keboole API reference](https://kebooladocker.docs.apiary.io/#reference/actions/run-custom-component-action/process-action)

----------

## Local Development

If you are interested in adding a new feature or fixing a bug in the integration, feel free to open a pull request.

Before you start developing this integration, you will need your Apify API token and user ID.
You can find the token and user ID [on the Integrations page of your Apify account](https://console.apify.com/account#/integrations).

### Run Configuration

The run of integration depends on configuration. You can specify which action you want to run and its parameters in the configuration file `config.json`.
On the Keboola platform, this config will be generated for each run based on user input.
Base configuration:
```json
{
  "action": "run",
  "parameters": {
    "actionType": "runActor",
    "userId": "myUserId",
    "#token": "myToken",
    "actorId": "my-user-name/actor",
    "input": {
      "pages": 1
    },
    "memory": "512",
    "build": "latest"
  }
}
```
With this configuration, you will run the actor with specific options.
[This folder](./test/configs) contains all possible examples of configuration.


### Run Action locally

1. Install dependencies `npm i`
2. Create empty data dir for input and output of action `mkdir -p ./.temp/data`
3. In data dir create `config.json` file and fill with an action you want to run `cp ./test/configs/actor_run.json ./.temp/data/config.json`
4. Run the action using `npm run dev`

## Tests

There are integrations tests, which check each action if it works with the Apify platform as expected.
You can run these tests with your Apify token and user ID. You can find the token and user ID [on the Integrations page of your Apify account](https://console.apify.com/account#/integrations).

1. Install dependencies `npm i`
2. Run integration tests
   `DATA_DIR=./data APIFY_TEST_TOKEN=<apify toke> npm run test`

## Release & Deploy

Only Apify team members can deploy new versions, and there is a [document in Notion on how to do it](https://www.notion.so/apify/Keboola-integration-77a4b5e28e1541f3919980a16053b1b2).

