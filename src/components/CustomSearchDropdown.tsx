import React from "react";
import Select, { SingleValue } from "react-select";
import AsyncSelect from "react-select/async";

interface Option {
  value: string | number;
  label: string;
}

interface CustomSearchDropdownProps {
  options?: Option[];
  value: SingleValue<Option> | null;
  onChange: (selectedOption: SingleValue<Option>) => void;
  className?: string;
  defaultValue?: SingleValue<Option>;
  isDisabled?: boolean | string;
  placeholder?: string;
  isAsync?: boolean;
  loadOptions?: (inputValue: string) => Promise<Option[]>;
  onInputChange?: (inputValue: string) => void;
  styles?: any;
  menuPortalTarget?: HTMLElement | null;
  // NEW: Add maxMenuHeight to the interface
  maxMenuHeight?: number;
}

const CustomSearchDropdown: React.FC<CustomSearchDropdownProps> = ({
  options = [],
  value,
  onChange,
  className,
  defaultValue,
  isDisabled,
  placeholder = "select",
  isAsync = false,
  loadOptions,
  onInputChange,
  styles,
  menuPortalTarget = typeof document !== 'undefined' ? document.body : null,
  // NEW: Destructure it with a fallback (react-select defaults to 300)
  maxMenuHeight,
}) => {
  const handleChange = (option: SingleValue<Option>) => {
    onChange(option);
  };

  const customStyles = {
    ...styles,
    control: (provided: any, state: any) => ({
      ...provided,
      ...(styles?.control ? styles.control(provided, state) : {}),
      minHeight: "10px",
      fontSize: "16px",
    }),
    menuPortal: (base: any) => ({ ...base, zIndex: 100000 }),
    menu: (provided: any) => ({ ...provided, zIndex: 100000 }),
  };

  if (isAsync && loadOptions) {
    return (
      <AsyncSelect
        // ... (keep your other props)
        cacheOptions
        defaultOptions
        loadOptions={loadOptions}
        value={value || defaultValue || null}
        onChange={handleChange}
        className={className}
        isClearable
        isSearchable
        placeholder={placeholder}
        styles={customStyles}
        isDisabled={isDisabled === "disabled" ? true : false}
        onInputChange={onInputChange}
        noOptionsMessage={() => "Type to search"}
        menuPortalTarget={menuPortalTarget}
        menuPosition="fixed"
        maxMenuHeight={maxMenuHeight} // NEW: Pass it to AsyncSelect
      />
    );
  }

  return (
    <Select
      // ... (keep your other props)
      options={options}
      value={value || defaultValue || null}
      onChange={handleChange}
      className={className}
      isClearable
      isSearchable
      defaultValue={defaultValue}
      placeholder={placeholder}
      styles={customStyles}
      isDisabled={isDisabled === "disabled" ? true : false}
      filterOption={(option, inputValue) => {
        return option.label.toLowerCase().includes(inputValue.toLowerCase());
      }}
      menuPortalTarget={menuPortalTarget}
      menuPosition="fixed"
      maxMenuHeight={maxMenuHeight} // NEW: Pass it to Select
    />
  );
};

export default CustomSearchDropdown;