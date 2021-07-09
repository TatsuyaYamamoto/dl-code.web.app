require("ts-node").register({
  project: __dirname + "/tsconfig.json",
  // ファイルスコープに定義した import moduleや変数がトランスパイル時に "redeclare" でerrorが発生する
  transpileOnly: true,
});
const { setHeadlessWhen } = require("@codeceptjs/configure");

const {
  HEADLESS,
  BROWSER_TARGET = "chromium",
  TEST_BASE_URL = "https://dl-code-dev.web.app",
} = process.env;

const browserHelpers = {
  chromium: {
    Playwright: {
      url: TEST_BASE_URL,
      show: true,
      browser: "chromium",
      restart: false,
    },
  },
  ios_13_5: {
    Appium: {
      platform: "iOS",
      url: TEST_BASE_URL,
      desiredCapabilities: {
        deviceName: "iPhone Simulator",
        platformVersion: "13.5",
        browserName: "safari",
      },
    },
  },
};

// turn on headless mode when running with HEADLESS=true environment variable
// export HEADLESS=true && npx codeceptjs run
setHeadlessWhen(HEADLESS);

exports.config = {
  tests: "./tests/*.test.ts",
  output: "./output",
  helpers: {
    ...browserHelpers[BROWSER_TARGET],
    FileSystem: {},
  },
  include: {
    I: "./steps_file.ts",
    topPage: "./pages/topPage.ts",
    verifyPage: "./pages/verifyPage.ts",
    downloadProductListPage: "./pages/downloadProductListPage.ts",
  },
  bootstrap: null,
  mocha: {},
  name: "dl-code_web_app",
  plugins: {
    pauseOnFail: {},
    retryFailedStep: {
      enabled: true,
    },
    tryTo: {
      enabled: true,
    },
    screenshotOnFail: {
      enabled: true,
    },
  },
};
