import React, { useMemo } from "react";
import { NextPage } from "next";
import styled from "styled-components";

import { Button, Typography, LinearProgress } from "@material-ui/core";
import TwitterIcon from "@material-ui/icons/Twitter";

import useAuth from "../components/hooks/useAuth";
import Logo from "../components/atoms/Logo";

const Root = styled.div`
  display: flex;
  justify-content: center;
  padding: 80px 0;
`;

const Card = styled.div`
  width: 400px;
  min-height: 340px;
  box-shadow: 0 12px 40px rgb(0 0 0 / 12%);
  text-align: center;
`;

const Details = styled.div`
  padding: 50px 50px 0;
`;

const Action = styled.div`
  padding: 30px 50px 50px;
`;

const RootIndexPage: NextPage = () => {
  const { login, sessionState } = useAuth();
  const progressing = useMemo(
    () => sessionState === "processing",
    [sessionState]
  );
  const isLoginButtonClickable = useMemo(
    () => sessionState === "loggedOut",
    [sessionState]
  );

  const onClick = () => {
    login();
  };

  return (
    <Root>
      <Card>
        {progressing && <LinearProgress />}
        <Details>
          <Typography variant="h1" color="inherit">
            <Logo />
          </Typography>
          <Typography>
            管理機能を利用するためにTwitterアカウントでログインを行います。
          </Typography>
        </Details>
        <Action>
          <Button
            fullWidth={true}
            onClick={onClick}
            variant="outlined"
            disabled={!isLoginButtonClickable}
            startIcon={<TwitterIcon style={{ color: "#1DA1F2" }} />}
          >
            ログイン
          </Button>
        </Action>
      </Card>
    </Root>
  );
};

export default RootIndexPage;
