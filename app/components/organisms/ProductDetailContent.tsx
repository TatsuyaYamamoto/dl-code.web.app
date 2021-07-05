import { default as React, useState, useEffect, FC } from "react";

import { Grid } from "@material-ui/core";

import ImpressionForm from "../../components/organisms/ImpressionForm";
import ProductDetail from "../../components/organisms/ProductDetail";
import ProductFileDownloaderTable from "../../components/organisms/ProductFileDownloaderTable";

import { IProduct, getIconUrl } from "../../domains/Product";

interface DetailPageProps {
  product: IProduct;
  downloadCodeExpiredAt: Date;
}

const ProductDetailContent: FC<DetailPageProps> = ({
  product,
  downloadCodeExpiredAt,
}) => {
  const [iconUrl, setIconUrl] = useState("");

  useEffect(() => {
    if (product.iconStorageUrl) {
      getIconUrl(product.iconStorageUrl).then((url) => {
        setIconUrl(url);
      });
    }
  }, [product]);

  return (
    <Grid container={true} direction={"column"} spacing={5}>
      <Grid item={true}>
        <ProductDetail
          name={product.name}
          description={product.description}
          iconUrl={iconUrl}
          downloadCodeExpiredAt={downloadCodeExpiredAt}
        />
      </Grid>

      <Grid item={true}>
        <ProductFileDownloaderTable
          files={product.productFiles}
          productId={product.id}
        />
      </Grid>

      <Grid item={true}>
        <ImpressionForm productId={product.id} />
      </Grid>
    </Grid>
  );
};

export default ProductDetailContent;
