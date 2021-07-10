import { default as React } from "react";

import { NextPage } from "next";

import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";

import AppBar from "../../components/organisms/AppBar/PublishAppBar";
import Footer from "../../components/organisms/Footer";
import PublishUserProfile from "../../components/organisms/PublishUserProfile";
import useAuth from "../../components/hooks/useAuth";

const PublishIndexPage: NextPage = () => {
  useAuth({ requiredAuth: true });

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
