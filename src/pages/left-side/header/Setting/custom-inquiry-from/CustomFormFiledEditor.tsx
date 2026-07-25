// CustomEditor.tsx
import { CKEditor, useCKEditorCloud } from "@ckeditor/ckeditor5-react";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { axiosInstance } from "../../../../../services/axiosInstance";
import { ICustomInquiryFromList } from "./CustomInquiryFromController";

// Import CKEditor CSS for styling

import "ckeditor5/ckeditor5.css";
const CustomFormFiledEditor = ({
  show,
  onHide,
  passDataInAddItem,
}: {
  show: boolean;
  onHide: () => void;
  passDataInAddItem: ICustomInquiryFromList | undefined;
}) => {
  const getUUID = localStorage.getItem("UUID");
  const token = localStorage.getItem("token");
  const [editorData, setEditorData] = useState<string>("");
  const [sources, setSources] = useState<{ id: number; data_sorce: string }[]>(
    passDataInAddItem?.data_sorce
      ? [{ id: passDataInAddItem.id || 0, data_sorce: passDataInAddItem.data_sorce }]
      : []
  );

  const getDatavalues = async () => {
    const requestData = {
      a_application_login_id: getUUID,
      custom_field_master_id: passDataInAddItem?.id,
      isDelete: 0,
    }
    try {
      const response = await axiosInstance.post("getCustomFieldDatavalues", requestData)

      let newSources: { id: number; data_sorce: string }[] = [];
      if (response.data && Array.isArray(response.data)) {
        newSources = response.data
          .map((item: { id: number; data_sorce: string }) => ({
            id: item.id,
            data_sorce: item.data_sorce?.trim() || ""
          }))
          .filter((item: { id: number; data_sorce: string }) => item.data_sorce !== "");
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        newSources = response.data.data
          .map((item: { id: number; data_sorce: string }) => ({
            id: item.id,
            data_sorce: item.data_sorce?.trim() || ""
          }))
          .filter((item: { id: number; data_sorce: string }) => item.data_sorce !== "");
      }

      setSources(newSources);

      if (response.status !== 200) {
        console.error("Failed to get source");
        toast.error("Failed to get source");
      }
    } catch (error) {
      console.error("Error get source:", error);
      toast.error("Error get source");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (passDataInAddItem?.id) {
      getDatavalues();
    }
  }, [passDataInAddItem?.id]);

  const [loading, setLoading] = useState<boolean>(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);


  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleAddSource();
      }
    };

    if (show) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [show, editorData]);

  // Use CKEditor Cloud
  const cloud = useCKEditorCloud({
    version: "46.0.0",
    premium: true,
  });

  // Handle loading and error states
  if (cloud.status === "error") {
    toast.error("CKEditor Cloud failed to load. Please Try Again Later.")
    console.error("CKEditor Cloud failed to load:", cloud.error);
    return <div style={{ display: "none" }}>Error loading CKEditor!</div>;
  }

  if (cloud.status === "loading") {
    console.error("CKEditor Loading");
    return <div style={{ display: "none" }}>Loading CKEditor...</div>;
  }

  // Destructure plugins from cloud
  const {
    ClassicEditor,
    Essentials,
    Paragraph,
    Undo,
    Bold,
    Italic,
    Table,
    TableToolbar,
    Image,
    Highlight,
    FontSize,
    FontFamily,
    FontColor,
    FontBackgroundColor,
    RemoveFormat,
    BlockQuote,
    HorizontalLine,
    PageBreak,
    Underline,
    Strikethrough,
    Subscript,
    Superscript,

  } = cloud.CKEditor;

  const updateServer = async (updatedSources: { id: number; data_sorce: string }[], operationType?: 'add' | 'edit' | 'delete', itemId?: number) => {
    if (!passDataInAddItem?.id) return;

    let requestData;

    if (operationType === 'edit' && itemId && itemId > 0) {
      const itemToEdit = updatedSources.find(item => item.id === itemId);
      if (itemToEdit) {
        requestData = {
          a_application_login_id: getUUID,
          custom_field_master_id: passDataInAddItem.id,
          data_source: itemToEdit.data_sorce,
          editValue: itemId
        }
      }
    } else if (operationType === 'delete' && itemId && itemId > 0) {
      requestData = {
        a_application_login_id: getUUID,
        custom_field_master_id: passDataInAddItem.id,
        deleteValue: itemId,
      }
    } else {
      const lastValue = updatedSources[updatedSources.length - 1];
      requestData = {
        a_application_login_id: getUUID,
        custom_field_master_id: passDataInAddItem.id,
        data_source: lastValue.data_sorce,
        editValue: lastValue?.id || 0
      }
    }

    try {
      setLoading(true);
      const response = await axiosInstance.post("createCustomFieldDatavalues", requestData);

      if (response.status !== 200) {
        console.error("Failed to update source");
        toast.error(`Failed to ${operationType} source`);
      }
    } catch (error) {
      console.error(`Error ${operationType}ing source:`, error);
      toast.error(`Error ${operationType}ing source`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSource = async () => {
    const htmlContent = editorData.trim();
    if (htmlContent === "") return;

    const isImageURLType = passDataInAddItem?.data_type === 11 || passDataInAddItem?.data_type === 12;

    const finalSource = isImageURLType ? editorData : editorData.trim();

    if (finalSource === "") return;

    if (isImageURLType && sources.length >= 1 && editIndex === null) {
      toast.error("Cannot add more than one source when Data Type is Page_Text");
      return;
    }

    let updatedSources: { id: number; data_sorce: string }[];

    if (editIndex !== null) {
      updatedSources = [...sources];
      const currentItem = updatedSources[editIndex];

      updatedSources[editIndex] = {
        ...currentItem,
        data_sorce: finalSource
      };
      const editId = currentItem.id;
      await updateServer(updatedSources, 'edit', editId);
      toast.success("Source Updated Successfully");
      setEditIndex(null);
    } else {
      if (sources.some(source => source.data_sorce === finalSource)) {
        toast.warn("Source already exists");
        return;
      }
      updatedSources = [...sources, { id: 0, data_sorce: finalSource }];
      toast.success("Source Added Successfully");
      await updateServer(updatedSources, 'add');
    }
    await getDatavalues();
    // setSources(updatedSources);
    setEditorData("");
  };



  const handleChangeInput = (itemId: number, data_sorce: string, index: number) => {
    setEditorData(data_sorce);
    setEditIndex(index);
  };

  const handleDeleteById = async (itemId: number) => {
    const updatedSources = sources.filter((item) => item.id !== itemId);
    setSources(updatedSources);

    if (itemId) {
      toast.success("Source Deleted Successfully");
      await updateServer(updatedSources, 'delete', itemId);
    }
  }
  return (
    <React.Fragment>
      {show && (
        <div className="modal1">
          <div
            className="modal-content1"
            style={{ maxHeight: "80%", width: "80%", overflow: "scroll" }}
          >
            <span className="close" onClick={onHide}>
              ×
            </span>
            <h2 className="modal-title1 form_header_text">
              Add Source: {passDataInAddItem?.title}
            </h2>

            <div className="m-title-2 col-12">
              <div className="head">
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      borderRadius: "10px",
                      border: "1px solid #ccc",
                      backgroundColor: "#fff",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      padding: "10px",
                      flex: 1,
                      minHeight: "150px",
                    }}
                  >
                    <CKEditor
                      editor={ClassicEditor}
                      data={editorData}
                      config={{
                        licenseKey: "eyJhbGciOiJFUzI1NiJ9.eyJleHAiOjE3ODYxNDcxOTksImp0aSI6ImU2NzVlM2Q2LWYxMDktNGUxZC1iNTM1LTYzNDNkMzlhOGEwYSIsInVzYWdlRW5kcG9pbnQiOiJodHRwczovL3Byb3h5LWV2ZW50LmNrZWRpdG9yLmNvbSIsImRpc3RyaWJ1dGlvbkNoYW5uZWwiOlsiY2xvdWQiLCJkcnVwYWwiXSwiZmVhdHVyZXMiOlsiRFJVUCIsIkUyUCIsIkUyVyIsIkJPWCJdLCJ2YyI6IjA2ODBlNmZjIn0.OLdVIp_Hj6W801zd_1ovTbbA-A92CAaSSX7A6ELddikpflm9f_Dtnf-B-nA3Zisy54z7gR1zOfjtjeu-TNgRug",
                        plugins: [
                          Essentials,
                          Paragraph,
                          Undo,
                          Bold,
                          Italic,
                          Table,
                          TableToolbar,
                          Image,
                          Highlight,
                          FontSize,
                          FontFamily,
                          FontColor,
                          FontBackgroundColor,
                          RemoveFormat,
                          BlockQuote,
                          HorizontalLine,
                          PageBreak,
                          Underline,
                          Strikethrough,
                          Subscript,
                          Superscript,
                          cloud.CKEditor.Alignment,
                        ],
                        toolbar: [
                          "undo",
                          "redo",
                          "|",
                          "bold",
                          "italic",
                          "|",
                          "alignment",
                          "insertTable",
                          "highlight",
                          "fontSize",
                          "fontFamily",
                          "fontColor",
                          "fontBackgroundColor",
                          "removeFormat",
                          "blockQuote",
                          "horizontalLine",
                          "pageBreak",
                          "underline",
                          "strikethrough",
                          "subscript",
                          "superscript",
                        ],
                        alignment: {
                          options: ["left", "center", "right", "justify"],
                        },
                        table: {
                          contentToolbar: [
                            "tableColumn",
                            "tableRow",
                            "mergeTableCells",
                          ],
                        },
                      }}
                      onChange={(event, editor) => {
                        const data = editor.getData();
                        setEditorData(data);
                      }}
                      onReady={(editor) => {
                        const root = editor.editing.view.document.getRoot();
                        if (root) {
                          editor.editing.view.change((writer) => {
                            writer.setStyle("min-height", "90px", root);
                          });
                        }
                      }}
                      onError={(error, { willEditorRestart }) => {
                        console.error("CKEditor error:", error);
                        if (willEditorRestart) {
                          console.warn("Editor will restart due to error.");
                        }
                      }}
                    />
                  </div>
                  <div
                    onClick={handleAddSource}
                    style={{
                      cursor: "pointer",
                      borderRadius: "8px",
                      padding: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "40px",
                      height: "40px",
                      color: "#000",
                    }}
                    title={editIndex !== null ? "Update Source" : "Add Source"}
                  >
                    {loading ? (
                      <span style={{ color: "#000" }}>Processing...</span>
                    ) : editIndex !== null ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="24px"
                        viewBox="0 -960 960 960"
                        width="24px"
                        fill="#000"
                      >
                        <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="24px"
                        viewBox="0 -960 960 960"
                        width="24px"
                        fill="#000"
                      >
                        <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                      </svg>
                    )}
                  </div>
                </div>
                <div
                  className="source-of-type-list-grid-block"
                  style={{
                    overflowY: "auto",
                    maxHeight: "350px",
                    marginTop: "20px",
                  }}
                >
                  <div className="source-of-type-list-grid-main">
                    <table
                      className="table table-hover"
                      style={{
                        borderCollapse: "separate",
                        borderSpacing: "0 5px",
                      }}
                    >
                      <thead>
                        <tr>
                          <th style={{ padding: "10px", textAlign: "left" }}>
                            Data Sources
                          </th>
                          <th style={{ padding: "10px", textAlign: "center" }}>
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sources.map((item, index) => (
                          <tr
                            key={index}
                            style={{
                              background: "#fff",
                              borderRadius: "8px",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                            }}
                          >
                            <td style={{ padding: "10px", textAlign: "left" }}>
                              <div
                                style={{ maxWidth: "90%" }}
                                dangerouslySetInnerHTML={{ __html: item.data_sorce }}
                              />
                            </td>
                            <td
                              style={{ padding: "10px", textAlign: "center" }}
                            >
                              <span
                                style={{
                                  cursor: "pointer",
                                  marginRight: "10px",
                                  maxWidth: "10%",
                                }}
                                onClick={() => handleChangeInput(item.id, item.data_sorce, sources.indexOf(item))}
                              >
                                <svg viewBox="0 0 24 24" width="20" height="20">
                                  <path
                                    fill="currentColor"
                                    d="M3.95 16.7v3.4h3.4l9.8-9.9-3.4-3.4-9.8 9.9zm15.8-9.1c.4-.4.4-.9 0-1.3l-2.1-2.1c-.4-.4-.9-.4-1.3 0l-1.6 1.6 3.4 3.4 1.6-1.6z"
                                  />
                                </svg>
                              </span>
                              <span
                                style={{ cursor: "pointer" }}
                                onClick={() => handleDeleteById(item.id)}
                              >
                                <svg
                                  viewBox="0 -960 960 960"
                                  width="20"
                                  height="20"
                                >
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
        </div>
      )}
    </React.Fragment>
  );
};

export default CustomFormFiledEditor;
