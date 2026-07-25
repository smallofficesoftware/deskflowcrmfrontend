import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import StockAdjustmentProductGrid from "./stock-product/StockAdjustmentProductGrid";
import StockAdjustmentSelectedProducts from "./stock-product/StockAdjustmentSelectedProducts";
import {
  IStockAdjustmentCreateModal,
  StockProduct,
} from "./stock-product/stocktypes";
import {
  insertStock,
  IStockDetailList,
  IStockDetailListSubmit,
  IStockItemList,
} from "./StockAdjustmentController";
import StockDetails from "./StockDetails";
import RibbonBanner from "../../../../../components/model/RibbonBedgetLeftSide/RibbonBannerLeft";

const StockAdjustmentModel: React.FC<IStockAdjustmentCreateModal> = ({
  show,
  onHide,
  editStockAdjustment,
  flag,
  setRefreshStockAdjustment,
  where_action,
}) => {
  const headerTitle = flag === 1 ? "Stock Adjustment" : "Edit Stock Adjustment";
  const [selected, setSelected] = useState<StockProduct[]>([]);
  const [isProductGridShow, setIsProductGridShow] = useState<boolean>(true);

  const [stockDetailList, setStockDetailList] = useState<IStockDetailList>({
    stock_adjustment_type: null,
    stock_date: null as any,
    stock_remark: "",
  });

  const canViewStockAdjustment = useCheckUserPermission(
    PAGE_ID.STOCK_ADJUSTMENT,
    PERMISSION_TYPE.VIEW,
  );
  const canAddStockAdjustment = useCheckUserPermission(
    PAGE_ID.STOCK_ADJUSTMENT,
    PERMISSION_TYPE.ADD,
  );

  const handleSelect = useCallback((product: StockProduct) => {
    setSelected((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      if (exists) return prev;
      return [...prev, product];
    });
  }, []);

  const handleDeleteById = (pId: number) => {
    setSelected((prev) => prev.filter((p) => p.id !== pId));
  };

  const handleHide = () => {
    onHide();
  };

  useEscapeKey(handleHide);

  useEffect(() => {
    setStockDetailList({
      stock_adjustment_type: null,
      stock_date: null as any,
      stock_remark: "",
    });
    setSelected([]);
  }, []);

  const handleStockSubmit = async (stockItemList: IStockItemList[]) => {
    try {
      if (!canAddStockAdjustment) {
        toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        return;
      }

      if (!stockDetailList.stock_adjustment_type?.value) {
        toast.error("Select Stock Adjustment type");
        return;
      }
      if (!stockDetailList.stock_date) {
        toast.error("Select Date");
        return;
      }
      const stockDetailListSubmit: IStockDetailListSubmit = {
        stock_adjustment_type: stockDetailList.stock_adjustment_type?.value,
        stock_date: stockDetailList.stock_date.format("YYYY-MM-DD"),
        stock_remark: stockDetailList.stock_remark,
      };
      await insertStock(
        stockDetailListSubmit,
        stockItemList,
        where_action,
        setRefreshStockAdjustment,
        handleHide,
      );
    } catch (err) {
      toast.error("Failed to submit");
    }
  };

  return (
    <div>
      {show && (
        <div className="modal1">
          <div
            className="modal-content1 "
            style={{
              width: "95vw",
              height: "95vh",
              backgroundColor: "var(--side)",
              marginTop: "10px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div className="row">
              <div className="col-10">
                <RibbonBanner
                  style={{
                    position: "absolute",
                    left: "26px",
                    top: "10px",
                  }}
                >
                  {headerTitle}
                </RibbonBanner>
              </div>
              <div className="col-2">
                <div className="d-flex align-items-center justify-content-end">
                  <span
                    className="close ms-3 pb-3"
                    onClick={() => handleHide()}
                  >
                    ×
                  </span>
                </div>
              </div>
            </div>

            {canViewStockAdjustment ? (
              <StockDetails
                setStockDetailList={setStockDetailList}
                stockDetailList={stockDetailList}
              />
            ) : (
              <p>{DEFAULT_MESSAGE_ERROR_PERMISSION}</p>
            )}

            <hr />
            <div
              className="row"
              style={{
                margin: "5px 0 15px 0",
                flex: 1,
                minHeight: 0,
              }}
            >
              {canViewStockAdjustment ? (
                <div
                  className="d-flex gap-2"
                  style={{
                    height: "100%",
                    overflow: "hidden",
                  }}
                >
                  <div
                    className={`col-md-${isProductGridShow ? "7" : "12"} border-end d-flex flex-column`}
                    style={{ height: "100%" }}
                  >
                    <h6>Selected Products</h6>
                    <StockAdjustmentSelectedProducts
                      products={selected}
                      stock_type={
                        stockDetailList.stock_adjustment_type?.value || 0
                      }
                      onHide={onHide}
                      handleStockSubmit={handleStockSubmit}
                      handleDeleteById={handleDeleteById}
                      isProductGridShow={isProductGridShow}
                      setIsProductGridShow={setIsProductGridShow}
                      stockDetailList={stockDetailList}
                    />
                  </div>

                  {isProductGridShow && (
                    <div
                      className="col-md-5 d-flex flex-column"
                      style={{ height: "100%" }}
                    >
                      <h6>Product List</h6>
                      <StockAdjustmentProductGrid
                        onSelect={handleSelect}
                        selected={selected}
                        isProductGridShow={isProductGridShow}
                        setIsProductGridShow={setIsProductGridShow}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <p>{DEFAULT_MESSAGE_ERROR_PERMISSION}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockAdjustmentModel;
