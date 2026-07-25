import React, { useEffect, useState } from "react";
import "./ConfirmationModal.css";

interface IRadioButtonModalProps {
  show: boolean;
  onHide: () => void;
  handleSubmit: (selectedOption: any) => void;
  title: string;
  message: string;
  btn1: string;
  btn2: string;
  options: any[];
  selectedLabelIds?: any;
  contactId: number | undefined;
  getOptionColor?: (option: any) => string;
  getOptionName: (option: any) => string;
  showColorBadge: boolean;
  setRefreshStatus?: (value: boolean | number) => void;
  displayClearButton?: boolean

}

const RadioButtonModal: React.FC<IRadioButtonModalProps> = ({
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
  setRefreshStatus,
  displayClearButton = true
}) => {
  const [selectedOption, setSelectedOption] = useState<number | undefined>();
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchText.length >= 3) {
        setDebouncedSearch(searchText.toLowerCase());
      } else {
        setDebouncedSearch("");
      }
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    const parsedLabelId = selectedLabelIds
      ? Number(selectedLabelIds)
      : undefined;
    setSelectedOption(parsedLabelId); // Set the single value directly
  }, [selectedLabelIds, contactId]);
  const handleRadioChange = (optionId: any) => {
    setSelectedOption(optionId); // Set only one option as selected
  };
  const handleClearSelection = () => { setSelectedOption(undefined); setRefreshStatus && setRefreshStatus(true); };
  const onSubmit = () => {
    handleSubmit(selectedOption);
    setRefreshStatus && setRefreshStatus(true)
  };
  const getDisplayOrderRange = () => {
    // if (selectedOption) {
    //   const selectedOptionObj = options.find(
    //     (opt) => opt.id === selectedOption
    //   );
    //   // if (selectedOptionObj) {
    //   //   const prevOrderType = selectedOptionObj.display_order_type - 1;
    //   //   const nextOrderType = selectedOptionObj.display_order_type + 1;

    //   //   return {
    //   //     // prevOrderType,
    //   //     selectedOrderType: selectedOptionObj.display_order_type,
    //   //     // nextOrderType,
    //   //   };
    //   // }
    // }
    return { prevOrderType: null, selectedOrderType: 0, nextOrderType: 1 };
  };

  const { prevOrderType, selectedOrderType, nextOrderType } =
    getDisplayOrderRange();

  // Show all options if selected display_order_type is 0, otherwise filter
  const filteredOptions =
    selectedOrderType === 0
      ? options
      : options.filter(
        (opt) =>
          opt.display_order_type === prevOrderType ||
          opt.id === selectedOption ||
          opt.display_order_type === nextOrderType
      );

  const searchedOptions =
    debouncedSearch.length >= 3
      ? filteredOptions.filter((opt) =>
        getOptionName(opt)
          ?.toLowerCase()
          .includes(debouncedSearch)
      )
      : filteredOptions;

  return show ? (
    <>
      <style>
        {`
      .search-wrapper {
  position: relative;
  width: 100%;
  margin-bottom: 12px;
}

.search-input {
  width: 100%;
  padding: 10px 14px 10px 10px;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  font-size: 14px;
  outline: none;
  transition: all 0.25s ease;
  background-color: #fafafa;
}

/* Focus effect */
.search-input:focus {
  border-color: #f97316; /* orange theme */
  background-color: #fff;
  // box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.15);
}

/* Placeholder styling */
.search-input::placeholder {
  color: #9ca3af;
  font-size: 13px;
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
              placeholder="Search status..."
              className="search-input"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            {searchText && (
              <span className="clear-icon" onClick={() => setSearchText("")}>
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368">
                  <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                </svg>
              </span>
            )}
          </div>
          <div className="overflow-auto " style={{ maxHeight: "300px" }}>
            <table className="table table-hover" border={0}>
              <tbody className="text-center">
                {searchedOptions.map((option) => (
                  <tr
                    key={option.id}
                    style={{ borderBottom: "1px solid #cccccc", cursor: "pointer" }} // Add cursor to indicate clickability
                    onClick={() => handleRadioChange(option.id)} // Trigger radio selection on row click
                  >
                    <td className="text-start">
                      <label htmlFor={`radio-${option.id}`}>
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
                          <span>{getOptionName(option)}</span>
                        )}
                      </label>
                    </td>
                    <td className="text-end">
                      <input
                        className="custom-radio"
                        type="radio"
                        style={{ cursor: "pointer" }}
                        id={`radio-${option.id}`}
                        checked={selectedOption === option.id}
                        onChange={() => handleRadioChange(option.id)} // Keep this for direct radio clicks
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="modal-buttons">
            <button className="modal-button1" onClick={onHide}>
              {btn1}
            </button>
            {
              displayClearButton && selectedOption && <button className="modal-button1 text-secondary ms-2" style={{ border: "1.5px solid gray" }} onClick={handleClearSelection}>
                Clear
              </button>
            }
            <button className="modal-button2" onClick={onSubmit} style={{ color: "white" }}>
              {btn2}
            </button>
          </div>
        </div>
      </div>
    </>
  ) : null;
};

export default RadioButtonModal;
