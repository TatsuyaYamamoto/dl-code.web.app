import React, { useMemo } from "react";

import MaterialTable, {
  Column,
  Options as TableOptions,
  MTableBody,
  MTableBodyRow,
} from "material-table";

import ProductFileAddDialog from "./ProductFileAddDialog";
import {
  SortableContainer,
  SortableElement,
  SortEnd,
} from "react-sortable-hoc";

import {
  ProductFile,
  ProductFileDisplayName,
  ProductFileMap,
  ProductFileOriginalName,
} from "../../domains/Product";

import { formatFileSize } from "../../utils/format";
import { downloadFromFirebaseStorage } from "../../utils/network";

const SortableMTableBodyRow = SortableElement(MTableBodyRow);
const SortableMTableBody = SortableContainer(MTableBody);

const TABLE_OPTIONS: TableOptions<RowData> = {
  addRowPosition: "first",
  paging: false,
  search: false,
  actionsColumnIndex: -1,
};

const TABLE_LOCALIZATION = {
  header: {
    actions: "",
  },
  body: {
    editRow: {
      deleteText: "けします",
    },
  },
};

const TABLE_COLUMNS: Column<RowData>[] = [
  { title: "表示ファイル名", field: "displayName" },
  {
    title: "オリジナルファイル名",
    field: "originalName",
    editable: "never",
  },
  {
    title: "サイズ",
    field: "size",
    editable: "never",
  },
  {
    title: "タイプ",
    field: "contentType",
    editable: "never",
  },
];

interface RowData {
  id: string;
  displayName: ProductFileDisplayName;
  originalName: ProductFileOriginalName;
  size: string;
  contentType: string;
}

interface ProductFileEditTableProps {
  productFiles: ProductFileMap;
  onAdd: (displayFileName: ProductFileDisplayName, file: File) => Promise<void>;
  onUpdate: (
    productFileId: string,
    edited: Partial<ProductFile>
  ) => Promise<void>;
  onDelete: (productFileId: string) => Promise<void>;
  onChangeIndex: (id: string, newIndex: number) => Promise<void>;
}

const ProductFileEditTable: React.FC<ProductFileEditTableProps> = ({
  productFiles,
  onAdd,
  onUpdate,
  onDelete,
  onChangeIndex,
}) => {
  const [addDialogOpen, setAddDialogOpen] = React.useState(false);

  const handleProductFileAddDialog = () => {
    setAddDialogOpen(!addDialogOpen);
  };

  const onAddButtonClicked = () => {
    handleProductFileAddDialog();
  };

  const onNewProductFileSubmitted = async (
    displayFileName: ProductFileDisplayName,
    file: File
  ) => {
    await onAdd(displayFileName, file);
    handleProductFileAddDialog();
  };

  const onDownloadButtonClicked = (_: any, rowData: RowData | RowData[]) => {
    if (Array.isArray(rowData)) {
      throw new Error(
        "unexpected error. download button allows single data only."
      );
    }

    const { id: productFileId } = rowData;
    const { storageUrl, originalName } = productFiles[productFileId];
    console.log("DEBUG", storageUrl, originalName);
    downloadFromFirebaseStorage(storageUrl, originalName);
  };

  const onProductFileUpdate = (
    newData: RowData,
    oldData?: RowData
  ): Promise<void> => {
    const { id } = newData;
    const edited: Partial<ProductFile> = {};

    if (newData.displayName !== oldData?.displayName) {
      edited.displayName = newData.displayName;
    }

    return onUpdate(id, edited);
  };

  const onProductFileDelete = ({ id }: RowData): Promise<void> => {
    return onDelete(id);
  };

  const data: RowData[] = useMemo(() => {
    return Object.keys(productFiles)
      .sort((aId, bId) => {
        const aIndex = productFiles[aId].index;
        const bIndex = productFiles[bId].index;

        return aIndex - bIndex;
      })
      .map((id) => ({
        id,
        displayName: productFiles[id].displayName,
        originalName: productFiles[id].originalName,
        size: formatFileSize(productFiles[id].size),
        contentType: productFiles[id].contentType,
      }));
  }, [productFiles]);

  const onSortEnd = ({ oldIndex, newIndex }: SortEnd) => {
    if (oldIndex === newIndex) {
      return;
    }

    const id = Object.keys(productFiles).find((key) => {
      return oldIndex === productFiles[key].index;
    });

    // TODO: affect list view before completing update to firestore
    if (!id) {
      throw new Error("unexpected error. counld not find ID of sorted.");
    }

    onChangeIndex(id, newIndex);
  };

  return (
    <>
      <MaterialTable
        options={TABLE_OPTIONS}
        localization={TABLE_LOCALIZATION}
        columns={TABLE_COLUMNS}
        title={"配信ファイル一覧"}
        data={data}
        actions={[
          // TODO ダウンロードアイコンの場所の調整。
          // <EDIT><DELETE><DL>ではなくて、<DL><EDIT><DELETE>にする。
          {
            icon: "arrow_downward",
            tooltip: "Download",
            onClick: onDownloadButtonClicked,
          },
          {
            icon: "add",
            tooltip: "追加",
            isFreeAction: true,
            onClick: onAddButtonClicked,
          },
        ]}
        editable={{
          onRowUpdate: onProductFileUpdate,
          onRowDelete: onProductFileDelete,
        }}
        components={{
          Body: (props) => {
            return <SortableMTableBody onSortEnd={onSortEnd} {...props} />;
          },
          Row: (props) => {
            return <SortableMTableBodyRow {...props} />;
          },
        }}
      />

      <ProductFileAddDialog
        open={addDialogOpen}
        handleClose={handleProductFileAddDialog}
        onSubmit={onNewProductFileSubmitted}
      />
    </>
  );
};

export default ProductFileEditTable;
