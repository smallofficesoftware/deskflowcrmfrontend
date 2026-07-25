import {
  add,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  isSameYear,
  isValid,
  parse,
  parseISO,
  startOfDay,
  startOfToday,
  sub,
} from "date-fns";
import { getDay } from "date-fns/getDay";
import { enUS } from "date-fns/locale/en-US";
import { startOfWeek } from "date-fns/startOfWeek";
import React, { CSSProperties, useEffect, useState } from "react";
import {
  Calendar as BigCalendar,
  dateFnsLocalizer,
  View,
  Views,
} from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { toast } from "react-toastify";
import { useTheme } from "../../../../components/ThemeContext";
import ReminderModal from "../../../../components/model/ReminderModal";
import {
  DEFAULT_MESSAGE_ERROR_PERMISSION,
  ITEMS_PER_PAGE,
} from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import CreateTaskView from "../../../right-side/create-task/CreateTaskView";
import {
  fetchApiTask,
  ITaskView,
} from "../Setting/taskList/TaskListController";
import {
  createReminderForMy,
  createRescheduleReminder,
  fetchReminderApi,
  IReminderList,
} from "./ListReminderController";

// Calendar localizer setup
const localizer = dateFnsLocalizer({
  format,
  parse: (dateStr: string) => {
    try {
      const parsed = parseISO(dateStr);
      return isValid(parsed) ? parsed : new Date();
    } catch (error) {
      console.error(`Error parsing date: ${dateStr}`, error);
      return new Date();
    }
  },
  startOfWeek,
  getDay,
  locales: { "en-US": enUS },
});

interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  status: number;
  isDue: number;
  remark: string;
  assigned_to_name: string;
  assigned_to?: number | string;
  reference_table?: string;
  reference_id?: number;
  contact_masters_id?: number;
  mobile_number?: string;
  person_name?: string;
  username?: string;
  contact_message?: string;
  company_masters_id?: number;
  isTask?: boolean;
  stage_status_name?: string;
  stage_status_color?: string;
  created_date_time?: string;
  task_enddate?: string | null;
  task_fromdate?: string | null;
}

interface ReminderCalendarProps {
  isCalendarOpen: boolean;
  closeCalendar: () => void;
  reminderList?: IReminderList[];
  targetVsIncentiveList?: ITaskView[];
  supportTicketFlag?: any;
}

const parseDateString = (dateStr: string): Date => {
  if (!dateStr || dateStr === "0000-00-00") return new Date(NaN);

  try {
    // format: "21-03-2026 12:00 AM"
    const parsed = parse(dateStr, "dd-MM-yyyy hh:mm a", new Date());
    return isValid(parsed) ? parsed : new Date(NaN);
  } catch (err) {
    console.error("Date parse error:", dateStr);
    return new Date(NaN);
  }
};

