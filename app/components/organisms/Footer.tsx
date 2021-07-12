import * as React from "react";

import Grid from "@material-ui/core/Grid";
import styled from "styled-components";

import LinkButton from "../atoms/LinkButton";
import Logo from "../atoms/Logo";

import { TWITTER_URL, CONTACT_FORM_URL } from "../../configs";

const copyRightSymbol = `\u00A9`;

const CopyRight = styled.span`
  color: whitesmoke;
`;

const StyledLinkButton = styled(LinkButton)`
  && {
    color: whitesmoke;
  }
`;

const Root = styled.div`
  background-color: grey;
`;

const Footer: React.FC = () => {
  const contact = (
    <StyledLinkButton href={CONTACT_FORM_URL}>お問い合わせ</StyledLinkButton>
  );

  const dlCode = (
    <StyledLinkButton href={`/`}>
      <Logo />
    </StyledLinkButton>
  );

  const twitter = (
    <StyledLinkButton href={TWITTER_URL}>Twitter</StyledLinkButton>
  );

  const copyRight = (
    <CopyRight>{`${copyRightSymbol} 2019 そこんところ工房`}</CopyRight>
  );

  return (
    <Root>
      <Grid container={true} justify="space-around" alignItems="center">
        {contact}
        {dlCode}
        {twitter}
      </Grid>
      <Grid container={true} justify="space-around" alignItems="center">
        {copyRight}
      </Grid>
    </Root>
  );
};

export default Footer;
