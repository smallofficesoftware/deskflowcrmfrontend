import React from "react";
import Select, { SingleValue } from "react-select";
import { useField, useFormikContext } from "formik";

export interface StaticSelectOption {
  value: string | number;
  label: string;
}

interface FormikStaticSelectProps {
  name: string;
  options: StaticSelectOption[];
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  isSearchable?: boolean;
  isClearable?: boolean;
  className?: string;
  onChange?: (selected: SingleValue<StaticSelectOption>) => void;
}

const FormikStaticSelect: React.FC<FormikStaticSelectProps> = ({
  name,
  options = [],
  label,
  placeholder = "Select option...",
  disabled = false,
  isSearchable = false,
  isClearable = false,
  className,
  onChange,
}) => {
  const { setFieldValue } = useFormikContext();
  const [field, meta] = useField(name);

  const selectedOption =
    options.find(
      (opt) => String(opt.value) === String(field.value ?? ""),
    ) || null;

  const handleChange = (option: SingleValue<StaticSelectOption>) => {
    const val = option ? option.value : "";
    setFieldValue(name, val);
    if (onChange) {
      onChange(option);
    }
  };

  const customStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      minHeight: "38px",
      fontSize: "14px",
      borderRadius: "4px",
      borderColor: meta.touched && meta.error ? "#dc3545" : state.isFocused ? "#f58634" : "#ced4da",
      boxShadow: state.isFocused ? "0 0 0 0.2rem rgba(245, 134, 52, 0.25)" : "none",
      "&:hover": {
        borderColor: state.isFocused ? "#f58634" : "#a1a1a1",
      },
      cursor: "pointer",
    }),
    valueContainer: (provided: any) => ({
      ...provided,
      padding: "2px 8px",
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: "#333333",
      fontSize: "14px",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      fontSize: "14px",
      padding: "8px 12px",
      backgroundColor: state.isSelected
        ? "#f58634"
        : state.isFocused
        ? "#fff3ea"
        : "transparent",
      color: state.isSelected ? "#ffffff" : "#333333",
      cursor: "pointer",
      "&:active": {
        backgroundColor: "#f58634",
        color: "#ffffff",
      },
    }),
    menu: (provided: any) => ({
      ...provided,
      zIndex: 99999,
      borderRadius: "6px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    }),
    menuPortal: (base: any) => ({ ...base, zIndex: 99999 }),
  };

  return (
    <div className={className}>
      {label && <label className="pb-2 form_label">{label}</label>}
      <Select
        {...field}
        options={options}
        value={selectedOption}
        onChange={handleChange}
        onBlur={() => field.onBlur({ target: { name } })}
        isDisabled={disabled}
        isSearchable={isSearchable}
        isClearable={isClearable}
        placeholder={placeholder}
        styles={customStyles}
        menuPortalTarget={typeof document !== "undefined" ? document.body : null}
        menuPosition="fixed"
      />
    </div>
  );
};

export default FormikStaticSelect;
