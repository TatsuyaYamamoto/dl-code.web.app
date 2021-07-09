import { default as React, useEffect } from "react";

import { AppProps } from "next/app";
import Head from "next/head";
import Router from "next/router";

import CssBaseline from "@material-ui/core/CssBaseline";
import { createGlobalStyle, ThemeProvider } from "styled-components";

import NProgress from "nprogress";
import { SnackbarProvider } from "notistack";

import "firebase/auth";
import "firebase/firestore";
import "firebase/storage";
import "firebase/functions";

import useGa from "../components/hooks/useGa";
import { FirebaseContextProvider } from "../components/hooks/useFirebase";
import { DlCodeUserContextProvider } from "../components/hooks/useDlCodeUser";
import { Auth0Provider } from "../components/hooks/useAuth0";

import theme from "../theme";
import configs from "../configs";
import useAuditLogger from "../components/hooks/useAuditLogger";
import { LogType } from "../domains/AuditLog";

NProgress.configure({ showSpinner: true });

const GlobalStyle = createGlobalStyle`
@font-face{
  font-family: PixelMplus10 Regular;
  // TODO: Use file-loader
  src: url('https://cdn.leafscape.be/PixelMplus/PixelMplus10-Regular_web.woff2') format("woff2");
}
body {
}
`;

const MyApp: React.FC<AppProps> = (props) => {
  const { Component, pageProps, router } = props;
  const ga = useGa();
  const auditLogger = useAuditLogger();

  const requestErrorDetailContact = (errorDetail: any) => {
    const { userAgent, language } = navigator;
    const { location } = window;

    const info = {
      error: errorDetail,
      userAgent,
      language,
      location,
    };

    ga.logError(JSON.stringify(info), true);
    auditLogger.errorAudit({
      type: LogType.EXCEPTION,
      params: info,
      error: new Error(),
      fatal: true,
    });

    if (
      window.confirm(
        "予期せぬエラーが発生してしまいました。\n\n恐れ入りますが、問い合わせフォームを起動してエラーの詳細を送信して頂けませんでしょうか？(エラーの情報は自動で入力されます。)"
      )
    ) {
      const detail = `${btoa(
        unescape(encodeURIComponent(JSON.stringify(info)))
      )}`;
      const contactFormUrl = `https://docs.google.com/forms/d/e/1FAIpQLSe5bSPvJ5XQM0IACqZ9NKoHuRUAcC_V1an16JGwHh6HeGd-oQ/viewform?usp=pp_url&entry.1991364045=%E4%B8%8D%E5%85%B7%E5%90%88%E5%A0%B1%E5%91%8A...+/+Bug+Report&entry.326070868=DLCode&entry.1884055698=${detail}`;
      window.location.href = contactFormUrl;
    } else {
      // tslint:disable-next-line:no-console
      console.error(info);
    }
  };

  useEffect(() => {
    // GA
    ga.init();
    ga.logPageView();
    router.events.on("routeChangeComplete", ga.logPageView);

    // Fatal error handling
    window.onerror = (message, file, lineNo, colNo, error) => {
      const errorDetail = { message, file, lineNo, colNo, error };
      requestErrorDetailContact(errorDetail);
    };

    window.addEventListener("unhandledrejection", (e) => {
      requestErrorDetailContact(e.reason);
    });

    // next router
    Router.events.on("routeChangeStart", NProgress.start);
    Router.events.on("routeChangeComplete", NProgress.done);
    Router.events.on("routeChangeError", NProgress.done);
    // TODO
    // eslint-disable-next-line
  }, []);

  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        {process.env.noIndex && <meta name="robots" content="noindex,follow" />}

        <title>{process.env.title}</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />

        <meta name="" content={process.env.keyword} />
        <meta name="description" content={process.env.description} />
        <meta name="author" content="https://github.com/TatsuyaYamamoto" />

        <meta property="og:site_name" content={process.env.title} />
        <meta property="og:description" content={process.env.description} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={process.env.title} />
        <meta
          property="og:image"
          content="https://dl-code.web.app/assets/og.jpg"
        />
        <meta property="og:locale" content="ja_JP" />
        <meta property="og:url" content="https://dl-code.web.app" />

        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css?family=Roboto:300,400,500&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
        />

        {/* TODO remove cdn*/}
        <link
          rel="stylesheet"
          href="https://unpkg.com/nprogress@0.2.0/nprogress.css"
        />
      </Head>
      <GlobalStyle />
      <CssBaseline />
      <ThemeProvider theme={theme}>
        <Auth0Provider
          auth0ClientOptions={{
            domain: configs.auth0.domain,
            client_id: configs.auth0.clientId,
          }}
        >
          <FirebaseContextProvider
            initParams={{ options: configs.firebaseConfigs }}
          >
            <DlCodeUserContextProvider>
              <SnackbarProvider maxSnack={3}>
                <Component {...pageProps} />
              </SnackbarProvider>
            </DlCodeUserContextProvider>
          </FirebaseContextProvider>
        </Auth0Provider>
      </ThemeProvider>
    </>
  );
};

export default MyApp;
