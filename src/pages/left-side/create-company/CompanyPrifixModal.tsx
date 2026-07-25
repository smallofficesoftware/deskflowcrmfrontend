import { ErrorMessage, Field } from "formik";
import React from "react";

export interface ModalField {
  name: string;
  label?: string;
  type?: string;
  as?: "input" | "textarea" | "select";
  rows?: number;
  placeholder?: string;
  col?: number; // Bootstrap column width (e.g., 6, 12)
  options?: { label: string; value: any }[];
}

interface DynamicModalProps {
  show: boolean;
  onClose: () => void;
  title?: string;
  fields: ModalField[];
  footerButtons?: {
    label: string;
    onClick: () => void;
    variant?: string; // e.g. "primary" | "secondary" | "danger"
  }[];
}

const CompanyPrifixModal: React.FC<DynamicModalProps> = ({
  show,
  onClose,
  title = "Details",
  fields,
  footerButtons = [],
}) => {
  return (
    <div
      className={`modal fade ${show ? "show d-block" : ""}`}
      tabIndex={-1}
      role="dialog"
      aria-labelledby="dynamicModal"
      aria-hidden={!show}
      style={{ backgroundColor: show ? "rgba(0,0,0,0.5)" : "transparent" }}
    >
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          {/* Header */}
          <div className="modal-header">
            <h5 className="modal-title" id="dynamicModal">
              {title}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>

          {/* Body */}
          <div className="modal-body">
            <div className="row">
              {fields.map((field, idx) => (
                <div key={idx} className={`col-${field.col || 12}`}>
                  <div className="form-group mb-3">
                    {field.label && (
                      <label htmlFor={field.name} className="pb-2 form-label">
                        {field.label}
                      </label>
                    )}

                    {field.as === "select" ? (
                      <Field
                        as="select"
                        name={field.name}
                        className="form-control font-size-15 rounded-1"
                      >
                        <option value="">Select {field.label}</option>

                        {field.options?.map((option, i) => (
                          <option key={i} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Field>
                    ) : (
                      <>
                        {(field.name == "quotation_series_pattern" ||
                          field.name == "proforma_invoice_series_pattern" ||
                          field.name == "sales_invoice_series_pattern" ||
                          field.name == "order_series_pattern" ||
                          field.name == "return_sales_invoice_series_pattern" ||
                          field.name == "quotation_series_pattern" ||
                          field.name == "purchase_invoice_series_pattern" ||
                          field.name ==
                          "return_purchase_invoice_series_pattern" ||
                          field.name == "purchase_order_series_pattern" ||
                          field.name == "inward_series_pattern" ||
                          field.name == "dispatch_series_pattern") && (
                            <div
                              style={{
                                padding: "15px",
                                background: "#f9f9f9",
                                borderRadius: "8px",
                                border: "1px solid #ddd",
                              }}
                            >
                              <h3>{field.label}</h3>

                              <p>
                                The serial number (Sr. No.) can be customized
                                using the following pattern format:
                              </p>

                              <p>
                                <strong>Pattern Structure:</strong> 1/2/3A
                              </p>

                              <ul>
                                <li>
                                  <strong>1 → Prefix</strong> (e.g., ORD, INV,
                                  etc.)
                                </li>
                                <li>
                                  <strong>2 → Serial Number</strong>{" "}
                                  (auto-incremented number)
                                </li>
                                <li>
                                  <strong>3A → Full Financial Year</strong> (e.g.,
                                  2026-2027)
                                </li>
                                <li>
                                  <strong>3a → Short Year</strong> (e.g., 26-27)
                                </li>
                              </ul>

                              <h4>Customization Example</h4>

                              <p>
                                <strong>Pattern:</strong> 2/1/3A
                              </p>

                              <p>
                                <strong>Generated Serial Number:</strong>{" "}
                                <span style={{ color: "#007bff" }}>
                                  02/ORD/2026-2027
                                </span>
                              </p>

                              <p
                                style={{
                                  marginTop: "10px",
                                  fontSize: "14px",
                                  color: "#555",
                                }}
                              >
                                <strong>Note:</strong> The serial number is
                                automatically incremented and you can rearrange
                                the elements as per your business requirement.
                              </p>
                            </div>
                          )}
                        <Field
                          as={field.as || "input"}
                          type={field.type || "text"}
                          name={field.name}
                          className="form-control font-size-15 rounded-1"
                          rows={field.rows || 1}
                          placeholder={field.placeholder || ""}
                        />
                      </>
                    )}

                    <ErrorMessage
                      name={field.name}
                      component="div"
                      className="field-error text-danger mt-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div
            className="modal-buttons"
            style={{ paddingRight: "20px", paddingBottom: "20px" }}
          >
            <button className="modal-button1" type="button" onClick={onClose}>
              Close
            </button>

            {footerButtons.map((btn, idx) => (
              <button
                className="modal-button2"
                key={idx}
                type="button"
                onClick={btn.onClick}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyPrifixModal;
