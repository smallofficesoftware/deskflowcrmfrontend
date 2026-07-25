import React from "react";
import { toast } from "react-toastify";
import { formatDate } from "../../../common/SharedFunction";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../helpers/AppConstants";

interface AttendanceRecordsTableProps {
  selectedDate: string;
  rows: any[];
  popupTotalWorkingHours: string;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (msg: any) => void;
  onDelete: (attendanceId: number) => void;
}


const AttendanceRecordsTable: React.FC<AttendanceRecordsTableProps> = ({
  selectedDate,
  rows,
  popupTotalWorkingHours,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="mt-4">
      <table className="table table-bordered text-center">
        <thead style={{ backgroundColor: "#f1f1f1" }}>
          <tr>
            <th>Date</th>
            <th>Time</th>
            <th>Status</th>
            <th>Working Hours</th>
            <th>Remarks</th>
            <th>Updated By</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? (
            rows.map((msg, i) => (
              <tr key={i}>
                <td>{formatDate(selectedDate)}</td>
                <td>{msg.attendanceTime}</td>
                <td style={{ background: msg.attendance_status === 1 ? "#EAFBF1" : "#FFF1F0" }}>{msg.attendance_status === 1 ? "IN" : "OUT"}</td>
                <td>{msg.total_working_hour ? msg.total_working_hour : "--"}</td>
                <td>{msg.remark || "--"}</td>
                <td>{msg.updated_by_name || "System"}</td>
                <td>
                  <span
                    style={{ cursor: "pointer", color: "blue", marginRight: "10px" }}
                    onClick={() => canEdit ? onEdit(msg) : toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION)}
                    title={canEdit ? "Edit" : "No edit permission"}
                  >
                    ✏️
                  </span>
                  <span
                    style={{ cursor: "pointer", color: "red" }}
                    onClick={() => canDelete ? onDelete(msg.id) : toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION)}
                    title={canDelete ? "Delete" : "No delete permission"}
                  >
                    🗑️
                  </span>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7}>No records found</td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr style={{ backgroundColor: "#f9f9f9", fontWeight: "bold" }}>
            <td colSpan={3} style={{ textAlign: "right" }}>
              Total Working Hours :
            </td>
            <td>{popupTotalWorkingHours || "--"}</td>
            <td colSpan={3}></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default AttendanceRecordsTable;