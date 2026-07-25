import { CKEditor, useCKEditorCloud } from "@ckeditor/ckeditor5-react";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

import "ckeditor5/ckeditor5.css";
import { ICustomInquiryFromList } from "../../../../pages/left-side/header/Setting/custom-inquiry-from/CustomInquiryFromController";
import { axiosInstance } from "../../../../services/axiosInstance";
import ConfirmationModal from "../../ConfirmationModal";

interface DeleteConfirmation {
    show: boolean;
    itemId: number;
    deleteIndex: number;
    field: ICustomInquiryFromList | null;
}

const PageTextEditModel = ({
    show,
    onHide,
    pageTextFields,
    passDataInAddItem,
    onLocalDataSourceChange,
    isLocalOnly

}: {
    show: boolean;
    onHide: () => void;
    passDataInAddItem: ICustomInquiryFromList | null;
    pageTextFields?: ICustomInquiryFromList[];
    onLocalDataSourceChange?: (fieldName: string, html: string) => void;
    isLocalOnly?: boolean;
}) => {


    const getUUID = localStorage.getItem("UUID");
    const token = localStorage.getItem("token");
    const [selectedField, setSelectedField] = useState<ICustomInquiryFromList | null>(() => {
        if (pageTextFields && pageTextFields.length > 0) {
            return pageTextFields[0];
        }
        if (passDataInAddItem) {
            return passDataInAddItem;
        }
        return null;
    });

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
        if (show && selectedField) {
            if (isLocalOnly) {
                // For local mode → use existing value from selectedField
                const initialValue = selectedField.data_sorce || "";
                setSources(initialValue ? [{ id: Date.now(), data_sorce: initialValue }] : []);
                setEditorData(initialValue);
            } else if (selectedField.data_type === 11) {
                getDatavalues();
            } else if (selectedField.data_type === 12) {
                // For Page URL (data_type 12) in server mode
                getDatavalues();
            }
        }
    }, [show, selectedField, isLocalOnly]);

    const [loading, setLoading] = useState<boolean>(false);
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const isPageUrlType = selectedField?.data_type === 12;
    const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation>({
        show: false,
        itemId: 0,
        deleteIndex: -1,
        field: null,
    });

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

    const cloud = useCKEditorCloud({
        version: "46.0.0",
        premium: true,
    });

    if (cloud.status === "error") {
        toast.error("CKEditor Cloud failed to load. Please Try Again Later.")
        console.error("CKEditor Cloud failed to load:", cloud.error);
        return <div style={{ display: "none" }}>Error loading CKEditor!</div>;
    }

    if (cloud.status === "loading") {
        console.error("CKEditor Loading");
        return <div style={{ display: "none" }}>Loading CKEditor...</div>;
    }

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

    const updateServer = async (
        updatedSources: { id: number; data_sorce: string }[],
        operationType?: "add" | "edit" | "delete",
        itemId?: number
    ) => {
        if (isLocalOnly) return;

        if (!passDataInAddItem?.id) return;
        let requestData;
        if (operationType === "edit" && itemId && itemId > 0) {
            const itemToEdit = updatedSources.find((item) => item.id === itemId);
            if (itemToEdit) {
                requestData = {
                    a_application_login_id: getUUID,
                    custom_field_master_id: passDataInAddItem.id,
                    data_source: itemToEdit.data_sorce,
                    editValue: itemId,
                };
            }
        } else if (operationType === "delete" && itemId && itemId > 0) {
            requestData = {
                a_application_login_id: getUUID,
                custom_field_master_id: passDataInAddItem.id,
                deleteValue: itemId,
            };
        } else {
            const lastValue = updatedSources[updatedSources.length - 1];
            requestData = {
                a_application_login_id: getUUID,
                custom_field_master_id: passDataInAddItem.id,
                data_source: lastValue.data_sorce,
                editValue: lastValue?.id || 0,
            };
        }

        try {
            setLoading(true);
            const response = await axiosInstance.post("createCustomFieldDatavalues", requestData);
            if (response.status !== 200) {
                toast.error(`Failed to ${operationType || "save"} source`);
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

        const isImageURLType = [11, 12].includes(passDataInAddItem?.data_type || 0);
        const finalSource = isImageURLType ? editorData : htmlContent;
        if (finalSource === "") return;

        if (isImageURLType && sources.length >= 1 && editIndex === null) {
            toast.error("Only one Page Text allowed");
            return;
        }

        let updatedSources: { id: number; data_sorce: string }[];

        if (editIndex !== null) {
            if (isLocalOnly && pageTextFields && pageTextFields.length > 0 && selectedField) {
                if (onLocalDataSourceChange) {
                    onLocalDataSourceChange(selectedField.reference_column_name, finalSource);
                    toast.success("Source updated");
                }

                setEditorData("");
                setEditIndex(null);

                setSources([{ id: Date.now(), data_sorce: finalSource }]);
            } else {
                updatedSources = [...sources];
                const currentItem = updatedSources[editIndex];
                updatedSources[editIndex] = { ...currentItem, data_sorce: finalSource };
                setSources(updatedSources);
                setEditIndex(null);
                toast.success("Source updated");
                await updateServer(updatedSources, "edit", currentItem.id);

                if (onLocalDataSourceChange && selectedField) {
                    onLocalDataSourceChange(selectedField.reference_column_name, finalSource);
                }

                setEditorData("");
            }
            return;
        }

        setEditorData("");
        setEditIndex(null);
    };

    const handleChangeInput = (data_sorce: string, index: number) => {
        setEditorData(data_sorce);
        setEditIndex(index);
    };

    // const handleDeleteById = async (field: ICustomInquiryFromList, itemId: number, deleteIndex: number) => {
    //     setEditorData("");
    //     setEditIndex(null);

    //     if (isLocalOnly && selectedField?.id === field.id) {
    //         setSelectedField(pageTextFields && pageTextFields.length > 0 ? pageTextFields[0] : null);
    //     }

    //     if (isLocalOnly && field) {
    //         if (onLocalDataSourceChange) {
    //             onLocalDataSourceChange(field.reference_column_name, " ");
    //         }
    //         setSources([]);
    //         toast.success("Source removed locally");
    //     }
    //     else {
    //         const updatedSources = sources.filter((_, i) => i !== deleteIndex);
    //         setSources(updatedSources);

    //         if (itemId > 0) {
    //             toast.success("Source deleted");
    //             await updateServer(updatedSources, "delete", itemId);
    //         }

    //         if (onLocalDataSourceChange && field) {
    //             onLocalDataSourceChange(field.reference_column_name, " ");
    //         }
    //     }
    // };

    const openDeleteConfirmation = (field: ICustomInquiryFromList, itemId: number, deleteIndex: number) => {
        setDeleteConfirmation({
            show: true,
            itemId,
            deleteIndex,
            field,
        });
    };

    // Actual delete after confirmation
    const confirmDelete = async () => {
        const { itemId, deleteIndex, field } = deleteConfirmation;

        if (!field) return;

        setEditorData("");
        setEditIndex(null);

        if (isLocalOnly) {
            if (onLocalDataSourceChange) {
                onLocalDataSourceChange(field.reference_column_name, " ");
            }
            setSources([]);
            toast.success("Source removed locally");
        } else {
            const updatedSources = sources.filter((_, i) => i !== deleteIndex);
            setSources(updatedSources);

            if (itemId > 0) {
                await updateServer(updatedSources, "delete", itemId);
                toast.success("Source deleted successfully");
            }

            if (onLocalDataSourceChange && field) {
                onLocalDataSourceChange(field.reference_column_name, " ");
            }
        }

        // Close confirmation
        setDeleteConfirmation({ show: false, itemId: 0, deleteIndex: -1, field: null });
    };

    const handleEditField = (field: ICustomInquiryFromList, fieldIndex: number) => {
        setSelectedField(field);
        setEditorData(field.data_sorce || "");
        setEditIndex(0);
    };


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
                            {isPageUrlType ? "Edit Page URL" : "Edit Page Text"}
                            {selectedField && (
                                <span style={{ fontSize: "16px", fontWeight: "normal", marginLeft: "10px" }}>
                                    ({selectedField.title})
                                </span>
                            )}
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
                                        {
                                            isPageUrlType ? (
                                                // Normal input for Page URL (data_type 12)
                                                <input
                                                    type="url"
                                                    className="form-control"
                                                    placeholder="https://example.com/page"
                                                    value={editorData}
                                                    onChange={(e) => setEditorData(e.target.value)}
                                                    style={{ width: "100%", height: "40px", fontSize: "14px" }}
                                                />
                                            ) : (<CKEditor
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
                                            />)
                                        }



                                    </div>
                                    {editIndex !== null && (
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
                                            title="Update Source"
                                        >
                                            {loading ? (
                                                <span style={{ color: "#000" }}>Processing...</span>
                                            ) : (
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    height="24px"
                                                    viewBox="0 -960 960 960"
                                                    width="24px"
                                                    fill="#000"
                                                >
                                                    <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />
                                                </svg>
                                            )}
                                        </div>
                                    )}
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
                                            {isLocalOnly ?
                                                <>
                                                    <thead>
                                                        <tr>
                                                            <th style={{ padding: "10px", textAlign: "left" }}>
                                                                SR. No.
                                                            </th>
                                                            <th style={{ padding: "10px", textAlign: "left" }}>
                                                                Title
                                                            </th>
                                                            <th style={{ padding: "10px", textAlign: "left" }}>
                                                                Data Sources
                                                            </th>
                                                            <th style={{ padding: "10px", textAlign: "center" }}>
                                                                Action
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {pageTextFields && pageTextFields.length > 0 ? (
                                                            pageTextFields.map((field, fieldIndex) => (
                                                                <tr
                                                                    key={field.id || fieldIndex}
                                                                    style={{
                                                                        background: "#fff",
                                                                        borderRadius: "8px",
                                                                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                                                                    }}
                                                                >
                                                                    <td style={{ padding: "10px", textAlign: "left" }}>
                                                                        {field.display_order}
                                                                    </td>
                                                                    <td style={{ padding: "10px", textAlign: "left" }}>
                                                                        {field.title || `Field ${field.id}`}
                                                                    </td>
                                                                    <td style={{ padding: "10px", textAlign: "left" }}>
                                                                        <div
                                                                            style={{ maxWidth: "90%" }}
                                                                            dangerouslySetInnerHTML={{
                                                                                __html: field.data_sorce || "No data"
                                                                            }}
                                                                        />
                                                                    </td>
                                                                    <td style={{ padding: "10px", textAlign: "center", }}>
                                                                        <span
                                                                            style={{
                                                                                cursor: "pointer",
                                                                                marginRight: "10px",
                                                                            }}
                                                                            onClick={() => handleEditField(field, fieldIndex)}
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
                                                                            onClick={() => openDeleteConfirmation(field, field.id || 0, fieldIndex)}
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
                                                            ))
                                                        ) : (
                                                            sources.map((item, index) => (
                                                                <tr
                                                                    key={index}
                                                                    style={{
                                                                        background: "#fff",
                                                                        borderRadius: "8px",
                                                                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                                                                    }}
                                                                >
                                                                    <td style={{ padding: "10px", textAlign: "left" }}>
                                                                        {passDataInAddItem?.title || "N/A"}
                                                                    </td>
                                                                    <td style={{ padding: "10px", textAlign: "left" }}>
                                                                        <div
                                                                            style={{ maxWidth: "90%" }}
                                                                            dangerouslySetInnerHTML={{ __html: item.data_sorce }}
                                                                        />
                                                                    </td>
                                                                    <td style={{ padding: "10px", textAlign: "center" }}>
                                                                        <span
                                                                            style={{
                                                                                cursor: "pointer",
                                                                                marginRight: "10px",

                                                                            }}
                                                                            onClick={() => handleChangeInput(item.data_sorce, index)}
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
                                                                            onClick={() => {
                                                                                if (selectedField) {
                                                                                    handleDeleteById(selectedField, item.id, index);
                                                                                }
                                                                            }}
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
                                                            ))
                                                        )}
                                                    </tbody>
                                                </>
                                                : <>
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
                                                                        onClick={() => handleChangeInput(item.data_sorce, index)}
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
                                                                        onClick={() => {
                                                                            if (selectedField) {
                                                                                openDeleteConfirmation(selectedField, item.id, index);
                                                                            }
                                                                        }}
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
                                                </>}

                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <ConfirmationModal
                show={deleteConfirmation.show}
                onHide={() => setDeleteConfirmation((prev) => ({ ...prev, show: false }))}
                handleSubmit={confirmDelete}
                title="Delete Confirmation"
                message="Are you sure you want to delete this data source?"
                btn1="Cancel"
                btn2="Delete"
            />
        </React.Fragment>
    );
};

export default PageTextEditModel;
