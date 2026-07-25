import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import {
  fetchJobCardDetail,
  fetchProductionEntryList,
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
  }, [id]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `JobCard_MasterReport_${id}`,
  });

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
        <h5 className="mb-0">Master Report Preview</h5>
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
