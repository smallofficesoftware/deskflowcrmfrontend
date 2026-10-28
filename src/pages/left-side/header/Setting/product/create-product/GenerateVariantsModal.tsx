import { FC, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { IProductCreate } from "./CreateProductController";
import { IVariantAttribute, IVariantRow } from "./ProductVariantSection";
import { createVariantProduct } from "./variantApi";

// Multi-variant products (plans/2026-10-18-product-variants-and-qty-pricing-plan.txt).
// Bulk "generate all combinations" tool: cartesian product of every attribute's
// values (e.g. 2 Colors x 3 Sizes = 6 rows), skipping combinations that already
// exist as variants. One shared rate to start from, editable per row before
// creating - avoids re-entering the same rate 6+ times for a typical case.

interface Combination {
  key: string;
  label: string;
  valueIds: number[];
  rate: string;
}

interface GenerateVariantsModalProps {
  show: boolean;
  onHide: () => void;
  parentProduct: IProductCreate & { id: number };
  attributes: IVariantAttribute[];
  existingVariants: IVariantRow[];
  onCreated: () => void;
}

const cartesianProduct = (attributes: IVariantAttribute[]): Combination[] => {
  const usable = attributes.filter((a) => a.values.length > 0);
  if (usable.length === 0) return [];

  let combos: { valueIds: number[]; labels: string[] }[] = [{ valueIds: [], labels: [] }];
  for (const attribute of usable) {
    const next: { valueIds: number[]; labels: string[] }[] = [];
    for (const combo of combos) {
      for (const value of attribute.values) {
        next.push({
          valueIds: [...combo.valueIds, value.id],
          labels: [...combo.labels, value.value],
        });
      }
    }
    combos = next;
  }

  return combos.map((c) => ({
    key: c.labels.join(" / "),
    label: c.labels.join(" / "),
    valueIds: c.valueIds,
    rate: "",
  }));
};

const GenerateVariantsModal: FC<GenerateVariantsModalProps> = ({
  show,
  onHide,
  parentProduct,
  attributes,
  existingVariants,
  onCreated,
}) => {
  const existingLabels = useMemo(
    () =>
      new Set(
        existingVariants.map((v) =>
          v.variant_options.map((o) => o.value).join(" / "),
        ),
      ),
    [existingVariants],
  );

  const allCombinations = useMemo(() => cartesianProduct(attributes), [attributes]);
  const newCombinations = useMemo(
    () => allCombinations.filter((c) => !existingLabels.has(c.key)),
    [allCombinations, existingLabels],
  );

  const [sharedRate, setSharedRate] = useState(parentProduct.rate || "0");
  const [rates, setRates] = useState<{ [key: string]: string }>({});
  const [sharedPurchaseRate, setSharedPurchaseRate] = useState(parentProduct.purchase_rate || "0");
  const [purchaseRates, setPurchaseRates] = useState<{ [key: string]: string }>({});
  const [creating, setCreating] = useState(false);
  const [progress, setProgress] = useState(0);

  if (!show) return null;

  const getUUID = localStorage.getItem("UUID");
  const rateFor = (combo: Combination) => rates[combo.key] ?? sharedRate;
  const purchaseRateFor = (combo: Combination) => purchaseRates[combo.key] ?? sharedPurchaseRate;

  const applySharedRateToAll = () => {
    setRates(Object.fromEntries(newCombinations.map((c) => [c.key, sharedRate])));
  };
  const applySharedPurchaseRateToAll = () => {
    setPurchaseRates(Object.fromEntries(newCombinations.map((c) => [c.key, sharedPurchaseRate])));
  };

  const onConfirm = async () => {
    if (newCombinations.length === 0) {
      onHide();
      return;
    }
    setCreating(true);
    setProgress(0);

    let successCount = 0;
    for (const combo of newCombinations) {
      const ok = await createVariantProduct(
        parentProduct,
        getUUID,
        combo.label,
        rateFor(combo),
        combo.valueIds,
        purchaseRateFor(combo),
      );
      if (ok) successCount += 1;
      setProgress((p) => p + 1);
    }

    setCreating(false);
    toast[successCount === newCombinations.length ? "success" : "warning"](
      `${successCount} of ${newCombinations.length} variants created`,
    );
    onCreated();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content_label" style={{ maxWidth: 760, textAlign: "left" }}>
        <h4 className="modal-title1 form_header_text">Generate All Combinations</h4>

        {allCombinations.length === 0 ? (
          <p className="text-muted">Add at least one attribute value first.</p>
        ) : (
          <>
            <div className="d-flex align-items-center gap-2 mb-2">
              <label className="mb-0">Default Sale Rate (before GST) for all:</label>
              <input
                type="number"
                className="form-control form-control-sm"
                style={{ width: 120 }}
                value={sharedRate}
                onChange={(e) => setSharedRate(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={applySharedRateToAll}
              >
                Apply to all
              </button>
            </div>
            <div className="d-flex align-items-center gap-2 mb-3">
              <label className="mb-0">Default Purchase Rate (before GST) for all:</label>
              <input
                type="number"
                className="form-control form-control-sm"
                style={{ width: 120 }}
                value={sharedPurchaseRate}
                onChange={(e) => setSharedPurchaseRate(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={applySharedPurchaseRateToAll}
              >
                Apply to all
              </button>
            </div>

            <div className="overflow-auto" style={{ maxHeight: "320px" }}>
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Combination</th>
                    <th style={{ width: 120 }}>Sale Rate (before GST)</th>
                    <th style={{ width: 120 }}>Purchase Rate (before GST)</th>
                  </tr>
                </thead>
                <tbody>
                  {allCombinations.map((combo) => {
                    const alreadyExists = existingLabels.has(combo.key);
                    return (
                      <tr key={combo.key} className={alreadyExists ? "text-muted" : ""}>
                        <td>
                          {combo.label}
                          {alreadyExists && <em> (already exists)</em>}
                        </td>
                        <td>
                          {!alreadyExists && (
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={rateFor(combo)}
                              onChange={(e) =>
                                setRates((prev) => ({ ...prev, [combo.key]: e.target.value }))
                              }
                            />
                          )}
                        </td>
                        <td>
                          {!alreadyExists && (
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={purchaseRateFor(combo)}
                              onChange={(e) =>
                                setPurchaseRates((prev) => ({ ...prev, [combo.key]: e.target.value }))
                              }
                            />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="text-muted mt-2 mb-0">
              {newCombinations.length} new variant{newCombinations.length === 1 ? "" : "s"} will
              be created
              {creating ? ` (${progress}/${newCombinations.length})` : ""}.
            </p>
          </>
        )}

        <div className="modal-buttons">
          <button type="button" className="modal-button1" onClick={onHide} disabled={creating}>
            Cancel
          </button>
          <button
            type="button"
            className="modal-button2"
            style={{ color: "white" }}
            onClick={onConfirm}
            disabled={creating || newCombinations.length === 0}
          >
            {creating ? "Creating..." : `Create ${newCombinations.length} Variant(s)`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenerateVariantsModal;
