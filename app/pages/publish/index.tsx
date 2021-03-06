import { default as React, useEffect } from "react";

import { NextPage } from "next";

import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";

import AppBar from "../../components/organisms/AppBar/PublishAppBar";
import Footer from "../../components/organisms/Footer";
import PublishUserProfile from "../../components/organisms/PublishUserProfile";
import useAuth0 from "../../components/hooks/useAuth0";

const PublishIndexPage: NextPage = () => {
  const {
    idToken,
    initialized: isAuth0Initialized,
    loginWithRedirect
  } = useAuth0();

  useEffect(() => {
    if (!isAuth0Initialized) {
      return;
    }

    if (!idToken) {
      loginWithRedirect();
    }
  }, [idToken, isAuth0Initialized, loginWithRedirect]);

  return (
    <>
      <Grid container={true} direction="column" style={{ minHeight: "100vh" }}>
        <Grid item={true}>
          <AppBar />
        </Grid>

        <Grid item={true}>
          <Container style={{ marginTop: 30, marginBottom: 30 }}>
            <Grid container={true}>
              <PublishUserProfile />
            </Grid>
          </Container>
        </Grid>

        <Grid item={true} style={{ marginTop: "auto" }}>
          <Footer />
        </Grid>
      </Grid>
    </>
  );
};

export default PublishIndexPage;
