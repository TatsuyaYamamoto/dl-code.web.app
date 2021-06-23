const execSync = require("child_process").execSync;

const packageJson = require("../package.json");
const gitRev = execSync("git rev-parse --short HEAD", { encoding: "utf-8" });

const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
  console.log(`[next.config.js] exec next command as production env`);
} else {
  console.log(
    `[next.config.js] exec next command as ${process.env.NODE_ENV} env`
  );
}

const env = {
  version: `v${packageJson.version}.${gitRev}`,
  nodeEnv: process.env.NODE_ENV,
  noIndex: true,
  gaTrackingId: "UA-127664761-5",
  title: "DEVELOPMENT DLCode",
  keyword: "DLCode,ダウンロードコード",
  description:
    "DLCodeはファイルの配布、ダウンロード用のコードの発行が行えるアプリです。ダウンロードコードをお持ちの方のみ、ファイルをダウンロードすることが出来ます。"
};

if (isProduction) {
  Object.assign(env, {
    noIndex: false,
    title: "DLCode"
  });
}

module.exports = {
  env,
  exportPathMap: async defaultPathMap => {
    const pathMap = { ...defaultPathMap };
    return pathMap;
  }
};
