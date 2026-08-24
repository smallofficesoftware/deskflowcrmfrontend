import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { axiosInstance } from "../../../../../services/axiosInstance";
import { fetchAllDocumentTemplatesForPicker } from "../../../../order-print-view/orderPrintController";

// pageTypesCustomFieldList's form_type ids (5-11 and 16, the only ones
// "Document Designer Page" is allowed on, per CustomInquiryFromView.tsx/
// CreateCustomFieldView.tsx's isFormType5to9 gate) mapped onto
// DocumentDesignerView.tsx's SUPPORTED_DOC_TYPES ids — so "Open Document
// Designer" can open the right doc type directly instead of making the user
// pick it again.
const FORM_TYPE_TO_DOC_TYPE: Record<string, string> = {
  "5": "quotation",
  "6": "salesOrder",
  "7": "salesInvoice",
  "8": "purchaseInvoice",
  "9": "purchaseOrder",
  "10": "returnSalesInvoice",
  "11": "returnPurchaseInvoice",
  "16": "proformaInvoice",
};

// Admin-side "Add Data source" for the "Document Designer Page" custom field
// type (data_type 14) — its own routed page (/custom-field/designer-page-
// sources?fieldId=&fieldTitle=&formType=), not a modal inside
// CustomInquiryFromView.tsx, so it's directly linkable/bookmarkable same as
// /document-designer itself. Same custom_field_form_datavalues table/
// endpoints Page Text/Url's own admin editor (CustomFormFiledEditor.tsx)
// uses, but NOT capped at one source — each source here is its own real,
// independently named Document Designer template (unlike a typed text/URL
// blob), so a field can offer several named pages. "Open Document Designer"
// always starts a brand-new blank page (?autoNew=1) scoped to this field's
// own doc type; each list row's own "Edit" reopens that specific saved page
// (?openTemplateId=&sourceRowId=) to revise it in place.
const DesignerPageDataSourceView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fieldId = searchParams.get("fieldId");
  const fieldTitle = searchParams.get("fieldTitle") || "";
  const formType = searchParams.get("formType") || "";

  const getUUID = localStorage.getItem("UUID");
  const [templates, setTemplates] = useState<
    { id: number; doc_type: string; template_name: string; is_default: number }[]
  >([]);
  const [sources, setSources] = useState<{ id: number; data_sorce: string }[]>([]);

  useEffect(() => {
    fetchAllDocumentTemplatesForPicker().then(setTemplates);
  }, []);

  const getDatavalues = async () => {
    const requestData = {
      a_application_login_id: getUUID,
      custom_field_master_id: fieldId,
      isDelete: 0,
    };
    try {
      const response = await axiosInstance.post("getCustomFieldDatavalues", requestData);
      let newSources: { id: number; data_sorce: string }[] = [];
      if (response.data && Array.isArray(response.data)) {
        newSources = response.data
          .map((item: { id: number; data_sorce: string }) => ({ id: item.id, data_sorce: item.data_sorce?.trim() || "" }))
          .filter((item: { id: number; data_sorce: string }) => item.data_sorce !== "");
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        newSources = response.data.data
          .map((item: { id: number; data_sorce: string }) => ({ id: item.id, data_sorce: item.data_sorce?.trim() || "" }))
          .filter((item: { id: number; data_sorce: string }) => item.data_sorce !== "");
      }
      setSources(newSources);
    } catch (error) {
      console.error("Error get source:", error);
      toast.error("Error get source");
    }
  };

  useEffect(() => {
    if (fieldId) getDatavalues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldId]);

  const handleDeleteById = async (itemId: number) => {
    if (!fieldId || !itemId) return;
    try {
      await axiosInstance.post("createCustomFieldDatavalues", {
        a_application_login_id: getUUID,
        custom_field_master_id: fieldId,
        deleteValue: itemId,
      });
      toast.success("Source Deleted Successfully");
      await getDatavalues();
    } catch (error) {
      console.error("Error deleting source:", error);
      toast.error("Error deleting source");
    }
  };

  const fieldDocType = FORM_TYPE_TO_DOC_TYPE[formType] || "quotation";

  const openDesignerForNewSource = () => {
    if (!fieldId) return;
    const params = new URLSearchParams({
      fieldId,
      fieldTitle,
      docType: fieldDocType,
      autoNew: "1",
    });
    navigate(`/custom-field/designer-page-editor?${params.toString()}`);
  };

  const openDesignerForExistingSource = (source: { id: number; data_sorce: string }) => {
    if (!fieldId) return;
    const template = templates.find((tpl) => String(tpl.id) === String(source.data_sorce));
    const params = new URLSearchParams({
      fieldId,
      fieldTitle,
      docType: template?.doc_type || fieldDocType,
      openTemplateId: source.data_sorce,
      sourceRowId: String(source.id),
    });
    navigate(`/custom-field/designer-page-editor?${params.toString()}`);
  };

  const templateLabel = (templateId: string) => {
    const t = templates.find((tpl) => String(tpl.id) === String(templateId));
    return t ? t.template_name : templateId;
  };

  if (!fieldId) {
    return <div className="p-4">Missing field — open this page via a custom field's "Add Data source" action.</div>;
  }

  return (
    <div className="p-4">
      <button className="btn btn-sm btn-outline-secondary mb-3" onClick={() => window.close()}>
        Close Tab
      </button>
      <h2 className="form_header_text">Add Source: {fieldTitle}</h2>
      <div className="m-title-2 col-12">
        <div className="head">
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className="modal-button2" onClick={openDesignerForNewSource}>
              Open Document Designer
            </button>
          </div>
          <div className="source-of-type-list-grid-block" style={{ overflowY: "auto", maxHeight: "60vh", marginTop: "20px" }}>
            <div className="source-of-type-list-grid-main">
              <table className="table table-hover" style={{ borderCollapse: "separate", borderSpacing: "0 5px" }}>
                <thead>
                  <tr>
                    <th style={{ padding: "10px", textAlign: "left" }}>Data Source</th>
                    <th style={{ padding: "10px", textAlign: "center" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sources.length === 0 && (
                    <tr>
                      <td colSpan={2} style={{ padding: "10px", textAlign: "left", color: "#888" }}>
                        No source set yet — click "Open Document Designer" above.
                      </td>
                    </tr>
                  )}
                  {sources.map((item, index) => (
                    <tr key={index} style={{ background: "#fff", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                      <td style={{ padding: "10px", textAlign: "left" }}>{templateLabel(item.data_sorce)}</td>
                      <td style={{ padding: "10px", textAlign: "center" }}>
                        <span
                          style={{ cursor: "pointer", marginRight: "10px" }}
                          onClick={() => openDesignerForExistingSource(item)}
                        >
                          <svg viewBox="0 0 24 24" width="20" height="20">
                            <path
                              fill="currentColor"
                              d="M3.95 16.7v3.4h3.4l9.8-9.9-3.4-3.4-9.8 9.9zm15.8-9.1c.4-.4.4-.9 0-1.3l-2.1-2.1c-.4-.4-.9-.4-1.3 0l-1.6 1.6 3.4 3.4 1.6-1.6z"
                            />
                          </svg>
                        </span>
                        <span style={{ cursor: "pointer" }} onClick={() => handleDeleteById(item.id)}>
                          <svg viewBox="0 -960 960 960" width="20" height="20">
                            <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
                          </svg>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignerPageDataSourceView;
