import { ErrorMessage, Field, useFormikContext } from "formik";
import React, { useContext, useEffect, useMemo, useState } from "react";

import { toast } from "react-toastify";
import { AppContext } from "../../../common/AppContext";
import FormikCustomSearchDropdown from "../../../components/FormikCustomSearchDropdown";
import PrintSettingModal from "../../../components/model/PrintSettingModal";
import { axiosInstance } from "../../../services/axiosInstance";
import {
  createCompany,
  fetchCountryApiForCompany,
  fetchCurrency,
  orderQtyList,
  updateModuleSettings,
} from "./NewCreateCompanyController";

const NewModuleSettings = ({
  show,
  onHide,
  companyToEdit,
  setRefresh,
  headerName,
  mobileNumber,
  isShowApiKey,
}: any) => {
  const { setCheckPlan, isSetCheckPlan } = useContext(AppContext)!;
  const { values, setFieldValue, errors, touched } = useFormikContext<any>();

  const [signPreview, setSignPreview] = useState<string | null>(null);

  const [countriesList, setCountriesList] = useState([]);

  const [currency, setCurrency] = useState<ICurrency[]>([]);

  const [selectedStateId, setSelectedStateId] = useState<number>();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>();

  const [selectedCityId, setSelectedCityId] = useState<number>();

  const [isPrintSettingShow, setIsPrintSettingShow] = useState(false);
  const [storeBannerOnePreview, setStoreBannerOnePreview] = useState<
    string | null
  >(null);

  const [storeBannertwoPreview, setStoreBannertwoOnePreview] = useState<
    string | null
  >(null);

  const [croppedImageUrl, setCroppedImageUrl] = useState<string | undefined>();

  const [inOrderImageView, setInOrderImageView] = useState(
    companyToEdit?.in_order_image_view || 1,
  );
  const [watermarkInPrint, setWatermarkInPrint] = useState(
    companyToEdit?.watermark_in_print || 1,
  );

  // company_feature_flags is a separate table (not a company_masters
  // column), so this fires its own immediate call on toggle instead of
  // folding into the big Formik-submitted company-update payload.
  const [documentDesignerEnabled, setDocumentDesignerEnabled] = useState(false);
  useEffect(() => {
    if (!companyToEdit?.id) return;
    axiosInstance
      .post("get-feature-flag", {
        company_masters_id: companyToEdit.id,
        feature_key: "document_designer",
      })
      .then(({ data }) => {
        if (data?.ack === 1) setDocumentDesignerEnabled(!!data.data.item.is_enabled);
      });
  }, [companyToEdit?.id]);

  const handleDocumentDesignerToggle = async (checked: boolean) => {
    setDocumentDesignerEnabled(checked);
    await axiosInstance.post("set-feature-flag", {
      company_masters_id: companyToEdit?.id,
      feature_key: "document_designer",
      is_enabled: checked,
    });
  };

  // Same company_feature_flags mechanism as document_designer above -
  // defaults off for every company (no row = disabled). Gates
  // socketClient.ts's getSocket() - LeftSideView.tsx checks this once on
  // load, before any feature (task list, task kanban, chat) could otherwise
  // open a socket connection.
  const [socketConnectionEnabled, setSocketConnectionEnabledState] = useState(false);
  useEffect(() => {
    if (!companyToEdit?.id) return;
    axiosInstance
      .post("get-feature-flag", {
        company_masters_id: companyToEdit.id,
        feature_key: "socket_connection",
      })
      .then(({ data }) => {
        if (data?.ack === 1) setSocketConnectionEnabledState(!!data.data.item.is_enabled);
      });
  }, [companyToEdit?.id]);

  const handleSocketConnectionToggle = async (checked: boolean) => {
    setSocketConnectionEnabledState(checked);
    await axiosInstance.post("set-feature-flag", {
      company_masters_id: companyToEdit?.id,
      feature_key: "socket_connection",
      is_enabled: checked,
    });
  };
  const [isContactValidation, setisContactValidation] = useState(
    companyToEdit?.is_contact_validation || 1,
  );
  const [isStrictCheckProductStock, setisStrictCheckProductStock] = useState(
    companyToEdit?.is_strict_check_product_stock || 1,
  );
  const [
    isStrictCheckWareHouseWiseProductStock,
    setisStrictCheckWareHouseWiseProductStock,
  ] = useState(
    companyToEdit?.is_strict_wharehouse_wise_product_stock_check || 1,
  );
  const [viewInquiryFormInContact, setViewInquiryFormInContact] = useState(
    companyToEdit?.view_inquiry_form_in_contact || 1,
  );
  const [sameProductMultipleInCart, setSameProductMultipleInCart] = useState(
    companyToEdit?.same_product_multiple_in_cart || 1,
  );

  const [signCroppedImageUrl, setSignCroppedImageUrl] = useState<
    string | undefined
  >();

  interface ICurrency {
    id: number;
    short_name: string;
    name: string;
  }

  useEffect(() => {
    return () => {
      if (croppedImageUrl) {
        URL.revokeObjectURL(croppedImageUrl);
      }
    };
  }, [croppedImageUrl]);

  const countryOptions = countriesList.map((category: any) => ({
    value: category.id,
    label: category.country_name,
  }));
  const defaultCountry = countryOptions.find((c) => c.value === 101);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.key === "Enter" && target.tagName !== "TEXTAREA") {
        event.preventDefault();
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

  useEffect(() => {
    if (signCroppedImageUrl) {
      setSignPreview(signCroppedImageUrl);
    } else if (signPreview) {
      // already set
    } else if (companyToEdit?.company_sign) {
      setSignPreview(companyToEdit.company_sign);
    } else {
      setSignPreview("");
    }
  }, [signCroppedImageUrl, companyToEdit?.company_sign]);

  const orderQtyOptions = useMemo(
    () =>
      orderQtyList.map((item_order_qty_unit) => ({
        value: Number(item_order_qty_unit.id),
        label: item_order_qty_unit.qty_unit,
      })),
    [orderQtyList],
  );

  const handleSubmit = async (values: any) => {

    if (companyToEdit?.id) {
      updateModuleSettings(values, setRefresh, companyToEdit, onHide);
      // setImage(values.company_logo);
      // handelClose();
    } else {
      createCompany(
        values,
        setRefresh,
        onHide,
        mobileNumber,
        setCheckPlan,
        isSetCheckPlan,
      );
    }
  };

  const handelClose = () => {
    // setHeaderPreview("");
    onHide();
    // handleRefresh();
    // setFooterPreview("");
    // setLogPreview("");
    setSignPreview("");
    // setCataLogPreview("");
    // setCataLogView("");
    // setImage("");
    setStoreBannerOnePreview("");
    setStoreBannertwoOnePreview("");
  };

  useEffect(() => {
    // fetchCategoryB2BApi(setCategoryList);
    fetchCurrency(setCurrency);

    if (companyToEdit) {
      setSelectedCategoryId(companyToEdit?.category_id_b2b);
      fetchCountryApiForCompany(setCountriesList);
    }
    if (companyToEdit?.country_id) {
      setSelectedStateId(companyToEdit?.country_id || undefined);
    } else {
      setSelectedStateId(defaultCountry?.value);
    }
  }, [companyToEdit?.country_id, show]);

  useEffect(() => {
    if (selectedStateId) {
      const fetchState = async () => {
        try {
          // await fetchStateApiForCompany(setStateList, selectedStateId);
          if (companyToEdit) {
            setSelectedCityId(companyToEdit?.state_id);
          }
        } catch (error) {
          console.error("Error fetching city options:", error);
        }
      };
      fetchState();
    }
  }, [companyToEdit, selectedStateId]);

  useEffect(() => {
    if (selectedCategoryId) {
      const fetchSubCategory = async () => {
        try {
          // await fetchSubCategoryB2BApi(setSubCategoryList, selectedCategoryId);
        } catch (error) {
          console.error("Error fetching city options:", error);
        }
      };
      fetchSubCategory();
    }
  }, [companyToEdit, selectedCategoryId]);
  useEffect(() => {
    if (selectedCityId) {
      const fetchCities = async () => {
        try {
          // await fetchCityApiForCompany(setCityList, selectedCityId);
        } catch (error) {
          console.error("Error fetching city options:", error);
        }
      };
      fetchCities();
    }
  }, [selectedCityId]);

  useEffect(() => {
    if (
      companyToEdit &&
      companyToEdit.currency_id &&
      currency &&
      currency.length > 0
    ) {
      // Match companyToEdit.currency_id with currency state
      const matchedCurrency = currency.find(
        (curr) => curr.id === companyToEdit.currency_id,
      );
      if (matchedCurrency) {
        // Create dropdown option using matched currency
        const currencyOption = {
          label: `${matchedCurrency.short_name} - ${matchedCurrency.name}`,
          value: matchedCurrency.id,
        };
        // setDefaultCurrency(currencyOption);
        // setSelectedCurrency(currencyOption);
        // Update Formik field for consistency
      }
    }
  }, [companyToEdit, currency]);

  return (
    <>
      <div>
        <div className="mb-3">
          <div className="row mx-0 px-2 gy-3  d-flex justify-content-center">
            <>
              <div className="row">
                <div
                  style={{
                    position: "relative",
                    // paddingBottom: "40px",
                  }}
                >
                  <div
                    className="col-8 mt-2"
                    // style={{
                    //   position: "absolute",
                    //   top: "-1%",
                    //   left: "70%",
                    // }}
                  >
                    <div
                      className="form-check form-switch"
                      style={{ marginTop: "1.8%" }}
                    >
                      <label htmlFor="in_order_image_view">
                        Product Image View In a Cart
                      </label>
                      <Field
                        type="checkbox"
                        name="in_order_image_view"
                        className="form-check-input"
                        checked={values.in_order_image_view === 1}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setFieldValue(
                            "in_order_image_view",
                            e.target.checked ? 1 : 2,
                          );
                          setInOrderImageView(e.target.checked ? 1 : 2);
                        }}
                      />
                    </div>

                    <div className="form-check form-switch">
                      <label htmlFor="watermark_in_print">
                        Show Watermark In Print/PDF
                      </label>
                      <Field
                        type="checkbox"
                        name="watermark_in_print"
                        className="form-check-input"
                        checked={values.watermark_in_print === 2}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setFieldValue(
                            "watermark_in_print",
                            e.target.checked ? 2 : 1,
                          );
                          setWatermarkInPrint(e.target.checked ? 2 : 1);
                        }}
                      />
                    </div>
                    <div className="form-check form-switch">
                      <label htmlFor="document_designer_enabled">
                        Document Designer (Quotation)
                      </label>
                      <input
                        type="checkbox"
                        id="document_designer_enabled"
                        className="form-check-input"
                        checked={documentDesignerEnabled}
                        onChange={(e) => handleDocumentDesignerToggle(e.target.checked)}
                      />
                    </div>
                    <div className="form-check form-switch">
                      <label htmlFor="socket_connection_enabled">
                        Socket Connection (Real-time updates)
                      </label>
                      <input
                        type="checkbox"
                        id="socket_connection_enabled"
                        className="form-check-input"
                        checked={socketConnectionEnabled}
                        onChange={(e) => handleSocketConnectionToggle(e.target.checked)}
                      />
                    </div>
                    <div className="form-check form-switch">
                      <label htmlFor="view_inquiry_form_in_contact">
                        Display Inquiry Form in Contact Creation
                      </label>
                      <Field
                        type="checkbox"
                        name="view_inquiry_form_in_contact"
                        className="form-check-input"
                        checked={values?.view_inquiry_form_in_contact === 2}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setFieldValue(
                            "view_inquiry_form_in_contact",
                            e.target.checked ? 2 : 1,
                          );
                          setViewInquiryFormInContact(e.target.checked ? 2 : 1);
                        }}
                      />
                    </div>
                    <div className="form-check form-switch">
                      <label htmlFor="same_product_multiple_in_cart">
                        Allow Same product added multiple times in the cart.
                      </label>
                      <Field
                        type="checkbox"
                        name="same_product_multiple_in_cart"
                        className="form-check-input"
                        checked={values?.same_product_multiple_in_cart === 2}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setFieldValue(
                            "same_product_multiple_in_cart",
                            e.target.checked ? 2 : 1,
                          );
                          setSameProductMultipleInCart(
                            e.target.checked ? 2 : 1,
                          );
                        }}
                      />
                    </div>
                    <div className="form-check form-switch">
                      <label htmlFor="is_contact_validation">
                        <code>
                          Off = Contact Number Duplication Not Allowed | On =
                          Contact Number Duplication Allowed
                        </code>
                      </label>
                      <Field
                        type="checkbox"
                        name="is_contact_validation"
                        className="form-check-input"
                        checked={values.is_contact_validation === 2}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setFieldValue(
                            "is_contact_validation",
                            e.target.checked ? 2 : 1,
                          );
                          setisContactValidation(e.target.checked ? 2 : 1);
                        }}
                      />
                    </div>
                    <div className="form-check form-switch">
                      <label htmlFor="is_strict_check_product_stock">
                        Strict Product Stock Check In dispatch/sales invoice
                      </label>

                      <Field
                        type="checkbox"
                        name="is_strict_check_product_stock"
                        className="form-check-input"
                        checked={
                          Number(values.is_strict_check_product_stock) === 2
                        }
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const value = e.target.checked ? 2 : 1;

                          setFieldValue("is_strict_check_product_stock", value);
                          setisStrictCheckProductStock(value);
                        }}
                      />
                    </div>
                    <div className="form-check form-switch">
                      <label htmlFor="is_strict_wharehouse_wise_product_stock_check">
                        Strict Product Stock Check WareHouse Wise In
                        dispatch/sales invoice
                      </label>

                      <Field
                        type="checkbox"
                        name="is_strict_wharehouse_wise_product_stock_check"
                        className="form-check-input"
                        checked={
                          Number(
                            values.is_strict_wharehouse_wise_product_stock_check,
                          ) === 2
                        }
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          if (
                            Number(values.is_strict_check_product_stock) != 2
                          ) {
                            toast.error(
                              "Please enable 'Strict Product Stock Check' first to enable warehouse-wise product stock check.",
                            );
                            return;
                          }

                          const value = e.target.checked ? 2 : 1;

                          setFieldValue(
                            "is_strict_wharehouse_wise_product_stock_check",
                            value,
                          );
                          setisStrictCheckWareHouseWiseProductStock(value);
                        }}
                      />
                    </div>
                  </div>
                  <div className="col-4 col-md-4 mt-4">
                    <div className="form-group">
                      <label
                        htmlFor="order_qty_unit"
                        className="mb-1 form_label"
                      >
                        Order Unit Classification{" "}
                        <span className="text-danger">*</span>
                      </label>
                      <FormikCustomSearchDropdown
                        name="order_qty_unit"
                        options={orderQtyOptions}
                        className={` ${
                          errors.order_qty_unit &&
                          touched.order_qty_unit &&
                          "is-invalid input-box-error"
                        }`}
                      />
                      <ErrorMessage
                        name="order_qty_unit"
                        component="div"
                        className="field-error text-danger"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>

            <div className="col-12 col-12 pt-5 ml-10 d-flex justify-content-end modal-buttons">
              <button
                type="button"
                className="modal-button1"
                onClick={handelClose}
              >
                Close
              </button>
              <button
                type="button"
                // onSubmit={handleSubmit}
                className="btn btn-primary px-4 py-2 ms-2 text-light form_label rounded-1"
                style={{
                  backgroundColor: "#f58634",
                }}
                onClick={() => {
                  handleSubmit(values);
                }}
                onSubmit={handleSubmit}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      {isPrintSettingShow && (
        <PrintSettingModal
          show={isPrintSettingShow}
          setShow={setIsPrintSettingShow}
          onHide={() => setIsPrintSettingShow(false)}
          handleSubmit={() => {
            // if (orderPrintById?.cart?.type && dynamicViewFormate) {
            //   fetchprintSetting(
            //     setPrintSetting,
            //     MobileToken,
            //     getID,
            //     Number(orderPrintById.cart.type),
            //     dynamicViewFormate
            //   ).then(() => {
            //     fetchOrderByForPrintIdApi(
            //       Number(id),
            //       setOrderPrintById,
            //       MobileToken,
            //       getID
            //     ).then(() => {
            //       setIsPrintSettingShow(false);
            //     });
            //   });
            // } else {
            setIsPrintSettingShow(false);
            // }
          }}
          // orderType={orderPrintById?.cart.type}
          // viewFormate={dynamicViewFormate}
          // orderById={printSetting?.setting_details}
          titles={"Create"}
          message={"Please Enter Your Order Details"}
          btn1={"CANCEL"}
          btn2={"Approve"}
        />
      )}
      {/* <OtpConfirmationModal
                show={isEmailVerifyConfirmation}
                onHide={() => setIsEmailVerifyCloseConfirmation(false)}
                handleSubmit={() => handleRefresh()}
                title={`Verify Email`}
                message={`Are you sure you want  Verify  this ${companyToEdit?.company_email} Email?`}
                btn1="CANCEL"
                btn2="verify"
                profileId={companyToEdit?.id}
                position={4}
            />
            {isModalImageTool && (
                <ImageCropperToolModel
                    show={isModalImageTool}
                    onHide={() => setIsModalImageTool(false)}
                    onSubmit={handleCroppedImage}
                    initialImage={image}
                    setCroppedImageUrl={setCroppedImageUrl}
                    width={521 * 2}
                    height={512 * 2}
                    title="Crop Your Logo"
                />
            )}
            {isModalImageToolForHeader && (
                <ImageCropperToolModel
                    show={isModalImageToolForHeader}
                    onHide={() => setIsModalImageToolForHeader(false)}
                    onSubmit={handleCroppedImageForHeader}
                    initialImage={headerimage}
                    width={600 * 2}
                    height={90 * 2}
                    title="Crop Your Header"
                />
            )}
            {isModalImageToolForOnlineStoreBanner && (
                <ImageCropperToolModel
                    show={isModalImageToolForOnlineStoreBanner}
                    onHide={() => setIsModalImageToolForOnlineStoreBanner(false)}
                    onSubmit={handleCroppedImageForOnlineStoreBanner}
                    initialImage={storeBannerOneimage}
                    width={1200 * 2}
                    height={400 * 2}
                    title="Crop Your Online Store banner"
                />
            )}
            {isModalImageToolForOnlineStoreBannertwo && (
                <ImageCropperToolModel
                    show={isModalImageToolForOnlineStoreBannertwo}
                    onHide={() => setIsModalImageToolForOnlineStoreBannertwo(false)}
                    onSubmit={handleCroppedImageForOnlineStoreBannertwo}
                    initialImage={storeBannertwoimage}
                    width={1200 * 2}
                    height={400 * 2}
                    title="Crop Your Online Store banner Two"
                />
            )}

            {isModalImageToolForFooter && (
                <ImageCropperToolModel
                    show={isModalImageToolForFooter}
                    onHide={() => setIsModalImageToolForFooter(false)}
                    onSubmit={handleCroppedImageForFooter}
                    initialImage={footerimage}
                    width={600 * 2}
                    height={90 * 2}
                    title="Crop Your Footer"
                />
            )}

            {isModalImageToolForSign && (
                <ImageCropperToolModel
                    show={isModalImageToolForSign}
                    onHide={() => setIsModalImageToolForSign(false)}
                    onSubmit={handleCroppedImageForSign}
                    initialImage={
                        signCroppedImageUrl ||
                        signPreview ||
                        companyToEdit?.company_sign ||
                        ""
                    }
                    width={521 * 2}
                    height={512 * 2}
                    title="Crop Your Company Sign"
                />
            )} */}
    </>
  );
};
export default NewModuleSettings;
