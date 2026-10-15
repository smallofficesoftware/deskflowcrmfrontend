import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { axiosInstance } from "../../../../../services/axiosInstance";
import {
  downloadJobCardPdf,
  fetchJobCardDetail,
  generateAndPrintJobCardPdf,
} from "./JobCardController";
import { IContactDetail, IItemDetail } from "./JobCardTypes";
import JobCardPrint from "./print-templates/JobCardPrint";

const JobCardPdfView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const [contactDetail, setContactDetail] = useState<IContactDetail | null>(
    null,
  );
  const [itemDetail, setItemDetail] = useState<IItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  // ticket #2212: when the company has Document Designer on for Job Card,
  // "Print Now" prints the Designer-generated PDF instead of this page's
  // fixed JobCardPrint DOM - same pattern as Profile.tsx's contact print.
  const [designerOn, setDesignerOn] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      setLoading(true);
      // Pass empty dummy functions for the BOM processes since we don't need them here
      await fetchJobCardDetail(
        Number(id),
        setContactDetail,
        setItemDetail,
        () => {},
        () => {},
      );
      setLoading(false);
    };
    loadData();

    const companyMastersId = localStorage.getItem("COMPANY_ID");
    if (companyMastersId) {
      axiosInstance
        .post("get-feature-flag", {
          company_masters_id: companyMastersId,
          feature_key: "jobCard_document_designer",
        })
        .then(({ data }) =>
          setDesignerOn(data?.ack === 1 && !!data.data.item.is_enabled),
        )
        .catch(() => setDesignerOn(false));
    }
  }, [id]);

  const domPrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `JobCard_${id}`,
  });
  const handlePrint = () =>
    designerOn ? generateAndPrintJobCardPdf(Number(id), "jobCard") : domPrint();

  // Auto-print on load
  useEffect(() => {
    if (!loading && itemDetail) setTimeout(handlePrint, 500);
  }, [loading, itemDetail, designerOn]);

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
        <h5 className="mb-0">Job Card Print Preview</h5>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-primary btn-sm"
            disabled={downloading}
            onClick={() =>
              downloadJobCardPdf(Number(id), "jobCard", setDownloading)
            }
          >
            {downloading ? "Preparing…" : "⬇ Download PDF"}
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => handlePrint()}
          >
            🖨️ Print Now
          </button>
        </div>
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
        <JobCardPrint
          ref={printRef}
          jobCardId={Number(id)}
          contactDetail={contactDetail}
          itemDetail={itemDetail}
        />
      </div>
    </div>
  );
};

export default JobCardPdfView;
