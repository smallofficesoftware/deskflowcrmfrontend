// ============================================================
// hooks/useWhatsappTemplateModal.ts — Main controller hook
// ADDITION ONLY (static attachment upload support):
//   - attachmentSourceType state ("variable" | "static")
//   - handleAttachmentSourceChange (switches variable/static mode)
//   - handleStaticAttachmentUpload (uploads file, sets resolved URL)
//   - savedConfig restore now also restores attachmentSourceType +
//     staticAttachmentUrl
// Existing variable-mode logic UNCHANGED.
// ============================================================

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-toastify";

import {
  fetchTemplates,
  getSavedConfig,
  upsertSavedConfig,
  uploadStaticAttachment,
} from "../components/model/whatsapp_template_sender/api/whatsappTemplateApi";
import {
  extractPlaceholderIndices,
  buildEmptyVariableMap,
  buildDemoVariableMap,
  areAllVariablesFilled,
} from "../utils/TemplateUtils";
import { useVariables } from "./useWhatsappVariableMgmt";
import { templateHasAttachment } from "../components/model/whatsapp_template_sender/types/windex";

import type {
  Template,
  ITemplateOptionList,
  SavedTemplateConfig,
  VariableValueMap,
  QuickFillMap,
  ModalMode,
  ModalLoadingState,
  WhatsAppTemplateModalProps,
  AttachmentSourceType,
} from "../components/model/whatsapp_template_sender/types/windex";

export interface UseWhatsappTemplateModalReturn {
  templates: Template[];
  templateOptions: ITemplateOptionList[];
  selectedTemplate: Template | null;
  variables: VariableValueMap;
  quickFillVars: QuickFillMap;
  savedConfig: SavedTemplateConfig | null;
  availableVariables: ReturnType<typeof useVariables>["availableVariables"];
  attachmentVariables: ReturnType<typeof useVariables>["attachmentVariables"];

  // Attachment state (variable-mode, unchanged)
  attachmentVariableKey: string;
  attachmentUrl: string;

  // NEW: static attachment state
  attachmentSourceType: AttachmentSourceType; // "variable" | "static"
  staticAttachmentFileName: string;

  mode: ModalMode;
  isContextNull: boolean;
  loading: ModalLoadingState;
  isFormDisabled: boolean;

  saveAsDefault: boolean;
  setSaveAsDefault: (v: boolean) => void;
  templateOptionSelected: ITemplateOptionList | null;

  handleTemplateChange: (templateId: string | undefined) => void;
  handleQuickFill: (index: number, variableKey: string) => void;
  handleVariableChange: (index: number, value: string) => void;
  handleAttachmentVariableChange: (variableKey: string) => void;

  // NEW
  handleAttachmentSourceChange: (sourceType: AttachmentSourceType) => void;
  handleStaticAttachmentUpload: (file: File) => Promise<void>;
  handleRemoveStaticAttachment: () => void;

  handleSaveConfigOnly: () => Promise<void>;
  handleSend: () => Promise<void>;
  handleClearCache: () => void;
}

