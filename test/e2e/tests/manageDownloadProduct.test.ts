import config from "../config";

Feature(`ダウンロードプロダクト管理機能`).tag(`manageDownloadProduct`);

Scenario(
  "verifyしたプロダクトがないため空のリストを表示する",
  async ({ I, downloadProductListPage }) => {
    I.say("Given verify済みのプロダクトがない");
    // TODO clear indexedDB explicitly

    I.say(`When リストページを表示する`);
    downloadProductListPage.goto();

    I.say(`Then リストにプロダクトが表示されない`);
    I.see("ダウンロード可能なコンテンツがありません。");
    I.see("ダウンロードコード入力ページへ", "button");
  }
);

Scenario(
  "プロダクトの詳細を表示する",
  async ({ I, verifyPage, downloadProductListPage }) => {
    I.say("Given verify済みのプロダクトがある");
    // TODO defined expected indexeddb state
    verifyPage.goto();
    verifyPage.verify(config.TEST_PRODUCT.downloadCode);

    I.say(`And リストページを表示している`);
    downloadProductListPage.isDisplayed();

    I.say(`When プロダクトをクリックする`);
    I.click(config.TEST_PRODUCT.name);

    I.say(`Then プロダクトの詳細画面を表示している`);
    I.see(config.TEST_PRODUCT.name);
    I.see(config.TEST_PRODUCT.description);
    I.see("有効期限");
    I.see(config.TEST_PRODUCT.expireDate);
    config.TEST_PRODUCT.products.forEach((product, i) => {
      I.see(product.name, `ul li:nth-child(${i + 1})`);
      I.see(product.info, `ul li:nth-child(${i + 1})`);
    });
    I.see("ご感想はこちらへ！");
    I.see("送信", "button[type=button]:disabled");
  }
);

Scenario(
  "プロダクトの音声ファイルを再生する",
  async ({ I, verifyPage, downloadProductListPage }) => {
    I.say("Given verify済みのプロダクト詳細画面を表示している");
    // TODO defined expected indexeddb state
    verifyPage.goto();
    verifyPage.verify(config.TEST_PRODUCT.downloadCode);
    downloadProductListPage.isDisplayed();
    I.click(config.TEST_PRODUCT.name);
    I.see(config.TEST_PRODUCT.description);

    I.say(`When 再生アイコンをクリックする`);
    I.see("0_Step! ZERO to ONE", `ul li:nth-child(${1})`);
    I.click(`ul li:nth-child(${1}) button`);

    I.say(`Then 音声が再生される(autoplayのaudio要素が描画される)`);
    I.seeElement(
      `audio[autoplay][controls][src^="https://storage.googleapis.com"]`
    );

    I.say(`And When 閉じるアイコンをクリックする`);
    I.click(`.MuiSnackbar-root button`);

    I.say(`Then プレイヤーが非表示になる(audio要素が消える)`);
    I.dontSeeElement("audio");
  }
);

Scenario(
  "プロダクトのファイルをダウンロードする",
  async ({ I, verifyPage, downloadProductListPage }) => {
    const targetIndex = 1;
    const testFileName = `download_test_${Date.now()}.zip`;
    const sourceFileName =
      config.TEST_PRODUCT.products[targetIndex].rawFileName;
    const iosMessage = `Do you want to download “${sourceFileName}”?`;

    I.say("Given verify済みのプロダクト詳細画面を表示している");
    // TODO defined expected indexeddb state
    verifyPage.goto();
    verifyPage.verify(config.TEST_PRODUCT.downloadCode);
    downloadProductListPage.isDisplayed();
    I.click(config.TEST_PRODUCT.name);
    I.see(config.TEST_PRODUCT.description);

    I.say(`When ダウンロードアイコンをクリックする`);
    I.see("download_target_file", `ul li:nth-child(${targetIndex + 1})`);
    I.click(`ul li:nth-child(${targetIndex + 1}) button`);

    if (!(await I.isOnIOS())) {
      I.say(`Then ファイルがダウンロードされる(output/${testFileName})`);
      I.handleDownloads(testFileName);
      I.see(`${sourceFileName}をダウンロード中...`);
      I.waitForFile(`output/${testFileName}`, 10);
    }

    if (await I.isOnIOS()) {
      I.see(`${sourceFileName}をダウンロード中...`);
      // @ts-ignore
      I.switchToNative();
      // XPathはAppium desktopで確認した
      I.seeElement(`//XCUIElementTypeStaticText[@name="${iosMessage}"]`);
      I.click(`(//XCUIElementTypeButton[@name="Download"])[1]`);
      I.dontSeeElement(`//XCUIElementTypeStaticText[@name="${iosMessage}"]`);
    }
  }
);

Scenario(
  "感想を送信する",
  async ({ I, verifyPage, downloadProductListPage }) => {
    I.say("Given verify済みのプロダクト詳細画面を表示している");
    // TODO defined expected indexeddb state
    verifyPage.goto();
    verifyPage.verify(config.TEST_PRODUCT.downloadCode);
    downloadProductListPage.isDisplayed();
    I.click(config.TEST_PRODUCT.name);
    I.see(config.TEST_PRODUCT.description);

    I.say(`When 文字を入力してクリックする`);
    I.see("ご感想はこちらへ！");
    I.fillField("textarea", `テスト感想 ${new Date()}`);

    if (await I.isOnIOS()) {
      I.say(`iOS Simulatorのためのworkaround。
fillFieldで文字列を入力しても、iOS Simulator上のReactでonChange eventが発生しない(多分)ため、textareaを選択 => 適当な文字列を入力のステップを追加することで
手動でonChange eventを発生させてから後続の処理につなげる。`);
      I.click("//textarea[1]");
      "_ios_dummy".split("").map((t) => I.pressKey(t));
    }
    I.click("送信");
    I.say(`Then 感謝ダイアログが表示される`);
    I.see("ありがとうございました（・８・）");
  }
);
