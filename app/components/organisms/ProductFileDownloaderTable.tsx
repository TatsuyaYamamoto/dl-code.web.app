import * as React from "react";

import {
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Paper,
  Typography,
} from "@material-ui/core";
import DownloadIcon from "@material-ui/icons/ArrowDownward";
import PlayIcon from "@material-ui/icons/PlayArrow";
import Button from "@material-ui/core/Button";

import { useSnackbar } from "notistack";

import { LogType } from "../../domains/AuditLog";

import { IProductFile } from "../../domains/Product";

import { formatFileSize } from "../../utils/format";
import { downloadByUrl } from "../../utils/network";
import { isPast } from "../../utils/date";

import AudioWaveIcon from "../atoms/AudioWaveIcon";
import LoadingIcon from "../atoms/LoadingIcon";
import useAuditLogger from "../hooks/useAuditLogger";
import useDownloadCodeVerifier from "../hooks/useDownloadCodeVerifier";
import NativeAudioController from "./NativeAudioController";

const { useState, useMemo, Fragment } = React;

interface ListItemData {
  name: string;
  contentType: string;
  size: string;
  canPlay: boolean;
}

interface ProductFileListItemProps extends ListItemData {
  state: PlayerState | null;
  onStart: () => Promise<void>;
  onDownload: () => void;
}

const ProductFileListItem: React.FC<ProductFileListItemProps> = ({
  name,
  contentType,
  size,
  canPlay,
  state,
  onStart,
  onDownload,
}) => {
  const onPlayIconClicked = (_: React.MouseEvent<HTMLButtonElement>) => {
    onStart();
  };

  const onDownloadIconClicked = (_: React.MouseEvent<HTMLButtonElement>) => {
    onDownload();
  };

  const action = canPlay ? (
    state === "playing" ? (
      <IconButton disabled={true}>
        <AudioWaveIcon animation={true} />
      </IconButton>
    ) : state === "loading" ? (
      <IconButton disabled={true}>
        <LoadingIcon animation={true} />
      </IconButton>
    ) : (
      <IconButton onClick={onPlayIconClicked}>
        <PlayIcon />
      </IconButton>
    )
  ) : (
    <IconButton onClick={onDownloadIconClicked}>
      <DownloadIcon />
    </IconButton>
  );

  return (
    <ListItem button={true}>
      {/* TODO: style ListItemText width not to overlap with action icons. とりあえず、 "君のこころは輝いているかい？	" では重ならないので、対応は後回し。 */}
      <ListItemText
        primary={name}
        secondary={<Typography>{`${contentType}: ${size}`}</Typography>}
      />
      <ListItemSecondaryAction>{action}</ListItemSecondaryAction>
    </ListItem>
  );
};

type PlayerState =
  // No audio file is selected
  | "none"
  // loading audio file
  | "loading"
  // can play after loading or pausing.
  | "ready"
  // now , audio is playing
  | "playing";

