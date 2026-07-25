import {
  ContentState,
  convertFromHTML,
  DraftHandleValue,
  EditorState,
  RichUtils,
} from "draft-js";
import { stateToHTML } from "draft-js-export-html";
import { stateFromHTML } from "draft-js-import-html";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Editor } from "react-draft-wysiwyg";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import { toast } from "react-toastify";
import { TReactSetState } from "../helpers/AppType";
import { ITaskView } from "../pages/left-side/header/Setting/taskList/TaskListController";
import CreateTaskView from "../pages/right-side/create-task/CreateTaskView";
import useSpeechRecognition from "../pages/voice/Voice";
import {
  axiosInstance,
  axiosInstanceFormData,
} from "../services/axiosInstance";
import ReminderModal from "./model/ReminderModal";

interface ICustomEditorProps {
  fieldName: string;
  text: string;
  onChange: (fieldName: string, html: string) => void;
  onSend: (html: string, crd_flag: string | undefined | null) => void;
  isToggledButton: boolean;
  handleChangeToggleButton: any;
  contactData: any;
  setIsLoadedMessage: any;
  editMsg: string;
  isWhatsAppAuto: boolean;
  handleWhatsAppToggle: (checked: boolean) => void;
  setIsWhatsAppAuto: TReactSetState<boolean>;
  taskFlagtoHideWP?: number;
}

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const createEditorState = (text: string): EditorState => {
  const contentState = stateFromHTML(text);
  return EditorState.createWithContent(contentState);
};

