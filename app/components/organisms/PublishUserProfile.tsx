import { default as React, useMemo } from "react";

import {
  Grid,
  List,
  ListItem,
  ListItemText,
  ListSubheader,
} from "@material-ui/core";

import useAuth from "../../components/hooks/useAuth";
import { formatFileSize } from "../../utils/format";

interface ResourceCounter {
  key: string;
  displayLabel: string;
  limit: string | number;
  current: string | number;
}

interface AccountData {
  key: string;
  displayLabel: string;
  value: string | React.ReactElement;
}

const PublishUserProfile: React.FC = () => {
  const { user } = useAuth();

  const resourceCounters = useMemo<ResourceCounter[]>(() => {
    const counters: ResourceCounter[] = [];

    if (user) {
      counters.push({
        key: "counters.product",
        displayLabel: "プロダクト数",
        limit: user.counters.product.limit,
        current: user.counters.product.current,
      });

      counters.push({
        key: "counters.downloadCode",
        displayLabel: "ダウンロードコード数",
        limit: user.counters.downloadCode.limit,
        current: user.counters.downloadCode.current,
      });

      counters.push({
        key: "counters.totalFileSizeByte",
        displayLabel: "アップロード済みファイルサイズ",
        limit: formatFileSize(user.counters.totalFileSizeByte.limit),
        current: formatFileSize(user.counters.totalFileSizeByte.current),
      });
    }

    return counters;
  }, [user]);

  const accountDataList = useMemo<AccountData[]>(() => {
    const data: AccountData[] = [];

    if (user) {
      data.push({
        key: "user.uid",
        displayLabel: "ユーザーID",
        value: user.uid,
      });

      data.push({
        key: "user.twitterUserName",
        displayLabel: "Twitterユーザー名",
        value: user.displayName,
      });
    }

    return data;
  }, [user]);

  return (
    <Grid container={true}>
      {user && (
        <Grid item={true}>
          <List subheader={<ListSubheader>{`アカウント`}</ListSubheader>}>
            {accountDataList.map(({ key, displayLabel, value }) => (
              <ListItem key={key}>
                <ListItemText primary={displayLabel} secondary={value} />
              </ListItem>
            ))}
          </List>
          <List subheader={<ListSubheader>{`使用量`}</ListSubheader>}>
            {resourceCounters.map(({ key, displayLabel, limit, current }) => (
              <ListItem key={key}>
                <ListItemText
                  primary={displayLabel}
                  secondary={`${current} / ${limit}`}
                />
              </ListItem>
            ))}
          </List>
        </Grid>
      )}
    </Grid>
  );
};

export default PublishUserProfile;
