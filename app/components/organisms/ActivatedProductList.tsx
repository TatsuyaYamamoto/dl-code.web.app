import React from "react";

import styled from "styled-components";

import {
  Grid,
  Card,
  CardActionArea,
  CardContent,
  Typography,
} from "@material-ui/core/";
import { CardProps } from "@material-ui/core/Card";

import LinkButton from "../atoms/LinkButton";
import ThumbnailImage from "../atoms/ProductImageThumbnailImage";
import NoImage from "../atoms/ProductImageThumbnailNoImage";

import { IProduct } from "../../domains/Product";

const CARD_WIDTH = 200;

const StyledCard = styled(Card as React.FC<CardProps>)`
  width: ${CARD_WIDTH}px;
`;

interface PanelItemProps {
  product: IProduct;
  onClick: (id: string) => void;
}
const PanelItem: React.FC<PanelItemProps> = ({ product, onClick }) => {
  const iconUrl = product.iconDownloadUrl;

  const onCardClicked = () => {
    onClick(product.id);
  };

  const cardMedia = iconUrl ? (
    <ThumbnailImage src={iconUrl} width={CARD_WIDTH} />
  ) : (
    <NoImage width={CARD_WIDTH} />
  );

  return (
    <>
      <StyledCard>
        <CardActionArea onClick={onCardClicked}>
          {cardMedia}
          <CardContent>
            <Typography variant="h6">{product.name}</Typography>
          </CardContent>
        </CardActionArea>
      </StyledCard>
    </>
  );
};

const EmptyInfo = styled.div`
  margin-bottom: 30px;
  white-space: pre-wrap;
`;

interface ActivatedProductListProps {
  products: IProduct[];
  onPanelClicked: (selectedId: string) => void;
}

const ActivatedProductList: React.FC<ActivatedProductListProps> = ({
  products,
  onPanelClicked,
}) => {
  const onClick = (id: string) => () => {
    onPanelClicked(id);
  };

  if (products.length === 0) {
    return (
      <Grid
        container={true}
        justify="center"
        alignItems="center"
        spacing={2 /* TODO: get it from theme */}
      >
        <Grid item={true}>
          <EmptyInfo>
            {`ダウンロード可能なコンテンツがありません。以下の理由が考えられます。
・ダウンロードコードを入力していない。
・別のブラウザでダウンロードコードを入力した。

現在お使いのブラウザからコンテンツをダウンロードするためには、
ダウンロードコードを再入力する必要があります。`}
          </EmptyInfo>
          <LinkButton href="/download/verify" variant="contained">
            <span>ダウンロードコード入力ページへ</span>
          </LinkButton>
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid
      container={true}
      justify="flex-start"
      spacing={2 /* TODO: get it from theme */}
    >
      {products.map((p) => (
        <Grid key={p.id} item={true}>
          <PanelItem product={p} onClick={onClick(p.id)} />
        </Grid>
      ))}
    </Grid>
  );
};

export default ActivatedProductList;
