import { Button as PrimeButton } from "primereact/button";
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import LazyBoundary from "../../../components/LazyBoundary";
import { lazyWithRetry as lazy } from "../../../common/lazyWithRetry";
import { Button, Modal } from "react-bootstrap";
import { toast } from "react-toastify";
import { AppContext } from "../../../common/AppContext";
import "../../../components/model/ConfirmationModal.css";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../helpers/AppEnum";
import { createReminderForMy } from "../../left-side/header/list-reminder/ListReminderController";
import QuickActionCustomerPicker from "./QuickActionCustomerPicker";
import {
  fetchTodayNumbers,
  IPickCustomer,
  ITodayNumbers,
  loadQuickActionPrefs,
  saveQuickActionPrefs,
} from "./quickActionsController";
import {
  buildQuickActionRegistry,
  IQuickAction,
  QUICK_ACTION_LIMIT,
  QUICK_GROUP_LABEL,
  resolveQuickActions,
  TQuickGroup,
} from "./quickActionsRegistry";

// The create popups are big and only open on a click, so they load then, not with the Quick actions page.
const CreateContactView = lazy(() => import("../../left-side/create-contact/CreateContactView"));
const CreateTaskView = lazy(() => import("../../right-side/create-task/CreateTaskView"));
const CreateVisitView = lazy(() => import("../../left-side/header/Setting/visits/create-visit/CreateVisitView"));
const JobCardView = lazy(() => import("../../left-side/header/Setting/job-card/JobCardView"));
const CreateInquiryView = lazy(() => import("../../right-side/create-inquiry/CreateInquiryView"));
const OrderCreateModal = lazy(() => import("../../../components/model/OrderCreateModel/OrderCreateModal"));
const ReminderModal = lazy(() => import("../../../components/model/ReminderModal"));

interface IProps {
  /** Opens one of the Side view's report / list screens by its slug. */
  onReportClick: (slug: string) => void;
}

type TPopup =
  | { kind: "contact" | "task" | "visit" | "jobcard" }
  | { kind: "picker"; action: "inquiry" | "reminder" }
  | { kind: "inquiry" | "reminder"; customer: IPickCustomer }
  | { kind: "document"; orderType: number };

const MODAL_THEME = "modal-light-1";
const GROUP_ORDER: TQuickGroup[] = ["daily", "sales", "production", "field"];
const noop = () => {};

const chipStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  padding: "8px 14px",
  borderRadius: "20px",
  border: "1px solid #ccc",
  background: "#ffffff",
  color: "#000000",
  fontSize: "14px",
  cursor: "pointer",
};

/** Web twin of the app's Home > Quick actions tab: today's numbers, the user's chosen actions, "More" for every other
 * action, and "Customise" (up to 8, saved with the app's own saved-choice service, so both show the same ones). */
