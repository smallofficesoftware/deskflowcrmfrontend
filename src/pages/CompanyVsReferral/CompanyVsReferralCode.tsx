import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { DEFAULT_STATUS_CODE_ERROR, DEFAULT_STATUS_CODE_SUCCESS, REACT_APP_REFERRAL_CODE } from "../../helpers/AppConstants";
import { axiosInstance } from "../../services/axiosInstance";
import {
  fetchCompanyReferralCodeDetailApi,
  fetchReferralCodeApi,
  ICompanyDetail,
  IReferralCodeData,
  updatePlanExpiryApi,
} from "./CompanyVsReferralController";

const CompanyVsReferralCode = () => {
  const [referralCode, setReferralCode] = useState<IReferralCodeData[]>([]);
  const [inputReferralCode, setInputReferralCode] = useState<string>("");
  const [selectedReferralId, setSelectedReferralId] = useState<number | null>(null);
  const [masterReferralCode, setMasterReferralCode] = useState<string | number | undefined>("");
  
  const [companyDetails, setCompanyDetails] = useState<{
    expired: ICompanyDetail[];
    demo: ICompanyDetail[];
    paid: ICompanyDetail[];
  }>({
    expired: [],
    demo: [],
    paid: [],
  });

  const [isFilterApplied, setIsFilterApplied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<ICompanyDetail | null>(null);
  const [newExpiryDate, setNewExpiryDate] = useState<Date | null>(null);
  
  useEffect(() => {
    setMasterReferralCode(REACT_APP_REFERRAL_CODE);
    fetchReferralCodeApi(setReferralCode);
  }, []);

  // const handleFilter = async () => {
  //   if (!inputReferralCode) {
  //     toast.error("Please enter a referral code");
  //     return;
  //   }

  //   let referralId: number | undefined = undefined;
  //   let masterReferral: string | undefined = undefined;

  //   if (inputReferralCode === masterReferralCode) {
  //     masterReferral = inputReferralCode;
  //   } else {
  //     const matchedReferral = referralCode.find(
  //       (r) => r.referral_code === inputReferralCode
  //     );
  //     if (!matchedReferral) {
  //       toast.error("Invalid referral code");
  //       return;
  //     }
  //     referralId = matchedReferral.id;

  //   }

  //   setIsFilterApplied(true);
  //   await fetchCompanyReferralCodeDetailApi(referralId, setCompanyDetails, setLoading, masterReferral);
  // };
  const handleFilter = async () => {
    if (!inputReferralCode) {
      toast.error("Please enter a referral code");
      return;
    }

    let referralId: number | undefined = undefined;
    let masterReferral: string | undefined = undefined;

    if (inputReferralCode === masterReferralCode) {
      masterReferral = inputReferralCode;
      setSelectedReferralId(null); // master referral has no numeric ID
    } else {
      const matchedReferral = referralCode.find(
        (r) => r.referral_code === inputReferralCode
      );
      if (!matchedReferral) {
        toast.error("Invalid referral code");
        return;
      }
      referralId = matchedReferral.id;
      setSelectedReferralId(referralId); // save referral id here
    }

    setIsFilterApplied(true);
    await fetchCompanyReferralCodeDetailApi(
      referralId,
      setCompanyDetails,
      setLoading,
      masterReferral
    );
  };

  const openModal = (company: ICompanyDetail) => {
    setSelectedCompany(company);
    setNewExpiryDate(company.plan_expiry_date ? new Date(company.plan_expiry_date) : null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCompany(null);
    setNewExpiryDate(null);
  };

  const handleUpdateExpiryDate = async () => {
    if (!selectedCompany || !newExpiryDate) {
      toast.error("Please select a valid date");
      return;
    }

    const success = await updatePlanExpiryApi({
      a_application_login_id: selectedCompany.a_application_login_id,
      plan_expiry_date: newExpiryDate.toISOString().split("T")[0], // "YYYY-MM-DD"
      company_id: selectedCompany.id,
      referralId: selectedReferralId,
       master_reffral_code: masterReferralCode

    });

    if (success) {
      handleFilter(); // Refresh the table data
      closeModal();
    }
    // Error already handled inside updatePlanExpiryApi
  };

  const handleDownload = async (a_application_login_id: number) => {
    try {
      const response = await axiosInstance.post(
        "PaymentHistory",
        {
          downloadFlag: 1,
          a_application_login_id,
          referralId: selectedReferralId
        },
        {
          responseType: "blob", // Always blob
          headers: { "x-tenant-id": a_application_login_id }
        }
      );

      const isJsonResponse = response.headers["content-type"]?.includes("application/json");

      if (isJsonResponse) {
        // Convert blob to JSON
        const text = await response.data.text();
        const jsonData = JSON.parse(text);

        toast.error(jsonData.ack_msg || "You don't have rights to download invoice");
        return;
      }

      const disposition = response.headers["content-disposition"];
      let fileName = "invoice.pdf";

      if (disposition) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match) fileName = match[1];
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Download Successfully!");

    } catch (error) {
      toast.error("Download failed");
    }
  };



  const renderTable = (data: ICompanyDetail[], title: string) => (
    <div className="mt-5">
      <h3 className="fw-bold fs-5 mb-3">{title}</h3>
      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead className="table-dark">
            <tr>
              <th style={{ width: "140px" }}>Sr.No / Action</th>
              {title === "Paid" && <th>Invoice</th>}
              <th>Status</th>
              <th>Plan Type</th>
              <th>Expiry Date</th>
              <th>Company Name</th>
              <th>Owner Name</th>
              <th>Owner Mobile</th>
              <th>Owner Email</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="text-center py-4">Loading...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={10} className="text-center text-muted py-4">No data found</td></tr>
            ) : (
              data.map((company, index) => (
                <tr key={company.id}>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <span className="fw-bold">{index + 1}</span>
                      <button
                        onClick={() => openModal(company)}
                        className="btn btn-sm"
                        style={{ backgroundColor: "#f58634" }}
                      >
                        View
                      </button>
                    </div>
                  </td>
                  {title === "Paid" && (
                    <td>
                      <button
                        onClick={() => handleDownload(company.a_application_login_id)}
                        className="btn btn-sm btn-success"
                      >
                        Download
                      </button>
                    </td>
                  )}
                  <td>
                    <span className={`badge bg-${company.plan_status === "Active" ? "success" : "danger"}`}>
                      {company.plan_status}
                    </span>
                  </td>
                  <td>{company.plan_type || "-"}</td>
                  <td>{company.plan_expiry_date || "-"}</td>
                  <td>{company.company_name}</td>
                  <td>{company.owner_name || "-"}</td>
                  <td>{company.owner_number || "-"}</td>
                  <td>{company.owner_email || "-"}</td>


                  <td>{company.created_date_time?.split(" ")[0] || "-"}</td>


                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <>
      <div className="container-fluid py-4">
        <div className="text-center mb-4">
          <img width={350} src={require("../../assets/images/deshFlow_log.png")} alt="Logo" />
          <h4 className="mt-3 fw-bold text-primary">Company Vs Referral Code Report</h4>
        </div>

        <div className="card shadow-sm">
          <div className="card-body">
            <div className="row g-3 align-items-end">
              <div className="col-md-5">
                <label className="form-label fw-bold">Referral Code</label>
                <input
                  type="text"
                  className="form-control"
                  value={inputReferralCode}
                  onChange={(e) => setInputReferralCode(e.target.value)}
                  placeholder="Enter referral code"
                />
              </div>
              <div className="col-md-3">
                <button onClick={handleFilter} disabled={loading} className="btn btn-success w-100">
                  {loading ? "Loading..." : "Filter"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {isFilterApplied && (
          <div className="mt-4">
            {renderTable(companyDetails.expired, "Expired")}
            {renderTable(companyDetails.demo, "Demo")}
            {renderTable(companyDetails.paid, "Paid")}
          </div>
        )}
      </div>

      {/* Custom Modal - Using Your Classes */}
      {showModal && selectedCompany && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(0,0,0,0.7)",
              zIndex: 9998,
            }}
            onClick={closeModal}
          />

          {/* Modal */}
          <div className="modal1">

            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-3 p-3  text-white rounded-top" style={{ backgroundColor: "#f58634", }}>
              <h5 className="mb-0">
                {selectedCompany.company_name} - Details
              </h5>
              <button
                onClick={closeModal}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "28px",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="p-4" style={{ maxHeight: "70vh", overflowY: "auto" }}>
              <table className="table table-bordered">
                <tbody>
                  <tr><th>Company Name</th><td>{selectedCompany.company_name}</td></tr>
                  <tr><th>Category</th><td>{selectedCompany.company_category}</td></tr>
                  <tr><th>Subcategory</th><td>{selectedCompany.company_subcategory}</td></tr>
                  <tr><th>GST No</th><td>{selectedCompany.gst_number || "-"}</td></tr>
                  <tr><th>City</th><td>{selectedCompany.company_cityName}</td></tr>
                  <tr><th>Owner Name</th><td>{selectedCompany.owner_name}</td></tr>
                  <tr><th>Owner Mobile</th><td>{selectedCompany.owner_number}</td></tr>
                  <tr><th>Owner Email</th><td>{selectedCompany.owner_email}</td></tr>
                  <tr><th>Plan Type</th><td>{selectedCompany.plan_type}</td></tr>
                  <tr><th>Purchase Date</th><td>{selectedCompany.plan_purchase_date}</td></tr>
                  <tr><th>Current Expiry</th><td>{selectedCompany.plan_expiry_date}</td></tr>

                  <tr>
                    <th>Change Expiry Date</th>
                    <td>
                      <DatePicker
                        selected={newExpiryDate}
                        onChange={(date) => setNewExpiryDate(date as Date | null)}
                        className="form-control"
                        dateFormat="dd/MM/yyyy"
                        minDate={new Date()}             
                        placeholderText="Select new expiry date"
                        showDisabledMonthNavigation      
                        onKeyDown={(e) => e.preventDefault()}  
                      />
                    </td>
                  </tr>

                  <tr><th>Total Contacts</th><td>{selectedCompany.contact_count}</td></tr>
                  <tr><th>Reminders</th><td>{selectedCompany.reminder_count}</td></tr>
                  <tr><th>Team Members</th><td>{selectedCompany.company_team_mamber}</td></tr>
                  <tr><th>Quotations</th><td>{selectedCompany.quatation_count}</td></tr>
                  <tr><th>Orders</th><td>{selectedCompany.order_count}</td></tr>
                  <tr><th>Products</th><td>{selectedCompany.product_count}</td></tr>
                  <tr><th>Tasks</th><td>{selectedCompany.task_count}</td></tr>
                  <tr><th>Last Login</th><td>{selectedCompany.login_time || "-"}</td></tr>
                  <tr><th>Plan Status</th><td>{selectedCompany.plan_status}</td></tr>
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="p-1 d-flex justify-content-end gap-2">
              {selectedCompany.plan_type?.toLowerCase().includes("paid") && (
                <button
                  onClick={() => handleDownload(selectedCompany.a_application_login_id)}
                  className="btn btn-success"
                >
                  Download Invoice
                </button>
              )}
              <button onClick={handleUpdateExpiryDate} className="btn btn-primary" style={{
                backgroundColor: "#f58634",
              }}>
                Update Expiry
              </button>
              <button onClick={closeModal} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>

        </>
      )}

      {/* Your Custom Modal CSS - Add this in your CSS file */}
      <style>{`
        .modal1 {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 9999;
          width: 90%;
          max-width: 1000px;
          max-height: 90vh;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          overflow: hidden;
        }
        .modal-content1 {
          background: white;
          border-radius: 12px;
        }
      `}</style>
    </>
  );
};

export default CompanyVsReferralCode;