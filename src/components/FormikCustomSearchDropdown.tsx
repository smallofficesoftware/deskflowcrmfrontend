import { useField, useFormikContext } from "formik";
import React from "react";
import Select, { SingleValue } from "react-select";

interface Option {
  value: string | number;
  label: string;
}

interface CustomSelectProps {
  label?: string;
  name: string;
  options: Option[];
  className?: string;
  value?: SingleValue<Option>;
  onChange?: (
    selectedOption: SingleValue<Option>,
    setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void
  ) => void;
  disabled?: boolean;
  menuPlacement?: string;
}

const FormikCustomSearchDropdown: React.FC<CustomSelectProps> = ({
  label,
  options,
  className,
  onChange,
  value,
  disabled = false,
  menuPlacement,
  ...props
}) => {
  const { setFieldValue } = useFormikContext();
  const [field, meta] = useField(props);

  // Add a default option at the top
  const enhancedOptions: Option[] = [
    { label: "Select an option", value: "" },
    ...(options || []),
  ];

  const handleChange = (option: SingleValue<Option>) => {
    setFieldValue(props.name, option ? option.value : "");
    if (onChange) {
      onChange(option, setFieldValue);
    }
  };

  const selectedOption =
    enhancedOptions.find((option) => option.value === field.value) || null;

  return (
    <div>
      {label && <label>{label}</label>}
      <Select
        {...field}
        {...props}
        options={enhancedOptions}
        className={className}
        onChange={handleChange}
        onBlur={() => field.onBlur({ target: { name: props.name } })}
        value={selectedOption}
        isDisabled={disabled}
        styles={{
          control: (provided) => ({
            ...provided,
            minHeight: "45px",
            fontSize: "16px",
          }),
          option: (provided) => ({
            ...provided,
            textAlign: "left",
          }),
          singleValue: (provided) => ({
            ...provided,
            textAlign: "left",
          }),
          input: (provided) => ({
            ...provided,
            textAlign: "left",
          }),
          placeholder: (provided) => ({
            ...provided,
            textAlign: "left",
          }),
          menu: (provided) => ({
            ...provided,
            textAlign: "left",
          }),
        }}
      />
    </div>
  );
};

export default FormikCustomSearchDropdown;
