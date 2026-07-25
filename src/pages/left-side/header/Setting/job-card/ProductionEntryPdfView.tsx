import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import {
  fetchJobCardDetail,
  fetchProductionEntryDetail,
} from "./JobCardController";
import { IItemDetail, IProductionEntryDetail } from "./JobCardTypes";
import ProductionEntryPrint from "./print-templates/ProductionEntryPrint";

const ProductionEntryPdfView = () => {
  const { id, entryId } = useParams<{ id: string; entryId: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const [itemDetail, setItemDetail] = useState<IItemDetail | null>(null);
  const [entryDetail, setEntryDetail] = useState<IProductionEntryDetail | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!id || !entryId) return;
      setLoading(true);

      // Run both API calls in parallel
      await Promise.all([
        fetchJobCardDetail(
          Number(id),
          () => {},
          setItemDetail,
          () => {},
          () => {},
        ),
        fetchProductionEntryDetail(Number(entryId), setEntryDetail, () => {}),
      ]);

      setLoading(false);
    };
    loadData();
  }, [id, entryId]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Production_Entry_${entryId}`,
  });

  useEffect(() => {
    if (!loading && entryDetail) setTimeout(handlePrint, 500);
  }, [loading, entryDetail]);

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
        <h5 className="mb-0">Entry Print Preview</h5>
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
        {entryDetail && (
          <ProductionEntryPrint
            ref={printRef}
            jobCardId={Number(id)}
            itemName={itemDetail?.item_name || "Unknown"}
            entry={entryDetail}
          />
        )}
      </div>
    </div>
  );
};

export default ProductionEntryPdfView;
