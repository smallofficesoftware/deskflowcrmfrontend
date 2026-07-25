import {
  ErrorMessage,
  Field,
  useFormikContext
} from "formik";
import { useContext, useEffect, useState } from "react";

import { SingleValue } from "react-select";
import { AppContext } from "../../../common/AppContext";
import { handleRefresh } from "../../../common/SharedFunction";
import FormikCustomSearchDropdown from "../../../components/FormikCustomSearchDropdown";
import OtpConfirmationModal from "../../../components/model/OtpConfirmationModal";
import PrintSettingModal from "../../../components/model/PrintSettingModal";

import { PAGE_ID, PERMISSION_TYPE } from "../../../helpers/AppEnum";
import { IOption } from "../../../helpers/AppInterface";
import useCheckUserPermission from "../../../hooks/useCheckUserPermission";

import NewCompanyPrifixModal, { ModalField } from "./NewCompanyPrifixModal";
import {
  createCompany,
  fetchCategoryB2BApi,
  fetchCityApiForCompany,
  fetchCountryApiForCompany,
  fetchCurrency,
  fetchSetPrefixData,
  fetchStateApiForCompany,
  fetchSubCategoryB2BApi,
  updateSetPrefix
} from "./NewCreateCompanyController";
const NewSetPrefixAndPage = ({
  show,
  onHide,
  companyToEdit,
  setRefresh,
  headerName,
  mobileNumber,
  setPagesAndPrefixData,
}: any) => {
  const { setCheckPlan, isSetCheckPlan } = useContext(AppContext)!;
  const { values, setFieldValue, errors, touched } = useFormikContext<any>();

  const [isEmailVerifyConfirmation, setIsEmailVerifyCloseConfirmation] =
    useState(false);

  const [headerPreview, setHeaderPreview] = useState<string | null>(null);
  const [footerPreview, setFooterPreview] = useState<string | null>(null);
  const [logPreview, setLogPreview] = useState<string | null>(null);
  const [signPreview, setSignPreview] = useState<string | null>(null);
  const [catalogPreview, setCataLogPreview] = useState<string | null>(null);
  const [catalogview, setCataLogView] = useState<string | null>(null);

  const [countriesList, setCountriesList] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [subCategoryList, setSubCategoryList] = useState([]);

  const [currency, setCurrency] = useState<ICurrency[]>([]);
  const [stateList, setStateList] = useState([]);
  const [cityList, setCityList] = useState([]);

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
  const canViewThirdPArtyLeadGeneration = useCheckUserPermission(
    PAGE_ID.THIRD_PARTY_LEAD_GENERATION,
    PERMISSION_TYPE.ADD,
  );

  const [selectedCurrency, setSelectedCurrency] =
    useState<SingleValue<IOption> | null>(null);

  const [defaultCurrency, setDefaultCurrency] =
    useState<SingleValue<IOption> | null>(null);

  const [croppedImageUrl, setCroppedImageUrl] = useState<string | undefined>();

  const [signCroppedImageUrl, setSignCroppedImageUrl] = useState<
    string | undefined
  >();

  const [showModalQuotation, setShowModalQuotation] = useState(false);
  const [showModalOrder, setShowModalOrder] = useState(false);
  const [showModalSalesInvoice, setShowModalSalesInvoice] = useState(false);
  const [showModalReturnSalesInvoice, setShowModalReturnSalesInvoice] =
    useState(false);
  const [showModalPurchaseOrder, setShowModalPurchaseOrder] = useState(false);
  const [showModalPurchaseInvoice, setShowModalPurchaseInvoice] =
    useState(false);
  const [showModalReturnPurchaseInvoice, setShowModalReturnPurchaseInvoice] =
    useState(false);
  const [showModalInward, setShowModalInward] = useState(false);
  const [showModalWorkOrder, setShowModalWorkOrder] = useState(false);

  const [showModalDispatch, setShowModalDispatch] = useState(false);

  interface ICurrency {
    id: number;
    short_name: string;
    name: string;
  }

  const fields: ModalField[] = [
    {
      name: "quotation_terms_conditions",
      label: "Quotation Terms & Conditions",
      as: "textarea",
      rows: 4,
    },
    {
      name: "quotation_remark",
      label: "Quotation Remark",
      as: "textarea",
      rows: 4,
    },
    {
      name: "quotation_note",
      label: "Quotation Note",
      type: "text",
      col: 6,
    },
    {
      name: "quotation_packing_charge_title",
      label: "Quotation Packing Forwarding Charge Title",
      type: "text",
      col: 6,
    },
    {
      name: "quotation_transport_charge_title",
      label: "Quotation Transport Charge Title",
      type: "text",
      col: 6,
    },
    {
      name: "quotation_tcs_title",
      label: "Quotation TCS Title",
      type: "text",
      col: 3,
    },
    {
      name: "quotation_tsc_percentage",
      label: "Quotation TCS Percentage",
      type: "number",
      col: 3,
    },
    {
      name: "order_terms_conditions",
      label: "Sales Order Terms & Conditions",
      as: "textarea",
      rows: 4,
    },
    {
      name: "order_remark",
      label: "Sales Order Remark",
      as: "textarea",
      rows: 4,
    },
    {
      name: "order_note",
      label: "Sales Order Note",
      type: "text",
      col: 6,
    },
    {
      name: "order_packing_charge_title",
      label: "Sales Order Packing Forwarding Charge Title",
      type: "text",
      col: 6,
    },
    {
      name: "order_transport_charge_title",
      label: "Sales Order Transport Charge Title",
      type: "text",
      col: 6,
    },
    {
      name: "order_tcs_title",
      label: "Sales Order TCS Title",
      type: "text",
      col: 3,
    },
    {
      name: "order_tsc_percentage",
      label: "Sales Order TCS Percentage",
      type: "number",
      col: 3,
    },

    {
      name: "sales_invoice_terms_conditions",
      label: "Sales Invoice Terms & Conditions",
      as: "textarea",
      rows: 4,
    },
    {
      name: "sales_invoice_remark",
      label: "Sales Invoice Remark",
      as: "textarea",
      rows: 4,
    },
    {
      name: "sales_invoice_note",
      label: "Sales Invoice Note",
      type: "text",
      col: 6,
    },
    {
      name: "sales_invoice_packing_charge_title",
      label: "Sales Invoice Packing Forwarding Charge Title",
      type: "text",
      col: 6,
    },
    {
      name: "sales_invoice_transport_charge_title",
      label: "Sales Invoice Transport Charge Title",
      type: "text",
      col: 6,
    },
    {
      name: "sales_invoice_tcs_title",
      label: "Sales Invoice TCS Title",
      type: "text",
      col: 3,
    },
    {
      name: "sales_invoice_tsc_percentage",
      label: "Sales Invoice TCS Percentage",
      type: "number",
      col: 3,
    },
    {
      name: "return_sales_invoice_terms_conditions",
      label: "Return Sales Terms & Conditions",
      as: "textarea",
      rows: 4,
    },
    {
      name: "return_sales_invoice_remark",
      label: "Return Sales Remark",
      as: "textarea",
      rows: 4,
    },
    {
      name: "return_sales_invoice_note",
      label: "Return Sales Note",
      type: "text",
      col: 6,
    },
    {
      name: "return_sales_invoice_packing_charge_title",
      label: "Return Sales Packing Forwarding Charge Title",
      type: "text",
      col: 6,
    },
    {
      name: "return_sales_invoice_transport_charge_title",
      label: "Return Sales Transport Charge Title",
      type: "text",
      col: 6,
    },
    {
      name: "return_sales_invoice_tcs_title",
      label: "Return Sales TCS Title",
      type: "text",
      col: 3,
    },
    {
      name: "return_sales_invoice_tsc_percentage",
      label: "Return Sales TCS Percentage",
      type: "number",
      col: 3,
    },
    {
      name: "purchase_order_terms_conditions",
      label: "Purchase Order Terms & Conditions",
      as: "textarea",
      rows: 4,
    },
    {
      name: "purchase_order_remark",
      label: "Purchase Order Remark",
      as: "textarea",
      rows: 4,
    },
    {
      name: "purchase_order_note",
      label: "Purchase Order Note",
      type: "text",
      col: 6,
    },
    {
      name: "purchase_order_packing_charge_title",
      label: "Purchase Order Packing Forwarding Charge Title",
      type: "text",
      col: 6,
    },
    {
      name: "purchase_order_transport_charge_title",
      label: "Purchase Order Transport Charge Title",
      type: "text",
      col: 6,
    },
    {
      name: "purchase_order_tcs_title",
      label: "Purchase Order TCS Title",
      type: "text",
      col: 3,
    },
    {
      name: "purchase_order_tsc_percentage",
      label: "Purchase Order TCS Percentage",
      type: "number",
      col: 3,
    },
    {
      name: "purchase_invoice_terms_conditions",
      label: "Purchase Invoice Terms & Conditions",
      as: "textarea",
      rows: 4,
    },
    {
      name: "purchase_invoice_remark",
      label: "Purchase Invoice Remark",
      as: "textarea",
      rows: 4,
    },
    {
      name: "purchase_invoice_note",
      label: "Purchase Invoice Note",
      type: "text",
      col: 6,
    },
    {
      name: "purchase_invoice_packing_charge_title",
      label: "Purchase Invoice Packing Forwarding Charge Title",
      type: "text",
      col: 6,
    },
    {
      name: "purchase_invoice_transport_charge_title",
      label: "Purchase Invoice Transport Charge Title",
      type: "text",
      col: 6,
    },
    {
      name: "purchase_invoice_tcs_title",
      label: "Purchase Invoice TCS Title",
      type: "text",
      col: 3,
    },
    {
      name: "purchase_invoice_tsc_percentage",
      label: "Purchase Invoice TCS Percentage",
      type: "number",
      col: 3,
    },
    {
      name: "return_purchase_invoice_terms_conditions",
      label: "Return Purchase Invoice Terms & Conditions",
      as: "textarea",
      rows: 4,
    },
    {
      name: "return_purchase_invoice_remark",
      label: "Return Purchase Invoice Remark",
      as: "textarea",
      rows: 4,
    },
    {
      name: "return_purchase_invoice_note",
      label: "Return Purchase Invoice Note",
      type: "text",
      col: 6,
    },
    {
      name: "return_purchase_invoice_packing_charge_title",
      label: "Return Purchase Invoice Packing Forwarding Charge Title",
      type: "text",
      col: 6,
    },
    {
      name: "return_purchase_invoice_transport_charge_title",
      label: "Return Purchase Invoice Transport Charge Title",
      type: "text",
      col: 6,
    },
    {
      name: "return_purchase_invoice_tcs_title",
      label: "Return Purchase Invoice TCS Title",
      type: "text",
      col: 3,
    },
    {
      name: "return_purchase_invoice_tsc_percentage",
      label: "Return Purchase Invoice TCS Percentage",
      type: "number",
      col: 3,
    },

    {
      name: "work_order_terms_conditions",
      label: "Work Order Terms & Conditions",
      as: "textarea",
      rows: 4,
    },
    {
      name: "work_order_remark",
      label: "Work Order Remark",
      as: "textarea",
      rows: 4,
    },
    {
      name: "work_order_note",
      label: "Work Order Note",
      type: "text",
      col: 6,
    },
    {
      name: "work_order_packing_charge_title",
      label: "Work Order Packing Forwarding Charge Title",
      type: "text",
      col: 6,
    },
    {
      name: "work_order_transport_charge_title",
      label: "Work Order Transport Charge Title",
      type: "text",
      col: 6,
    },
    {
      name: "work_order_tcs_title",
      label: "Work Order TCS Title",
      type: "text",
      col: 3,
    },
    {
      name: "work_order_tsc_percentage",
      label: "Work Order TCS Percentage",
      type: "number",
      col: 3,
    },

    {
      name: "inward_terms_conditions",
      label: "Inward Terms & Conditions",
      as: "textarea",
      rows: 4,
    },
    {
      name: "inward_remark",
      label: "Inward Remark",
      as: "textarea",
      rows: 4,
    },
    {
      name: "inward_note",
      label: "Inward Note",
      type: "text",
      col: 6,
    },
    {
      name: "inward_packing_charge_title",
      label: "Inward Packing Forwarding Charge Title",
      type: "text",
      col: 6,
    },
    {
      name: "inward_transport_charge_title",
      label: "Inward Transport Charge Title",
      type: "text",
      col: 6,
    },
    {
      name: "inward_tcs_title",
      label: "Inward TCS Title",
      type: "text",
      col: 3,
    },
    {
      name: "inward_tsc_percentage",
      label: "Inward TCS Percentage",
      type: "number",
      col: 3,
    },

    {
      name: "dispatch_terms_conditions",
      label: "Dispatch Terms & Conditions",
      as: "textarea",
      rows: 4,
    },
    {
      name: "dispatch_remark",
      label: "Dispatch Remark",
      as: "textarea",
      rows: 4,
    },
    {
      name: "dispatch_note",
      label: "Dispatch Note",
      type: "text",
      col: 6,
    },
    {
      name: "dispatch_packing_charge_title",
      label: "Dispatch Packing Forwarding Charge Title",
      type: "text",
      col: 6,
    },
    {
      name: "dispatch_transport_charge_title",
      label: "Dispatch Transport Charge Title",
      type: "text",
      col: 6,
    },
    {
      name: "dispatch_tcs_title",
      label: "Dispatch TCS Title",
      type: "text",
      col: 3,
    },
    {
      name: "dispatch_tsc_percentage",
      label: "Dispatch TCS Percentage",
      type: "number",
      col: 3,
    },
  ];

  // Filter fields for each modal type
  const quotationFields = fields.filter((field) =>
    field.name.startsWith("quotation_"),
  );
  const orderFields = fields.filter((field) => field.name.startsWith("order_"));
  const salesInvoiceFields = fields.filter((field) =>
    field.name.startsWith("sales_invoice_"),
  );
  const returnSalesInvoiceFields = fields.filter((field) =>
    field.name.startsWith("return_sales_invoice_"),
  );
  const purchaseOrderFields = fields.filter((field) =>
    field.name.startsWith("purchase_order_"),
  );
  const purchaseInvoiceFields = fields.filter((field) =>
    field.name.startsWith("purchase_invoice_"),
  );
  const returnPurchaseInvoiceFields = fields.filter((field) =>
    field.name.startsWith("return_purchase_invoice_"),
  );
  const workOrderFields = fields.filter((field) =>
    field.name.startsWith("work_order_"),
  );

  const inwardFields = fields.filter((field) =>
    field.name.startsWith("inward_"),
  );
  const dispatchFields = fields.filter((field) =>
    field.name.startsWith("dispatch_"),
  );

  // Initial values for each modal type
  const modals = [
    {
      show: showModalQuotation,
      setShow: setShowModalQuotation,
      title: "Quotation Details",
      fields: quotationFields,
    },
    {
      show: showModalOrder,
      setShow: setShowModalOrder,
      title: "Order Details",
      fields: orderFields,
    },
    {
      show: showModalSalesInvoice,
      setShow: setShowModalSalesInvoice,
      title: "Sales Invoice Details",
      fields: salesInvoiceFields,
    },
    {
      show: showModalReturnSalesInvoice,
      setShow: setShowModalReturnSalesInvoice,
      title: "Return Sales Invoice Details",
      fields: returnSalesInvoiceFields,
    },
    {
      show: showModalPurchaseOrder,
      setShow: setShowModalPurchaseOrder,
      title: "Purchase Order Details",
      fields: purchaseOrderFields,
    },
    {
      show: showModalPurchaseInvoice,
      setShow: setShowModalPurchaseInvoice,
      title: "Purchase Invoice Details",
      fields: purchaseInvoiceFields,
    },
    {
      show: showModalReturnPurchaseInvoice,
      setShow: setShowModalReturnPurchaseInvoice,
      title: "Return Purchase Invoice Details",
      fields: returnPurchaseInvoiceFields,
    },
    {
      show: showModalWorkOrder,
      setShow: setShowModalWorkOrder,
      title: "Work Order Details",
      fields: workOrderFields,
    },
    {
      show: showModalInward,
      setShow: setShowModalInward,
      title: "Inward Details",
      fields: inwardFields,
    },
    {
      show: showModalDispatch,
      setShow: setShowModalDispatch,
      title: "Dispatch Details",
      fields: dispatchFields,
    },
  ];

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

  const handleSubmit = async (values: any) => {
    if (companyToEdit?.id) {
      updateSetPrefix(values, setRefresh, companyToEdit, onHide);
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

  useEffect(() => {
    if (show && companyToEdit?.id) {
      fetchSetPrefixData(setPagesAndPrefixData, companyToEdit);
    }
  }, [show, companyToEdit]);

  const handelClose = () => {
    setHeaderPreview("");
    // handleRefresh();
    onHide();
    setFooterPreview("");
    setLogPreview("");
    setSignPreview("");
    setCataLogPreview("");
    setCataLogView("");
    // setImage("");
    setStoreBannerOnePreview("");
    setStoreBannertwoOnePreview("");
  };

  useEffect(() => {
    fetchCategoryB2BApi(setCategoryList);
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
          await fetchStateApiForCompany(setStateList, selectedStateId);
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
          await fetchSubCategoryB2BApi(setSubCategoryList, selectedCategoryId);
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
          await fetchCityApiForCompany(setCityList, selectedCityId);
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
        setDefaultCurrency(currencyOption);
        setSelectedCurrency(currencyOption);
        // Update Formik field for consistency
      }
    }
  }, [companyToEdit, currency]);

  const dropDownOptions = [
    { label: "V1-A4 (With GST)", value: 1 },
    { label: "V2-A4 (Without GST)", value: 2 },
    { label: "V3-A5 (With GST)", value: 3 },
    { label: "V4-A5 (Without GST)", value: 4 },
    { label: "V5-POS", value: 5 },
  ];

  return (
    <>

        <div className="mt-5 d-flex justify-content-center">
          <div className="mb-3 py-4  ">
            <div className="row  mx-0 px-2 gy-3  d-flex justify-content-center">
              {/* {isOpenPrefix && ( */}
              <>
                {/* Quotation  */}
                {/* Prefix */}
                <div className="row">
                  {/* Quotation Prefix */}
                  <div className="col-12 col-md-2">
                    <div className="form-group">
                      <label
                        htmlFor="quotation_prefix"
                        className="pb-2 form_label"
                      >
                        Quotation Prefix
                      </label>
                      <Field
                        type="text"
                        name="quotation_prefix"
                        className={`form-control font-size-15 rounded-1 ${errors.quotation_prefix &&
                          touched.quotation_prefix &&
                          "is-invalid input-box-error"
                          }`}
                      />
                      <ErrorMessage
                        name="quotation_prefix"
                        component="div"
                        className="field-error text-danger"
                      />
                    </div>
                  </div>
                  {/* Quotation Title */}
                  <div className="col-12 col-md-2">
                    <div className="form-group">
                      <label
                        htmlFor="quotation_title"
                        className="pb-2 form_label"
                      >
                        Quotation Title
                      </label>
                      <Field
                        type="text"
                        name="quotation_title"
                        className={`form-control font-size-15 rounded-1 ${errors.quotation_title &&
                          touched.quotation_title &&
                          "is-invalid input-box-error"
                          }`}
                      />
                      <ErrorMessage
                        name="quotation_title"
                        component="div"
                        className="field-error text-danger"
                      />
                    </div>
                  </div>
                  {/* Quotation Doc. No. */}
                  <div className="col-12 col-md-2">
                    <div className="form-group">
                      <label
                        htmlFor="quotation_doc_no"
                        className="pb-2 form_label"
                      >
                        Quotation Doc. No.
                      </label>
                      <Field
                        type="text"
                        name="quotation_doc_no"
                        className={`form-control font-size-15 rounded-1 ${errors.quotation_doc_no &&
                          touched.quotation_doc_no &&
                          "is-invalid input-box-error"
                          }`}
                      />
                      <ErrorMessage
                        name="quotation_doc_no"
                        component="div"
                        className="field-error text-danger"
                      />
                    </div>
                  </div>
                  {/* Quotation View Color */}
                  <div className="col-12 col-md-2">
                    <div className="form-group">
                      <label
                        htmlFor="quotation_view_color"
                        className="pb-2 form_label"
                      >
                        Quotation View Color
                      </label>
                      <Field
                        type="color"
                        name="quotation_view_color"
                        className={`form-control font-size-15 rounded-1 ${errors.quotation_view_color &&
                          touched.quotation_view_color &&
                          "is-invalid input-box-error"
                          }`}
                        defaultValue="#000000"
                        style={{
                          backgroundColor: `${values.quotation_view_color}`,
                          width: "100%",
                        }}
                      />
                      <ErrorMessage
                        name="quotation_view_color"
                        component="div"
                        className="field-error text-danger"
                      />
                    </div>
                  </div>
                  {/* Quotation View Format */}
                  <div className="col-12 col-md-3">
                    <div className="form-group">
                      <label
                        htmlFor="quotation_view_formate"
                        className="pb-2 form_label"
                      >
                        Quotation View Format
                      </label>
                      <FormikCustomSearchDropdown
                        name="quotation_view_formate"
                        options={dropDownOptions}
                        className={`form-control font-size-15 rounded-1 ${errors.quotation_view_formate &&
                          touched.quotation_view_formate &&
                          "is-invalid input-box-error"
                          }`}
                      />
                      <ErrorMessage
                        name="quotation_view_formate"
                        component="div"
                        className="field-error text-danger"
                      />
                    </div>
                  </div>
                  {/* Three Dots Button */}
                  <div className="col-12 col-md-1 d-flex align-items-center">
                    <button
                      type="button"
                      className="btn btn-link p-0"
                      onClick={() => setShowModalQuotation(true)}
                      title="More Options"
                    >
                      <i className="bi bi-three-dots-vertical fs-4"></i>
                    </button>
                  </div>
                </div>
                {/* Order Prefix */}
                <div className="col-12 col-md-2 ">
                  <div className="form-group">
                    <label htmlFor="order_prefix" className="pb-2 form_label">
                      Order Prefix
                    </label>
                    <Field
                      type="text"
                      name="order_prefix"
                      className={`form-control font-size-15 rounded-1   ${errors.order_prefix &&
                        touched.order_prefix &&
                        "is-invalid input-box-error"
                        }`}
                    />
                    <ErrorMessage
                      name="order_prefix"
                      component="div"
                      className="field-error text-danger"
                    />
                  </div>
                </div>
                {/* Title */}
                <div className="col-12 col-md-2 ">
                  <div className="form-group">
                    <label htmlFor="order_title" className="pb-2 form_label">
                      Order Title
                    </label>
                    <Field
                      type="text"
                      name="order_title"
                      className={`form-control font-size-15 rounded-1   ${errors.order_title &&
                        touched.order_title &&
                        "is-invalid input-box-error"
                        }`}
                    />
                    <ErrorMessage
                      name="order_title"
                      component="div"
                      className="field-error text-danger"
                    />
                  </div>
                </div>
                {/* Doc.No. */}
                <div className="col-12 col-md-2 ">
                  <div className="form-group">
                    <label htmlFor="order_doc_no" className="pb-2 form_label">
                      Order Doc. No.
                    </label>
                    <Field
                      type="text"
                      name="order_doc_no"
                      className={`form-control font-size-15 rounded-1   ${errors.order_doc_no &&
                        touched.order_doc_no &&
                        "is-invalid input-box-error"
                        }`}
                    />
                    <ErrorMessage
                      name="order_doc_no"
                      component="div"
                      className="field-error text-danger"
                    />
                  </div>
                </div>
                {/* View color */}
                <div className="col-12 col-md-2 ">
                  <div className="form-group">
                    <label htmlFor="order_view_color" className="pb-3 form_label">
                      Order View Color
                    </label>
                    <Field
                      type="color"
                      name="order_view_color"
                      className={`form-control font-size-15 rounded-1   ${errors.order_view_color &&
                        touched.order_view_color &&
                        "is-invalid input-box-error"
                        }`}
                      style={{
                        backgroundColor: `${values.order_view_color}`,
                        width: "100%",
                      }}
                    />
                    <ErrorMessage
                      name="order_prefix"
                      component="div"
                      className="field-error text-danger"
                    />
                  </div>
                </div>
                {/* Print Version */}
                <div className="col-12 col-md-3 ">
                  <div className="form-group">
                    <label
                      htmlFor="order_view_formate"
                      className="pb-3 form_label"
                    >
                      Order View Formate
                    </label>
                    <FormikCustomSearchDropdown
                      name="order_view_formate"
                      options={dropDownOptions}
                      className={`form-control rounded-1   ${errors.order_view_formate &&
                        touched.order_view_formate &&
                        "is-invalid input-box-error"
                        }`}
                    />
                    <ErrorMessage
                      name="order_view_formate"
                      component="div"
                      className="field-error text-danger"
                    />
                  </div>{" "}
                </div>
                <div className="col-12 col-md-1 d-flex align-items-center">
                  <button
                    type="button"
                    className="btn btn-link p-0"
                    onClick={() => setShowModalOrder(true)}
                    title="More Options"
                  >
                    <i className="bi bi-three-dots-vertical fs-4"></i>
                  </button>
                </div>

                {/* Print Setting 
                                  <div className="col-12 col-md-1 ">
                                    <div className="form-group">
                                      <button className="icons ">
                                        <span className="text-white">
                                          <svg xmlns="http://www.w3.org/2000/svg" height="26px" viewBox="0 -960 960 960" width="26px" fill="#000"><path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z" /></svg>

                                        </span>
                                      </button>
                                    </div>{" "}
                                  </div>*/}

                {/* Invoice */}
                {/* Invoice Prefix */}
                <div className="col-12 col-md-2 ">
                  <div className="form-group">
                    <label htmlFor="invoice_prefix" className="pb-2 form_label">
                      Invoice Prefix
                    </label>
                    <Field
                      type="text"
                      name="invoice_prefix"
                      className={`form-control font-size-15 rounded-1   ${errors.invoice_prefix &&
                        touched.invoice_prefix &&
                        "is-invalid input-box-error"
                        }`}
                    />
                    <ErrorMessage
                      name="invoice_prefix"
                      component="div"
                      className="field-error text-danger"
                    />
                  </div>
                </div>
                {/* Title */}
                <div className="col-12 col-md-2 ">
                  <div className="form-group">
                    <label htmlFor="invoice_title" className="pb-2 form_label">
                      Invoice Title
                    </label>
                    <Field
                      type="text"
                      name="invoice_title"
                      className={`form-control font-size-15 rounded-1   ${errors.invoice_title &&
                        touched.invoice_title &&
                        "is-invalid input-box-error"
                        }`}
                    />
                    <ErrorMessage
                      name="invoice_prefix"
                      component="div"
                      className="field-error text-danger"
                    />
                  </div>
                </div>
                {/* Doc.No. */}
                <div className="col-12 col-md-2 ">
                  <div className="form-group">
                    <label htmlFor="invoice_doc_no" className="pb-2 form_label">
                      Invoice Doc. No.
                    </label>
                    <Field
                      type="text"
                      name="invoice_doc_no"
                      className={`form-control font-size-15 rounded-1   ${errors.invoice_doc_no &&
                        touched.invoice_doc_no &&
                        "is-invalid input-box-error"
                        }`}
                    />
                    <ErrorMessage
                      name="invoice_doc_no"
                      component="div"
                      className="field-error text-danger"
                    />
                  </div>
                </div>
                {/* View color */}
                <div className="col-12 col-md-2 ">
                  <div className="form-group">
                    <label
                      htmlFor="invoice_view_color"
                      className="pb-3 form_label"
                    >
                      Invoice View Color
                    </label>
                    <Field
                      type="color"
                      name="invoice_view_color"
                      className={`form-control rounded-1   ${errors.invoice_view_color &&
                        touched.invoice_view_color &&
                        "is-invalid input-box-error"
                        }`}
                      style={{
                        backgroundColor: `${values.invoice_view_color}`,
                        width: "100%",
                      }}
                    />
                    <ErrorMessage
                      name="invoice_prefix"
                      component="div"
                      className="field-error text-danger"
                    />
                  </div>
                </div>
                {/* Print Version */}
                <div className="col-12 col-md-3 ">
                  <div className="form-group">
                    <label
                      htmlFor="invoice_view_formate"
                      className="pb-3 form_label"
                    >
                      Invoice View Formate
                    </label>
                    <FormikCustomSearchDropdown
                      name="invoice_view_formate"
                      options={dropDownOptions}
                      className={`form-control rounded-1   ${errors.invoice_view_formate &&
                        touched.invoice_view_formate &&
                        "is-invalid input-box-error"
                        }`}
                    />
                    <ErrorMessage
                      name="invoice_view_formate"
                      component="div"
                      className="field-error text-danger"
                    />
                  </div>{" "}
                </div>
                <div className="col-12 col-md-1 d-flex align-items-center">
                  <button
                    type="button"
                    className="btn btn-link p-0"
                    onClick={() => setShowModalSalesInvoice(true)}
                    title="More Options"
                  >
                    <i className="bi bi-three-dots-vertical fs-4"></i>
                  </button>
                </div>

                {/* Print Setting 
                                <div className="col-12 col-md-1 ">
                                  <div className="form-group">
                                    <button className="icons ">
                                      <span className="text-white">
                                        <svg xmlns="http://www.w3.org/2000/svg" height="26px" viewBox="0 -960 960 960" width="26px" fill="#000"><path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z" /></svg>

                                      </span>
                                    </button>
                                  </div>{" "}
                                </div>*/}

                {/* Return Sales Invoice  */}
                {/* Prefix */}
                <div className="col-12 col-md-2 ">
                  <div className="form-group">
                    <label
                      htmlFor="return_sales_invoice_prefix"
                      className="pb-2 form_label"
                    >
                      Return Sales Invoice Prefix
                    </label>
                    <Field
                      type="text"
                      name="return_sales_invoice_prefix"
                      className={`form-control font-size-15 rounded-1   ${errors.return_sales_invoice_prefix &&
                        touched.return_sales_invoice_prefix &&
                        "is-invalid input-box-error"
                        }`}
                    />
                    <ErrorMessage
                      name="return_sales_invoice_prefix"
                      component="div"
                      className="field-error text-danger"
                    />
                  </div>
                </div>
                {/* Title */}
                <div className="col-12 col-md-2 ">
                  <div className="form-group">
                    <label
                      htmlFor="return_sales_invoice_title"
                      className="pb-2 form_label"
                    >
                      Return Sales Invoice Title
                    </label>
                    <Field
                      type="text"
                      name="return_sales_invoice_title"
                      className={`form-control font-size-15 rounded-1   ${errors.return_sales_invoice_title &&
                        touched.return_sales_invoice_title &&
                        "is-invalid input-box-error"
                        }`}
                    />
                    <ErrorMessage
                      name="return_sales_invoice_title"
                      component="div"
                      className="field-error text-danger"
                    />
                  </div>
                </div>
                {/* Doc.No. */}
                <div className="col-12 col-md-2 ">
                  <div className="form-group">
                    <label
                      htmlFor="return_sales_invoice_doc_no"
                      className="pb-2 form_label"
                    >
                      Return Sales Invoice Doc. No.
                    </label>
                    <Field
                      type="text"
                      name="return_sales_invoice_doc_no"
                      className={`form-control font-size-15 rounded-1   ${errors.return_sales_invoice_doc_no &&
                        touched.return_sales_invoice_doc_no &&
                        "is-invalid input-box-error"
                        }`}
                    />
                    <ErrorMessage
                      name="return_sales_invoice_doc_no"
                      component="div"
                      className="field-error text-danger"
                    />
                  </div>
                </div>
                {/* View color */}
                <div className="col-12 col-md-2 ">
                  <div className="form-group">
                    <label
                      htmlFor="return_sales_invoice_view_color"
                      className="pb-3 form_label"
                    >
                      Return Sales Invoice View Color
                    </label>
                    <Field
                      type="color"
                      name="return_sales_invoice_view_color"
                      className={`form-control font-size-15 rounded-1   ${errors.return_sales_invoice_view_color &&
                        touched.return_sales_invoice_view_color &&
                        "is-invalid input-box-error"
                        }`}
                      defaultValue={"#000000"}
                      style={{
                        backgroundColor: `${values.return_sales_invoice_view_color}`,
                        width: "100%",
                      }}
                    />
                    <ErrorMessage
                      name="return_sales_invoice_view_color"
                      component="div"
                      className="field-error text-danger"
                    />
                  </div>
                </div>
                {/* Print Version */}
                <div className="col-12 col-md-3 ">
                  <div className="form-group">
                    <label
                      htmlFor="return_sales_invoice_view_formate"
                      className="pb-3 form_label"
                    >
                      Return Sales Invoice View Formate
                    </label>
                    <FormikCustomSearchDropdown
                      name="return_sales_invoice_view_formate"
                      options={dropDownOptions}
                      className={`form-control rounded-1 ${errors.return_sales_invoice_view_formate &&
                        touched.return_sales_invoice_view_formate &&
                        "is-invalid input-box-error"
                        }`}
                    // onChange={(selectedOption: any) => {
                    //   setFieldValue("quotation_view_formate", selectedOption?.value || "");
                    //   setViewFormate(selectedOption?.value || "");
                    // }}
                    />
                    <ErrorMessage
                      name="return_sales_invoice_view_formate"
                      component="div"
                      className="field-error text-danger"
                    />
                  </div>{" "}
                </div>

                <div className="col-12 col-md-1 d-flex align-items-center">
                  <button
                    type="button"
                    className="btn btn-link p-0"
                    onClick={() => setShowModalReturnSalesInvoice(true)}
                    title="More Options"
                  >
                    <i className="bi bi-three-dots-vertical fs-4"></i>
                  </button>
                </div>

                {/* Purchase Order */}
                {/* Prefix */}
                <div className="col-12 col-md-2 ">
                  <div className="form-group">
                    <label
                      htmlFor="purchase_ord_prefix"
                      className="pb-2 form_label"
                    >
                      Purchase Order
                    </label>
                    <Field
                      type="text"
                      name="purchase_ord_prefix"
                      className={`form-control font-size-15 rounded-1   ${errors.purchase_ord_prefix &&
                        touched.purchase_ord_prefix &&
                        "is-invalid input-box-error"
                        }`}
                    />
                    <ErrorMessage
                      name="purchase_ord_prefix"
                      component="div"
                      className="field-error text-danger"
                    />
                  </div>
                </div>
                {/* Title*/}
                <div className="col-12 col-md-2 ">
                  <div className="form-group">
                    <label
                      htmlFor="purchase_order_title"
                      className="pb-2 form_label"
                    >
                      Purchase Order Title
                    </label>
                    <Field
                      type="text"
                      name="purchase_order_title"
                      className={`form-control font-size-15 rounded-1   ${errors.purchase_order_title &&
                        touched.purchase_order_title &&
                        "is-invalid input-box-error"
                        }`}
                    />
                    <ErrorMessage
                      name="purchase_order_title"
                      component="div"
                      className="field-error text-danger"
                    />
                  </div>
                </div>
                {/* Doc. No.  */}
                <div className="col-12 col-md-2 ">
                  <div className="form-group">
                    <label
                      htmlFor="purchase_order_doc_no"
                      className="pb-2 form_label"
                    >
                      Purchase Order Doc. No.
                    </label>
                    <Field
                      type="text"
                      name="purchase_order_doc_no"
                      className={`form-control font-size-15 rounded-1   ${errors.purchase_order_doc_no &&
                        touched.purchase_order_doc_no &&
                        "is-invalid input-box-error"
                        }`}
                    />
                    <ErrorMessage
                      name="purchase_order_doc_no"
                      component="div"
                      className="field-error text-danger"
                    />
                  </div>
                </div>
                {/* View Color */}
                <div className="col-12 col-md-2 ">
                  <div className="form-group">
                    <label
                      htmlFor="purchase_order_view_color"
                      className="pb-3 form_label"
                    >
                      Purchase Order View Color
                    </label>
                    <Field
                      type="color"
                      name="purchase_order_view_color"
                      className={`form-control font-size-15 rounded-1   ${errors.purchase_order_view_color &&
                        touched.purchase_order_view_color &&
                        "is-invalid input-box-error"
                        }`}
                      style={{
                        backgroundColor: `${values.purchase_order_view_color}`,
                        width: "100%",
                      }}
                    />
                    <ErrorMessage
                      name="purchase_order_view_color"
                      component="div"
                      className="field-error text-danger"
                    />
                  </div>
                </div>
                {/* Print Version */}
                <div className="col-12 col-md-3 ">
                  <div className="form-group">
                    <label
                      htmlFor="purchase_order_view_formate"
                      className="pb-3 form_label"
                    >
                      Purchase Order View Formate
                    </label>
                    <FormikCustomSearchDropdown
                      name="purchase_order_view_formate"
                      options={dropDownOptions}
                      className={`form-control rounded-1   ${errors.purchase_order_view_formate &&
                        touched.purchase_order_view_formate &&
                        "is-invalid input-box-error"
                        }`}
                    />
                    <ErrorMessage
                      name="purchase_order_view_formate"
                      component="div"
                      className="field-error text-danger"
                    />
                  </div>{" "}
                </div>
                {/* three dote */}
                <div className="col-12 col-md-1 d-flex align-items-center">
                  <button
                    type="button"
                    className="btn btn-link p-0"
                    onClick={() => setShowModalPurchaseOrder(true)}
                    title="More Options"
                  >
                    <i className="bi bi-three-dots-vertical fs-4"></i>
                  </button>
                </div>

                {/* Purchase */}
                {/* Prefix */}
                <div className="col-12 col-md-2 ">
                  <div className="form-group">
                    <label htmlFor="purchase_prefix" className="pb-2 form_label">
                      Purchase Invoice Prefix
                    </label>
                    <Field
                      type="text"
                      name="purchase_prefix"
                      className={`form-control font-size-15 rounded-1   ${errors.purchase_prefix &&
                        touched.purchase_prefix &&
                        "is-invalid input-box-error"
                        }`}
                    />
                    <ErrorMessage
                      name="purchase_prefix"
                      component="div"
                      className="field-error text-danger"
                    />
                  </div>
                </div>
                {/* Title*/}
                <div className="col-12 col-md-2 ">
                  <div className="form-group">
                    <label htmlFor="purchase_title" className="pb-2 form_label">
                      Purchase Invoice Title
                    </label>
                    <Field
                      type="text"
                      name="purchase_title"
                      className={`form-control font-size-15 rounded-1   ${errors.purchase_title &&
                        touched.purchase_title &&
                        "is-invalid input-box-error"
                        }`}
                    />
                    <ErrorMessage
                      name="purchase_title"
                      component="div"
                      className="field-error text-danger"
                    />
                  </div>
                </div>
                {/* Doc. No.  */}
                <div className="col-12 col-md-2 ">
                  <div className="form-group">
                    <label htmlFor="purchase_doc_no" className="pb-2 form_label">
                      Purchase Invoice Doc. No.
                    </label>
                    <Field
                      type="text"
                      name="purchase_doc_no"
                      className={`form-control font-size-15 rounded-1   ${errors.purchase_doc_no &&
                        touched.purchase_doc_no &&
                        "is-invalid input-box-error"
                        }`}
                    />
                    <ErrorMessage
                      name="purchase_doc_no"
                      component="div"
                      className="field-error text-danger"
                    />
                  </div>
                </div>
                {/* View Color */}
                <div className="col-12 col-md-2 ">
                  <div className="form-group">
                    <label
                      htmlFor="purchase_view_color"
                      className="pb-3 form_label"
                    >
                      Purchase Invoice View Color
                    </label>
                    <Field
                      type="color"
                      name="purchase_view_color"
                      className={`form-control font-size-15 rounded-1   ${errors.purchase_view_color &&
                        touched.purchase_view_color &&
                        "is-invalid input-box-error"
                        }`}
                      style={{
                        backgroundColor: `${values.purchase_view_color}`,
                        width: "100%",
                      }}
                    />
                    <ErrorMessage
                      name="purchase_view_color"
                      component="div"
                      className="field-error text-danger"
                    />
                  </div>
                </div>
                {/* Print Version */}
                <div className="col-12 col-md-3 ">
                  <div className="form-group">
                    <label
                      htmlFor="purchase_view_formate"
                      className="pb-3 form_label"
                    >
                      Purchase Invoice View Formate
                    </label>
                    <FormikCustomSearchDropdown
                      name="purchase_view_formate"
                      options={dropDownOptions}
                      className={`form-control rounded-1   ${errors.purchase_view_formate &&
                        touched.purchase_view_formate &&
                        "is-invalid input-box-error"
                        }`}
                    />
                    <ErrorMessage
                      name="purchase_view_formate"
                      component="div"
                      className="field-error text-danger"
                    />
                  </div>{" "}
                </div>
                {/* three dote */}
                <div className="col-12 col-md-1 d-flex align-items-center">
                  <button
                    type="button"
                    className="btn btn-link p-0"
                    onClick={() => setShowModalPurchaseInvoice(true)}
                    title="More Options"
                  >
                    <i className="bi bi-three-dots-vertical fs-4"></i>
                  </button>
                </div>

                {/* Return Purchase Invoice  */}
                {/* Prefix */}
                <div className="col-12 col-md-2 ">
                  <div className="form-group">
                    <label
                      htmlFor="return_purchase_invoice_prefix"
                      className="pb-2 form_label"
                    >
                      Return Purchase Invoice Prefix
                    </label>
                    <Field
                      type="text"
                      name="return_purchase_invoice_prefix"
                      className={`form-control font-size-15 rounded-1   ${errors.return_purchase_invoice_prefix &&
                        touched.return_purchase_invoice_prefix &&
                        "is-invalid input-box-error"
                        }`}
                    />
                    <ErrorMessage
                      name="return_purchase_invoice_prefix"
                      component="div"
                      className="field-error text-danger"
                    />
                  </div>
                </div>
                {/* Title */}
                <div className="col-12 col-md-2 ">
                  <div className="form-group">
                    <label
                      htmlFor="return_purchase_invoice_title"
                      className="pb-2 form_label"
                    >
                      Return Purchase Invoice Title
                    </label>
                    <Field
                      type="text"
                      name="return_purchase_invoice_title"
                      className={`form-control font-size-15 rounded-1   ${errors.return_purchase_invoice_title &&
                        touched.return_purchase_invoice_title &&
                        "is-invalid input-box-error"
                        }`}
                    />
                    <ErrorMessage
                      name="return_purchase_invoice_title"
                      component="div"
                      className="field-error text-danger"
                    />
                  </div>
                </div>
                {/* Doc.No. */}
                <div className="col-12 col-md-2 ">
                  <div className="form-group">
                    <label
                      htmlFor="return_purchase_invoice_doc_no"
                      className="pb-2 form_label"
                    >
                      Return Purchase Invoice Doc. No.
                    </label>
                    <Field
                      type="text"
                      name="return_purchase_invoice_doc_no"
                      className={`form-control font-size-15 rounded-1   ${errors.return_purchase_invoice_doc_no &&
                        touched.return_purchase_invoice_doc_no &&
                        "is-invalid input-box-error"
                        }`}
                    />
                    <ErrorMessage
                      name="return_purchase_invoice_doc_no"
                      component="div"
                      className="field-error text-danger"
                    />
                  </div>
                </div>
                {/* View color */}
                <div className="col-12 col-md-2 ">
                  <div className="form-group">
                    <label
                      htmlFor="return_purchase_invoice_view_color"
                      className="pb-3 form_label"
                    >
                      Return Purchase Invoice View Color
                    </label>
                    <Field
                      type="color"
                      name="return_purchase_invoice_view_color"
                      className={`form-control font-size-15 rounded-1   ${errors.return_purchase_invoice_view_color &&
                        touched.return_purchase_invoice_view_color &&
                        "is-invalid input-box-error"
                        }`}
                      defaultValue={"#000000"}
                      style={{
                        backgroundColor: `${values.return_purchase_invoice_view_color}`,
                        width: "100%",
                      }}
                    />
                    <ErrorMessage
                      name="return_purchase_invoice_view_color"
                      component="div"
                      className="field-error text-danger"
                    />
                  </div>
                </div>
                {/* Print Version */}
                <div className="col-12 col-md-3 ">
                  <div className="form-group">
                    <label
                      htmlFor="return_purchase_invoice_view_formate"
                      className="pb-3 form_label"
                    >
                      Return Purchase Invoice View Formate
                    </label>
                    <FormikCustomSearchDropdown
                      name="return_purchase_invoice_view_formate"
                      options={dropDownOptions}
                      className={`form-control rounded-1 ${errors.return_purchase_invoice_view_formate &&
                        touched.return_purchase_invoice_view_formate &&
                        "is-invalid input-box-error"
                        }`}
                    // onChange={(selectedOption: any) => {
                    //   setFieldValue("quotation_view_formate", selectedOption?.value || "");
                    //   setViewFormate(selectedOption?.value || "");
                    // }}
                    />
                    <ErrorMessage
                      name="return_purchase_invoice_view_formate"
                      component="div"
                      className="field-error text-danger"
                    />
                  </div>{" "}
                </div>
                {/* three dote */}
                <div className="col-12 col-md-1 d-flex align-items-center">
                  <button
                    type="button"
                    className="btn btn-link p-0"
                    onClick={() => setShowModalReturnPurchaseInvoice(true)}
                    title="More Options"
                  >
                    <i className="bi bi-three-dots-vertical fs-4"></i>
                  </button>
                </div>

                {/* Inward  */}
                {/* Prefix */}
                <div className="col-12 col-md-2 ">
                  <div className="form-group">
                    <label htmlFor="inward_prefix" className="pb-2 form_label">
                      Inward Prefix
                    </label>
                    <Field
                      type="text"
                      name="inward_prefix"
                      className={`form-control font-size-15 rounded-1   ${errors.inward_prefix &&
                        touched.inward_prefix &&
                        "is-invalid input-box-error"
                        }`}
                    />
                    <ErrorMessage
                      name="inward_prefix"
                      component="div"
                      className="field-error text-danger"
                    />
                  </div>
                </div>
                {/* Title */}
                <div className="col-12 col-md-2 ">
                  <div className="form-group">
                    <label htmlFor="inward_title" className="pb-2 form_label">
                      Inward Title
                    </label>
                    <Field
                      type="text"
                      name="inward_title"
                      className={`form-control font-size-15 rounded-1   ${errors.inward_title &&
                        touched.inward_title &&
                        "is-invalid input-box-error"
                        }`}
                    />
                    <ErrorMessage
                      name="inward_title"
                      component="div"
                      className="field-error text-danger"
                    />
                  </div>
                </div>
                {/* Doc.No. */}
                <div className="col-12 col-md-2 ">
                  <div className="form-group">
                    <label htmlFor="inward_doc_no" className="pb-2 form_label">
                      Inward Doc. No.
                    </label>
                    <Field
                      type="text"
                      name="inward_doc_no"
                      className={`form-control font-size-15 rounded-1   ${errors.inward_doc_no &&
                        touched.inward_doc_no &&
                        "is-invalid input-box-error"
                        }`}
                    />
                    <ErrorMessage
                      name="inward_doc_no"
                      component="div"
                      className="field-error text-danger"
                    />
                  </div>
                </div>
                {/* View color */}
                <div className="col-12 col-md-2 ">
                  <div className="form-group">
                    <label
                      htmlFor="inward_view_color"
                      className="pb-3 form_label"
                    >
                      Inward View Color
                    </label>
                    <Field
                      type="color"
                      name="inward_view_color"
                      className={`form-control font-size-15 rounded-1   ${errors.inward_view_color &&
                        touched.inward_view_color &&
                        "is-invalid input-box-error"
                        }`}
                      defaultValue={"#000000"}
                      style={{
                        backgroundColor: `${values.inward_view_color}`,
                        width: "100%",
                      }}
                    />
                    <ErrorMessage
                      name="inward_view_color"
                      component="div"
                      className="field-error text-danger"
                    />
                  </div>
                </div>
                {/* Print Version */}
                <div className="col-12 col-md-3 ">
                  <div className="form-group">
                    <label
                      htmlFor="inward_view_formate"
                      className="pb-3 form_label"
                    >
                      Inward View Formate
                    </label>
                    <FormikCustomSearchDropdown
                      name="inward_view_formate"
                      options={dropDownOptions}
                      className={`form-control rounded-1 ${errors.inward_view_formate &&
                        touched.inward_view_formate &&
                        "is-invalid input-box-error"
                        }`}
                    // onChange={(selectedOption: any) => {
                    //   setFieldValue("quotation_view_formate", selectedOption?.value || "");
                    //   setViewFormate(selectedOption?.value || "");
                    // }}
                    />
                    <ErrorMessage
                      name="inward_view_formate"
                      component="div"
                      className="field-error text-danger"
                    />
                  </div>{" "}
                </div>
                {/* three dote */}
                <div className="col-12 col-md-1 d-flex align-items-center">
                  <button
                    type="button"
                    className="btn btn-link p-0"
                    onClick={() => setShowModalInward(true)}
                    title="More Options"
                  >
                    <i className="bi bi-three-dots-vertical fs-4"></i>
                  </button>
                </div>

                {/* Dispatch  */}
                {/* Prefix */}
                <div className="col-12 col-md-2 ">
                  <div className="form-group">
                    <label htmlFor="dispatch_prefix" className="pb-2 form_label">
                      Dispatch Prefix
                    </label>
                    <Field
                      type="text"
                      name="dispatch_prefix"
                      className={`form-control font-size-15 rounded-1   ${errors.dispatch_prefix &&
                        touched.dispatch_prefix &&
                        "is-invalid input-box-error"
                        }`}
                    />
                    <ErrorMessage
                      name="dispatch_prefix"
                      component="div"
                      className="field-error text-danger"
                    />
                  </div>
                </div>
                {/* Title */}
                <div className="col-12 col-md-2 ">
                  <div className="form-group">
                    <label htmlFor="dispatch_title" className="pb-2 form_label">
                      Dispatch Title
                    </label>
                    <Field
                      type="text"
                      name="dispatch_title"
                      className={`form-control font-size-15 rounded-1   ${errors.dispatch_title &&
                        touched.dispatch_title &&
                        "is-invalid input-box-error"
                        }`}
                    />
                    <ErrorMessage
                      name="dispatch_title"
                      component="div"
                      className="field-error text-danger"
                    />
                  </div>
                </div>
                {/* Doc.No. */}
                <div className="col-12 col-md-2 ">
                  <div className="form-group">
                    <label htmlFor="dispatch_doc_no" className="pb-2 form_label">
                      Dispatch Doc. No.
                    </label>
                    <Field
                      type="text"
                      name="dispatch_doc_no"
                      className={`form-control font-size-15 rounded-1   ${errors.dispatch_doc_no &&
                        touched.dispatch_doc_no &&
                        "is-invalid input-box-error"
                        }`}
                    />
                    <ErrorMessage
                      name="dispatch_doc_no"
                      component="div"
                      className="field-error text-danger"
                    />
                  </div>
                </div>
                {/* View color */}
                <div className="col-12 col-md-2 ">
                  <div className="form-group">
                    <label
                      htmlFor="dispatch_view_color"
                      className="pb-3 form_label"
                    >
                      Dispatch View Color
                    </label>
                    <Field
                      type="color"
                      name="dispatch_view_color"
                      className={`form-control font-size-15 rounded-1   ${errors.dispatch_view_color &&
                        touched.dispatch_view_color &&
                        "is-invalid input-box-error"
                        }`}
                      defaultValue={"#000000"}
                      style={{
                        backgroundColor: `${values.dispatch_view_color}`,
                        width: "100%",
                      }}
                    />
                    <ErrorMessage
                      name="dispatch_view_color"
                      component="div"
                      className="field-error text-danger"
                    />
                  </div>
                </div>
                {/* Print Version */}
                <div className="col-12 col-md-3 ">
                  <div className="form-group">
                    <label
                      htmlFor="dispatch_view_formate"
                      className="pb-3 form_label"
                    >
                      Dispatch View Formate
                    </label>
                    <FormikCustomSearchDropdown
                      name="dispatch_view_formate"
                      options={dropDownOptions}
                      className={`form-control rounded-1 ${errors.dispatch_view_formate &&
                        touched.dispatch_view_formate &&
                        "is-invalid input-box-error"
                        }`}
                    // onChange={(selectedOption: any) => {
                    //   setFieldValue("quotation_view_formate", selectedOption?.value || "");
                    //   setViewFormate(selectedOption?.value || "");
                    // }}
                    />
                    <ErrorMessage
                      name="dispatch_view_formate"
                      component="div"
                      className="field-error text-danger"
                    />
                  </div>{" "}
                </div>
                {/* three dote */}
                <div className="col-12 col-md-1 d-flex align-items-center">
                  <button
                    type="button"
                    className="btn btn-link p-0"
                    onClick={() => setShowModalDispatch(true)}
                    title="More Options"
                  >
                    <i className="bi bi-three-dots-vertical fs-4"></i>
                  </button>
                </div>
                {/* Dispatch  */}

                {/* Workorder */}
                {/* Prefix */}
                {/* <div className="col-12 col-md-2 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="workorder_prefix"
                                        className="pb-2 form_label"
                                      >
                                        Workorder Prefix
                                      </label>
                                      <Field
                                        type="text"
                                        name="workorder_prefix"
                                        className={`form-control font-size-15 rounded-1   ${errors.order_prefix &&
                                          touched.order_prefix &&
                                          "is-invalid input-box-error"
                                          }`}
                                      />
                                      <ErrorMessage
                                        name="workorder_prefix"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div> */}
                {/* Title */}
                {/* <div className="col-12 col-md-2 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="workorder_title"
                                        className="pb-2 form_label"
                                      >
                                        Workorder Title
                                      </label>
                                      <Field
                                        type="text"
                                        name="workorder_title"
                                        className={`form-control font-size-15 rounded-1   ${errors.workorder_title &&
                                          touched.workorder_title &&
                                          "is-invalid input-box-error"
                                          }`}
                                      />
                                      <ErrorMessage
                                        name="workorder_title"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div> */}
                {/* Doc.No. */}
                {/* <div className="col-12 col-md-2 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="workorder_doc_no"
                                        className="pb-2 form_label"
                                      >
                                        Workorder Doc. No.
                                      </label>
                                      <Field
                                        type="text"
                                        name="workorder_doc_no"
                                        className={`form-control font-size-15 rounded-1   ${errors.workorder_doc_no &&
                                          touched.workorder_doc_no &&
                                          "is-invalid input-box-error"
                                          }`}
                                      />
                                      <ErrorMessage
                                        name="workorder_doc_no"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div> */}
                {/* View color */}
                {/* <div className="col-12 col-md-2 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="workorder_view_color"
                                        className="pb-3 form_label"
                                      >
                                        Workorder View Color
                                      </label>
                                      <Field
                                        type="color"
                                        name="workorder_view_color"
                                        className={`form-control font-size-15 rounded-1   ${errors.workorder_view_color &&
                                          touched.workorder_view_color &&
                                          "is-invalid input-box-error"
                                          }`}
                                        style={{
                                          backgroundColor: `${values.workorder_view_color}`,
                                          width: "100%",
                                        }}
                                      />
                                      <ErrorMessage
                                        name="workorder_view_color"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div> */}
                {/* Print Version */}
                {/* <div className="col-12 col-md-3 ">
                                    <div className="form-group">
                                      <label
                                        htmlFor="workorder_view_formate"
                                        className="pb-3 form_label"
                                      >
                                        Workorder View Color
                                      </label>
                                      <FormikCustomSearchDropdown
                                        name="workorder_view_formate"
                                        options={dropDownOptions}
                                        className={`form-control rounded-1   ${errors.workorder_view_formate &&
                                          touched.workorder_view_formate &&
                                          "is-invalid input-box-error"
                                          }`}
                                      />
                                      <ErrorMessage
                                        name="workorder_view_formate"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>{" "}
                                  </div> */}
                {/* three dote */}
                {/* <div className="col-12 col-md-1 d-flex align-items-center">
                                    <button
                                      type="button"
                                      className="btn btn-link p-0"
                                      onClick={() => setShowModalWorkOrder(true)}
                                      title="More Options"
                                    >
                                      <i className="bi bi-three-dots-vertical fs-4"></i>
                                    </button>
                                  </div> */}

                <div className="col-12 col-md-3"></div>
              </>
              {/* )} */}

              <div
                style={{
                  bottom: 0,
                  background: "#fff",
                  padding: "15px",
                  borderTop: "1px solid #ddd",
                  zIndex: 1000,
                  position: "sticky"
                }}
                className="d-flex justify-content-end gap-2"
              >
                <button
                  type="button"
                  className="modal-button1 rounded-1 px-4 py-2 ms-2"
                  onClick={handelClose}
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
                  onClick={() => handleSubmit(values)}
                  className="btn btn-primary px-4 py-2 ms-2  text-light form_label rounded-1"
                  style={{
                    backgroundColor: "#f58634",
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      {modals.map((modal, index) => (
        <NewCompanyPrifixModal
          key={index}
          show={modal.show}
          onClose={() => modal.setShow(false)}
          title={modal.title}
          fields={modal.fields}
          footerButtons={[
            {
              label: "Save",
              variant: "primary",
              onClick: () => {
                // Update parent form values
                modal.fields.forEach((field) => {
                  setFieldValue(field.name, values[field.name]);
                });
                modal.setShow(false);
              },
            },
          ]}
        />
      ))}

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
      <OtpConfirmationModal
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
      {/* {isModalImageTool && (
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

      {/* {isOpenGoogleSheetsColumnConfigModel && (
        <GoogleSheetsColumnConfigModal
          show={isOpenGoogleSheetsColumnConfigModel}
          onHide={() => setIsGoogleSheetsColumnConfigModel(false)}
          RequiredDetail={googleSheetModalDetails ?? null}
        />
      )} */}
    </>
  );
};
export default NewSetPrefixAndPage;
