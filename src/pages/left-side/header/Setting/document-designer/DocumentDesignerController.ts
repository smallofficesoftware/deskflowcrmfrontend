import { toast } from "react-toastify";
import { axiosInstance } from "../../../../../services/axiosInstance";

const companyMastersId = () => localStorage.getItem("COMPANY_ID");
const loginId = () => localStorage.getItem("UUID");

export interface IDocumentTemplateListItem {
  id: number;
  template_name: string;
  is_default: number;
  display_order: number;
  has_unpublished_changes: number;
}

export interface IDocumentTemplateFull {
  id: number;
  doc_type: string;
  template_name: string;
  draft_template_json: string;
  published_template_json: string;
}

const handleError = (error: any, fallback: string) => {
  console.error(error);
  toast.error(error?.response?.data?.developer_msg || fallback);
};

export const verifyDocumentManagerPin = async (pin: string): Promise<boolean> => {
  try {
    const { data } = await axiosInstance.post("document-templates/verify-pin", {
      pin,
    });
    if (data?.ack === 1) return true;
    toast.error(data?.ack_msg || "Incorrect PIN");
    return false;
  } catch (error) {
    handleError(error, "Incorrect PIN");
    return false;
  }
};

export const listDocumentTemplates = async (
  doc_type: string,
): Promise<IDocumentTemplateListItem[]> => {
  try {
    const { data } = await axiosInstance.post("document-templates/list", {
      company_masters_id: companyMastersId(),
      doc_type,
    });
    return data?.ack === 1 ? data.data.item : [];
  } catch (error) {
    handleError(error, "Failed to load templates");
    return [];
  }
};

export const getDocumentTemplate = async (
  doc_type: string,
  id?: number,
): Promise<IDocumentTemplateFull | null> => {
  try {
    const { data } = await axiosInstance.post("document-templates/get", {
      company_masters_id: companyMastersId(),
      doc_type,
      id,
    });
    return data?.ack === 1 ? data.data.item : null;
  } catch (error) {
    handleError(error, "Failed to load template");
    return null;
  }
};

export const createDocumentTemplate = async (
  doc_type: string,
  template_name: string,
  template_json: any,
): Promise<IDocumentTemplateFull | null> => {
  try {
    const { data } = await axiosInstance.post("document-templates/create", {
      company_masters_id: companyMastersId(),
      a_application_login_id: loginId(),
      doc_type,
      template_name,
      template_json,
    });
    if (data?.ack === 1) return data.data.item;
    toast.error(data?.ack_msg || "Failed to create template");
    return null;
  } catch (error) {
    handleError(error, "Failed to create template");
    return null;
  }
};

export const updateDocumentTemplateDraft = async (
  id: number,
  template_json?: any,
  template_name?: string,
): Promise<boolean> => {
  try {
    const { data } = await axiosInstance.post("document-templates/update", {
      company_masters_id: companyMastersId(),
      a_application_login_id: loginId(),
      id,
      template_json,
      template_name,
    });
    return data?.ack === 1;
  } catch (error) {
    handleError(error, "Failed to save draft");
    return false;
  }
};

export const applyOptionsToDraft = async (
  id: number,
  doc_type: string,
  options: { header?: any; columnOptions?: any; pageSize?: any },
): Promise<any | null> => {
  try {
    const { data } = await axiosInstance.post("document-templates/apply-options", {
      company_masters_id: companyMastersId(),
      a_application_login_id: loginId(),
      id,
      doc_type,
      ...options,
    });
    return data?.ack === 1 ? data.data.item : null;
  } catch (error) {
    handleError(error, "Failed to apply settings");
    return null;
  }
};

export const publishDocumentTemplate = async (id: number): Promise<boolean> => {
  try {
    const { data } = await axiosInstance.post("document-templates/publish", {
      company_masters_id: companyMastersId(),
      a_application_login_id: loginId(),
      id,
    });
    if (data?.ack === 1) {
      toast.success("Template published successfully");
      return true;
    }
    toast.error(data?.ack_msg || "Failed to publish template");
    return false;
  } catch (error) {
    handleError(error, "Failed to publish template");
    return false;
  }
};

export const discardDraftChanges = async (id: number): Promise<boolean> => {
  try {
    const { data } = await axiosInstance.post("document-templates/discard-draft", {
      company_masters_id: companyMastersId(),
      a_application_login_id: loginId(),
      id,
    });
    return data?.ack === 1;
  } catch (error) {
    handleError(error, "Failed to discard draft");
    return false;
  }
};

export const reorderDocumentTemplates = async (
  doc_type: string,
  orderedIds: number[],
): Promise<boolean> => {
  try {
    const { data } = await axiosInstance.post("document-templates/reorder", {
      company_masters_id: companyMastersId(),
      doc_type,
      orderedIds,
    });
    return data?.ack === 1;
  } catch (error) {
    handleError(error, "Failed to reorder templates");
    return false;
  }
};

