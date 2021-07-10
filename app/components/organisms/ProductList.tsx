import { default as React, useEffect, useState, FC } from "react";

import { useRouter } from "next/router";

import styled from "styled-components";

import useFirebase from "../hooks/useFirebase";
import useAuth from "../hooks/useAuth";
import ProductListItem, {
  ProductListAddItem,
} from "../organisms/ProductListItem";

import { Product } from "../../domains/Product";

const Root = styled.div``;

const Item = styled(ProductListItem)`
  margin-bottom: 20px;
`;

const AddItem = styled(ProductListAddItem)`
  margin-bottom: 20px;
`;

interface ProductListProps {
  onAdd: () => void;
}
const ProductList: FC<ProductListProps> = (props) => {
  const { onAdd } = props;

  const [products, setProducts] = React.useState<Product[]>([]);
  const router = useRouter();
  const { app: firebaseApp } = useFirebase();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      return;
    }

    const unsubscribe = Product.watchList(
      user.uid,
      firebaseApp.firestore(),
      (owns) => {
        setProducts(owns);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [firebaseApp, user]);

  const onSelected = (id: string) => () => {
    router.push({
      pathname: `/publish/product/edit`,
      query: {
        id,
      },
    });
  };

  const [thumbnailImageUrls, setThumbnailImageUrls] = useState<{
    [id: string]: string;
  }>({});

  useEffect(() => {
    (async () => {
      const map: { [id: string]: string } = {};

      await Promise.all(
        products.map(async (product) => {
          map[product.id] = (await product.getIconUrl()) || "none";
        })
      );

      setThumbnailImageUrls(map);
    })();
  }, [products]);

  return (
    <Root>
      <AddItem onClick={onAdd} />

      {products.map((p) => {
        return (
          <Item
            key={p.id}
            onClick={onSelected(p.id)}
            id={p.id}
            name={p.name}
            thumbnailImageUrl={thumbnailImageUrls[p.id]}
            createdAt={p.createdAt}
            productFileCount={p.productFileCount}
          />
        );
      })}
    </Root>
  );
};

export default ProductList;
