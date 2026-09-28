import "primeicons/primeicons.css";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import React, { useState } from "react";
import { SingleValue } from "react-select";
import CustomSearchDropdown from "../../../../../components/CustomSearchDropdown";
import { IOption } from "../../../../../helpers/AppInterface";
import { searchBomProducts } from "./JobCardController";
import MaterialPipelineSummary from "./sections/MaterialPipelineSummary";
import {
  fetchRawMaterialProcessStatusReport,
  IRawMaterialProcessStatusReport,
} from "./RawMaterialProcessStatusReportController";

// Ticket #2575: pick a finished product, see its raw materials' status
// across the BOM's process chain, aggregated across every open job card
// making it. Reuses MaterialPipelineSummary (built for the per-job-card
// view) so the two screens read the same way.
const RawMaterialProcessStatusReportView: React.FC = () => {
  const [productOption, setProductOption] = useState<SingleValue<IOption>>(
    null,
  );
  const [report, setReport] = useState<IRawMaterialProcessStatusReport | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  const loadProductOptions = async (inputValue: string): Promise<IOption[]> =>
    (await searchBomProducts(inputValue)) || [];

  const handleProductSelect = async (option: SingleValue<IOption>) => {
    setProductOption(option);
    setReport(null);
    if (!option) return;
    setLoading(true);
    const result = await fetchRawMaterialProcessStatusReport(
      Number(option.value),
    );
    setReport(result);
    setLoading(false);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h5 className="mb-3">Raw Material Process Status</h5>
      <div style={{ maxWidth: 420, marginBottom: 20 }}>
        <CustomSearchDropdown
          isAsync={true}
          loadOptions={loadProductOptions}
          value={productOption}
          onChange={handleProductSelect}
          className="w-100"
          placeholder="Select a finished product..."
        />
      </div>

      {loading && (
        <p className="text-muted" style={{ fontSize: "0.85rem" }}>
          Loading...
        </p>
      )}

      {!loading && productOption && report && report.processes.length === 0 && (
        <p className="text-muted" style={{ fontSize: "0.85rem" }}>
          No open job cards (or no BOM) found for this product.
        </p>
      )}

      {!loading && report && report.processes.length > 0 && (
        <>
          <div
            className="d-flex align-items-center gap-2 mb-3"
            style={{ fontSize: "0.85rem", color: "#374151" }}
          >
            <span
              className="badge"
              style={{ background: "#e0f2fe", color: "#0369a1" }}
            >
              {report.open_job_cards} open job card
              {report.open_job_cards > 1 ? "s" : ""}
            </span>
          </div>
          <MaterialPipelineSummary bomProcesses={report.processes} />
        </>
      )}
    </div>
  );
};

export default RawMaterialProcessStatusReportView;