export const setDefaultDocumentTemplate = async (
  id: number,
  doc_type: string,
): Promise<boolean> => {
  try {
    const { data } = await axiosInstance.post("document-templates/set-default", {
      company_masters_id: companyMastersId(),
      id,
      doc_type,
    });
    return data?.ack === 1;
  } catch (error) {
    handleError(error, "Failed to set default template");
    return false;
  }
};

export const deleteDocumentTemplate = async (
  id: number,
  doc_type: string,
): Promise<boolean> => {
  try {
    const { data } = await axiosInstance.post("document-templates/delete", {
      company_masters_id: companyMastersId(),
      id,
      doc_type,
    });
    if (data?.ack === 1) return true;
    toast.error(data?.ack_msg || "Cannot delete the last remaining template");
    return false;
  } catch (error) {
    handleError(error, "Failed to delete template");
    return false;
  }
};

export const listTemplateVersions = async (document_template_id: number): Promise<any[]> => {
  try {
    const { data } = await axiosInstance.post("document-templates/versions/list", {
      document_template_id,
    });
    return data?.ack === 1 ? data.data.item : [];
  } catch (error) {
    handleError(error, "Failed to load version history");
    return [];
  }
};

export const restoreTemplateVersion = async (
  document_template_id: number,
  version_number: number,
): Promise<boolean> => {
  try {
    const { data } = await axiosInstance.post("document-templates/versions/restore", {
      company_masters_id: companyMastersId(),
      a_application_login_id: loginId(),
      document_template_id,
      version_number,
    });
    if (data?.ack === 1) {
      toast.success("Version restored successfully");
      return true;
    }
    toast.error(data?.ack_msg || "Failed to restore version");
    return false;
  } catch (error) {
    handleError(error, "Failed to restore version");
    return false;
  }
};

export const duplicateDocumentTemplate = async (
  id: number,
  doc_type: string,
): Promise<IDocumentTemplateFull | null> => {
  try {
    const { data } = await axiosInstance.post("document-templates/duplicate", {
      company_masters_id: companyMastersId(),
      a_application_login_id: loginId(),
      id,
      doc_type,
    });
    if (data?.ack === 1) return data.data.item;
    toast.error(data?.ack_msg || "Failed to duplicate template");
    return null;
  } catch (error) {
    handleError(error, "Failed to duplicate template");
    return null;
  }
};

export const exportDocumentTemplate = async (id: number): Promise<any | null> => {
  try {
    const { data } = await axiosInstance.post("document-templates/export", {
      company_masters_id: companyMastersId(),
      id,
    });
    return data?.ack === 1 ? data.data.item : null;
  } catch (error) {
    handleError(error, "Failed to export template");
    return null;
  }
};

export const importDocumentTemplate = async (
  doc_type: string,
  template_name: string,
  template_json: any,
): Promise<IDocumentTemplateFull | null> => {
  try {
    const { data } = await axiosInstance.post("document-templates/import", {
      company_masters_id: companyMastersId(),
      a_application_login_id: loginId(),
      doc_type,
      template_name,
      template_json,
    });
    if (data?.ack === 1) return data.data.item;
    toast.error(data?.ack_msg || "Invalid template file");
    return null;
  } catch (error) {
    handleError(error, "Failed to import template");
    return null;
  }
};

export const listSystemTemplates = async (doc_type: string): Promise<any[]> => {
  try {
    const { data } = await axiosInstance.post("document-templates/system-gallery/list", {
      doc_type,
    });
    return data?.ack === 1 ? data.data.item : [];
  } catch (error) {
    handleError(error, "Failed to load gallery");
    return [];
  }
};

export const copyFromSystemTemplate = async (
  system_template_id: number,
  doc_type: string,
): Promise<IDocumentTemplateFull | null> => {
  try {
    const { data } = await axiosInstance.post("document-templates/system-gallery/copy", {
      company_masters_id: companyMastersId(),
      a_application_login_id: loginId(),
      system_template_id,
      doc_type,
    });
    if (data?.ack === 1) return data.data.item;
    toast.error(data?.ack_msg || "Failed to copy template");
    return null;
  } catch (error) {
    handleError(error, "Failed to copy template");
    return null;
  }
};

export const getDataDictionary = async (doc_type: string): Promise<any[]> => {
  try {
    const { data } = await axiosInstance.post("document-templates/data-dictionary", {
      company_masters_id: companyMastersId(),
      doc_type,
    });
    return data?.ack === 1 ? data.data.item : [];
  } catch (error) {
    handleError(error, "Failed to load data dictionary");
    return [];
  }
};

export const setFeatureFlag = async (
  feature_key: string,
  is_enabled: boolean,
  company_masters_id?: any,
): Promise<boolean> => {
  try {
    const { data } = await axiosInstance.post("set-feature-flag", {
      company_masters_id: company_masters_id ?? companyMastersId(),
      feature_key,
      is_enabled,
    });
    return data?.ack === 1;
  } catch (error) {
    handleError(error, "Failed to update feature flag");
    return false;
  }
};
