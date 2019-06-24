import * as React from "react";

import {
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Typography
} from "@material-ui/core";
import DownloadIcon from "@material-ui/icons/ArrowDownward";
import PlayIcon from "@material-ui/icons/PlayArrow";

import { useSnackbar } from "notistack";

import { LogType } from "../../domains/AuditLog";

import { ProductFile } from "../../domains/Product";

import { formatFileSize } from "../../utils/format";
import {
  downloadFromFirebaseStorage,
  getStorageObjectDownloadUrl
} from "../../utils/network";

import AudioWaveIcon from "../atoms/AudioWaveIcon";
import LoadingIcon from "../atoms/LoadingIcon";
import useAuditLogger from "../hooks/useAuditLogger";
import useDownloadCodeVerifier from "../hooks/useDownloadCodeVerifier";
import NativeAudioController from "./NativeAudioController";

const { useState, useMemo, Fragment } = React;

type SortType = "none" | "contentType" | "size";

const sortWith = (a: string | number, b: string | number) => {
  if (a < b) {
    return -1;
  }
  if (b < a) {
    return 1;
  }
  return 0;
};

interface SortSelectorProps {
  type: SortType;
  onChange: (e: React.ChangeEvent<{ name?: string; value: SortType }>) => void;
}

const SortSelector: React.FC<SortSelectorProps> = ({ type, onChange }) => {
  return (
    <Select value={type} onChange={onChange}>
      <MenuItem value="none">並べ替え</MenuItem>
      <MenuItem value="contentType">ファイル形式</MenuItem>
      <MenuItem value="size">ファイルサイズ</MenuItem>
    </Select>
  );
};

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
  onDownload
}) => {
  const onPlayIconClicked = (e: React.MouseEvent<HTMLButtonElement>) => {
    onStart();
  };

  const onDownloadIconClicked = (e: React.MouseEvent<HTMLButtonElement>) => {
    onDownload();
  };

  return (
    <ListItem>
      {/* TODO: style ListItemText width not to overlap with action icons. とりあえず、 "君のこころは輝いているかい？	" では重ならないので、対応は後回し。 */}
      <ListItemText
        primary={name}
        secondary={<Typography>{`${contentType}: ${size}`}</Typography>}
      />
      <ListItemSecondaryAction>
        {canPlay &&
          (state === "playing" ? (
            <AudioWaveIcon animation={true} />
          ) : state === "loading" ? (
            <LoadingIcon animation={true} />
          ) : (
            <IconButton onClick={onPlayIconClicked}>
              <PlayIcon />
            </IconButton>
          ))}
        <IconButton onClick={onDownloadIconClicked}>
          <DownloadIcon />
        </IconButton>
      </ListItemSecondaryAction>
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
  files: { [id: string]: ProductFile };
}
const ProductFileDownloaderTable: React.FC<ProductFileDownloaderTableProps> = ({
  productId,
  files
}) => {
  const data = Object.keys(files)
    .map(id => {
      return {
        id,
        file: files[id]
      };
    })
    // TODO: そもそも並べ替えしなくて済むように、Firestore上で順番を持たせる
    .sort((a, b) => {
      const aName = a.file.originalName;
      const bName = b.file.originalName;

      return sortWith(aName, bName);
    })
    .map(({ id, file }) => {
      return {
        id,
        name: file.displayName,
        contentType: file.contentType,
        size: formatFileSize(file.size),
        // TODO!
        canPlay: ["audio/mp3", "audio/x-m4a"].includes(file.contentType)
      };
    });

  const { getByProductId } = useDownloadCodeVerifier();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const { okAudit } = useAuditLogger();

  const [playableOnly, setPlayableOnly] = useState(false);
  const [sortType, setSortType] = useState<SortType>("none");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>("none");

  const handlePlayableOnly = () => {
    setPlayableOnly(!playableOnly);
  };

  const handleSortType = (
    e: React.ChangeEvent<{ name?: string; value: SortType }>
  ) => {
    setSortType(e.target.value);
  };

  const onDownloadClicked = (fileId: string) => async () => {
    const { storageUrl, originalName } = files[fileId];

    // TODO: show progress status
    const snackBarKey = enqueueSnackbar(`${originalName}をダウンロード中...`, {
      persist: true
    });

    downloadFromFirebaseStorage(storageUrl, originalName).then(() => {
      closeSnackbar(snackBarKey);

      getByProductId(productId).then(({ downloadCode }) => {
        okAudit({
          type: LogType.DOWNLOAD_PRODUCT_FILE,
          params: { storageUrl, originalName, downloadCode }
        });
      });
    });
  };

  const onStartWithList = (fileId: string) => async () => {
    const { storageUrl } = files[fileId];

    const url = await getStorageObjectDownloadUrl(storageUrl);

    getByProductId(productId).then(({ downloadCode }) => {
      okAudit({
        type: LogType.PLAY_PRODUCT_FILE,
        params: { productFileId: fileId, downloadCode, url }
      });
    });

    setSelectedId(fileId);
    setAudioUrl(url);
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

  const visibleData = useMemo(() => {
    let d = [...data];

    if (playableOnly) {
      d = d.filter(item => !!item.canPlay);
    }

    if (sortType === "contentType") {
      d.sort(({ contentType: a }, { contentType: b }) => sortWith(a, b));
    }

    if (sortType === "size") {
      d.sort(({ size: a }, { size: b }) => sortWith(a, b));
    }

    return d;
  }, [playableOnly, sortType]);

  return (
    <>
      <Paper>
        <Grid container={true} direction="column">
          <Grid
            container={true}
            item={true}
            justify={"flex-end"}
            style={{ padding: 8 }} // TODO set with theme
          >
            <SortSelector type={sortType} onChange={handleSortType} />
          </Grid>

          <Grid item={true}>
            <List>
              {visibleData.map(({ id, name, contentType, size, canPlay }) => (
                <Fragment key={id}>
                  <Divider />
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
        src={audioUrl}
        onPlay={onPlayWithPlayer}
        onPause={onPauseWithPlayer}
        onClose={onClosePlayer}
      />
    </>
  );
};

export default ProductFileDownloaderTable;
