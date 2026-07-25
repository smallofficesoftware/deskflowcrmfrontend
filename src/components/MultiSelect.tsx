import React, { useRef, useState } from "react";
import ReactSelect, { components, InputAction } from "react-select";

export type Option = {
  value: number | string;
  label: string;
};

type Props = {
  options?: Option[];
  value?: Option[];
  onChange: (selected: Option[]) => void;
  isSelectAll?: boolean;
  allowSingle?: boolean;
  menuPlacement?: "auto" | "top" | "bottom";
  components?: any;
  isDisabled?: boolean;
  isClearable?: boolean;
  [key: string]: any;
};

const MultiSelect: React.FC<Props> = (props) => {
  /** Safe normalization */
  const safeOptions: Option[] = Array.isArray(props.options) ? props.options : [];
  const safeValue: Option[] = Array.isArray(props.value) ? props.value : [];

  const [selectInput, setSelectInput] = useState("");
  const isAllSelected = useRef(false);
  const selectAllLabel = useRef("Select all");
  // Note: allOption.label will be updated later
  const allOption: Option = { value: "*", label: selectAllLabel.current };

  const inputLower = selectInput.toLowerCase();

  /* Helpers */
  const filterOptions = (arr: Option[], str: string) =>
    arr.filter((opt) => String(opt.label).toLowerCase().includes(str.toLowerCase()));

  const comparator = (a: Option, b: Option) =>
    typeof a.value === "number" && typeof b.value === "number"
      ? a.value - b.value
      : String(a.label).localeCompare(String(b.label));

  const filteredOptions = filterOptions(safeOptions, selectInput);
  const filteredSelected = filterOptions(safeValue, selectInput);

  /* Custom option with checkbox */
  const CustomOption = (p: any) => {
    const { data, isSelected } = p;
    const isSelectAllOption = data && data.value === "*";
    const disableSelectAll = Boolean(props.allowSingle); // Option B: show but disable when single

    const checked = isSelectAllOption ? isAllSelected.current : isSelected;

    return (
      <components.Option {...p} isDisabled={isSelectAllOption && disableSelectAll}>
        <input
          type="checkbox"
          readOnly
          disabled={isSelectAllOption && disableSelectAll}
          checked={Boolean(checked)}
          style={{ marginRight: 6 }}
        />
        <label>{p.label}</label>
      </components.Option>
    );
  };

  /* Custom input for dotted border when typing */
  const CustomInput = (p: any) => (
    <>
      {selectInput.length === 0 ? (
        <components.Input {...p}>{p.children}</components.Input>
      ) : (
        <div style={{ border: "1px dotted gray" }}>
          <components.Input {...p}>{p.children}</components.Input>
        </div>
      )}
    </>
  );

  const customFilterOption = ({ value, label }: Option, input: string) =>
    value === "*" || String(label).toLowerCase().includes(input.toLowerCase());

  const onInputChange = (val: string, evt: { action: InputAction }) => {
    if (evt.action === "input-change") setSelectInput(val);
    if (evt.action === "menu-close") setSelectInput("");
  };

  const onKeyDown = (e: any) => {
    if ((e.key === " " || e.key === "Enter") && !selectInput) e.preventDefault();
  };

  /* -------------------- MULTI: select/deselect handling (toggle select-all) -------------------- */
  const handleMultiChange = (selected: any) => {
    // normalize selected to array
    const selArr: Option[] = Array.isArray(selected) ? selected : selected ? [selected] : [];

    const selectedFiltered = selArr.filter((opt) =>
      String(opt.label).toLowerCase().includes(inputLower)
    );

    const allFiltered = safeOptions.filter((opt) =>
      String(opt.label).toLowerCase().includes(inputLower)
    );

    // If user clicked select-all sentinel (*)
    if (selArr.length > 0 && selArr[selArr.length - 1].value === "*") {
      // If all filtered are already selected -> deselect them (toggle OFF)
      const allFilteredAreSelected = allFiltered.every((opt) =>
        safeValue.some((v) => v.value === opt.value)
      );

      if (allFilteredAreSelected) {
        // remove all filtered options
        const remaining = safeValue.filter(
          (opt) => !String(opt.label).toLowerCase().includes(inputLower)
        );
        return props.onChange(remaining);
      } else {
        // add all filtered options that are not already present
        const toAdd = allFiltered.filter(
          (opt) => !safeValue.find((v) => v.value === opt.value)
        );
        const merged = [...safeValue, ...toAdd].sort(comparator);
        return props.onChange(merged);
      }
    }

    // If after the click there are NO filtered items selected -> user effectively deselected all filtered items
    if (selectedFiltered.length === 0) {
      const remaining = safeValue.filter(
        (opt) => !String(opt.label).toLowerCase().includes(inputLower)
      );
      return props.onChange(remaining);
    }

    // Normal selection change: pass selArr (array)
    return props.onChange(selArr);
  };

  /* -------------------- SINGLE: always return array to parent, but supply single object to react-select -------------------- */
  const handleSingleChange = (selected: any) => {
    // react-select will pass null when cleared; we convert it to []
    if (!selected) {
      return props.onChange([]);
    }

    // defensive: sometimes react-select can send array shapes; pick first
    if (Array.isArray(selected)) {
      const first = selected[0] ?? null;
      if (!first || first.value === "*") return props.onChange([]);
      return props.onChange([first]);
    }

    if (selected.value === "*") return props.onChange([]);
    return props.onChange([selected]);
  };

  /* -------------------- Select-All label state -------------------- */
  if (props.isSelectAll && safeOptions.length > 0) {
    isAllSelected.current =
      JSON.stringify(filteredSelected.slice().sort(comparator)) ===
      JSON.stringify(filteredOptions.slice().sort(comparator));

    if (filteredSelected.length === 0) {
      selectAllLabel.current = "Select all";
    } else if (filteredSelected.length === filteredOptions.length) {
      selectAllLabel.current = `All (${filteredOptions.length}) selected`;
    } else {
      selectAllLabel.current = `${filteredSelected.length} / ${filteredOptions.length} selected`;
    }
    allOption.label = selectAllLabel.current;
  }

  const mergedOptions = props.isSelectAll && safeOptions.length > 0 ? [allOption, ...safeOptions] : safeOptions;

  /* ---------- FIX: supply correct value shape to react-select so it can close menu properly ---------- */
  const reactSelectValue = props.allowSingle ? safeValue[0] ?? null : safeValue;

  /* ---------- Menu close & blur handlers to ensure dropdown hides and input resets ---------- */
  const handleMenuClose = () => {
    setSelectInput("");
    // programmatically blur active element inside page to avoid stuck focus
    try {
      const el = (document.activeElement as HTMLElement) || null;
      if (el && typeof el.blur === "function") el.blur();
    } catch (err) {
      // ignore
    }
    if (typeof props.onMenuClose === "function") props.onMenuClose();
  };

  const handleBlur = (event: any) => {
    // Clean search input on blur
    setSelectInput("");
    if (typeof props.onBlur === "function") props.onBlur(event);
  };

  /* ---------- final render ---------- */
  return (
    <ReactSelect
      {...props}
      value={reactSelectValue}
      options={mergedOptions}
      inputValue={selectInput}
      onInputChange={onInputChange}
      filterOption={customFilterOption}
      components={{
        Option: CustomOption,
        Input: CustomInput,
        ...props.components,
      }}
      menuPlacement={props.menuPlacement ?? "auto"}
      onKeyDown={onKeyDown}
      isMulti={!props.allowSingle}
      closeMenuOnSelect={!!props.allowSingle}
      hideSelectedOptions={!props.isSelectAll}
      blurInputOnSelect={!!props.allowSingle}
      backspaceRemovesValue={false}
      styles={customStyles}
      isClearable={props.allowSingle || props.isClearable} // allow clear in single mode
      onChange={(selected: any) =>
        props.allowSingle ? handleSingleChange(selected) : handleMultiChange(selected)
      }
      onMenuClose={handleMenuClose}
      onBlur={handleBlur}
      menuIsOpen={undefined} // let react-select control open/close
    />
  );
};

/* Styles */
const customStyles = {
  multiValueLabel: (base: any) => ({ ...base, backgroundColor: "lightgray" }),
  multiValueRemove: (base: any) => ({ ...base, backgroundColor: "lightgray" }),
  valueContainer: (base: any) => ({ ...base, maxHeight: "65px", overflow: "auto" }),
  option: (base: any, { isSelected, isFocused }: any) => ({
    ...base,
    backgroundColor: isSelected ? "#f58634" : isFocused ? "#E3F2FD" : "white",
    color: isSelected ? "white" : "black",

    textAlign: "left",
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
  }),
  menu: (base: any) => ({ ...base, zIndex: 9999 }),
};

export default MultiSelect;
