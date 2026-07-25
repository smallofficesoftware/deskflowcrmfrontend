import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import ConfirmationModal from "../../../components/model/ConfirmationModal";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../helpers/AppEnum";
import useCheckUserPermission from "../../../hooks/useCheckUserPermission";
import { ICompanyTeam } from "../LeftSideController";
import AttendanceRecordsTable from "./AttendanceRecordsTable";
import {
  createAttendance,
  deleteAttendance,
  fetchAttendanceByDate,
  updateAttendance,
} from "./ListCompanyController";

// ─── Props ────────────────────────────────────────────────────────────────────

interface IAttendanceEditPopupProps {
  show: boolean;
  onHide: () => void;
  companyTeamInfo: ICompanyTeam | undefined;
  selectedDate: string; // "" in add mode, "YYYY-MM-DD" in edit mode
  isAddMode: boolean; // kept — parent controls which mode to open
  handleRefreshMissPunchList: () => void; // parent refreshes its main history list
}

// ─── Component ────────────────────────────────────────────────────────────────

const AttendanceCorrection = ({
  show,
  onHide,
  companyTeamInfo,
  selectedDate,
  isAddMode,
  handleRefreshMissPunchList,
}: IAttendanceEditPopupProps) => {
  // ── Permissions ──────────────────────────────────────────────────────────────
  const canAdd = useCheckUserPermission(
    PAGE_ID.ATTENDANCE,
    PERMISSION_TYPE.ADD,
  );
  const canEdit = useCheckUserPermission(
    PAGE_ID.ATTENDANCE,
    PERMISSION_TYPE.EDIT,
  );
  const canDelete = useCheckUserPermission(
    PAGE_ID.ATTENDANCE,
    PERMISSION_TYPE.DELETE,
  );

  // ── All state lives here now ──────────────────────────────────────────────────
  const [formDate, setFormDate] = useState<string>(selectedDate);
  const [formTime, setFormTime] = useState<string>("");
  const [formStatus, setFormStatus] = useState<number>(1);
  const [formRemark, setFormRemark] = useState<string>("");
  const [timeError, setTimeError] = useState<string>("");
  const [localAttendanceId, setLocalAttendanceId] = useState<number | null>(
    null,
  );
  const [isEditingRecord, setIsEditingRecord] = useState<boolean>(false);
  const [popupRows, setPopupRows] = useState<any[]>([]);
  const [popupTotalWorkingHours, setPopupTotalWorkingHours] =
    useState("00:00:00");

  const [attendanceId, setAttendanceId] = useState<number | null>(null);
  const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);

  // - All UseEffect ──────────────────────────────────────────────────
  useEffect(() => {
    refreshPopupTable();
  }, []);
  // ── Helpers ──────────────────────────────────────────────────────────────────

  const resetForm = () => {
    setLocalAttendanceId(null);
    setFormTime("");
    setFormRemark("");
    setFormStatus(1);
    setIsEditingRecord(false);
  };

  const handleClose = () => {
    onHide();
    resetForm();
    setFormDate("");
    setTimeError("");
    setPopupRows([]);
    setPopupTotalWorkingHours("00:00:00");
  };

  const refreshPopupTable = () => {
    fetchAttendanceByDate(
      companyTeamInfo?.id,
      selectedDate,
      setPopupRows,
      setPopupTotalWorkingHours,
    );
  };

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleSubmit = () => {
    if (!formTime) {
      setTimeError("Time is required");
      return;
    }

    // Simple add mode (no table shown)
    if (isAddMode) {
      if (!canAdd) {
        toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        return;
      }
      createAttendance(
        companyTeamInfo?.id,
        `${formDate} ${formTime}:00`,
        formStatus,
        formRemark,
        () => {
          handleRefreshMissPunchList();
          resetForm();
        },
      );
      return;
    }

    // Edit mode: update existing record
    if (isEditingRecord) {
      if (!canEdit) {
        toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        return;
      }
      if (!localAttendanceId) return;
      updateAttendance(
        localAttendanceId,
        companyTeamInfo?.id,
        `${formDate} ${formTime}`,
        formStatus,
        formRemark,
        () => {
          refreshPopupTable();
          handleRefreshMissPunchList();
          resetForm();
        },
      );
      return;
    }

    // Edit mode: add new record for that day
    if (!canAdd) {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
      return;
    }
    createAttendance(
      companyTeamInfo?.id,
      `${formDate} ${formTime}:00`,
      formStatus,
      formRemark,
      () => {
        refreshPopupTable();
        handleRefreshMissPunchList();
        resetForm();
      },
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  if (!show) return null;

  const submitLabel = isAddMode ? "Add" : isEditingRecord ? "Update" : "Add";

  return (
    <div className="modal1">
      <div className="modal-content1" style={{ width: "55%" }}>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center">
          <h4>
            {isAddMode
              ? `Add New Attendance for ${companyTeamInfo?.username}`
              : `Edit Attendance of ${companyTeamInfo?.username}`}
          </h4>
          <span
            style={{ cursor: "pointer", fontSize: "20px" }}
            onClick={handleClose}
          >
            ×
          </span>
        </div>

        {/* Form Row */}
        <div className="row mt-3 align-items-center">
          <div className="col-3">
            <label className="form-label">Date</label>
            <input
              type="date"
              className="form-control"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              disabled={!isAddMode}
            />
          </div>

          <div className="col-3">
            <label className="form-label">Time</label>
            <input
              type="time"
              className="form-control"
              value={formTime}
              onChange={(e) => {
                setFormTime(e.target.value);
                setTimeError("");
              }}
            />
            {timeError && (
              <div className="invalid-feedback d-block">{timeError}</div>
            )}
          </div>

          <div className="col-3">
            <label className="form-label">Attendance Status</label>
            <select
              className="form-select"
              value={formStatus}
              onChange={(e) => setFormStatus(Number(e.target.value))}
            >
              <option value={1}>IN</option>
              <option value={2}>OUT</option>
            </select>
          </div>

          <div className="col-6 mt-2">
            <label className="form-label">Remarks</label>
            <input
              type="text"
              className="form-control"
              value={formRemark}
              onChange={(e) => setFormRemark(e.target.value)}
            />
          </div>

          <div className="col-3">
            <button
              className="btn btn-sm text-white w-100"
              style={{ backgroundColor: "rgb(255, 125, 18)" }}
              onClick={handleSubmit}
            >
              {submitLabel}
            </button>
          </div>
        </div>

        {/* Records Table — only in edit mode */}
        {!isAddMode && (
          <AttendanceRecordsTable
            selectedDate={selectedDate}
            rows={popupRows}
            popupTotalWorkingHours={popupTotalWorkingHours}
            canEdit={canEdit}
            canDelete={canDelete}
            onEdit={(msg) => {
              setIsEditingRecord(true);
              setLocalAttendanceId(msg.id);
              setFormDate(selectedDate);
              setFormTime(msg.attendanceTime);
              setFormStatus(msg.attendance_status);
              setFormRemark(msg.remark ?? "");
            }}
            onDelete={(id) => {
              setAttendanceId(id);
              setIsDeleteConfirmation(true);
            }}
          />
        )}
        {isDeleteConfirmation && (
          <ConfirmationModal
            show
            onHide={() => {
              setIsDeleteConfirmation(false);
              setAttendanceId(null);
            }}
            handleSubmit={() => {
              if (!attendanceId) return;

              deleteAttendance(
                attendanceId,
                companyTeamInfo?.id,
                () => {
                  // refresh main list                
                  refreshPopupTable();
                  handleRefreshMissPunchList();
                  setIsDeleteConfirmation(false);
                  setAttendanceId(null);
                }
              );
            }}
            title="Delete Attendance"
            message="Are you sure you want to delete this attendance record?"
            btn1="No"
            btn2="Yes"
          />
        )}
      </div>
    </div>
  );
};

export default AttendanceCorrection;
