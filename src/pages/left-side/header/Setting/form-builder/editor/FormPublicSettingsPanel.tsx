import React, { useState } from "react";
import { toast } from "react-toastify";
import { QRCodeSVG } from "qrcode.react";
import { IFormBuilderForm, publicFormUrl } from "../FormBuilderController";
import { IFormSettings, parseSettings } from "../approval";

interface Props {
  form: IFormBuilderForm;
  onSettingsChange: (settings: IFormSettings) => void;
}

// Public form controls (plan items M3-M6): the thank-you page, open/close
// dates, an entry limit, one entry per mobile, an OTP check, and ways to
// share the link once it's enabled — a QR code, a WhatsApp message and an
// embed snippet for a website.
const FormPublicSettingsPanel: React.FC<Props> = ({ form, onSettingsChange }) => {
  const settings = parseSettings(form.settings_json);
  const p = settings.public || {};
  const url = publicFormUrl(form);
  const [showEmbed, setShowEmbed] = useState(false);

  const patch = (next: Partial<typeof p>) => onSettingsChange({ ...settings, public: { ...p, ...next } });

  const copy = (text: string, label: string) =>
    navigator.clipboard.writeText(text).then(
      () => toast.success(`${label} copied`),
      () => toast.error("Could not copy — copy it from the box"),
    );

  const embedSnippet = url ? `<iframe src="${url}" style="width:100%;height:800px;border:0"></iframe>` : "";
  const whatsappHref = url ? `https://wa.me/?text=${encodeURIComponent(`${form.title}\n${url}`)}` : "";

  if (!form.allow_public_submission) {
    return <small className="text-muted d-block">Enable the public link above to set thank-you page, open/close dates and sharing.</small>;
  }

  return (
    <div>
      <div className="form-group">
        <label className="pb-2 form_label d-block" htmlFor="fb-pub-thanks">
          Thank-you message
        </label>
        <textarea
          id="fb-pub-thanks"
          className="form-control"
          rows={2}
          maxLength={1000}
          placeholder="Thank you! We'll get back to you soon."
          value={p.thank_you_message || ""}
          onChange={(e) => patch({ thank_you_message: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label className="pb-2 form_label d-block" htmlFor="fb-pub-redirect">
          Or send them to a link instead (optional)
        </label>
        <input
          id="fb-pub-redirect"
          className="form-control"
          placeholder="https://example.com/thank-you"
          value={p.redirect_url || ""}
          onChange={(e) => patch({ redirect_url: e.target.value })}
        />
      </div>

      <div className="row">
        <div className="col-6">
          <div className="form-group">
            <label className="pb-2 form_label d-block" htmlFor="fb-pub-open">
              Opens on
            </label>
            <input id="fb-pub-open" type="date" className="form-control" value={p.open_date || ""} onChange={(e) => patch({ open_date: e.target.value || null })} />
          </div>
        </div>
        <div className="col-6">
          <div className="form-group">
            <label className="pb-2 form_label d-block" htmlFor="fb-pub-close">
              Closes on
            </label>
            <input id="fb-pub-close" type="date" className="form-control" value={p.close_date || ""} onChange={(e) => patch({ close_date: e.target.value || null })} />
          </div>
        </div>
      </div>
      <small className="text-muted d-block mb-3">Leave either empty for no limit.</small>

      <div className="form-group">
        <label className="pb-2 form_label d-block" htmlFor="fb-pub-max">
          Maximum number of entries
        </label>
        <input
          id="fb-pub-max"
          type="number"
          min={1}
          className="form-control"
          placeholder="No limit"
          value={p.max_entries ?? ""}
          onChange={(e) => patch({ max_entries: e.target.value === "" ? null : Math.max(1, Number(e.target.value)) })}
        />
      </div>

      <div className="form-check mb-2">
        <input
          id="fb-pub-one"
          type="checkbox"
          className="form-check-input"
          checked={!!p.one_per_mobile}
          onChange={(e) => patch({ one_per_mobile: e.target.checked })}
        />
        <label className="form-check-label" htmlFor="fb-pub-one">
          Only one entry per mobile number
        </label>
      </div>
      <div className="form-check mb-3">
        <input id="fb-pub-otp" type="checkbox" className="form-check-input" checked={!!p.require_otp} onChange={(e) => patch({ require_otp: e.target.checked })} />
        <label className="form-check-label" htmlFor="fb-pub-otp">
          Check the mobile number with a WhatsApp code before accepting
        </label>
        <small className="text-muted d-block">Needs a “Phone” field marked as the visitor's contact number.</small>
      </div>

      {url ? (
        <div className="form-group">
          <label className="pb-2 form_label d-block">Share this form</label>
          <div className="d-flex flex-wrap align-items-start" style={{ gap: 12 }}>
            <div className="p-2 bg-white border rounded text-center">
              <QRCodeSVG value={url} size={104} />
              <div className="mt-1">
                <button type="button" className="btn btn-sm btn-link p-0" onClick={() => copy(url, "Link")}>
                  Copy link
                </button>
              </div>
            </div>
            <div className="d-flex flex-column" style={{ gap: 6 }}>
              <a href={whatsappHref} target="_blank" rel="noreferrer" className="btn btn-sm fb-btn-outline-primary">
                <i className="pi pi-whatsapp" /> Share on WhatsApp
              </a>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setShowEmbed(!showEmbed)}>
                {showEmbed ? "Hide embed code" : "Get embed code for a website"}
              </button>
            </div>
          </div>
          {showEmbed ? (
            <div className="mt-2">
              <textarea className="form-control" rows={2} readOnly value={embedSnippet} onFocus={(e) => e.currentTarget.select()} />
              <button type="button" className="btn btn-sm btn-outline-secondary mt-1" onClick={() => copy(embedSnippet, "Embed code")}>
                Copy embed code
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default FormPublicSettingsPanel;