interface ProductFileDownloaderTableProps {
  productId: string;
  files: { [id: string]: IProductFile };
}
const ProductFileDownloaderTable: React.FC<ProductFileDownloaderTableProps> = ({
  productId,
  files,
}) => {
  const { getByProductId } = useDownloadCodeVerifier();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const { okAudit, errorAudit } = useAuditLogger();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>("none");

  const onDownloadClicked = (fileId: string) => async () => {
    const { signedDownloadUrl, originalName } = files[fileId];

    if (isPast(signedDownloadUrl.expireDate)) {
      enqueueSnackbar(
        `ダウンロード用URLの有効期限が切れているため、リロードしてください。`,
        {
          variant: "warning",
          action: () => (
            <Button variant="outlined" onClick={() => window.location.reload()}>
              リロード
            </Button>
          ),
        }
      );
      return;
    }

    // TODO: show progress status
    const snackBarKey = enqueueSnackbar(`${originalName}をダウンロード中...`, {
      persist: true,
    });

    const product = await getByProductId(productId);
    const downloadCode = product?.downloadCode || "__fail_load_download_code";

    try {
      await downloadByUrl(signedDownloadUrl.value, originalName);
    } catch (e) {
      console.error(e);
      enqueueSnackbar(`ファイルのダウンロードに失敗しました。`, {
        variant: "error",
      });
      errorAudit({
        type: LogType.EXCEPTION_FAIL_DOWNLOAD_FILE,
        fatal: true,
        error: e,
        params: {
          productId,
          downloadCode,
          fileId,
          signedDownloadUrl,
          originalName,
        },
      });
      return;
    } finally {
      closeSnackbar(snackBarKey);
    }

    okAudit({
      type: LogType.DOWNLOAD_PRODUCT_FILE,
      params: {
        signedDownloadUrl,
        fileId,
        originalName,
        productId,
        downloadCode,
      },
    });
  };

  const onStartWithList = (fileId: string) => async () => {
    const { signedDownloadUrl } = files[fileId];
    console.log(signedDownloadUrl);

    if (isPast(signedDownloadUrl.expireDate)) {
      enqueueSnackbar(
        `再生用ファイルのURLの有効期限が切れているため、リロードしてください。`,
        {
          variant: "warning",
          action: () => (
            <Button variant="outlined" onClick={() => window.location.reload()}>
              リロード
            </Button>
          ),
        }
      );
      return;
    }

    getByProductId(productId).then((product) => {
      const downloadCode = product?.downloadCode || "__fail_load_download_code";
      okAudit({
        type: LogType.PLAY_PRODUCT_FILE,
        params: { productFileId: fileId, downloadCode, signedDownloadUrl },
      });
    });

    setSelectedId(fileId);
    setAudioUrl(signedDownloadUrl.value);
  };

  const onPlayWithPlayer = () => {
    setPlayerState("playing");
  };

  const onPauseWithPlayer = () => {
    setPlayerState("ready");
  };

  const onClosePlayer = () => {
    setSelectedId(null);
    setAudioUrl(null);
  };

  const onPlayError = (e: Error) => {
    enqueueSnackbar(`再生に失敗しました。`, {
      variant: "error",
    });
    errorAudit({
      type: LogType.EXCEPTION_FILE_TO_PLAY_AUDIO,
      fatal: true,
      error: e,
      params: {
        productId,
        fileId: selectedId,
        audioUrl,
      },
    });
    setSelectedId(null);
    setAudioUrl(null);
  };

  const data = useMemo(
    () =>
      Object.keys(files)
        .map((id) => {
          return {
            id,
            file: files[id],
          };
        })
        .sort((a, b) => {
          const aIndex = a.file.index;
          const bIndex = b.file.index;

          return aIndex - bIndex;
        })
        .map(({ id, file }) => {
          return {
            id,
            name: file.displayName,
            contentType: file.contentType,
            size: formatFileSize(file.size),
            // TODO!
            canPlay: ["audio/mp3", "audio/x-m4a", "audio/mpeg"].includes(
              file.contentType
            ),
          };
        }),
    [files]
  );

  return (
    <>
      <Paper>
        <Grid container={true} direction="column">
          <Grid item={true}>
            <List>
              {data.map(({ id, name, contentType, size, canPlay }) => (
                <Fragment key={id}>
                  <ProductFileListItem
                    state={id === selectedId ? playerState : null}
                    name={name}
                    contentType={contentType}
                    size={size}
                    canPlay={canPlay}
                    onStart={onStartWithList(id)}
                    onDownload={onDownloadClicked(id)}
                  />
                </Fragment>
              ))}
            </List>
          </Grid>
        </Grid>
      </Paper>

      <NativeAudioController
        open={!!audioUrl}
        src={audioUrl as string}
        onPlay={onPlayWithPlayer}
        onPause={onPauseWithPlayer}
        onClose={onClosePlayer}
        onError={onPlayError}
      />
    </>
  );
};

export default ProductFileDownloaderTable;
