import React, { useEffect, useRef, useState } from "react";
import { IWareHouseList, ProductDetails, StockProduct } from "./stocktypes";
import CustomSearchDropdown from "../../../../../../components/CustomSearchDropdown";
import { SingleValue } from "react-select";
import { IOption } from "../../../../../../helpers/AppInterface";
import {
  fetchWareHouse,
  IStockDetailList,
  IStockItemList,
} from "../StockAdjustmentController";
import { toast } from "react-toastify";
import AsyncProductTooltip from "./AsyncProductTooltip";
import { TReactSetState } from "../../../../../../helpers/AppType";
import { getItemWiseCurrentStock } from "../StockAdjustmentViewController";
import Skeleton from "react-loading-skeleton";

interface Props {
  products: StockProduct[];
  stock_type: number | string;
  onHide: () => void;
  handleStockSubmit: (stockItemList: IStockItemList[]) => void;
  handleDeleteById: (data: number) => void;
  setIsProductGridShow: TReactSetState<boolean>;
  isProductGridShow: boolean;
  stockDetailList: IStockDetailList;
}

interface RowState {
  productId: number;
  warehouseFrom: SingleValue<IOption>;
  warehouseTo: SingleValue<IOption>;
  remark: string;
  qty: string;
  category_id: number | string;
  category_name: string;
  product_code: string;
  name: string;
  current_stock: number;
}

