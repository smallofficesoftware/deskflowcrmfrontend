import React, { useState } from "react";
import { Button } from "primereact/button";
import { toast } from "react-toastify";
import { downloadSalarySlipsPdf } from "./salarySlipPdf";

interface SalarySlipToolbarProps {
  /** PDF file name, e.g. "Salary_Slip_September_2026.pdf" */
  fileName: string;
}

// Download PDF / Print for the salary slip page. Hidden when printing.
const SalarySlipToolbar: React.FC<SalarySlipToolbarProps> = ({ fileName }) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const done = await downloadSalarySlipsPdf(fileName);
      if (!done) toast.info("No salary slip to download.");
    } catch {
      toast.error("Failed to download the salary slip PDF.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <style type="text/css">
        {`@media print { .salary-slip-toolbar { display: none !important; } }`}
      </style>
      <div
        className="salary-slip-toolbar"
        style={{ display: "flex", gap: 8, padding: "12px 0" }}
      >
        <Button
          type="button"
          icon="pi pi-download"
          label={downloading ? "Preparing PDF..." : "Download PDF"}
          disabled={downloading}
          onClick={handleDownload}
        />
        <Button
          type="button"
          icon="pi pi-print"
          label="Print"
          severity="secondary"
          onClick={() => window.print()}
        />
      </div>
    </>
  );
};

export default SalarySlipToolbar;
