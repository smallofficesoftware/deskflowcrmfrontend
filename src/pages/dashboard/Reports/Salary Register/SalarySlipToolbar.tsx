import React, { useState } from "react";
import { Button } from "primereact/button";
import { toast } from "react-toastify";
import { downloadSalarySlipPdfFromServer } from "./salarySlipServerPdf";

interface SalarySlipToolbarProps {
  employeeIds: string[];
  month: number;
  year: number;
}

// Download PDF / Print for the salary slip page. Hidden when printing.
const SalarySlipToolbar: React.FC<SalarySlipToolbarProps> = ({ employeeIds, month, year }) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const result = await downloadSalarySlipPdfFromServer(employeeIds, month, year);
      if (!result.ok) toast.error(result.message || "Failed to download the salary slip PDF.");
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
