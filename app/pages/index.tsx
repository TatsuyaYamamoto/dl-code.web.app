import React from "react";

import { Container, Grid, Typography } from "@material-ui/core";
import Icon, { IconProps } from "@material-ui/core/Icon";

import styled from "styled-components";

import LinkButton from "../components/atoms/LinkButton";
import Logo from "../components/atoms/Logo";
import Footer from "../components/organisms/Footer";

const Root = styled.div``;

const LeftIcon = styled(Icon as React.FC<IconProps>)`
  margin-right: ${({ theme }) => theme.spacing(1)}px;
`;

const Space = styled.div`
  height: 100px;
`;

const Hero = () => {
  return (
    <>
      <Grid item={true}>
        <Typography variant="h1">
          <Logo />
        </Typography>
        <Typography variant="subtitle2">{process.env.version}</Typography>
      </Grid>
      <Grid
        item={true}
        style={{
          marginTop: 20,
        }}
      >
        <LinkButton href="/download/verify">
          <LeftIcon>cloud_download</LeftIcon>
          <span>ダウンロードページへ</span>
        </LinkButton>
        <LinkButton href="/publish">
          <LeftIcon>publish</LeftIcon>
          <span>配信管理ページへ</span>
        </LinkButton>
      </Grid>
    </>
  );
};

const AboutAppSection = () => {
  const logo = <Logo />;
  const book = <Icon>book</Icon>;
  const disk = <Icon>album</Icon>;

  return (
    <>
      <Grid item={true}>
        <Typography variant="h5">なにができるの？</Typography>
        <Typography variant="body1">
          <span>
            {logo}は、ダウンロードコードを使った作品配信が行えるアプリです。
            {book}本や、{disk}
            CDに収録しきれないコンテンツはダウンロード配信しましょう。
          </span>
        </Typography>
      </Grid>
      <Space />
    </>
  );
};

const RootIndexPage = () => {
  return (
    <Root>
      <Grid
        container={true}
        direction={"column"}
        style={{ minHeight: "100vh" }}
      >
        <Container>
          <Hero />

          <Space />

          <AboutAppSection />
        </Container>

        <Grid item={true} style={{ marginTop: "auto" }}>
          <Footer />
        </Grid>
      </Grid>
    </Root>
  );
};

export default RootIndexPage;
