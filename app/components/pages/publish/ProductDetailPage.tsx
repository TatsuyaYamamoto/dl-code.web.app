import * as React from "react";
import { RouteComponentProps } from "react-router-dom";

import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";

import AppBar from "../../organisms/AppBar";
import Footer from "../../organisms/Footer";
import ProductFileEditTable from "../../organisms/ProductFileEditTable";
import ProductDetailEditForm from "../../organisms/ProductDetailEditForm";
import DownloadCodeSetForm from "../../organisms/DownloadCodeSetForm";

import { Product } from "../../../domains/Product";

const ProductDetailPage: React.FC<
  RouteComponentProps<{ id: string }>
> = props => {
  const productId = props.match.params.id;
  const [product, setProduct] = React.useState<Product>(null);

  React.useEffect(() => {
    // TODO delete this logic!!
    setTimeout(() => {
      Product.getById(productId).then(p => {
        setProduct(p);
      });
    }, 1000);
  }, []);

  const onBack = () => {
    props.history.goBack();
  };

  return (
    <>
      <Grid container={true} direction="column" style={{ minHeight: "100vh" }}>
        <Grid item={true}>
          <AppBar onBack={onBack} />
        </Grid>

        <Grid item={true}>
          {product && (
            <Container style={{ marginTop: 30, marginBottom: 30 }}>
              <ProductDetailEditForm product={product} />
              <ProductFileEditTable product={product} />
              <DownloadCodeSetForm product={product} />
            </Container>
          )}
        </Grid>

        <Grid item={true} style={{ marginTop: "auto" }}>
          <Footer />
        </Grid>
      </Grid>
    </>
  );
};

export default ProductDetailPage;
