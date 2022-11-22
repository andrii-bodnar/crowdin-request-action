# Crowdin Request Action usage examples

- [Simple API calls](#simple-api-calls)
  - [List languages](#list-languages)
  - [Get specific language](#get-specific-language)
  - [Using query parameters](#using-query-parameters)
  - [List project files](#list-project-files)
  - [Get project progress](#get-project-progress)
  - [Add string to a project file](#add-string-to-a-project-file)
  - [Add storage](#add-storage)
- [More complex use cases](#more-complex-use-cases)
  - [Add a file to a Crowdin project](#add-a-file-to-a-crowdin-project)
  - [Build project translations](#build-project-translations)

## Simple API calls

### List languages

```yaml
- uses: andrii-bodnar/crowdin-request-action@0.0.1
  name: Make Crowdin Request
  with:
    route: GET /languages
  env:
    CROWDIN_PERSONAL_TOKEN: ${{ secrets.CROWDIN_PERSONAL_TOKEN }}
    CROWDIN_ORGANIZATION: ${{ secrets.CROWDIN_ORGANIZATION }} # Optional
```

### Get specific language

```yaml
- uses: andrii-bodnar/crowdin-request-action@0.0.1
  name: Get language
  with:
    route: GET /languages/{languageId}
    languageId: uk
  env:
    CROWDIN_PERSONAL_TOKEN: ${{ secrets.CROWDIN_PERSONAL_TOKEN }}
    CROWDIN_ORGANIZATION: ${{ secrets.CROWDIN_ORGANIZATION }} # Optional
```

### Using query parameters

```yaml
- uses: andrii-bodnar/crowdin-request-action@0.0.1
  name: List languages with limit
  with:
    route: GET /languages
    query: |
      {
        "limit": 10,
        "offset": 0
      }
  env:
    CROWDIN_PERSONAL_TOKEN: ${{ secrets.CROWDIN_PERSONAL_TOKEN }}
    CROWDIN_ORGANIZATION: ${{ secrets.CROWDIN_ORGANIZATION }} # Optional
```

### List project files

```yaml
- uses: andrii-bodnar/crowdin-request-action@0.0.1
  name: List Files with filter
  with:
    route: GET /projects/{projectId}/files
    projectId: 2
    query: |
      {
        "filter": "crowdin_sample"
      }
  env:
    CROWDIN_PERSONAL_TOKEN: ${{ secrets.CROWDIN_PERSONAL_TOKEN }}
    CROWDIN_ORGANIZATION: ${{ secrets.CROWDIN_ORGANIZATION }} # Optional
```

### Get project progress

```yaml
- uses: andrii-bodnar/crowdin-request-action@0.0.1
  name: Get Project Progress
  id: project_progress
  with:
    route: GET /projects/{projectId}/languages/progress
    projectId: 2
  env:
    CROWDIN_PERSONAL_TOKEN: ${{ secrets.CROWDIN_PERSONAL_TOKEN }}
    CROWDIN_ORGANIZATION: ${{ secrets.CROWDIN_ORGANIZATION }} # Optional

- name: Access the translation progress (first language in the list)
  run: |
    echo ${{ fromJson(steps.project_progress.outputs.data).data[0].data.translationProgress }}
```

### Add string to a project file

```yaml
- uses: andrii-bodnar/crowdin-request-action@0.0.1
  name: Add String
  with:
    route: POST /projects/{projectId}/strings
    projectId: 2
    body: |
      {
        "fileId": 4,
        "text": "New string - ${{ github.sha }}",
        "identifier": "${{ github.sha }}",
        "context": "super context"
      }
  env:
    CROWDIN_PERSONAL_TOKEN: ${{ secrets.CROWDIN_PERSONAL_TOKEN }}
    CROWDIN_ORGANIZATION: ${{ secrets.CROWDIN_ORGANIZATION }} # Optional
```

### Add storage

This example demonstrated the showcase of using headers.

There are two options to pass the body in this case:

- specifying the file path as a `body` value
- passing the file content as a `body` value

```yaml
- uses: andrii-bodnar/crowdin-request-action@0.0.1
  name: Add Storage
  with:
    route: POST /storages
    headers: |
      Crowdin-API-FileName: test-file.json
    body: __tests__/files/test-file.json
  env:
    CROWDIN_PERSONAL_TOKEN: ${{ secrets.CROWDIN_PERSONAL_TOKEN }}
    CROWDIN_ORGANIZATION: ${{ secrets.CROWDIN_ORGANIZATION }} # Optional
```

## More complex use cases

### Add a file to a Crowdin project

```yaml
- uses: andrii-bodnar/crowdin-request-action@0.0.1
  name: Add Storage
  id: add_storage
  with:
    route: POST /storages
    headers: |
      Crowdin-API-FileName: test-file.json
    body: __tests__/files/test-file.json
  env:
    CROWDIN_PERSONAL_TOKEN: ${{ secrets.CROWDIN_PERSONAL_TOKEN }}
    CROWDIN_ORGANIZATION: ${{ secrets.CROWDIN_ORGANIZATION }} # Optional

- uses: andrii-bodnar/crowdin-request-action@0.0.1
  name: Add File
  if: ${{ success() }}
  with:
    route: POST /projects/{projectId}/files
    projectId: 2
    body: |
      {
        "storageId": ${{ fromJson(steps.add_storage.outputs.data).data.id }},
        "name": "test-file.json"
      }
  env:
    CROWDIN_PERSONAL_TOKEN: ${{ secrets.CROWDIN_PERSONAL_TOKEN }}
    CROWDIN_ORGANIZATION: ${{ secrets.CROWDIN_ORGANIZATION }} # Optional
```

In this case, we've used the `add_storage` step output to provide the `storageId` for the _Add File_ method.

### Build project translations

```yaml
- uses: andrii-bodnar/crowdin-request-action@0.0.1
  name: Build Project Translation
  id: build_project
  with:
    route: POST /projects/{projectId}/translations/builds
    projectId: 2
  env:
    CROWDIN_PERSONAL_TOKEN: ${{ secrets.CROWDIN_PERSONAL_TOKEN }}
    CROWDIN_ORGANIZATION: ${{ secrets.CROWDIN_ORGANIZATION }}

- uses: andrii-bodnar/crowdin-request-action@0.0.1
  name: Check Project Build Status
  id: check_build_status
  with:
    route: GET /projects/{projectId}/translations/builds/{buildId}
    projectId: 2
    buildId: ${{ fromJson(steps.build_project.outputs.data).data.id }}
    retry_until_finished: true # This parameter will retry the build progress checking until finished
  env:
    CROWDIN_PERSONAL_TOKEN: ${{ secrets.CROWDIN_PERSONAL_TOKEN }}
    CROWDIN_ORGANIZATION: ${{ secrets.CROWDIN_ORGANIZATION }}

- uses: andrii-bodnar/crowdin-request-action@0.0.1
  name: Download Project Translations
  with:
    route: GET /projects/{projectId}/translations/builds/{buildId}/download
    projectId: 2
    buildId: ${{ fromJson(steps.build_project.outputs.data).data.id }}
  env:
    CROWDIN_PERSONAL_TOKEN: ${{ secrets.CROWDIN_PERSONAL_TOKEN }}
    CROWDIN_ORGANIZATION: ${{ secrets.CROWDIN_ORGANIZATION }}
```