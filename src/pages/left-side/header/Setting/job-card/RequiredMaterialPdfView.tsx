import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { fetchJobCardDetail } from "./JobCardController";
import { IContactDetail, IItemDetail, IBomProcess } from "./JobCardTypes";
import RequiredMaterialPrint from "./print-templates/RequiredMaterialPrint";

const RequiredMaterialPdfView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const [contactDetail, setContactDetail] = useState<IContactDetail | null>(
    null,
  );
  const [itemDetail, setItemDetail] = useState<IItemDetail | null>(null);
  const [bomProcesses, setBomProcesses] = useState<IBomProcess[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      setLoading(true);
      await fetchJobCardDetail(
        Number(id),
        setContactDetail,
        setItemDetail,
        setBomProcesses,
        () => {},
      );
      setLoading(false);
    };
    loadData();
  }, [id]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `RequiredMaterial_JobCard_${id}`,
  });

  // Auto-print on load
  useEffect(() => {
    if (!loading && itemDetail) setTimeout(handlePrint, 500);
  }, [loading, itemDetail]);

  if (loading)
    return <div className="text-center p-5">Loading Print Data...</div>;

  return (
    <div
      style={{
        backgroundColor: "#525659",
        minHeight: "100vh",
        padding: "20px",
      }}
    >
      <div
        className="d-flex justify-content-between align-items-center mb-4 mx-auto"
        style={{
          maxWidth: "800px",
          background: "#fff",
          padding: "10px 20px",
          borderRadius: "8px",
        }}
      >
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>
        <h5 className="mb-0">Required Material Print Preview</h5>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => handlePrint()}
        >
          🖨️ Print Now
        </button>
      </div>

      <div
        className="mx-auto"
        style={{
          maxWidth: "800px",
          backgroundColor: "#fff",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          minHeight: "1056px",
        }}
      >
        <RequiredMaterialPrint
          ref={printRef}
          jobCardId={Number(id)}
          itemName={itemDetail?.item_name || "Unknown"}
          bomProcesses={bomProcesses}
        />
      </div>
    </div>
  );
};

export default RequiredMaterialPdfView;
