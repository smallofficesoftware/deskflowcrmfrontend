import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import CustomSearchDropdown from "../../../../../../../components/CustomSearchDropdown";
import { IProductView } from "../../ProductController";
import { createBom, fetchProductUnit, getBomDetails, IBomForm } from "./BomDetailsController";

interface IPropsBOM {
  show: boolean;
  onHide: () => void;
  product: IProductView;
  setIsBomAvailable: (val: boolean) => void;
  handleBomId: (data: any) => void;
}

const BomDetailsView = ({
  show,
  onHide,
  product,
  setIsBomAvailable,
  handleBomId
}: IPropsBOM) => {
  const [isProductUnitList, isSetProductUnitList] = useState<any>([]);
  const [probableBOMData, setProbableBOMData] = useState<object>({});

  const [formData, setFormData] = useState<IBomForm>({
    bom_name: "",
    qty: "",
    unit: "",
    bom_review_frequency: "",
    bom_document: null,
    bom_drawing: null,
  });

  useEffect(() => {
    fetchProductUnit(isSetProductUnitList);
  }, []);

  useEffect(() => {
    if (product?.id) {
      getBomDetails(setProbableBOMData, product.id);
    }
  }, [product?.id]);

  handleBomId((probableBOMData as any)?.id);

  useEffect(() => {
    if (product?.product_name) {
      setFormData((prev) => ({
        ...prev,
        bom_name: `${product.product_name} - BOM`,
      }));
    }
  }, [product]);



  const handleSubmit = async () => {

    if (formData.bom_document) {
      const allowedTypes = [
        "application/pdf",
      ];

      const maxSize = 10 * 1024 * 1024;

      if (!allowedTypes.includes(formData.bom_document.type)) {
        toast.error("Only PDF files are allowed");
        return;
      }

      if (formData.bom_document.size > maxSize) {
        toast.error("File size must be less than 10MB");
        return;
      }
    }

    if (formData.bom_drawing) {
      const allowedTypes = [
        "application/pdf",
      ];

      const maxSize = 10 * 1024 * 1024;

      if (!allowedTypes.includes(formData.bom_drawing.type)) {
        toast.error("Only PDF files are allowed");
        return;
      }

      if (formData.bom_drawing.size > maxSize) {
        toast.error("File size must be less than 10MB");
        return;
      }
    }

    const success = await createBom(formData, product.id);
    // handleRefresh();
    onHide();
  };

  const handleChange = (e: any) => {
    const { name, value, files } = e.target;

    if (files) {
      setFormData((prev) => ({
        ...prev,
        [name]: files[0],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const productUnitOptions = useMemo(() => {
    return isProductUnitList.map((item: any) => ({
      value: Number(item.id),
      label: item.unit,
    }));
  }, [isProductUnitList]);


  const frequencyDropdownOptions = [
    { label: "Weekly", value: 1 },
    { label: "Monthly", value: 2 },
    { label: "Half Yearly", value: 3 },
    { label: "Yearly", value: 4 },
  ];

  useEffect(() => {
    if (product?.unit && productUnitOptions.length > 0) {
      const selectedUnit = productUnitOptions.find(
        (opt: any) => opt.label === product.unit
      );

      if (selectedUnit && formData.unit !== selectedUnit.value) {
        setFormData((prev) => ({
          ...prev,
          unit: selectedUnit.value,
        }));
      }
    }
  }, [product, productUnitOptions]);

  useEffect(() => {
    if (probableBOMData && Object.keys(probableBOMData).length > 0) {
      setFormData((prev) => ({
        ...prev,
        bom_name: (probableBOMData as any)?.bom_name || "",
        qty: (probableBOMData as any)?.qty || "",
        unit: (probableBOMData as any)?.unit || "",
        bom_review_frequency: (probableBOMData as any)?.bom_review_frequency || "",
      }));
      setIsBomAvailable(true);
    } else {
      setIsBomAvailable(false);
    }
  }, [probableBOMData]);

  return (
    <>
      {show && (
        <div style={{
          padding: "15px",
          fontSize: "15px"
        }}>
          <div className="d-flex w-100" style={{ padding: "0 10px 0 10px" }}>
            <div className="w-50 h-100 d-flex flex-column gap-3" style={{ padding: "0 10px 0 10px" }}>
              {(probableBOMData as any)?.bom_number && (
                <span>
                  <b>BOM Number</b>
                  <span style={{ marginLeft: "10px" }}> - </span>
                  {(probableBOMData as any)?.bom_number}
                </span>
              )}
              <span><b>Item Name</b><span style={{ marginLeft: "28px" }}> - </span>{product.product_name}</span>
              <span><b>Item Code</b><span style={{ marginLeft: "35px" }}> - </span>{product.product_code}</span>
              <span><b>Item Category</b> - {product.category_name}</span>
              <span><b>Item Group</b><span style={{ marginLeft: "26px" }}> - </span>{product.group_name}</span>
            </div>
            <div className="d-flex justify-content-center w-50 h-100">
              {product?.product_img && (
                <img src={product.product_img} alt="product" style={{
                  width: "150px",
                  height: "150px",
                  objectFit: "cover",
                  borderRadius: "10px"
                }} />
              )}
            </div>
          </div>
          <hr />
          <form>
            <div className="row mx-0 gy-3 d-flex ">
              {/* <div className="mb-3 col-6">
                <div className="form-group">
                  <label htmlFor="bom_number" className="mb-1 form_label">
                    <b>BOM Number</b>
                  </label>
                  <input
                    style={{ height: "38px" }}
                    type="text"
                    className="form-control"
                    name="bom_number"
                    value={formData.bom_number}
                    onChange={handleChange}
                  />
                </div>
              </div> */}
              <div className="mb-3 col-6">
                <label className="form-label">
                  <b>BOM Name</b>
                </label>
                <input
                  style={{ height: "38px" }}
                  type="text"
                  className="form-control"
                  name="bom_name"
                  value={formData.bom_name}
                  onChange={handleChange}
                />
              </div>
              <div className="mb-3 col-6">
                <label className="form-label">
                  <b>QTY</b>
                </label>
                <input
                  style={{ height: "38px" }}
                  type="text"
                  className="form-control"
                  name="qty"
                  value={formData.qty}
                  onChange={handleChange}
                  onInput={(
                    e: React.ChangeEvent<HTMLInputElement>,
                  ) => {
                    e.target.value = e.target.value.replace(
                      /[^0-9.]/g,
                      "",
                    );
                    if (
                      (e.target.value.match(/\./g) || [])
                        .length > 1
                    ) {
                      e.target.value = e.target.value.slice(
                        0,
                        -1,
                      );
                    }
                  }}
                />
              </div>
              <div className="mb-3 col-6">
                <label className="form-label">
                  <b>Unit</b>
                </label>
                <CustomSearchDropdown
                  options={productUnitOptions}
                  value={
                    productUnitOptions.find(
                      (option: any) => option.value === Number(formData.unit)
                    ) || null
                  }
                  onChange={(selectedOption: any) => {
                    setFormData((prev) => ({
                      ...prev,
                      unit: selectedOption?.value || "",
                    }));
                  }}
                  className="w-100"
                  placeholder="Select Unit"
                />
              </div>
              <div className="mb-3 col-6">
                <label className="form-label">
                  <b>BOM Review Frequency</b>
                </label>
                <CustomSearchDropdown
                  options={frequencyDropdownOptions}
                  value={
                    frequencyDropdownOptions.find(
                      (option) => option.value === Number(formData.bom_review_frequency)
                    ) || null
                  }
                  onChange={(selectedOption: any) => {
                    setFormData((prev) => ({
                      ...prev,
                      bom_review_frequency: selectedOption?.value || "",
                    }));
                  }}
                  className="w-100 custom-dropdown"
                  placeholder="Select Frequency"
                />
              </div>
              <div className="mb-3 col-6">
                <label className="form-label">
                  <b>BOM Document</b>
                  <span className="text-danger" style={{ fontSize: "0.85rem" }}>  (Only PDF files allowed)(Max size: 10 MB)</span>
                </label>
                <input
                  style={{ height: "38px" }}
                  type="file"
                  className="form-control"
                  name="bom_document"
                  onChange={handleChange}
                  accept=".pdf"
                />
                {(probableBOMData as any)?.bom_document && (
                  <div className="mt-2">
                    <a
                      href={(probableBOMData as any).bom_document}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#0A58CA",
                        fontWeight: "500",
                        textDecoration: "underline",
                        cursor: "pointer"
                      }}
                    >
                      View BOM Document
                    </a>
                  </div>
                )}
              </div>
              <div className="mb-3 col-6">
                <label className="form-label">
                  <b>BOM Drawing</b>
                  <span className="text-danger" style={{ fontSize: "0.85rem" }}>  (Only PDF files allowed)(Max size: 10 MB)</span>
                </label>
                <input
                  style={{ height: "38px" }}
                  type="file"
                  className="form-control"
                  name="bom_drawing"
                  onChange={handleChange}
                  accept=".pdf"
                />
                {(probableBOMData as any)?.bom_drawing && (
                  <div className="mt-2">
                    <a
                      href={(probableBOMData as any).bom_drawing}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#0A58CA",
                        fontWeight: "500",
                        textDecoration: "underline",
                        cursor: "pointer"
                      }}
                    >
                      View BOM Drawing
                    </a>
                  </div>
                )}
              </div>

            </div>
            <div
              className="d-flex justify-content-end gap-2"
            >
              <button
                type="button"
                className="modal-button1 rounded-1 px-4 py-2 ms-2"
                onClick={onHide}
                style={{
                  border: "1px solid #f58634",
                  color: "#f58634",
                  background: "transparent"
                }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="btn btn-primary px-4 py-2 ms-2  text-light form_label rounded-1"
                style={{
                  backgroundColor: "#f58634",

                }}
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
};

export default BomDetailsView;
