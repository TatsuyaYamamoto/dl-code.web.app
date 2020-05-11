const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
  console.log(`[next.config.js] exec next command as production env`);
} else {
  console.log(
    `[next.config.js] exec next command as ${process.env.NODE_ENV} env`
  );
}

const isNextBuildCommand = process.argv[2] === "build";

if (isNextBuildCommand) {
  console.log("[next.config.js] detect `next build` command");
}

const env = {
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
  distDir: isNextBuildCommand ? "../dist/functions/next" : /*default*/ ".next",
  exportPathMap: async (defaultPathMap)=>{
    const pathMap ={...defaultPathMap};

    delete pathMap[`/d`];
    delete pathMap[`/callback`];

    return pathMap;
  }
};
