import React from "react";
import { IStockDetailList } from "./StockAdjustmentController";
import { TReactSetState } from "../../../../../helpers/AppType";
import CustomSearchDropdown from "../../../../../components/CustomSearchDropdown";
import DatePicker, { DateObject } from "react-multi-date-picker";
import { SingleValue } from "react-select";
import { IOption } from "../../../../../helpers/AppInterface";
import { CSSObjectWithLabel } from "react-select";

interface Props {
  setStockDetailList: TReactSetState<IStockDetailList>;
  stockDetailList: IStockDetailList;
}

const StockDetails: React.FC<Props> = React.memo(
  ({ setStockDetailList, stockDetailList }) => {
    const stockTypeList = [
      { value: "1", label: "Warehouse To Warehouse Transfer" },
      { value: "2", label: "Warehouse adj. Add (+)" },
      { value: "3", label: "Warehouse adj. Deduct (-)" },
    ];

    const handleStockTypeChange = (selectedOption: SingleValue<IOption>) => {
      setStockDetailList((prev) => ({
        ...prev,
        stock_adjustment_type: selectedOption,
      }));
    };

    return (
      <div
        style={{
          display: "flex",
        }}
      >
        <div
          style={{
            // position: "relative",
            // width: "15%",
            zIndex: 1100,
            margin: "0 5px 0 0",
          }}
        >
          <label className="form-check-label" style={{ fontSize: "16px" }}>
            Stock Adjustment
          </label>
          <CustomSearchDropdown
            options={stockTypeList}
            value={stockDetailList?.stock_adjustment_type}
            onChange={handleStockTypeChange}
            className="w-100"
            placeholder="Select Adjustment Type..."
            styles={{
              padding: "4px",
              width: "21vw",
            }}
          />
        </div>
        <div
          style={{
            // position: "relative",
            width: "15%",
            margin: "0 5px 0 0",
          }}
        >
          <label className="form-check-label" style={{ fontSize: "16px" }}>
            Remark
          </label>
          <br />
          <textarea
            rows={1}
            className="form-control"
            onChange={(e) =>
              setStockDetailList((prev) => ({
                ...prev,
                stock_remark: e.target.value,
              }))
            }
          ></textarea>
        </div>
        <div
          style={{
            // position: "relative",
            width: "15%",
          }}
        >
          <label className="form-check-label" style={{ fontSize: "16px" }}>
            Transfer Date
          </label>
          <br />
          <DatePicker
            value={stockDetailList?.stock_date}
            onChange={(date: DateObject) =>
              setStockDetailList((prev) => ({
                ...prev,
                stock_date: date,
              }))
            }
            format="DD-MM-YYYY"
            placeholder={`Select Date`}
            inputClass={`form-control`}
          />
        </div>
      </div>
    );
  },
);

export default StockDetails;
