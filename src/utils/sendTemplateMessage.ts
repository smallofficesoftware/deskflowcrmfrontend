// ============================================================
// utils/sendTemplateMessage.ts
// Drop-in replacement for old sendTemplateMessagePdf()
// ============================================================

import { sendWhatsAppTemplate } from "../components/model/whatsapp_template_sender/api/whatsappTemplateApi";
import { toast } from "react-toastify";
import type {
  Template,
  VariableValueMap,
  QuickFillMap,
} from "../components/model/whatsapp_template_sender/types/windex";

/**
 * Sends a WhatsApp template message.
 * This is passed as the `onSend` prop to the modal from the parent page.
 *
 * @example
 * // In your parent component:
 * const handleSendTemplate = createSendTemplateHandler(setShowModal);
 */
export const sendTemplateMessage = async (
  template: Template,
  variables: VariableValueMap,
  receiverClue: Record<string, any>,
  quickFillVars: QuickFillMap,
  onSuccess?: () => void,
): Promise<void> => {
  const uuid = localStorage.getItem("UUID");

  await sendWhatsAppTemplate({
    a_application_login_id: uuid,
    template,
    variables,
    is_template_message: 1,
    receiverClue,
    quickFillVars,
  });

  onSuccess?.();
};
