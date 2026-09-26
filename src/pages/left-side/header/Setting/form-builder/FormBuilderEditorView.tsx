import BetaFeatureNotice from "../../../../../components/BetaFeatureNotice";
import ConfirmationModal from "../../../../../components/model/ConfirmationModal";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  Announcements,
  closestCenter,
  CollisionDetection,
  DndContext,
  DragEndEvent,
  DragMoveEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import {
  getForm,
  updateDraftForm,
  updateDraftFormQuiet,
  publishForm,
  discardDraftForm,
  togglePublicLink,
  regenerateShareToken,
  IFormBuilderField,
  IFormBuilderForm,
} from "./FormBuilderController";
import FormBuilderBrandStyles from "./formBuilderBrandStyles";
import { colClassFor } from "./fieldTypes";
import EditorStyles from "./editor/EditorStyles";
import FieldPalette, { PaletteChip, PALETTE_PREFIX } from "./editor/FieldPalette";
import FormCanvas, { CANVAS_END_ID, CANVAS_ID, sortId } from "./editor/FormCanvas";
import FieldSettingsPanel from "./editor/FieldSettingsPanel";
import FormSettingsPanel from "./editor/FormSettingsPanel";
import FormPermissionsPanel from "./editor/FormPermissionsPanel";
import LanguageSettingsPanel from "./editor/LanguageSettingsPanel";
import FormPrintPanel from "./editor/FormPrintPanel";
import FormPublicSettingsPanel from "./editor/FormPublicSettingsPanel";
import ApprovalStagesPanel from "./editor/ApprovalStagesPanel";
import { approvalStagesOf, IFormSettings, parseSettings } from "./approval";
import FormPreview from "./editor/FormPreview";
import { useUndoableState } from "./editor/useUndoableState";
import {
  allKeys,
  duplicateOf,
  findFieldProblem,
  findFormProblem,
  isLayoutOnly,
  KEY_MAX,
  keyFromLabel,
  newField,
  newFieldId,
  sectionEnd,
  seedFieldIds,
  takenKeys,
  typeLabel,
  uniqueKey,
} from "./editor/fieldHelpers";

// Kept exported from here (Phase 1 API) — the implementation lives in editor/fieldHelpers.ts.
export { keyFromLabel, uniqueKey };

interface Props {
  formId: number;
  onClose?: () => void;
}

const AUTOSAVE_MS = 3000;

type SaveState =
  | { kind: "idle" }
  | { kind: "unsaved" }
  | { kind: "saving" }
  | { kind: "saved" }
  | { kind: "invalid"; msg: string }
  | { kind: "error"; msg: string };

interface ConfirmState {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
}

// What autosave compares against the last saved copy.
const snapshotOf = (fields: IFormBuilderField[], form: IFormBuilderForm | null) =>
  JSON.stringify({
    fields,
    title: form?.title || "",
    description: form?.description || "",
    related_module: form?.related_module || null,
    restrict: form?.restrict_to_assigned_team ? 1 : 0,
    settings: form?.settings_json || null,
  });

const isPaletteId = (id: string | number) => String(id).startsWith(PALETTE_PREFIX);

// Make ids usable: every field and repeater column gets a unique positive id
// (the server names a repeater's table after its id and needs it > 0); a
// published field keeps its id. Also backfills missing internal names.
function normaliseLoaded(loaded: IFormBuilderField[], published: IFormBuilderField[]): IFormBuilderField[] {
  seedFieldIds(loaded, published);
  const publishedIds = new Set(published.map((p) => p.id));
  const seen = new Set<number>();
  return loaded.map((fld, i) => {
    let next = fld.key ? fld : { ...fld, key: uniqueKey(keyFromLabel(fld.label), takenKeys(loaded, i)) };
    const badId = typeof next.id !== "number" || seen.has(next.id) || (next.type === "repeater" && next.id <= 0 && !publishedIds.has(next.id));
    if (badId) next = { ...next, id: newFieldId() };
    seen.add(next.id);
    if ((next.columns || []).some((c) => typeof c.id !== "number")) {
      next = { ...next, columns: (next.columns || []).map((c) => (typeof c.id === "number" ? c : { ...c, id: newFieldId() })) };
    }
    return next;
  });
}

