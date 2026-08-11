import React, { useEffect, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import DatePicker, { DateObject } from "react-multi-date-picker";
import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS } from "../../../helpers/AppConstants";
import { TReactSetState } from "../../../helpers/AppType";
import {
  fetchMiracleAccountLedger,
  IAccountLedgerFromMiracleOptions,
} from "../../../pages/right-side/create-account-transaction/CreateAccountTransactionController";
import { axiosInstance } from "../../../services/axiosInstance";
import useMiracleFlagStore from "../../../store/miracle/useMiracleFlagStore";
import CustomSearchDropdown from "../../CustomSearchDropdown";
import { useTheme } from "../../ThemeContext";
import { gettemplate } from "../workflowConformatioModel/workFlowModelController";
interface ICustomSeriesValue {
  customSeriesNumber: string | null | undefined;
  customSeriesDate: string | null | undefined;
}
const ApproveModel = ({
  show,
  onHide,
  handleSubmit,
  handleReject,
  title,
  message,
  message1,
  btn1 = "yes",
  btn2 = "no",
  btn3,
  checkBox,
  orderType,
  isoption,
  drop1,
  opt1,
  opt2,
  opt3,
  opt4,
  opt5,
  opt6,
  opt5NoteText,
  showPermission,
  permissionText,
  showTaskTemplateFor,
  showOrderId,
  setWorkFlowFor,
  loading,
  setButtonloding,
  defaultSeriesValue,
  isDisabledSeries,
  defaultCustomSeriesValue,
  transaction_mode,
  miracle_account_legder,
}: {
  show: boolean;
  onHide: () => void;
  handleSubmit: (
    checkedOptions?: string[],
    dropdownValue?: any,
    selectedSeries?: any,
    customSeriesNumber?: string,
    customSeriesDate?: DateObject,
    selectedTrasactionMode?: string,
    selectedMiracleLedger?: string,
  ) => void;
  title: string;
  message?: string;
  message1?: string;
  handleReject?: (
    checkedOptions?: string[],
    dropdownValue?: any,
    selectedSeries?: any,
  ) => void;
  btn1: string;
  btn2: string;
  btn3?: string;
  checkBox?: boolean;
  orderType?: number;
  isoption?: boolean;
  drop1?: string;
  opt1?: string;
  opt2?: string;
  opt3?: string;
  opt4?: string;
  opt5?: string;
  opt6?: string;
  opt5NoteText?: string;
  showPermission?: boolean;
  permissionText?: string;
  showTaskTemplateFor?: number;
  showOrderId?: number;
  setWorkFlowFor?: string;
  loading?: boolean;
  setButtonloding: (value: boolean) => void;
  defaultSeriesValue?: string; // Add this in interface
  isDisabledSeries?: boolean;
  defaultCustomSeriesValue?: ICustomSeriesValue;
  transaction_mode?: string;
  miracle_account_legder?: string;
}) => {
  const { darkMode } = useTheme();
  const modalThemeClass = darkMode ? "modal-light-1" : "modal-light-1";
  const modalThemeClass1 = darkMode ? "modal-dark" : "modal-light-1";
  const [permissionChecked, setPermissionChecked] = React.useState(false);

  const [dropdownData, setDropdownData] = useState<any[]>([]);
  const [allSeries, setAllSeries] = useState<any>(null);
  const [selectedSeries, setSelectedSeries] = useState<any>(null);
  const [selectedDropdown, setSelectedDropdown] = useState<any>(null);
  const [selectedOptions, setSelectedOptions] = useState<{
    opt1: boolean;
    opt2: boolean;
    opt3: boolean;
    opt4: boolean;
    opt5: boolean;
    opt6: boolean;
  }>({
    opt1: true,
    opt2: false,
    opt3: false,
    opt4: false,
    opt5: false,
    opt6: false,
  });

  const [selectedTrasactionMode, setSelectedTrasactionMode] =
    useState(transaction_mode);

  const [customSeriesNumber, setCustomSeriesNumber] = useState<string>(
    defaultCustomSeriesValue?.customSeriesNumber || "",
  );
  const [customSeriesDate, setCustomSeriesDate] = useState<
    DateObject | undefined
  >(
    defaultCustomSeriesValue?.customSeriesDate
      ? new DateObject({
        date: defaultCustomSeriesValue?.customSeriesDate,
        format: "YYYY-MM-DD",
      })
      : undefined,
  );
  const [srNumberGenerateFlag, setSrNumberGenerateFlag] = useState<number>();
  const selectDropdown = dropdownData.map((WeeklyDays: any) => ({
    value: WeeklyDays.id,
    label: WeeklyDays.name,
  }));
  const [seriesDropdownData, setSeriesDropdownData] = useState<any[]>([]);

  const [accountLedgerFromMiracle, setAccountLedgerFromMiracle] = useState<
    IAccountLedgerFromMiracleOptions[]
  >([]);

  const isFeatureEnabled = useMiracleFlagStore(
    (state) => state.isFeatureEnabled,
  );
  const [selectedMiracleLedger, setSelectedMiracleLedger] = useState<
    IAccountLedgerFromMiracleOptions | any
  >(miracle_account_legder ? { value: miracle_account_legder } : "");
  const renderMessage = (msg?: string) => {
    if (!msg) return null;

    const lines = msg.split("<br>");
    return lines.map((line, index) => {
      const linkMatch = line.match(/<a href="([^"]+)">([^<]+)<\/a>/);
      if (linkMatch) {
        return (
          <div
            key={index}
            className={`m-title-2 ${modalThemeClass}`}
            style={{ marginBottom: "8px" }}
          >
            <a href={linkMatch[1]} target="_blank" rel="noopener noreferrer">
              {linkMatch[2]}
            </a>
          </div>
        );
      }

      if (line.trim() === "") {
        return <br key={index} />;
      }
      return (
        <div
          key={index}
          className={`m-title-2 ${modalThemeClass}`}
          style={{ marginBottom: "8px" }}
        >
          {line.trim()}
        </div>
      );
    });
  };

  const handleTrasactionModeChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setSelectedTrasactionMode(e.target.value);
    setAccountLedgerFromMiracle([]);
    setSelectedMiracleLedger(null);
    if (isFeatureEnabled) {
      fetchMiracleAccountLedger(
        setAccountLedgerFromMiracle,
        null,
        e.target.value,
      );
    }
  };

  useEffect(() => {
    if (selectedTrasactionMode && isFeatureEnabled) {
      fetchMiracleAccountLedger(
        setAccountLedgerFromMiracle,
        null,
        selectedTrasactionMode,
      );
    }
  }, [selectedTrasactionMode]);

  const getPrifix = async (setAllSeries: TReactSetState<any[]>) => {
    const uuid = localStorage.getItem("UUID");
    const activeCompanyId = localStorage.getItem("COMPANY_ID");
    const isValidCompanyId =
      activeCompanyId &&
      activeCompanyId !== "undefined" &&
      activeCompanyId !== "null" &&
      Number(activeCompanyId) > 0;

    const whereClause = isValidCompanyId
      ? JSON.stringify({ id: Number(activeCompanyId), isDelete: 0 })
      : JSON.stringify({ a_application_login_id: uuid, isDelete: 0 });

    const requestData = {
      table: "company_masters",
      columns:
        "order_prefix,return_sales_invoice_prefix,invoice_prefix,quotation_prefix,purchase_prefix,purchase_ord_prefix,return_purchase_invoice_prefix,inward_prefix,dispatch_prefix,workorder_prefix,id,quotation_sr_number_generate_flag,order_sr_number_generate_flag,sales_invoice_sr_number_generate_flag,return_sales_invoice_sr_number_generate_flag,purchase_order_sr_number_generate_flag,purchase_invoice_sr_number_generate_flag,return_purchase_invoice_sr_number_generate_flag,inward_sr_number_generate_flag,dispatch_sr_number_generate_flag,proforma_invoice_prefix,proforma_invoice_sr_number_generate_flag",
      where: whereClause,
      request_flag: 2,
    };
    try {
      const response = await axiosInstance.post("mainCommonGet", requestData);
      if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        if (orderType == 1) {
          // setAllSeries(response.data.data[0].quotation_prefix || ["QUO"]);
          // setSrNumberGenerateFlag(
          //   response.data.data[0].quotation_sr_number_generate_flag || 0,
          // );
          const quoPrefix = response.data.data[0].quotation_prefix || "QUO";

          setAllSeries(quoPrefix);

          setSrNumberGenerateFlag(
            response.data.data[0].quotation_sr_number_generate_flag || 0,
          );

          const prefixes = quoPrefix.split(",").map((v: string) => v.trim());

          getSeriesLastNumber(prefixes);
        }
        if (orderType == 2) {
          const orderPrefix = response.data.data[0].order_prefix || "ORD";

          setAllSeries(orderPrefix);

          setSrNumberGenerateFlag(
            response.data.data[0].order_sr_number_generate_flag || 0,
          );

          const prefixes = orderPrefix.split(",").map((v: string) => v.trim());

          getSeriesLastNumber(prefixes);
        }
        if (orderType == 3) {
          const invoicePrefix = response.data.data[0].invoice_prefix || "INV";

          setAllSeries(invoicePrefix);

          setSrNumberGenerateFlag(
            response.data.data[0].sales_invoice_sr_number_generate_flag || 0,
          );

          const prefixes = invoicePrefix
            .split(",")
            .map((v: string) => v.trim());

          getSeriesLastNumber(prefixes);
        }
        if (orderType == 4) {
          // setAllSeries(response.data.data[0].purchase_prefix || ["PI"]);
          // setSrNumberGenerateFlag(
          //   response.data.data[0].purchase_invoice_sr_number_generate_flag || 0,
          // );

          const purchaseINVPrefix =
            response.data.data[0].purchase_prefix || "PI";

          setAllSeries(purchaseINVPrefix);

          setSrNumberGenerateFlag(
            response.data.data[0].purchase_invoice_sr_number_generate_flag || 0,
          );

          const prefixes = purchaseINVPrefix
            .split(",")
            .map((v: string) => v.trim());

          getSeriesLastNumber(prefixes);
        }
        if (orderType == 5) {
          // setAllSeries(response.data.data[0].purchase_ord_prefix || ["PO"]);
          // setSrNumberGenerateFlag(
          //   response.data.data[0].purchase_order_sr_number_generate_flag || 0,
          // );
          const purchaseORDPrefix =
            response.data.data[0].purchase_ord_prefix || "PO";

          setAllSeries(purchaseORDPrefix);

          setSrNumberGenerateFlag(
            response.data.data[0].purchase_order_sr_number_generate_flag || 0,
          );

          const prefixes = purchaseORDPrefix
            .split(",")
            .map((v: string) => v.trim());

          getSeriesLastNumber(prefixes);
        }
        if (orderType == 6) {
          // setAllSeries(
          //   response.data.data[0].return_sales_invoice_prefix || ["RSI"],
          // );
          // setSrNumberGenerateFlag(
          //   response.data.data[0]
          //     .return_sales_invoice_sr_number_generate_flag || 0,
          // );
          const returnSalesINVPrefix =
            response.data.data[0].return_sales_invoice_prefix || "RSI";

          setAllSeries(returnSalesINVPrefix);

          setSrNumberGenerateFlag(
            response.data.data[0]
              .return_sales_invoice_sr_number_generate_flag || 0,
          );

          const prefixes = returnSalesINVPrefix
            .split(",")
            .map((v: string) => v.trim());

          getSeriesLastNumber(prefixes);
        }
        if (orderType == 7) {
          // setAllSeries(
          //   response.data.data[0].return_purchase_invoice_prefix || ["RPI"],
          // );
          // setSrNumberGenerateFlag(
          //   response.data.data[0]
          //     .return_purchase_invoice_sr_number_generate_flag || 0,
          // );
          const returnPurchaseINVPrefix =
            response.data.data[0].return_purchase_invoice_prefix || "RPI";

          setAllSeries(returnPurchaseINVPrefix);

          setSrNumberGenerateFlag(
            response.data.data[0]
              .return_purchase_invoice_sr_number_generate_flag || 0,
          );

          const prefixes = returnPurchaseINVPrefix
            .split(",")
            .map((v: string) => v.trim());

          getSeriesLastNumber(prefixes);
        }
        if (orderType == 8) {
          // setAllSeries(response.data.data[0].inward_prefix || ["GRN"]);
          // setSrNumberGenerateFlag(
          //   response.data.data[0].inward_sr_number_generate_flag || 0,
          // );
          const inwardPrefix = response.data.data[0].inward_prefix || "GRN";

          setAllSeries(inwardPrefix);

          setSrNumberGenerateFlag(
            response.data.data[0].inward_sr_number_generate_flag || 0,
          );

          const prefixes = inwardPrefix.split(",").map((v: string) => v.trim());

          getSeriesLastNumber(prefixes);
        }
        if (orderType == 9) {
          // setAllSeries(response.data.data[0].dispatch_prefix || ["DIS"]);
          // setSrNumberGenerateFlag(
          //   response.data.data[0].dispatch_sr_number_generate_flag || 0,
          // );

          const dispatchPrefix = response.data.data[0].dispatch_prefix || "DIS";

          setAllSeries(dispatchPrefix);

          setSrNumberGenerateFlag(
            response.data.data[0].dispatch_sr_number_generate_flag || 0,
          );

          const prefixes = dispatchPrefix
            .split(",")
            .map((v: string) => v.trim());

          getSeriesLastNumber(prefixes);
        }
        if (orderType == 12) {
          // setAllSeries(response.data.data[0].dispatch_prefix || ["DIS"]);
          // setSrNumberGenerateFlag(
          //   response.data.data[0].dispatch_sr_number_generate_flag || 0,
          // );

          const dispatchPrefix =
            response.data.data[0].proforma_invoice_prefix || "PRF";

          setAllSeries(dispatchPrefix);

          setSrNumberGenerateFlag(
            response.data.data[0].proforma_invoice_sr_number_generate_flag || 0,
          );

          const prefixes = dispatchPrefix
            .split(",")
            .map((v: string) => v.trim());

          getSeriesLastNumber(prefixes);
        }
      } else {
        toast.error(response.data.ack_msg || "Failed to fetch company data");
        setAllSeries([]);
      }
    } catch (error: any) {
      console.error("Error fetching company data: ", error);
      toast.error("Error fetching company data");
    }
  };

  useEffect(() => {
    getPrifix(setAllSeries);
    gettemplate(showTaskTemplateFor && showTaskTemplateFor, setDropdownData);
  }, [showTaskTemplateFor]);

  useEffect(() => {
    if (!miracle_account_legder || accountLedgerFromMiracle.length === 0)
      return;

    const preSelected = accountLedgerFromMiracle.find(
      (item) =>
        item.value?.toString() === miracle_account_legder?.toString() ||
        item.label?.toString() === miracle_account_legder?.toString(),
    );

    if (preSelected) {
      setSelectedMiracleLedger(preSelected);
      // console.log("Pre-selected Miracle Ledger:", preSelected);
    }
  }, [accountLedgerFromMiracle, miracle_account_legder]);

  const getSeriesLastNumber = async (prefixes: string[]) => {
    try {
      const getUUID = await localStorage.getItem("UUID");
      const response = await axiosInstance.post("getSeriesLastNumber", {
        a_application_login_id: getUUID,
        order_type: orderType,
        prefixes: prefixes,
      });

      if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setSeriesDropdownData(response.data.data || []);
      }
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    if (seriesDropdownData.length > 0) {
      const selectedItem =
        seriesDropdownData.find((item) => item.prefix === defaultSeriesValue) ||
        seriesDropdownData[0];

      setSelectedSeries({
        value: selectedItem.prefix,
        label:
          selectedItem.last_sr_no > 0
            ? `${selectedItem.prefix} - ${selectedItem.last_sr_no}`
            : selectedItem.prefix,
      });
    }
  }, [seriesDropdownData, defaultSeriesValue]);

  const handleSubmits = () => {
    const checkedOptions = Object.entries(selectedOptions)
      .filter(([key, value]) => value === true)
      .map(([key]) => key);

    if (srNumberGenerateFlag == 1) {
      if (!customSeriesNumber) {
        toast.error("Please enter series number");
        return;
      }
      if (!customSeriesDate) {
        toast.error("Please Select date");
        return;
      }
    }

    if (selectedOptions.opt5 && selectedDropdown == null) {
      toast.error("Please Select Template");
      return;
    }

    setButtonloding(true);

    handleSubmit(
      checkedOptions,
      selectedDropdown,
      selectedSeries,
      customSeriesNumber,
      customSeriesDate,
      selectedTrasactionMode,
      selectedMiracleLedger?.value || "",
    );
  };

  const handleOptionChange = (option: keyof typeof selectedOptions) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [option]: !prev[option],
    }));

    if (option === "opt5" && selectedOptions.opt5) {
      setSelectedDropdown(null);
    }
  };

  const selectSeriesDropdown = seriesDropdownData.map((item: any) => ({
    value: item.prefix,
    label:
      item.last_sr_no && Number(item.last_sr_no) > 0
        ? `${item.prefix} - ${item.last_sr_no}`
        : item.prefix,
  }));

  const handleCustomSeriesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value || "";
    setCustomSeriesNumber(value);
  };
  const handleMiracleAccountLedgerChange = (
    selectedOption: IAccountLedgerFromMiracleOptions | null,
  ) => {
    setSelectedMiracleLedger(selectedOption);
  };
  return (
    <React.Fragment>
      <Modal show={show} onHide={onHide} centered className={modalThemeClass1}>
        <div className={`p-10 m-title ${modalThemeClass}`}>{title}</div>
        <Modal.Body className={`${modalThemeClass}`}>
          {message ? (
            <>
              <div>{renderMessage(message)}</div>
              {message1 && (
                <p className={`m-title-2 ${modalThemeClass}`}>{message1}</p>
              )}
            </>
          ) : (
            <span></span>
          )}
          {checkBox ? (
            <div className={`m-list checkbox`}>
              <input
                className="form-check-input-custom"
                type="checkbox"
                name="groupsRadios"
                value=""
                id="keep-starred-message"
              />
              <label
                className="form-check-label p-1"
                htmlFor="keep-starred-message"
              >
                <h4 className={`${modalThemeClass}`}> Keep Starred Message </h4>
              </label>
            </div>
          ) : (
            <span></span>
          )}
          {showPermission ? (
            <div className={`m-list checkbox`}>
              <input
                className="form-check-input-custom"
                type="checkbox"
                name="groupsRadios"
                value=""
                id="keep-starred-message"
                checked={permissionChecked}
                onChange={(e) => setPermissionChecked(e.target.checked)}
              />
              <label
                className="form-check-label p-1"
                htmlFor="keep-starred-message"
              >
                <h4 className={`${modalThemeClass}`}>{permissionText} </h4>
              </label>
            </div>
          ) : (
            <span></span>
          )}
          {drop1 ? (
            <div style={{ marginTop: "15px", marginBottom: "15px" }}>
              <div
                style={{
                  marginBottom: "8px",
                  fontSize: "15px",
                  fontWeight: "600",
                  color: "#333",
                }}
              >
                {srNumberGenerateFlag == 1
                  ? `Enter Series`
                  : `Select Cart Prefix`}
              </div>

              {srNumberGenerateFlag == 1 ? (
                <input
                  placeholder="Enter Series"
                  className="form-control"
                  type="text"
                  value={customSeriesNumber}
                  onChange={handleCustomSeriesChange}
                />
              ) : (
                <CustomSearchDropdown
                  placeholder="Search or select prefix"
                  options={selectSeriesDropdown}
                  value={selectedSeries}
                  onChange={(value: any) => setSelectedSeries(value)}
                  isDisabled={isDisabledSeries ? "disabled" : ""}
                />
              )}
              {srNumberGenerateFlag == 1 && (
                <>
                  <div
                    style={{
                      marginBottom: "8px",
                      fontSize: "15px",
                      fontWeight: "600",
                      color: "#333",
                    }}
                  >
                    Select Date
                  </div>
                  <div>
                    <DatePicker
                      value={customSeriesDate}
                      format="DD-MM-YYYY"
                      placeholder={`Select Date`}
                      inputClass={`form-control font-size-15 rounded-1`}
                      onChange={(date: DateObject) => setCustomSeriesDate(date)}
                    />
                  </div>
                </>
              )}
              {(orderType != 6 && orderType != 7) && (
                <div>
                  <div
                    style={{
                      marginBottom: "8px",
                      fontSize: "15px",
                      fontWeight: "600",
                      color: "#333",
                    }}
                  >
                    Transaction Mode
                  </div>

                  <select
                    id="mode"
                    name="mode" // good for form libraries
                    className={`form-control`}
                    value={selectedTrasactionMode ?? ""}
                    onChange={handleTrasactionModeChange}
                  >
                    <option value={""} disabled hidden>
                      -- Select Trasaction Mode --
                    </option>

                    <option key={1} value={1}>
                      Cash Memo
                    </option>
                    <option key={2} value={2}>
                      Debit Memo
                    </option>
                  </select>
                </div>
              )}
              {isFeatureEnabled &&
                (orderType == 3 ||
                  orderType == 4 ||
                  orderType == 6 ||
                  orderType == 7) && (
                  <div>
                    <div
                      style={{
                        marginBottom: "8px",
                        fontSize: "15px",
                        fontWeight: "600",
                        color: "#333",
                      }}
                    >
                      Account Ledger From Miracle
                    </div>
                    <CustomSearchDropdown
                      options={accountLedgerFromMiracle}
                      value={selectedMiracleLedger}
                      onChange={(selectedOption: any) =>
                        handleMiracleAccountLedgerChange(selectedOption)
                      }
                    />
                  </div>
                )}
              <div
                style={{
                  marginTop: "10px",
                  backgroundColor: "#f0f8ff",
                  borderLeft: "4px solid #007bff",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  color: "#333",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "16px" }}>💡</span>
                <span>
                  Your invoice number will be generated using the selected
                  prefix.
                </span>
              </div>
            </div>
          ) : (
            ""
          )}

          {isoption ? (
            <div
              className={`${modalThemeClass}`}
              style={{ marginBottom: "20px" }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  padding: "10px 0",
                }}
              >
                {opt1 && (
                  <label
                    htmlFor="option-1"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      cursor: "not-allowed",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      transition: "background-color 0.2s",
                      backgroundColor: "rgba(0, 123, 255, 0.1)",
                      opacity: 0.7,
                    }}
                  >
                    <input
                      className="form-check-input-custom"
                      type="checkbox"
                      id="option-1"
                      checked={true}
                      disabled={true}
                      style={{ marginRight: "12px", cursor: "not-allowed" }}
                    />
                    <span style={{ fontSize: "15px", fontWeight: "500" }}>
                      {opt1}
                    </span>
                  </label>
                )}
                {opt2 && (
                  <label
                    htmlFor="option-2"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      transition: "background-color 0.2s",
                      backgroundColor: selectedOptions.opt2
                        ? "rgba(0, 123, 255, 0.1)"
                        : "transparent",
                    }}
                  >
                    <input
                      className="form-check-input-custom"
                      type="checkbox"
                      id="option-2"
                      checked={selectedOptions.opt2}
                      onChange={() => handleOptionChange("opt2")}
                      style={{ marginRight: "12px" }}
                    />
                    <span style={{ fontSize: "15px", fontWeight: "500" }}>
                      {opt2}
                    </span>
                  </label>
                )}
                {opt3 && (
                  <label
                    htmlFor="option-3"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      transition: "background-color 0.2s",
                      backgroundColor: selectedOptions.opt3
                        ? "rgba(0, 123, 255, 0.1)"
                        : "transparent",
                    }}
                  >
                    <input
                      className="form-check-input-custom"
                      type="checkbox"
                      id="option-3"
                      checked={selectedOptions.opt3}
                      onChange={() => handleOptionChange("opt3")}
                      style={{ marginRight: "12px" }}
                    />
                    <span style={{ fontSize: "15px", fontWeight: "500" }}>
                      {opt3}
                    </span>
                  </label>
                )}
                {opt4 && (
                  <label
                    htmlFor="option-4"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      transition: "background-color 0.2s",
                      backgroundColor: selectedOptions.opt4
                        ? "rgba(0, 123, 255, 0.1)"
                        : "transparent",
                    }}
                  >
                    <input
                      className="form-check-input-custom"
                      type="checkbox"
                      id="option-4"
                      checked={selectedOptions.opt4}
                      onChange={() => handleOptionChange("opt4")}
                      style={{ marginRight: "12px" }}
                    />
                    <span style={{ fontSize: "15px", fontWeight: "500" }}>
                      {opt4}
                    </span>
                  </label>
                )}
                {opt5 && (
                  <label
                    htmlFor="option-5"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      transition: "background-color 0.2s",
                      backgroundColor: selectedOptions.opt5
                        ? "rgba(0, 123, 255, 0.1)"
                        : "transparent",
                    }}
                  >
                    <input
                      className="form-check-input-custom"
                      type="checkbox"
                      id="option-5"
                      checked={selectedOptions.opt5}
                      onChange={() => handleOptionChange("opt5")}
                      style={{ marginRight: "12px" }}
                    />
                    <span style={{ fontSize: "15px", fontWeight: "500" }}>
                      {opt5}
                    </span>
                  </label>
                )}
                {opt6 && isFeatureEnabled && (
                  <label
                    htmlFor="option-6"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      transition: "background-color 0.2s",
                      backgroundColor: selectedOptions.opt6
                        ? "rgba(0, 123, 255, 0.1)"
                        : "transparent",
                    }}
                  >
                    <input
                      className="form-check-input-custom"
                      type="checkbox"
                      id="option-6"
                      checked={selectedOptions.opt6}
                      onChange={() => handleOptionChange("opt6")}
                      style={{ marginRight: "12px" }}
                    />
                    <span style={{ fontSize: "15px", fontWeight: "500" }}>
                      {opt6}
                    </span>
                  </label>
                )}
              </div>
            </div>
          ) : null}

          {/* Show dropdown only when option 5 is checked */}
          {selectedOptions.opt5 && (
            <div style={{ marginTop: "15px", marginBottom: "15px" }}>
              <CustomSearchDropdown
                placeholder="search or select template"
                options={selectDropdown}
                value={selectedDropdown}
                onChange={(value: any) => setSelectedDropdown(value)}
              />

              <div
                style={{
                  marginTop: "10px",
                  backgroundColor: "#f0f8ff",
                  borderLeft: "4px solid #007bff",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  color: "#333",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "16px" }}>💡</span>
                <span>{opt5NoteText}</span>
              </div>
            </div>
          )}

          <div className="d-flex justify-content-end modal-buttons">
            <Button className="modal-button1" onClick={onHide}>
              {btn1}
            </Button>
            {handleReject ? (
              <Button
                className="modal-button2"
                onClick={() => {
                  const checkedOptions = Object.entries(selectedOptions)
                    .filter(([key, value]) => value === true)
                    .map(([key]) => key);
                  handleReject(checkedOptions, selectedDropdown);
                }}
              >
                {btn2}
              </Button>
            ) : (
              <Button
                className="modal-button2"
                onClick={handleSubmits}
                disabled={(showPermission && !permissionChecked) || loading}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-1"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Processing...
                  </>
                ) : (
                  btn2
                )}
              </Button>
            )}
            {btn3 && (
              <Button className="modal-button2" onClick={handleSubmits}>
                {btn3}
              </Button>
            )}
          </div>
        </Modal.Body>
      </Modal>
    </React.Fragment>
  );
};

export default ApproveModel;
