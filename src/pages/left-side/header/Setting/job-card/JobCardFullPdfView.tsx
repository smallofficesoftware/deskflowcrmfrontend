import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { axiosInstance } from "../../../../../services/axiosInstance";
import {
  downloadJobCardPdf,
  fetchJobCardDetail,
  fetchProductionEntryList,
  generateAndPrintJobCardPdf,
} from "./JobCardController";
import {
  IBomProcess,
  IContactDetail,
  IItemDetail,
  IProductionEntryListItem,
} from "./JobCardTypes";
import JobCardFullPrint from "./print-templates/JobCardFullPrint";

const JobCardFullPdfView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const [contactDetail, setContactDetail] = useState<IContactDetail | null>(
    null,
  );
  const [itemDetail, setItemDetail] = useState<IItemDetail | null>(null);
  const [bomProcesses, setBomProcesses] = useState<IBomProcess[]>([]);
  const [productionEntries, setProductionEntries] = useState<
    IProductionEntryListItem[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  // ticket #2212: same Document Designer opt-in as JobCardPdfView, flag key
  // for this kind is "jobCardMaster_document_designer".
  const [designerOn, setDesignerOn] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      setLoading(true);

      await Promise.all([
        fetchJobCardDetail(
          Number(id),
          setContactDetail,
          setItemDetail,
          setBomProcesses,
          () => {},
        ),
        fetchProductionEntryList(Number(id), setProductionEntries, () => {}),
      ]);

      setLoading(false);
    };
    loadData();

    const companyMastersId = localStorage.getItem("COMPANY_ID");
    if (companyMastersId) {
      axiosInstance
        .post("get-feature-flag", {
          company_masters_id: companyMastersId,
          feature_key: "jobCardMaster_document_designer",
        })
        .then(({ data }) =>
          setDesignerOn(data?.ack === 1 && !!data.data.item.is_enabled),
        )
        .catch(() => setDesignerOn(false));
    }
  }, [id]);

  const domPrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `JobCard_MasterReport_${id}`,
  });
  const handlePrint = () =>
    designerOn ? generateAndPrintJobCardPdf(Number(id), "master") : domPrint();

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
        <h5 className="mb-0">Master Report Preview</h5>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-primary btn-sm"
            disabled={downloading}
            onClick={() =>
              downloadJobCardPdf(Number(id), "master", setDownloading)
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
        <JobCardFullPrint
          ref={printRef}
          jobCardId={Number(id)}
          contactDetail={contactDetail}
          itemDetail={itemDetail}
          bomProcesses={bomProcesses}
          productionEntries={productionEntries}
        />
      </div>
    </div>
  );
};

export default JobCardFullPdfView;