const CustomEditor: React.FC<ICustomEditorProps> = ({
  fieldName,
  text,
  onChange,
  onSend,
  isToggledButton,
  handleChangeToggleButton,
  contactData,
  setIsLoadedMessage,
  editMsg,
  isWhatsAppAuto,
  handleWhatsAppToggle,
  setIsWhatsAppAuto,
  taskFlagtoHideWP,
}) => {
  const { voice, startListening, stopListening, isListening } =
    useSpeechRecognition();

  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskList, setTaskList] = useState<ITaskView[]>([]);
  const [loading, setLoading] = useState(false);

  // New states for image paste/drop preview
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>("");
  const [previewImageFile, setPreviewImageFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // New states for non-image file preview
  const [isFilePreviewOpen, setIsFilePreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);

  const lastVoiceRef = useRef("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    if (editMsg) {
      const blocksFromHTML = convertFromHTML(editMsg);
      const contentState = ContentState.createFromBlockArray(
        blocksFromHTML.contentBlocks,
        blocksFromHTML.entityMap,
      );
      setEditorState(EditorState.createWithContent(contentState));
    } else {
      setEditorState(EditorState.createEmpty());
    }

    return () => {
      setEditorState(EditorState.createEmpty());
    };
  }, [editMsg, contactData?.id]);

  useEffect(() => {
    setIsWhatsAppAuto(false);
  }, [contactData?.id]);

  useEffect(() => {
    setEditorState(createEditorState(text || ""));
  }, [text]);

  const prevVoiceRef = useRef<string | undefined>();

  useLayoutEffect(() => {
    if (prevVoiceRef.current !== voice) {
      setEditorState(createEditorState(voice || ""));
      prevVoiceRef.current = voice;
    }
  }, [voice, setEditorState, createEditorState]);

  // Handle paste event for images and files
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        if (item.kind === "file") {
          e.preventDefault();
          const file = item.getAsFile();

          if (file) {
            if (file.size > MAX_FILE_SIZE_BYTES) {
              toast.error(`File is too large. Max: ${MAX_FILE_SIZE_MB}MB`);
              return;
            }

            // Check if it's an image
            if (file.type.startsWith("image/")) {
              const imageUrl = URL.createObjectURL(file);
              setPreviewImageUrl(imageUrl);
              setPreviewImageFile(file);
              setIsImagePreviewOpen(true);
            } else {
              // For non-image files
              setPreviewFile(file);
              setIsFilePreviewOpen(true);
            }
          }
        }
      }
    };

    const editorElement = wrapperRef.current;
    if (editorElement) {
      editorElement.addEventListener("paste", handlePaste);
      return () => {
        editorElement.removeEventListener("paste", handlePaste);
      };
    }
  }, []);

  // Handle drag and drop for all file types
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      const file = files[0];

      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error(`File is too large. Max: ${MAX_FILE_SIZE_MB}MB`);
        return;
      }

      // Check if it's an image
      if (file.type.startsWith("image/")) {
        const imageUrl = URL.createObjectURL(file);
        setPreviewImageUrl(imageUrl);
        setPreviewImageFile(file);
        setIsImagePreviewOpen(true);
      } else {
        // For non-image files
        setPreviewFile(file);
        setIsFilePreviewOpen(true);
      }
    };

    const editorElement = wrapperRef.current;
    if (editorElement) {
      editorElement.addEventListener("dragover", handleDragOver);
      editorElement.addEventListener("dragleave", handleDragLeave);
      editorElement.addEventListener("drop", handleDrop);

      return () => {
        editorElement.removeEventListener("dragover", handleDragOver);
        editorElement.removeEventListener("dragleave", handleDragLeave);
        editorElement.removeEventListener("drop", handleDrop);
      };
    }
  }, []);

  const onEditorStateChange = (editorState: EditorState) => {
    setEditorState(editorState);
    const html = stateToHTML(editorState.getCurrentContent());
    onChange(fieldName, html);
  };

  const handleSend = (crd_flag = "") => {
    const html = stateToHTML(editorState.getCurrentContent());
    if (html === "<p><br></p>") {
      toast.error("Please enter a message.");
      return;
    }

    if (html.trim()) {
      onSend(html, crd_flag);
    } else {
      console.log("Empty content, not sending.");
    }

    setEditorState(EditorState.createEmpty());
  };

  const handleKeyCommand = (
    command: string,
    editorState: EditorState,
  ): DraftHandleValue => {
    if (command === "stop-enter") {
      return "handled";
    }
    return RichUtils.handleKeyCommand(
      editorState,
      command,
    ) as unknown as DraftHandleValue;
  };

  const handleReturn = (event: React.KeyboardEvent): boolean => {
    if (event.shiftKey) {
      return false;
    }
    handleSend();
    return true;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];

    if (!file) return;

    const validTypes = [
      "image/jpeg",
      "image/png",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/zip",
      "image/svg+xml",
      "video/mp4",
      "video/x-matroska",
      "video/mpeg",
      "text/plain",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/csv",
      "audio/mpeg",
      "audio/ogg",
      "audio/wav",
      "application/xml",
      "text/xml",
      "application/x-zip-compressed",
    ];

    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file format.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(`File is too large. Max: ${MAX_FILE_SIZE_MB}MB`);
      event.target.value = "";
      return;
    }

    // Check if it's an image file - if yes, show image preview modal
    if (file.type.startsWith("image/")) {
      const imageUrl = URL.createObjectURL(file);
      setPreviewImageUrl(imageUrl);
      setPreviewImageFile(file);
      setIsImagePreviewOpen(true);
    } else {
      setPreviewFile(file);
      setIsFilePreviewOpen(true);
    }
  };

  const handleAttachmentConfirm = async () => {
    setIsLoadedMessage(false);
    const token = localStorage.getItem("token");
    const getUUID = localStorage.getItem("UUID");
    const getUserName = localStorage.getItem("USERNAME");

    if (!getUUID || !getUserName) {
      toast.error("Missing user info");
      return;
    }

    try {
      if (selectedFile && taskFlagtoHideWP === 1) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("task_id", contactData?.id);
        formData.append("a_application_login_id", getUUID);
        formData.append("message_type_id", "1");
        formData.append("application_login_name", getUserName);
        formData.append("message_side", `${isToggledButton ? 2 : 1}`);
        formData.append("msg", `${isWhatsAppAuto ? 0 : 1}`);

        const response = await axiosInstanceFormData.post(
          "messageAttachmentsUploadTask",
          formData,
          {
            headers: {
              Authorization: `${token}`,
              "x-tenant-id": getUUID,
            },
          },
        );

        if (response.status === 200) {
          setIsLoadedMessage(true);
          toast.success("Task attachment added successfully.");
        } else {
          toast.error("Failed to upload task attachment.");
        }
      } else if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("contact_masters_id", contactData?.id);
        formData.append("a_application_login_id", getUUID);
        formData.append("message_type_id", "1");
        formData.append("application_login_name", getUserName);
        formData.append("message_side", `${isToggledButton ? 2 : 1}`);
        formData.append("msg", `${isWhatsAppAuto ? 0 : 1}`);

        const response = await axiosInstanceFormData.post(
          "messageAttachmentsUpload",
          formData,
          {
            headers: {
              Authorization: `${token}`,
              "x-tenant-id": getUUID,
            },
          },
        );

        if (response.status === 200) {
          setIsLoadedMessage(true);
          toast.success("Attachment added successfully.");
        } else {
          toast.error("Failed to upload attachment.");
        }
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.message || "Upload failed.");
    } finally {
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Get file icon based on file type
  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="80px"
          viewBox="0 0 24 24"
          width="80px"
          fill="#d32f2f"
        >
          <path d="M0 0h24v24H0z" fill="none" />
          <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z" />
        </svg>
      );
    } else if (fileType.includes("word") || fileType.includes("document")) {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="80px"
          viewBox="0 0 24 24"
          width="80px"
          fill="#2196F3"
        >
          <path d="M0 0h24v24H0z" fill="none" />
          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
        </svg>
      );
    } else if (
      fileType.includes("excel") ||
      fileType.includes("spreadsheet") ||
      fileType.includes("csv")
    ) {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="80px"
          viewBox="0 0 24 24"
          width="80px"
          fill="#4CAF50"
        >
          <path d="M0 0h24v24H0z" fill="none" />
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
        </svg>
      );
    } else if (
      fileType.includes("powerpoint") ||
      fileType.includes("presentation")
    ) {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="80px"
          viewBox="0 0 24 24"
          width="80px"
          fill="#FF5722"
        >
          <path d="M0 0h24v24H0z" fill="none" />
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm6 12H6v-1c0-2 4-3.1 6-3.1s6 1.1 6 3.1v1z" />
        </svg>
      );
    } else if (fileType.includes("video")) {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="80px"
          viewBox="0 0 24 24"
          width="80px"
          fill="#9C27B0"
        >
          <path d="M0 0h24v24H0z" fill="none" />
          <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
        </svg>
      );
    } else if (fileType.includes("audio")) {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="80px"
          viewBox="0 0 24 24"
          width="80px"
          fill="#FF9800"
        >
          <path d="M0 0h24v24H0z" fill="none" />
          <path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z" />
        </svg>
      );
    } else if (fileType.includes("zip") || fileType.includes("compressed")) {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="80px"
          viewBox="0 0 24 24"
          width="80px"
          fill="#607D8B"
        >
          <path d="M0 0h24v24H0z" fill="none" />
          <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-1 8h-3v3h-2v-3h-3v-2h3V9h2v3h3v2z" />
        </svg>
      );
    } else if (fileType.includes("text") || fileType.includes("xml")) {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="80px"
          viewBox="0 0 24 24"
          width="80px"
          fill="#795548"
        >
          <path d="M0 0h24v24H0z" fill="none" />
          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
        </svg>
      );
    } else {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="80px"
          viewBox="0 0 24 24"
          width="80px"
          fill="#757575"
        >
          <path d="M0 0h24v24H0z" fill="none" />
          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
        </svg>
      );
    }
  };
  const handleImagePreviewSend = async () => {
    if (!previewImageFile) return;

    setIsLoadedMessage(false);
    const token = localStorage.getItem("token");
    const getUUID = localStorage.getItem("UUID");
    const getUserName = localStorage.getItem("USERNAME");

    try {
      if (!getUUID || !getUserName) throw new Error("Missing user info");

      const formData = new FormData();
      formData.append("file", previewImageFile);

      if (taskFlagtoHideWP === 1) {
        formData.append("task_id", contactData?.id);
        formData.append("a_application_login_id", getUUID);
        formData.append("message_type_id", "1");
        formData.append("application_login_name", getUserName);
        formData.append("message_side", `${isToggledButton ? 2 : 1}`);
        formData.append("msg", `${isWhatsAppAuto ? 0 : 1}`);

        const response = await axiosInstanceFormData.post(
          "messageAttachmentsUploadTask",
          formData,
          {
            headers: {
              Authorization: `${token}`,
              "x-tenant-id": getUUID,
            },
          },
        );

        if (response.status === 200) {
          setIsLoadedMessage(true);
          toast.success("Image sent successfully.");
        }
      } else {
        formData.append("contact_masters_id", contactData?.id);
        formData.append("a_application_login_id", getUUID);
        formData.append("message_type_id", "1");
        formData.append("application_login_name", getUserName);
        formData.append("message_side", `${isToggledButton ? 2 : 1}`);
        formData.append("msg", `${isWhatsAppAuto ? 0 : 1}`);

        const response = await axiosInstanceFormData.post(
          "messageAttachmentsUpload",
          formData,
          {
            headers: {
              Authorization: `${token}`,
              "x-tenant-id": getUUID,
            },
          },
        );

        if (response.status === 200) {
          setIsLoadedMessage(true);
          toast.success("Image sent successfully.");
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Upload failed.");
    } finally {
      handleCloseImagePreview();
    }
  };

  const handleCloseImagePreview = () => {
    setIsImagePreviewOpen(false);
    URL.revokeObjectURL(previewImageUrl);
    setPreviewImageUrl("");
    setPreviewImageFile(null);
  };

  // Handle non-image file preview send
  const handleFilePreviewSend = async () => {
    if (!previewFile) return;

    setIsLoadedMessage(false);
    const token = localStorage.getItem("token");
    const getUUID = localStorage.getItem("UUID");
    const getUserName = localStorage.getItem("USERNAME");

    try {
      if (!getUUID || !getUserName) throw new Error("Missing user info");

      const formData = new FormData();
      formData.append("file", previewFile);

      if (taskFlagtoHideWP === 1) {
        formData.append("task_id", contactData?.id);
        formData.append("a_application_login_id", getUUID);
        formData.append("message_type_id", "1");
        formData.append("application_login_name", getUserName);
        formData.append("message_side", `${isToggledButton ? 2 : 1}`);
        formData.append("msg", `${isWhatsAppAuto ? 0 : 1}`);

        const response = await axiosInstanceFormData.post(
          "messageAttachmentsUploadTask",
          formData,
          {
            headers: {
              Authorization: `${token}`,
              "x-tenant-id": getUUID,
            },
          },
        );

        if (response.status === 200) {
          setIsLoadedMessage(true);
          toast.success("File sent successfully.");
        }
      } else {
        formData.append("contact_masters_id", contactData?.id);
        formData.append("a_application_login_id", getUUID);
        formData.append("message_type_id", "1");
        formData.append("application_login_name", getUserName);
        formData.append("message_side", `${isToggledButton ? 2 : 1}`);
        formData.append("msg", `${isWhatsAppAuto ? 0 : 1}`);

        const response = await axiosInstanceFormData.post(
          "messageAttachmentsUpload",
          formData,
          {
            headers: {
              Authorization: `${token}`,
              "x-tenant-id": getUUID,
            },
          },
        );

        if (response.status === 200) {
          setIsLoadedMessage(true);
          toast.success("File sent successfully.");
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Upload failed.");
    } finally {
      handleCloseFilePreview();
    }
  };

  const handleCloseFilePreview = () => {
    setIsFilePreviewOpen(false);
    setPreviewFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Clear file input
    }
  };

  const hasMessage = () => {
    const html = stateToHTML(editorState.getCurrentContent());
    return html !== "<p><br></p>" && html.trim().length > 0;
  };

  const getMessageAsRemark = () => {
    const html = stateToHTML(editorState.getCurrentContent());
    return html
      .replace(/<br\s*\/?>/gi, "\n") // preserve line breaks
      .replace(/<[^>]+>/g, "") // remove all tags
      .replace(/&nbsp;/gi, " ") // decode non-breaking space
      .replace(/&amp;/gi, "&") // decode ampersand
      .trim();
  };

  const handleReminderClick = () => {
    if (hasMessage()) {
      setIsReminderModalOpen(true);
    } else {
      toast.error("Please enter a message to set a reminder.");
    }
  };
  const handleTaskClick = () => {
    if (hasMessage()) {
      setIsTaskModalOpen(true);
    } else {
      toast.error("Please enter a message to set a reminder.");
    }
  };

  const handleReminderSubmit = async (data: {
    dateTime: string;
    remark: string;
    status: string;
    selectedCategory: any;
  }) => {
    const getUUID = localStorage.getItem("UUID");
    const getUserName = localStorage.getItem("USERNAME");
    const html = stateToHTML(editorState.getCurrentContent());

    try {
      if (!getUUID || !getUserName) throw new Error("Missing user info");

      const messageData = {
        table: "contact_message_histories",
        data: JSON.stringify({
          contact_masters_id: contactData?.id,
          a_application_login_id: getUUID,
          application_login_name: getUserName,
          description: html,
          message_side: isToggledButton ? 2 : 1,
          message_type_id: 1,
          is_reminder: 1,
          msg: isWhatsAppAuto ? 0 : 1,
        }),
      };

      const messageResponse = await axiosInstance.post(
        "commonCreate",
        messageData,
      );

      const referenceId = messageResponse.data.data.id;

      const reminderData = {
        table: "reminder_messages",
        data: JSON.stringify({
          contact_masters_id: contactData?.id,
          a_application_login_id: getUUID,
          application_login_name: getUserName,
          remark: data.remark,
          reminder_data_time: data.dateTime,
          status: data.status || 0,
          isDelete: 0,
          reference_id: referenceId,
          reference_table: "contact_message_histories",
          assigned_to: data.selectedCategory?.value || getUUID,
          assigned_to_name: data.selectedCategory?.label || getUserName,
        }),
      };

      const response = await axiosInstance.post("commonCreate", reminderData);

      if (response.status === 200) {
        toast.success("Reminder set successfully!");
        setIsReminderModalOpen(false);
        setEditorState(EditorState.createEmpty());
        setIsLoadedMessage?.((prev: boolean) => !prev);
      } else {
        toast.error(
          "Failed to set reminder: " +
          (response.data?.ack_msg || "Unknown error"),
        );
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
        error.message ||
        "Failed to set reminder.",
      );
    }
  };

  useEffect(() => {
    if (!hasMessage() && !editMsg) {
      const newEditorState = EditorState.createEmpty();
      setEditorState(newEditorState);
      onChange(fieldName, "");
    }
    const activeElement = document.activeElement;
    if (
      editorRef.current &&
      !(
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement
      )
    ) {
      editorRef.current.focus();
    }
  }, [contactData?.id, fieldName, onChange, editMsg]);

  return (
    <div
      className="w-100 h-100"
      ref={wrapperRef}
      style={{
        borderRadius: "20px",
        border: isDragging ? "2px dashed #25D366" : "1px solid #ccc",
        backgroundColor: isDragging ? "#f0f9ff" : "#fff",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        padding: "10px",
        position: "relative",
        height: "100%",
        flexDirection: "column",
        justifyContent: "space-between",
        transition: "all 0.3s ease",
      }}
    >
      {isDragging && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(37, 211, 102, 0.1)",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "20px",
            pointerEvents: "none",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="48px"
              viewBox="0 0 24 24"
              width="48px"
              fill="#25D366"
            >
              <path d="M0 0h24v24H0z" fill="none" />
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4c-1.48 0-2.85.43-4.01 1.17l1.46 1.46C10.21 6.23 11.08 6 12 6c3.04 0 5.5 2.46 5.5 5.5v.5H19c1.66 0 3 1.34 3 3 0 1.13-.64 2.11-1.56 2.62l1.45 1.45C23.16 18.16 24 16.68 24 15c0-2.64-2.05-4.78-4.65-4.96zM3 5.27l2.75 2.74C2.56 8.15 0 10.77 0 14c0 3.31 2.69 6 6 6h11.73l2 2L21 20.73 4.27 4 3 5.27zM7.73 10l8 8H6c-2.21 0-4-1.79-4-4s1.79-4 4-4h1.73z" />
            </svg>
            <p
              style={{
                color: "#25D366",
                fontSize: "18px",
                fontWeight: "bold",
                marginTop: "10px",
              }}
            >
              Drop file here
            </p>
          </div>
        </div>
      )}

      <Editor
        editorStyle={{ paddingLeft: "10px" }}
        placeholder="  Enter Your Messages"
        editorState={editorState}
        toolbar={{
          options: ["inline", "list"],
          inline: {
            options: ["bold", "italic", "underline", "strikethrough"],
          },
          list: {
            options: ["unordered", "ordered"],
          },
          textAlign: {
            options: ["left", "center", "right", "justify"],
          },
        }}
        onEditorStateChange={onEditorStateChange}
        handleReturn={handleReturn}
      />

      <div className="bg-light col-12 d-flex ">
        <div className="col-6 d-flex align-items-center">
          <div className="chat-attach">
            <button className="icons Marg" id="chat-popup">
              <div className="form-group1">
                <label htmlFor="input-files">
                  <span data-testid="camera" data-icon="camera" className="">
                    <svg
                      viewBox="0 0 24 24"
                      width="24"
                      height="24"
                      className=""
                    >
                      <path
                        fill="currentColor"
                        d="M1.816 15.556v.002c0 1.502.584 2.912 1.646 3.972s2.472 1.647 3.974 1.647a5.58 5.58 0 0 0 3.972-1.645l9.547-9.548c.769-.768 1.147-1.767 1.058-2.817-.079-.968-.548-1.927-1.319-2.698-1.594-1.592-4.068-1.711-5.517-.262l-7.916 7.915c-.881.881-.792 2.25.214 3.261.959.958 2.423 1.053 3.263.215l5.511-5.512c.28-.28.267-.722.053-.936l-.244-.244c-.191-.191-.567-.349-.957.04l-5.506 5.506c-.18.18-.635.127-.976-.214-.098-.097-.576-.613-.213-.973l7.915-7.917c.818-.817 2.267-.699 3.23.262.5.501.802 1.1.849 1.685.051.573-.156 1.111-.589 1.543l-9.547 9.549a3.97 3.97 0 0 1-2.829 1.171 3.975 3.975 0 0 1-2.83-1.173 3.973 3.973 0 0 1-1.172-2.828c0-1.071.415-2.076 1.172-2.83l7.209-7.211c.157-.157.264-.579.028-.814L11.5 4.36a.572.572 0 0 0-.834.018l-7.205 7.207a5.577 5.577 0 0 0-1.645 3.971z"
                      ></path>
                    </svg>
                  </span>
                </label>
                <input
                  type="file"
                  name="image"
                  id="input-files"
                  className="form-control-file border"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/heic,image/svg+xml,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip,application/x-zip-compressed,video/mp4,video/x-matroska,video/mpeg,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/csv,audio/mpeg,audio/ogg,audio/wav,application/xml,text/xml"
                  onChange={(e) => handleFileChange(e)}
                  style={{ display: "none" }}
                />
              </div>
            </button>
          </div>
          {editMsg ? (
            ""
          ) : (
            <div className="">
              <button
                onClick={handleChangeToggleButton}
                className={`toggle-button ${isToggledButton ? "on" : "off"}`}
              >
                {isToggledButton ? "CL" : "ME"}
              </button>
            </div>
          )}
          {/* {taskFlagtoHideWP !== 1 && (
            <div className="px-2">
              <div className="form-check form-switch">
                <label
                  className="form-check-label px-2"
                  style={{ width: "150px" }}
                >
                  Send Whatsapp
                </label>
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  checked={isWhatsAppAuto}
                  onChange={(e) => handleWhatsAppToggle(e.target.checked)}
                />
              </div>
            </div>
          )} */}
        </div>
        <div className="col-6 d-flex justify-content-end">
          <div className="p-3">
            <button
              className="send_box_icons"
              onClick={handleTaskClick}
              disabled={!hasMessage()}
              style={{
                color: isListening
                  ? "red"
                  : hasMessage()
                    ? "currentColor"
                    : "#ccc",
                transition: "color 0.3s ease",
                cursor: hasMessage() ? "pointer" : "not-allowed",
              }}
              title={hasMessage() ? "Add Task" : "Enter a message to Add Task"}
            >
              <svg
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="currentColor"
              >
                <path d="m438-240 226-226-58-58-169 169-84-84-57 57 142 142ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z" />
              </svg>
            </button>
          </div>
          <div className="p-3">
            <button
              className="send_box_icons"
              onClick={handleReminderClick}
              disabled={!hasMessage()}
              style={{
                color: isListening
                  ? "red"
                  : hasMessage()
                    ? "currentColor"
                    : "#ccc",
                transition: "color 0.3s ease",
                cursor: hasMessage() ? "pointer" : "not-allowed",
              }}
              title={
                hasMessage()
                  ? "Set Reminder"
                  : "Enter a message to set a reminder"
              }
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="currentColor"
              >
                <path d="m612-292 56-56-148-148v-184h-80v216l172 172ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-400Zm0 320q133 0 226.5-93.5T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160Z" />
              </svg>
            </button>
          </div>
          <div className="p-3">
            <button
              className="send_box_icons"
              onClick={isListening ? stopListening : startListening}
              style={{
                color: isListening ? "red" : "",
                transition: "color 0.3s ease",
              }}
              title={isListening ? "Stop Listening" : "Start Listening"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="currentColor"
              >
                <path d="M480-400q-50 0-85-35t-35-85v-240q0-50 35-85t85-35q50 0 85 35t35 85v240q0 50-35 85t-85 35Zm0-240Zm-40 520v-123q-104-14-172-93t-68-184h80q0 83 58.5 141.5T480-320q83 0 141.5-58.5T680-520h80q0 105-68 184t-172 93v123h-80Zm40-360q17 0 28.5-11.5T520-520v-240q0-17-11.5-28.5T480-800q-17 0-28.5 11.5T440-760v240q0 17 11.5 28.5T480-480Z" />
              </svg>
            </button>
            {isListening && (
              <div className="text-sm text-red-500 mt-1">Listening...</div>
            )}
          </div>
          <button className="send_box_icons" onClick={() => handleSend("")}>
            <span className="">
              <svg
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="currentColor"
              >
                <path d="M120-160v-640l760 320-760 320Zm80-120 474-200-474-200v140l240 60-240 60v140Zm0 0v-400 400Z" />
              </svg>
            </span>
          </button>
        </div>
        <div className="col-6 d-flex justify-content-end">
          <div className="p-3">
            <button
              className="send_box_icons"
              onClick={handleTaskClick}
              disabled={!hasMessage()}
              style={{
                color: isListening
                  ? "red"
                  : hasMessage()
                    ? "currentColor"
                    : "#ccc",
                transition: "color 0.3s ease",
                cursor: hasMessage() ? "pointer" : "not-allowed",
              }}
              title={hasMessage() ? "Add Task" : "Enter a message to Add Task"}
            >
              <svg
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="currentColor"
              >
                <path d="m438-240 226-226-58-58-169 169-84-84-57 57 142 142ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z" />
              </svg>
            </button>
          </div>
          <div className="p-3">
            <button
              className="send_box_icons"
              onClick={handleReminderClick}
              disabled={!hasMessage()}
              style={{
                color: isListening
                  ? "red"
                  : hasMessage()
                    ? "currentColor"
                    : "#ccc",
                transition: "color 0.3s ease",
                cursor: hasMessage() ? "pointer" : "not-allowed",
              }}
              title={
                hasMessage()
                  ? "Set Reminder"
                  : "Enter a message to set a reminder"
              }
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="currentColor"
              >
                <path d="m612-292 56-56-148-148v-184h-80v216l172 172ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-400Zm0 320q133 0 226.5-93.5T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160Z" />
              </svg>
            </button>
          </div>
          <div className="p-3">
            <button
              className="send_box_icons"
              onClick={isListening ? stopListening : startListening}
              style={{
                color: isListening ? "red" : "",
                transition: "color 0.3s ease",
              }}
              title={isListening ? "Stop Listening" : "Start Listening"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="currentColor"
              >
                <path d="M480-400q-50 0-85-35t-35-85v-240q0-50 35-85t85-35q50 0 85 35t35 85v240q0 50-35 85t-85 35Zm0-240Zm-40 520v-123q-104-14-172-93t-68-184h80q0 83 58.5 141.5T480-320q83 0 141.5-58.5T680-520h80q0 105-68 184t-172 93v123h-80Zm40-360q17 0 28.5-11.5T520-520v-240q0-17-11.5-28.5T480-800q-17 0-28.5 11.5T440-760v240q0 17 11.5 28.5T480-480Z" />
              </svg>
            </button>
            {isListening && (
              <div className="text-sm text-red-500 mt-1">Listening...</div>
            )}
          </div>
          <button className="send_box_icons" onClick={() => handleSend("")}>
            <span className="">
              <svg
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="currentColor"
              >
                <path d="M120-160v-640l760 320-760 320Zm80-120 474-200-474-200v140l240 60-240 60v140Zm0 0v-400 400Z" />
              </svg>
            </span>
          </button>
        </div>
      </div>

      {/* Non-Image File Preview Modal */}
      {isFilePreviewOpen && previewFile && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleFilePreviewSend();
            } else if (e.key === "Escape") {
              handleCloseFilePreview();
            }
          }}
          tabIndex={0}
        >
          <div
            style={{
              position: "relative",
              maxWidth: "90%",
              maxHeight: "80%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* Close Button */}
            <button
              onClick={handleCloseFilePreview}
              style={{
                position: "absolute",
                top: "-40px",
                right: "0",
                background: "transparent",
                border: "none",
                color: "white",
                fontSize: "30px",
                cursor: "pointer",
                zIndex: 10000,
              }}
              title="Close"
            >
              ×
            </button>

            {/* File Icon and Details */}
            <div
              style={{
                backgroundColor: "white",
                padding: "40px",
                borderRadius: "15px",
                textAlign: "center",
                minWidth: "400px",
                boxShadow: "0 4px 30px rgba(0, 0, 0, 0.5)",
              }}
            >
              {getFileIcon(previewFile.type)}
              <h3
                style={{
                  marginTop: "20px",
                  marginBottom: "10px",
                  color: "#333",
                  wordBreak: "break-word",
                }}
              >
                {previewFile.name}
              </h3>
              <p style={{ color: "#666", fontSize: "14px" }}>
                Size: {(previewFile.size / 1024).toFixed(2)} KB
              </p>
            </div>

            {/* Send Button */}
            <div
              className="modal-buttons"
              style={{ marginTop: "20px", display: "flex", gap: "10px" }}
            >
              <button
                className="modal-button1"
                onClick={handleCloseFilePreview}
              >
                Cancel
              </button>
              <button onClick={handleFilePreviewSend} className="modal-button2">
                <span>Send</span>
                <svg
                  height="20px"
                  viewBox="0 -960 960 960"
                  width="20px"
                  fill="currentColor"
                >
                  <path d="M120-160v-640l760 320-760 320Zm80-120 474-200-474-200v140l240 60-240 60v140Zm0 0v-400 400Z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {isImagePreviewOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleImagePreviewSend();
            } else if (e.key === "Escape") {
              handleCloseImagePreview();
            }
          }}
          tabIndex={0}
        >
          <div
            style={{
              position: "relative",
              maxWidth: "90%",
              maxHeight: "80%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* Close Button */}
            <button
              onClick={handleCloseImagePreview}
              style={{
                position: "absolute",
                top: "-40px",
                right: "0",
                background: "transparent",
                border: "none",
                color: "white",
                fontSize: "30px",
                cursor: "pointer",
                zIndex: 10000,
              }}
              title="Close"
            >
              ×
            </button>

            {/* Image Preview */}
            <img
              src={previewImageUrl}
              alt="Preview"
              style={{
                maxWidth: "100%",
                maxHeight: "70vh",
                objectFit: "contain",
                borderRadius: "8px",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
              }}
            />

            {/* Send Button */}
            <div
              className="modal-buttons"
              style={{ marginTop: "20px", display: "flex", gap: "10px" }}
            >
              <button
                className="modal-button1"
                onClick={handleCloseImagePreview}
              >
                Cancel
              </button>
              <button
                className="modal-button2"
                onClick={handleImagePreviewSend}
              >
                <span>Send</span>
                <svg
                  height="20px"
                  viewBox="0 -960 960 960"
                  width="20px"
                  fill="currentColor"
                >
                  <path d="M120-160v-640l760 320-760 320Zm80-120 474-200-474-200v140l240 60-240 60v140Zm0 0v-400 400Z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      {isReminderModalOpen && (
        <ReminderModal
          show={isReminderModalOpen}
          onHide={() => setIsReminderModalOpen(false)}
          handleSubmit={handleReminderSubmit}
          title={"Set Reminder"}
          message={"Set a reminder for this message?"}
          remarkMsg={getMessageAsRemark()}
          btn1="CANCEL"
          btn2="Set Reminder"
          request_flag={""}
        />
      )}
      {isTaskModalOpen && (
        <CreateTaskView
          show={isTaskModalOpen}
          onHide={() => setIsTaskModalOpen(false)}
          setTargetVsIncentiveList={setTaskList}
          setLoading={setLoading}
          headerName="Create Task"
          productToEdit={undefined}
          messageDescription={getMessageAsRemark()}
          contactId={contactData?.id}
          referenceTable={"contact_message_histories"}
          supportTicketFlag={0}
          setIsLoadedMessage={setIsLoadedMessage}
        />
      )}
    </div>
  );
};

export default CustomEditor;
