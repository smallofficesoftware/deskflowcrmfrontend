import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { setUrlParams } from "../../services/axiosInstance";

// Mobile entry point (flutter webview hits /Reports/:MobileToken/:getID/:MobileFlag).
// Used to be a ~3000-line standalone report renderer, duplicating everything
// SideView/BottomView already do. Now just authenticates from the URL token
// and hands off to the real (embedded, chrome-less) SideView reports page —
// one report-rendering implementation instead of two drifting copies.
const NewReportModel = (): null => {
  const navigate = useNavigate();
  const { MobileToken, getID } = useParams<{
    MobileToken: string;
    getID: string;
    MobileFlag: string;
  }>();

  useEffect(() => {
    if (!MobileToken || !getID) return;

    localStorage.setItem("token", MobileToken);
    localStorage.setItem("UUID", getID);
    setUrlParams({ MobileToken, getID });

    navigate("/SideView?view=reports&embed=1", { replace: true });
  }, [MobileToken, getID, navigate]);

  return null;
};

export default NewReportModel;
