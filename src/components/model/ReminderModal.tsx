import React, { useEffect, useRef, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import DatePicker, { DateObject } from "react-multi-date-picker";
import TimePicker from "react-multi-date-picker/plugins/time_picker";
import { SingleValue } from "react-select";
import { toast } from "react-toastify";
import {
  BIG1_TEXT_LENGTH,
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../helpers/AppConstants";
import { IOption } from "../../helpers/AppInterface";
import { axiosInstance } from "../../services/axiosInstance";
import CustomSearchDropdown from "../CustomSearchDropdown";
import { useTheme } from "../ThemeContext";

const parseFormattedDateTime = (str: string): Date | null => {
  if (!str) return null;
  const match = str.match(
    /^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/,
  );
  if (match) {
    const [_, day, month, year, hours, minutes, seconds = "0"] = match;
    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hours),
      Number(minutes),
      Number(seconds),
    );
    if (!isNaN(date.getTime())) return date;
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return parsed;
  return null;
};

const ReminderModal = ({
  show,
  onHide,
  handleSubmit,
  title,
  message,
  btn1 = "yes",
  btn2 = "no",
  remarkMsg,
  selectedMember,
  selectedMemberId,
  ContactMessageId,
  request_flag,
  isFromChatModule,
  dateTimeMsg,
}: {
  show: boolean;
  onHide: () => void;
  handleSubmit: (data: {
    dateTime: string;
    remark: string;
    status: string;
    selectedCategory: any;
  }) => void;
  title: string;
  message?: string;
  btn1: string;
  btn2: string;
  remarkMsg?: string;
  ContactMessageId?: number;
  selectedMember?: string;
  selectedMemberId?: number;
  request_flag: string;
  isFromChatModule?: boolean;
  dateTimeMsg?: string;
}) => {
  const { darkMode } = useTheme();
  const modalThemeClass = darkMode ? "modal-light-1" : "modal-light-1";
  const getUUID = localStorage.getItem("UUID");
  const modalThemeClass1 = darkMode ? "modal-dark" : "modal-light-1";
  const [dateTime, setDateTime] = useState<any>("");
  const [isOpen, setIsOpen] = useState(false);
  const [remark, setRemark] = useState<string>(remarkMsg || "");
  const [status, setStatus] = useState<string>("");
  const [selectedCategory, setSelectedCategory] =
    useState<SingleValue<IOption> | null>(null);
  const [categoryList, setCategoryList] = useState<any>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const datePickerRef = useRef<any>(null);
  // const [dateTimeOnChange, setDateTimeOnChange] = useState<any>("");
  const saveInProgressRef = useRef(false);
  const [isTimeSelected, setIsTimeSelected] = useState(false);
  useEffect(() => {
    if (show) {
      if (dateTimeMsg) {
        const parsed = parseFormattedDateTime(dateTimeMsg);
        if (parsed) {
          setDateTime(parsed);
          setIsTimeSelected(true);
          return;
        }
      }
      const getIndianDateTimeWithOffset = (): any => {
        const now = new Date();
        const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
        const istTime = new Date(utcTime + 5.5 * 60 * 60000);
        istTime.setMinutes(istTime.getMinutes() + 5);
        return istTime;
      };

      setDateTime(getIndianDateTimeWithOffset());
    }
  }, [show, dateTimeMsg]);

  // Handle Date + Time Change
  const handleDateTimeChange = (date: any) => {
    if (date) {
      setDateTime(date);

      // Check if time is selected (hour & minute exist)
      if (date.hour !== undefined && date.minute !== undefined) {
        setIsTimeSelected(true);
      }
    }
  };

  // Force focus on time picker when date is selected
  const handleDateSelect = () => {
    setTimeout(() => {
      const timeInput = document.querySelector(
        ".rmdp-time-picker input",
      ) as HTMLInputElement;
      if (timeInput) {
        timeInput.focus();
        timeInput.select(); // Optional: select existing time for easy editing
      }
    }, 150);
  };

  const CloseButton = () => (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        padding: "8px 12px",
        borderBottom: "1px solid #ddd",
        background: "#f8f9fa",
      }}
    >
      <span
        onClick={() => datePickerRef.current?.closeCalendar()}
        style={{
          cursor: "pointer",
          fontSize: "22px",
          fontWeight: "bold",
          color: "#dc3545",
        }}
        title="Close"
      >
        ×
      </span>
    </div>
  );

  const fetchAllCompanyApi = async () => {
    const token = await localStorage.getItem("token");
    const getUUID = await localStorage.getItem("UUID");

    const requestData = {
      a_application_login_id: getUUID,
    };
    try {
      const data = await axiosInstance.post("my-team", requestData, {
        headers: {
          Authorization: `${token}`,
        },
      });
      if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        setCategoryList([]);
      }
      setCategoryList(data.data.data.item);
    } catch (error: any) {
      toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  };

  const fetchConactMessageApiForRemark = async () => {
    const requestData = {
      table: "contact_message_histories",
      columns: "id,description",
      where: `{"id": "${ContactMessageId}"}`,
    };

    try {
      const response = await axiosInstance.post("commonGet", requestData);

      const data = response.data.data[0] || {};
      let htmlRemark = data.description || "";
      // Step 1: Replace <br> with newlines (before stripping tags)
      htmlRemark = htmlRemark.replace(/<br\s*\/?>/gi, "\n");

      // Step 2: Strip all HTML tags
      let plainText = htmlRemark.replace(/<[^>]+>/g, "");

      // Step 3: Decode common HTML entities
      plainText = plainText
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&rsquo;/gi, "’") // common curly quote
        .replace(/&lsquo;/gi, "‘")
        .replace(/&hellip;/gi, "…"); // etc.

      setRemark(plainText.trim());
    } catch (error) {
      console.error("Error fetching contact message:", error);
      setRemark(""); // Clear in case of error
    }
  };

  const fetchTaskMessageApiForRemark = async () => {
    const requestData = {
      table: "task_message_histories",
      columns: "id,description",
      where: `{"id": "${ContactMessageId}"}`,
    };
    console.log(requestData.where);

    try {
      const response = await axiosInstance.post("commonGet", requestData);
      console.log(response);

      const data = response.data.data[0] || {};
      let htmlRemark = data.description || "";

      // Step 1: Replace <br> with newlines (before stripping tags)
      htmlRemark = htmlRemark.replace(/<br\s*\/?>/gi, "\n");

      // Step 2: Strip all HTML tags
      let plainText = htmlRemark.replace(/<[^>]+>/g, "");

      // Step 3: Decode common HTML entities
      plainText = plainText
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&rsquo;/gi, "’") // common curly quote
        .replace(/&lsquo;/gi, "‘")
        .replace(/&hellip;/gi, "…"); // etc.

      setRemark(plainText.trim());
    } catch (error) {
      console.error("Error fetching contact message:", error);
      setRemark(""); // Clear in case of error
    }
  };

  useEffect(() => {
    if (show) fetchAllCompanyApi();
    if (show && request_flag === "2") {
      fetchConactMessageApiForRemark();
    } else if (show && request_flag === "3") {
      fetchTaskMessageApiForRemark();
    }
  }, [show]);

  const handleRemarkChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setRemark(event.target.value);
  };

  const handleStatusChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStatus(event.target.value);
  };

  const categoryOptions = categoryList.map((category: any) => ({
    value: category.id,
    label: category.username,
  }));
  const defaultCategory = categoryOptions.find(
    (option: { value: number }) =>
      option.value === Number(selectedMemberId || getUUID),
  );

  useEffect(() => {
    if (show) {
      fetchAllCompanyApi();
      if (selectedMemberId) {
        setSelectedCategory({
          value: selectedMemberId,
          label: selectedMember || "",
        });
      }
    }
    if (show && request_flag === "2") {
      fetchConactMessageApiForRemark();
    } else if (show && request_flag === "3") {
      fetchTaskMessageApiForRemark();
    }
  }, [show, selectedMemberId, selectedMember]);
  const handleSave = async () => {
    if (isLoading) return;

    if (saveInProgressRef.current) return;

    saveInProgressRef.current = true;
    setIsLoading(true);

    try {
      if (!dateTime) {
        toast.error("Please select date and time.");
        return;
      }

      const selectedDateTime = dateTime?.toDate?.() || new Date(dateTime);

      if (isNaN(selectedDateTime.getTime())) {
        toast.error("Please select a valid date and time.");
        return;
      }

      const now = new Date();
      const selectedTimeMin = new Date(selectedDateTime).setSeconds(0, 0);
      const nowTimeMin = new Date(now).setSeconds(0, 0);

      let isDateTimeChanged = true;
      if (dateTimeMsg) {
        const originalDateTime = parseFormattedDateTime(dateTimeMsg);
        if (originalDateTime) {
          const originalTimeMin = new Date(originalDateTime).setSeconds(0, 0);
          if (selectedTimeMin === originalTimeMin) {
            isDateTimeChanged = false;
          }
        }
      }

      if (isDateTimeChanged && selectedTimeMin < nowTimeMin) {
        toast.error("Please select a future date and time.");
        return;
      }

      if (!remark.trim()) {
        toast.error("Please enter a remark.");
        return;
      }

      let formattedDateTime = "";
      if (dateTime instanceof DateObject) {
        formattedDateTime = dateTime.format("YYYY-MM-DDTHH:mm");
      } else if (dateTime instanceof Date) {
        const year = dateTime.getFullYear();
        const month = String(dateTime.getMonth() + 1).padStart(2, "0");
        const date = String(dateTime.getDate()).padStart(2, "0");
        const hours = String(dateTime.getHours()).padStart(2, "0");
        const minutes = String(dateTime.getMinutes()).padStart(2, "0");
        formattedDateTime = `${year}-${month}-${date}T${hours}:${minutes}`;
      } else {
        const parsedDate = new Date(dateTime);
        if (!isNaN(parsedDate.getTime())) {
          const year = parsedDate.getFullYear();
          const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
          const date = String(parsedDate.getDate()).padStart(2, "0");
          const hours = String(parsedDate.getHours()).padStart(2, "0");
          const minutes = String(parsedDate.getMinutes()).padStart(2, "0");
          formattedDateTime = `${year}-${month}-${date}T${hours}:${minutes}`;
        }
      }

      const formattedRemark = remark
        .split("\n")
        .map((line) => line.trim())
        .join("<br>");

      const data = {
        dateTime: formattedDateTime,
        remark: formattedRemark,
        status,
        selectedCategory: selectedCategory || defaultCategory,
      };

      await handleSubmit(data);

      // Success hone ke baad modal close kar sakte ho
      // onHide();
    } catch (error) {
      toast.error(MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
      setIsLoading(false);
      saveInProgressRef.current = false;
    }
  };

  const handleCategoryChange = (
    selectedOption: SingleValue<IOption> | null,
  ) => {
    setSelectedCategory(selectedOption);
  };

  const now = new Date();
  const minDateTime = now.toISOString().slice(0, 16);

  // Render HTML content
  const renderHTMLContent = (html: string) => {
    return (
      <div
        dangerouslySetInnerHTML={{ __html: html }}
        className="rendered-html-content"
      />
    );
  };

  return (
    <React.Fragment>
      <Modal
        show={show}
        onHide={onHide}
        centered
        backdrop="static"
        className={modalThemeClass1}
      >
        <div className={`p-10 m-title ${modalThemeClass}`}>{title}</div>
        <Modal.Body className={`${modalThemeClass}`}>
          {message ? (
            <div className={`m-title-2 col-12 ${modalThemeClass}`}>
              {!isFromChatModule && (
                <div className="col-12 mt-1">
                  <label
                    className="form-check-label"
                    htmlFor="flexCheckDefault"
                  >
                    <h4>
                      Assign to Team Member
                      <span className="text-danger">*</span>
                    </h4>
                  </label>
                  <div className="">
                    <div className="add-source-of-type-section">
                      <CustomSearchDropdown
                        options={categoryOptions}
                        value={selectedCategory}
                        onChange={handleCategoryChange}
                        className="w-100"
                        defaultValue={defaultCategory}
                      />
                    </div>
                  </div>
                </div>
              )}
              <label>
                Select date and time <span className="text-danger">*</span>
              </label>
              <DatePicker
                ref={datePickerRef}
                value={dateTime}
                onChange={handleDateTimeChange}
                format="DD-MM-YYYY HH:mm"
                minDate={new Date().setHours(0, 0, 0, 0)}
                plugins={[
                  <CloseButton position="top" />,
                  <TimePicker position="right" hideSeconds />,
                ]}
                containerStyle={{ width: "100%" }}
                onOpen={handleDateSelect} // ← Improved
                // onChange={handleDateTimeChange}     // Ensure it's called
                calendarPosition="bottom-center"
              />

              {/* {dateTime && (
                <small className="text-muted">
                  Selected: {dateTime.format ? dateTime.format("DD-MM-YYYY HH:mm") : ""}
                </small>
              )} */}
              <br />
              <br />
              <label className="col-12">
                Remark<span className="text-danger">*</span>
                <textarea
                  rows={4}
                  cols={30}
                  value={remark}
                  maxLength={BIG1_TEXT_LENGTH}
                  onChange={handleRemarkChange}
                  className="form-control font-size-15 rounded-1"
                  placeholder="Enter remark"
                  spellCheck="false"

                  //  dangerouslySetInnerHTML={{ __html: remark }}
                />
              </label>
              {/* dangerouslySetInnerHTML={{ __html: remark }} */}
            </div>
          ) : (
            <span></span>
          )}
          <div className="d-flex justify-content-end m-btn modal-buttons">
            <Button
              className="modal-button1"
              onClick={onHide}
              disabled={isLoading}
            >
              {btn1}
            </Button>
            <Button
              className="px-4 ms-2 btn2"
              onClick={handleSave}
              disabled={isLoading}
              style={{ color: "white" }}
            >
              {isLoading ? "Saving..." : btn2}
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </React.Fragment>
  );
};

export default ReminderModal;
