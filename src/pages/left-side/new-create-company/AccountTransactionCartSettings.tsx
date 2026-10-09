import { useEffect, useState } from "react";
import { axiosInstance } from "../../../services/axiosInstance";

// Company-wide switches for Account Transaction <-> Cart linking. Stored as
// company_feature_flags rows (same mechanism as the Document Designer
// toggles), saved immediately on toggle. Backend keys live in
// accountTransactionCartLinkServices.js.
const SETTINGS = [
  {
    key: "accountTransaction_bill_to_bill",
    label: "Bill to Bill Payment Only (every account transaction must be linked to a cart)",
  },
  {
    key: "accountTransaction_block_overpayment",
    label: "Do Not Allow Over-Payment (amount cannot exceed the linked cart's pending amount)",
  },
];

const AccountTransactionCartSettings = ({ companyId }: { companyId?: number }) => {
  const [flags, setFlags] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!companyId) return;
    Promise.all(
      SETTINGS.map(({ key }) =>
        axiosInstance
          .post("get-feature-flag", { company_masters_id: companyId, feature_key: key })
          .then(({ data }) => [key, !!data?.data?.item?.is_enabled] as const),
      ),
    ).then((entries) => setFlags(Object.fromEntries(entries)));
  }, [companyId]);

  const toggle = async (key: string, checked: boolean) => {
    setFlags((prev) => ({ ...prev, [key]: checked }));
    await axiosInstance.post("set-feature-flag", {
      company_masters_id: companyId,
      feature_key: key,
      is_enabled: checked,
    });
  };

  if (!companyId) return null;

  return (
    <>
      {SETTINGS.map(({ key, label }) => (
        <div className="form-check form-switch" key={key}>
          <label htmlFor={key}>{label}</label>
          <input
            type="checkbox"
            id={key}
            className="form-check-input"
            checked={!!flags[key]}
            onChange={(e) => toggle(key, e.target.checked)}
          />
        </div>
      ))}
    </>
  );
};

export default AccountTransactionCartSettings;
