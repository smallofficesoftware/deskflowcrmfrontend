// ============================================================
// hooks/useWhatsappVariableMgmt.ts
// CHANGE: Added getAttachmentVariables to returned object
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { variableService } from "../utils/variableDefinitions";
import type { VariableConfig } from "../components/model/whatsapp_template_sender/types/windex";
import { normalizeModuleFlag } from "../utils/TemplateUtils";

export interface UseVariablesReturn {
  availableVariables: VariableConfig[]; // body text variables
  attachmentVariables: VariableConfig[]; // NEW: media/file URL variables
  fetchVariable: (variableKey: string) => Promise<string>;
  isLoading: (variableKey: string) => boolean;
  clearVariableCache: () => void;
}

export function useVariables(
  module: string,
  contextParams: Record<string, any> | null,
): UseVariablesReturn {
  const normalizedModule = normalizeModuleFlag(module);
  const [availableVariables, setAvailableVariables] = useState<
    VariableConfig[]
  >([]);
  const [attachmentVariables, setAttachmentVariables] = useState<
    VariableConfig[]
  >([]);
  const [loadingSet, setLoadingSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    setAvailableVariables(
      variableService.getAvailableVariables(normalizedModule),
    );
    setAttachmentVariables(
      variableService.getAttachmentVariables(normalizedModule),
    );
  }, [normalizedModule]);

  const fetchVariable = useCallback(
    async (variableKey: string): Promise<string> => {
      if (!contextParams) return `[${variableKey}]`;

      setLoadingSet((prev) => new Set(prev).add(variableKey));
      try {
        return await variableService.fetchVariableValue(
          variableKey,
          normalizedModule,
          contextParams,
        );
      } catch (err) {
        console.error(
          `[useVariables] fetchVariable error (${variableKey}):`,
          err,
        );
        return "";
      } finally {
        setLoadingSet((prev) => {
          const next = new Set(prev);
          next.delete(variableKey);
          return next;
        });
      }
    },
    [normalizedModule, contextParams],
  );

  const isLoading = useCallback(
    (variableKey: string) => loadingSet.has(variableKey),
    [loadingSet],
  );

  const clearVariableCache = useCallback(() => {
    variableService.clearCache(undefined, normalizedModule);
  }, [normalizedModule]);

  return {
    availableVariables,
    attachmentVariables,
    fetchVariable,
    isLoading,
    clearVariableCache,
  };
}
