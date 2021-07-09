import React, { FC } from "react";
import styled from "styled-components";

import CircularProgress from "@material-ui/core/CircularProgress";
import Button, { ButtonProps } from "@material-ui/core/Button";

const Wrapper = styled.div`
  position: relative;
`;

const StyledProgress = styled(CircularProgress)`
  position: absolute;
  top: 50%;
  left: 50%;
  margin-top: -12px;
  margin-left: -12px;
`;

interface ProgressButtonProps extends ButtonProps {
  progressing: boolean;
  onClick: () => void;
}

const ProgressButton: FC<ProgressButtonProps> = (props) => {
  const { progressing, disabled, onClick, children, ...others } = props;
  const isButtonDisabled = progressing || disabled;

  return (
    <Wrapper>
      <Button disabled={isButtonDisabled} onClick={onClick} {...others}>
        {children}
      </Button>
      {progressing && <StyledProgress size={24} />}
    </Wrapper>
  );
};

export default ProgressButton;
