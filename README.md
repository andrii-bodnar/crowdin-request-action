# Crowdin Request Action

> A GitHub Action to send arbitrary requests to Crowdin's REST API

[![Check dist](https://github.com/andrii-bodnar/crowdin-request-action/actions/workflows/check-dist.yml/badge.svg)](https://github.com/andrii-bodnar/crowdin-request-action/actions/workflows/check-dist.yml)
[![build-test](https://github.com/andrii-bodnar/crowdin-request-action/actions/workflows/test.yml/badge.svg)](https://github.com/andrii-bodnar/crowdin-request-action/actions/workflows/test.yml)
[![e2e-test](https://github.com/andrii-bodnar/crowdin-request-action/actions/workflows/e2eTest.yml/badge.svg)](https://github.com/andrii-bodnar/crowdin-request-action/actions/workflows/e2eTest.yml)

## Usage

Set up a workflow in *.github/workflows/crowdin-request.yml* (or add a job to your existing workflows).

Read the [Configuring a workflow](https://help.github.com/en/articles/configuring-a-workflow) article for more details on how to create and set up custom workflows.

```yaml
name: Crowdin Request Action

on:
  # When you push to the `main` branch
  push:
    branches: [ main ]
  # And optionally, once every 12 hours
  schedule:
    - cron: '0 */12 * * *' # https://crontab.guru/#0_*/12_*_*_*
  # To manually run this workflow
  workflow_dispatch:

jobs:
  crowdin-request:

    runs-on: ubuntu-latest
    steps:
    - name: Checkout
      uses: actions/checkout@v3

    - name: Make Crowdin Request
      uses: andrii-bodnar/crowdin-request-action@latest
      with:
        route: GET /languages
      env:
        CROWDIN_PERSONAL_TOKEN: ${{ secrets.CROWDIN_PERSONAL_TOKEN }}
        CROWDIN_ORGANIZATION: ${{ secrets.CROWDIN_ORGANIZATION }} # Only for Crowdin Enterprise
```

## Inputs

| Option  | Required | Description      |
|---------|----------|------------------|
| `route` | `true`   | HTTP Verb + path |

## Outputs

| Option    |                                                               |
|-----------|---------------------------------------------------------------|
| `status`  | Response status code                                          |
| `headers` | Response headers as JSON string with lower cased header names |
| `data`    | Response body as string                                       |

## Contributing

If you would like to contribute please read the [Contributing](/CONTRIBUTING.md) guidelines.

## Author

- [Andrii Bodnar](https://github.com/andrii-bodnar/)

## License

<pre>
The Crowdin Request Action is licensed under the MIT License.
See the LICENSE.md file distributed with this work for additional
information regarding copyright ownership.

Except as contained in the LICENSE file, the name(s) of the above copyright
holders shall not be used in advertising or otherwise to promote the sale,
use or other dealings in this Software without prior written authorization.
</pre>
