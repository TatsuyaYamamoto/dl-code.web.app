import { default as React, useState, useMemo, FC, useEffect } from "react";

import { NextPage } from "next";

import { CircularProgress, Container, Grid } from "@material-ui/core";

import useDownloadCodeVerifier from "../../components/hooks/useDownloadCodeVerifier";

import AppBar from "../../components/organisms/AppBar/DownloadAppBar";
import Footer from "../../components/organisms/Footer";
import ActivatedProductList from "../../components/organisms/ActivatedProductList";
import ProductDetailContent from "../../components/organisms/ProductDetailContent";

const ProgressContent: FC = () => (
  <Grid container={true} justify={"center"}>
    <CircularProgress />
  </Grid>
);

const DownloadProductListPage: NextPage = () => {
  const { actives, loadFromDb } = useDownloadCodeVerifier();
  const [processing, setProcessing] = useState(true);
  const [showingProductId, setShowingProductId] = useState<string | null>(null);

  const onBack = useMemo(() => {
    if (!showingProductId) {
      return;
    }

    return () => {
      setShowingProductId(null);
    };
  }, [showingProductId]);

  const onProductSelected = (selectedId: string) => {
    setShowingProductId(selectedId);
  };

  const main = useMemo(() => {
    if (processing) {
      return <ProgressContent />;
    }

    const showingActiveProduct = actives.find(
      ({ product }) => product.id === showingProductId
    );

    if (!showingActiveProduct) {
      return (
        <ActivatedProductList
          products={actives.map((a) => a.product)}
          onPanelClicked={onProductSelected}
        />
      );
    }

    const { product: showingProduct, expiredAt } = showingActiveProduct;

    return (
      <ProductDetailContent
        product={showingProduct}
        downloadCodeExpiredAt={expiredAt}
      />
    );
  }, [actives, processing, showingProductId]);

  useEffect(() => {
    loadFromDb();
    setProcessing(false);
  }, [loadFromDb]);

  return (
    <>
      <Grid container={true} direction="column" style={{ minHeight: "100vh" }}>
        <Grid item={true}>
          <AppBar onBack={onBack} />
        </Grid>

        <Grid item={true}>
          <Container style={{ marginTop: 30, marginBottom: 30 }}>
            {main}
          </Container>
        </Grid>

        <Grid item={true} style={{ marginTop: "auto" }}>
          <Footer />
        </Grid>
      </Grid>
    </>
  );
};

export default DownloadProductListPage;
