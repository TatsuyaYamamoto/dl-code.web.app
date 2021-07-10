import { default as React, FC, useState, ChangeEvent } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

import {
  default as MuiAppBar,
  AppBarProps as MuiAppBarProps,
} from "@material-ui/core/AppBar";
import {
  Toolbar,
  Typography,
  Icon,
  IconButton,
  Tabs,
  Tab,
} from "@material-ui/core";

import styled from "styled-components";

import UserIconMenu from "./UserIconMenu";

import FlexSpace from "../../atoms/FlexSpace";
import Logo from "../../atoms/Logo";
import useAuth from "../../hooks/useAuth";

const StyledMuiAppBar = styled(MuiAppBar as FC<MuiAppBarProps>)`
  && {
    background-color: transparent;
    color: grey;
    z-index: 99;
  }
`;

const LogoLink = styled(({ className }) => (
  <Link href={`/`}>
    <Typography variant="h6" color="inherit" className={className}>
      <Logo />
    </Typography>
  </Link>
))`
  cursor: pointer;
`;

type TabValue = "home" | "product";

interface AppBarProps {
  onBack?: () => void;
}

const AppBar: FC<AppBarProps> = (props) => {
  const { onBack } = props;
  const { user, logout } = useAuth();
  const router = useRouter();

  const [tabValue, setTabValue] = useState<TabValue>(() => {
    if (router.pathname.startsWith(`/publish/product`)) {
      return "product";
    }
    return "home";
  });

  const back = (
    <IconButton color="inherit" onClick={onBack}>
      <Icon>arrow_back</Icon>
    </IconButton>
  );

  const onClickLogout = () => {
    router.push(`/`);
    logout();
  };

  const onTabMenuChanged = (_: ChangeEvent<{}>, newValue: TabValue) => {
    setTabValue(newValue);
    switch (newValue) {
      case "home":
        router.push(`/publish`);
        break;
      case "product":
        router.push(`/publish/product/list`);
        break;
    }
  };

  const menuTabs = (
    <Tabs value={tabValue} onChange={onTabMenuChanged}>
      <Tab label="ホーム" value={"home"} />
      <Tab label="プロダクト" value={"product"} />
    </Tabs>
  );

  const userIcon = user ? (
    <UserIconMenu iconUrl={user.iconUrl} onLogoutClicked={onClickLogout} />
  ) : (
    <></>
  );

  return (
    <>
      <StyledMuiAppBar position="static">
        <Toolbar>
          {onBack ? back : <LogoLink />}
          <>
            <FlexSpace />
            {menuTabs}
            {userIcon}
          </>
        </Toolbar>
      </StyledMuiAppBar>
    </>
  );
};

export default AppBar;
