import React, { useEffect } from "react"; // Added useEffect import
import { SHORT_KEY } from "../../helpers/AppEnum";

const ShortcutkeyView = () => {
  const handleShortCutClose = () => {
    window.location.href = "/";
  };

  // Add ESC key listener for CONTACT_MESSAGE_HISTORY
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleShortCutClose(); // Trigger close on ESC key press
      }
    };

    // Add event listener
    window.addEventListener("keydown", handleKeyDown);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []); // Empty dependency array since handleShortCutClose doesn't change

  return (
    <div className="body">
      <div className="container main border border-1">
        <div className="row Intro-Left1">
          <div className="col-12" style={{ height: "500px" }}>
            {/* Logo */}
            <div className="d-flex justify-content-center mt-3">
              <div className="col-4">
                <svg
                  style={{ cursor: "pointer" }}
                  onClick={handleShortCutClose}
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="#1f1f1f"
                >
                  <path d="M360-240 120-480l240-240 56 56-144 144h568v80H272l144 144-56 56Z" />
                </svg>
              </div>

              <div className="col-4 d-flex justify-content-center">
                <img
                  width={400}
                  src={require("../../assets/images/deshFlow_log.png")}
                  alt="Office Logo"
                />
              </div>
              <div className="col-4"></div>
            </div>
            <div className="d-flex justify-content-center mt-3">
              <p>Shortcut Keys</p>
            </div>

            <div className="col-12 d-flex justify-content-center p-2">
              <div
                className="table-responsive w-50"
                style={{
                  overflow: "auto",
                  maxHeight: "70vh",
                  background: "white",
                }}
              >
                <table className="table table-bordered">
                  <thead
                    className="thead-dark"
                    style={{
                      position: "sticky",
                      top: 0,
                      backgroundColor: "#fff",
                      zIndex: 2,
                    }}
                  >
                    <tr>
                      <th>Shortcut</th>
                      <th>Voice command</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <kbd>Ctrl</kbd> + <kbd>Shift</kbd> +{" "}
                        <kbd>{SHORT_KEY.ACCOUNT_HISTORY}</kbd>
                      </td>
                      <td>Open Account History</td>
                      <td>Account History</td>
                    </tr>
                    <tr>
                      <td>
                        <kbd>Ctrl</kbd> + <kbd>Shift</kbd> +{" "}
                        <kbd>{SHORT_KEY.CREATE_CONTACT}</kbd>
                      </td>
                      <td>Create Contact</td>
                      <td>Create Contact</td>
                    </tr>
                    <tr>
                      <td>
                        <kbd>Ctrl</kbd> + <kbd>Shift</kbd> +{" "}
                        <kbd>{SHORT_KEY.DASHBOARD}</kbd>
                      </td>
                      <td>Open Dashboard</td>
                      <td>Dashboard</td>
                    </tr>
                    <tr>
                      <td>
                        <kbd>Ctrl</kbd> + <kbd>Shift</kbd> +{" "}
                        <kbd>{SHORT_KEY.FILTER}</kbd>
                      </td>
                      <td>Apply Filter</td>
                      <td>Filter</td>
                    </tr>
                    <tr>
                      <td>
                        <kbd>Ctrl</kbd> + <kbd>Shift</kbd> +{" "}
                        <kbd>{SHORT_KEY.ALL_INQUIRY_LIST}</kbd>
                      </td>
                      <td>Open All Inquiry</td>
                      <td>All Inquiry List</td>
                    </tr>
                    <tr>
                      <td>
                        <kbd>Ctrl</kbd> + <kbd>Shift</kbd> +{" "}
                        <kbd>{SHORT_KEY.MAIL}</kbd>
                      </td>
                      <td>Create Email</td>
                      <td>Mail</td>
                    </tr>
                    <tr>
                      <td>
                        <kbd>Ctrl</kbd> + <kbd>Shift</kbd> +{" "}
                        <kbd>{SHORT_KEY.MY_INVOICE_LIST}</kbd>
                      </td>
                      <td>Open My Inquiry</td>
                      <td>My Inquiry List</td>
                    </tr>
                    <tr>
                      <td>
                        <kbd>Ctrl</kbd> + <kbd>Shift</kbd> +{" "}
                        <kbd>{SHORT_KEY.MY_TEAM}</kbd>
                      </td>
                      <td>Open Company Team</td>
                      <td>Company Team List</td>
                    </tr>
                    <tr>
                      <td>
                        <kbd>Ctrl</kbd> + <kbd>Shift</kbd> +{" "}
                        <kbd>{SHORT_KEY.QUOTATION_LIST}</kbd>
                      </td>
                      <td>Create Quotation</td>
                      <td>Quotation List</td>
                    </tr>
                    <tr>
                      <td>
                        <kbd>Ctrl</kbd> + <kbd>Shift</kbd> +{" "}
                        <kbd>{SHORT_KEY.REMINDER}</kbd>
                      </td>
                      <td>Open Reminder</td>
                      <td>Reminder & To Do List</td>
                    </tr>
                    <tr>
                      <td>
                        <kbd>Ctrl</kbd> + <kbd>Shift</kbd> +{" "}
                        <kbd>{SHORT_KEY.SALES_ORDER_LIST}</kbd>
                      </td>
                      <td>Create Sales Order</td>
                      <td>Sales Order List</td>
                    </tr>
                    <tr>
                      <td>
                        <kbd>Ctrl</kbd> + <kbd>Shift</kbd> +{" "}
                        <kbd>{SHORT_KEY.SALES_PURCHASE_LIST}</kbd>
                      </td>
                      <td>Open Purchase Invoice</td>
                      <td>Purchase Invoice List</td>
                    </tr>
                    <tr>
                      <td>
                        <kbd>Ctrl</kbd> + <kbd>Shift</kbd> +{" "}
                        <kbd>{SHORT_KEY.SALES_INVOICE_LIST}</kbd>
                      </td>
                      <td>Open Sales Invoice</td>
                      <td>Sales Invoice List</td>
                    </tr>

                    {/* <tr>
                      <td>
                        <kbd>{SHORT_KEY.CONTACT_MESSAGE_HISTORY}</kbd>
                      </td>
                      <td>Close Shortcut View</td>
                      <td>Close Shortcut View</td>
                    </tr> */}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShortcutkeyView;
