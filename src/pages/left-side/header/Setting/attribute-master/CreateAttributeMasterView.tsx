import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import { BIG_TEXT_LENGTH, DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
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

  const canAdd = useCheckUserPermission(PAGE_ID.ATTRIBUTE_MASTER, PERMISSION_TYPE.ADD);

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
              <div className="px-3 mt-3">
                <h6>Values</h6>
                <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                  {values.map((v) => (
                    <span key={v.id} className="badge bg-light text-dark border">
                      {v.value}{" "}
                      <button
                        type="button"
                        className="btn btn-sm p-0 ms-1 text-danger"
                        style={{ border: "none", background: "none" }}
                        onClick={() => removeValue(v.id)}
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
                <div className="d-flex align-items-center gap-2">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    style={{ width: 180 }}
                    placeholder="Add value"
                    value={newValueInput}
                    onChange={(e) => setNewValueInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addValue()}
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={addValue}
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
