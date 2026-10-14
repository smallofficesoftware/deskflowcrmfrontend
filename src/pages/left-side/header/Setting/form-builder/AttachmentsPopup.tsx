import React, { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import { BACKEND_OF_SMALL_OFFICE_CRM_END_POINT } from "../../../../../helpers/AppConstants";
import { getSubmission } from "./FormBuilderController";

interface SavedFile {
  id: number;
  field_key: string;
  file_type: string;
  original_file_name: string;
  file_path: string;
  mime_type?: string;
}

// Saved files are served from the backend's media-folder.
const fileUrl = (file: SavedFile) => `${(BACKEND_OF_SMALL_OFFICE_CRM_END_POINT || "").replace(/\/$/, "")}/${file.file_path}`;

const isImage = (f: SavedFile) => f.file_type === "image" || f.file_type === "signature" || (f.mime_type || "").startsWith("image/");

interface Props {
  formId: number;
  submissionId: number;
  fieldKey: string;
  fieldLabel: string;
  onClose: () => void;
}

// The grid's paperclip cell opens this: the files of ONE field on ONE entry,
// each a link that opens in a new tab (images get a small preview). The
// server already hides files from people who can't see the field.
const AttachmentsPopup: React.FC<Props> = ({ formId, submissionId, fieldKey, fieldLabel, onClose }) => {
  const [files, setFiles] = useState<SavedFile[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSubmission(formId, submissionId).then((res: any) => {
      if (cancelled) return;
      const all: SavedFile[] = res?.ack === 1 ? res.data?.item?._files || [] : [];
      setFiles(all.filter((f) => f.field_key === fieldKey));
    });
    return () => {
      cancelled = true;
    };
  }, [formId, submissionId, fieldKey]);

  return (
    <Modal show onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>{fieldLabel}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {files === null ? (
          <span className="text-muted">Loading…</span>
        ) : files.length === 0 ? (
          <span className="text-muted">No files.</span>
        ) : (
          <ul className="list-unstyled mb-0">
            {files.map((f) => (
              <li key={f.id} className="d-flex align-items-center py-2 border-bottom" style={{ gap: 10 }}>
                {isImage(f) ? (
                  <a href={fileUrl(f)} target="_blank" rel="noreferrer">
                    <img src={fileUrl(f)} alt={f.original_file_name} style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6, border: "1px solid #dee2e6" }} />
                  </a>
                ) : (
                  <span style={{ fontSize: 24 }}>📄</span>
                )}
                <a href={fileUrl(f)} target="_blank" rel="noreferrer" className="text-truncate" title={f.original_file_name}>
                  {f.original_file_name}
                </a>
              </li>
            ))}
          </ul>
        )}
      </Modal.Body>
      <Modal.Footer>
        <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>
          Close
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default AttachmentsPopup;
