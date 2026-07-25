import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  formatDate,
  openInNewTab
} from "../../../common/SharedFunction";
import DateTimeRangePicker from "../../../components/DateTimeRangePicker";
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
  fetchAttendanceHistory,
  IAttendanceHistory,
  updateAttendance
} from "./ListCompanyController";

interface IAttendanceHistoryProps {
  show: boolean;
  onHide: () => void;
  companyTeamInfo: ICompanyTeam | undefined;
}

const getCurrentMonthRange = (): Date[] => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return [startOfMonth, endOfMonth];
};

const AttendanceHistory = ({
  show,
  onHide,
  companyTeamInfo,
}: IAttendanceHistoryProps) => {
  const [selectDate, setSelectDate] = useState<Date[]>(getCurrentMonthRange);
  const [attendanceHistory, setAttendanceHistory] = useState<
    IAttendanceHistory[]
  >([]);
  // const [totalHourAndSalary, setTotalHourAndSalary] = useState<
  //   IAttendanceHistory[]
  // >([]);

  const canView = useCheckUserPermission(PAGE_ID.ATTENDANCE, PERMISSION_TYPE.VIEW);
  const canAdd = useCheckUserPermission(PAGE_ID.ATTENDANCE, PERMISSION_TYPE.ADD);
  const canEdit = useCheckUserPermission(PAGE_ID.ATTENDANCE, PERMISSION_TYPE.EDIT);
  const canDelete = useCheckUserPermission(PAGE_ID.ATTENDANCE, PERMISSION_TYPE.DELETE);

  const [showEditPopup, setShowEditPopup] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [popupRows, setPopupRows] = useState<any[]>([]);
  const [popupTotalWorkingHours, setPopupTotalWorkingHours] = useState("00:00:00");


  // form state
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formStatus, setFormStatus] = useState<number>(1);
  const [formRemark, setFormRemark] = useState("");
  const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
  const [attendanceId, setAttendanceId] = useState<number | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [isEditingRecord, setIsEditingRecord] = useState(false);
  const [timeError, setTimeError] = useState("");


  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!companyTeamInfo?.id || !selectDate?.length) {
      setAttendanceHistory([]);
      return;
    }
    setError(null);
    fetchAttendanceHistory(
      setAttendanceHistory,
      // setTotalHourAndSalary,
      selectDate,
      companyTeamInfo.id
    ).catch(() => {
      setError("Failed to fetch attendance history");
      toast.error("Failed to fetch attendance history");
    });
  }, [selectDate, companyTeamInfo?.id]);

  const handleSearchDateChange = (selectedDates: Date[] | undefined) => {
    setSelectDate(selectedDates || []);
    if (!companyTeamInfo?.id || !selectedDates?.length) {
      setAttendanceHistory([]);
      return;
    }
    fetchAttendanceHistory(
      setAttendanceHistory,
      // setTotalHourAndSalary,
      selectedDates,
      companyTeamInfo.id
    ).catch(() => {
      setError("Failed to fetch attendance history");
      toast.error("Failed to fetch attendance history");
    });
  };

  function formatTime(totalSeconds: number) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`;
  }

  const calculateTotalWorkingHours = () => {
    let totalSeconds = 0;
    attendanceHistory.forEach((item) => {
      item.messages.forEach((e) => {
        const timeStr = e.total_working_hour;
        if (timeStr && typeof timeStr === "string") {
          const [hours, minutes, seconds] = timeStr.split(":").map(Number);
          if (!isNaN(hours) && !isNaN(minutes) && !isNaN(seconds)) {
            totalSeconds += hours * 3600 + minutes * 60 + seconds;
          }
        }
      });
    });
    return formatTime(totalSeconds);
  };


  const getAttendanceStatus = (
    actualTime: string,
    expectedTime: string,
    type: "in" | "out"
  ) => {
    if (!actualTime || !expectedTime || expectedTime === "Not Set") return "";
    const normalizeTime = (time: string) => {
      const parts = time.split(":");
      return parts.length === 3 ? parts.slice(0, 2).join(":") : time;
    };
    const normalizedActualTime = normalizeTime(actualTime);
    const normalizedExpectedTime = normalizeTime(expectedTime);
    const actual = new Date(`1970-01-01T${normalizedActualTime}:00`);
    const expected = new Date(`1970-01-01T${normalizedExpectedTime}:00`);
    if (type === "in") {
      return actual > expected ? "Late IN" : "On Time";
    } else {
      return actual < expected ? "Early Out" : "On Time";
    }
  };

  const dailyInTime = companyTeamInfo?.daily_in_time ?? "Not Set";
  const dailyOutTime = companyTeamInfo?.daily_out_time ?? "Not Set";

  return (
    <div>
      <style>
        {`
      /* react-date-range / DateTimeRangePicker calendar */
      .rdrCalendarWrapper {
        z-index: 99999 !important;
        position: relative;
      }

      /* agar react-daterange-picker ho */
      .react-daterange-picker__calendar {
        z-index: 99999 !important;
      }

      /* agar react-datepicker ho */
      .react-datepicker-popper {
        z-index: 99999 !important;
      }
    `}
      </style>
      {show && (
        <div className="modal1" style={{ overflowX: "hidden" }}>
          <div
            className="modal-content1"
            style={{ maxHeight: "90%", width: "60%" }}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex justify-content-start align-items-center col-9">
                <h2 className="modal-title1 form_header_text">
                  Attendance History of {companyTeamInfo?.username}
                  <br />
                </h2>
              </div>
              <div className="d-flex align-items-center justify-content-end col-3">
                <p
                  className="landing-page-text"
                  style={{ cursor: "pointer", color: "blue", fontSize: "13px" }}
                  onClick={() => openInNewTab("/videoTutorial", 8)}
                >
                  Learn More :
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
                    viewBox="0 -960 960 960"
                    width="24px"
                    fill="#0000FF"
                  >
                    <path d="M616-242q-27 1-51.5 1.5t-43.5.5h-41q-71 0-133-2-53-2-104.5-5.5T168-257q-26-7-45-26t-26-45q-6-23-9.5-56T82-447q-2-36-2-73t2-73q2-30 5.5-63t9.5-56q7-26 26-45t45-26q23-6 74.5-9.5T347-798q62-2 133-2t133 2q53 2 104.5 5.5T792-783q26 7 45 26t26 45q6 23 9.5 56t5.5 63q2 36 2 73v17q-19-8-39-12.5t-41-4.5q-83 0-141.5 58.5T600-320q0 21 4 40.5t12 37.5ZM400-400l208-120-208-120v240Zm360 200v-80h-80v-80h80v-80h80v80h80v80h-80v80h-80Z" />
                  </svg>
                </p>
                <span
                  className="close ms-3 pb-3"
                  onClick={onHide}
                  style={{ cursor: "pointer" }}
                >
                  ×
                </span>
              </div>
            </div>
            <div className="m-title-2 col-12">
              <div className="head">
                <div>
                  <div style={{ zIndex: "9999" }} className="d-flex align-items-center justify-content-between">
                    {/* Left side - Date picker */}
                    <div className="d-flex align-items-center gap-2">
                      <DateTimeRangePicker
                        value={selectDate}
                        onChange={handleSearchDateChange}
                        showTime={false}
                        numberOfMonthsShow={1}
                      />
                      <span className="p-1">
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

                    {/* Right side - + Add Attendance button */}
                    {canAdd && (
                      <button
                        className="btn btn-sm text-white"
                        style={{ backgroundColor: "rgb(255, 125, 18)" }}
                        title="Add new attendance record"
                        onClick={() => {
                          setIsAddMode(true);
                          setIsEditingRecord(false);
                          setShowEditPopup(true);

                          // Reset form for new entry
                          setFormDate("");
                          setFormTime("");
                          setFormStatus(1);
                          setFormRemark("");

                          // Prefill today's date
                          const today = new Date().toISOString().split("T")[0];
                          setFormDate(today);

                          // Clear editing context
                          setAttendanceId(null);
                          setSelectedDate("");
                          setPopupTotalWorkingHours("");
                        }}
                      >
                        + Add Attendance
                      </button>
                    )}
                  </div>
                </div>
                {error && <p className="text-danger">{error}</p>}
                <div className="source-of-type-list-grid-block">
                  <div
                    className="source-of-type-list-grid-main"
                    style={{ maxHeight: "70vh", overflowX: "scroll" }}
                  >
                    <table
                      className="table table-hover"
                      border={0}
                      aria-label="Attendance History"
                    >
                      <thead
                        className="text-center"
                        style={{
                          position: "sticky",
                          top: 0,
                          // zIndex: 1000,
                          backgroundColor: "white",
                        }}
                      >
                        <tr style={{ backgroundColor: "#dee2e6" }}>
                          <th scope="col">Date</th>
                          <th scope="col">Time (Expected vs Actual)</th>
                          <th scope="col">Status</th>
                          <th scope="col">Total Working Hours</th>
                        </tr>
                      </thead>
                      <tbody className="text-center">
                        {attendanceHistory.length !== 0 ? (
                          attendanceHistory.map((item, index) => {
                            // const inMessage = item.messages.find(
                            //   (e) => e.attendance_status === 1
                            // );
                            // const outMessage = item.messages.find(
                            //   (e) => e.attendance_status === 2
                            // );
                            // const inStatus = inMessage
                            //   ? getAttendanceStatus(
                            //     inMessage.attendanceTime,
                            //     dailyInTime,
                            //     "in"
                            //   )
                            //   : "";
                            // const outStatus = outMessage
                            //   ? getAttendanceStatus(
                            //     outMessage.attendanceTime,
                            //     dailyOutTime,
                            //     "out"
                            //   )
                            //   : "";

                            return (
                              <tr key={index}>
                                <td
                                  style={{ cursor: "pointer", color: "blue" }}
                                  onClick={() => {
                                    if (canView) {
                                      setIsAddMode(false);
                                      setIsEditingRecord(false);
                                      setShowEditPopup(true);
                                      setSelectedDate(item.date);
                                      fetchAttendanceByDate(
                                        companyTeamInfo?.id,
                                        item.date,
                                        setPopupRows,
                                        setPopupTotalWorkingHours
                                      );

                                      // prefill first row if exists
                                      const first = item.messages?.[0];
                                      if (first) {
                                        setFormDate(item.date);
                                      }
                                    } else {
                                      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                                    }

                                  }}
                                >
                                  {item.date ? formatDate(item.date) : ""}
                                </td>
                                <td>
                                  {item.messages &&
                                    item.messages.map((e, i) => {
                                      if (e.attendance_status === 1) {
                                        return (
                                          <a
                                            href={e.image_url || undefined}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                              color: "green",
                                              margin: 0,
                                              borderBottom: e.image_url ? "1px solid blue" : "none",
                                              textDecoration: "none",
                                            }}
                                          >
                                            {e.attendanceTime} {e.attendance_entry_flag == 3 && "(M)"}
                                          </a>
                                        );
                                      } else if (e.attendance_status === 2) {
                                        return (
                                          <>
                                            <a
                                              href={e.image_url || undefined}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              style={{
                                                color: "red",
                                                marginLeft: "10px",
                                                textDecoration: "none",
                                                borderBottom: e.image_url ? "1px solid blue" : "none",
                                              }}
                                            >
                                              {e.attendanceTime} {e.attendance_entry_flag == 2 ? "(A)" : e.attendance_entry_flag == 3 && "(M)"}
                                            </a>
                                            <br />
                                          </>
                                        );
                                      } else {
                                        return (
                                          <>
                                            <span key={i}>
                                              ---------------------------
                                            </span>
                                            <br />
                                          </>
                                        );
                                      }
                                    })}
                                </td>
                                <td>
                                  {item.in_status && (
                                    <div
                                      style={{
                                        color:
                                          item.in_status === "Late In"
                                            ? "orange"
                                            : "green",
                                        marginBottom: "5px",
                                      }}
                                    >
                                      {item.in_status}
                                    </div>
                                  )}
                                  {item.out_status && (
                                    <div
                                      style={{
                                        color:
                                          item.out_status === "Early Out"
                                            ? "orange"
                                            : "green",
                                      }}
                                    >
                                      {item.out_status}
                                    </div>
                                  )}
                                </td>
                                <td>{item.totalWorkingHours}</td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={5}>No record found</td>
                          </tr>
                        )}
                      </tbody>
                      <strong>Total Working Hours : {calculateTotalWorkingHours()}</strong>
                      {/* <tfoot
                        style={{
                          position: "sticky",
                          bottom: 0,
                          backgroundColor: "#fff",
                          zIndex: 10,
                        }}
                      >
                        <tr>
                          <td style={{ textAlign: "center" }}>
                            
                          </td>
                          <td>
                            <strong></strong>
                          </td>
                        </tr>
                      </tfoot> */}
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
                fetchAttendanceByDate(
                  companyTeamInfo?.id,
                  selectedDate,
                  setPopupRows,
                  setPopupTotalWorkingHours
                )
                fetchAttendanceHistory(
                  setAttendanceHistory,
                  selectDate,
                  companyTeamInfo?.id
                );
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

      {showEditPopup && (
        <div className="modal1">
          <div className="modal-content1" style={{ width: "55%" }}>
            <div className="d-flex justify-content-between align-items-center">
              <h4>
                {isAddMode
                  ? `Add New Attendance for ${companyTeamInfo?.username}`
                  : `Edit Attendance of ${companyTeamInfo?.username}`}
              </h4>
              <span
                style={{ cursor: "pointer", fontSize: "20px" }}
                onClick={() => {
                  setShowEditPopup(false)
                  setFormDate("");
                  setFormTime("");
                  setFormStatus(1);
                  setTimeError("");
                  setFormRemark("");
                }}
              >
                ×
              </span>
            </div>

            {/* ===== FORM ROW ===== */}
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
                    setFormTime(e.target.value)
                    setTimeError("");
                  }}
                />
                {timeError && (
                  <div className="invalid-feedback d-block">
                    {timeError}
                  </div>
                )}
              </div>

              <div className="col-3">
                <label className="form-label">Attendence Status</label>
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
                <button className="btn btn-sm text-white w-100"
                  style={{ backgroundColor: "rgb(255, 125, 18)" }}
                  onClick={() => {
                    if (!formTime) {
                      setTimeError("Time is required");
                      return;
                    }
                    if (isAddMode) {
                      if (canAdd) {
                        const dateTimeString = `${formDate} ${formTime}:00`;
                        createAttendance(
                          companyTeamInfo?.id,
                          dateTimeString,
                          formStatus,
                          formRemark,
                          () => {
                            // refresh main list
                            fetchAttendanceHistory(
                              setAttendanceHistory,
                              selectDate,
                              companyTeamInfo?.id
                            );
                            setAttendanceId(null);
                            setFormTime("");
                            setFormRemark("");
                            setFormStatus(1);
                          }
                        );
                      } else {
                        toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                      }
                    } else {
                      if (isEditingRecord) {
                        if (canEdit) {
                          if (!attendanceId) return;
                          const dateTimeString = `${formDate} ${formTime}`;
                          updateAttendance(
                            attendanceId,
                            companyTeamInfo?.id,
                            dateTimeString,
                            formStatus,
                            formRemark,
                            () => {
                              // refresh main list                              
                              fetchAttendanceByDate(
                                companyTeamInfo?.id,
                                selectedDate,
                                setPopupRows,
                                setPopupTotalWorkingHours
                              )
                              fetchAttendanceHistory(
                                setAttendanceHistory,
                                selectDate,
                                companyTeamInfo?.id
                              );
                              setAttendanceId(null);
                              setFormTime("");
                              setFormRemark("");
                              setFormStatus(1);
                              setIsEditingRecord(false);
                            }
                          );
                        } else {
                          toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                        }
                      } else {
                        if (canAdd) {
                          const dateTimeString = `${formDate} ${formTime}:00`;
                          createAttendance(
                            companyTeamInfo?.id,
                            dateTimeString,
                            formStatus,
                            formRemark,
                            () => {
                              // refresh main list
                              fetchAttendanceByDate(
                                companyTeamInfo?.id,
                                selectedDate,
                                setPopupRows,
                                setPopupTotalWorkingHours
                              )
                              fetchAttendanceHistory(
                                setAttendanceHistory,
                                selectDate,
                                companyTeamInfo?.id
                              );
                              setAttendanceId(null);
                              setFormTime("");
                              setFormRemark("");
                              setFormStatus(1);
                            }
                          );
                        } else {
                          toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                        }
                      }
                    }
                  }}
                >
                  {isAddMode ? "Add" : isEditingRecord ? "Update" : "Add"}
                </button>
              </div>
            </div>

            {/* ===== TABLE ===== */}
            {!isAddMode && (
              <AttendanceRecordsTable
                selectedDate={selectedDate}
                rows={popupRows}
                popupTotalWorkingHours={popupTotalWorkingHours}
                canEdit={canEdit}
                canDelete={canDelete}
                onEdit={(msg) => {
                  setIsEditingRecord(true);
                  setAttendanceId(msg.id);
                  setFormDate(selectedDate);
                  setFormTime(msg.attendanceTime);
                  setFormStatus(msg.attendance_status);
                  setFormRemark(msg.remark || "");
                }}
                onDelete={(id) => {
                  setAttendanceId(id);
                  setIsDeleteConfirmation(true);
                }}
              />
            )}
          </div>
        </div>
      )
      }

    </div >
  );
};

export default AttendanceHistory;