const QuickActionsHome: React.FC<IProps> = ({ onReportClick }) => {
  const { permissions } = useContext(AppContext)!;

  // Same rights check the sidebar uses.
  const hasPermission = useCallback(
    (pageId: number, type: string) => {
      const page = permissions?.find((p: any) => p.page_id === pageId);
      if (!page) return false;
      try {
        let rights = page.a_page_id_rights_jason;
        if (typeof rights === "string") rights = JSON.parse(rights);
        if (typeof rights === "string") rights = JSON.parse(rights);
        return rights?.[type] === 1;
      } catch {
        return false;
      }
    },
    [permissions],
  );

  // Every action this user may use (an action whose page is unknown is hidden, never shown by mistake).
  const allowed = useMemo(() => buildQuickActionRegistry().filter((a) => a.pageId > 0 && hasPermission(a.pageId, a.right)), [hasPermission]);

  const [saved, setSaved] = useState<{ order: string[] | null; hidden: string[] } | null>(null);
  useEffect(() => {
    loadQuickActionPrefs().then(setSaved);
  }, []);
  const shown = useMemo(() => (saved ? resolveQuickActions(allowed, saved.order, saved.hidden).slice(0, QUICK_ACTION_LIMIT) : []), [allowed, saved]);

  // ---- Today ---------------------------------------------------------------
  const canTasks = hasPermission(PAGE_ID.TASK_MANAGEMENT, PERMISSION_TYPE.VIEW);
  const canReminders = hasPermission(PAGE_ID.REMINDER, PERMISSION_TYPE.VIEW);
  const canVisits = hasPermission(PAGE_ID.VISIT, PERMISSION_TYPE.VIEW);
  const canCalls = hasPermission(PAGE_ID.CALL_HISTORY, PERMISSION_TYPE.VIEW);
  const [today, setToday] = useState<ITodayNumbers | null>(null);
  const loadToday = useCallback(() => {
    fetchTodayNumbers({ canTasks, canReminders, canInsight: canVisits || canCalls }).then(setToday);
  }, [canTasks, canReminders, canVisits, canCalls]);
  useEffect(() => {
    if (permissions && permissions.length > 0) loadToday();
  }, [permissions, loadToday]);

  const tiles = [
    { show: canTasks, label: "Overdue tasks", value: today?.overdueTasks, slug: "alltask_report" },
    { show: canReminders, label: "Reminders due", value: today?.remindersDue, slug: "allreminder_report" },
    { show: canVisits, label: "Today's visits", value: today?.todayVisits, slug: "all_visit_report" },
    { show: canCalls, label: "Today's calls", value: today?.todayCalls, slug: "all_call_report" },
  ].filter((t) => t.show);

  // ---- Running an action ---------------------------------------------------
  const [popup, setPopup] = useState<TPopup | null>(null);
  const [sheet, setSheet] = useState<"more" | "customise" | null>(null);
  const closePopup = () => {
    setPopup(null);
    loadToday(); // a new task / visit / reminder changes the numbers
  };

  const run = (action: IQuickAction) => {
    setSheet(null);
    const open = action.open;
    if (open.kind === "report") onReportClick(open.slug);
    else if (open.kind === "document") setPopup({ kind: "document", orderType: open.orderType });
    else if ("needsCustomer" in open) setPopup({ kind: "picker", action: open.popup });
    else setPopup({ kind: open.popup });
  };

  // ---- Customise -----------------------------------------------------------
  const [draft, setDraft] = useState<string[]>([]);
  const openCustomise = () => {
    setDraft(shown.map((a) => a.id));
    setSheet("customise");
  };
  const move = (index: number, by: number) =>
    setDraft((d) => {
      const next = [...d];
      const to = index + by;
      if (to < 0 || to >= next.length) return d;
      [next[index], next[to]] = [next[to], next[index]];
      return next;
    });
  const saveDraft = async () => {
    const ok = await saveQuickActionPrefs(draft, []);
    if (ok) {
      setSaved({ order: draft, hidden: [] });
      setSheet(null);
      toast.success("Quick actions saved");
    } else {
      toast.error("Could not save. Please try again.");
    }
  };
  const byId = useMemo(() => new Map(allowed.map((a) => [a.id, a])), [allowed]);

  // One box per action: a round icon on top of its name. The icon of an "Add" action is orange (the one use of orange the
  // report guidelines allow, the primary add action) and its name starts with "Add"; every other action is dark grey.
  const actionTile = (t: { label: string; icon: string; add: boolean; dashed?: boolean; onClick: () => void }) => (
    <button
      type="button"
      onClick={t.onClick}
      title={t.label}
      className="w-100 h-100 d-flex flex-column align-items-center justify-content-center text-center"
      style={{
        background: "#ffffff",
        border: `1px ${t.dashed ? "dashed" : "solid"} #d5d9de`,
        borderRadius: "12px",
        padding: "18px 10px",
        gap: "10px",
        cursor: "pointer",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        transition: "box-shadow 0.15s ease, border-color 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,0,0,0.15)";
        e.currentTarget.style.borderColor = "#4C4C4C";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
        e.currentTarget.style.borderColor = "#d5d9de";
      }}
    >
      <span
        className="d-flex align-items-center justify-content-center"
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          background: t.add ? "#fdeee1" : "#f1f2f3",
          color: t.add ? "#f58634" : "#4C4C4C",
          fontSize: "22px",
        }}
      >
        <i className={t.icon} />
      </span>
      <span className="text-dark fw-semibold" style={{ fontSize: "14px", lineHeight: 1.25 }}>
        {t.label}
      </span>
    </button>
  );

  const actionChip = (a: IQuickAction) => (
    <button key={a.id} type="button" style={chipStyle} onClick={() => run(a)} title={a.label}>
      <i className={a.icon} />
      {a.label}
    </button>
  );

  const groupedList = (render: (a: IQuickAction) => React.ReactNode, filter: (a: IQuickAction) => boolean = () => true) =>
    GROUP_ORDER.map((g) => {
      const items = allowed.filter((a) => a.group === g && filter(a));
      if (items.length === 0) return null;
      return (
        <div key={g} className="mb-3">
          <h6 className="fw-bold text-dark mb-2">{QUICK_GROUP_LABEL[g]}</h6>
          <div className="d-flex flex-wrap gap-2">{items.map(render)}</div>
        </div>
      );
    });

  return (
    <div style={{ padding: "16px" }}>
      {/* Today */}
      {tiles.length > 0 && (
        <div className="mb-4">
          <h6 className="fw-bold text-dark mb-2">Today</h6>
          <div className="row g-3">
            {tiles.map((t) => (
              <div className="col-6 col-md-3" key={t.label}>
                <button
                  type="button"
                  onClick={() => onReportClick(t.slug)}
                  className="w-100 border-0 text-start p-3 h-100"
                  style={{ background: "#f1f2f3", borderLeft: "4px solid #4C4C4C", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.12)" }}
                  title="Click to open the list"
                >
                  <span className="fw-bold d-block" style={{ fontSize: "26px", color: "#4C4C4C", lineHeight: 1.1 }}>
                    {today === null ? "..." : (t.value ?? "-")}
                  </span>
                  <span className="text-dark fw-semibold" style={{ fontSize: "14px" }}>
                    {t.label}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* The user's actions */}
      <div className="d-flex align-items-center justify-content-between mb-2">
        <h6 className="fw-bold text-dark mb-0">My actions</h6>
        <PrimeButton
          icon="pi pi-sliders-h"
          label="Customise"
          className="p-button-text"
          style={{ color: "#4C4C4C" }}
          onClick={openCustomise}
          disabled={allowed.length === 0}
        />
      </div>
      {saved === null && <div className="text-muted small mb-2">Loading...</div>}
      {saved !== null && shown.length === 0 && <div className="text-muted small mb-2">No actions chosen yet. Use Customise to pick up to {QUICK_ACTION_LIMIT}.</div>}
      <div className="row g-3 mb-2">
        {shown.map((a) => (
          <div className="col-6 col-md-4 col-xl-3" key={a.id}>
            {actionTile({ label: a.label, icon: a.icon, add: a.right === PERMISSION_TYPE.ADD, onClick: () => run(a) })}
          </div>
        ))}
        {saved !== null && allowed.length > shown.length && (
          <div className="col-6 col-md-4 col-xl-3">
            {actionTile({ label: "More", icon: "pi pi-ellipsis-h", add: false, dashed: true, onClick: () => setSheet("more") })}
          </div>
        )}
      </div>

      {/* More: every action the user may use */}
      <Modal show={sheet === "more"} onHide={() => setSheet(null)} size="lg" centered scrollable className={MODAL_THEME}>
        <div className={`p-10 m-title ${MODAL_THEME}`} style={{ paddingLeft: "1rem" }}>
          All actions
        </div>
        <Modal.Body className={MODAL_THEME}>
          {groupedList(actionChip)}
          <div className="d-flex justify-content-end modal-buttons">
            <Button className="modal-button2" onClick={() => setSheet(null)}>
              Close
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* Customise: up to 8, in order */}
      <Modal show={sheet === "customise"} onHide={() => setSheet(null)} size="lg" centered scrollable className={MODAL_THEME}>
        <div className={`p-10 m-title ${MODAL_THEME}`} style={{ paddingLeft: "1rem" }}>
          Customise quick actions
          <div className="text-muted" style={{ fontSize: "13px", fontWeight: 400 }}>
            Shown on the app and the web: {draft.length} of {QUICK_ACTION_LIMIT}
          </div>
        </div>
        <Modal.Body className={MODAL_THEME}>
          <h6 className="fw-bold text-dark mb-2">Shown</h6>
          <div className="border rounded mb-3">
            {draft.length === 0 && <div className="p-3 text-muted small">Nothing shown. Add actions below.</div>}
            {draft.map((id, i) => {
              const a = byId.get(id);
              if (!a) return null;
              return (
                <div key={id} className="d-flex align-items-center gap-2 px-3 py-2" style={{ borderBottom: "1px solid #eee", fontSize: "14px" }}>
                  <i className={a.icon} />
                  <span className="flex-grow-1 text-dark">{a.label}</span>
                  <PrimeButton icon="pi pi-arrow-up" className="p-button-text p-button-sm" style={{ color: "#4C4C4C" }} onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" />
                  <PrimeButton icon="pi pi-arrow-down" className="p-button-text p-button-sm" style={{ color: "#4C4C4C" }} onClick={() => move(i, 1)} disabled={i === draft.length - 1} aria-label="Move down" />
                  <PrimeButton icon="pi pi-times" className="p-button-text p-button-sm p-button-danger" onClick={() => setDraft((d) => d.filter((x) => x !== id))} aria-label="Remove" />
                </div>
              );
            })}
          </div>
          <h6 className="fw-bold text-dark mb-2">Add more</h6>
          {draft.length >= QUICK_ACTION_LIMIT && <div className="text-muted small mb-2">{QUICK_ACTION_LIMIT} actions are shown. Remove one to add another.</div>}
          {groupedList(
            (a) => (
              <button
                key={a.id}
                type="button"
                style={{ ...chipStyle, opacity: draft.length >= QUICK_ACTION_LIMIT ? 0.5 : 1 }}
                disabled={draft.length >= QUICK_ACTION_LIMIT}
                onClick={() => setDraft((d) => (d.length >= QUICK_ACTION_LIMIT ? d : [...d, a.id]))}
              >
                <i className="pi pi-plus" />
                {a.label}
              </button>
            ),
            (a) => !draft.includes(a.id),
          )}
          <div className="d-flex justify-content-between align-items-center modal-buttons">
            <PrimeButton label="Reset to default" className="p-button-text" style={{ color: "#4C4C4C" }} onClick={() => setDraft(allowed.filter((a) => a.isDefault).map((a) => a.id))} />
            <div>
              <Button className="modal-button1" onClick={() => setSheet(null)}>
                Cancel
              </Button>
              <Button className="modal-button2" onClick={saveDraft}>
                Save
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>

      {/* The create popups (the same ones the rest of the CRM opens) */}
      <LazyBoundary>
      {popup?.kind === "contact" && <CreateContactView show onHide={closePopup} headerName="Create Contact" />}
      {popup?.kind === "task" && (
        <CreateTaskView show onHide={closePopup} onTaskCreated={loadToday} headerName="Create Task" productToEdit={undefined} setTargetVsIncentiveList={noop as any} setLoading={noop as any} />
      )}
      {popup?.kind === "visit" && <CreateVisitView show onHide={closePopup} visitToEdit={undefined} headerName="Create Visit" setRefreshVisit={noop as any} />}
      {popup?.kind === "jobcard" && <JobCardView show onHide={closePopup} onComplete={loadToday} />}
      {popup?.kind === "document" && (
        <OrderCreateModal
          show
          onHide={closePopup}
          handleSubmit={closePopup}
          title="Create"
          message="Please Enter Your Order Details"
          btn1="CANCEL"
          btn2="Approve"
          isOrderShowNum={popup.orderType}
          flag="quick"
        />
      )}
      {popup?.kind === "picker" && (
        <QuickActionCustomerPicker
          show
          onHide={() => setPopup(null)}
          title={popup.action === "inquiry" ? "Add Inquiry" : "Add Reminder"}
          onPick={(customer) => setPopup({ kind: popup.action, customer })}
        />
      )}
      {popup?.kind === "inquiry" && <CreateInquiryView show onHide={closePopup} setRefreshInquiry={noop} contact_id={popup.customer.id} headerName="Create Inquiry" />}
      {popup?.kind === "reminder" && (
        <ReminderModal
          show
          onHide={closePopup}
          handleSubmit={async (data: any) => {
            await createReminderForMy(
              {
                dateTime: data.dateTime,
                remark: data.remark,
                status: data.status,
                selectedCategory: data.selectedCategory,
                referenceTable: null,
                referenceId: null,
                contactMastersId: popup.customer.id,
                personName: popup.customer.person_name,
                mobileNumber: popup.customer.mobile_number,
              },
              noop as any,
              noop as any,
              noop as any,
              noop as any,
              noop as any,
              "",
              "",
              noop as any,
            );
            closePopup();
          }}
          title={`Set Reminder - ${popup.customer.person_name}`}
          message="Set a new reminder"
          btn1="CANCEL"
          btn2="Set Reminder"
          remarkMsg=""
          request_flag=""
        />
      )}
      </LazyBoundary>
      {allowed.length === 0 && permissions && permissions.length > 0 && <div className="text-muted small mt-3">{DEFAULT_MESSAGE_ERROR_PERMISSION}</div>}
    </div>
  );
};

export default QuickActionsHome;
