import React from "react";
import Select, { MultiValue } from "react-select";
import AsyncSelect from "react-select/async";

interface Option {
    value: string | number;
    label: string;
}

interface CustomSearchMultiSelectDropdownProps {
    options?: Option[];
    value: MultiValue<Option> | null;
    onChange: (selectedOption: MultiValue<Option>) => void;
    className?: string;
    defaultValue?: MultiValue<Option>;
    isDisabled?: boolean | string;
    placeholder?: string;
    // Props for async/live search
    isAsync?: boolean;
    loadOptions?: (inputValue: string) => Promise<Option[]>;
    onInputChange?: (inputValue: string) => void;
}

const CustomSearchMultiSelectDropdown: React.FC<CustomSearchMultiSelectDropdownProps> = ({
    options = [],
    value,
    onChange,
    className,
    defaultValue,
    isDisabled,
    placeholder = "select",
    isAsync = false,
    loadOptions,
    onInputChange
}) => {
    const allOption: Option = { value: "all", label: "Select All" };

    // For non-async, prepend "Select All"
    const customOptions: Option[] = [
        allOption,
        ...options,
    ];

    const handleChange = (selected: MultiValue<Option> | null) => {
        if (!selected) {
            onChange([]);
            return;
        }

        const currentSelected = value || defaultValue || [];
        const wasAllSelected = currentSelected.length === options.length;
        const isAllSelected = selected.some(opt => opt.value === "all");

        let newValue: Option[];
        if (isAllSelected) {
            newValue = wasAllSelected ? [] : options;
        } else {
            newValue = selected.filter(o => o.value !== "all");
        }

        onChange(newValue);
    };

    const customStyles = {
        control: (provided: any) => ({
            ...provided,
            minHeight: "10px",
            fontSize: "16px",
        }),
    };

    // If async mode is enabled, use AsyncSelect (no "Select All" for async in this impl)
    if (isAsync && loadOptions) {
        return (
            <AsyncSelect
                isMulti
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
            />
        );
    }

    // Regular Select with client-side filtering
    return (
        <Select
            isMulti
            options={customOptions}
            value={value || defaultValue || null}
            onChange={handleChange}
            className={className}
            isClearable
            isSearchable
            placeholder={placeholder}
            styles={customStyles}
            closeMenuOnSelect={false}
            hideSelectedOptions={false}
            isDisabled={isDisabled === "disabled" ? true : false}
            filterOption={(option, inputValue) => {
                const label = option.label ?? "";
                return label.toLowerCase().includes(inputValue.toLowerCase());
            }}
        />
    );
};

export default CustomSearchMultiSelectDropdown;