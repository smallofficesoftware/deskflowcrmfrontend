import React, { useCallback, useState } from "react";
import { toast } from "react-toastify";
import StageFormModal from "./StageFormModal";
import {
  changeStageWithForm,
  fetchCurrentStageValues,
  fetchStageName,
  fetchStageFormFields,
  IStageChangeRequest,
  IStageFormField,
  toStageFormPayload,
} from "./StageFormApi";

interface IPendingStageChange {
  request: IStageChangeRequest;
  fields: IStageFormField[];
  initialValues: Record<number, string | boolean>;
}

/**
 * One flow for every Contact / Inquiry stage change in the web app.
 * `requestStageChange` asks the stage form (custom fields with display_on = 2
 * for the target stage) in a popup when the stage has any, then calls the
 * change-stage-with-form endpoint. Render `stageFormModal` once in the screen.
 * Resolves true when the stage was changed.
 */
export const useStageChange = () => {
  const [pending, setPending] = useState<IPendingStageChange | null>(null);
  const [saving, setSaving] = useState(false);

  const run = useCallback(
    async (
      request: IStageChangeRequest,
      fields: IStageFormField[],
      values: Record<number, string | boolean>,
    ) => {
      const result = await changeStageWithForm(request, toStageFormPayload(fields, values));
      if (result.ok) {
        if (result.message && !request.silentSuccess) toast.success(result.message);
        request.onSuccess?.();
      } else {
        toast.error(result.message || "Something went wrong");
      }
      return result.ok;
    },
    [],
  );

  const requestStageChange = useCallback(
    async (request: IStageChangeRequest): Promise<boolean> => {
      const fields = await fetchStageFormFields(request.module, request.stageId);
      if (fields.length === 0) {
        const ok = await run(request, [], {});
        if (!ok) request.onCancel?.();
        return ok;
      }
      const singleId = Array.isArray(request.appliedTo)
        ? request.appliedTo.length === 1
          ? request.appliedTo[0]
          : null
        : request.appliedTo === "all"
          ? null
          : request.appliedTo;
      const initialValues =
        singleId !== null ? await fetchCurrentStageValues(request.module, singleId, fields) : {};
      const stageName = request.stageName ?? (await fetchStageName(request.stageId));
      setPending({ request: { ...request, stageName }, fields, initialValues });
      return true;
    },
    [run],
  );

  const handleSubmit = async (values: Record<number, string | boolean>) => {
    if (!pending) return;
    setSaving(true);
    const ok = await run(pending.request, pending.fields, values);
    setSaving(false);
    if (ok) setPending(null);
  };

  const handleCancel = () => {
    pending?.request.onCancel?.();
    setPending(null);
  };

  const stageFormModal = (
    <StageFormModal
      show={pending !== null}
      stageName={pending?.request.stageName}
      fields={pending?.fields || []}
      initialValues={pending?.initialValues || {}}
      saving={saving}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );

  return { requestStageChange, stageFormModal };
};
