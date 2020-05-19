import * as React from "react";
import QrCodeCheckDialog, {
  DecodeResult,
  CheckStatus
} from "./QrCodeCheckDialog";

export default { title: "QrCodeCheckDialog" };

export const withNull = () => {
  const isDialogOpen = true;

  const [decordingIcon] = React.useState<CheckStatus>(
    "progressing"
  );
  const [formatIcon, setFormatIcon] = React.useState<CheckStatus>(
    "progressing"
  );
  const [existingIcon] = React.useState<CheckStatus>(
    "progressing"
  );

  React.useEffect(() => {
    const intervalId = setInterval(() => {
      const nextIcon = (icon: CheckStatus) =>
        icon === "progressing"
          ? "valid"
          : icon === "valid"
          ? "invalid"
          : icon === "invalid"
          ? "suspended"
          : "progressing";

      setFormatIcon(nextIcon);
    }, 1000);

    return function teardown() {
      clearInterval(intervalId);
    };
  }, []);

  const decodeResult: DecodeResult = {
    checkList: {
      decoding: decordingIcon,
      format: formatIcon,
      existing: existingIcon
    },
    detail: {
      decodedText: null,
      productId: null,
      productName: null,
      downloadCodeCreatedAt: null,
      downloadCodeExpireAt: null
    }
  };
  const handleCloseDialog = () => {
    //
  };

  return (
    <QrCodeCheckDialog
      open={isDialogOpen}
      decodeResult={decodeResult}
      handleClose={handleCloseDialog}
    />
  );
};

export const withAllValidProps = () => {
  const isDialogOpen = true;
  const decodeResult: DecodeResult = {
    checkList: {
      decoding: "valid",
      format: "valid",
      existing: "valid"
    },
    detail: {
      decodedText: "decoded text",
      productId: "id",
      productName:
        "とてもながいプロダクトネームを表示する場合、は適切なレイアウトで改行してね",
      downloadCodeCreatedAt: new Date(),
      downloadCodeExpireAt: new Date()
    }
  };
  const handleCloseDialog = () => {
    //
  };

  return (
    <QrCodeCheckDialog
      open={isDialogOpen}
      decodeResult={decodeResult}
      handleClose={handleCloseDialog}
    />
  );
};
