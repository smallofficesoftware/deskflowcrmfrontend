import React from "react";
import CustomSearchDropdown from "../../../../../components/CustomSearchDropdown";
import { axiosInstance } from "../../../../../services/axiosInstance";
import { DEFAULT_STATUS_CODE_SUCCESS } from "../../../../../helpers/AppConstants";

interface Option {
  value: number;
  label: string;
}

interface Props {
  relatedModule: string;
  value: number | null;
  onChange: (id: number | null) => void;
}

// Real async-search contact picker, mirroring CreateTaskView.tsx's
// verified loadContactOptions exactly (same `Contact` endpoint,
// {searchTerm, a_application_login_id} -> {id, person_name,
// mobile_number, company_name}) — this is the actual shared picker
// component (CustomSearchDropdown) other creation forms already use, not
// a bespoke one built for this feature.
const loadContactOptions = async (inputValue: string): Promise<Option[]> => {
  if (!inputValue) return [];
  try {
    const { data } = await axiosInstance.post("Contact", {
      searchTerm: inputValue,
      a_application_login_id: Number(localStorage.getItem("UUID")),
    });
    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      return (data.data.item || []).map((item: any) => ({
        value: item.id,
        label: `${item.person_name}${item.mobile_number ? "-" + item.mobile_number : ""}${item.company_name ? "-" + item.company_name : ""}`,
      }));
    }
  } catch {
    /* fall through to empty */
  }
  return [];
};

const RelatedRecordPicker: React.FC<Props> = ({ relatedModule, value, onChange }) => {
  if (relatedModule === "contact") {
    return (
      <div className="form-group col-12 col-md-4">
        <label className="pb-2 form_label d-block">Link to existing Contact</label>
        <CustomSearchDropdown
          isAsync
          loadOptions={loadContactOptions}
          value={value ? { value, label: `#${value}` } : null}
          onChange={(opt: Option | null) => onChange(opt ? opt.value : null)}
          placeholder="Search contact by name/mobile..."
        />
      </div>
    );
  }

  // No verified search endpoint for product/inquiry/order pickers in this
  // pass (contact's is the one confirmed real precedent, CreateTaskView.tsx)
  // — a plain numeric-id fallback rather than guessing at an unverified
  // endpoint contract and risking a silently-wrong integration.
  return (
    <div className="form-group col-12 col-md-4">
      <label className="pb-2 form_label d-block">Link to existing {relatedModule} (ID)</label>
      <input
        type="number"
        className="form-control"
        placeholder={`${relatedModule} ID (optional)`}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      />
    </div>
  );
};

export default RelatedRecordPicker;
