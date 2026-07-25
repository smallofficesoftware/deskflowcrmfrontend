import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { axiosInstance } from "../../../../services/axiosInstance";

interface UploadedFileWithOrder {
    file: File;
    display_order: number;
}

interface ExistingAttachment {
    id: number;
    cart_id: number;
    display_order: number;
    attachment: string;
    a_application_login_id: number;
    company_master_id: number;
    created_date_time: string;
    s_timestemp: string;
    isActive: number;
    isDelete: number;
}

interface ModifiedExistingAttachment extends ExistingAttachment {
    isModified?: boolean;
    isMarkedForDelete?: boolean;
}

const AttachDocumentModel = ({
    show,
    onHide,
    title,
    onSave,
    cartId
}: {
    show: boolean;
    onHide: () => void;
    title: string;
    onSave?: (files: UploadedFileWithOrder[], modifiedExisting?: ModifiedExistingAttachment[]) => void;
    cartId?: string | number | null
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFileWithOrder[]>([]);
    const [existingAttachments, setExistingAttachments] = useState<ModifiedExistingAttachment[]>([]);
    const [isLoadingAttachments, setIsLoadingAttachments] = useState(false);

    // Fetch existing attachments when cartId is available
    useEffect(() => {
        if (cartId && show) {
            fetchExistingAttachments();
        }
    }, [cartId, show]);

    const fetchExistingAttachments = async () => {
        if (!cartId) return;

        try {
            setIsLoadingAttachments(true);
            const result = await axiosInstance.post("getorderattachment", { cart_id: cartId });

            if (result.data.ack === 1 && result.data.data.getAllAttachment) {
                setExistingAttachments(result.data.data.getAllAttachment);
            }
        } catch (error) {
            console.error('Error fetching attachments:', error);
            toast.error('Failed to load existing attachments');
        } finally {
            setIsLoadingAttachments(false);
        }
    };

    // File validation
    const validateFile = (file: File): boolean => {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!allowedTypes.includes(file.type)) {
            toast.error(`Only PNG, JPG, and PDF files are allowed. "${file.name}" is not supported.`);
            return false;
        }

        if (file.size > maxSize) {
            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
            toast.error(`File "${file.name}" is ${fileSizeMB}MB. Maximum allowed size is 10MB.`);
            return false;
        }

        return true;
    };

    // Handle file selection
    const handleFileSelect = (files: FileList | null) => {
        if (!files) return;

        const validFiles: UploadedFileWithOrder[] = [];
        Array.from(files).forEach(file => {
            if (validateFile(file)) {
                validFiles.push({
                    file: file,
                    display_order: uploadedFiles.length + validFiles.length + 1
                });
            }
        });

        if (validFiles.length > 0) {
            setUploadedFiles(prev => [...prev, ...validFiles]);
            toast.success(`${validFiles.length} file(s) added successfully`);
        }
    };

    // Drag and drop handlers
    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        handleFileSelect(files);
    };

    // Paste handler
    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        const files: File[] = [];

        for (let i = 0; i < items.length; i++) {
            if (items[i].kind === 'file') {
                const file = items[i].getAsFile();
                if (file) files.push(file);
            }
        }

        if (files.length > 0) {
            const fileList = new DataTransfer();
            files.forEach(file => fileList.items.add(file));
            handleFileSelect(fileList.files);
        }
    };

    // Click to browse
    const handleBrowseClick = () => {
        fileInputRef.current?.click();
    };

    // Remove uploaded file
    const handleRemoveFile = (index: number) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
        toast.success('File removed');
    };

    // Update display order for new files
    const handleDisplayOrderChange = (index: number, newOrder: string) => {
        const orderValue = parseInt(newOrder) || 0;
        setUploadedFiles(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], display_order: orderValue };
            return updated;
        });
    };

    // Update existing attachment display order
    const handleExistingDisplayOrderChange = (id: number, newOrder: string) => {
        const orderValue = parseInt(newOrder) || 0;
        setExistingAttachments(prev =>
            prev.map(item =>
                item.id === id
                    ? { ...item, display_order: orderValue, isModified: true }
                    : item
            )
        );
    };

    // Mark existing attachment for deletion
    const handleDeleteExistingAttachment = (id: number) => {
        setExistingAttachments(prev =>
            prev.map(item =>
                item.id === id
                    ? { ...item, isMarkedForDelete: true }
                    : item
            )
        );
        toast.success('Attachment marked for deletion');
    };

    // Handle Save Button
    const handleSaveFiles = () => {
        // Get modified existing attachments
        const modifiedExisting = existingAttachments.filter(
            item => item.isModified || item.isMarkedForDelete
        );

        if (uploadedFiles.length === 0 && modifiedExisting.length === 0) {
            toast.warning('No changes to save');
            return;
        }

        if (onSave) {
            onSave(uploadedFiles, modifiedExisting);
            setUploadedFiles([]);
            onHide();
        }
    };

    // Get file extension from attachment path
    const getFileExtension = (filename: string): string => {
        return filename.split('.').pop()?.toLowerCase() || '';
    };

    // Get file icon based on extension
    const getFileIcon = (filename: string) => {
        const ext = getFileExtension(filename);
        if (['jpg', 'jpeg', 'png'].includes(ext)) {
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                </svg>
            );
        } else if (ext === 'pdf') {
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                </svg>
            );
        }
        return (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
            </svg>
        );
    };

    if (!show) return null;

    return (
        <div className="modal1">
            <div
                className="modal-content1"
                style={{ maxHeight: "80vh", width: "80%", overflowY: "auto", padding: "20px" }}
            >
                <span className="close" onClick={onHide}>×</span>
                <h2 className="modal-title1 form_header_text">{title}</h2>

                {/* Existing Attachments Section - Only show if cartId exists */}
                {cartId && (
                    <div style={{ marginBottom: "20px" }}>
                        <h3 style={{ fontSize: "16px", marginBottom: "10px" }}>
                            Existing Attachments:
                        </h3>

                        {isLoadingAttachments ? (
                            <div style={{ textAlign: "center", padding: "20px" }}>
                                <p>Loading attachments...</p>
                            </div>
                        ) : existingAttachments.filter(a => !a.isMarkedForDelete).length > 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                {existingAttachments
                                    .filter(attachment => !attachment.isMarkedForDelete)
                                    .map((attachment) => (
                                        <div
                                            key={attachment.id}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                padding: "10px",
                                                backgroundColor: attachment.isModified ? "#fff3cd" : "#e8f4f8",
                                                borderRadius: "4px",
                                                gap: "10px",
                                                border: `1px solid ${attachment.isModified ? "#ffc107" : "#b3d9e6"}`,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "10px",
                                                    flex: 1,
                                                }}
                                            >
                                                {getFileIcon(attachment.attachment)}

                                                <div style={{ flex: 1 }}>
                                                    <p
                                                        style={{
                                                            margin: 0,
                                                            fontSize: "14px",
                                                            fontWeight: "500",
                                                        }}
                                                    >
                                                        {attachment.attachment.split("/").pop()}
                                                    </p>
                                                    <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>
                                                        Uploaded:{" "}
                                                        {new Date(
                                                            attachment.created_date_time
                                                        ).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>

                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "10px",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "5px",
                                                    }}
                                                >
                                                    <label
                                                        style={{
                                                            fontSize: "12px",
                                                            fontWeight: "500",
                                                            whiteSpace: "nowrap",
                                                        }}
                                                    >
                                                        Display Order:
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={attachment.display_order}
                                                        onChange={(e) => handleExistingDisplayOrderChange(attachment.id, e.target.value)}
                                                        style={{
                                                            width: "60px",
                                                            padding: "5px 8px",
                                                            border: "1px solid #ccc",
                                                            borderRadius: "4px",
                                                            fontSize: "14px",
                                                        }}
                                                    />
                                                </div>

                                                <a
                                                    href={`${attachment.attachment}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        padding: "5px",
                                                        color: "#007bff",
                                                        textDecoration: "none",
                                                    }}
                                                >
                                                    <svg
                                                        width="20"
                                                        height="20"
                                                        viewBox="0 0 24 24"
                                                        fill="currentColor"
                                                    >
                                                        <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
                                                    </svg>
                                                </a>

                                                <button
                                                    onClick={() => handleDeleteExistingAttachment(attachment.id)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        padding: '5px',
                                                        color: '#dc3545'
                                                    }}
                                                    title="Delete attachment"
                                                >
                                                    <svg width="20" height="20" viewBox="0 -960 960 960">
                                                        <path fill="currentColor" d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            <p
                                style={{
                                    color: "#666",
                                    fontSize: "14px",
                                    padding: "10px",
                                    backgroundColor: "#f5f5f5",
                                    borderRadius: "4px",
                                }}
                            >
                                No existing attachments found.
                            </p>
                        )}
                    </div>
                )}

                {/* Drag and Drop Area */}
                <div
                    className="file-upload-area"
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onPaste={handlePaste}
                    onClick={handleBrowseClick}
                    style={{
                        border: `2px dashed ${isDragging ? '#007bff' : '#ccc'}`,
                        borderRadius: '8px',
                        padding: '40px 20px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        backgroundColor: isDragging ? '#f0f8ff' : '#fafafa',
                        marginBottom: '20px',
                        transition: 'all 0.3s ease'
                    }}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".png,.jpg,.jpeg,.pdf"
                        onChange={(e) => handleFileSelect(e.target.files)}
                        style={{ display: 'none' }}
                    />
                    <svg
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        style={{ margin: '0 auto 10px', color: '#666' }}
                    >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <p style={{ margin: '10px 0', fontSize: '16px', color: '#333' }}>
                        <strong>Click to browse</strong> or drag and drop files here
                    </p>
                    <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                        You can also paste files (Ctrl+V)
                    </p>
                    <p style={{ margin: '5px 0', fontSize: '12px', color: '#999' }}>
                        Supported formats: PNG, JPG, PDF (Max 10MB)
                    </p>
                </div>

                {/* Uploaded Files List */}
                {uploadedFiles.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>New Files to Upload:</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {uploadedFiles.map((item, index) => (
                                <div
                                    key={index}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '10px',
                                        backgroundColor: '#f5f5f5',
                                        borderRadius: '4px',
                                        gap: '10px'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                                        </svg>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>
                                                {item.file.name}
                                            </p>
                                            <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                                                {(item.file.size / 1024).toFixed(2)} KB
                                            </p>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <label style={{ fontSize: '12px', fontWeight: '500', whiteSpace: 'nowrap' }}>
                                                Display Order:
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.display_order}
                                                onChange={(e) => handleDisplayOrderChange(index, e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                style={{
                                                    width: '60px',
                                                    padding: '5px 8px',
                                                    border: '1px solid #ccc',
                                                    borderRadius: '4px',
                                                    fontSize: '14px'
                                                }}
                                            />
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveFile(index);
                                            }}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                padding: '5px',
                                                color: '#dc3545'
                                            }}
                                        >
                                            <svg width="20" height="20" viewBox="0 -960 960 960">
                                                <path fill="currentColor" d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Save Button */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '10px',
                    paddingTop: '10px',
                    borderTop: '1px solid #e0e0e0'
                }}>
                    <button
                        onClick={onHide}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSaveFiles}
                        disabled={
                            uploadedFiles.length === 0 &&
                            existingAttachments.filter(a => a.isModified || a.isMarkedForDelete).length === 0
                        }
                        style={{
                            padding: '10px 20px',
                            backgroundColor: (uploadedFiles.length === 0 &&
                                existingAttachments.filter(a => a.isModified || a.isMarkedForDelete).length === 0)
                                ? '#cccccc' : '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: (uploadedFiles.length === 0 &&
                                existingAttachments.filter(a => a.isModified || a.isMarkedForDelete).length === 0)
                                ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AttachDocumentModel;