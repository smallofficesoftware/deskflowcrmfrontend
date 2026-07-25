import { useEffect, useState } from "react";
import { Button, Table } from "react-bootstrap";
import { toast } from "react-toastify";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../helpers/AppConstants";
import { TReactSetState } from "../../helpers/AppType";
import { IExpenseCreateStatus } from "../../pages/left-side/header/Setting/expense/create-expense/CreateExpenseController";
import CreateExpenseView from "../../pages/left-side/header/Setting/expense/create-expense/CreateExpenseView";
import { IExpenseView } from "../../pages/left-side/header/Setting/expense/ExpenseController";
import { axiosInstance } from "../../services/axiosInstance";
import { useTheme } from "../ThemeContext";

const ExpenseStatusUpdateModel = ({
  show,
  onHide,
  title,
  message,
  message1,
  btn1 = "yes",
  btn2 = "no",
  btn3,
  checkBox,
  isoption,
  opt1,
  opt2,
  opt3,
  teamId,
  date,
  setRefreshReport,
}: {
  show: boolean;
  onHide: () => void;
  title: string;
  message?: string;
  message1?: string;
  btn1: string;
  btn2: string;
  btn3?: string;
  checkBox?: boolean;
  isoption?: boolean;
  opt1?: string;
  opt2?: string;
  opt3?: string;
  teamId?: string | number | undefined;
  date?: string;
  setRefreshReport?: (value: boolean | number) => void;
}) => {
  const { darkMode } = useTheme();
  const modalThemeClass = darkMode ? "modal-light-1" : "modal-light-1";
  const modalThemeClass1 = darkMode ? "modal-dark" : "modal-light-1";
  const [expenseLists, setExpenseList] = useState<IExpenseView[]>([]);
  const [isPass, setIsPass] = useState(false);
  const [isReject, setIsReject] = useState(false);
  const [refreshProduct, setRefreshProduct] = useState(false);
  const [refreshReport1, setRefreshReport1] = useState(false);
  const [statusFlag, setStatusFlag] = useState<string>("");
  const [editExpenseStatusItem, setEditExpenseStatusItem] =
    useState<IExpenseView>();
  const [editExpenseamount, setEditExpenseamount] = useState(0);
  const [expenseTypeId, setExpenseTypeId] = useState<string>("");

  const formattedDate = date?.split("T");

  // Check if any expense has expense_status === 1
  const hasPendingExpenses = expenseLists.some(
    (expense) => expense.expense_status == 1
  );

  // Process message to handle <br> and <a> tags
  const renderMessage = (msg?: string) => {
    if (!msg) return null;

    // Split on <br> tags
    const lines = msg.split("<br>");
    return lines.map((line, index) => {
      // Handle <a> tags (e.g., <a href="url">text</a>)
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

      // Render non-empty lines or <br /> for empty lines
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

  const fetchExpense = async (
    setExpenseList: TReactSetState<IExpenseView[]>
  ) => {
    const token = await localStorage.getItem("token");
    const getUUID = await localStorage.getItem("UUID");

    const requestData = {
      request_flag: 3,
      a_application_login_id: teamId,
      isDelete: 0,
      created_date_time: formattedDate && formattedDate[0],
    };
    try {
      const data = await axiosInstance.post("get-expense", requestData);
      if (data.status === 200) {
        if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
          setExpenseList([]);
        }

        setExpenseList(data?.data?.data?.item || []);
      }
    } catch (error: any) {
      toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  };

  const updateExpenseStatus = async (
    values: IExpenseCreateStatus,
    setRefreshExpense: TReactSetState<boolean>,
    expenseId: number | undefined,
    onHide: () => void,
    expenseStatus: number
  ) => {
    const token = await localStorage.getItem("token");
    const getUUID = await localStorage.getItem("UUID");

    if (!getUUID) {
      return;
    }
    const requestDataUpdateExpense = {
      amount: values.amount,
      expense_id: expenseId,
      expense_status: expenseStatus,
      status_remark: values.status_remark,
      pass_amount: values.pass_amount,
      a_application_login_id: getUUID,
    };

    try {
      const { data } = await axiosInstance.post(
        "update-expense",
        requestDataUpdateExpense
      );
      if (data.code === 200) {
        if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          onHide();
          setRefreshExpense(true);
          toast.success(data.ack_msg);
          setRefreshReport && setRefreshReport(true);
        } else {
          toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
          setRefreshReport && setRefreshReport(true);
        }
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        setRefreshReport && setRefreshReport(true);
      }
    } catch (error: any) {
      toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  };

  const handleBulkPass = async () => {
    for (const expense of expenseLists) {
      if (expense.expense_status === 1) {
        const values: IExpenseCreateStatus = {
          amount: expense.amount.toString(),
          status_remark: "bulk pass",
          pass_amount: expense.amount.toString(),
          expenseId: expense.id,
          expense_status: 2,
        };
        await updateExpenseStatus(
          values,
          setRefreshProduct,
          expense.id,
          onHide,
          2
        );
      }
    }
    setRefreshReport && setRefreshReport(true);
  };

  const handleBulkReject = async () => {
    for (const expense of expenseLists) {
      if (expense.expense_status === 1) {
        const values: IExpenseCreateStatus = {
          amount: expense.amount.toString(),
          status_remark: "bulk reject",
          pass_amount: "0",
          expenseId: expense.id,
          expense_status: 3,
        };
        await updateExpenseStatus(
          values,
          setRefreshProduct,
          expense.id,
          onHide,
          3
        );
      }
    }
    setRefreshReport && setRefreshReport(true);
  };

  const handleSubmit = () => {
    setIsPass(true);
    setStatusFlag("pass");
  };

  const handleReject = () => {
    setIsReject(true);
    setStatusFlag("reject");
  };

  useEffect(() => {
    fetchExpense(setExpenseList);
  }, [setExpenseList]);

  useEffect(() => {
    if (refreshProduct || refreshReport1) {
      fetchExpense(setExpenseList);
    }
    setRefreshProduct(false);
  }, [refreshProduct, refreshReport1]);
  return (
    <div className="modal1">
      <div
        className="modal-content1"
        style={{
          width: "58%",
          height: "auto",
          backgroundColor: "rgb(240 242 245)",
          marginTop: "10px",
        }}
      >
        <div className="row">
          <div className="col-10">
            <h2
              className="modal-title1 form_header_text"
              style={{ paddingTop: "15px" }}
            >
              Update Expenses Status
            </h2>
          </div>
        </div>
        <div>
          <Table className={modalThemeClass}>
            <thead>
              <tr>
                <th>Image</th>
                <th>Created Date & Time</th>
                <th>Expense Date</th>
                <th>Details</th>
                <th>Amount</th>
                <th>Expense Type</th>
                <th>Pass / Reject Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenseLists.length > 0 ? (
                expenseLists.map((expense) => (
                  <tr key={expense.id}>
                    <td>
                      {expense.image ? (
                        <img
                          src={expense.image}
                          alt="Expense receipt"
                          style={{
                            maxWidth: "80px",          // Adjust as needed
                            maxHeight: "60px",
                            objectFit: "cover",        // or "contain"
                            borderRadius: "4px",
                            border: "1px solid #ddd",
                            cursor: "pointer",
                          }}
                          onClick={() => window.open(expense.image, "_blank", "noopener,noreferrer")}
                          onError={(e) => {
                            e.currentTarget.src = "/path/to/fallback-image.png"; // optional fallback
                            e.currentTarget.alt = "Image failed to load";
                          }}
                        />
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>{expense.created_date_time}</td>
                    <td>{expense.expense_date}</td>
                    <td>{expense.remark}</td>
                    <td>₹ {expense.amount}</td>
                    <td>{expense.expense_name || "-"}</td>
                    <td>{expense.status_remark || "-"}</td>
                    <td
                      className="modal-buttons"
                      style={{ marginTop: "0px", minHeight: "41px" }}
                    >
                      {expense.expense_status === 1 ? (
                        <>
                          <Button
                            className="modal-button2"
                            style={{ color: "white" }}
                            onClick={() => {
                              setEditExpenseStatusItem({
                                id: expense.id,
                                expense_type_id: expense.expense_type_id,
                                amount: expense.amount,
                                pass_amount: expense.amount,
                                expense_status: expense.expense_status,
                                expenseId: expense.id,
                                a_application_login_id:
                                  expense.a_application_login_id,
                                created_date_time: expense.created_date_time,
                              } as IExpenseView);
                              handleReject();
                            }}
                          >
                            Reject
                          </Button>
                          <Button
                            style={{ color: "white" }}
                            className="modal-button2"
                            onClick={() => {
                              setEditExpenseStatusItem({
                                id: expense.id,
                                expense_type_id: expense.expense_type_id,
                                amount: expense.amount,
                                pass_amount: expense.amount,
                                expense_status: expense.expense_status,
                                expenseId: expense.id,
                                a_application_login_id:
                                  expense.a_application_login_id,
                                created_date_time: expense.created_date_time,
                              } as IExpenseView);
                              handleSubmit();
                            }}
                          >
                            Pass
                          </Button>
                        </>
                      ) : (
                        <>
                          <span
                            style={{
                              color:
                                expense.expense_status === 2 ? "green" : "red",
                            }}
                          >
                            {expense.expense_status === 2
                              ? "Passed"
                              : "Rejected"}
                          </span>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5}>No expenses found</td>
                </tr>
              )}
            </tbody>
          </Table>
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
          {isoption ? (
            <div className={`${modalThemeClass}`}>
              <ul>
                <li>
                  <div className="m-list">
                    <label className="form-check-label" htmlFor="8-hours">
                      <input
                        className="form-check-input-custom"
                        type="radio"
                        name="groupsRadios"
                        value=""
                        id="8-hours"
                        checked
                      />
                      <h4>{opt1}</h4>
                    </label>
                  </div>
                </li>
                <li>
                  <div className="m-list">
                    <label className="form-check-label" htmlFor="week">
                      <input
                        className="form-check-input-custom"
                        type="radio"
                        name="groupsRadios"
                        value=""
                        id="week"
                      />
                      <h4>{opt2}</h4>
                    </label>
                  </div>
                </li>
                <li>
                  <div className="m-list">
                    <label className="form-check-label" htmlFor="always">
                      <input
                        className="form-check-input-custom"
                        type="radio"
                        name="groupsRadios"
                        value=""
                        id="always"
                      />
                      <h4>{opt3}</h4>
                    </label>
                  </div>
                </li>
              </ul>
            </div>
          ) : (
            " "
          )}
          <div className="d-flex justify-content-end modal-buttons">
            <Button
              className="modal-button1"
              onClick={() => {
                setRefreshReport && setRefreshReport(true);
                onHide();
              }}
            >
              {btn1}
            </Button>
            {hasPendingExpenses && (
              <>
                <Button
                  variant="danger"
                  className="modal-button2"
                  style={{ color: "white" }}
                  onClick={() => {
                    setRefreshReport && setRefreshReport(true);
                    handleBulkReject();
                  }}
                >
                  Reject All
                </Button>
                <Button
                  variant="success"
                  className="modal-button2"
                  style={{ marginRight: "8px", color: "white" }}
                  onClick={() => {
                    setRefreshReport && setRefreshReport(true);
                    handleBulkPass();
                  }}
                >
                  Pass All
                </Button>
              </>
            )}
          </div>
        </div>
        {isPass && (
          <CreateExpenseView
            show={isPass}
            onHide={() => setIsPass(false)}
            expenseToEdit={editExpenseStatusItem}
            headerName={`${statusFlag} Status`}
            setRefreshExpense={setRefreshProduct}
            status={statusFlag}
            pass_amount={editExpenseamount.toString()}
            setRefreshReport={() => setRefreshReport1(true)}
          />
        )}
        {isReject && (
          <CreateExpenseView
            show={isReject}
            onHide={() => setIsReject(false)}
            expenseToEdit={editExpenseStatusItem}
            headerName={`${statusFlag} Status`}
            setRefreshExpense={setRefreshProduct}
            status={statusFlag}
            pass_amount={editExpenseamount.toString()}
            setRefreshReport={() => setRefreshReport1(true)}
          />
        )}
      </div>
    </div>
  );
};

export default ExpenseStatusUpdateModel;
