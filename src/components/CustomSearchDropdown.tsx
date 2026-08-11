import React from "react";
import Select, { SingleValue } from "react-select";
import AsyncSelect from "react-select/async";

interface Option {
  value: string | number;
  label: string;
}

interface CustomSearchDropdownProps {
  options?: Option[];
  value: any;
  onChange: (selectedOption: any) => void;
  className?: string;
  defaultValue?: any;
  isDisabled?: boolean | string;
  placeholder?: string;
  isAsync?: boolean;
  loadOptions?: (inputValue: string) => Promise<Option[]>;
  onInputChange?: (inputValue: string) => void;
  styles?: any;
  menuPortalTarget?: HTMLElement | null;
  maxMenuHeight?: number;
  isMulti?: boolean;
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
  maxMenuHeight,
  isMulti = false,
}) => {
  const handleChange = (option: any) => {
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
        cacheOptions
        defaultOptions
        loadOptions={loadOptions}
        value={value || defaultValue || null}
        onChange={handleChange}
        className={className}
        isClearable
        isSearchable
        isMulti={isMulti}
        placeholder={placeholder}
        styles={customStyles}
        isDisabled={isDisabled === "disabled" ? true : false}
        onInputChange={onInputChange}
        noOptionsMessage={() => "Type to search"}
        menuPortalTarget={menuPortalTarget}
        menuPosition="fixed"
        maxMenuHeight={maxMenuHeight}
      />
    );
  }

  return (
    <Select
      options={options}
      value={value || defaultValue || null}
      onChange={handleChange}
      className={className}
      isClearable
      isSearchable
      isMulti={isMulti}
      defaultValue={defaultValue}
      placeholder={placeholder}
      styles={customStyles}
      isDisabled={isDisabled === "disabled" ? true : false}
      filterOption={(option, inputValue) => {
        return option.label.toLowerCase().includes(inputValue.toLowerCase());
      }}
      menuPortalTarget={menuPortalTarget}
      menuPosition="fixed"
      maxMenuHeight={maxMenuHeight}
    />
  );
};

export default CustomSearchDropdown;