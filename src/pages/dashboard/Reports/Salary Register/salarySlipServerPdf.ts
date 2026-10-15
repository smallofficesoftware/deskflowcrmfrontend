import { saveAs } from "file-saver";
import { axiosInstance } from "../../../../services/axiosInstance";

// The salary slip PDF is built on the server from an EJS template (the same way
// the report exports are), then downloaded here: ask for it, get a file link back,
// fetch the file and save it.
export interface SalarySlipPdfResult {
  ok: boolean;
  /** Why it failed, safe to show to the user. */
  message?: string;
}

export async function downloadSalarySlipPdfFromServer(
  employeeIds: Array<number | string>,
  month: number,
  year: number,
): Promise<SalarySlipPdfResult> {
  if (employeeIds.length === 0 || !month || !year) {
    return { ok: false, message: "Select employees first." };
  }

  try {
    const { data } = await axiosInstance.post("salary/monthly-slip-pdf", {
      employeeIds: employeeIds.join(","),
      month,
      year,
      a_application_login_id: localStorage.getItem("UUID"),
    });

    if (data.ack !== 1) {
      return { ok: false, message: data.ack_msg || "Failed to create the salary slip PDF." };
    }

    const { fileUrl, fileName } = data.data;
    const file = await axiosInstance.get(fileUrl, { responseType: "blob" });
    saveAs(new Blob([file.data], { type: "application/pdf" }), fileName);
    return { ok: true };
  } catch {
    return { ok: false, message: "Failed to download the salary slip PDF." };
  }
}
