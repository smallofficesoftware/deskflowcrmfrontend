import { useEffect, useState } from "react";
import { axiosInstance } from "../../services/axiosInstance";

// company_feature_flags.feature_key that switches the help avatar on per company.
export const GUIDE_FEATURE_KEY = "guide_assistant";

const cache = new Map<string, boolean>();

export const useGuideEnabled = (active: boolean): boolean => {
  const companyId = localStorage.getItem("COMPANY_ID");
  const [enabled, setEnabled] = useState<boolean>(
    companyId ? cache.get(companyId) === true : false
  );

  useEffect(() => {
    if (!active || !companyId) {
      setEnabled(false);
      return;
    }
    const cached = cache.get(companyId);
    if (cached !== undefined) {
      setEnabled(cached);
      return;
    }
    let cancelled = false;
    axiosInstance
      .post("get-feature-flag", {
        company_masters_id: companyId,
        feature_key: GUIDE_FEATURE_KEY,
      })
      .then(({ data }) => {
        const on = data?.ack === 1 && !!data.data?.item?.is_enabled;
        cache.set(companyId, on);
        if (!cancelled) setEnabled(on);
      })
      .catch(() => {
        if (!cancelled) setEnabled(false);
      });
    return () => {
      cancelled = true;
    };
  }, [active, companyId]);

  return enabled;
};