const StockAdjustmentSelectedProducts: React.FC<Props> = ({
  products,
  stock_type,
  onHide,
  handleStockSubmit,
  handleDeleteById,
  isProductGridShow,
  setIsProductGridShow,
  stockDetailList,
}) => {
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [warehouseList, setWarehouseList] = useState<IWareHouseList[]>([]);
  const [rows, setRows] = useState<RowState[]>([]);
  const [productList, setProductList] = useState<StockProduct[]>([]);
  const [isLoadingCurrentStockFetch, setIsLoadingCurrentStockFetch] =
    useState<boolean>(false);
  const [cache, setCache] = useState<Record<number, ProductDetails[]>>({});

  useEffect(() => {
    fetchWareHouse(setWarehouseList);
  }, []);

  useEffect(() => {
    setProductList(products);
    const initialRows = products.map((p) => ({
      productId: p.id,
      name: p.name,
      category_id: p.category_id,
      category_name: p.category_name,
      product_code: p.product_code,
      warehouseFrom: null,
      warehouseTo: null,
      remark: "",
      qty: "",
      current_stock: p.stock,
    }));

    setRows(initialRows);
  }, [products]);

  const updateRow = (productId: number, field: keyof RowState, value: any) => {
    if (field === "qty" && !/^-?\d*\.?\d*$/.test(value)) {
      setRows((prev) =>
        prev.map((row) =>
          row.productId === productId ? { ...row, [field]: "" } : row,
        ),
      );
      return;
    }
    setRows((prev) =>
      prev.map((row) =>
        row.productId === productId ? { ...row, [field]: value } : row,
      ),
    );
  };

  const getFilteredOptions = (
    currentValue: any,
    otherValue: any,
    options: IWareHouseList[],
  ) => {
    return options.filter(
      (opt) =>
        opt.value !== otherValue?.value || opt.value === currentValue?.value,
    );
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();

      const nextProduct = productList[index + 1];
      if (nextProduct) {
        inputRefs.current[nextProduct.id]?.focus();
      }
    }
  };

  const getSubmitData = () => {
    return rows
      .filter((row) => row.qty && Number(row.qty) > 0)
      .map((row) => ({
        product_id: row.productId,
        product_name: row.name,
        warehouse_from: row.warehouseFrom?.value || null,
        warehouse_to: row.warehouseTo?.value || null,
        qty: Number(row.qty),
        remark: row.remark || "",
        category_id: row.category_id,
        category_name: row.category_name,
        product_code: row.product_code,
      }));
  };

  const checkStockAvibilityForDeduction = () => {
    if (!stockDetailList.stock_adjustment_type?.value) {
      toast.error("Select Stock Adjustment type");
      return false;
    }

    const hasInvalidWareHouse = rows.some((v) => !v.warehouseFrom);

    if (hasInvalidWareHouse) {
      toast.error("Select warehouse");
      return false;
    }

    if (stockDetailList.stock_adjustment_type?.value == 3) {
      const hasInvalidStock = rows.some(
        (v) => Number(v.current_stock) < Number(v.qty),
      );

      if (hasInvalidStock) {
        toast.error("Please check stock availability before deduction.");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    const payload = getSubmitData();
    if (payload.length === 0) {
      toast.error("Please add at least one valid product");
      return;
    }
    const checkStockAv = checkStockAvibilityForDeduction();
    if (!checkStockAv) {
      return;
    }

    try {
      handleStockSubmit(payload);
    } catch (err) {
      toast.error("Failed to submit");
    }
  };

  const handleHide = () => {
    onHide();
  };

  const openCloseRight = async () => {
    setIsProductGridShow(!isProductGridShow);
  };

  const handelClickRefreshStock = async () => {
    const productIds = productList.map((v) => v.id);
    const new_stock_item_list = await getItemWiseCurrentStock(
      setIsLoadingCurrentStockFetch,
      productIds.join(","),
    );
    if (new_stock_item_list.length > 0) {
      new_stock_item_list.map((v: any) => {
        setProductList((prev) =>
          prev.map((row) =>
            row.id === v.product_id
              ? { ...row, ["stock"]: v.current_stock }
              : row,
          ),
        );
        setRows((prev) =>
          prev.map((row) =>
            row.productId === v.product_id
              ? { ...row, ["current_stock"]: v.current_stock }
              : row,
          ),
        );
      });
      setCache({});
    }
  };

  return (
    <>
      <div
        className="table-responsive"
        style={{
          flex: 1,
          overflowY: "auto",
        }}
      >
        <table className="table table-sm table-bordered mb-0">
          <thead
            className="table-light"
            style={{
              position: "sticky",
              top: 0,
              zIndex: 1,
            }}
          >
            <tr>
              <th style={{ background: "#f8f9fa" }}></th>
              <th style={{ background: "#f8f9fa" }}>Product Name</th>
              <th style={{ background: "#f8f9fa" }}>
                Current Stock
                {productList.length !== 0 && (
                  <span title="Refresh Stock" onClick={handelClickRefreshStock}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      fill="#f1a20e"
                    >
                      <path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z" />
                    </svg>
                  </span>
                )}
              </th>
              <th style={{ background: "#f8f9fa" }}>
                Warehouse {stock_type == 1 && "From"}
              </th>
              {stock_type == 1 && (
                <th style={{ background: "#f8f9fa" }}>Warehouse To</th>
              )}
              <th style={{ background: "#f8f9fa" }}>Qty</th>
              <th style={{ background: "#f8f9fa" }}>
                Remark
                <span className="close px-2" onClick={openCloseRight}>
                  {!isProductGridShow && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="40px"
                      viewBox="0 -960 960 960"
                      width="40px"
                      fill="currentColor"
                    >
                      <path d="M460-320v-320L300-480l160 160ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm440-80h120v-560H640v560Zm-80 0v-560H200v560h360Zm80 0h120-120Z" />
                    </svg>
                  )}
                </span>
              </th>
            </tr>
          </thead>

          <tbody>
            {productList.length === 0 ? (
              <tr>
                <td
                  colSpan={6 + (stock_type == 1 ? 1 : 0)}
                  className="text-center text-muted"
                >
                  No product selected
                </td>
              </tr>
            ) : (
              productList.map((p, index) => (
                <tr key={p.id}>
                  <td style={{ textAlign: "center" }}>
                    <button
                      style={{ cursor: "pointer" }}
                      onClick={() => handleDeleteById(p.id)}
                    >
                      <svg
                        viewBox="0 -960 960 960"
                        width="22px"
                        fill="currentColor"
                      >
                        <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
                      </svg>
                    </button>
                  </td>
                  <td className="text-truncate" style={{ maxWidth: 200 }}>
                    {p.name}
                    <br />
                    {p.product_code && (
                      <>
                        {p.product_code}
                        <br />
                      </>
                    )}
                    {p.category_name && (
                      <>
                        {p.category_name}
                        <br />
                      </>
                    )}
                  </td>
                  <td style={{ textAlign: "end" }}>
                    {isLoadingCurrentStockFetch && (
                      <Skeleton height={25} width="40%" />
                    )}
                    {!isLoadingCurrentStockFetch && (
                      <AsyncProductTooltip
                        cache={cache}
                        setCache={setCache}
                        productId={p.id}
                      >
                        {p.stock.toFixed()}
                      </AsyncProductTooltip>
                    )}
                  </td>
                  <td>
                    <CustomSearchDropdown
                      options={getFilteredOptions(
                        rows.find((r) => r.productId === p.id)?.warehouseFrom,
                        rows.find((r) => r.productId === p.id)?.warehouseTo,
                        warehouseList,
                      )}
                      value={
                        rows.find((r) => r.productId === p.id)?.warehouseFrom ||
                        null
                      }
                      onChange={(val) => updateRow(p.id, "warehouseFrom", val)}
                    />
                  </td>
                  {stock_type == 1 && (
                    <td>
                      <CustomSearchDropdown
                        options={getFilteredOptions(
                          rows.find((r) => r.productId === p.id)?.warehouseTo,
                          rows.find((r) => r.productId === p.id)?.warehouseFrom,
                          warehouseList,
                        )}
                        value={
                          rows.find((r) => r.productId === p.id)?.warehouseTo ||
                          null
                        }
                        onChange={(val) => updateRow(p.id, "warehouseTo", val)}
                      />
                    </td>
                  )}
                  <td>
                    <input
                      ref={(el) => (inputRefs.current[p.id] = el)}
                      className="form-control"
                      type="text"
                      value={rows.find((r) => r.productId === p.id)?.qty || ""}
                      onChange={(e) => updateRow(p.id, "qty", e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                    />
                  </td>
                  <td>
                    <textarea
                      rows={1}
                      className="form-control"
                      value={
                        rows.find((r) => r.productId === p.id)?.remark || ""
                      }
                      onChange={(e) =>
                        updateRow(p.id, "remark", e.target.value)
                      }
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {productList.length !== 0 && (
        <div className="row">
          <div
            className="col-12 modal-buttons text-end"
            style={{ margin: "0px" }}
          >
            <button className="modal-button1 m-1" onClick={() => handleHide()}>
              CANCEL
            </button>
            <button className="modal-button2 m-1" onClick={handleSubmit}>
              SAVE
            </button>
          </div>
        </div>
      )}
    </>
  );
};
export default React.memo(StockAdjustmentSelectedProducts);
