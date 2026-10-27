import { Button } from "primereact/button";
import React from "react";
import { ITaskPerformance } from "./TeamPerformanceReportsController";

// Calls, follow-ups and task follow-through columns of the Team Performance report, plus the
// Details button. Kept here so the report file only plugs them in.

export interface IActivityTotals {
  calls_total: number;
  calls_connected: number;
  calls_not_connected: number;
  followups_done: number;
  tasks_assigned: number;
  tasks_completed: number;
  tasks_called: number;
  tasks_with_contact: number;
}

export interface IActivityColumnDef {
  key: string;
  label: string;
  header: React.ReactNode;
  width: string;
  body: (rowData: ITaskPerformance) => React.ReactNode;
  footer?: () => React.ReactNode;
}

const total = (value: React.ReactNode) => (
  <strong style={{ display: "block", fontSize: "17px", textAlign: "right" }}>{value}</strong>
);

const numberColumn = (
  key: keyof ITaskPerformance,
  label: string,
  header: React.ReactNode,
  footer: number,
): IActivityColumnDef => ({
  key: String(key),
  label,
  header,
  width: "100px",
  body: (row) => (row[key] as number | undefined) ?? 0,
  footer: () => total(footer),
});

export const activityColumnDefs = (
  totals: IActivityTotals,
  openDetails: (row: ITaskPerformance) => void,
): IActivityColumnDef[] => [
  numberColumn("calls_total", "Calls", <span>Calls</span>, totals.calls_total),
  numberColumn(
    "calls_connected",
    "Calls Connected",
    <span>
      Calls <br /> Connected
    </span>,
    totals.calls_connected,
  ),
  numberColumn(
    "calls_not_connected",
    "Calls Not Connected",
    <span>
      Calls Not <br /> Connected
    </span>,
    totals.calls_not_connected,
  ),
  numberColumn(
    "followups_done",
    "Follow-ups Done",
    <span>
      Follow-ups <br /> Done
    </span>,
    totals.followups_done,
  ),
  numberColumn(
    "tasks_assigned",
    "Tasks Given",
    <span>
      Tasks <br /> Given
    </span>,
    totals.tasks_assigned,
  ),
  numberColumn(
    "tasks_completed",
    "Tasks Completed",
    <span>
      Tasks <br /> Completed
    </span>,
    totals.tasks_completed,
  ),
  {
    key: "tasks_called_text",
    label: "Tasks Called",
    header: (
      <span>
        Tasks Called <br /> (of tasks with contact)
      </span>
    ),
    width: "130px",
    body: (row) => row.tasks_called_text ?? "0 / 0",
    footer: () => total(`${totals.tasks_called} / ${totals.tasks_with_contact}`),
  },
  {
    key: "details",
    label: "Details",
    header: <span>Details</span>,
    width: "80px",
    body: (row) => (
      <Button
        icon="pi pi-eye"
        className="report_button"
        style={{ backgroundColor: "#4C4C4C", width: "2rem", height: "2rem" }}
        rounded
        onClick={() => openDetails(row)}
        tooltip="Details: status and label counts, tasks called or not"
        tooltipOptions={{ position: "top", style: { fontSize: "14px" } }}
      />
    ),
  },
];
