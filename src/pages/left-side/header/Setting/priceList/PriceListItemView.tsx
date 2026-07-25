import React, { useEffect, useState } from "react";

import {
  createPriceListItem,
  createPriceListThroughCategory,
  fetchCategoryApiForPriceListItem,
  fetchPriceListItemApi,
  fetchProductApiForPriceListItem,
  handleDeletePriceListItem,
  IPriceListItemView,
  updatePriceListItem,
} from "./PriceListItemController";

import { SingleValue } from "react-select";
import { toast } from "react-toastify";
import { formatDateAndTime } from "../../../../../common/SharedFunction";
import CustomSearchDropdown from "../../../../../components/CustomSearchDropdown";
import AddCategoryModal from "../../../../../components/model/AddCategoryModal";
import ConfirmationModal from "../../../../../components/model/ConfirmationModal";
import ImportExcelForContactModal from "../../../../../components/model/ImportExcelForContactModal";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import { TOnChangeInput } from "../../../../../helpers/AppType";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import CreateProductView from "../product/create-product/CreateProductView";
import { IPriceListView } from "./PriceListController";
interface ICategoryList {
  id: number | string;
  category_name: string;
}
const PriceListItemView = ({
  show,
  onHide,
  title,
  btn1 = "yes",
  btn2 = "no",
  passDataInAddItem,
}: {
  show: boolean;
  onHide: () => void;
  title: string;
  btn1: string;
  btn2: string;
  passDataInAddItem: IPriceListView | undefined;
}) => {
  useEffect(() => {
    const handleKeyDown = (event: any) => {
      if (event.key === "Enter") {
        event.preventDefault(); // Prevent default behavior for Enter key
      }
    };

    if (show) {
      document.addEventListener("keydown", handleKeyDown);
    } else {
      document.removeEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [show]);

  const [productList, setProductList] = useState<any>([]);
  const [gstFromProduct, setGstFromProduct] = useState<any>();
  const [netRateFromProduct, setNetRateFromProduct] = useState<number>(0);
  const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
  const [selectedProductId, setSelectProductId] = useState<any>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [rateInput, setRateInput] = useState<number>(0);
  const [discountInput, setDiscountInput] = useState<number>(0);
  const [discountDisplayValue, setDiscountDisplayValue] = useState<string>("");
  const [netRateInput, setNetRateInput] = useState<number>(0);
  const [netRateInput1, setNetRateInput1] = useState<number>();
  const [priceListLists, setPriceListItem] = useState<IPriceListItemView[]>([]);
  const [productError, setproductError] = useState("");
  const [editPriceListItemId, setEditPriceListItemId] = useState<
    number | undefined
  >(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false); // State to track request status

  const [categoryList, setCategoryList] = useState<ICategoryList[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<any>(false);
  const [categoryError, setCategoryError] = useState("");
  const [discountDisplayValueRefCat, setDiscountDisplayValueRefCat] = useState<string>("");
  const [discountInputRefCat, setDiscountInputRefCat] = useState<number>(0);
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false); // State to track request status
  const [isOpenCreateModel, setIsCreateModel] = useState(false);
  const [refreshProduct, setRefreshProduct] = useState(false);
  const [isOpenAddProductCategoryModal, setIsOpenAddProductCategoryModal] = useState(false)
  const [discountTypeProduct, setDiscountTypeProduct] = useState<"percentage" | "flat">("percentage");
  const [discountTypeCategory, setDiscountTypeCategory] = useState<"percentage" | "flat">("percentage");
  const [discountAmountProduct, setDiscountAmountProduct] = useState(0);

  const canViewProduct = useCheckUserPermission(
    PAGE_ID.PRODUCT,
    PERMISSION_TYPE.VIEW
  );
  const canAdd = useCheckUserPermission(
    PAGE_ID.PRICE_LIST_ITEM,
    PERMISSION_TYPE.ADD
  );

  const canEdit = useCheckUserPermission(
    PAGE_ID.PRICE_LIST_ITEM,
    PERMISSION_TYPE.EDIT
  );
  const canDelete = useCheckUserPermission(
    PAGE_ID.PRICE_LIST_ITEM,
    PERMISSION_TYPE.DELETE
  );

  const canViewCategory = useCheckUserPermission(
    PAGE_ID.CATEGORY,
    PERMISSION_TYPE.VIEW
  );

  const canAddProduct = useCheckUserPermission(
    PAGE_ID.PRODUCT,
    PERMISSION_TYPE.ADD
  );
  const canAddProductCategory = useCheckUserPermission(
    PAGE_ID.CATEGORY,
    PERMISSION_TYPE.ADD
  );

  useEffect(() => {
    if (refreshProduct) {
      fetchProductApiForPriceListItem(setProductList);
    }
  }, [refreshProduct])

  useEffect(() => {
    if (canViewProduct) {
      fetchProductApiForPriceListItem(setProductList);
    }
    if (canViewCategory) {
      fetchCategoryApiForPriceListItem(setCategoryList);
    }
    fetchPriceListItemApi(setPriceListItem, passDataInAddItem?.id);
    // }
  }, [passDataInAddItem?.id, canViewProduct, canViewCategory]);
  const productOptions = productList.map((category: any) => ({
    value: category.id,
    label: category.product_code
      ? `${category.product_name} (${category.product_code})`
      : category.product_name,

    netRate: category.rate,
    gst: category.GST,
  }));
  const categoryOptions = categoryList.map((category: ICategoryList) => ({
    value: category.id,
    label: category.category_name,
  }));
  const calculateNetRate = (
    rate: number,
    discount: number,
    gst: number,
    type: "percentage" | "flat"
  ) => {
    let discountAmount = 0;
    let discountPercent = 0;

    if (type === "percentage") {
      discountPercent = discount;
      discountAmount = (rate * discount) / 100;
    } else {
      discountAmount = discount;
      discountPercent = rate > 0 ? (discount / rate) * 100 : 0;
    }

    let discounted_amount = rate - discountAmount;
    if (discounted_amount < 0) discounted_amount = 0;

    const gst_amount = (gst * discounted_amount) / 100;
    const final = gst_amount + discounted_amount;

    return { discountAmount, discountPercent, final };
  };




  const openCreateProduct = () => {
    if (canAddProduct) {
      setIsCreateModel(true);
    } else {
      setIsCreateModel(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  // const handleProductChange = (selectedOption: SingleValue<any>) => {
  //   setSelectProductId(selectedOption);
  //   setproductError(selectedOption ? "" : "Product is required");
  //   setNetRateFromProduct(selectedOption?.netRate);
  //   const gst = selectedOption?.gst || 0; // Assuming `gst` is in percentage
  //   setGstFromProduct(gst);
  //   const netrate = selectedOption?.netRate || 0;
  //   setNetRateFromProduct(netrate);
  //   calculateNetRate(netrate, discountInput, gst, discountTypeProduct);
  // };
  const handleProductChange = (selectedOption: SingleValue<any>) => {
    setSelectProductId(selectedOption);
    setproductError(selectedOption ? "" : "Product is required");

    if (!selectedOption) {
      // 🔥 RESET ALL
      setGstFromProduct(0);
      setNetRateFromProduct(0);
      setDiscountInput(0);
      setDiscountDisplayValue("");
      setDiscountAmountProduct(0);
      setNetRateInput(0);
      return;
    }

    const gst = selectedOption?.gst || 0;
    const rate = selectedOption?.netRate || 0;

    setGstFromProduct(gst);
    setNetRateFromProduct(rate);

    // Reset discount when new product selected
    setDiscountInput(0);
    setDiscountDisplayValue("");
    setDiscountAmountProduct(0);
    setNetRateInput(rate);
  };
  const handleCategoryChange = (selectedOption: SingleValue<any>) => {
    setSelectedCategoryId(selectedOption);
    setCategoryError(selectedOption ? "" : "Category is required");
  };
  // 🔥 Handle switch change between % and ₹
  useEffect(() => {
    if (!netRateFromProduct || !selectedProductId) return;

    const currentDiscountPercent = discountInput;   // we always store % internally

    if (discountTypeProduct === "percentage") {
      // Switching to Percentage
      setDiscountDisplayValue(currentDiscountPercent > 0 ? currentDiscountPercent.toFixed(3) : "");
    } else {
      // Switching to Flat
      const flatAmount = (netRateFromProduct * currentDiscountPercent) / 100;
      setDiscountDisplayValue(flatAmount > 0 ? flatAmount.toFixed(2) : "");
    }

    // Recalculate net rate
    let discountValue = 0;

    if (discountTypeProduct === "percentage") {
      discountValue = currentDiscountPercent;
    } else {
      // convert % → flat
      discountValue = (netRateFromProduct * currentDiscountPercent) / 100;
    }

    const result = calculateNetRate(
      netRateFromProduct,
      discountValue,
      gstFromProduct || 0,
      discountTypeProduct
    );

    setNetRateInput(result.final);
    setDiscountAmountProduct(result.discountAmount);

  }, [discountTypeProduct]);
  const clearForm = () => {
    setRateInput(0);
    setDiscountInput(0);
    setDiscountDisplayValue(""); // Display value को empty करें
    setNetRateInput(0);
    setGstFromProduct("");
    setNetRateFromProduct(0);
    setIsEditing(false);
    setSelectProductId("");
    setSelectedCategoryId("");
  };

  const handelSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    if (!selectedProductId) {
      setproductError("Product is required");
      return;
    }

    if (netRateFromProduct) {
      setIsSubmitting(true);
      try {
        if (isEditing && editPriceListItemId !== null) {
          await updatePriceListItem(
            {
              pricelist_masters_id: passDataInAddItem?.id,
              product_id: selectedProductId?.value,
              rate: netRateFromProduct,
              discount: Number(discountInput),
              discount_amount: Number(discountAmountProduct),
              net_rate: netRateInput,
            },
            setPriceListItem,
            editPriceListItemId,
            passDataInAddItem?.id,
            clearForm
          );
        } else {
          if (!canAdd) {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
            setIsSubmitting(false);
            return;
          }
          await createPriceListItem(
            {
              pricelist_masters_id: passDataInAddItem?.id,
              product_id: selectedProductId?.value,
              rate: netRateFromProduct,
              discount: Number(discountInput),
              discount_amount: Number(discountAmountProduct),
              net_rate: netRateInput,
            },
            setPriceListItem,
            passDataInAddItem?.id,
            clearForm
          );
        }
      } catch (error) {
        console.error("Error in handleSubmit:", error);
        // Optionally show an error toast
        toast.error("An error occurred while processing the request");
      } finally {
        setIsSubmitting(false); // Unlock after request completes (success or failure)
      }
    }
  };

  const handelSubmitCategory = async () => {
    if (isSubmittingCategory) {
      return;
    }

    // if (!selectedCategoryId) {
    //   setSelectedCategoryId("Category is required");
    //   return;
    // }

    if (discountDisplayValueRefCat) {
      setIsSubmittingCategory(true);
      try {
        if (!canAdd) {
          toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
          setIsSubmitting(false);
          return;
        }
        const getUUID = await localStorage.getItem("UUID");
        await createPriceListThroughCategory(
          {
            pricelist_masters_id: passDataInAddItem?.id,
            category_id: selectedCategoryId?.value,
            discount: Number(discountInputRefCat),
            discount_type: discountTypeCategory,           // % value
            a_application_login_id: getUUID
          },
          setPriceListItem,
          passDataInAddItem?.id,
          clearForm
        );
      } catch (error) {
        toast.error("An error occurred while processing the request");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // const handelChangeRate = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const rate = parseFloat(event.target.value) || 0;
  //   setRateInput(rate);
  //   calculateNetRate(rate, discountInput, gstFromProduct);
  // };

  const handelChangeDiscount = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.trim();

    if (value === "") {
      setDiscountDisplayValue("");
      setDiscountInput(0);
      setDiscountAmountProduct(0);
      setNetRateInput(netRateFromProduct || 0);
      return;
    }

    const inputNumber = parseFloat(value);

    if (isNaN(inputNumber) || inputNumber < 0) return;

    // Validation
    if (discountTypeProduct === "percentage" && inputNumber >= 100) {
      toast.error("Discount % cannot be 100 or more");
      return;
    }

    if (discountTypeProduct === "flat" && inputNumber > (netRateFromProduct || 0)) {
      toast.error("Flat discount cannot be more than rate");
      return;
    }

    setDiscountDisplayValue(value);

    let discountPercent = 0;
    let discountAmount = 0;

    if (discountTypeProduct === "percentage") {
      discountPercent = inputNumber;
      discountAmount = (netRateFromProduct * inputNumber) / 100;
    } else {
      discountAmount = inputNumber;
      discountPercent = netRateFromProduct > 0 ? (inputNumber / netRateFromProduct) * 100 : 0;
    }

    let discountValue = 0;

    if (discountTypeProduct === "percentage") {
      discountValue = discountPercent;
    } else {
      discountValue = discountAmount;
    }

    const result = calculateNetRate(
      netRateFromProduct,
      discountValue,
      gstFromProduct,
      discountTypeProduct
    );

    setDiscountInput(discountPercent);
    setDiscountAmountProduct(discountAmount);
    setNetRateInput(result.final);
  };

  const handelChangeDiscountRefCategory = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const discount = parseFloat(value) || 0;

    if (value === "") {
      setDiscountDisplayValueRefCat("");
      setDiscountInputRefCat(0);
      return;
    }

    if (discountTypeCategory === "percentage" && discount >= 100) {
      toast.error("Discount % cannot be more than 100");
      return;
    }

    setDiscountDisplayValueRefCat(value);
    setDiscountInputRefCat(discount); // 👈 jo user dale wahi bhejna hai
  };

  const handelChangeNetRate = (event: TOnChangeInput) => {
    setNetRateInput(parseFloat(event.target.value));
  };
  const handleDeleteById = (id: number) => {
    if (canDelete) {
      setNetRateInput1(id);
      setIsDeleteConfirmation(true);
    } else {
      setIsDeleteConfirmation(false);

      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const handleEdit = (item: IPriceListItemView) => {
    if (!canEdit) {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
      return;
    }

    const selectedProductOption = productOptions.find(
      (option: any) => option.value === item.product_id
    );

    const discountPercent = Number(item.discount || 0);
    const discountAmount = Number(item.discount_amount || 0);

    // Set common values
    setNetRateFromProduct(Number(item.rate));
    setNetRateInput(item.net_rate);
    setGstFromProduct(item.gst_number);
    setSelectProductId(selectedProductOption);
    setIsEditing(true);
    setEditPriceListItemId(item.id);

    // 🔥 NEW LOGIC: Show value according to current switch state
    if (discountTypeProduct === "percentage") {
      setDiscountInput(discountPercent);
      setDiscountDisplayValue(discountPercent > 0 ? discountPercent.toFixed(3) : "");
    } else {
      // Flat mode
      setDiscountInput(discountPercent);           // keep actual % internally
      setDiscountDisplayValue(discountAmount > 0 ? discountAmount.toFixed(2) : "");
    }
  };
  const [isModalExcelProductForImportUpdate, setIsModalExcelProductForUpdate] =
    useState<boolean>(false);
  const canImport = useCheckUserPermission(
    PAGE_ID.PRICE_LIST_ITEM,
    PERMISSION_TYPE.IMPORT,
  );
  const openModelImportExportUpdate = () => {
    if (canImport) {
      setIsModalExcelProductForUpdate(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const handleConfirmProductImportExcelForUpdate = async () => {
    setIsModalExcelProductForUpdate(false);
    await fetchPriceListItemApi(setPriceListItem, passDataInAddItem?.id);
  };
  return (
    <React.Fragment>
      {show && (
        <div className="modal1 ">
          <div className="modal-content1" style={{
            maxHeight: "85vh",           // ← most important: constrain total modal height
            overflowY: "auto",           // ← allow vertical scroll on the whole modal content
            overflowX: "hidden",
            position: "relative",
          }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              {/* LEFT SIDE TITLE */}
              <h2
                className="modal-title1 form_header_text"
                style={{
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                Price List Name : {passDataInAddItem?.price_list_name}
              </h2>

              {/* RIGHT SIDE ACTIONS */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "60px",
                }}
              >
                {/* UPDATE ICON */}
                <button
                  className="icons text-light"
                  onClick={openModelImportExportUpdate}
                  title="Update Pricelist Data"
                  style={{
                    border: "none",
                    background: "transparent",
                    padding: 0,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <svg
                    height="22px"
                    viewBox="0 -960 960 960"
                    width="22px"
                    fill="#1f1f1f"
                  >
                    <path d="m720-120 160-160-56-56-64 64v-167h-80v167l-64-64-56 56 160 160ZM560 0v-80h320V0H560ZM240-160q-33 0-56.5-23.5T160-240v-560q0-33 23.5-56.5T240-880h280l240 240v121h-80v-81H480v-200H240v560h240v80H240Zm0-80v-560 560Z" />
                  </svg>
                </button>

                {/* CLOSE BUTTON */}
                <span className="close" onClick={onHide}>
                  &times;
                </span>
              </div>
            </div>
            <div className={`m-title-2 col-12 `}>
              <div className="head">
                <div className="source-of-type-list-grid-block">
                  <div className="source-of-type-list-grid-main">
                    <div><b>Category Wise Product Entry</b></div>
                    <table className="table table-hover" border={0}>
                      <thead>
                        <tr>
                          <th>
                            <span>Category</span>
                            {canAddProductCategory && (
                              <span
                                className="ms-2"
                                style={{ cursor: "pointer" }}
                                onClick={() => setIsOpenAddProductCategoryModal(true)}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
                                  <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                                </svg>
                              </span>
                            )}
                          </th>

                          <th>
                            <div className="d-flex align-items-center gap-2">

                              {/* Label */}
                              <span>Discount</span>

                              {/* Percentage label */}
                              <span className={discountTypeCategory === "percentage" ? "fw-bold" : ""}>
                                %
                              </span>

                              {/* Switch */}
                              <div className="form-check form-switch m-0" style={{ background: "#c0c0c0" }}>
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={discountTypeCategory === "flat"}
                                  onChange={(e) =>
                                    setDiscountTypeCategory(e.target.checked ? "flat" : "percentage")
                                  }
                                />
                              </div>

                              {/* Flat label */}
                              <span className={discountTypeCategory === "flat" ? "fw-bold" : ""}>
                                ₹
                              </span>

                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="" style={{}}>
                          <td className="text-start" width={"40%"}>
                            <div className="w-100">
                              <CustomSearchDropdown
                                options={categoryOptions}
                                value={selectedCategoryId}
                                onChange={handleCategoryChange}
                                className="w-100"
                              />
                            </div>
                            {categoryError && (
                              <span className="text-danger">
                                {categoryError}
                              </span>
                            )}
                          </td>
                          <td className="text-start">
                            <div className="search-bar ">
                              <div className="add-source-of-type-section ">
                                <input
                                  type="number"
                                  title="Discount"
                                  placeholder="0"
                                  value={discountDisplayValueRefCat} // Display value use करें
                                  onChange={(e) => handelChangeDiscountRefCategory(e)}
                                  style={{
                                    backgroundColor: "#f0f2f5",
                                    textAlign: "end",
                                  }}
                                  step="0.01"
                                  min="0"
                                />
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className=" mt-2">
                              <button className="" onClick={handelSubmitCategory}>
                                <span>
                                  {isEditing ? (
                                    <span>
                                      <svg
                                        data-name="Layer 1"
                                        height={24}
                                        id="Layer_1"
                                        viewBox="0 0 200 200"
                                      >
                                        <title />
                                        <path
                                          fill="currentColor"
                                          d="M177.68,43.9c-4.5-3.5-10.5-3-14,1.5l-74,89.5-55-40c-4.5-3-10.5-2.5-14,2-3,4.5-2.5,10.5,2,14l62.5,45.5a.49.49,0,0,1,.5.5c.5,0,.5.5,1,.5s.5.5,1,.5.5,0,1,.5h6c.5,0,.5,0,1-.5.5,0,.5-.5,1-.5s.5-.5,1-.5.5-.5,1-.5a.49.49,0,0,0,.5-.5l.5-.5,80-97C182.18,53.9,181.68,47.4,177.68,43.9Z"
                                        />
                                      </svg>
                                    </span>
                                  ) : (
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      height="26px"
                                      viewBox="0 -960 960 960"
                                      width="26px"
                                      fill="#5f6368"
                                    >
                                      <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                                    </svg>
                                  )}
                                </span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <div><b>Product Wise Entry</b>
                      {canAddProduct &&
                        <span className="ms-2" style={{ cursor: "pointer" }} onClick={() => { openCreateProduct() }}>
                          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" /></svg>
                        </span>
                      }


                    </div>
                    <table className="table table-hover" border={0}>
                      <thead>
                        <tr>
                          <th>
                            Product<span className="text-danger">*</span>
                          </th>
                          <th className="text-end">Rate</th>
                          <th className="text-end">
                            <div className="d-flex align-items-center justify-content-end gap-2">

                              {/* Label */}
                              <span>Discount</span>

                              {/* Percentage */}
                              <span className={discountTypeProduct === "percentage" ? "fw-bold" : ""}>
                                %
                              </span>

                              {/* Switch */}
                              <div className="form-check form-switch m-0" style={{ background: "#c0c0c0" }}>
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={discountTypeProduct === "flat"}
                                  onChange={(e) => {
                                    const newType = e.target.checked ? "flat" : "percentage";
                                    setDiscountTypeProduct(newType);
                                  }}
                                />
                              </div>

                              {/* Flat */}
                              <span className={discountTypeProduct === "flat" ? "fw-bold" : ""}>
                                ₹
                              </span>

                            </div>
                          </th>
                          <th className="text-center" style={{ width: "10%" }}>
                            GST
                          </th>
                          <th className="text-end">Net Rate</th>
                        </tr>
                      </thead>
                      <tbody className="">
                        <tr className="" style={{}}>
                          <td className="text-start" width={"22%"}>
                            <div className="w-100 mt-2">
                              <CustomSearchDropdown
                                options={productOptions}
                                value={selectedProductId}
                                onChange={handleProductChange}
                                className="w-100"
                              />
                            </div>
                            {productError && (
                              <span className="text-danger">
                                {productError}
                              </span>
                            )}
                          </td>
                          <td className="text-start">
                            <div className="search-bar ">
                              <div className="add-source-of-type-section ">
                                <input
                                  type="text"
                                  title="Rate"
                                  placeholder="Rate"
                                  value={netRateFromProduct}
                                  onChange={(e) => {
                                    const value = e.target.value;

                                    if (/^\d*\.?\d*$/.test(value)) {
                                      const num = value === "" ? 0 : Number(value);

                                      setNetRateFromProduct(num);

                                      // 👇 ADD THIS BLOCK
                                      let discountPercent = 0;
                                      let discountAmount = 0;

                                      if (discountTypeProduct === "percentage") {
                                        discountPercent = discountInput;
                                        discountAmount = (num * discountInput) / 100;
                                      } else {
                                        discountAmount = discountAmountProduct;
                                        discountPercent = num > 0 ? (discountAmount / num) * 100 : 0;
                                      }

                                      const discountValue =
                                        discountTypeProduct === "percentage"
                                          ? discountPercent
                                          : discountAmount;

                                      const result = calculateNetRate(
                                        num,
                                        discountValue,
                                        gstFromProduct,
                                        discountTypeProduct
                                      );

                                      setDiscountInput(discountPercent);
                                      setDiscountAmountProduct(discountAmount);
                                      setNetRateInput(result.final);
                                    }
                                  }}
                                  inputMode="decimal"
                                  style={{ textAlign: "end" }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="text-start">
                            <div className="search-bar ">
                              <div className="add-source-of-type-section ">
                                <input
                                  type="number"
                                  title="Discount"
                                  placeholder="0"
                                  value={discountDisplayValue} // Display value use करें
                                  onChange={(e) => handelChangeDiscount(e)}
                                  style={{
                                    backgroundColor: "#f0f2f5",
                                    textAlign: "end",
                                  }}
                                  step="0.01"
                                  min="0"
                                />
                              </div>
                            </div>
                          </td>
                          <td className="text-start">
                            <div className="search-bar mt-3">
                              <div className="  text-end">
                                {gstFromProduct ? gstFromProduct : ""} %
                              </div>
                            </div>
                          </td>
                          <td className="text-start">
                            <div className="search-bar ">
                              <div className="add-source-of-type-section ">
                                <input
                                  type="text"
                                  title="Net rate"
                                  placeholder="Net rate"
                                  value={typeof netRateInput === "number" && !isNaN(netRateInput)
                                    ? netRateInput.toFixed(2)
                                    : "0.00"}
                                  readOnly
                                  style={{
                                    backgroundColor: "#f0f2f5",
                                    textAlign: "end",
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className=" mt-2">
                              <button className="" onClick={handelSubmit}>
                                <span>
                                  {isEditing ? (
                                    <span>
                                      <svg
                                        data-name="Layer 1"
                                        height={24}
                                        id="Layer_1"
                                        viewBox="0 0 200 200"
                                      >
                                        <title />
                                        <path
                                          fill="currentColor"
                                          d="M177.68,43.9c-4.5-3.5-10.5-3-14,1.5l-74,89.5-55-40c-4.5-3-10.5-2.5-14,2-3,4.5-2.5,10.5,2,14l62.5,45.5a.49.49,0,0,1,.5.5c.5,0,.5.5,1,.5s.5.5,1,.5.5,0,1,.5h6c.5,0,.5,0,1-.5.5,0,.5-.5,1-.5s.5-.5,1-.5.5-.5,1-.5a.49.49,0,0,0,.5-.5l.5-.5,80-97C182.18,53.9,181.68,47.4,177.68,43.9Z"
                                        />
                                      </svg>
                                    </span>
                                  ) : (
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      height="26px"
                                      viewBox="0 -960 960 960"
                                      width="26px"
                                      fill="#5f6368"
                                    >
                                      <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                                    </svg>
                                  )}
                                </span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="source-of-type-list-grid-block">
                  <div className="source-of-type-list-grid-main">
                    <table className="table table-hover" border={0}>
                      <thead>
                        <th className="">Product</th>
                        <th className="text-end">Rate</th>
                        <th className="text-end">Discount (%)</th>
                        <th className="text-end">Discount Amount</th>
                        <th className="text-end">GST (%)</th>
                        <th className="text-end">Net Rate</th>
                        <th className="text-end">Last Updated By</th>
                        <th className="text-end">Last Updated Date</th>
                        <th className="text-center">Action</th>
                      </thead>
                      <tbody className="text-center">
                        {priceListLists &&
                          priceListLists.map((item, index) => (
                            <tr key={index} className="" style={{}}>
                              <td className="text-start">
                                <span>{item.product_name}</span>
                              </td>
                              <td className="text-end">
                                <span>{item.rate}</span>
                              </td>
                              <td className="text-end">
                                {Number(item.discount || 0).toFixed(2)}
                              </td>
                              <td className="text-end">
                                <span>{Number(item.discount_amount || 0).toFixed(2)}</span>
                              </td>
                              <td className="text-end">
                                <span>
                                  {item.gst_number ? item.gst_number : ""}
                                </span>
                              </td>
                              <td className="text-end">
                                <span>{Number(item.net_rate || 0).toFixed(2)}</span>
                              </td>
                              <td className="text-end">
                                <span>{item.last_updated_by_name}</span>
                              </td>
                              <td className="text-end">
                                <span>{formatDateAndTime(item.last_updated_date_time)}</span>
                              </td>
                              <td className="text-center">
                                <span
                                  data-testid="pencil"
                                  data-icon="pencil"
                                  className=""
                                  style={{ cursor: "pointer" }}
                                  onClick={() => handleEdit(item)}
                                >
                                  <svg
                                    viewBox="0 0 24 24"
                                    width="24"
                                    height="24"
                                    className=""
                                  >
                                    <path
                                      fill="currentColor"
                                      d="M3.95 16.7v3.4h3.4l9.8-9.9-3.4-3.4-9.8 9.9zm15.8-9.1c.4-.4.4-.9 0-1.3l-2.1-2.1c-.4-.4-.9-.4-1.3 0l-1.6 1.6 3.4 3.4 1.6-1.6z"
                                    ></path>
                                  </svg>
                                </span>
                                |
                                <span
                                  style={{ cursor: "pointer" }}
                                  onClick={() => handleDeleteById(item.id)}
                                >
                                  <svg
                                    viewBox="0 -960 960 960"
                                    width="22px"
                                    fill="currentColor"
                                  >
                                    <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
                                  </svg>
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {
            isOpenAddProductCategoryModal && <AddCategoryModal
              show={isOpenAddProductCategoryModal}
              onHide={() => { setIsOpenAddProductCategoryModal(false); fetchCategoryApiForPriceListItem(setCategoryList) }}
              title="Add Product Category"
              placeholder="Enter Product Category"
              btn1="Cancel"
              btn2="Add"
              displayClearButton={true}
              payloadKey="addProductCategory"
            />
          }
          {isDeleteConfirmation && (
            <ConfirmationModal
              show={isDeleteConfirmation}
              onHide={() => setIsDeleteConfirmation(false)}
              handleSubmit={() =>
                handleDeletePriceListItem(
                  netRateInput1,
                  setIsDeleteConfirmation,
                  setPriceListItem,
                  passDataInAddItem?.id
                )
              }
              title={"Delete this PriceList"}
              message={"Are You Sure You Want To Delete This PriceList?"}
              btn1="CANCEL"
              btn2="DELETE"
            />
          )}
          {isOpenCreateModel && (
            <CreateProductView
              show={isOpenCreateModel}
              onHide={() => setIsCreateModel(false)}
              productToEdit={undefined}
              headerName="Create Product"
              setRefreshProduct={setRefreshProduct}
            />
          )}
          <ImportExcelForContactModal
            show={isModalExcelProductForImportUpdate}
            onHide={() => setIsModalExcelProductForUpdate(false)}
            handleSubmit={() => handleConfirmProductImportExcelForUpdate()}
            title={"Import Updated Data For Price List"}
            message={"Please Import excel as per sample Product"}
            btn1="Cancel"
            btn2="Import"
            sampleLocation="samplePriceListForUpdate.xlsx"
            potions={6}
            pricelistId={passDataInAddItem?.id}
          />
        </div>
      )}
    </React.Fragment>
  );
};

export default PriceListItemView;