// TaskModal component (updated to handle multiple tasks)
const TaskModal: React.FC<{
  show: boolean;
  onHide: () => void;
  tasks: CalendarEvent[];
  darkMode: boolean;
}> = ({ show, onHide, tasks, darkMode }) => {
  if (!show) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        backgroundColor: darkMode ? "#2d3748" : "#fff",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        zIndex: 10000,
        color: darkMode ? "#e2e8f0" : "#1a202c",
        border: darkMode ? "1px solid #4a5568" : "1px solid #e2e8f0",
        minWidth: "300px",
        maxHeight: "80vh",
        overflowY: "auto",
      }}
    >
      <h3 style={{ marginBottom: "15px" }}>Task Details</h3>
      {tasks.length === 0 ? (
        <p>No tasks found for this date.</p>
      ) : (
        tasks.map((task, index) => (
          <div
            key={index}
            style={{
              marginBottom: "20px",
              padding: "10px",
              border: darkMode ? "1px solid #4a5568" : "1px solid #e2e8f0",
              borderRadius: "4px",
            }}
          >
            <p>
              <strong>Title:</strong> {task.title}
            </p>
            <p>
              <strong>Remark:</strong> {task.remark}
            </p>
            <p>
              <strong>Assigned To:</strong> {task.assigned_to_name}
            </p>
            <p>
              <strong>Status:</strong> {task.stage_status_name}
            </p>
            <p>
              <strong>Start Date:</strong> {task.task_fromdate}
            </p>
            <p>
              <strong>End Date:</strong>{" "}
              {task.task_enddate ? task.task_enddate : ""}
            </p>
          </div>
        ))
      )}
      <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
        <button
          onClick={onHide}
          style={{
            padding: "8px 16px",
            backgroundColor: "#dc2626",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};
type ReminderCountProps = {
  events: CalendarEvent[];
  supportTicketFlag?: number;
};

// ReminderCount component
export const ReminderCount = ({ events, supportTicketFlag }: ReminderCountProps) => {
  const currentDate = startOfDay(new Date());
  const isTask = supportTicketFlag == 0;
  const validEvents = events.filter((event) => isValid(event.start));
  const groupedByDate = validEvents.reduce(
    (acc, event) => {
      const date = format(startOfDay(event.start), "yyyy-MM-dd");
      acc[date] = acc[date] || {
        totalReminders: 0,
        dueReminders: 0,
        totalTasks: 0,
        dueTasks: 0,
      };

      if (event.isTask) {
        acc[date].totalTasks += 1;
        if (
          event.task_enddate &&
          isBefore(parseDateString(event.task_enddate), currentDate) &&
          event.status !== -6
        ) {
          acc[date].dueTasks += 1;
        }
      } else {
        acc[date].totalReminders += 1;
        if (event.isDue === 1 && !event.status) {
          acc[date].dueReminders += 1;
        }
      }
      return acc;
    },
    {} as Record<
      string,
      {
        totalReminders: number;
        dueReminders: number;
        totalTasks: number;
        dueTasks: number;
      }
    >,
  );

  const sortedDates = Object.keys(groupedByDate).sort();

  return (
    <div
      style={{
        marginTop: "20px",
        padding: "15px",
        backgroundColor: "#f9f9f9",
        borderRadius: "8px",
        border: "1px solid #e2e8f0",
      }}
    >
      <h3 style={{ marginBottom: "15px", fontSize: "18px", fontWeight: "600" }}>
        Reminder,Task And Support Tickets Counts by Date
      </h3>
      {sortedDates.length === 0 ? (
        <p>No reminders or tasks found.</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: "1px solid #d1d5db",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f3f4f6" }}>
              <th>Date</th>
              <th>Total Reminders</th>
              <th>Due Reminders</th>
              <th>{isTask ? "Total Task" : "Total Support Tickets"}</th>
              <th>{isTask ? "Due Tasks" : "Due Support Tickets"}</th>
            </tr>
          </thead>
          <tbody>
            {sortedDates.map((date) => (
              <tr
                key={date}
                style={{
                  backgroundColor:
                    date === format(new Date(), "yyyy-MM-dd")
                      ? "#e0f2fe"
                      : "transparent",
                }}
              >
                <td>{format(parseISO(date), "MMMM d, yyyy")}</td>
                <td style={{ textAlign: "center" }}>
                  {groupedByDate[date].totalReminders}
                </td>
                <td
                  style={{
                    textAlign: "center",
                    color:
                      groupedByDate[date].dueReminders > 0
                        ? "#dc2626"
                        : "inherit",
                  }}
                >
                  {groupedByDate[date].dueReminders}
                </td>
                <td style={{ textAlign: "center" }}>
                  {groupedByDate[date].totalTasks}
                </td>
                <td
                  style={{
                    textAlign: "center",
                    color:
                      groupedByDate[date].dueTasks > 0 ? "#00008b" : "inherit",
                  }}
                >
                  {groupedByDate[date].dueTasks}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

// CustomEvent component
export const CustomEvent = ({
  event,
  events,
}: {
  event: CalendarEvent;
  events: CalendarEvent[];
}) => {
  const currentDate = startOfDay(new Date());
  const sameDayEvents = events.filter(
    (e) => isValid(e.start) && isSameDay(e.start, event.start),
  );

  const totalReminders = sameDayEvents.filter((e) => !e.isTask).length;
  const dueReminders = sameDayEvents.filter(
    (e) => !e.isTask && e.isDue === 1 && !e.status,
  ).length;
  const totalTasks = sameDayEvents.filter((e) => e.isTask).length;
  const dueTasks = sameDayEvents.filter(
    (e) =>
      e.isTask &&
      e.task_enddate &&
      isBefore(parseDateString(e.task_enddate), currentDate) &&
      e.status !== -6,
  ).length;

  return (
    <div
      style={{
        padding: "5px",
        backgroundColor: "white",
        display: "flex",
        justifyContent: "space-evenly",
      }}
    >
      {totalReminders > 0 && (
        <p
          style={{
            fontSize: "0.6rem",
            borderRadius: "50%",
            minWidth: "20px",
            height: "22px",
            alignItems: "center",
            justifyContent: "center",
            display: "flex",
            color: dueReminders > 0 ? "white" : "black",
            border: dueReminders > 0 ? "none" : "0.5px solid black",
            backgroundColor: dueReminders > 0 ? "#dc2626" : "white",
          }}
        >
          R: {dueReminders > 0 ? dueReminders : totalReminders}
        </p>
      )}
      {totalTasks > 0 && (
        <p
          style={{
            fontSize: "0.6rem",
            borderRadius: "50%",
            minWidth: "20px",
            height: "22px",
            alignItems: "center",
            justifyContent: "center",
            display: "flex",
            color: "black",
            border: "0.5px solid black",
            backgroundColor: "lightPink",
          }}
        >
          T: {totalTasks}
        </p>
      )}
      {dueTasks > 0 && (
        <p
          style={{
            fontSize: "0.6rem",
            borderRadius: "50%",
            minWidth: "20px",
            height: "22px",
            alignItems: "center",
            justifyContent: "center",
            display: "flex",
            color: "white",
            border: "none",
            backgroundColor: "#00008b",
          }}
        >
          DT: {dueTasks}
        </p>
      )}
    </div>
  );
};

const ReminderCalendar: React.FC<ReminderCalendarProps> = ({
  isCalendarOpen,
  closeCalendar,
  reminderList: propReminderList,
  targetVsIncentiveList,
  supportTicketFlag,
}) => {
  const [reminderList, setReminderList] = useState<IReminderList[]>(
    propReminderList || [],
  );
  const [loading, setLoading] = useState(false);
  const [noDataFound, setNoDataFound] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [reminderCheckFlag, setReminderCheckFlag] = useState<number>(0);
  const [allReminderCheckFlag, setAllReminderCheckFlag] = useState<number>(0);
  const [companyFlag, setCompanyFlag] = useState<string | number | null>(null);
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState<Date>(new Date());
  const [showReport, setShowReport] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );
  const [selectedTasks, setSelectedTasks] = useState<CalendarEvent[]>([]);
  const [isSetReminderConfirmation, setIsSetReminderConfirmation] =
    useState(false);
  const [isReminderConfirmation, setIsReminderConfirmation] = useState(false);
  const [isCompleteReminderConfirmation, setIsCompleteReminderConfirmation] =
    useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [reminderRescheduleData, setReminderRescheduleData] = useState<
    IReminderList | undefined
  >();
  const [isOpenCreateModel, setIsCreateModel] = useState(false);
  const [refreshProduct, setRefreshProduct] = useState(false);
  const [taskList, setTaskList] = useState<ITaskView[]>(
    targetVsIncentiveList || [],
  );

  const { darkMode } = useTheme();
  const [counts, setCounts] = useState({ due: 0, future: 0, complete: 0 });

  const canView = useCheckUserPermission(
    PAGE_ID.REMINDER,
    PERMISSION_TYPE.VIEW,
  );
  const canAdd = useCheckUserPermission(PAGE_ID.REMINDER, PERMISSION_TYPE.ADD);

  const CanViewTask = useCheckUserPermission(
    PAGE_ID.TASK_MANAGEMENT,
    PERMISSION_TYPE.VIEW,
  );
  const CanAddTask = useCheckUserPermission(
    PAGE_ID.TASK_MANAGEMENT,
    PERMISSION_TYPE.ADD,
  );

  useEffect(() => {
    if (canView && isCalendarOpen) {
      setLoading(true);
      fetchReminderApi(
        0,
        ITEMS_PER_PAGE,
        setReminderList,
        "",
        setNoDataFound,
        setLoading,
        reminderCheckFlag,
        allReminderCheckFlag,
        setCompanyFlag,
        "",
        "",
        setCounts,
      );
      fetchApiTask(
        setTaskList,
        setLoading,
        "",
        undefined,
        undefined,
        undefined,
        undefined,
        0,
        50,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        supportTicketFlag // 👈 correct position
      );
    }
  }, [
    canView,
    isCalendarOpen,
    reminderCheckFlag,
    allReminderCheckFlag,
    companyFlag,
  ]);

  if (!isCalendarOpen) return null;

  const currentDate = startOfDay(new Date());

  const safeDate = (date: Date) => (isValid(date) ? date : new Date());

  const parseReminderDate = (dateStr: string) => {
    const [day, month, year, time] = dateStr.split(/[- ]/);
    return parseISO(`${year}-${month}-${day}T${time}`);
  };

  const isValidString = (val?: string) =>
    typeof val === "string" && val.trim() !== "";

  const events: CalendarEvent[] = [
    // Reminders
    ...reminderList
      .filter((item) => isValidString(item.reminder_data_time))
      .map((item) => {
        const isoDateStr = item.reminder_data_time!;
        const parsedDate = safeDate(parseReminderDate(isoDateStr));

        return {
          id: item.id,
          title: item.remark || "Untitled Reminder",
          start: parsedDate,
          end: parsedDate,
          status: item.status,
          isDue: item.isDue,
          remark: item.remark,
          assigned_to_name: item.assigned_to_name,
          assigned_to: item.assigned_to,
          reference_table: item.reference_table,
          reference_id: item.reference_id,
          contact_masters_id: item.contact_masters_id,
          mobile_number: item.mobile_number,
          person_name: item.person_name,
          username: item.username,
          contact_message: item.contact_message,
          company_masters_id: item.company_masters_id,
          isTask: false,
          created_date_time: item.created_date_time || isoDateStr,
        };
      }),

    // Tasks
    ...(targetVsIncentiveList ?? [])
      .map((item) => {
        const fromDate = parseDateString(item.task_fromdate);
        if (!isValid(fromDate)) return null;

        const endDate = item.task_enddate
          ? parseDateString(item.task_enddate)
          : fromDate;

        const isOverdue =
          item.task_enddate &&
          item.status !== -6 &&
          isValid(endDate) &&
          isBefore(endDate, currentDate);

        return {
          id: item.id,
          title: item.task_title || "Untitled Task",
          start: fromDate, // ✅ correct parsed date
          end: isValid(endDate) ? endDate : fromDate, // ✅ no override to today
          status: item.status || 0,
          isDue: isOverdue ? 1 : 0,
          remark: item.task_remark || "",
          assigned_to_name: item.assigned_team_member_names || "",
          assigned_to: item.assigned_team_member,
          reference_table: item.reference_table,
          reference_id: item.reference_id,
          contact_masters_id: item.contact_masters_id,
          company_masters_id: item.company_masters_id,
          isTask: true,
          stage_status_name: item.stage_status_name,
          stage_status_color: item.stage_status_color,
          created_date_time: item.created_date_time,
          task_enddate: item.task_enddate,
          task_fromdate: item.task_fromdate,
        };
      })
      .filter(Boolean) as CalendarEvent[]
  ].sort((a, b) => a.start.getTime() - b.start.getTime());

  const handleGetAllReminderData = () => {
    const newFlag = reminderCheckFlag === 1 ? 0 : 1;
    setReminderCheckFlag(newFlag);
    setCurrentPage(0);
    setLoading(true);
    fetchReminderApi(
      0,
      ITEMS_PER_PAGE,
      setReminderList,
      "",
      setNoDataFound,
      setLoading,
      newFlag,
      allReminderCheckFlag,
      setCompanyFlag,
      "",
      "",
      setCounts,
    );
  };

  const handleAllReminderCheckbox = () => {
    const newFlag = allReminderCheckFlag === 1 ? 0 : 1;
    setAllReminderCheckFlag(newFlag);
    setCurrentPage(0);
    setLoading(true);
    fetchReminderApi(
      0,
      ITEMS_PER_PAGE,
      setReminderList,
      "",
      setNoDataFound,
      setLoading,
      reminderCheckFlag,
      newFlag,
      setCompanyFlag,
      "",
      "",
      setCounts,
    );
  };

  const handleRefreshReminder = () => {
    if (canView) {
      setCurrentPage(0);
      setLoading(true);
      fetchReminderApi(
        0,
        ITEMS_PER_PAGE,
        setReminderList,
        "",
        setNoDataFound,
        setLoading,
        reminderCheckFlag,
        allReminderCheckFlag,
        setCompanyFlag,
        "",
        "",
        setCounts,
      );
    }
  };

  function openCreateTargetVsIncentive() {
    if (CanAddTask) {
      setIsCreateModel(true);
    } else {
      setIsCreateModel(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  }

  const handleNavigate = (action: "TODAY" | "PREV" | "NEXT") => {
    switch (action) {
      case "TODAY":
        setDate(startOfToday());
        break;
      case "PREV":
        setDate(
          sub(date, {
            [view === Views.DAY
              ? "days"
              : view === Views.WEEK
                ? "weeks"
                : "months"]: 1,
          }),
        );
        break;
      case "NEXT":
        setDate(
          add(date, {
            [view === Views.DAY
              ? "days"
              : view === Views.WEEK
                ? "weeks"
                : "months"]: 1,
          }),
        );
        break;
    }
  };

  const handleViewChange = (newView: View) => {
    setView(newView);
  };

  const toggleReport = () => {
    setShowReport(!showReport);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    if (event.isTask) {
      setSelectedTasks([event]); // only clicked task
      setIsTaskModalOpen(true);
    } else {
      setIsTaskModalOpen(false);
    }
  };

  const handleClosePopup = () => {
    setSelectedEvent(null);
    setSelectedTasks([]);
    setIsTaskModalOpen(false);
    setIsCompleteReminderConfirmation(false);
  };

  const handleSetReminder = async (data: {
    dateTime: string;
    remark: string;
    status: string;
    selectedCategory: { value: number; label: string } | null;
    referenceTable?: string;
    referenceId?: number;
  }) => {
    if (
      data.dateTime.trim() &&
      data.remark.trim() &&
      (data.selectedCategory?.value || reminderRescheduleData?.assigned_to)
    ) {
      createReminderForMy(
        {
          dateTime: data.dateTime,
          remark: data.remark,
          status: data.status,
          selectedCategory: data.selectedCategory || {
            value: reminderRescheduleData?.assigned_to || 0,
            label: reminderRescheduleData?.assigned_to_name || "",
          },
          referenceTable:
            data.referenceTable ||
            reminderRescheduleData?.reference_table ||
            null,
          referenceId:
            data.referenceId || reminderRescheduleData?.reference_id || null,
          contactMastersId: reminderRescheduleData?.contact_masters_id || null,
          mobileNumber: reminderRescheduleData?.mobile_number || undefined,
          contactMessage: reminderRescheduleData?.contact_message || undefined,
          companyMastersId: reminderRescheduleData?.company_masters_id,
          assignedTo: reminderRescheduleData?.assigned_to,
          assignedToName: reminderRescheduleData?.assigned_to_name,
        },
        setIsSetReminderConfirmation,
        setLoading,
        setReminderList,
        setNoDataFound,
        setCompanyFlag,
        "",
        setCounts,
      );
    } else {
      toast.error("Please enter Date and Time, Remark, and Select Team Member");
      setIsSetReminderConfirmation(true);
    }
  };

  const addReminder = () => {
    if (canAdd) {
      setIsSetReminderConfirmation(true);
      setReminderRescheduleData(undefined);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleReschedule = (event: CalendarEvent) => {
    if (!event.isTask) {
      setReminderRescheduleData(
        reminderList.find((item) => item.id === event.id),
      );
      setIsReminderConfirmation(true);
    } else {
      toast.info("Rescheduling tasks is not supported in this version.");
    }
  };

  const handleCompleteReminder = (event: CalendarEvent) => {
    if (!event.isTask) {
      setReminderRescheduleData(
        reminderList.find((item) => item.id === event.id),
      );
      setIsCompleteReminderConfirmation(true);
    }
  };

  const handleConfirmCompleteReminder = async () => {
    if (reminderRescheduleData) {
      createReminderForMy(
        {
          dateTime: reminderRescheduleData.reminder_data_time,
          remark: reminderRescheduleData.remark,
          status: "1", // Assuming status "1" is completed
          selectedCategory: {
            value: reminderRescheduleData.assigned_to || 0,
            label: reminderRescheduleData.assigned_to_name || "",
          },
          referenceTable: reminderRescheduleData.reference_table || null,
          referenceId: reminderRescheduleData.reference_id || null,
          contactMastersId: reminderRescheduleData.contact_masters_id || null,
          mobileNumber: reminderRescheduleData.mobile_number || undefined,
          contactMessage: reminderRescheduleData.contact_message || undefined,
          companyMastersId: reminderRescheduleData.company_masters_id,
          assignedTo: reminderRescheduleData.assigned_to,
          assignedToName: reminderRescheduleData.assigned_to_name,
        },
        setIsCompleteReminderConfirmation,
        setLoading,
        setReminderList,
        setNoDataFound,
        setCompanyFlag,
        "",
        setCounts,
      );
    }
  };

  const handleReminder = async (data: {
    dateTime: string;
    remark: string;
    status: string;
  }) => {
    if (data.dateTime.trim() && data.remark.trim()) {
      createRescheduleReminder(
        reminderRescheduleData?.id,
        data,
        setIsReminderConfirmation,
        setLoading,
        setReminderList,
        setNoDataFound,
        setCompanyFlag,
        "",
        setCounts,
      );
    } else {
      setIsReminderConfirmation(true);
      toast.error("Please enter Date and Time and Remark");
    }
  };

  const handleSelectSlot = ({ start }: { start: Date }) => {
    if (view === Views.MONTH) {
      setView(Views.DAY);
      setDate(startOfDay(start));
    }
  };

  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;
  const currentMonth = new Date().getMonth();

  const lastYearEvents = events.filter(
    (event) =>
      isValid(event.start) && isSameYear(event.start, new Date(lastYear, 0, 1)),
  );
  const currentYearEvents = events.filter(
    (event) =>
      isValid(event.start) &&
      isSameYear(event.start, new Date(currentYear, 0, 1)),
  );
  const currentMonthEvents = events.filter(
    (event) =>
      isValid(event.start) &&
      isSameYear(event.start, new Date(currentYear, 0, 1)) &&
      isSameMonth(event.start, new Date(currentYear, currentMonth, 1)),
  );

  const eventPropGetter = (
    event: CalendarEvent,
  ): { style?: CSSProperties } => ({
    style: {
      backgroundColor:
        event.isTask && event.stage_status_color
          ? event.stage_status_color
          : "white",
      borderRadius: "5px",
      color: event.isTask && event.stage_status_color ? "white" : "black",
      opacity: 1,
      border: event.isDue === 1 && event.isTask ? "2px solid #00008b" : "0px",
      display: "block",
      position: "relative",
      maxWidth: "100%",
    },
  });

  return (
    <div
      className="calendar-modal"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.7)",
        zIndex: 99,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          backgroundColor: darkMode ? "#1a1a1a" : "#fff",
          color: darkMode ? "#fff" : "#000",
          width: "100%",
          height: "100%",
          borderRadius: "12px",
          padding: "25px",
          position: "relative",
          overflow: "auto",
          boxShadow:
            "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)",
          border: darkMode ? "1px solid #374151" : "1px solid #e5e7eb",
        }}
      >
        <button
          onClick={closeCalendar}
          style={{
            position: "absolute",
            top: "15px",
            right: "20px",
            background: darkMode ? "#374151" : "#f3f4f6",
            border: "none",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            fontSize: "24px",
            cursor: "pointer",
            color: darkMode ? "#fff" : "#000",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = darkMode
              ? "#4b5563"
              : "#e5e7eb";
            e.currentTarget.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = darkMode
              ? "#374151"
              : "#f3f4f6";
            e.currentTarget.style.transform = "scale(1)";
          }}
          title="Close Calendar"
        >
          ×
        </button>

        <div style={{ padding: "10px", boxSizing: "border-box" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "28px",
                fontWeight: "600",
                background: darkMode
                  ? "linear-gradient(135deg, #60a5fa, #34d399)"
                  : "linear-gradient(135deg, #3b82f6, #10b981)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="30"
                viewBox="0 -960 960 960"
                width="30"
                fill="#3b82f6"
              >
                <path d="M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Zm0 0v-80 80Zm280 240q-17 0-28.5-11.5T440-440q0-17 11.5-28.5T480-480q17 0 28.5 11.5T520-440q0 17-11.5 28.5T480-400Zm-160 0q-17 0-28.5-11.5T280-440q0-17 11.5-28.5T320-480q17 0 28.5 11.5T360-440q0 17-11.5 28.5T320-400Zm320 0q-17 0-28.5-11.5T600-440q0-17 11.5-28.5T640-480q17 0 28.5 11.5T680-440q0 17-11.5 28.5T640-400ZM480-240q-17 0-28.5-11.5T440-280q0-17 11.5-28.5T480-320q17 0 28.5 11.5T520-280q0 17-11.5 28.5T480-240Zm-160 0q-17 0-28.5-11.5T280-280q0-17 11.5-28.5T320-320q17 0 28.5 11.5T360-280q0 17-11.5 28.5T320-240Zm320 0q-17 0-28.5-11.5T600-280q0-17 11.5-28.5T640-320q17 0 28.5 11.5T680-280q0 17-11.5 28.5T640-240Z" />
              </svg>{" "}
              Calendar
            </h2>
            <div className="me-4" style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={addReminder}
                style={{
                  background: "linear-gradient(135deg, #a5690fff, #f0e4c0ff)",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  color: "white",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <span title="Create Reminder">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
                    viewBox="0 -960 960 960"
                    width="24px"
                    fill="#5f6368"
                  >
                    <path d="M578-80q-17 0-28.5-11.5T538-120q0-17 11.5-28.5T578-160h113l-92-65q-14-10-16.5-25.5T589-280q9-14 25-16.5t30 6.5l93 64-39-106q-6-15 1-30t23-21q16-6 31 1t21 23l38 106 30-109q5-16 18.5-24.5T890-390q16 5 25 18.5t4 29.5L849-80H578Zm-378-80q-33 0-56.5-23.5T120-240v-480q0-33 23.5-56.5T200-800h40v-80h80v80h240v-80h80v80h40q33 0 56.5 23.5T760-720v244q-20-3-40-3t-40 3v-84H200v320h280q0 20 3 40t11 40H200Zm0-480h480v-80H200v80Zm0 0v-80 80Z" />
                  </svg>
                </span>
              </button>
              <button
                onClick={openCreateTargetVsIncentive}
                style={{
                  background: "linear-gradient(135deg, #10b981, #9fd3c2ff)",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  color: "white",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: "0 4px 6px rgba(16, 185, 129, 0.25)",
                }}
              >
                <span title="Create Task">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
                    viewBox="0 -960 960 960"
                    width="24px"
                    fill="#5f6368"
                  >
                    <path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q65 0 123 19t107 53l-58 59q-38-24-81-37.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160q32 0 62-6t58-17l60 61q-41 20-86 31t-94 11Zm280-80v-120H640v-80h120v-120h80v120h120v80H840v120h-80ZM424-296 254-466l56-56 114 114 400-401 56 56-456 457Z" />
                  </svg>
                </span>
              </button>
              <button
                onClick={handleRefreshReminder}
                style={{
                  background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  color: "white",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: "0 4px 6px rgba(59, 130, 246, 0.25)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 15px rgba(59, 130, 246, 0.35)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 6px rgba(59, 130, 246, 0.25)";
                }}
              >
                <span title="Refresh">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 50 50"
                    fill="currentColor"
                  >
                    <path d="M25 38c-7.2 0-13-5.8-13-13 0-3.2 1.2-6.2 3.3-8.6l1.5 1.3C15 19.7 14 22.3 14 25c0 6.1 4.9 11 11 11 1.6 0 3.1-.3 4.6-1l.8 1.8c-1.7.8-3.5 1.2-5.4 1.2z" />
                    <path d="M34.7 33.7l-1.5-1.3c1.8-2 2.8-4.6 2.8-7.3 0-6.1-4.9-11-11-11-1.6 0-3.1.3-4.6 1l-.8-1.8c1.7-.8 3.5-1.2 5.4-1.2 7.2 0 13 5.8 13 13 0 3.1-1.2 6.2-3.3 8.6z" />
                    <path d="M18 24h-2v-6h-6v-2h8z" />
                    <path d="M40 34h-8v-8h2v6h6z" />
                  </svg>
                </span>
              </button>
            </div>
          </div>
          <div
            className="col-12 d-flex m-0 p-0"
            style={{
              marginBottom: "20px",
              flexWrap: "wrap",
              gap: "3rem",
              alignItems: "center",
            }}
          >
            <div className=" d-flex">
              <label
                className="w-100"
                style={{
                  fontSize: "12px",
                  fontWeight: "500",
                  marginBottom: "0px",
                }}
              >
                All Status:
              </label>
              <div className="">
                <input
                  className="custom-checkbox"
                  type="checkbox"
                  onChange={handleGetAllReminderData}
                  checked={reminderCheckFlag === 1}
                  style={{
                    margin: "0 5px",
                    transform: "scale(1.2)",
                    accentColor: "#10b981",
                  }}
                />
              </div>
            </div>
            {companyFlag === 1 && (
              <div className=" d-flex">
                <label
                  className="w-100"
                  style={{
                    fontSize: "12px",
                    fontWeight: "500",
                    marginBottom: "0px",
                  }}
                >
                  Show All:
                </label>
                <div className="">
                  <input
                    className="custom-checkbox"
                    type="checkbox"
                    onChange={handleAllReminderCheckbox}
                    checked={allReminderCheckFlag === 1}
                    style={{
                      margin: "0 5px",
                      transform: "scale(1.2)",
                      accentColor: "#10b981",
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div
            style={{
              marginBottom: "20px",
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              padding: "15px",
              backgroundColor: darkMode ? "#374151" : "#f8fafc",
              borderRadius: "12px",
              border: darkMode ? "1px solid #4b5563" : "1px solid #e2e8f0",
            }}
          >
            {[
              { label: "Today", action: "TODAY", icon: "📅" },
              { label: "Back", action: "PREV", icon: "⬅️" },
              { label: "Next", action: "NEXT", icon: "➡️" },
              { label: "Month", action: Views.MONTH, icon: "🗓️" },
              { label: "Week", action: Views.WEEK, icon: "📊" },
              { label: "Day", action: Views.DAY, icon: "📋" },
              { label: "Agenda", action: Views.AGENDA, icon: "📝" },
            ].map((btn, index) => (
              <button
                key={index}
                onClick={() =>
                  ["TODAY", "PREV", "NEXT"].includes(btn.action)
                    ? handleNavigate(btn.action as "TODAY" | "PREV" | "NEXT")
                    : handleViewChange(btn.action as View)
                }
                style={{
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: "500",
                  border: "none",
                  borderRadius: "8px",
                  background:
                    view === btn.action ||
                      ["TODAY", "PREV", "NEXT"].includes(btn.action)
                      ? "linear-gradient(135deg, #8b5cf6, #7c3aed)"
                      : darkMode
                        ? "#4b5563"
                        : "#e2e8f0",
                  color:
                    view === btn.action ||
                      ["TODAY", "PREV", "NEXT"].includes(btn.action)
                      ? "white"
                      : darkMode
                        ? "#d1d5db"
                        : "#374151",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
                onMouseEnter={(e) => {
                  if (view !== btn.action) {
                    e.currentTarget.style.background = darkMode
                      ? "#6b7280"
                      : "#cbd5e1";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (view !== btn.action) {
                    e.currentTarget.style.background = darkMode
                      ? "#4b5563"
                      : "#e2e8f0";
                    e.currentTarget.style.transform = "translateY(0)";
                  }
                }}
              >
                <span>{btn.icon}</span>
                {btn.label}
              </button>
            ))}
            <button
              onClick={toggleReport}
              style={{
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: "500",
                border: "none",
                borderRadius: "8px",
                background: showReport
                  ? "linear-gradient(135deg, #f59e0b, #d97706)"
                  : darkMode
                    ? "#4b5563"
                    : "#e2e8f0",
                color: showReport ? "white" : darkMode ? "#d1d5db" : "#374151",
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
              onMouseEnter={(e) => {
                if (!showReport) {
                  e.currentTarget.style.background = darkMode
                    ? "#6b7280"
                    : "#cbd5e1";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!showReport) {
                  e.currentTarget.style.background = darkMode
                    ? "#4b5563"
                    : "#e2e8f0";
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              <span>📊</span>
              {showReport ? "Hide Report" : "Show Report"}
            </button>
          </div>

          <div
            style={{
              borderRadius: "12px",
              overflow: "hidden",
              border: darkMode ? "1px solid #374151" : "1px solid #e2e8f0",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          >
            <BigCalendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{
                height: "450px",
                width: "100%",
                marginBottom: "10px",
                backgroundColor: darkMode ? "#2d3748" : "#fff",
                color: darkMode ? "#fff" : "#000",
              }}
              views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
              view={view}
              date={date}
              onNavigate={setDate}
              onView={handleViewChange}
              eventPropGetter={eventPropGetter}
              components={{
                event: (props) => <CustomEvent {...props} events={events} />,
              }}
              onSelectEvent={handleEventClick}
              onSelectSlot={handleSelectSlot}
              selectable={true}
            />
          </div>

          {showReport && (
            <div
              style={{
                marginTop: "20px",
                padding: "20px",
                backgroundColor: darkMode ? "#374151" : "#f8fafc",
                borderRadius: "12px",
                border: darkMode ? "1px solid #4b5563" : "1px solid #e2e8f0",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
            >
              <h3
                style={{
                  marginBottom: "15px",
                  fontSize: "20px",
                  fontWeight: "600",
                  color: darkMode ? "#f3f4f6" : "#1f2937",
                }}
              >
                📈 Reminders and Task and Support Tickets Report
              </h3>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  border: darkMode ? "1px solid #4b5563" : "1px solid #d1d5db",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <thead>
                  <tr
                    style={{
                      backgroundColor: darkMode ? "#4b5563" : "#f3f4f6",
                    }}
                  >
                    <th
                      style={{
                        border: darkMode
                          ? "1px solid #6b7280"
                          : "1px solid #d1d5db",
                        padding: "12px 8px",
                        fontWeight: "600",
                        fontSize: "14px",
                      }}
                    >
                      Period
                    </th>
                    <th
                      style={{
                        border: darkMode
                          ? "1px solid #6b7280"
                          : "1px solid #d1d5db",
                        padding: "12px 8px",
                        fontWeight: "600",
                        fontSize: "14px",
                      }}
                    >
                      Total Reminders
                    </th>
                    <th
                      style={{
                        border: darkMode
                          ? "1px solid #6b7280"
                          : "1px solid #d1d5db",
                        padding: "12px 8px",
                        fontWeight: "600",
                        fontSize: "14px",
                      }}
                    >
                      Due Reminders
                    </th>
                    <th
                      style={{
                        border: darkMode
                          ? "1px solid #6b7280"
                          : "1px solid #d1d5db",
                        padding: "12px 8px",
                        fontWeight: "600",
                        fontSize: "14px",
                      }}
                    >
                      {supportTicketFlag == 0 ? "Total Tasks" : "Total Support Tickets"}
                    </th>
                    <th
                      style={{
                        border: darkMode
                          ? "1px solid #6b7280"
                          : "1px solid #d1d5db",
                        padding: "12px 8px",
                        fontWeight: "600",
                        fontSize: "14px",
                      }}
                    >
                      {supportTicketFlag == 0 ? "Due Tasks" : "Due Support Tickets"}
                    </th>
                    <th
                      style={{
                        border: darkMode
                          ? "1px solid #6b7280"
                          : "1px solid #d1d5db",
                        padding: "12px 8px",
                        fontWeight: "600",
                        fontSize: "14px",
                      }}
                    >
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td
                      style={{
                        border: darkMode
                          ? "1px solid #6b7280"
                          : "1px solid #d1d5db",
                        padding: "10px 8px",
                        fontSize: "13px",
                      }}
                    >
                      Last Year ({lastYear})
                    </td>
                    <td
                      style={{
                        border: darkMode
                          ? "1px solid #6b7280"
                          : "1px solid #d1d5db",
                        padding: "10px 8px",
                        textAlign: "center",
                        fontWeight: "600",
                        fontSize: "13px",
                      }}
                    >
                      {lastYearEvents.filter((e) => !e.isTask).length}
                    </td>
                    <td
                      style={{
                        border: darkMode
                          ? "1px solid #6b7280"
                          : "1px solid #d1d5db",
                        padding: "10px 8px",
                        textAlign: "center",
                        fontWeight: "600",
                        fontSize: "13px",
                        color:
                          lastYearEvents.filter(
                            (e) => !e.isTask && e.isDue === 1 && !e.status,
                          ).length > 0
                            ? "#dc2626"
                            : "inherit",
                      }}
                    >
                      {
                        lastYearEvents.filter(
                          (e) => !e.isTask && e.isDue === 1 && !e.status,
                        ).length
                      }
                    </td>
                    <td
                      style={{
                        border: darkMode
                          ? "1px solid #6b7280"
                          : "1px solid #d1d5db",
                        padding: "10px 8px",
                        textAlign: "center",
                        fontWeight: "600",
                        fontSize: "13px",
                      }}
                    >
                      {lastYearEvents.filter((e) => e.isTask).length}
                    </td>
                    <td
                      style={{
                        border: darkMode
                          ? "1px solid #6b7280"
                          : "1px solid #d1d5db",
                        padding: "10px 8px",
                        textAlign: "center",
                        fontWeight: "600",
                        fontSize: "13px",
                        color:
                          lastYearEvents.filter(
                            (e) =>
                              e.isTask &&
                              e.task_enddate &&
                              isBefore(
                                parseISO(e.task_enddate),
                                startOfDay(new Date()),
                              ) &&
                              e.status !== -6,
                          ).length > 0
                            ? "#00008b"
                            : "inherit",
                      }}
                    >
                      {
                        lastYearEvents.filter(
                          (e) =>
                            e.isTask &&
                            e.task_enddate &&
                            isBefore(
                              parseISO(e.task_enddate),
                              startOfDay(new Date()),
                            ) &&
                            e.status !== -6,
                        ).length
                      }
                    </td>
                    <td
                      style={{
                        border: darkMode
                          ? "1px solid #6b7280"
                          : "1px solid #d1d5db",
                        padding: "10px 8px",
                        fontSize: "12px",
                      }}
                    >
                      {lastYearEvents.map((event, index) => (
                        <div key={index} style={{ marginBottom: "4px" }}>
                          {event.isTask ? "[Task]" : "[Reminder]"} {event.title}{" "}
                          - {format(event.start, "MMMM d, yyyy HH:mm")}{" "}
                          {event.isDue === 1 ? "(Due)" : ""}{" "}
                          {event.isTask && event.stage_status_name
                            ? `(${event.stage_status_name})`
                            : ""}
                        </div>
                      ))}
                    </td>
                  </tr>
                  <tr
                    style={{
                      backgroundColor: darkMode ? "#374151" : "#f9fafb",
                    }}
                  >
                    <td
                      style={{
                        border: darkMode
                          ? "1px solid #6b7280"
                          : "1px solid #d1d5db",
                        padding: "10px 8px",
                        fontSize: "13px",
                      }}
                    >
                      Current Year ({currentYear})
                    </td>
                    <td
                      style={{
                        border: darkMode
                          ? "1px solid #6b7280"
                          : "1px solid #d1d5db",
                        padding: "10px 8px",
                        textAlign: "center",
                        fontWeight: "600",
                        fontSize: "13px",
                      }}
                    >
                      {currentYearEvents.filter((e) => !e.isTask).length}
                    </td>
                    <td
                      style={{
                        border: darkMode
                          ? "1px solid #6b7280"
                          : "1px solid #d1d5db",
                        padding: "10px 8px",
                        textAlign: "center",
                        fontWeight: "600",
                        fontSize: "13px",
                        color:
                          currentYearEvents.filter(
                            (e) => !e.isTask && e.isDue === 1 && !e.status,
                          ).length > 0
                            ? "#dc2626"
                            : "inherit",
                      }}
                    >
                      {
                        currentYearEvents.filter(
                          (e) => !e.isTask && e.isDue === 1 && !e.status,
                        ).length
                      }
                    </td>
                    <td
                      style={{
                        border: darkMode
                          ? "1px solid #6b7280"
                          : "1px solid #d1d5db",
                        padding: "10px 8px",
                        textAlign: "center",
                        fontWeight: "600",
                        fontSize: "13px",
                      }}
                    >
                      {currentYearEvents.filter((e) => e.isTask).length}
                    </td>
                    <td
                      style={{
                        border: darkMode
                          ? "1px solid #6b7280"
                          : "1px solid #d1d5db",
                        padding: "10px 8px",
                        textAlign: "center",
                        fontWeight: "600",
                        fontSize: "13px",
                        color:
                          currentYearEvents.filter(
                            (e) =>
                              e.isTask &&
                              e.task_enddate &&
                              isBefore(
                                parseISO(e.task_enddate),
                                startOfDay(new Date()),
                              ) &&
                              e.status !== -6,
                          ).length > 0
                            ? "#00008b"
                            : "inherit",
                      }}
                    >
                      {
                        currentYearEvents.filter(
                          (e) =>
                            e.isTask &&
                            e.task_enddate &&
                            isBefore(
                              parseISO(e.task_enddate),
                              startOfDay(new Date()),
                            ) &&
                            e.status !== -6,
                        ).length
                      }
                    </td>
                    <td
                      style={{
                        border: darkMode
                          ? "1px solid #6b7280"
                          : "1px solid #d1d5db",
                        padding: "10px 8px",
                        fontSize: "12px",
                      }}
                    >
                      {currentYearEvents.map((event, index) => (
                        <div key={index} style={{ marginBottom: "4px" }}>
                          {event.isTask ? "[Task]" : "[Reminder]"} {event.title}{" "}
                          - {format(event.start, "MMMM d, yyyy HH:mm")}{" "}
                          {event.isDue === 1 ? "(Due)" : ""}{" "}
                          {event.isTask && event.stage_status_name
                            ? `(${event.stage_status_name})`
                            : ""}
                        </div>
                      ))}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        border: darkMode
                          ? "1px solid #6b7280"
                          : "1px solid #d1d5db",
                        padding: "10px 8px",
                        fontSize: "13px",
                      }}
                    >
                      Current Month ({format(new Date(), "MMMM yyyy")})
                    </td>
                    <td
                      style={{
                        border: darkMode
                          ? "1px solid #6b7280"
                          : "1px solid #d1d5db",
                        padding: "10px 8px",
                        textAlign: "center",
                        fontWeight: "600",
                        fontSize: "13px",
                      }}
                    >
                      {currentMonthEvents.filter((e) => !e.isTask).length}
                    </td>
                    <td
                      style={{
                        border: darkMode
                          ? "1px solid #6b7280"
                          : "1px solid #d1d5db",
                        padding: "10px 8px",
                        textAlign: "center",
                        fontWeight: "600",
                        fontSize: "13px",
                        color:
                          currentMonthEvents.filter(
                            (e) => !e.isTask && e.isDue === 1 && !e.status,
                          ).length > 0
                            ? "#dc2626"
                            : "inherit",
                      }}
                    >
                      {
                        currentMonthEvents.filter(
                          (e) => !e.isTask && e.isDue === 1 && !e.status,
                        ).length
                      }
                    </td>
                    <td
                      style={{
                        border: darkMode
                          ? "1px solid #6b7280"
                          : "1px solid #d1d5db",
                        padding: "10px 8px",
                        textAlign: "center",
                        fontWeight: "600",
                        fontSize: "13px",
                      }}
                    >
                      {currentMonthEvents.filter((e) => e.isTask).length}
                    </td>
                    <td
                      style={{
                        border: darkMode
                          ? "1px solid #6b7280"
                          : "1px solid #d1d5db",
                        padding: "10px 8px",
                        textAlign: "center",
                        fontWeight: "600",
                        fontSize: "13px",
                        color:
                          currentMonthEvents.filter(
                            (e) =>
                              e.isTask &&
                              e.task_enddate &&
                              isBefore(
                                parseISO(e.task_enddate),
                                startOfDay(new Date()),
                              ) &&
                              e.status !== -6,
                          ).length > 0
                            ? "#00008b"
                            : "inherit",
                      }}
                    >
                      {
                        currentMonthEvents.filter(
                          (e) =>
                            e.isTask &&
                            e.task_enddate &&
                            isBefore(
                              parseISO(e.task_enddate),
                              startOfDay(new Date()),
                            ) &&
                            e.status !== -6,
                        ).length
                      }
                    </td>
                    <td
                      style={{
                        border: darkMode
                          ? "1px solid #6b7280"
                          : "1px solid #d1d5db",
                        padding: "10px 8px",
                        fontSize: "12px",
                      }}
                    >
                      {currentMonthEvents.map((event, index) => (
                        <div key={index} style={{ marginBottom: "4px" }}>
                          {event.isTask ? "[Task]" : "[Reminder]"} {event.title}{" "}
                          - {format(event.start, "MMMM d, yyyy HH:mm")}{" "}
                          {event.isDue === 1 ? "(Due)" : ""}{" "}
                          {event.isTask && event.stage_status_name
                            ? `(${event.stage_status_name})`
                            : ""}
                        </div>
                      ))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <ReminderCount events={events} supportTicketFlag={supportTicketFlag} />

          {selectedEvent && view === Views.DAY && !selectedEvent.isTask && (
            <div
              style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                backgroundColor: darkMode ? "#2d3748" : "#fff",
                padding: "20px",
                borderRadius: "8px",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                zIndex: 10000,
                color: darkMode ? "#e2e8f0" : "#1a202c",
                border: darkMode ? "1px solid #4a5568" : "1px solid #e2e8f0",
              }}
            >
              <h3 style={{ marginBottom: "15px" }}>Reminder Actions</h3>
              <p>Reminder: {selectedEvent.title}</p>
              <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                <button
                  onClick={() => handleCompleteReminder(selectedEvent)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#10b981",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Completed
                </button>
                <button
                  onClick={() => handleReschedule(selectedEvent)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#f59e0b",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Reschedule
                </button>
                <button
                  onClick={handleClosePopup}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#dc2626",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {isTaskModalOpen && (
            <TaskModal
              show={isTaskModalOpen}
              onHide={handleClosePopup}
              tasks={selectedTasks}
              darkMode={darkMode}
            />
          )}

          {isSetReminderConfirmation && (
            <ReminderModal
              show={isSetReminderConfirmation}
              onHide={() => setIsSetReminderConfirmation(false)}
              handleSubmit={(data) =>
                handleSetReminder({
                  ...data,
                  referenceTable: reminderRescheduleData?.reference_table || "",
                  referenceId: reminderRescheduleData?.reference_id || 0,
                })
              }
              title="Set Reminder"
              message="Set a new reminder"
              btn1="CANCEL"
              btn2="Set Reminder"
              remarkMsg={reminderRescheduleData?.remark || ""}
              request_flag={
                reminderRescheduleData?.reference_table ===
                  "contact_message_histories"
                  ? "2"
                  : ""
              }
              ContactMessageId={
                reminderRescheduleData?.reference_table ===
                  "contact_message_histories"
                  ? reminderRescheduleData?.reference_id
                  : undefined
              }
            />
          )}

          {isReminderConfirmation && (
            <ReminderModal
              show={isReminderConfirmation}
              onHide={() => setIsReminderConfirmation(false)}
              handleSubmit={handleReminder}
              title="Reminder Reschedule"
              message="Are you sure you want to reschedule this reminder?"
              btn1="CANCEL"
              btn2="Set Reminder"
              remarkMsg={reminderRescheduleData?.remark}
              selectedMember={reminderRescheduleData?.assigned_to_name}
              selectedMemberId={reminderRescheduleData?.assigned_to}
              request_flag="1"
            />
          )}

          {isCompleteReminderConfirmation && (
            <ReminderModal
              show={isCompleteReminderConfirmation}
              onHide={() => setIsCompleteReminderConfirmation(false)}
              handleSubmit={() => handleConfirmCompleteReminder()}
              title="Complete Reminder"
              message="Are you sure you want to mark this reminder as completed?"
              btn1="CANCEL"
              btn2="Confirm"
              remarkMsg={reminderRescheduleData?.remark}
              request_flag="1"
            // readOnly={true}
            />
          )}

          {isOpenCreateModel && (
            <CreateTaskView
              show={isOpenCreateModel}
              onHide={() => setIsCreateModel(false)}
              setTargetVsIncentiveList={setTaskList}
              setLoading={setLoading}
              headerName="Create Task"
              setRefreshProduct={setRefreshProduct}
              productToEdit={undefined}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ReminderCalendar;
