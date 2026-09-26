import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { BACKEND_OF_SMALL_OFFICE_CRM_END_POINT } from "../../helpers/AppConstants";
import FormFieldsRenderer from "../left-side/header/Setting/form-builder/FormFieldsRenderer";
import { IFormBuilderField } from "../left-side/header/Setting/form-builder/FormBuilderController";
import { buildInitialAnswers } from "../left-side/header/Setting/form-builder/fieldTypes";
import { evaluateVisibility } from "../left-side/header/Setting/form-builder/conditions";
import { validateFormatPresets } from "../left-side/header/Setting/form-builder/formatPresets";
import { localizeFields } from "../left-side/header/Setting/form-builder/language";

// Deliberately its own plain axios client, not the shared authenticated
// axiosInstance — a public visitor has no login, and this page shouldn't
// pick up whatever token/uuid happens to be sitting in this browser's
// localStorage from an unrelated logged-in session on the same machine
// (plan §7: "the API base... differ" between internal and public fill).
const publicClient = axios.create({
  baseURL: `${BACKEND_OF_SMALL_OFFICE_CRM_END_POINT}/api`,
  timeout: 30000,
});

interface FormStatus {
  open: boolean;
  reason?: "not_open_yet" | "closed" | "full";
  message?: string;
}

// Lead source (plan M6): whichever the link carries — ?source= / ?utm_source=
// and ?campaign= / ?utm_campaign= — captured once on load, sent with the
// entry, never shown to the visitor.
function leadParamsFromUrl(): { source: string | null; campaign: string | null } {
  const q = new URLSearchParams(window.location.search);
  return {
    source: q.get("source") || q.get("utm_source") || null,
    campaign: q.get("campaign") || q.get("utm_campaign") || null,
  };
}

