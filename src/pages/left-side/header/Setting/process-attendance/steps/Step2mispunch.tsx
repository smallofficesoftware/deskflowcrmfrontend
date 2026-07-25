import { useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { toast } from "react-toastify";
import { useTheme } from "../../../../../../components/ThemeContext";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../../helpers/AppEnum";
import useCheckUserPermission from "../../../../../../hooks/useCheckUserPermission";
import AttendanceCorrection from "../../../../list-company/AttendanceCorrection";
import { IMisPunchEntry } from "../ProcessAttendanceController";
import { formatDate } from "../Processattendancetypes";

interface IProps {
  misPunchList: IMisPunchEntry[];
  loading: boolean;
  fromDate: string;
  toDate: string;
  onNext: () => void;
  onBack: () => void;
  handleCheckMisPunch: () => void;
}

const Step2MisPunch = ({
  misPunchList,
  loading,
  fromDate,
  toDate,
  onNext,
  onBack,
  handleCheckMisPunch,
}: IProps) => {
  const [isOpenAttendanceHistory, setIsOpenAttendanceHistory] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [companyTeamInfo, setCompanyTeamInfo] = useState<any>();

  const { darkMode } = useTheme();

  const canViewAttendance = useCheckUserPermission(
    PAGE_ID.ATTENDANCE,
    PERMISSION_TYPE.VIEW,
  );

  const handleAttendanceHistory = (item: any) => {
    if (canViewAttendance) {
      setIsOpenAttendanceHistory(true);
      setCompanyTeamInfo(item);
      setSelectedDate(item?.date);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  // if (loading) return <Skeleton height={65} className="mb-2" count={5} />;

  const handleRefreshMissPunchList = () => {
    handleCheckMisPunch();
  }

  return (
    <div>
      {misPunchList.length === 0 ? (
        <div
          className="d-flex flex-column align-items-center justify-content-center py-4 rounded-3"
          style={{
            background: "#f0fdf4",
            border: "1.5px dashed #86efac",
            gap: 8,
          }}
        >
          <span style={{ fontSize: "2rem" }}>✅</span>
          <p
            className="mb-0 fw-semibold text-success"
            style={{ fontSize: "0.9rem" }}
          >
            No mis-punches found!
          </p>
          <p className="mb-0 text-muted" style={{ fontSize: "0.78rem" }}>
            All entries are complete. You can proceed.
          </p>
        </div>
      ) : (
        <>
          <div className="d-flex align-items-center justify-content-between mb-2">
            <span
              className="fw-semibold"
              style={{ fontSize: "0.85rem", color: "#b91c1c" }}
            >
              ⚠ {misPunchList.length} mis-punch
              {misPunchList.length > 1 ? "es" : ""} found
            </span>
            <div className="d-flex align-items-center justify-content-center">
              <div
                className="ICON"
              >
                <button
                  className="icons"
                  onClick={handleRefreshMissPunchList}
                  title="Refresh"
                >
                  <svg width="30" height="30" viewBox="0 0 50 50" style={{ color: "#4C4C4C" }}>
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
              <span
                className="badge"
                style={{
                  background: "#fee2e2",
                  color: "#b91c1c",
                  fontSize: "0.72rem",
                }}
              >
                {formatDate(fromDate)} – {formatDate(toDate)}
              </span>
            </div>
          </div>

          <div style={{ maxHeight: 260, overflowY: "auto" }}>
            <table
              className="table table-sm table-hover mb-0"
              style={{ fontSize: "0.8rem" }}
            >
              <thead
                style={{
                  position: "sticky",
                  top: 0,
                  background: "#fff3e0",
                  zIndex: 1,
                }}
              >
                <tr>
                  <th style={{ color: "#7c3d1a", fontWeight: 600 }}>#</th>
                  <th style={{ color: "#7c3d1a", fontWeight: 600 }}>
                    Employee
                  </th>
                  <th style={{ color: "#7c3d1a", fontWeight: 600 }}>Date</th>
                  <th style={{ color: "#7c3d1a", fontWeight: 600 }}>Issue</th>
                  <th style={{ color: "#7c3d1a", fontWeight: 600 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr>
                      <td colSpan={5} className="p-0">
                        <div className="chats h-100" key={index}>
                          <button className="block chat-list">
                            <div className="h-text ps-2">
                              <Skeleton width="100%" height={15} duration={5} style={{ opacity: darkMode ? "" : 0.8 }} />
                            </div>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  misPunchList.map((mp, idx) => (
                    <tr key={idx}>
                      <td className="text-muted">{idx + 1}</td>
                      <td className="fw-semibold">{mp.employee_name}</td>
                      <td>{formatDate(mp.date)}</td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: "#fee2e2",
                            color: "#b91c1c",
                            fontSize: "0.72rem",
                          }}
                        >
                          {mp.punch_type}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-red"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAttendanceHistory(mp);
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                          >
                            <path d="M120-280v-80h560v80H120Zm80-160v-80h560v80H200Zm80-160v-80h560v80H280Z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <p className="text-muted mt-2 mb-0" style={{ fontSize: "0.77rem" }}>
            Clear mis-punches before processing, or continue with remaining
            employees.
          </p>
          {isOpenAttendanceHistory && (
            <AttendanceCorrection
              show={isOpenAttendanceHistory}
              onHide={() => {
                setIsOpenAttendanceHistory(false);
                handleRefreshMissPunchList();
              }}
              companyTeamInfo={companyTeamInfo}
              selectedDate={selectedDate}
              isAddMode={false}
              handleRefreshMissPunchList={handleRefreshMissPunchList}
            />
          )}
        </>
      )}

      <div className="d-flex justify-content-between mt-4">
        <button className="btn btn-sm btn-outline-secondary" onClick={onBack}>
          ← Back
        </button>
        <button
          disabled={misPunchList.length > 0}
          className="btn btn-sm text-white"
          style={{
            background: "linear-gradient(135deg,#f58634,#e0732a)",
            minWidth: 150,
          }}
          onClick={onNext}
        >
          Process Attendance →
        </button>
      </div>
    </div>
  );
};

export default Step2MisPunch;