// Three-panel form editor (plan item A): palette | canvas | settings, with
// drag-and-drop, live preview, undo/redo and autosave.
const FormBuilderEditorView: React.FC<Props> = ({ formId, onClose }) => {
  const [form, setForm] = useState<IFormBuilderForm | null>(null);
  const history = useUndoableState<IFormBuilderField[]>([]);
  const { value: fields, set: setFields, reset: resetFields, undo, redo, ref: fieldsRef } = history;
  const [publishedKeys, setPublishedKeys] = useState<Set<string>>(new Set());
  const [publishing, setPublishing] = useState(false);
  const [linkBusy, setLinkBusy] = useState(false);
  // Fields whose internal name was typed by hand under "Advanced" — those stop
  // following the label.
  const [manualKeyIds, setManualKeyIds] = useState<Set<number>>(new Set());
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [rightPanel, setRightPanel] = useState<"field" | "form">("field");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [saveState, setSaveState] = useState<SaveState>({ kind: "idle" });
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ id: string; after: boolean } | null>(null);

  const formRef = useRef<IFormBuilderForm | null>(form);
  formRef.current = form;
  const publishedKeysRef = useRef(publishedKeys);
  publishedKeysRef.current = publishedKeys;
  const lastSavedRef = useRef<string>("");
  const savingRef = useRef<Promise<string | null> | null>(null);
  const suspendAutosaveRef = useRef(false);
  const loadedRef = useRef(false);

  const loadForm = useCallback(async () => {
    const res = await getForm(formId);
    if (!res?.data?.item) return;
    const f = res.data.item as IFormBuilderForm;
    let loaded: IFormBuilderField[] = [];
    let published: IFormBuilderField[] = [];
    try {
      const parsed = JSON.parse(f.schema_json || "[]");
      loaded = Array.isArray(parsed) ? parsed : [];
    } catch {
      loaded = [];
    }
    try {
      const parsed = JSON.parse(f.published_schema_json || "[]");
      published = Array.isArray(parsed) ? parsed : [];
    } catch {
      published = [];
    }
    const normalised = normaliseLoaded(loaded, published);
    setForm(f);
    resetFields(normalised);
    setPublishedKeys(allKeys(published));
    setManualKeyIds(new Set());
    setCollapsed(new Set());
    lastSavedRef.current = snapshotOf(normalised, f);
    loadedRef.current = true;
    setSaveState({ kind: "idle" });
  }, [formId, resetFields]);

  useEffect(() => {
    loadForm();
  }, [loadForm]);

  // ---------- Saving ----------

  // Saves the draft if it changed. Returns null when saved (or nothing to
  // save), otherwise the problem in plain words. `manual` = user-triggered:
  // problems also go to a toast; autosave only updates the indicator.
  const runSave = useCallback(
    async (manual: boolean): Promise<string | null> => {
      while (savingRef.current) await savingRef.current;
      const f = formRef.current;
      if (!f) return "The form is still loading";
      if (!manual && suspendAutosaveRef.current) return null;
      const flds = fieldsRef.current;
      const problem = findFormProblem(f) || findFieldProblem(flds, publishedKeysRef.current);
      if (problem) {
        setSaveState({ kind: "invalid", msg: problem });
        if (manual) toast.error(problem);
        return problem;
      }
      const snap = snapshotOf(flds, f);
      if (snap === lastSavedRef.current) {
        setSaveState((s) => (s.kind === "idle" ? s : { kind: "saved" }));
        return null;
      }
      setSaveState({ kind: "saving" });
      const payload = {
        id: f.id,
        title: f.title,
        description: f.description,
        related_module: f.related_module,
        restrict_to_assigned_team: f.restrict_to_assigned_team,
        schema_json: flds,
        settings: f.settings_json ? parseSettings(f.settings_json) : null,
      };
      const p = (async (): Promise<string | null> => {
        const res = manual ? await updateDraftForm(payload) : await updateDraftFormQuiet(payload);
        if (res?.ack === 1) {
          lastSavedRef.current = snap;
          const now = snapshotOf(fieldsRef.current, formRef.current);
          setSaveState(now === snap ? { kind: "saved" } : { kind: "unsaved" });
          return null;
        }
        const msg = res?.ack_msg || "Couldn't reach the server";
        setSaveState({ kind: "error", msg });
        return msg;
      })();
      savingRef.current = p;
      try {
        return await p;
      } finally {
        if (savingRef.current === p) savingRef.current = null;
      }
    },
    [fieldsRef],
  );

  // Autosave ~3s after the last change (plan A10).
  const snapshot = useMemo(() => snapshotOf(fields, form), [fields, form]);
  useEffect(() => {
    if (!loadedRef.current || !formRef.current) return;
    if (snapshot === lastSavedRef.current) {
      setSaveState((s) => (s.kind === "unsaved" || s.kind === "invalid" ? { kind: "saved" } : s));
      return;
    }
    // Keep a shown problem/error until the next attempt replaces it.
    setSaveState((s) => (s.kind === "idle" || s.kind === "saved" ? { kind: "unsaved" } : s));
    const t = window.setTimeout(() => {
      runSave(false);
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(t);
  }, [snapshot, runSave]);

  const saveNow = async () => {
    const problem = await runSave(true);
    if (!problem) toast.success("Draft saved");
  };

  const doPublish = async () => {
    if (!form) return;
    // Publish reads the saved draft, so save pending edits first.
    const problem = await runSave(true);
    if (problem) return;
    setPublishing(true);
    const res = await publishForm(form.id, formRef.current?.version);
    setPublishing(false);
    if (res?.ack === 1) {
      toast.success("Form published");
      setPublishedKeys(allKeys(fieldsRef.current));
      setForm(res.data.item);
    } else if (res?.code === 409) {
      toast.error("This form changed elsewhere — reload and try again");
    }
  };

  const askDiscard = () =>
    setConfirm({
      title: "Discard draft?",
      message: "All changes since the last publish will be thrown away.",
      confirmLabel: "Discard",
      onConfirm: async () => {
        suspendAutosaveRef.current = true;
        while (savingRef.current) await savingRef.current;
        const res = await discardDraftForm(formRef.current!.id);
        if (res?.ack === 1) {
          toast.success("Draft discarded");
          await loadForm();
          setSelectedId(null);
        }
        suspendAutosaveRef.current = false;
      },
    });

  const handleClose = async () => {
    if (!onClose) return;
    if (snapshotOf(fieldsRef.current, formRef.current) === lastSavedRef.current) {
      onClose();
      return;
    }
    const problem = await runSave(false);
    if (!problem) {
      onClose();
      return;
    }
    setConfirm({
      title: "Close without saving?",
      message: `Your latest changes are not saved: ${problem}`,
      confirmLabel: "Close anyway",
      onConfirm: onClose,
    });
  };

  // Public link actions only change the link columns; refresh just those so
  // unsaved field edits are kept.
  const refreshLinkState = async () => {
    const res = await getForm(formId);
    const item = res?.data?.item as IFormBuilderForm | undefined;
    if (!item) return;
    setForm((prev) =>
      prev
        ? { ...prev, allow_public_submission: item.allow_public_submission, share_token: item.share_token, company_qr_code: item.company_qr_code }
        : prev,
    );
  };
  const onTogglePublic = async (enable: boolean) => {
    if (!form) return;
    setLinkBusy(true);
    const res = await togglePublicLink(form.id, enable);
    if (res?.ack === 1) await refreshLinkState();
    setLinkBusy(false);
  };
  const onRegenerateLink = async () => {
    if (!form) return;
    setLinkBusy(true);
    const res = await regenerateShareToken(form.id);
    if (res?.ack === 1) {
      await refreshLinkState();
      toast.success("New link created — the old link no longer works");
    }
    setLinkBusy(false);
  };

  // ---------- Field operations (all undoable) ----------

  const indexOfId = (id: number) => fieldsRef.current.findIndex((f) => f.id === id);

  // Expand the section a field sits in, so a moved/added field is visible.
  const reveal = (list: IFormBuilderField[], id: number) => {
    const idx = list.findIndex((f) => f.id === id);
    for (let i = idx - 1; i >= 0; i--) {
      if (list[i].type === "section-header") {
        const headerId = list[i].id;
        setCollapsed((prev) => {
          if (!prev.has(headerId)) return prev;
          const next = new Set(prev);
          next.delete(headerId);
          return next;
        });
        return;
      }
    }
  };

  const select = (id: number) => {
    setSelectedId(id);
    setRightPanel("field");
  };

  const updateField = (id: number, patch: Partial<IFormBuilderField>, tag?: string) =>
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)), tag);

  // The label drives the internal name for fields that were never published
  // and whose name wasn't typed by hand. A published field keeps its name
  // forever (saved entries, filters and reports are keyed by it).
  const updateLabel = (id: number, label: string) =>
    setFields(
      (prev) =>
        prev.map((f, i) => {
          if (f.id !== id) return f;
          if (publishedKeys.has(f.key) || manualKeyIds.has(f.id)) return { ...f, label };
          return { ...f, label, key: uniqueKey(keyFromLabel(label), takenKeys(prev, i)) };
        }),
      `label:${id}`,
    );

  const updateKeyByHand = (id: number, raw: string) => {
    const key = raw.toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, KEY_MAX);
    setManualKeyIds((prev) => new Set(prev).add(id));
    updateField(id, { key }, `key:${id}`);
  };

  const addField = (type: string, atIndex?: number) => {
    const list = fieldsRef.current;
    const field = newField(type, takenKeys(list, -1));
    let at = atIndex;
    if (at === undefined) {
      const sel = selectedId != null ? list.findIndex((f) => f.id === selectedId) : -1;
      if (sel < 0) at = list.length;
      else if (list[sel].type === "section-header" && collapsed.has(list[sel].id)) at = sectionEnd(list, sel) + 1;
      else at = sel + 1;
    }
    const next = [...list.slice(0, at), field, ...list.slice(at)];
    setFields(next);
    reveal(next, field.id);
    select(field.id);
  };

  const duplicateField = (id: number) => {
    const list = fieldsRef.current;
    const i = list.findIndex((f) => f.id === id);
    if (i < 0) return;
    const copy = duplicateOf(list[i], list);
    setFields([...list.slice(0, i + 1), copy, ...list.slice(i + 1)]);
    select(copy.id);
  };

  const removeField = (id: number) => {
    const list = fieldsRef.current;
    const i = list.findIndex((f) => f.id === id);
    if (i < 0) return;
    const next = list.filter((f) => f.id !== id);
    setFields(next);
    if (selectedId === id) setSelectedId(next[i]?.id ?? next[i - 1]?.id ?? null);
  };

  const askDelete = (id: number) => {
    const f = fieldsRef.current[indexOfId(id)];
    if (!f) return;
    const published = publishedKeys.has(f.key);
    setConfirm({
      title: "Delete field?",
      message: `Delete "${f.label || "this field"}"?${
        published ? " Entries already saved keep their data, but the field will no longer show on the form." : ""
      } You can undo this with the Undo button.`,
      confirmLabel: "Delete",
      onConfirm: () => removeField(id),
    });
  };

  const moveField = (id: number, dir: -1 | 1) => {
    const list = fieldsRef.current;
    const i = list.findIndex((f) => f.id === id);
    const t = i + dir;
    if (i < 0 || t < 0 || t >= list.length) return;
    const next = arrayMove(list, i, t);
    setFields(next);
    reveal(next, id);
  };

  // "Filled at stage" for a heading sets it for every field under it (approval stages).
  const setSectionStage = (id: number, stage: string) => {
    const list = fieldsRef.current;
    const i = list.findIndex((f) => f.id === id);
    if (i < 0) return;
    const end = sectionEnd(list, i);
    setFields(list.map((f, j) => (j >= i && j <= end && !(j > i && isLayoutOnly(f.type) && f.type === "section-header") ? { ...f, stage } : f)));
  };

  const setSectionWidth = (id: number, width: "full" | "half" | "third") => {
    const list = fieldsRef.current;
    const i = list.findIndex((f) => f.id === id);
    if (i < 0) return;
    const end = sectionEnd(list, i);
    setFields(list.map((f, j) => (j > i && j <= end && !isLayoutOnly(f.type) && f.type !== "repeater" ? { ...f, width } : f)));
  };

  const toggleCollapse = (id: number) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Fields shown on the canvas: members of a collapsed section are hidden.
  const { visibleFields, hiddenCounts } = useMemo(() => {
    const visible: IFormBuilderField[] = [];
    const counts = new Map<number, number>();
    let header: IFormBuilderField | null = null;
    fields.forEach((f) => {
      if (f.type === "section-header") {
        header = f;
        visible.push(f);
        return;
      }
      if (header && collapsed.has(header.id)) {
        counts.set(header.id, (counts.get(header.id) || 0) + 1);
        return;
      }
      visible.push(f);
    });
    return { visibleFields: visible, hiddenCounts: counts };
  }, [fields, collapsed]);

  // ---------- Undo / redo shortcuts ----------
  useEffect(() => {
    if (mode !== "edit") return;
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k !== "z" && k !== "y") return;
      // Inside a text box the browser's own undo handles the typing.
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || t.tagName === "TEXTAREA" || (t.tagName === "INPUT" && !["checkbox", "radio", "button"].includes((t as HTMLInputElement).type)))) {
        return;
      }
      e.preventDefault();
      if (k === "y" || e.shiftKey) redo();
      else undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, undo, redo]);

  // ---------- Drag and drop (plan A2) ----------
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Screen-reader messages in field names instead of internal drag ids.
  const dragLabel = (id: string | number | undefined) => {
    const s = String(id ?? "");
    if (isPaletteId(s)) return `new ${typeLabel(s.slice(PALETTE_PREFIX.length))} field`;
    if (s === CANVAS_END_ID) return "the end of the form";
    const f = fieldsRef.current.find((x) => sortId(x) === s);
    return f ? `"${f.label || typeLabel(f.type)}"` : "the form";
  };
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${dragLabel(active.id)}. Use the arrow keys to move, Space to drop, Escape to cancel.`,
    onDragOver: ({ active, over }) => (over ? `${dragLabel(active.id)} is over ${dragLabel(over.id)}.` : `${dragLabel(active.id)} is not over a field.`),
    onDragEnd: ({ active, over }) => (over ? `${dragLabel(active.id)} dropped at ${dragLabel(over.id)}.` : `${dragLabel(active.id)} dropped.`),
    onDragCancel: ({ active }) => `Moving ${dragLabel(active.id)} cancelled.`,
  };

  const collision: CollisionDetection = (args) => {
    if (isPaletteId(args.active.id)) {
      const within = pointerWithin(args);
      if (!within.length) return [];
      const item = within.find((c) => c.id !== CANVAS_ID);
      if (item) return [item];
      // On the canvas but between fields: nearest field.
      return closestCenter({ ...args, droppableContainers: args.droppableContainers.filter((c) => c.id !== CANVAS_ID) });
    }
    return closestCenter({
      ...args,
      droppableContainers: args.droppableContainers.filter((c) => c.id !== CANVAS_ID && c.id !== CANVAS_END_ID),
    });
  };

  const onDragStart = (e: DragStartEvent) => {
    const id = String(e.active.id);
    setActiveDragId(id);
    if (!isPaletteId(id)) {
      const f = fieldsRef.current.find((x) => sortId(x) === id);
      if (f) select(f.id);
    }
  };

  const onDragMove = (e: DragMoveEvent) => {
    if (!isPaletteId(e.active.id)) return;
    const over = e.over;
    if (!over) {
      setDropTarget(null);
      return;
    }
    const overId = String(over.id);
    if (overId === CANVAS_END_ID) {
      setDropTarget((p) => (p?.id === overId ? p : { id: overId, after: true }));
      return;
    }
    const field = fieldsRef.current.find((f) => sortId(f) === overId);
    if (!field) return;
    const start = e.activatorEvent as PointerEvent;
    const px = (start?.clientX ?? 0) + e.delta.x;
    const py = (start?.clientY ?? 0) + e.delta.y;
    const r = over.rect;
    const after = colClassFor(field) === "col-12" ? py > r.top + r.height / 2 : px > r.left + r.width / 2;
    setDropTarget((p) => (p?.id === overId && p.after === after ? p : { id: overId, after }));
  };

  const endDrag = () => {
    setActiveDragId(null);
    setDropTarget(null);
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    const target = dropTarget;
    endDrag();
    if (!over) return;
    const list = fieldsRef.current;

    if (isPaletteId(active.id)) {
      const type = String(active.id).slice(PALETTE_PREFIX.length);
      if (over.id === CANVAS_END_ID) {
        addField(type, list.length);
        return;
      }
      const idx = list.findIndex((f) => sortId(f) === over.id);
      if (idx < 0) {
        addField(type, list.length);
        return;
      }
      const after = target?.id === String(over.id) ? target.after : false;
      const overField = list[idx];
      let at = after ? idx + 1 : idx;
      if (after && overField.type === "section-header" && collapsed.has(overField.id)) at = sectionEnd(list, idx) + 1;
      addField(type, at);
      return;
    }

    if (active.id === over.id) return;
    const from = list.findIndex((f) => sortId(f) === active.id);
    const to = list.findIndex((f) => sortId(f) === over.id);
    if (from < 0 || to < 0) return;
    const moving = list[from];
    let next: IFormBuilderField[];
    if (moving.type === "section-header" && collapsed.has(moving.id)) {
      // A collapsed section moves together with its fields.
      const blockEnd = sectionEnd(list, from);
      if (to >= from && to <= blockEnd) return;
      const block = list.slice(from, blockEnd + 1);
      const rest = [...list.slice(0, from), ...list.slice(blockEnd + 1)];
      let at = rest.indexOf(list[to]);
      if (to > blockEnd) {
        const overField = list[to];
        at = overField.type === "section-header" && collapsed.has(overField.id) ? sectionEnd(rest, at) + 1 : at + 1;
      }
      next = [...rest.slice(0, at), ...block, ...rest.slice(at)];
    } else {
      next = arrayMove(list, from, to);
    }
    setFields(next);
    if (moving.type !== "section-header") reveal(next, moving.id);
  };

  // ---------- Render ----------

  if (!form) return <div className="p-3">Loading...</div>;

  const selectedIndex = selectedId != null ? fields.findIndex((f) => f.id === selectedId) : -1;
  const selectedField = selectedIndex >= 0 ? fields[selectedIndex] : null;
  const paletteDragging = !!activeDragId && isPaletteId(activeDragId);

  const saveIndicator = (() => {
    switch (saveState.kind) {
      case "saving":
        return (
          <span className="fb-save-state">
            <i className="pi pi-spinner pi-spin" /> Saving…
          </span>
        );
      case "saved":
        return (
          <span className="fb-save-state">
            <i className="pi pi-check-circle" style={{ color: "#28a745" }} /> Saved
          </span>
        );
      case "unsaved":
        return <span className="fb-save-state">Unsaved changes</span>;
      case "invalid":
        return (
          <span className="fb-save-state fb-bad" title={saveState.msg}>
            <i className="pi pi-exclamation-triangle" />
            <span className="fb-msg">Not saved: {saveState.msg}</span>
          </span>
        );
      case "error":
        return (
          <span className="fb-save-state fb-bad" title={saveState.msg}>
            <i className="pi pi-exclamation-triangle" />
            <span className="fb-msg">Couldn't save</span>
            <button type="button" className="btn btn-link btn-sm p-0 ms-1" onClick={() => runSave(false)}>
              Retry
            </button>
          </span>
        );
      default:
        return null;
    }
  })();

  return (
    <div className="p-3">
      <FormBuilderBrandStyles />
      <EditorStyles />
      <BetaFeatureNotice />

      <div className="fb-editor-topbar">
        <h4 title={form.title}>{form.title || "Untitled form"}</h4>
        <div className="fb-seg" role="group" aria-label="Editor mode">
          <button type="button" className={mode === "edit" ? "active" : ""} aria-pressed={mode === "edit"} onClick={() => setMode("edit")}>
            <i className="pi pi-pencil" /> Edit
          </button>
          <button type="button" className={mode === "preview" ? "active" : ""} aria-pressed={mode === "preview"} onClick={() => setMode("preview")}>
            <i className="pi pi-eye" /> Preview
          </button>
        </div>
        {mode === "edit" ? (
          <>
            <button type="button" className="btn btn-sm btn-outline-secondary fb-icon-btn" disabled={!history.canUndo} onClick={undo} title="Undo (Ctrl+Z)">
              <i className="pi pi-undo" /> Undo
            </button>
            <button type="button" className="btn btn-sm btn-outline-secondary fb-icon-btn" disabled={!history.canRedo} onClick={redo} title="Redo (Ctrl+Y)">
              <i className="pi pi-undo fb-redo-icon" /> Redo
            </button>
          </>
        ) : null}
        {saveIndicator}
        <div className="fb-spacer" />
        <button
          type="button"
          className={`btn btn-sm ${rightPanel === "form" && mode === "edit" ? "fb-btn-primary" : "btn-outline-secondary"}`}
          onClick={() => {
            setMode("edit");
            setRightPanel("form");
          }}
        >
          <i className="pi pi-cog" /> Form settings
        </button>
        {onClose ? (
          <button type="button" className="btn btn-sm btn-link" onClick={handleClose}>
            Close
          </button>
        ) : null}
        <button type="button" className="btn btn-sm btn-outline-secondary" disabled={saveState.kind === "saving"} onClick={saveNow}>
          Save Draft
        </button>
        <button type="button" className="btn btn-sm btn-outline-warning" onClick={askDiscard}>
          Discard Draft
        </button>
        <button type="button" className="btn btn-sm fb-btn-primary" disabled={publishing} onClick={doPublish}>
          {publishing ? "Publishing..." : "Publish"}
        </button>
      </div>

      {mode === "preview" ? (
        <FormPreview title={form.title} description={form.description} fields={fields} />
      ) : (
        <div className="row g-3">
          <DndContext
            sensors={sensors}
            collisionDetection={collision}
            accessibility={{ announcements }}
            onDragStart={onDragStart}
            onDragMove={onDragMove}
            onDragEnd={onDragEnd}
            onDragCancel={endDrag}
          >
            <div className="col-12 col-lg-3 col-xl-2">
              <div className="fb-panel fb-panel-sticky">
                <div className="fb-panel-title">
                  <i className="pi pi-plus-circle" /> Add a field
                </div>
                <div className="fb-panel-body">
                  <FieldPalette onAdd={(t) => addField(t)} />
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-5 col-xl-6">
              <FormCanvas
                fields={visibleFields}
                hiddenCountFor={(f) => hiddenCounts.get(f.id) || 0}
                selectedId={selectedId}
                collapsed={collapsed}
                dropTarget={dropTarget}
                paletteDragging={paletteDragging}
                onSelect={select}
                onToggleCollapse={toggleCollapse}
                onDuplicate={duplicateField}
                onDelete={askDelete}
              />
            </div>
            <DragOverlay dropAnimation={null}>{paletteDragging ? <PaletteChip type={activeDragId!.slice(PALETTE_PREFIX.length)} /> : null}</DragOverlay>
          </DndContext>
          <div className="col-12 col-lg-4">
            <div className="fb-panel fb-panel-sticky">
              {rightPanel === "form" ? (
                <>
                  <div className="fb-panel-title">
                    <i className="pi pi-cog" /> Form settings
                    <div className="fb-spacer" style={{ flex: 1 }} />
                    <button type="button" className="btn btn-sm btn-link p-0" onClick={() => setRightPanel("field")} aria-label="Close form settings">
                      <i className="pi pi-times" />
                    </button>
                  </div>
                  <div className="fb-panel-body">
                    <FormSettingsPanel
                      form={form}
                      onChange={(patch) => setForm((prev) => (prev ? { ...prev, ...patch } : prev))}
                      onTogglePublic={onTogglePublic}
                      onRegenerateLink={onRegenerateLink}
                      busy={linkBusy}
                    />
                    <h6 className="mt-4 mb-2">Public form</h6>
                    <FormPublicSettingsPanel
                      form={form}
                      onSettingsChange={(next: IFormSettings) => setForm((prev) => (prev ? { ...prev, settings_json: JSON.stringify(next) } : prev))}
                    />
                    <h6 className="mt-4 mb-2">Print and templates</h6>
                    <FormPrintPanel
                      form={form}
                      onSettingsChange={(next: IFormSettings) => setForm((prev) => (prev ? { ...prev, settings_json: JSON.stringify(next) } : prev))}
                    />
                    <h6 className="mt-4 mb-2">Approval</h6>
                    <ApprovalStagesPanel
                      settings={parseSettings(form.settings_json)}
                      fields={fields}
                      onChange={(next: IFormSettings) => setForm((prev) => (prev ? { ...prev, settings_json: JSON.stringify(next) } : prev))}
                    />
                    <h6 className="mt-4 mb-2">Permissions</h6>
                    <FormPermissionsPanel formId={form.id} />
                    <h6 className="mt-4 mb-2">Second language</h6>
                    <LanguageSettingsPanel
                      settings={parseSettings(form.settings_json)}
                      fields={fields}
                      onSettingsChange={(next: IFormSettings) => setForm((prev) => (prev ? { ...prev, settings_json: JSON.stringify(next) } : prev))}
                      onFieldsChange={(next) => setFields(next, "translations")}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="fb-panel-title">
                    <i className="pi pi-sliders-h" /> Field settings
                  </div>
                  <div className="fb-panel-body">
                    {selectedField ? (
                      <FieldSettingsPanel
                        key={selectedField.id}
                        field={selectedField}
                        index={selectedIndex}
                        fields={fields}
                        relatedModule={form.related_module}
                        publishedKeys={publishedKeys}
                        onPatch={(patch, tag) => updateField(selectedField.id, patch, tag)}
                        onLabel={(label) => updateLabel(selectedField.id, label)}
                        onKeyByHand={(raw) => updateKeyByHand(selectedField.id, raw)}
                        onMove={(dir) => moveField(selectedField.id, dir)}
                        onDuplicate={() => duplicateField(selectedField.id)}
                        onDelete={() => askDelete(selectedField.id)}
                        onSectionWidth={(w) => setSectionWidth(selectedField.id, w)}
                        stages={approvalStagesOf(parseSettings(form.settings_json))}
                        onSectionStage={(stage) => setSectionStage(selectedField.id, stage)}
                      />
                    ) : (
                      <div className="text-muted small">
                        Select a field on the form to change its settings, or drag a new one in from the left.
                        <div className="mt-2">
                          <button type="button" className="btn btn-sm btn-link p-0" onClick={() => setRightPanel("form")}>
                            Open form settings
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        show={!!confirm}
        onHide={() => setConfirm(null)}
        handleSubmit={() => {
          const c = confirm;
          setConfirm(null);
          c?.onConfirm();
        }}
        title={confirm?.title || ""}
        message={confirm?.message}
        btn1="Cancel"
        btn2={confirm?.confirmLabel || "OK"}
      />
    </div>
  );
};

export default FormBuilderEditorView;