// Modeled on pages/online-store/Form.tsx's no-auth company resolution
// (plan §7) — company/tenant is resolved server-side purely from the
// qrCode+shareToken URL params, no login context at all.
const PublicFormFillView: React.FC = () => {
  const { qrCode, shareToken } = useParams<{ qrCode: string; shareToken: string }>();
  const [fields, setFields] = useState<IFormBuilderField[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<{ key: string; file: File }[]>([]);
  const [submitterName, setSubmitterName] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [submitterPhone, setSubmitterPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState<{ message: string; redirect_url: string | null } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<FormStatus>({ open: true });

  // Public form controls (plan M3, M5, M6).
  const [requireOtp, setRequireOtp] = useState(false);
  const [onePerMobile, setOnePerMobile] = useState(false);
  const [otpToken, setOtpToken] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [lead] = useState(leadParamsFromUrl);
  // Second language (plan M8).
  const [languageName, setLanguageName] = useState<string | null>(null);
  const [showSecondLanguage, setShowSecondLanguage] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await publicClient.post("public-form/schema", { qrCode, shareToken });
        if (data.ack === 1 && data.data?.item) {
          setTitle(data.data.item.title);
          setDescription(data.data.item.description || "");
          setStatus(data.data.item.status || { open: true });
          setRequireOtp(!!data.data.item.require_otp);
          setOnePerMobile(!!data.data.item.one_per_mobile);
          setLanguageName(data.data.item.language || null);
          const list: IFormBuilderField[] = data.data.item.fields || [];
          setFields(list);
          // Public fill always starts a new submission, so defaults apply.
          setAnswers(buildInitialAnswers(list));
        } else {
          setErrorMsg(data.ack_msg || "This form is not available.");
        }
      } catch {
        setErrorMsg("This form is not available.");
      }
      setLoading(false);
    })();
  }, [qrCode, shareToken]);

  const handleChange = (key: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };
  const handleFile = (key: string, file: File | null) => {
    setFiles((prev) => {
      const rest = prev.filter((f) => f.key !== key);
      return file ? [...rest, { key, file }] : rest;
    });
  };
  const handleRepeaterFile = (repeaterKey: string, rowIndex: number, subKey: string, file: File | null) => {
    handleFile(`${repeaterKey}[${rowIndex}].${subKey}`, file);
  };

  const sendOtp = async () => {
    if (!submitterPhone.trim()) {
      setErrorMsg("Enter your mobile number first.");
      return;
    }
    setSendingOtp(true);
    setErrorMsg("");
    try {
      const { data } = await publicClient.post("public-form/send-otp", { qrCode, shareToken, mobile: submitterPhone });
      if (data.ack === 1) {
        setOtpToken(data.data?.token || "");
        setOtpSent(true);
      } else {
        setErrorMsg(data.ack_msg || "Couldn't send the code. Please try again.");
      }
    } catch {
      setErrorMsg("Couldn't send the code. Please try again.");
    }
    setSendingOtp(false);
  };

  const handleSubmit = async () => {
    if (requireOtp && !submitterPhone.trim()) {
      setErrorMsg("Enter your mobile number.");
      return;
    }
    if (requireOtp && (!otpSent || !otpCode.trim())) {
      setErrorMsg("Send and enter the code from WhatsApp first.");
      return;
    }
    // Fields hidden by a "show only when" rule are not checked.
    const visibleKeys = evaluateVisibility(fields, answers);
    const formatErrors = validateFormatPresets(
      fields.filter((f) => !f.key || visibleKeys.has(f.key)),
      answers,
      { newEntry: true },
    );
    setFieldErrors(formatErrors);
    if (Object.keys(formatErrors).length) {
      setErrorMsg("Please correct the highlighted fields.");
      return;
    }
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
      if (lead.source) fd.append("source", lead.source);
      if (lead.campaign) fd.append("campaign", lead.campaign);
      if (requireOtp) {
        fd.append("otp_token", otpToken);
        fd.append("otp_code", otpCode);
      }
      files.forEach((f) => fd.append(f.key, f.file, f.file.name));

      const { data } = await publicClient.post("public-form/submit", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (data.ack === 1) {
        const redirect = data.data?.item?.redirect_url || null;
        setSubmitted({ message: data.ack_msg || "Thank you — your response has been recorded.", redirect_url: redirect });
        if (redirect) window.location.href = redirect;
      } else {
        setErrorMsg(data.ack_msg || "Something went wrong — please try again.");
        // A wrong code hands back a fresh, attempt-counted token to retry with.
        const nextToken = data.data?.item?.otp_token;
        if (nextToken) {
          setOtpToken(nextToken);
          setOtpCode("");
        }
      }
    } catch {
      setErrorMsg("Something went wrong — please try again.");
    }
    setSubmitting(false);
  };

  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (!status.open) {
    return (
      <div className="p-4 text-center">
        <h5 className="mb-2">{title || "This form"}</h5>
        <p className="text-muted">{status.message || "This form isn't accepting entries right now."}</p>
      </div>
    );
  }
  if (errorMsg && fields.length === 0) return <div className="p-4 text-center text-danger">{errorMsg}</div>;
  if (submitted) return <div className="p-4 text-center">{submitted.redirect_url ? "Redirecting…" : submitted.message}</div>;

  return (
    <div className="container px-3 py-3 px-md-4 py-md-4" style={{ maxWidth: 720 }}>
      <div className="d-flex justify-content-between align-items-start">
        <h3 className="mb-1 text-break">{title}</h3>
        {languageName ? (
          <button type="button" className="btn btn-sm btn-outline-secondary flex-shrink-0 ms-2" onClick={() => setShowSecondLanguage((v) => !v)}>
            {showSecondLanguage ? "English" : languageName}
          </button>
        ) : null}
      </div>
      {description ? <p className="text-muted mb-3">{description}</p> : null}
      {errorMsg ? <div className="alert alert-danger">{errorMsg}</div> : null}

      <div className="row fb-fill">
        <div className="col-12 col-md-4">
          <div className="form-group">
            <label className="pb-2 form_label d-block">Your Name</label>
            <input className="form-control" autoComplete="name" value={submitterName} onChange={(e) => setSubmitterName(e.target.value)} />
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="form-group">
            <label className="pb-2 form_label d-block">Your Email</label>
            <input
              className="form-control"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={submitterEmail}
              onChange={(e) => setSubmitterEmail(e.target.value)}
            />
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="form-group">
            <label className="pb-2 form_label d-block">
              Your Phone{requireOtp ? <span className="text-danger"> *</span> : null}
            </label>
            <div className="d-flex" style={{ gap: 6 }}>
              <input
                className="form-control"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={submitterPhone}
                onChange={(e) => {
                  setSubmitterPhone(e.target.value);
                  setOtpSent(false);
                  setOtpToken("");
                  setOtpCode("");
                }}
              />
              {requireOtp ? (
                <button type="button" className="btn btn-sm btn-outline-secondary text-nowrap" disabled={sendingOtp || !submitterPhone.trim()} onClick={sendOtp}>
                  {sendingOtp ? "Sending…" : otpSent ? "Resend" : "Send code"}
                </button>
              ) : null}
            </div>
            {onePerMobile ? <small className="text-muted">Only one entry is allowed per mobile number.</small> : null}
          </div>
        </div>
        {requireOtp && otpSent ? (
          <div className="col-12 col-md-4">
            <div className="form-group">
              <label className="pb-2 form_label d-block">Code from WhatsApp</label>
              <input className="form-control" inputMode="numeric" maxLength={6} value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))} />
            </div>
          </div>
        ) : null}
      </div>

      {/* No related-record picker here — public submissions are always
          standalone, enforced server-side regardless of what's rendered
          (plan §1/§4). */}
      <FormFieldsRenderer
        fields={localizeFields(fields, showSecondLanguage)}
        answers={answers}
        errors={fieldErrors}
        newEntry
        isPublic
        onChange={handleChange}
        onFile={handleFile}
        onRepeaterFile={handleRepeaterFile}
        fetchReferenceOptions={async (master, parentId) => {
          const { data } = await publicClient.post("public-form/reference-options", { qrCode, shareToken, master, parentId });
          return data?.data?.item || [];
        }}
      />

      {/* Sticks to the bottom of the screen on phones (FillResponsiveStyles). */}
      <div className="fb-submit-bar">
        <button type="button" className="btn btn-primary mt-3" disabled={submitting} onClick={handleSubmit}>
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </div>
    </div>
  );
};

export default PublicFormFillView;
