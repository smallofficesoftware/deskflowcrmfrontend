import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import { BIG_TEXT_LENGTH, DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../../helpers/AppConstants";
import { PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import { TReactSetState } from "../../../../../helpers/AppType";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import {
  createAttributeMasterApi,
  createAttributeValueMasterApi,
  deleteAttributeValueMasterApi,
  fetchAttributeMastersApi,
  IAttributeMasterView,
  updateAttributeMasterApi,
} from "./AttributeMasterController";

interface IPropsCreateAttributeMaster {
  show: boolean;
  onHide: () => void;
  headerName: string;
  attributeToEdit: IAttributeMasterView | undefined;
  setLoading: TReactSetState<boolean>;
  handleRefresh: () => void;
}

/** Create/edit one attribute master and manage its values inline - mirrors
 * CreateUnitView.tsx's modal, plus the value-badge editor also used (per-product) in
 * ProductVariantSection.tsx. The values list only applies once the attribute itself is
 * saved (needs a real id), same reasoning as variants needing a saved parent product. */
const CreateAttributeMasterView = ({
  show,
  onHide,
  headerName,
  attributeToEdit,
  setLoading,
  handleRefresh,
}: IPropsCreateAttributeMaster) => {
  const [attributeName, setAttributeName] = useState("");
  const [nameError, setNameError] = useState("");
  const [savedId, setSavedId] = useState<number | undefined>(attributeToEdit?.id);
  const [values, setValues] = useState(attributeToEdit?.values || []);
  const [newValueInput, setNewValueInput] = useState("");

  const canAdd = useCheckUserPermission("attribute_master", PERMISSION_TYPE.ADD);

  useEffect(() => {
    if (attributeToEdit) {
      setAttributeName(attributeToEdit.attribute_name);
      setSavedId(attributeToEdit.id);
      setValues(attributeToEdit.values || []);
    }
  }, []);

  const refetchThisAttribute = async (id: number) => {
    await new Promise<void>((resolve) => {
      fetchAttributeMastersApi(
        (list: any) => {
          const updated = (list as IAttributeMasterView[]).find((a) => a.id === id);
          if (updated) setValues(updated.values);
          resolve();
        },
        () => {}
      );
    });
  };

  const handleSubmit = async () => {
    if (!attributeName.trim()) {
      setNameError("Attribute name is required");
      return;
    }
    setNameError("");

    if (savedId) {
      await updateAttributeMasterApi(savedId, attributeName.trim(), setLoading, () => {
        handleRefresh();
      });
      return;
    }

    if (!canAdd) {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
      return;
    }

    // Keep this modal open, switched into edit-mode-in-place, so values can be
    // added right away - same "don't close, just saved" pattern used for product
    // variants in CreateProductView.tsx.
    await createAttributeMasterApi(attributeName.trim(), setLoading, (newId) => {
      handleRefresh();
      if (newId) setSavedId(newId);
    });
  };

  const addValue = async () => {
    if (!savedId) return;
    const value = newValueInput.trim();
    if (!value) return;
    await createAttributeValueMasterApi(savedId, value, async () => {
      setNewValueInput("");
      await refetchThisAttribute(savedId);
      handleRefresh();
    });
  };

  const removeValue = async (id: number) => {
    await deleteAttributeValueMasterApi(id, async () => {
      if (savedId) await refetchThisAttribute(savedId);
      handleRefresh();
    });
  };

  useEscapeKey(onHide);

  return (
    <React.Fragment>
      {show && (
        <div className="modal1">
          <div className="modal-content1" style={{ width: "40%" }}>
            <span className="close" onClick={onHide}>
              &times;
            </span>
            <h2 className="modal-title1 form_header_text">{headerName}</h2>

            <div className="head" style={{ display: "block", marginLeft: "20px" }}>
              <label className="form-check-label">
                <h6>
                  Attribute Name
                  <span className="text-danger">*</span>
                </h6>
              </label>
              <div className="col-12 d-flex">
                <div className="search-bar">
                  <div className="add-source-of-type-section">
                    <input
                      type="text"
                      maxLength={BIG_TEXT_LENGTH}
                      placeholder="e.g. Color, Size"
                      value={attributeName}
                      onChange={(e) => {
                        setAttributeName(e.target.value);
                        if (e.target.value.trim()) setNameError("");
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="col-12">
                {nameError && <span className="text-danger">{nameError}</span>}
              </div>
            </div>

            {savedId && (
              // Same left margin and field style as the Attribute Name block above, so the popup reads as one form.
              <div className="head" style={{ display: "block", marginLeft: "20px", marginTop: "16px" }}>
                <label className="form-check-label">
                  <h6>Values</h6>
                </label>
                {values.length > 0 ? (
                  <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                    {values.map((v) => (
                      <span
                        key={v.id}
                        className="d-inline-flex align-items-center gap-1"
                        style={{ background: "#f1f3f5", border: "1px solid #dee2e6", borderRadius: 16, padding: "3px 6px 3px 12px", fontSize: 14 }}
                      >
                        {v.value}
                        <button
                          type="button"
                          aria-label={`Remove ${v.value}`}
                          title="Remove"
                          style={{ border: "none", background: "none", color: "#dc3545", fontSize: 18, lineHeight: 1, padding: "0 4px", cursor: "pointer" }}
                          onClick={() => removeValue(v.id)}
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted small mb-3">No values yet.</div>
                )}
                <div className="d-flex align-items-center gap-2" style={{ marginRight: "20px" }}>
                  <div className="search-bar flex-grow-1">
                    <div className="add-source-of-type-section">
                      <input
                        type="text"
                        maxLength={BIG_TEXT_LENGTH}
                        placeholder="Add value (e.g. Red, Large)"
                        value={newValueInput}
                        onChange={(e) => setNewValueInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addValue()}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn px-4 text-light rounded-1"
                    style={{ backgroundColor: "#f58634", height: 38, whiteSpace: "nowrap" }}
                    onClick={addValue}
                    disabled={!newValueInput.trim()}
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            <div className="col-12 pt-4 pe-3 d-flex justify-content-end modal-buttons">
              <button className="modal-button1" onClick={onHide} type="button">
                Close
              </button>
              {!savedId && (
                <button
                  type="submit"
                  className="btn btn-primary px-4 py-2 ms-2 text-light form_label rounded-1"
                  onClick={handleSubmit}
                  style={{ backgroundColor: "#f58634" }}
                >
                  Create
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

export default CreateAttributeMasterView;
