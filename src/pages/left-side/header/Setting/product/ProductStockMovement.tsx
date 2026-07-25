import React, { useEffect, useMemo, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { MultiValue } from "react-select";
import { toast } from "react-toastify";
import { formatDate } from "../../../../../common/SharedFunction";
import DateTimeRangePicker from "../../../../../components/DateTimeRangePicker";
import OrderCreateModal from "../../../../../components/model/OrderCreateModel/OrderCreateModal";
import MultiSelect from "../../../../../components/MultiSelect";
import { DEFAULT_STATUS_CODE_SUCCESS } from "../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../helpers/AppType";
import { axiosInstance } from "../../../../../services/axiosInstance";
import { ITitle } from "../../../../dashboard/DashoardController";
import {
  fetchApiProductStockMovement,
  fetchwrehouse,
  IProductStockMovement,
  IProductView,
  productProductTypesList,
} from "./ProductController";

interface OptionType {
  value: string | number;
  label: string;
}

export interface TeamMember {
  id: string | number;
  username: string;
}

const ProductStockMovement = ({
  show,
  onHide,
  passDataInAddItem,
}: {
  show: boolean;
  onHide: () => void;

  passDataInAddItem: IProductView | undefined;
}) => {
  const initialAssignedWarehouseIds = "";

  const [warehouseList, setWarehouseList] = useState<any[]>([]);
  const [selectedWarehouses, setSelectedWarehouses] = useState<OptionType[]>(
    [],
  );
  const [warehouseLoading, setWarehouseLoading] = useState(false);
  const [isInnerActive, setIsInnerActive] = useState<boolean>(true);
  const [isOuterActive, setIsOuterActive] = useState<boolean>(true);
  const [isOrderCreateFromContactShow, setIsOrderCreateFromContactShow] =
    useState(false);
  const [contactInfoOrder, setContactInfoOrder] = useState<any>(null);
  const [isOrderShowFromContactType, setIsOrderShowFromContactType] =
    useState<any>(null);
  const [title, setTitle] = useState<ITitle[]>([]);
  const [viewFormate, setViewFormate] = useState<number>(0);

  useEffect(() => {
    fetchCompany(setTitle);
  }, [setTitle]);

  useEffect(() => {
    const handleKeyDown = (event: any) => {
      if (event.key === "Enter") {
        event.preventDefault(); // Prevent default behavior for Enter key
      }
    };

    if (show) {
      document.addEventListener("keydown", handleKeyDown);
    } else {
      document.removeEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [show]);
  const [productStockMovement, setProductStockMovement] = useState<
    IProductStockMovement[]
  >([]);
  const [closingQty, setClosingQty] = useState(0);
  const [openQty, setOpenQty] = useState(0);

  const getCurrentMonthRange = (): Date[] => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1); // First day of the month
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of the month
    return [startOfMonth, endOfMonth];
  };

  const fetchCompany = async (setTitle: TReactSetState<ITitle[]>) => {
    const uuid = localStorage.getItem("UUID");
    const requestData = {
      table: "company_masters",
      columns:
        "order_title,invoice_title,quotation_title,purchase_title,purchase_order_title,workorder_title,id,invoice_view_formate,order_view_formate,quotation_view_formate,purchase_view_formate,workorder_view_formate,purchase_order_view_formate,inward_title,dispatch_title,inward_view_formate,dispatch_view_formate",
      where: JSON.stringify({ a_application_login_id: uuid }),
      request_flag: 2,
    };
    try {
      const response = await axiosInstance.post("mainCommonGet", requestData);
      if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setTitle(response.data.data || []);
      } else {
        toast.error(response.data.ack_msg || DEFAULT_STATUS_CODE_SUCCESS);
        setTitle([]);
        return "";
      }
    } catch (error: any) {
      console.error("Error fetching currencyID: ", error);
      toast.error(error || DEFAULT_STATUS_CODE_SUCCESS);
      return "";
    }
  };

  const [selectDate, setSelectDate] = useState<Date[]>(getCurrentMonthRange);
  const selectedWarehouseIds = selectedWarehouses
    .map((item) => String(item.value))
    .join(",");

  const datePickerRef = useRef<any>(null);
  // Update the main useEffect
  useEffect(() => {
    if (!passDataInAddItem?.id) return;

    fetchApiProductStockMovement(
      setProductStockMovement,
      passDataInAddItem.id,
      selectDate,
      setClosingQty,
      setOpenQty,
      selectedWarehouseIds,
      setIsInnerActive,
      setIsOuterActive, // ← pass it here
    );
  }, [passDataInAddItem?.id, selectDate, selectedWarehouseIds]); // ← add selectDate here
  useEffect(() => {
    fetchwrehouse(setWarehouseList, setWarehouseLoading);
  }, []);

  const handelSearchDateChange = (selectedDates: Date[] | undefined) => {
    setSelectDate(selectedDates || []);
    fetchApiProductStockMovement(
      setProductStockMovement,
      passDataInAddItem?.id,
      selectedDates,
      setClosingQty,
      setOpenQty,
      selectedWarehouseIds,
      setIsInnerActive,
      setIsOuterActive,
    );
  };

  const handleOpenOrderModal = (item: IProductStockMovement) => {
    setContactInfoOrder(item);

    setIsOrderShowFromContactType(item.cart_type);

    const companyData = title?.[0];

    let selectedViewFormat = 0;

    switch (Number(item.cart_type)) {
      case 1:
        selectedViewFormat = Number(companyData?.quotation_view_formate || 1);
        break;

      case 2:
        selectedViewFormat = Number(companyData?.order_view_formate || 1);
        break;

      case 3:
        selectedViewFormat = Number(companyData?.invoice_view_formate || 1);
        break;

      case 4:
        selectedViewFormat = Number(companyData?.purchase_view_formate || 1);
        break;

      case 5:
        selectedViewFormat = Number(
          companyData?.purchase_order_view_formate || 1,
        );
        break;

      case 6:
        selectedViewFormat = Number(
          companyData?.return_sales_invoice_view_formate || 1,
        );
        break;

      case 7:
        selectedViewFormat = Number(
          companyData?.return_purchase_invoice_view_formate || 1,
        );
        break;

      case 8:
        selectedViewFormat = Number(companyData?.inward_view_formate || 1);
        break;
      case 9:
        selectedViewFormat = Number(companyData?.dispatch_view_formate || 1);
        break;

      default:
        selectedViewFormat = 0;
        break;
    }

    setViewFormate(selectedViewFormat);

    setIsOrderCreateFromContactShow(true);
  };

  const warehouseOptions: OptionType[] = useMemo(() => {
    return warehouseList
      .filter((warehouse) => warehouse.id && warehouse.warehouse_name)
      .map((warehouse) => ({
        value: warehouse.id,
        label: warehouse.warehouse_name,
      }));
  }, [warehouseList]);

  useEffect(() => {
    if (!show) return;

    if (initialAssignedWarehouseIds && warehouseOptions.length > 0) {
      const ids = String(initialAssignedWarehouseIds)
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id);

      const initialSelected = warehouseOptions.filter((opt) =>
        ids.includes(String(opt.value)),
      );

      setSelectedWarehouses(initialSelected);
    } else {
      setSelectedWarehouses([]);
    }
  }, [show, warehouseOptions]);

  const handleChangeWarehouse = (selected: MultiValue<OptionType>) => {
    const selectedArray = selected as OptionType[];
    const data = selectedArray.map((item) => item.value);

    setSelectedWarehouses(selectedArray);

    // If you need IDs for API:
    console.log("Selected Warehouse IDs:", data);
  };

  const handleIconClick = () => {
    const input = datePickerRef.current?.querySelector("input");
    input?.focus();
  };

  return (
    <React.Fragment>
      {show && (
        <div className="modal1 ">
          <div
            className="modal-content1"
            style={{ maxHeight: "80%", width: "70%" }}
          >
            <span className="close" onClick={onHide}>
              &times;
            </span>
            <h2 className="modal-title1 form_header_text">
              Product Stock Summary of {passDataInAddItem?.product_name}
            </h2>
            <div className={`m-title-2 col-12 `}>
              <div className="head">
                <div className="row">
                  <div className="col-md-4 col-sm-12">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "5px",
                        flexWrap: "wrap",
                        marginBottom: "10px",
                      }}
                      ref={datePickerRef}
                    >
                      <DateTimeRangePicker
                        value={selectDate}
                        onChange={handelSearchDateChange}
                        showTime={false} // Disable time selection
                        numberOfMonthsShow={1}
                      />
                      <span className="p-1" onClick={handleIconClick}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          height="22px"
                          viewBox="0 -960 960 960"
                          width="22px"
                          fill="#5f6368"
                        >
                          <path d="M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Zm0 0v-80 80Zm280 240q-17 0-28.5-11.5T440-440q0-17 11.5-28.5T480-480q17 0 28.5 11.5T520-440q0 17-11.5 28.5T480-400Zm-160 0q-17 0-28.5-11.5T280-440q0-17 11.5-28.5T320-480q17 0 28.5 11.5T360-440q0 17-11.5 28.5T320-400Zm320 0q-17 0-28.5-11.5T600-440q0-17 11.5-28.5T640-480q17 0 28.5 11.5T680-440q0 17-11.5 28.5T640-400ZM480-240q-17 0-28.5-11.5T440-280q0-17 11.5-28.5T480-320q17 0 28.5 11.5T520-280q0 17-11.5 28.5T480-240Zm-160 0q-17 0-28.5-11.5T280-280q0-17 11.5-28.5T320-320q17 0 28.5 11.5T360-280q0 17-11.5 28.5T320-240Zm320 0q-17 0-28.5-11.5T600-280q0-17 11.5-28.5T640-320q17 0 28.5 11.5T680-280q0 17-11.5 28.5T640-240Z" />
                        </svg>
                      </span>
                    </div>
                  </div>
                  <div className="col-md-3 col-sm-12">
                    {/* <label htmlFor="">Warehouse</label> */}
                    <div className="w-100">
                      {warehouseLoading ? (
                        <Skeleton width="100%" height={42} />
                      ) : (
                        <MultiSelect
                          options={warehouseOptions}
                          value={selectedWarehouses}
                          onChange={handleChangeWarehouse}
                          isSelectAll={true}
                          menuPlacement="bottom"
                          menuStyle={{
                            left: "90%",
                            right: "auto",
                            transform: "none",
                            height: "42px",
                          }}
                          isMulti
                          isClearable={selectedWarehouses.length > 0}
                          placeholder="Select warehouses..."
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="source-of-type-list-grid-block">
                  <div
                    className="source-of-type-list-grid-main"
                    style={{ maxHeight: "55vh", overflowX: "scroll" }}
                  >
                    <table className="table table-hover" border={0}>
                      <thead
                        style={{
                          position: "sticky",
                          top: 0,
                          // zIndex: 1000,
                          backgroundColor: "white",
                        }}
                      >
                        <tr style={{ backgroundColor: "#dee2e6" }}>
                          <th></th>
                          <th></th>

                          <th>Opening Quantity : </th>
                          {isOuterActive && <th></th>}
                          {isInnerActive && <th></th>}
                          <th></th>
                          <th className="text-end">
                            {openQty} / {passDataInAddItem?.unit}
                          </th>
                          <th></th>
                          <th></th>
                        </tr>
                        <tr>
                          <th className="">Date</th>
                          <th className="text-start">Contact Name</th>
                          <th>Type</th>
                          <th>Reference</th>
                          {isOuterActive && (
                            <th className="text-end">Outer Qty</th>
                          )}
                          {isInnerActive && (
                            <th className="text-end">Inner Qty</th>
                          )}
                          <th className="text-end">Qty</th>
                          <th className="text-center">Status</th>
                          <th className="text-center">Value</th>
                        </tr>
                      </thead>
                      <tbody className="text-center">
                        {productStockMovement.length !== 0 ? (
                          <>
                            {productStockMovement &&
                              productStockMovement.map((item, index) => (
                                <tr key={index}>
                                  <td className="text-start">
                                    <span>
                                      {item.cart_date
                                        ? formatDate(item.cart_date)
                                        : ""}
                                    </span>
                                  </td>
                                  <td className="text-start">
                                    {item.to_customer_name}
                                  </td>
                                  <td className="text-start">
                                    <span>
                                      {
                                        productProductTypesList.find(
                                          (OrdItem) =>
                                            Number(OrdItem.id) ===
                                            Number(item.cart_type),
                                        )?.order_type
                                      }
                                    </span>
                                  </td>
                                  <td className="text-start">
                                    <span
                                      style={{
                                        color: "#0d6efd",
                                        cursor: "pointer",
                                        textDecoration: "underline",
                                      }}
                                      onClick={() => handleOpenOrderModal(item)}
                                    >
                                      {item.cart_number}
                                    </span>
                                  </td>
                                  {isOuterActive &&
                                    (item.item_outer_quantity ? (
                                      <td className="text-end">
                                        <span>
                                          {item.item_outer_quantity} /{" "}
                                          {item?.outer_qty_unit}
                                        </span>
                                      </td>
                                    ) : (
                                      <td></td>
                                    ))}
                                  {isInnerActive &&
                                    (item.item_inner_quantity ? (
                                      <td className="text-end">
                                        <span>
                                          {item.item_inner_quantity} /{" "}
                                          {item?.inner_qty_unit}
                                        </span>
                                      </td>
                                    ) : (
                                      <td></td>
                                    ))}
                                  <td className="text-end">
                                    <span>
                                      {item.item_qty ? item.item_qty : ""} /{" "}
                                      {passDataInAddItem?.unit}
                                    </span>
                                  </td>
                                  <td className="text-center">
                                    <span>
                                      {item.cart_type === 4 ||
                                      item.cart_type === 6 ||
                                      item.cart_type === 8 ||
                                      item.cart_type === 10
                                        ? "In"
                                        : "Out"}
                                    </span>
                                  </td>
                                  <td className="text-end">
                                    <span>{item.item_total.toFixed(2)}</span>
                                  </td>
                                </tr>
                              ))}
                          </>
                        ) : (
                          <p className="text-center">No Records Found.</p>
                        )}
                      </tbody>

                      <tfoot
                        style={{
                          position: "sticky",
                          bottom: 0,
                          backgroundColor: "#fff",
                          zIndex: 10,
                        }}
                      >
                        <tr style={{ backgroundColor: "#dee2e6" }}>
                          <td></td>
                          <td></td>
                          <td>
                            <b>Closing Quantity :</b>
                          </td>
                          {isOuterActive && <td></td>}
                          {isInnerActive && <td></td>}
                          <td></td>
                          <td className="text-end">
                            <b>
                              {closingQty} / {passDataInAddItem?.unit}
                            </b>
                          </td>
                          <td></td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {isOrderCreateFromContactShow && (
        <OrderCreateModal
          show={isOrderCreateFromContactShow}
          onHide={() => {
            setIsOrderCreateFromContactShow(false);
          }}
          handleSubmit={() => setIsOrderCreateFromContactShow(false)}
          title={"Edit/View"}
          message={"Please Enter Your Order Details"}
          btn1={"CANCEL"}
          btn2={"Approve"}
          Contact={contactInfoOrder}
          isOrderShowNum={isOrderShowFromContactType}
          isOrderViewFormate={viewFormate}
          orderId={contactInfoOrder?.cart_id}
          orderById={contactInfoOrder?.cart_id}
        />
      )}
    </React.Fragment>
  );
};

export default ProductStockMovement;
