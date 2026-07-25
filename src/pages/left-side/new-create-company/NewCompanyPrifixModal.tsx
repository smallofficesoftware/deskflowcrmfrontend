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
                                            <label
                                                htmlFor={field.name}
                                                className="pb-2 form-label"
                                            >
                                                {field.label}
                                            </label>
                                        )}

                                        <Field
                                            as={field.as || "input"}
                                            type={field.type || "text"}
                                            name={field.name}
                                            className="form-control font-size-15 rounded-1"
                                            rows={field.rows || 1}
                                            placeholder={field.placeholder || ""}
                                        />

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
                    <div className="modal-buttons"
                    style={{paddingRight:"20px",paddingBottom:"20px"}}>
                        <button
                        className="modal-button1"
                            type="button"
                            onClick={onClose}
                        >
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
