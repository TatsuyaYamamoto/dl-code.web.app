# DLCode.web.app

[![CircleCI](https://circleci.com/gh/TatsuyaYamamoto/dl-code.web.app/tree/develop.svg?style=svg)](https://circleci.com/gh/TatsuyaYamamoto/dl-code.web.app/tree/develop)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

hosted in [https://dl-code.web.app/]()

## なにこれ

1. つくるひと
   1. 曲とか絵とかのファイルを作って
   1. `ProductFile`としてアプリに登録して
   1. `DownloadCode`を発行して
   1. `DownloadCode`を何かしらの手段で **たのしむひと** にお渡しして
   1. _たのしむひと_ に`ProductFile`をダウンロードしてもらう
1. たのしむひと
   1. 何かしらの手段で **つくるひと** から`DownloadCode`を手に入れて
   1. [https://dl-code.web.app/]() にアクセスして
   1. DownloadCode を入力して
   1. `ProductFile`をダウンロードして
   1. 楽しい！！

## Dev and Deploy

```bash
// start next.js dev server
$ yarn dev

// start firebase emulator
$ yarn start

// some commits...

$ yarn build-dev
$ yarn deploy-dev
// or
$ git push origin develop # deploy by CircleCI

```

## start with emulator

```shell script
$ gsutil rm -r gs://dl-code-dev.appspot.com/firestore_export
$ gcloud firestore export gs://dl-code-dev.appspot.com/firestore_export

$ firebase emulators:export ./emulator_data

$ gsutil cp -r gs://dl-code-dev.appspot.com/firestore_export ./emulator_data

$ find emulator_data -maxdepth 2
emulator_data
emulator_data/firebase-export-metadata.json
emulator_data/firestore_export
emulator_data/firestore_export/firestore_export.overall_export_metadata
emulator_data/firestore_export/all_namespaces

# start firebase emulator
$ yarn start --import ./emulator_data
```

- ref.
  - [データをエクスポートする](https://firebase.google.com/docs/firestore/manage-data/export-import?hl=ja#export_data)

## Settings

### Operation Logging

- GCP Console > Operation Logging > Log Viewer > シンクを作成

  - シンク名: cloud-functions-error-log
  - シンクサービス: Pub/Sub
  - シンクのエクスポート先: firebase functions 上の`cloud-functions-error-log`
  - フィルタ

    ```
    resource.type="cloud_function"
    severity>=WARNING
    ```

### firebase functions config

```shell script
// dev
$ KEY=slack            ; firebase functions:config:set $KEY="$(cat .runtimeconfig.json | jq ".$KEY")" --project dl-code-dev
```

```shell script
// pro
$ KEY=slack            ; firebase functions:config:set $KEY="$(cat .runtimeconfig.pro.json | jq ".$KEY")" --project dl-code

```

### Auth0

- Allowed Callback URLs

  ```text
  http://localhost:3000,http://localhost:3000/callback
  ```

  - http://localhost:3000 => getTokenSilently 時の redirect_uri の default value
  - http://localhost:3000/callback => app 側が auth0 に渡す redirect_uri

- Allowed Web Origins

  ```text
  http://localhost:3000
  ```

- Allowed Logout URLs
  ```text
  http://localhost:3000
  ```

### attach roles to Service Account for firestore exporting

```shell script
$ PROJECT_ID=dl-code-dev
$ SERVICE_ACCOUNT=${PROJECT_ID}@appspot.gserviceaccount.com
$ BUCKET_NAME=${PROJECT_ID}.appspot.com

$ gcloud projects add-iam-policy-binding ${PROJECT_ID} \
      --member serviceAccount:${SERVICE_ACCOUNT} \
      --role roles/datastore.importExportAdmin

$ gsutil iam ch serviceAccount:${SERVICE_ACCOUNT}:admin gs://${BUCKET_NAME}
```

Ref. [https://firebase.google.com/docs/firestore/solutions/schedule-export#configure_access_permissions](https://firebase.google.com/docs/firestore/solutions/schedule-export#configure_access_permissions)

### storage cors

```shell script
$ gsutil cors set firebase/cors.json gs://dl-code-dev.appspot.com
```

Ref: [https://firebase.google.com/docs/storage/web/download-files#cors_configuration](https://firebase.google.com/docs/storage/web/download-files#cors_configuration)

### GOOGLE_APPLICATION_CREDENTIALS

```shell script
$ export GOOGLE_APPLICATION_CREDENTIALS="../../config/service_account/dl-code-dev-firebase-adminsdk-h1f43-b771e573b7.json"
```
