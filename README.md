# Apifier Keboola Extractor

Apifier extractor for Keboola Connection

### Sample configuration

To run a crawler:

    {
      "userId": "Apifier user ID",
      "#token": "Apifier API token",
      "crawlerId": "Internal or custom ID of the crawler to execute",
      "crawlerSettings": { "Optional object with overridden crawler settings" }
    }

To list crawlers:

    {
      "action": "listCrawlers",
      "parameters": {
        "userId": "Apifier user ID",
        "#token": "Apifier API token"
      }
    }
