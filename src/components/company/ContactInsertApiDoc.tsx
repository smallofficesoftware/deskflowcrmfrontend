import React from "react";
import { Field, ErrorMessage } from "formik";

interface ContactInsertApiDocProps {
  name: string;
  label: string;
  imageSrc: string;
  copyValue?: string;
  onCopy?: (value: string) => void;
  rows?: number;
}

const ContactInsertApiDoc: React.FC<ContactInsertApiDocProps> = ({
  name,
  label,
  imageSrc,
  copyValue,
  onCopy,
  rows = 10,
}) => {
  return (
    <div className="col-12">
      <div className="form-group mb-3">
        <div className="d-flex align-items-center">
          {/* Image */}
          <div className="me-4">
            <img
              src={imageSrc}
              alt={`${name}_image`}
              style={{
                height: "11vh",
                width: "20vh",
                objectFit: "contain",
                marginLeft: "20px",
              }}
            />
          </div>

          {/* Textarea */}
          <div style={{ width: "45%" }} className="ms-5">
            <label htmlFor={name} className="form_label">
              {label}
            </label>

            <div className="input-group">
              <Field
                as="textarea"
                name={name}
                rows={rows}
                className="form-control bg-light border-start-0"
              />
            </div>
          </div>

          {/* Copy Button */}
          {onCopy && copyValue && (
            <button
              type="button"
              className="btn btn-outline-secondary ms-5"
              title="Copy API"
              onClick={() => onCopy(copyValue)}
            >
              <i className="bi bi-copy"></i> Copy
            </button>
          )}
        </div>

        <ErrorMessage
          name={name}
          component="div"
          className="field-error text-danger mt-1"
        />
      </div>
    </div>
  );
};

export default ContactInsertApiDoc;