export function useWhatsappTemplateModal(
  props: WhatsAppTemplateModalProps,
): UseWhatsappTemplateModalReturn {
  const {
    show,
    module,
    displayModule,
    contextParams,
    onSend,
    onSuccesDefautlSaveConfig,
  } = props;

  const isContextNull = contextParams === null;
  const mode: ModalMode = isContextNull ? "config-only" : "full";

  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateOptions, setTemplateOptions] = useState<ITemplateOptionList[]>(
    [],
  );
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null,
  );
  const [templateOptionSelected, setTemplateOptionSelected] =
    useState<ITemplateOptionList | null>(null);
  const [variables, setVariables] = useState<VariableValueMap>({});
  const [quickFillVars, setQuickFillVars] = useState<QuickFillMap>({});
  const [savedConfig, setSavedConfig] = useState<SavedTemplateConfig | null>(
    null,
  );
  const [saveAsDefault, setSaveAsDefault] = useState(false);

  // ── Attachment state (variable-mode, unchanged) ───────────
  const [attachmentVariableKey, setAttachmentVariableKey] =
    useState<string>("");
  const [attachmentUrl, setAttachmentUrl] = useState<string>("");

  // ── NEW: static attachment state ──────────────────────────
  const [attachmentSourceType, setAttachmentSourceType] =
    useState<AttachmentSourceType>("variable");
  const [staticAttachmentFileName, setStaticAttachmentFileName] =
    useState<string>("");

  const [loading, setLoading] = useState<ModalLoadingState>({
    templates: false,
    savedConfig: false,
    sending: false,
    savingConfig: false,
    uploadingAttachment: false, // NEW
  });

  const isFormDisabled =
    loading.templates ||
    loading.savedConfig ||
    loading.sending ||
    loading.savingConfig ||
    loading.uploadingAttachment;

  const {
    availableVariables,
    attachmentVariables,
    fetchVariable,
    clearVariableCache,
  } = useVariables(module, contextParams);

  const shouldAutoSend = useRef(false);

  // ── Load templates (unchanged) ────────────────────────────
  useEffect(() => {
    if (!show) return;
    void loadTemplates();
  }, [show]);

  const loadTemplates = async () => {
    setLoading((p) => ({ ...p, templates: true }));
    try {
      const { apiResponse, optionList } = await fetchTemplates();
      setTemplates(apiResponse.data);
      setTemplateOptions(optionList);
    } catch (err) {
      console.error("[useWhatsappTemplateModal] loadTemplates:", err);
      toast.error("Failed to load WhatsApp templates");
    } finally {
      setLoading((p) => ({ ...p, templates: false }));
    }
  };

  useEffect(() => {
    if (!show || templates.length === 0) return;
    void initializeTemplateSelection();
  }, [show, templates]);

  const initializeTemplateSelection = async () => {
    const uuid = localStorage.getItem("UUID");
    const config = await getSavedConfig(module, uuid);

    const firstTemplate =
      templates.find((t) => t.id === config?.templateId) ?? templates[0];

    setSelectedTemplate(firstTemplate);
    setTemplateOptionSelected({
      value: firstTemplate.id,
      label: `${firstTemplate.name} (${firstTemplate.status})`,
    });

    if (config) shouldAutoSend.current = true;

    await applyTemplateConfig(firstTemplate, config);
  };

  // ── Auto-send effect (unchanged) ──────────────────────────
  useEffect(() => {
    if (!shouldAutoSend.current) return;
    if (!selectedTemplate || !savedConfig) return;
    if (!areAllVariablesFilled(variables)) return;
    if (Object.keys(variables).length === 0) return;
    if (mode === "config-only") return;

    shouldAutoSend.current = false;
    setTimeout(() => void handleSend(), 500);
  }, [variables, selectedTemplate, savedConfig, mode]);

  // ── Template change (unchanged, resets new state too) ────
  const handleTemplateChange = useCallback(
    (templateId: string | undefined) => {
      shouldAutoSend.current = false;
      const template = templates.find((t) => t.id === templateId) ?? null;
      setSelectedTemplate(template);

      if (!template) {
        setVariables({});
        setQuickFillVars({});
        setSavedConfig(null);
        setAttachmentVariableKey("");
        setAttachmentUrl("");
        setAttachmentSourceType("variable");
        setStaticAttachmentFileName("");
        return;
      }

      setTemplateOptionSelected({
        value: template.id,
        label: `${template.name} (${template.status})`,
      });

      void loadConfigForTemplate(template);
    },
    [templates, module],
  );

  const loadConfigForTemplate = async (template: Template) => {
    setLoading((p) => ({ ...p, savedConfig: true }));
    try {
      const uuid = localStorage.getItem("UUID");
      const config = await getSavedConfig(module, uuid, template.id);
      setSavedConfig(config);
      await applyTemplateConfig(template, config);
    } catch (err) {
      console.error("[useWhatsappTemplateModal] loadConfigForTemplate:", err);
      applyFreshVariables(template);
    } finally {
      setLoading((p) => ({ ...p, savedConfig: false }));
    }
  };

  /**
   * Core logic — UNCHANGED body-variable behavior, EXTENDED for attachment:
   *
   * Restores attachmentSourceType from saved config:
   *   "static"   → attachmentUrl = config.staticAttachmentUrl (no API fetch needed)
   *   "variable" → existing fetch-by-key behavior (unchanged)
   */
  const applyTemplateConfig = async (
    template: Template,
    config: SavedTemplateConfig | null,
  ) => {
    const indices = extractPlaceholderIndices(template);
    const hasAttachment = templateHasAttachment(template);

    // ── Restore attachment source + key/url ───────────────
    const savedSourceType: AttachmentSourceType =
      config?.attachmentSourceType ?? "variable";
    const savedAttachKey = config?.attachmentVariableKey ?? "";
    const savedStaticUrl = config?.staticAttachmentUrl ?? "";
    const savedStaticFileName = config?.staticAttachmentFileName ?? "";

    setAttachmentSourceType(savedSourceType);
    setAttachmentVariableKey(savedAttachKey);
    setStaticAttachmentFileName(savedStaticFileName);

    if (
      !config?.variableMappings ||
      Object.keys(config.variableMappings).length === 0
    ) {
      applyFreshVariables(template);

      // Attachment resolution even when body has no mappings
      if (hasAttachment) {
        if (savedSourceType === "static" && savedStaticUrl) {
          setAttachmentUrl(savedStaticUrl); // static: use stored URL directly
        } else if (
          savedSourceType === "variable" &&
          savedAttachKey &&
          !isContextNull
        ) {
          const url = await fetchVariable(savedAttachKey).catch(() => "");
          setAttachmentUrl(url);
        } else if (
          savedSourceType === "variable" &&
          savedAttachKey &&
          isContextNull
        ) {
          setAttachmentUrl(`[${savedAttachKey}]`);
        } else {
          setAttachmentUrl("");
        }
      } else {
        setAttachmentUrl("");
      }
      return;
    }

    const newQuickFill: QuickFillMap = {};
    indices.forEach((i) => {
      const key = config.variableMappings[i];
      if (key) newQuickFill[i] = key;
    });

    setQuickFillVars(newQuickFill);
    setSavedConfig(config);

    if (isContextNull) {
      setVariables(buildDemoVariableMap(indices));

      // Attachment in demo mode
      if (hasAttachment) {
        if (savedSourceType === "static" && savedStaticUrl) {
          setAttachmentUrl(savedStaticUrl); // static URL is real even in demo mode
        } else if (savedSourceType === "variable" && savedAttachKey) {
          setAttachmentUrl(`[${savedAttachKey}]`);
        } else {
          setAttachmentUrl("");
        }
      }
      return;
    }

    // Full mode: fetch real body variable values
    setVariables(buildEmptyVariableMap(indices));

    const fetchPromises = Object.entries(newQuickFill).map(
      async ([idxStr, variableKey]) => {
        const idx = parseInt(idxStr, 10);
        try {
          const value = await fetchVariable(variableKey);
          setVariables((prev) => ({ ...prev, [idx]: value }));
        } catch {
          shouldAutoSend.current = false;
        }
      },
    );

    // Attachment resolution in full mode
    let attachPromise: Promise<void> = Promise.resolve();
    if (hasAttachment) {
      if (savedSourceType === "static" && savedStaticUrl) {
        setAttachmentUrl(savedStaticUrl); // static: no fetch needed, instant
      } else if (savedSourceType === "variable" && savedAttachKey) {
        attachPromise = fetchVariable(savedAttachKey)
          .then((url) => setAttachmentUrl(url))
          .catch(() => setAttachmentUrl(""));
      } else {
        setAttachmentUrl("");
      }
    }

    await Promise.all([...fetchPromises, attachPromise]);
  };

  const applyFreshVariables = (template: Template) => {
    const indices = extractPlaceholderIndices(template);
    if (isContextNull) {
      setVariables(buildDemoVariableMap(indices));
    } else {
      setVariables(buildEmptyVariableMap(indices));
    }
    setQuickFillVars({});
    setSavedConfig(null);
    setAttachmentVariableKey("");
    setAttachmentUrl("");
    setAttachmentSourceType("variable");
    setStaticAttachmentFileName("");
  };

  // ── Quick fill (unchanged) ────────────────────────────────
  const handleQuickFill = useCallback(
    async (index: number, variableKey: string) => {
      setQuickFillVars((prev) => ({ ...prev, [index]: variableKey }));

      if (isContextNull) {
        setVariables((prev) => ({ ...prev, [index]: `[${variableKey}]` }));
        return;
      }

      const value = await fetchVariable(variableKey);
      setVariables((prev) => ({ ...prev, [index]: value }));
    },
    [fetchVariable, isContextNull],
  );

  const handleVariableChange = useCallback((index: number, value: string) => {
    shouldAutoSend.current = false;
    setVariables((prev) => ({ ...prev, [index]: value }));
  }, []);

  // ── Attachment variable change (unchanged — variable mode) ─
  const handleAttachmentVariableChange = useCallback(
    async (variableKey: string) => {
      setAttachmentVariableKey(variableKey);

      if (!variableKey) {
        setAttachmentUrl("");
        return;
      }

      if (isContextNull) {
        setAttachmentUrl(`[${variableKey}]`);
        return;
      }

      const url = await fetchVariable(variableKey).catch(() => "");
      setAttachmentUrl(url);
    },
    [fetchVariable, isContextNull],
  );

  // ── NEW: Switch between "variable" and "static" source ────
  const handleAttachmentSourceChange = useCallback(
    (sourceType: AttachmentSourceType) => {
      setAttachmentSourceType(sourceType);

      if (sourceType === "variable") {
        // Switching back to variable mode: re-resolve from attachmentVariableKey
        setStaticAttachmentFileName("");
        if (attachmentVariableKey) {
          if (isContextNull) {
            setAttachmentUrl(`[${attachmentVariableKey}]`);
          } else {
            void fetchVariable(attachmentVariableKey)
              .then((url) => setAttachmentUrl(url))
              .catch(() => setAttachmentUrl(""));
          }
        } else {
          setAttachmentUrl("");
        }
      } else {
        // Switching to static mode: clear variable key, wait for upload
        setAttachmentVariableKey("");
        // Keep existing staticAttachmentUrl/fileName if already uploaded this session
        // (attachmentUrl state already holds it if previously uploaded)
      }
    },
    [attachmentVariableKey, fetchVariable, isContextNull],
  );

  // ── NEW: Upload a static attachment file ──────────────────
  const handleStaticAttachmentUpload = useCallback(
    async (file: File) => {
      setLoading((p) => ({ ...p, uploadingAttachment: true }));
      try {
        const { url, fileName } = await uploadStaticAttachment(file, module);
        setAttachmentUrl(url);
        setStaticAttachmentFileName(fileName);
        toast.success("Attachment uploaded successfully!");
      } catch (err) {
        console.error(
          "[useWhatsappTemplateModal] handleStaticAttachmentUpload:",
          err,
        );
        toast.error("Failed to upload attachment");
      } finally {
        setLoading((p) => ({ ...p, uploadingAttachment: false }));
      }
    },
    [module],
  );

  // ── NEW: Remove uploaded static attachment ────────────────
  const handleRemoveStaticAttachment = useCallback(() => {
    setAttachmentUrl("");
    setStaticAttachmentFileName("");
  }, []);

  // ── Save config only ──────────────────────────────────────
  const handleSaveConfigOnly = async () => {
    if (!selectedTemplate) {
      toast.warning("Please select a template first");
      return;
    }

    const hasAttachmentConfig =
      attachmentSourceType === "static"
        ? !!attachmentUrl
        : !!attachmentVariableKey;

    if (templateHasAttachment(selectedTemplate) && !hasAttachmentConfig) {
      toast.warning(
        "Choose an image/video/document (upload one or pick a variable) before saving",
      );
      return;
    }

    if (Object.keys(quickFillVars).length === 0 && !hasAttachmentConfig) {
      toast.warning("Please map at least one variable before saving");
      return;
    }

    setLoading((p) => ({ ...p, savingConfig: true }));
    try {
      const uuid = localStorage.getItem("UUID");
      const config: SavedTemplateConfig = {
        module,
        displayModule,
        templateId: selectedTemplate.id,
        templateName: selectedTemplate.name,
        variableMappings: quickFillVars,
        attachmentSourceType,
        attachmentVariableKey:
          attachmentSourceType === "variable"
            ? attachmentVariableKey || undefined
            : undefined,
        staticAttachmentUrl:
          attachmentSourceType === "static"
            ? attachmentUrl || undefined
            : undefined,
        staticAttachmentFileName:
          attachmentSourceType === "static"
            ? staticAttachmentFileName || undefined
            : undefined,
        a_application_login_id: String(uuid),
        language: selectedTemplate.language,
      };

      const saved = await upsertSavedConfig(config);
      setSavedConfig(saved);
      onSuccesDefautlSaveConfig && onSuccesDefautlSaveConfig();
      toast.success("Template configuration saved!");
    } catch (err) {
      console.error("[useWhatsappTemplateModal] handleSaveConfigOnly:", err);
      toast.error("Failed to save template configuration");
    } finally {
      setLoading((p) => ({ ...p, savingConfig: false }));
    }
  };

  // ── Send template ─────────────────────────────────────────
  const handleSend = async () => {
    if (!selectedTemplate || !onSend || mode === "config-only") return;

    setLoading((p) => ({ ...p, sending: true }));
    try {
      const hasAttachmentConfig =
        attachmentSourceType === "static"
          ? !!attachmentUrl
          : !!attachmentVariableKey;

      if (
        saveAsDefault &&
        (Object.keys(quickFillVars).length > 0 || hasAttachmentConfig)
      ) {
        const uuid = localStorage.getItem("UUID");
        void upsertSavedConfig({
          module,
          displayModule,
          templateId: selectedTemplate.id,
          templateName: selectedTemplate.name,
          language: selectedTemplate.language,
          variableMappings: quickFillVars,
          attachmentSourceType,
          attachmentVariableKey:
            attachmentSourceType === "variable"
              ? attachmentVariableKey || undefined
              : undefined,
          staticAttachmentUrl:
            attachmentSourceType === "static"
              ? attachmentUrl || undefined
              : undefined,
          staticAttachmentFileName:
            attachmentSourceType === "static"
              ? staticAttachmentFileName || undefined
              : undefined,
          a_application_login_id: String(uuid),
        }).catch(console.error);
      }

      await onSend(
        selectedTemplate,
        variables,
        contextParams!,
        quickFillVars,
        attachmentSourceType === "variable"
          ? attachmentVariableKey || undefined
          : undefined,
        attachmentUrl || undefined,
      );
      toast.success("WhatsApp template sent successfully!");
    } catch (err) {
      console.error("[useWhatsappTemplateModal] handleSend:", err);
      toast.error("Failed to send WhatsApp template");
    } finally {
      setLoading((p) => ({ ...p, sending: false }));
    }
  };

  // ── Clear cache (unchanged, resets new state too) ─────────
  const handleClearCache = useCallback(() => {
    clearVariableCache();
    setVariables({});
    setQuickFillVars({});
    setAttachmentVariableKey("");
    setAttachmentUrl("");
    setAttachmentSourceType("variable");
    setStaticAttachmentFileName("");
    if (selectedTemplate) applyFreshVariables(selectedTemplate);
    toast.success("Variable cache cleared!");
  }, [clearVariableCache, selectedTemplate, isContextNull]);

  return {
    templates,
    templateOptions,
    selectedTemplate,
    variables,
    quickFillVars,
    savedConfig,
    availableVariables,
    attachmentVariables,
    attachmentVariableKey,
    attachmentUrl,
    attachmentSourceType,
    staticAttachmentFileName,
    mode,
    isContextNull,
    loading,
    isFormDisabled,
    saveAsDefault,
    setSaveAsDefault,
    templateOptionSelected,
    handleTemplateChange,
    handleQuickFill,
    handleVariableChange,
    handleAttachmentVariableChange,
    handleAttachmentSourceChange,
    handleStaticAttachmentUpload,
    handleRemoveStaticAttachment,
    handleSaveConfigOnly,
    handleSend,
    handleClearCache,
  };
}
