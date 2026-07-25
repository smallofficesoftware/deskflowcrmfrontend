import { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import ConfirmationModal from "../../../../../components/model/ConfirmationModal";
import { DEFAULT_STATUS_CODE_SUCCESS } from "../../../../../helpers/AppConstants";
import { axiosInstance } from "../../../../../services/axiosInstance";

interface IPropMainSettingView {
  isMainSettingView: boolean;
  closeMainSettingView: () => void;
}

type Settings = {
  team_member_join: number;
  team_member_attendance: number;
  team_expense_entry: number;
  team_visit_entry: number;
  order_approve: number;
  inquiry_status: number;
  inquiry_assignment: number;
  reminder_alert: number;
  payment_approve: number;
};

interface NotificationSetting {
  id: string;
  column: keyof Settings;
  title: string;
  description: string;
}

const defaultSettings: Settings = {
  team_member_join: 0,
  team_member_attendance: 0,
  team_expense_entry: 0,
  team_visit_entry: 0,
  order_approve: 0,
  inquiry_status: 0,
  inquiry_assignment: 0,
  reminder_alert: 0,
  payment_approve: 0,
};

const notificationSettings: NotificationSetting[] = [
  {
    id: "switch1",
    column: "team_member_join",
    title: "Team Member Join / Leave / Release",
    description:
      "When any team member joins, leaves the company, or is released by the owner, the system will notify all team members.",
  },
  {
    id: "switch2",
    column: "team_member_attendance",
    title: "Team Member Attendance In / Out",
    description:
      "When any team member performs an attendance check-in or check-out, the system will notify all team members.",
  },
  {
    id: "switch3",
    column: "team_expense_entry",
    title: "Team Expense Entry",
    description:
      "When any team member submits an expense reimbursement request, the system will notify the owner and the respective team member for further action.",
  },
  {
    id: "switch4",
    column: "team_visit_entry",
    title: "Team Visit Entry",
    description:
      "When any team member visits a customer or prospect and logs the visit in the system, the owner will be notified.",
  },
  {
    id: "switch5",
    column: "order_approve",
    title: "Quotation / Order / Sales Invoice / Purchase Invoice Approval",
    description:
      "When the owner approves any of the above entries, the system will notify all relevant team members about the status change.",
  },
  {
    id: "switch6",
    column: "payment_approve",
    title: "Payment Approval",
    description:
      "When the owner approves any payment entry, the system will notify all relevant team members about the status change.",
  },
  {
    id: "switch7",
    column: "inquiry_status",
    title: "Contact / Inquiry Status Change",
    description:
      "When any team member changes the status of a contact or inquiry, the system will notify all relevant team members.",
  },
  {
    id: "switch8",
    column: "inquiry_assignment",
    title: "Contact / Inquiry Assignment",
    description:
      "When a contact or inquiry is assigned to a team member, the system will notify all relevant team members.",
  },
  {
    id: "switch9",
    column: "reminder_alert",
    title: "Reminder Alert",
    description:
      "The system will notify team members before the scheduled reminder time.",
  },
];

const MainSettingsView = ({
  isMainSettingView,
  closeMainSettingView,
}: IPropMainSettingView) => {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem("notificationSettings");
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState<
    "enable" | "disable"
  >("disable");

  // escape handle
  useEscapeKey(closeMainSettingView);

  useEffect(() => {
    localStorage.setItem("notificationSettings", JSON.stringify(settings));
  }, [settings]);

  const user_id = localStorage.getItem("UUID");
  const tenant_id = localStorage.getItem("UUID");

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      if (!user_id || !tenant_id) {
        return;
      }

      const requestData = {
        table: "a_application_logins",
        where: JSON.stringify({ id: user_id }),
        columns: Object.keys(defaultSettings).join(","),
      };

      const { data } = await axiosInstance.post("mainCommonGet", requestData);

      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS && data.data?.length > 0) {
        setSettings(data.data[0]);
      } else {
        toast.error(data.ack_msg || "Failed to load settings");
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings. Please try again.");
      setSettings(defaultSettings);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [user_id, tenant_id]);

  const updateSetting = async (column: keyof Settings, value: number) => {
    if (!user_id || !tenant_id) return;

    setIsLoading(true);
    try {
      const requestData = {
        table: "a_application_logins",
        where: JSON.stringify({ id: user_id }),
        data: JSON.stringify({ [column]: value }),
      };

      const { data } = await axiosInstance.post(
        "mainCommonUpdate",
        requestData);

      if (data.code === 200 || data.success) {
        setSettings((prev) => ({ ...prev, [column]: value }));
        toast.success(`Setting ${value ? "enabled" : "disabled"} successfully`);
      } else {
        throw new Error(data.ack_msg || "Update failed");
      }
    } catch (error) {
      console.error("Error updating setting:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchToggle = (column: keyof Settings, value: number) => {
    updateSetting(column, value);
  };

  const toggleAllSettings = async (value: number) => {
    if (!user_id || !tenant_id) return;

    setIsLoading(true);
    try {
      const updatedSettings = Object.fromEntries(
        Object.keys(settings).map((key) => [key, value])
      ) as Settings;

      const requestData = {
        table: "a_application_logins",
        where: JSON.stringify({ id: user_id }),
        data: JSON.stringify(updatedSettings),
      };

      const { data } = await axiosInstance.post(
        "mainCommonUpdate",
        requestData);

      if (data.code === 200 || data.success) {
        setSettings(updatedSettings);
        toast.success(
          `All settings ${value ? "enabled" : "disabled"} successfully`
        );
      } else {
        throw new Error(data.ack_msg || "Update failed");
      }
    } catch (error) {
      console.error("Error updating all settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAllClick = (value: number) => {
    const action = value ? "enable" : "disable";
    setConfirmationAction(action);
    setShowConfirmation(true);
  };

  const handleConfirmation = () => {
    const value = confirmationAction === "enable" ? 1 : 0;
    toggleAllSettings(value);
    setShowConfirmation(false);
  };

  return (
    <>
      {isMainSettingView && (
        <div
          className="notifications animate__animated animate__fadeInLeft"
          id="notifications"
        >
          <div className="header-Chat">
            <div className="ICON">
              <button
                className="icons"
                title="Back"
                onClick={closeMainSettingView}
                disabled={isLoading}
                aria-label="Back to previous view"
              >
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path
                    fill="currentColor"
                    d="m12 4 1.4 1.4L7.8 11H20v2H7.8l5.6 5.6L12 20l-8-8 8-8z"
                  />
                </svg>
              </button>
            </div>
            <div className="col-7 newText">
              <h2>Notification Settings</h2>
            </div>
            <div className="col-3 text-end mb-2">
              <div
                className="ICON"
                style={{ position: "absolute", right: "1px" }}
              >
                <div className="form-check form-switch d-flex align-items-center me-5">
                  <label
                    className="me-5 mb-0 newText"
                    htmlFor="toggle-all-switch"
                    style={{
                      fontSize: "18px",
                      color: "#fff",
                    }}
                  >
                    All
                  </label>
                  <div className="form-switch-container">
                    <input
                      id="toggle-all-switch"
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      checked={Object.values(settings).every(
                        (val) => val === 1
                      )}
                      onChange={(e) =>
                        handleToggleAllClick(e.target.checked ? 1 : 0)
                      }
                      disabled={isLoading}
                      aria-label="Toggle all notifications"
                    />
                  </div>
                </div>
                <button
                  className="icons"
                  style={{
                    position: "absolute",
                    right: "1px",
                    top: "1px",
                  }}
                  title="Refresh"
                  onClick={fetchSettings}
                  disabled={isLoading}
                  aria-label="Refresh settings"
                >
                  <svg width="30" height="30" viewBox="0 0 50 50">
                    <path
                      fill="currentColor"
                      d="M25 38c-7.2 0-13-5.8-13-13 0-3.2 1.2-6.2 3.3-8.6l1.5 1.3C15 19.7 14 22.3 14 25c0 6.1 4.9 11 11 11 1.6 0 3.1-.3 4.6-1l.8 1.8c-1.7.8-3.5 1.2-5.4 1.2z"
                    />
                    <path
                      fill="currentColor"
                      d="M34.7 33.7l-1.5-1.3c1.8-2 2.8-4.6 2.8-7.3 0-6.1-4.9-11-11-11-1.6 0-3.1.3-4.6 1l-.8-1.8c1.7-.8 3.5-1.2 5.4-1.2 7.2 0 13 5.8 13 13 0 3.1-1.2 6.2-3.3 8.6z"
                    />
                    <path fill="currentColor" d="M18 24h-2v-6h-6v-2h8z" />
                    <path fill="currentColor" d="M40 34h-8v-8h2v6h6z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div
            className="p-3 animate__animated animate__fadeInLeft overflow-auto"
            id="settings"
            style={{ maxHeight: "80vh" }}
          >
            {notificationSettings.map((setting, index) => (
              <div
                key={setting.id}
                className="mb-4 d-flex justify-content-between align-items-start border-bottom pb-3"
              >
                <div className="pe-3">
                  {isLoading ? (
                    <>
                      <Skeleton width={200} height={20} />
                      <Skeleton width={300} height={15} count={2} />
                    </>
                  ) : (
                    <>
                      <h6 className="fw-semibold mb-1">{setting.title}</h6>
                      <p className="text-muted small mb-0">
                        {setting.description}
                      </p>
                    </>
                  )}
                </div>
                <div className="form-check form-switch mt-1">
                  {isLoading ? (
                    <Skeleton width={50} height={24} />
                  ) : index < 5 ? (
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      id={setting.id}
                      checked={settings[setting.column] === 1}
                      onChange={(e) =>
                        handleSwitchToggle(
                          setting.column,
                          e.target.checked ? 1 : 0
                        )
                      }
                      disabled={isLoading}
                    />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <ConfirmationModal
        show={showConfirmation}
        onHide={() => setShowConfirmation(false)}
        handleSubmit={handleConfirmation}
        title={`Confirm ${
          confirmationAction === "enable" ? "Enable" : "Disable"
        } All`}
        message={`Are you sure you want to ${confirmationAction} all notifications?`}
        btn1="Cancel"
        btn2={confirmationAction === "enable" ? "Enable All" : "Disable All"}
      />

      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
};

export default MainSettingsView;
