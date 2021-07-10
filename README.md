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

### Firebase functions execution permission for AllUsers

- ref
  - [https://qiita.com/toshiaki_takase/items/ce65cd5582a80917b52f](https://qiita.com/toshiaki_takase/items/ce65cd5582a80917b52f)

### Service account's permittion for `getSignedUrl()`

[Bucket#getSignedUrl()](https://googleapis.dev/nodejs/storage/latest/Bucket.html#getSignedUrl)

```shell
Error: IAM Service Account Credentials API has not been used in project *** before or it is disabled.
Enable it by visiting https://console.developers.google.com/apis/api/iamcredentials.googleapis.com/overview?project=*** then retry.
If you enabled this API recently, wait a few minutes for the action to propagate to our systems and retry.

name: 'SigningError'
```

=> enable API

```shell
Error: The caller does not have permission

name: 'SigningError'
```

=> Cloud Console > [IAM & admin](https://console.cloud.google.com/iam-admin/iam) > IAM, Find the App Engine default service account and add the Service Account Token Creator role (`サービス アカウント トークン作成者`)

- ref
  - [Firebase サービス アカウントの概要](https://firebase.google.com/support/guides/service-accounts?hl=ja)
    - functions の実行に関連するサービスアカウントは `project-id@appspot.gserviceaccount.com`
  - [Update generate-thumbnail example because file.getSignedURL() does not work in the Cloud Functions environment #782](https://github.com/firebase/functions-samples/issues/782)
