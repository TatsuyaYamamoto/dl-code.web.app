import * as React from "react";

import styled, { ThemeProps } from "styled-components";
import { Theme as MuiTheme } from "@material-ui/core/styles";

import Paper, { PaperProps } from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import TextField, { TextFieldProps } from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";
import LocalOffer from "@material-ui/icons/LocalOffer";

import ProgressButton from "../molecules/ProgressButton";

const StyledPaper = styled(Paper)`
  padding: ${({ theme }: ThemeProps<MuiTheme>) => theme.spacing(2)}px;
` as React.FC<PaperProps>;

const StyledTextField = styled(TextField)`
  margin-top: 10px !important;
  margin-bottom: 10px !important;
  padding-top: ${({ theme }: ThemeProps<MuiTheme>) => theme.spacing(1)}px;
` as React.FC<TextFieldProps>;

interface DownloadCodeInputCardProps {
  value: string;
  progressing: boolean;
  onChange: React.ChangeEventHandler<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >;
  onSubmit: () => void;
}

const DownloadCodeInputCard: React.FC<DownloadCodeInputCardProps> = ({
  value,
  progressing,
  onChange,
  onSubmit,
}) => {
  const disableSubmit = value.length === 0;

  return (
    <StyledPaper>
      <Typography>ダウンロードコードを入力してください</Typography>
      <StyledTextField
        value={value}
        onChange={onChange}
        variant="outlined"
        fullWidth={true}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LocalOffer />
            </InputAdornment>
          ),
        }}
      />
      <ProgressButton
        variant="contained"
        color="primary"
        disabled={disableSubmit}
        progressing={progressing}
        onClick={onSubmit}
        fullWidth={true}
      >
        実行
      </ProgressButton>
    </StyledPaper>
  );
};

export default DownloadCodeInputCard;
