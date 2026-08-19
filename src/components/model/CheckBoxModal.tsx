import React, { useEffect, useState } from "react";
import "./ConfirmationModal.css";
interface ICheckBoxModalProps {
  show: boolean;
  onHide: () => void;
  handleSubmit: (
    contactId: number | undefined,
    checkedOptions: any[],
    isOverrideExistingContactCheckbox?: boolean,
  ) => void;
  title: string;
  message?: string;
  btn1: string;
  btn2: string;
  options: any[];
  selectedLabelIds?: any;
  contactId: number | undefined;
  getOptionColor?: (option: any) => string;
  getOptionName: (option: any) => string;
  showColorBadge: boolean;
  setRefreshLable?: (value: boolean | number) => void;
  hideSmallInfoMessageInCheck?: boolean;
  smallInfoMessage?: any;
  isContactAssigedTeamMemberBirfercationShow?: boolean;
}
interface InfoMessageProps {
  text?: string;
}

export const InfoMessage: React.FC<InfoMessageProps> = ({ text = "" }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      color: "gray",
      fontSize: "0.875rem",
    }}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="20px"
      viewBox="0 -960 960 960"
      width="20px"
      fill="gray"
    >
      <path d="M444-288h72v-240h-72v240Zm35.79-312q15.21 0 25.71-10.29t10.5-25.5q0-15.21-10.29-25.71t-25.5-10.5q-15.21 0-25.71 10.29t-10.5 25.5q0 15.21 10.29 25.71t25.5 10.5Zm.49 504Q401-96 331-126t-122.5-82.5Q156-261 126-330.96t-30-149.5Q96-560 126-629.5q30-69.5 82.5-122T330.96-834q69.96-30 149.5-30t149.04 30q69.5 30 122 82.5T834-629.28q30 69.73 30 149Q864-401 834-331t-82.5 122.5Q699-156 629.28-126q-69.73 30-149 30Zm-.28-72q130 0 221-91t91-221q0-130-91-221t-221-91q-130 0-221 91t-91 221q0 130 91 221t221 91Zm0-312Z" />
    </svg>
    <span style={{ marginLeft: "0.25rem" }}>{text}</span>
  </span>
);

const CheckBoxModal: React.FC<ICheckBoxModalProps> = ({
  show,
  onHide,
  handleSubmit,
  title,
  message,
  btn1,
  btn2,
  options,
  selectedLabelIds,
  contactId,
  getOptionColor,
  getOptionName,
  showColorBadge,
  setRefreshLable,
  hideSmallInfoMessageInCheck,
  smallInfoMessage,
  isContactAssigedTeamMemberBirfercationShow,
}) => {
  const [checkedOptions, setCheckedOptions] = useState<any[] | undefined>([]);
  const [
    isNotOverrideExistingContactCheckbox,
    setIsNotOverrideExistingContactCheckbox,
  ] = useState(true);

  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchText.length >= 3) {
        setDebouncedSearch(searchText.toLowerCase());
      } else {
        setDebouncedSearch("");
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    const parsedLabelIds = selectedLabelIds
      ? typeof selectedLabelIds === "string"
        ? selectedLabelIds.split(",").map(Number).filter(Boolean)
        : Array.isArray(selectedLabelIds)
          ? selectedLabelIds.map(Number)
          : [Number(selectedLabelIds)]
      : [];
    setCheckedOptions(parsedLabelIds);
  }, [selectedLabelIds, contactId]);

  const handleCheckboxChange = (optionId: any) => {
    setCheckedOptions((prev) =>
      prev?.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...(prev || []), optionId],
    );
  };

  const handleExistingAssigenTeamMemberCheckboxChange = () => {
    setIsNotOverrideExistingContactCheckbox(
      !isNotOverrideExistingContactCheckbox,
    );
  };

  const onSubmit = () => {
    if (checkedOptions)
      handleSubmit(
        contactId,
        checkedOptions,
        isNotOverrideExistingContactCheckbox,
      );
    setRefreshLable && setRefreshLable(true);
  };

  const filteredOptions =
    debouncedSearch.length >= 3
      ? options.filter((opt) =>
        getOptionName(opt)
          ?.toLowerCase()
          .includes(debouncedSearch)
      )
      : options;

  return show ? (
    <>
      <style>
        {`
    .search-wrapper {
  position: relative;
  width: 100%;
  margin-bottom: 10px;
}

.search-input-clean {
  width: 100%;
  padding: 12px 36px 12px 14px; /* right padding for cross */
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  font-size: 14px;
  background-color: #f9fafb;
  outline: none;
  transition: all 0.25s ease;
}

.search-input-clean:focus {
  border-color: #f97316;
  background-color: #fff;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.15);
}

.clear-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  font-size: 14px;
  color: #9ca3af;
}

.clear-icon:hover {
  color: #111827;
}
    `}
      </style>

      <div className="modal-overlay" style={{zIndex: 1111}}>
        <div className="modal-content_label">
          <h2 className="modal-title1 form_header_text">{title}</h2>
          <div className="search-wrapper">
            <input
              type="text"
              placeholder="Search Labels..."
              className="search-input-clean pr-4"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />

            {searchText && (
              <span
                className="clear-icon"
                onClick={() => {
                  setSearchText("");
                  setDebouncedSearch("");
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368">
                  <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                </svg>
              </span>
            )}
          </div>
          <div className="overflow-auto " style={{ maxHeight: "500px" }}>
            <table className="table table-hover" border={0}>
              <tbody className="text-center">
                {filteredOptions.map((option) => (
                  <tr
                    key={option.id}
                    className="text-left"
                    style={{
                      border: "1px solid white",
                      borderCollapse: "collapse",
                      height: "10px",
                      cursor: "pointer",
                    }}
                    onClick={() => handleCheckboxChange(option.id)}
                  >
                    <td className="text-start">
                      <label htmlFor={`checkbox-${option.id}`}>
                        {showColorBadge ? (
                          <span
                            style={{
                              backgroundColor: getOptionColor
                                ? getOptionColor(option)
                                : "",
                            }}
                            className="badge rounded-pill"
                          >
                            {getOptionName(option)}
                          </span>
                        ) : (
                          <span>{getOptionName(option)}</span> // Just the label text without badge
                        )}
                      </label>
                    </td>
                    <td className="text-end">
                      <label htmlFor={`checkbox-${option.id}`}>
                        <input
                          className="custom-checkbox"
                          type="checkbox"
                          id={`checkbox-${option.id}`}
                          checked={checkedOptions?.includes(option.id)}
                          onChange={() => handleCheckboxChange(option.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="d-flex align-items-center">
            {hideSmallInfoMessageInCheck && checkedOptions!.length === 0 && (
              <InfoMessage text={smallInfoMessage} />
            )}
          </div>
          {isContactAssigedTeamMemberBirfercationShow && (
            <div className="d-flex align-items-center">
              <input
                type="checkbox"
                style={{ margin: "0 5px 0 0" }}
                checked={isNotOverrideExistingContactCheckbox}
                onChange={handleExistingAssigenTeamMemberCheckboxChange}
              />{" "}
              <span
                style={{ cursor: "pointer" }}
                onClick={handleExistingAssigenTeamMemberCheckboxChange}
              >
                Existing assigned team person will not be overridden.
              </span>
            </div>
          )}
          <div className="modal-buttons">
            <button className="modal-button1" onClick={onHide}>
              {btn1}
            </button>
            <button
              className="modal-button2"
              onClick={onSubmit}
              style={{ color: "white" }}
            >
              {btn2}
            </button>
          </div>
        </div>
      </div>
    </>
  ) : null;
};

export default CheckBoxModal;
