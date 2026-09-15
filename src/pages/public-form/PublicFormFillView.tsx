import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { BACKEND_OF_SMALL_OFFICE_CRM_END_POINT } from "../../helpers/AppConstants";
import FormFieldsRenderer from "../left-side/header/Setting/form-builder/FormFieldsRenderer";
import { IFormBuilderField } from "../left-side/header/Setting/form-builder/FormBuilderController";

// Deliberately its own plain axios client, not the shared authenticated
// axiosInstance — a public visitor has no login, and this page shouldn't
// pick up whatever token/uuid happens to be sitting in this browser's
// localStorage from an unrelated logged-in session on the same machine
// (plan §7: "the API base... differ" between internal and public fill).
const publicClient = axios.create({
  baseURL: `${BACKEND_OF_SMALL_OFFICE_CRM_END_POINT}/api`,
  timeout: 30000,
});

// Modeled on pages/online-store/Form.tsx's no-auth company resolution
// (plan §7) — company/tenant is resolved server-side purely from the
// qrCode+shareToken URL params, no login context at all.
const PublicFormFillView: React.FC = () => {
  const { qrCode, shareToken } = useParams<{ qrCode: string; shareToken: string }>();
  const [fields, setFields] = useState<IFormBuilderField[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<{ key: string; file: File }[]>([]);
  const [submitterName, setSubmitterName] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [submitterPhone, setSubmitterPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await publicClient.post("public-form/schema", { qrCode, shareToken });
        if (data.ack === 1 && data.data?.item) {
          setTitle(data.data.item.title);
          setDescription(data.data.item.description || "");
          setFields(data.data.item.fields || []);
        } else {
          setErrorMsg(data.ack_msg || "This form is not available.");
        }
      } catch {
        setErrorMsg("This form is not available.");
      }
      setLoading(false);
    })();
  }, [qrCode, shareToken]);

  const handleChange = (key: string, value: any) => setAnswers((prev) => ({ ...prev, [key]: value }));
  const handleFile = (key: string, file: File | null) => {
    setFiles((prev) => {
      const rest = prev.filter((f) => f.key !== key);
      return file ? [...rest, { key, file }] : rest;
    });
  };
  const handleRepeaterFile = (repeaterKey: string, rowIndex: number, subKey: string, file: File | null) => {
    handleFile(`${repeaterKey}[${rowIndex}].${subKey}`, file);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setErrorMsg("");
    try {
      const fd = new FormData();
      fd.append("qrCode", qrCode || "");
      fd.append("shareToken", shareToken || "");
      fd.append("answers", JSON.stringify(answers));
      if (submitterName) fd.append("submitter_name", submitterName);
      if (submitterEmail) fd.append("submitter_email", submitterEmail);
      if (submitterPhone) fd.append("submitter_phone", submitterPhone);
      files.forEach((f) => fd.append(f.key, f.file, f.file.name));

      const { data } = await publicClient.post("public-form/submit", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (data.ack === 1) {
        setSubmitted(true);
      } else {
        setErrorMsg(data.ack_msg || "Something went wrong — please try again.");
      }
    } catch {
      setErrorMsg("Something went wrong — please try again.");
    }
    setSubmitting(false);
  };

  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (errorMsg && fields.length === 0) return <div className="p-4 text-center text-danger">{errorMsg}</div>;
  if (submitted) return <div className="p-4 text-center">Thank you — your response has been recorded.</div>;

  return (
    <div className="container p-4" style={{ maxWidth: 720 }}>
      <h3 className="mb-1">{title}</h3>
      {description ? <p className="text-muted mb-3">{description}</p> : null}
      {errorMsg ? <div className="alert alert-danger">{errorMsg}</div> : null}

      <div className="row">
        <div className="col-12 col-md-4">
          <div className="form-group">
            <label className="pb-2 form_label d-block">Your Name</label>
            <input className="form-control" value={submitterName} onChange={(e) => setSubmitterName(e.target.value)} />
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="form-group">
            <label className="pb-2 form_label d-block">Your Email</label>
            <input className="form-control" value={submitterEmail} onChange={(e) => setSubmitterEmail(e.target.value)} />
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="form-group">
            <label className="pb-2 form_label d-block">Your Phone</label>
            <input className="form-control" value={submitterPhone} onChange={(e) => setSubmitterPhone(e.target.value)} />
          </div>
        </div>
      </div>

      {/* No related-record picker here — public submissions are always
          standalone, enforced server-side regardless of what's rendered
          (plan §1/§4). */}
      <FormFieldsRenderer
        fields={fields}
        answers={answers}
        onChange={handleChange}
        onFile={handleFile}
        onRepeaterFile={handleRepeaterFile}
        fetchReferenceOptions={async (master, parentId) => {
          const { data } = await publicClient.post("public-form/reference-options", { qrCode, shareToken, master, parentId });
          return data?.data?.item || [];
        }}
      />

      <button type="button" className="btn btn-primary mt-3" disabled={submitting} onClick={handleSubmit}>
        {submitting ? "Submitting..." : "Submit"}
      </button>
    </div>
  );
};

export default PublicFormFillView;
