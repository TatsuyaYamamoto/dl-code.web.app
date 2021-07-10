import { default as React } from "react";

import { NextPage } from "next";
import { useRouter } from "next/router";

import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";

import AppBar from "../../../components/organisms/AppBar/PublishAppBar";
import Footer from "../../../components/organisms/Footer";
import ProductEditForm from "../../../components/organisms/ProductEditForm";
import useAuth from "../../../components/hooks/useAuth";

const ProductEditPage: NextPage = () => {
  useAuth({ requiredAuth: true });
  const router = useRouter();
  const productId = router.query.id as string;

  const onBack = () => {
    router.back();
  };

  return (
    <>
      <Grid container={true} direction="column" style={{ minHeight: "100vh" }}>
        <Grid item={true}>
          <AppBar onBack={onBack} />
        </Grid>

        <Grid item={true}>
          <Container style={{ marginTop: 30, marginBottom: 30 }}>
            <ProductEditForm productId={productId} />
          </Container>
        </Grid>

        <Grid item={true} style={{ marginTop: "auto" }}>
          <Footer />
        </Grid>
      </Grid>
    </>
  );
};

export default ProductEditPage;
