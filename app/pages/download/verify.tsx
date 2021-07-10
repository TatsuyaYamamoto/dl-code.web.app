import { default as React, useState, useEffect } from "react";

import { NextPage } from "next";
import { useRouter } from "next/router";

import Grid from "@material-ui/core/Grid";
import Container from "@material-ui/core/Container";

import LinkButton from "../../components/atoms/LinkButton";
import DownloadCodeInputCard from "../../components/organisms/DownloadCodeInputCard";
import DownloadCodeErrorDialog from "../../components/organisms/DownloadCodeErrorDialog";
import AppBar from "../../components/organisms/AppBar/DownloadAppBar";
import Footer from "../../components/organisms/Footer";

import useDownloadCodeVerifier from "../../components/hooks/useDownloadCodeVerifier";

/**
 * QueryParameters:
 *  - Key: c
 *    Description: ダウンロードコードのテキストフィールドに値を入力した状態で表示する
 *
 * @param props
 * @constructor
 */
const VerifyPage: NextPage = () => {
  const router = useRouter();
  const [downloadCode, setDownloadCode] = useState<string>("");
  const [openNotFoundDialog, setOpenNotFoundDialog] = useState(false);
  const [progressing, setProgressing] = useState(false);
  const { verifyDownloadCode } = useDownloadCodeVerifier();

  useEffect(() => {
    const code = router.query.c;
    if (code) {
      setDownloadCode(typeof code === "string" ? code : code[0]);
    }
  }, [router]);

  const onChangeDownloadCodeValue = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setDownloadCode(e.target.value);
  };

  const submit = async () => {
    setProgressing(true);

    verifyDownloadCode(downloadCode)
      .then(() => {
        setProgressing(false);
        return router.push(`/download/list`);
      })
      .catch((_) => {
        setProgressing(false);
        handleNotFoundDialog();
      });
  };

  const handleNotFoundDialog = () => {
    setOpenNotFoundDialog(!openNotFoundDialog);
  };

  return (
    <>
      <>
        <Grid
          container={true}
          direction="column"
          justify="space-between"
          style={{ height: "100vh" }}
        >
          <AppBar />

          <Container>
            <Grid container={true} justify="center">
              <DownloadCodeInputCard
                value={downloadCode}
                onChange={onChangeDownloadCodeValue}
                progressing={progressing}
                onSubmit={submit}
              />
            </Grid>
            <Grid container={true} justify="center">
              <LinkButton href={`/download/list`}>
                過去にコードを入力したコンテンツを見る
              </LinkButton>
            </Grid>
          </Container>

          <Footer />
        </Grid>
      </>
      <DownloadCodeErrorDialog
        message={
          // TODO: handle all errors
          "ダウンロードコードが不正です。入力した文字に間違いがないか確認してください。"
        }
        open={openNotFoundDialog}
        handleClose={handleNotFoundDialog}
      />
    </>
  );
};

export default VerifyPage;
