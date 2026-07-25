import { TReactSetState } from "../../../../../../helpers/AppType";
import { IStockAdjustmentView } from "../StockAdjustmentViewController";

export interface StockProduct {
  id: number;
  name: string;
  image: string;
  stock: number;
  category_id: number | string;
  category_name: string;
  product_code: string;
}
export interface IStockAdjustmentCreateModal {
  show: boolean;
  onHide: () => void;
  setRefreshStockAdjustment?: TReactSetState<boolean>;
  flag: number;
  where_action: number;
  editStockAdjustment?: IStockAdjustmentView | undefined;
}
export interface IWareHouseList {
  value: string | number;
  label: string;
}

export interface ProductDetails {
  warehouse?: string;
  stock?: number;
  warehouse_id?: number;
}
