import {
  ErrorMessage,
  Field,
  Form,
  Formik,
  FormikErrors,
  FormikTouched,
} from "formik";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import DatePicker, { DateObject } from "react-multi-date-picker";
import TimePicker from "react-multi-date-picker/plugins/time_picker";
import { SingleValue } from "react-select";
import { toast } from "react-toastify";
import { AppContext } from "../../../common/AppContext";
import {
  formatDateSendDataBaseV2,
  formatDateTimeSendDataBaseV2,
  getCustomFieldDatavalues,
  openInNewTab,
  useEscapeKey,
} from "../../../common/SharedFunction";
import FormikCustomSearchDropdown from "../../../components/FormikCustomSearchDropdown";
import AddCategoryModal from "../../../components/model/AddCategoryModal";
import MultiSelect from "../../../components/MultiSelect";
import {
  BIG_TEXT_LENGTH,
  DEFAULT_STATUS_CODE_SUCCESS,
  MINI_TEXT_LENGTH,
  SMALL_TEXT_LENGTH,
  TEXTAREA_TEXT_LENGTH,
} from "../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../helpers/AppEnum";
import { IOption } from "../../../helpers/AppInterface";
import useCheckUserPermission from "../../../hooks/useCheckUserPermission";
import { axiosInstance } from "../../../services/axiosInstance";
import {
  fetchCategoryApi,
  ICreateInquiry,
  ICustomFromList,
} from "../../right-side/create-inquiry/CreateInquiryController";
import { fetchDataUser } from "../LeftSideController";
import {
  checkContactNumberDuplication,
  createContact,
  createCustomerInitialValues,
  createCustomerValidationSchema,
  fetchCategoryApiForContact,
  fetchCustomInqFromApiForContact,
  fetchPriceListApiForContact,
  fetchProductApiForContact,
  requirementTypesListForContact,
  updateContact,
} from "./CreateContactController";
import useMiracleFlagStore from "../../../store/miracle/useMiracleFlagStore";

const CreateContactView = ({
  show,
  onHide,
  setContact = (data: boolean) => {},
  contactData,
  headerName,
  setIsCreateContact1,
  closeChatAbout,
}: any) => {
  interface Label {
    id: number;
    lable_name: string;
    color: string;
  }

  interface LabelOption {
    value: number;
    label: string;
  }
  const { isEditContact, showRightSide, setShowRightSide } =
    useContext(AppContext)!;
  const isSubmittingRef = useRef(false);

  const isFeatureEnabled = useMiracleFlagStore(
    (state) => state.isFeatureEnabled,
  );

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

  const [countriesList, setCountriesList] = useState([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [stateList, setStateList] = useState([]);
  const [cityList, setCityList] = useState([]);
  const [selectedCountryId, setSelectedCountryId] = useState<
    number | undefined
  >();
  const [selectedStateId, setSelectedStateId] = useState<number | undefined>();
  const [selectedCityId, setSelectedCityId] = useState<number | undefined>();
  const [sourceOfTypesList, setSourceOfTypesList] = useState([]);
  const [labelOfTypesList, setLabelOfTypesList] = useState<Label[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<LabelOption[]>([]);
  const [priceList, setPriceList] = useState<any>([]);
  const [categoryList, setCategoryList] = useState<any>([]);
  const [productList, setProductList] = useState<any>([]);
  const [labelList, setLabelList] = useState<any>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<
    number | undefined
  >();
  const [customFormList, setCustomFromList] = useState<ICustomFromList[]>([]);
  const [areaList, setAreaList] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(contactData ? true : false);
  const [isMenuOpen2, setIsMenuOpen2] = useState(contactData ? false : true);
  const [users, setUsers] = useState<any[]>([]);
  const [noDataFound, setNoDataFound] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [checkToken, setCheckToken] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [filterParams, setFilterParams] = useState<string>();
  const itemsPerPage = 10;
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [contactId, setContactId] = useState<number>();

  const [searchTimeout, setSearchTimeout] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);
  const [referenceContactId, setReferenceContactId] = useState<number | null>(
    null,
  );

  const [labelsLoading, setLabelsLoading] = useState<boolean>(true);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [title, setTitle] = useState<any>([]);

  const [dropdownDataMap, setDropdownDataMap] = useState<{
    [key: number]: any[];
  }>({});
  const [isOpenAddSourceTypeModal, setIsOpenAddSourceTypeModal] =
    useState<boolean>(false);
  const [isOpenAddAssignLabelModal, setIsOpenAddAssignLabelModal] =
    useState<boolean>(false);
  const [isOpenAddCountryModal, setIsOpenAddCountryModal] =
    useState<boolean>(false);
  const [isOpenAddStateModal, setIsOpenAddStateModal] =
    useState<boolean>(false);
  const [isOpenAddCityModal, setIsOpenAddCityModal] = useState<boolean>(false);
  const [isOpenAddAreaModal, setIsOpenAddAreaModal] = useState<boolean>(false);
  const [isOpenAddCategoryModal, setIsOpenAddCategoryModal] =
    useState<boolean>(false);
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleMenu2 = () => {
    setIsMenuOpen2(!isMenuOpen2);
  };

  useEscapeKey(onHide);

  const handleSubmit = async (
    values: any,
    { setSubmitting, setFieldError }: any,
  ) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    try {
      const requiredContactFields = customFormList.filter(
        (item: any) =>
          item.form_type === 1 &&
          item.required_or_not === 1 &&
          item.data_type !== 7,
      );
      const missingRequiredFields = requiredContactFields.filter((item) => {
        const fieldName = item.reference_column_name;
        return !values[fieldName] || values[fieldName].toString().trim() === "";
      });

      // Validate reference_contact
      if (values.reference_contact && !referenceContactId) {
        setFieldError("reference_contact", "Please select a valid contact");
        toast.error("Please select a valid contact");
        setSubmitting(false);
        return;
      }

      if (missingRequiredFields.length > 0) {
        const firstMissingField = missingRequiredFields[0];
        missingRequiredFields.forEach((item) => {
          setFieldError(
            item.reference_column_name,
            `${item.title} is required`,
          );
          toast.error(`${firstMissingField.title} is required`);
        });
        setIsMenuOpen(true);
        setSubmitting(false);
        return;
      }
      // 🔥 Dynamic min/max + validation_type validation for CUSTOM fields
      for (const item of customFormList) {
        const fieldName = item.reference_column_name;
        const value = values[fieldName];

        // Skip if field is empty (but required check was already done earlier)
        if (!value && value !== 0 && value !== false) continue;

        const stringValue = String(value).trim();

        // ───────────────────────────────────────────────
        // 1. MIN / MAX LENGTH VALIDATION (character count)
        // ───────────────────────────────────────────────
        if (item.min_limit || item.max_limit) {
          const min = Number(item.min_limit) || 0;
          const max = Number(item.max_limit) || Infinity;

          if (min > 0 && stringValue.length < min) {
            setFieldError(
              fieldName,
              `${item.title} must be at least ${min} characters`,
            );
            toast.error(`${item.title} must be at least ${min} characters`);
            setIsMenuOpen(true);
            setSubmitting(false);
            return;
          }

          if (max < Infinity && stringValue.length > max) {
            setFieldError(
              fieldName,
              `${item.title} must not exceed ${max} characters`,
            );
            toast.error(`${item.title} must not exceed ${max} characters`);
            setIsMenuOpen(true);
            setSubmitting(false);
            return;
          }
        }

        // ───────────────────────────────────────────────
        // 2. VALIDATION TYPE (content pattern)
        // ───────────────────────────────────────────────
        if (item.validation_type) {
          const validationType = String(item.validation_type); // make sure it's string

          let regex: RegExp | null = null;
          let errorMessage = "";

          switch (validationType) {
            case "1": // Numeric
              regex = /^[0-9]+$/;
              errorMessage = `${item.title} must contain only numbers`;
              break;

            case "2": // Alphanumeric
              regex = /^[A-Za-z0-9]+$/;
              errorMessage = `${item.title} must be alphanumeric (letters and numbers only)`;
              break;

            case "3": // Alpha
              regex = /^[A-Za-z\s]+$/;
              errorMessage = `${item.title} must contain only letters`;
              break;

            case "4": // Alpha + special characters
              regex = /^[A-Za-z\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/;
              errorMessage = `${item.title} can contain letters and special characters only`;
              break;

            case "5": // Numeric + special characters
              regex = /^[0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/;
              errorMessage = `${item.title} can contain numbers and special characters only`;
              break;

            case "6": // Alphanumeric + special characters
              regex = /^[A-Za-z0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/;
              errorMessage = `${item.title} can contain letters, numbers, and special characters`;
              break;

            default:
              break;
          }

          if (regex && !regex.test(stringValue)) {
            setFieldError(fieldName, errorMessage);
            toast.error(errorMessage);
            setIsMenuOpen(true);
            setSubmitting(false);
            return;
          }
        }
      }

      // Update values with selected labels

      const DATE_COLUMNS = [
        "cntc_column_date_1",
        "cntc_column_date_2",
        "cntc_column_date_3",
        "cntc_column_date_4",
        "cntc_column_date_5",
      ];

      const TIME_COLUMNS = [
        "cntc_column_time_1",
        "cntc_column_time_2",
        "cntc_column_time_3",
        "cntc_column_time_4",
        "cntc_column_time_5",
      ];

      const DATETIME_COLUMNS = [
        "cntc_column_date_and_time_1",
        "cntc_column_date_and_time_2",
        "cntc_column_date_and_time_3",
        "cntc_column_date_and_time_4",
        "cntc_column_date_and_time_5",
      ];

      for (const key in values) {
        const value = values[key];

        if (DATETIME_COLUMNS.includes(key)) {
          values[key] = value ? formatDateTimeSendDataBaseV2(value) : "";
        } else if (DATE_COLUMNS.includes(key)) {
          values[key] = value ? formatDateSendDataBaseV2(value) : "";
        } else if (TIME_COLUMNS.includes(key)) {
          values[key] = value;
        } else {
          values[key] = value; // normal field
        }
      }

      const updatedValues = {
        ...values,
        lable: selectedLabels.map((label: any) => label.value).join(","),
      };
      try {
        if (contactData?.id) {
          await updateContact(
            updatedValues,
            setContact,
            contactData?.id,
            setIsCreateContact1,
            closeChatAbout,
            onHide,
          );
        } else {
          await createContact(updatedValues, setContact, onHide);
        }
      } catch (error) {
        toast.error("Submission failed. Please try again.");
        console.error("handleSubmit error:", error);
      }
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  };

  const token = localStorage.getItem("token") || "";
  const localId = localStorage.getItem("UUID") || "";

  const handleSearchChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
    setFieldValue: (
      field: string,
      value: any,
      shouldValidate?: boolean,
    ) => void,
  ) => {
    const value = event.target.value;
    setSearchTerm(value);
    setReferenceContactId(null); // Reset reference_contact_id on new input
    setFieldValue("reference_contact", ""); // Clear field value
    setUsers([]); // Clear user suggestions
    if (value.length >= 5 || value === "") {
      if (searchTimeout) clearTimeout(searchTimeout); // Clear previous timeout
      setSearchTimeout(
        setTimeout(() => {
          fetchDataUser(
            0,
            value,
            setUsers,
            itemsPerPage,
            setNoDataFound,
            setLoading,
            token,
            localId,
            setContactId,
            () => {},
            setCheckToken,
            filterParams || "",
            filterParams || "",
            filterParams || "",
            filterParams || "",
            filterParams || "",
            filterParams || "",
            filterParams || "",
            0,
            0,
            0,
            0,
            0,
          );
          setCurrentPage(0);
        }, 1000),
      );
    }
  };

  const handleContactSelect = (
    selectedOption: SingleValue<IOption>,
    setFieldValue: (
      field: string,
      value: any,
      shouldValidate?: boolean,
    ) => void,
  ) => {
    const selectedUser = users.find(
      (user) => user.id === selectedOption?.value,
    );
    if (selectedUser) {
      setReferenceContactId(selectedUser.id);
      setSearchTerm(
        selectedUser.person_name && selectedUser.company_name
          ? `${selectedUser.company_name} (${selectedUser.person_name})`
          : selectedUser.person_name ||
              selectedUser.company_name ||
              selectedUser.mobile_number ||
              selectedUser.email_id ||
              "Unknown",
      );
      setFieldValue("reference_contact", selectedUser.id);
      setUsers([]);
    } else {
      setReferenceContactId(null);
      setSearchTerm("");
      setFieldValue("reference_contact", "");
      setUsers([]);
    }
  };

  const handleCountriesChange = async (
    selectedOption: SingleValue<IOption>,
    setFieldValue: (
      field: string,
      value: any,
      shouldValidate?: boolean,
    ) => void,
  ) => {
    if (selectedOption && typeof selectedOption.value === "number") {
      setFieldValue("country", selectedOption.value);
      setSelectedCountryId(selectedOption.value);
    } else {
      setFieldValue("country", "");
      setSelectedCountryId(undefined);
    }
  };

  const handleSateChange = async (
    selectedOption: SingleValue<IOption>,
    setFieldValue: (
      field: string,
      value: any,
      shouldValidate?: boolean,
    ) => void,
  ) => {
    if (selectedOption && typeof selectedOption.value === "number") {
      setFieldValue("state", selectedOption.value);
      setSelectedStateId(selectedOption.value);
    } else {
      setFieldValue("state", "");
      setSelectedStateId(undefined);
    }
  };

  const handleCityChange = async (
    selectedOption: SingleValue<IOption>,
    setFieldValue: (
      field: string,
      value: any,
      shouldValidate?: boolean,
    ) => void,
  ) => {
    if (selectedOption && typeof selectedOption.value === "number") {
      setFieldValue("city", selectedOption.value);
      setSelectedCityId(selectedOption.value);
    } else {
      setFieldValue("city", "");
      setSelectedCityId(undefined);
      setAreaList([]);
    }
  };

  const handleCategoryChange = async (
    selectedOption: SingleValue<IOption>,
    setFieldValue: (
      field: string,
      value: any,
      shouldValidate?: boolean,
    ) => void,
  ) => {
    if (selectedOption && typeof selectedOption.value === "number") {
      setFieldValue("category_id", selectedOption.value);
      setSelectedCategoryId(selectedOption.value);
    } else {
      setFieldValue("category_id", "");
      setSelectedCategoryId(undefined);
      setProductList([]);
    }
  };

  const canAddCategory = useCheckUserPermission(
    PAGE_ID.CATEGORY,
    PERMISSION_TYPE.ADD,
  );

  const canViewProduct = useCheckUserPermission(
    PAGE_ID.PRODUCT,
    PERMISSION_TYPE.VIEW,
  );
  const canViewCategroy = useCheckUserPermission(
    PAGE_ID.CATEGORY,
    PERMISSION_TYPE.VIEW,
  );
  const canViewSource = useCheckUserPermission(
    PAGE_ID.SOURCE,
    PERMISSION_TYPE.VIEW,
  );
  const canAddSource = useCheckUserPermission(
    PAGE_ID.SOURCE,
    PERMISSION_TYPE.ADD,
  );
  const canViewLabel = useCheckUserPermission(
    PAGE_ID.LABEL,
    PERMISSION_TYPE.VIEW,
  );
  const canADDLabel = useCheckUserPermission(
    PAGE_ID.LABEL,
    PERMISSION_TYPE.ADD,
  );
  const canADDCountry = useCheckUserPermission(
    PAGE_ID.COUNTRIE,
    PERMISSION_TYPE.ADD,
  );
  const canADDState = useCheckUserPermission(
    PAGE_ID.STATES,
    PERMISSION_TYPE.ADD,
  );
  const canADDCity = useCheckUserPermission(
    PAGE_ID.CITIES,
    PERMISSION_TYPE.ADD,
  );
  const canADDArea = useCheckUserPermission(PAGE_ID.AREAS, PERMISSION_TYPE.ADD);
  const canViewPriceList = useCheckUserPermission(
    PAGE_ID.PRICE_LIST,
    PERMISSION_TYPE.VIEW,
  );

  const handleSourceTypeChange = async (
    selectedOption: SingleValue<IOption>,
    setFieldValue: (
      field: string,
      value: any,
      shouldValidate?: boolean,
    ) => void,
  ) => {
    setFieldValue("source_type_id", selectedOption?.value);
  };

  const handlePriceListChange = async (
    selectedOption: SingleValue<IOption>,
    setFieldValue: (
      field: string,
      value: any,
      shouldValidate?: boolean,
    ) => void,
  ) => {
    setFieldValue("assinged_to_price_list", selectedOption?.value);
  };

  const handleAreaChange = async (
    selectedOption: SingleValue<IOption>,
    setFieldValue: (
      field: string,
      value: any,
      shouldValidate?: boolean,
    ) => void,
  ) => {
    if (selectedOption) {
      setFieldValue("area", selectedOption.value);
    } else {
      setFieldValue("area", "");
    }
  };

  const fetchcontryapi = async () => {
    const requestData = {
      table: "a_countries",
      columns: "id,country_name,country_code",
      where: `{"isDelete": "0"}`,
    };
    const getUUID = localStorage.getItem("UUID");
    try {
      const response = await axiosInstance.post("commonGet", requestData);

      setCountriesList(response.data.data);
    } catch (error) {
      console.error("Error fetching countries:", error);
      setCountriesList([]);
    }
  };

  const fetchStateapi = async () => {
    const requestData = {
      table: "a_states",
      columns: "id,state_name",
      where: `{"country_id": "${selectedCountryId || 101}","isDelete": "0"}`,
    };
    const getUUID = localStorage.getItem("UUID");
    try {
      const response = await axiosInstance.post("commonGet", requestData);

      setStateList(response.data.data);
    } catch (error) {
      console.error("Error fetching states:", error);
      setStateList([]);
    }
  };

  const fetchCityApi = async () => {
    const requestData = {
      table: "a_cities",
      columns: "id,city_name",
      where: `{"state_id": ${selectedStateId},"isDelete": "0"}`,
    };
    const getUUID = localStorage.getItem("UUID");

    try {
      const response = await axiosInstance.post("commonGet", requestData);

      setCityList(response.data.data);
    } catch (error) {
      console.error("Error fetching cities:", error);
      setCityList([]);
    }
  };

  const fetchAreaApi = async () => {
    const requestData = {
      table: "a_areas",
      columns: "id,area_name",
      where: `{"city_id": ${selectedCityId},"isDelete": "0"}`,
    };
    const getUUID = localStorage.getItem("UUID");

    try {
      const response = await axiosInstance.post("commonGet", requestData);

      setAreaList(response.data.data);
    } catch (error) {
      console.error("Error fetching areas:", error);
      setAreaList([]);
    }
  };

  const fetchSourceTypeApi = async () => {
    const getUUID = await localStorage.getItem("UUID");
    const token = await localStorage.getItem("token");
    const requestData = {
      a_application_login_id: getUUID,
    };
    if (canViewSource) {
      try {
        const response = await axiosInstance.post("sourceOfTypes", requestData);

        setSourceOfTypesList(response.data.data.item);
      } catch (error) {
        console.error("Error fetching source types:", error);
        setSourceOfTypesList([]);
      }
    }
  };

  const fetchLabelTypeApi = async () => {
    setLabelsLoading(true); // Start loading
    const requestData = {
      table: "lable_masters",
      columns: "id,lable_name,color",
      where: `{"isDelete": "0"}`,
    };
    const getUUID = localStorage.getItem("UUID");

    try {
      const response = await axiosInstance.post("commonGet", requestData);

      const validLabels = Array.isArray(response.data?.data)
        ? response.data.data.filter(
            (label: any) => label?.id && label?.lable_name,
          )
        : [];

      if (validLabels.length === 0) {
        console.warn("No valid labels found in API response");
      }
      setLabelOfTypesList(validLabels);
    } catch (error) {
      console.error("Error fetching label types:", error);
      setLabelOfTypesList([]);
    } finally {
      setLabelsLoading(false); // End loading
    }
  };

  const inquiryFormSetting = async () => {
    const uuid = localStorage.getItem("UUID");
    const requestData = {
      table: "company_masters",
      columns: "view_inquiry_form_in_contact",
      where: JSON.stringify({ a_application_login_id: uuid }),
      request_flag: 2,
    };
    try {
      const response = await axiosInstance.post("mainCommonGet", requestData);
      if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setTitle(response.data.data[0].view_inquiry_form_in_contact || []);
      } else {
        toast.error(response.data.ack_msg || DEFAULT_STATUS_CODE_SUCCESS);
        setTitle([]);
        return "";
      }
    } catch (error: any) {
      console.error("Error fetching currencyID: ", error);
      toast.error(error || DEFAULT_STATUS_CODE_SUCCESS);
      return "";
    }
  };

  const updateData = async () => {
    await fetchStateapi();
    await fetchSourceTypeApi();
    // await fetchLabelTypeApi();
    await inquiryFormSetting();
    if (canViewPriceList) {
      await fetchPriceListApiForContact(setPriceList);
    }
    if (selectedCountryId && !selectedStateId) {
      await fetchStateapi();
      setCityList([]);
      setAreaList([]);
      setSelectedStateId(contactData?.state || undefined);
      setSelectedCityId(undefined);
    } else if (selectedStateId && !selectedCityId) {
      await fetchCityApi();
      setAreaList([]);
      setSelectedCityId(contactData?.city || undefined);
    } else if (selectedCityId) {
      await fetchAreaApi();
    } else {
      if (contactData?.country) {
        await fetchcontryapi();
        setSelectedCountryId(contactData.country);
      } else {
        await fetchcontryapi();
      }
    }
  };

  useEffect(() => {
    updateData();
  }, [selectedCountryId, selectedStateId, selectedCityId, show]);

  useEffect(() => {
    fetchCustomInqFromApiForContact(setCustomFromList);
  }, [show]);

  useEffect(() => {
    if (canViewCategroy) {
      fetchCategoryApiForContact(setCategoryList);
    }
    if (canViewProduct) {
      fetchProductApiForContact(setProductList, selectedCategoryId);
    }
  }, [canViewCategroy, canViewProduct, selectedCategoryId]);
  useEffect(() => {
    if (show) {
      fetchLabelTypeApi();
    }
  }, [show]);
  interface Label {
    id: number;
    lable_name: string;
    color: string;
  }

  interface LabelOption {
    value: number;
    label: string;
  }
  const labelOptions = useMemo<LabelOption[]>(() => {
    if (!Array.isArray(labelOfTypesList)) {
      return [];
    }

    const options = labelOfTypesList.map((label) => ({
      value: label.id,
      label: label.lable_name,
    }));
    return options;
  }, [labelOfTypesList]);

  useEffect(() => {
    const initializeReferenceContact = async () => {
      if (contactData?.referance_contact) {
        try {
          const requestData = {
            table: "contact_masters",
            columns: "id,person_name,mobile_number,email_id,company_name", // Added company_name
            where: `{"id": ${contactData?.referance_contact}}`,
          };
          const token = localStorage.getItem("token");
          const getUUID = localStorage.getItem("UUID");
          const response = await axiosInstance.post("commonGet", requestData);

          const contact = response.data.data[0];
          if (contact) {
            setReferenceContactId(contact.id);
            setSearchTerm(
              contact.person_name && contact.company_name
                ? `${contact.company_name} (${contact.person_name})`
                : contact.person_name ||
                    contact.company_name ||
                    contact.mobile_number ||
                    contact.email_id ||
                    "",
            );
            setUsers([contact]);
          }
        } catch (error) {
          console.error("Error fetching reference contact:", error);
          setReferenceContactId(null);
          setSearchTerm("");
        }
      } else {
        setReferenceContactId(null);
        setSearchTerm("");
      }
    };

    const initializeLabels = () => {
      if (
        !labelsLoading &&
        Array.isArray(labelOptions) &&
        labelOptions.length > 0 &&
        contactData?.lable
      ) {
        const selected = labelOptions.filter((option) =>
          String(contactData.lable || "")
            .split(",")
            .map((id) => parseInt(id.trim()))
            .includes(option.value),
        );
        setSelectedLabels(selected);
      } else {
        setSelectedLabels([]);
      }
    };

    if (show) {
      initializeReferenceContact();
      initializeLabels();
    }
  }, [show, contactData, labelOptions, labelsLoading]);

  const stateOptions = stateList.map((itemState: any) => ({
    value: itemState.id,
    label: itemState.state_name,
  }));

  const countriesOptions = countriesList.map((itemState: any) => ({
    value: itemState.id,
    label: itemState.country_name,
  }));

  const cityOptions = cityList.map((itemState: any) => ({
    value: itemState.id,
    label: itemState.city_name,
  }));

  const areaOptions = areaList.map((itemState: any) => ({
    value: itemState.id,
    label: itemState.area_name,
  }));

  const sourcTypeOptions = sourceOfTypesList.map((itemState: any) => ({
    value: itemState.id,
    label: itemState.source_name,
  }));

  const priceListOptions =
    priceList &&
    priceList.map((itemState: any) => ({
      value: itemState.id,
      label: itemState.price_list_name,
    }));

  const categoryOptions = categoryList.map((itemState: any) => ({
    value: itemState.id,
    label: itemState.category_name,
  }));

  const productOptions = productList.map((itemState: any) => ({
    value: itemState.id,
    label: itemState.product_name,
  }));

  const requirementTypesOptions = requirementTypesListForContact.map(
    (itemState) => ({
      value: itemState.id,
      label: itemState.requirement_name,
    }),
  );

  const fetchDropdownData = async (fieldId: number) => {
    try {
      const datas = await getCustomFieldDatavalues(fieldId);
      return datas;
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
      return [];
    }
  };

  useEffect(() => {
    const fetchAllDropdownData = async () => {
      const dropdownPromises = customFormList.map(async (item) => {
        try {
          const data = await fetchDropdownData(item.id);
          return { id: item.id, data };
        } catch (error) {
          console.error(`Error fetching dropdown data for ${item.id}:`, error);
          return { id: item.id, data: [] };
        }
      });

      const results = await Promise.all(dropdownPromises);
      const dataMap: { [key: number]: any[] } = {};
      results.forEach((result) => {
        dataMap[result.id] = result.data;
      });
      setDropdownDataMap(dataMap);
    };

    if (customFormList && customFormList.length > 0) {
      fetchAllDropdownData();
    }
  }, [customFormList]);

  const renderInputField = (
    item: {
      id: number;
      data_type: number;
      display_order: number;
      required_or_not: number;
      data_sorce: string;
      form_type: number;
    },
    name: string,
    fieldName: string,
    setFieldValue: any,
    error: FormikErrors<ICreateInquiry>,
    touched: FormikTouched<ICreateInquiry>,
    dropdownData?: any[],
  ) => {
    const isError =
      error[fieldName as keyof ICreateInquiry] &&
      touched[fieldName as keyof ICreateInquiry];

    switch (item.data_type) {
      case 1:
        return (
          <div className="col-12 col-md-4">
            <div className="form-group">
              <label htmlFor="name" className="pb-2 form_label">
                {name}
                {item.required_or_not === 1 && (
                  <span className="text-danger">*</span>
                )}
              </label>
              <Field
                type="text"
                name={fieldName}
                className={`form-control ${isError ? "is-invalid input-box-error" : ""}`}
                onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                  e.target.value = e.target.value.replace(/[^0-9]/g, "");
                }}
              />
              <ErrorMessage
                name={fieldName}
                component="div"
                className="field-error text-danger"
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="col-12 col-md-4">
            <div className="form-group">
              <label htmlFor="name" className="pb-2 form_label">
                {name}
                {item.required_or_not === 1 && (
                  <span className="text-danger">*</span>
                )}
              </label>
              <Field
                type="text"
                name={fieldName}
                className={`form-control font-size-15 rounded-1 ${isError ? "is-invalid input-box-error" : ""}`}
              />
              <ErrorMessage
                name={fieldName}
                component="div"
                className="field-error text-danger"
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="col-12 col-md-4">
            <div className="form-group">
              <label htmlFor="name" className="pb-2 form_label">
                {name}
                {item.required_or_not === 1 && (
                  <span className="text-danger">*</span>
                )}
              </label>
              <Field
                as="textarea"
                name={fieldName}
                className={`form-control ${isError ? "is-invalid input-box-error" : ""}`}
                onInput={(e: React.FormEvent<HTMLTextAreaElement>) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = target.scrollHeight + "px";
                }}
                rows={1}
              />
              <ErrorMessage
                name={fieldName}
                component="div"
                className="field-error text-danger"
              />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="col-12 col-md-4">
            <div className="form-group">
              <label htmlFor="name" className="pb-2 form_label">
                {name}
                {item.required_or_not === 1 && (
                  <span className="text-danger">*</span>
                )}
              </label>
              <div>
                <Field name={fieldName}>
                  {({ field, form }: any) => (
                    <DatePicker
                      value={field.value}
                      onChange={(date: DateObject) => {
                        if (date) {
                          form.setFieldValue(
                            fieldName,
                            date.format("DD-MM-YYYY"),
                          );
                        } else {
                          form.setFieldValue(fieldName, "");
                        }
                      }}
                      format="DD-MM-YYYY"
                      placeholder={`Enter ${name}`}
                      inputClass={`form-control font-size-15 rounded-1 ${isError ? "is-invalid input-box-error" : ""}`}
                    />
                  )}
                </Field>
              </div>
              <ErrorMessage
                name={fieldName}
                component="div"
                className="field-error text-danger"
              />
            </div>
          </div>
        );
      case 5:
        return (
          <div className="col-12 col-md-4">
            <div className="form-group">
              <label htmlFor="name" className="pb-2 form_label">
                {name}
                {item.required_or_not === 1 && (
                  <span className="text-danger">*</span>
                )}
              </label>
              <div>
                <Field name={fieldName}>
                  {({ field, form }: any) => {
                    return (
                      <DatePicker
                        value={field.value}
                        onChange={(date: DateObject | null) => {
                          form.setFieldValue(
                            fieldName,
                            date ? date.format("DD-MM-YYYY hh:mm A") : null,
                          );
                        }}
                        format="DD-MM-YYYY hh:mm A"
                        plugins={[<TimePicker position="right" hideSeconds />]}
                        placeholder={`Enter ${name}`}
                        inputClass={`form-control d-block font-size-15 rounded-1 ${isError ? "is-invalid input-box-error" : ""}`}
                      />
                    );
                  }}
                </Field>
              </div>
              <ErrorMessage
                name={fieldName}
                component="div"
                className="field-error text-danger"
              />
            </div>
          </div>
        );
      case 6:
        return (
          <div className="col-12 col-md-4">
            <div className="form-group">
              <label htmlFor="name" className="pb-2 form_label">
                {name}
                {item.required_or_not === 1 && (
                  <span className="text-danger">*</span>
                )}
              </label>
              <Field
                type="time"
                name={fieldName}
                className={`form-control font-size-15 rounded-1 ${isError ? "is-invalid input-box-error" : ""}`}
                rows={1}
              />
              <ErrorMessage
                name={fieldName}
                component="div"
                className="field-error text-danger"
              />
            </div>
          </div>
        );
      case 7:
        return (
          <div className="col-12 col-md-4">
            <div className="form-group">
              <label htmlFor="name" className="pb-2 form_label">
                {name}
                {item.required_or_not === 1 && (
                  <span className="text-danger">*</span>
                )}
              </label>
              <Field name={fieldName}>
                {({ field, form }: any) => (
                  <div className="form-check form-switch">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="descriptionSwitch"
                      value={false}
                      {...field}
                      checked={field.value ?? false}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        form.setFieldValue(fieldName, e.target.checked);
                      }}
                    />
                    <ErrorMessage
                      name={fieldName}
                      component="div"
                      className="field-error text-danger"
                    />
                  </div>
                )}
              </Field>
            </div>
          </div>
        );
      case 8:
        return (
          <div className="col-12 col-md-4">
            <div className="form-group">
              <label htmlFor="name" className="pb-2 form_label">
                {name}
                {item.required_or_not === 1 && (
                  <span className="text-danger">*</span>
                )}
              </label>
              <Field
                type="text"
                name={fieldName}
                className={`form-control ${isError ? "is-invalid input-box-error" : ""}`}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  let value = e.target.value;
                  if (!/^\d*\.?\d*$/.test(value)) {
                    value = value.replace(/[^0-9.]/g, "");
                  }
                  const decimalCount = (value.match(/\./g) || []).length;
                  if (decimalCount > 1) {
                    value = value.slice(0, -1);
                  }
                  setFieldValue(fieldName, value);
                }}
                rows={1}
              />
              <ErrorMessage
                name={fieldName}
                component="div"
                className="field-error text-danger"
              />
            </div>
          </div>
        );
      case 9:
        const datas = dropdownDataMap[item.id] || [];

        const dropDownOptions = datas.map((dataItem: any) => ({
          value: dataItem.data_sorce,
          label: dataItem.data_sorce,
        }));

        return (
          <div className="col-12 col-md-4">
            <div className="form-group">
              <label htmlFor="name" className="pb-2 form_label">
                {name}
                {item.required_or_not === 1 && (
                  <span className="text-danger">*</span>
                )}
              </label>
              <FormikCustomSearchDropdown
                name={fieldName}
                options={dropDownOptions}
                className={` ${isError ? "is-invalid input-box-error" : ""}`}
              />
              <ErrorMessage
                name={fieldName}
                component="div"
                className="field-error text-danger"
              />
            </div>
          </div>
        );
      case 10:
        const radioData = dropdownDataMap[item.id] || [];

        const radioOptions = radioData.map(
          (dataItem: any) => dataItem.data_sorce,
        );

        return (
          <div className="col-12 col-md-4">
            <div className="form-group">
              <label htmlFor="name" className="pb-2 form_label">
                {name}
                {item.required_or_not === 1 && (
                  <span className="text-danger">*</span>
                )}
              </label>
              <div className="mt-1">
                <div>
                  {radioOptions &&
                    radioOptions.map((option, index) => (
                      <label key={index} className="p-1">
                        <Field type="radio" name={fieldName} value={option} />
                        {option}
                      </label>
                    ))}
                </div>
              </div>
              <ErrorMessage
                name={fieldName}
                component="div"
                className="field-error text-danger"
              />
            </div>
          </div>
        );
      default:
        return "No More field Add";
    }
  };

  return (
    <div className="create-scope">
      <React.Fragment>
        {show && (
          <div className="modal1" style={{ zIndex: "1001" }}>
            <style>
              {`
            .autosuggest-container {
  position: relative;
}

.autosuggest-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1000;
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.autosuggest-suggestion {
  padding: 8px 12px;
  cursor: pointer;
}

.autosuggest-suggestion:hover {
  background-color: #f0f0f0;
}
         `}{" "}
            </style>
            <style>
              {`
    .autosuggest-container {
      position: relative;
    }

    .autosuggest-suggestions {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      z-index: 1000;
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      max-height: 200px;
      overflow-y: auto;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .autosuggest-suggestion {
      padding: 8px 12px;
      cursor: pointer;
    }

    .autosuggest-suggestion:hover,
    .autosuggest-suggestion.highlighted {
      background-color: #f0f0f0;
    }
  `}
            </style>

            <div className="modal-content1">
              <div className="d-flex align-items-center justify-content-end">
                <div className="col-8">
                  <h2 className="modal-title1 form_header_text">
                    {headerName}
                  </h2>
                  {/* <p className="text-center" style={{ color: "#999" }}>
                Please Enter your Contact Detail.
              </p> */}
                </div>
                <div className="col-4">
                  <span className="close ms-3 pb-3" onClick={onHide}>
                    ×
                  </span>
                  <span>
                    <p
                      className="landing-page-text text-end"
                      style={{
                        cursor: "pointer",
                        color: "blue",
                        float: "right",
                        fontSize: "13px",
                        margin: "0px",
                      }}
                      onClick={() => openInNewTab("/videoTutorial", 2)}
                    >
                      Learn More :{" "}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="24px"
                        viewBox="0 -960 960 960"
                        width="24px"
                        fill="#0000FF"
                      >
                        <path d="M616-242q-27 1-51.5 1.5t-43.5.5h-41q-71 0-133-2-53-2-104.5-5.5T168-257q-26-7-45-26t-26-45q-6-23-9.5-56T82-447q-2-36-2-73t2-73q2-30 5.5-63t9.5-56q7-26 26-45t45-26q23-6 74.5-9.5T347-798q62-2 133-2t133 2q53 2 104.5 5.5T792-783q26 7 45 26t26 45q6 23 9.5 56t5.5 63q2 36 2 73v17q-19-8-39-12.5t-41-4.5q-83 0-141.5 58.5T600-320q0 21 4 40.5t12 37.5ZM400-400l208-120-208-120v240Zm360 200v-80h-80v-80h80v-80h80v80h80v80h-80v80h-80Z" />
                      </svg>
                    </p>
                  </span>
                </div>
              </div>

              <Formik
                enableReinitialize
                initialValues={createCustomerInitialValues(contactData)}
                validationSchema={createCustomerValidationSchema(
                  customFormList,
                  isFeatureEnabled,
                )}
                onSubmit={handleSubmit}
              >
                {({
                  errors,
                  touched,
                  isSubmitting,
                  setFieldValue,
                  values,
                  setFieldError,
                  setFieldTouched,
                  submitForm,
                  handleSubmit: formikHandleSubmit,
                  validateForm,
                }) => (
                  <Form style={{ height: "100%" }}>
                    <div className="mt-3 d-flex justify-content-center">
                      <div className="pt-4">
                        <div
                          className="row mx-0 px-2 gy-3 d-flex justify-content-center"
                          style={{ maxHeight: "600px", overflowX: "scroll" }}
                        >
                          <div className="col-6 col-md-4">
                            <div className="form-group">
                              <label htmlFor="name" className="pb-2 form_label">
                                Contact Name
                                <span className="text-danger">*</span>
                              </label>
                              <Field
                                type="text"
                                name="person_name"
                                maxLength={SMALL_TEXT_LENGTH}
                                className={`form-control font-size-15 rounded-1 ${
                                  errors.person_name &&
                                  touched.person_name &&
                                  "is-invalid input-box-error"
                                }`}
                                rows={1}
                              />
                              <ErrorMessage
                                name="person_name"
                                component="div"
                                className="field-error text-danger"
                              />
                            </div>
                          </div>
                          <div className="col-6 col-md-4">
                            <div className="form-group">
                              <label
                                htmlFor="company_name"
                                className="pb-2 form_label"
                              >
                                Company Name
                                {isFeatureEnabled && (
                                  <span className="text-danger">*</span>
                                )}
                              </label>
                              <Field
                                type="text"
                                name="company_name"
                                maxLength={SMALL_TEXT_LENGTH}
                                className={`form-control font-size-15 rounded-1 ${
                                  errors.company_name &&
                                  touched.company_name &&
                                  "is-invalid input-box-error"
                                }`}
                                rows={1}
                              />
                              <ErrorMessage
                                name="company_name"
                                component="div"
                                className="field-error text-danger"
                              />
                            </div>
                          </div>
                          <div className="col-12 col-md-4">
                            <div className="form-group">
                              <style>
                                {`
        input[name="mobile_number"]::-webkit-outer-spin-button,
        input[name="mobile_number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        /* Firefox */
        input[name="mobile_number"] {
          -moz-appearance: textfield;
        }
      `}
                              </style>
                              <label
                                htmlFor="mobile_number"
                                className="pb-2 form_label"
                              >
                                Mobile Number
                                <span className="text-danger">*</span>
                              </label>
                              <Field
                                type="number"
                                onWheel={(e: any) => e.currentTarget.blur()}
                                name="mobile_number"
                                maxLength={MINI_TEXT_LENGTH}
                                className={`form-control font-size-15 rounded-1 ${
                                  errors.mobile_number &&
                                  touched.mobile_number &&
                                  "is-invalid input-box-error"
                                }`}
                                rows={1}
                                onBlur={async (e: React.FocusEvent<any>) => {
                                  const mobileValue = e.target.value.trim();

                                  if (
                                    contactData &&
                                    mobileValue === contactData.mobile_number
                                  ) {
                                    return; // Do nothing
                                  }

                                  // Only call API if mobile number has enough digits (e.g., 7 or more digits)
                                  if (mobileValue.length >= 7) {
                                    checkContactNumberDuplication(mobileValue);
                                  }
                                }}
                              />
                              <ErrorMessage
                                name="mobile_number"
                                component="div"
                                className="field-error text-danger"
                              />
                            </div>
                          </div>
                          <div className="col-12 col-md-4">
                            <div className="form-group">
                              <label
                                htmlFor="email_id"
                                className="pb-2 form_label"
                              >
                                Email
                              </label>
                              <Field
                                type="email"
                                name="email_id"
                                maxLength={BIG_TEXT_LENGTH}
                                className={`form-control font-size-15 rounded-1 ${
                                  errors.email_id &&
                                  touched.email_id &&
                                  "is-invalid input-box-error"
                                }`}
                                rows={1}
                              />
                              <ErrorMessage
                                name="email_id"
                                component="div"
                                className="field-error text-danger"
                              />
                            </div>
                          </div>

                          <div className="col-12 col-md-4">
                            <div className="form-group">
                              <label
                                htmlFor="gst_number"
                                className="pb-2 form_label"
                              >
                                GST Number
                              </label>
                              <Field
                                type="text"
                                name="gst_number"
                                maxLength={SMALL_TEXT_LENGTH}
                                className={`form-control font-size-15 rounded-1 ${
                                  errors.gst_number &&
                                  touched.gst_number &&
                                  "is-invalid input-box-error"
                                }`}
                              />
                              <ErrorMessage
                                name="gst_number"
                                component="div"
                                className="field-error text-danger"
                              />
                            </div>
                          </div>
                          <div className="col-12 col-md-4">
                            <div className="form-group">
                              <label
                                htmlFor="client_code"
                                className="pb-2 form_label"
                              >
                                Client Code
                                {isFeatureEnabled && (
                                  <span className="text-danger">*</span>
                                )}
                              </label>
                              <Field
                                type="text"
                                name="client_code"
                                maxLength={BIG_TEXT_LENGTH}
                                className={`form-control font-size-15 rounded-1 ${
                                  errors.client_code &&
                                  touched.client_code &&
                                  "is-invalid input-box-error"
                                }`}
                                rows={1}
                              />
                              <ErrorMessage
                                name="client_code"
                                component="div"
                                className="field-error text-danger"
                              />
                            </div>
                          </div>
                          <div className="col-12 col-md-4">
                            <div className="form-group">
                              <label htmlFor="city" className="mb-1 form_label">
                                Source Type
                              </label>
                              {canAddSource && (
                                <span
                                  className="ms-2"
                                  style={{ cursor: "pointer" }}
                                  onClick={() =>
                                    setIsOpenAddSourceTypeModal(true)
                                  }
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    height="24px"
                                    viewBox="0 -960 960 960"
                                    width="24px"
                                    fill="currentColor"
                                  >
                                    <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                                  </svg>
                                </span>
                              )}
                              <FormikCustomSearchDropdown
                                name="source_type_id"
                                options={sourcTypeOptions}
                                className={` ${
                                  errors.source_type_id &&
                                  touched.source_type_id &&
                                  "is-invalid input-box-error"
                                }`}
                                onChange={handleSourceTypeChange}
                                menuPlacement="top"
                              />
                              <ErrorMessage
                                name="source_type_id"
                                component="div"
                                className="field-error text-danger"
                              />
                            </div>
                          </div>
                          <div className="col-12 col-md-4">
                            <div className="form-group">
                              <label
                                htmlFor="lable"
                                className="mb-1 form_label"
                              >
                                Assign Label
                              </label>
                              {canADDLabel && (
                                <span
                                  className="ms-2"
                                  style={{ cursor: "pointer" }}
                                  onClick={() =>
                                    setIsOpenAddAssignLabelModal(true)
                                  }
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    height="24px"
                                    viewBox="0 -960 960 960"
                                    width="24px"
                                    fill="currentColor"
                                  >
                                    <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                                  </svg>
                                </span>
                              )}
                              {labelsLoading ? (
                                <p className="text-muted">Loading labels...</p>
                              ) : Array.isArray(labelOptions) &&
                                labelOptions.length > 0 ? (
                                <MultiSelect
                                  options={labelOptions}
                                  value={selectedLabels}
                                  onChange={(selected: any) => {
                                    setSelectedLabels(selected || []);
                                    setFieldValue(
                                      "lable",
                                      selected
                                        ? selected
                                            .map((item: any) => item.value)
                                            .join(",")
                                        : "",
                                    );
                                  }}
                                  isSelectAll={true}
                                  menuPlacement="top"
                                  menuStyle={{
                                    left: "90%",
                                    right: "auto",
                                    transform: "none",
                                    height: "42px",
                                  }}
                                />
                              ) : (
                                <p className="text-muted">
                                  No labels available
                                </p>
                              )}
                              <ErrorMessage
                                name="lable"
                                component="div"
                                className="field-error text-danger"
                              />
                            </div>
                          </div>
                          {/* <div className="col-12">
                            <div className="row gy-3">
                              
                            </div>
                          </div> */}
                          {customFormList
                            .filter((item) => item.form_type === 1)
                            .map((item, index) => (
                              <React.Fragment
                                key={`${item.reference_column_name}-${index}`}
                              >
                                {renderInputField(
                                  item,
                                  item.title,
                                  item.reference_column_name,
                                  setFieldValue,
                                  errors,
                                  touched,
                                )}
                              </React.Fragment>
                            ))}
                          <hr className="p-0 m-0" />
                          <div
                            className="col-12 border rounded bg-secondary m-0 mt-1"
                            onClick={toggleMenu}
                            style={{ cursor: "pointer" }}
                          >
                            <b
                              style={{
                                cursor: "pointer",
                                display: "block",
                                color: "#ffff",
                              }}
                            >
                              <span className="ms-2">
                                More Contact Information{" "}
                                {isMenuOpen ? "▲" : "▼"}
                              </span>
                            </b>
                          </div>
                          {isMenuOpen && (
                            <>
                              <div className="row mt-2">
                                <div className="col-12 col-md-4">
                                  <div className="form-group">
                                    <label
                                      htmlFor="country"
                                      className="mb-1 form_label"
                                    >
                                      Country
                                    </label>
                                    {canADDCountry && (
                                      <span
                                        className="ms-2"
                                        style={{ cursor: "pointer" }}
                                        onClick={() =>
                                          setIsOpenAddCountryModal(true)
                                        }
                                      >
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          height="24px"
                                          viewBox="0 -960 960 960"
                                          width="24px"
                                          fill="currentColor"
                                        >
                                          <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                                        </svg>
                                      </span>
                                    )}
                                    <FormikCustomSearchDropdown
                                      name="country"
                                      options={countriesOptions}
                                      className={` ${
                                        errors.country &&
                                        touched.country &&
                                        "is-invalid input-box-error"
                                      }`}
                                      onChange={handleCountriesChange}
                                    />
                                    <ErrorMessage
                                      name="country"
                                      component="div"
                                      className="field-error text-danger"
                                    />
                                  </div>
                                </div>
                                <div className="col-12 col-md-4">
                                  <div className="form-group">
                                    <label
                                      htmlFor="state"
                                      className="mb-1 form_label"
                                    >
                                      State
                                    </label>
                                    {canADDState && values.country && (
                                      <span
                                        className="ms-2"
                                        style={{ cursor: "pointer" }}
                                        onClick={() =>
                                          setIsOpenAddStateModal(true)
                                        }
                                      >
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          height="24px"
                                          viewBox="0 -960 960 960"
                                          width="24px"
                                          fill="currentColor"
                                        >
                                          <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                                        </svg>
                                      </span>
                                    )}
                                    <FormikCustomSearchDropdown
                                      name="state"
                                      options={stateOptions}
                                      className={` ${
                                        errors.state &&
                                        touched.state &&
                                        "is-invalid input-box-error"
                                      }`}
                                      onChange={handleSateChange}
                                    />
                                    <ErrorMessage
                                      name="state"
                                      component="div"
                                      className="field-error text-danger"
                                    />
                                  </div>
                                </div>
                                <div className="col-12 col-md-4">
                                  <div className="form-group">
                                    <label
                                      htmlFor="city"
                                      className="mb-1 form_label"
                                    >
                                      City
                                    </label>
                                    {canADDCity && values.state && (
                                      <span
                                        className="ms-2"
                                        style={{ cursor: "pointer" }}
                                        onClick={() =>
                                          setIsOpenAddCityModal(true)
                                        }
                                      >
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          height="24px"
                                          viewBox="0 -960 960 960"
                                          width="24px"
                                          fill="currentColor"
                                        >
                                          <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                                        </svg>
                                      </span>
                                    )}
                                    <FormikCustomSearchDropdown
                                      name="city"
                                      options={cityOptions}
                                      className={` ${
                                        errors.city &&
                                        touched.city &&
                                        "is-invalid input-box-error"
                                      }`}
                                      onChange={handleCityChange}
                                    />
                                    <ErrorMessage
                                      name="city"
                                      component="div"
                                      className="field-error text-danger"
                                    />
                                  </div>
                                </div>
                                <div className="col-12 col-md-4">
                                  <div className="form-group">
                                    <label
                                      htmlFor="area"
                                      className="mb-1 form_label"
                                    >
                                      Area
                                    </label>
                                    {canADDArea && values.city && (
                                      <span
                                        className="ms-2"
                                        style={{ cursor: "pointer" }}
                                        onClick={() =>
                                          setIsOpenAddAreaModal(true)
                                        }
                                      >
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          height="24px"
                                          viewBox="0 -960 960 960"
                                          width="24px"
                                          fill="currentColor"
                                        >
                                          <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                                        </svg>
                                      </span>
                                    )}
                                    <FormikCustomSearchDropdown
                                      name="area"
                                      options={areaOptions}
                                      className={` ${
                                        errors.area &&
                                        touched.area &&
                                        "is-invalid input-box-error"
                                      }`}
                                      onChange={handleAreaChange}
                                    />
                                    <ErrorMessage
                                      name="area"
                                      component="div"
                                      className="field-error text-danger"
                                    />
                                  </div>
                                </div>

                                <div className="col-12 col-md-4">
                                  <div className="form-group">
                                    <label
                                      htmlFor="address"
                                      className="pb-2 form_label"
                                    >
                                      Address
                                    </label>
                                    <Field
                                      as="textarea"
                                      name="address"
                                      className={`form-control font-size-15 rounded-1 ${
                                        errors.address &&
                                        touched.address &&
                                        "is-invalid input-box-error"
                                      }`}
                                      onInput={(
                                        e: React.FormEvent<HTMLTextAreaElement>,
                                      ) => {
                                        const target =
                                          e.target as HTMLTextAreaElement;
                                        target.style.height = "auto";
                                        target.style.height =
                                          target.scrollHeight + "px";
                                      }}
                                    />

                                    <ErrorMessage
                                      name="address"
                                      component="div"
                                      className="field-error text-danger"
                                    />
                                  </div>
                                </div>
                                <div className="col-12 col-md-4">
                                  <div className="form-group">
                                    <label
                                      htmlFor="shipping_address"
                                      className="pb-2 form_label"
                                    >
                                      Shipping Address
                                    </label>
                                    <Field
                                      as="textarea"
                                      name="shipping_address"
                                      className={`form-control font-size-15 rounded-1 ${
                                        errors.shipping_address &&
                                        touched.shipping_address &&
                                        "is-invalid input-box-error"
                                      }`}
                                      onInput={(
                                        e: React.FormEvent<HTMLTextAreaElement>,
                                      ) => {
                                        const target =
                                          e.target as HTMLTextAreaElement;
                                        target.style.height = "auto";
                                        target.style.height =
                                          target.scrollHeight + "px";
                                      }}
                                    />

                                    <ErrorMessage
                                      name="shipping_address"
                                      component="div"
                                      className="field-error text-danger"
                                    />
                                  </div>
                                </div>
                                <div className="col-12 col-md-4">
                                  <div className="form-group">
                                    <label
                                      htmlFor="pincode"
                                      className="pb-2 form_label"
                                    >
                                      PinCode
                                    </label>
                                    <Field
                                      type="text"
                                      name="pincode"
                                      className={`form-control font-size-15 rounded-1 ${
                                        errors.pincode &&
                                        touched.pincode &&
                                        "is-invalid input-box-error"
                                      }`}
                                    />
                                    <ErrorMessage
                                      name="pincode"
                                      component="div"
                                      className="field-error text-danger"
                                    />
                                  </div>
                                </div>
                                <div className="col-12 col-md-4">
                                  <div className="form-group">
                                    <label
                                      htmlFor="assinged_to_price_list"
                                      className="mb-1 form_label"
                                    >
                                      Price List
                                    </label>
                                    <FormikCustomSearchDropdown
                                      name="assinged_to_price_list"
                                      options={priceListOptions}
                                      className={` ${
                                        errors.assinged_to_price_list &&
                                        touched.assinged_to_price_list &&
                                        "is-invalid input-box-error"
                                      }`}
                                      onChange={handlePriceListChange}
                                    />
                                    <ErrorMessage
                                      name="assinged_to_price_list"
                                      component="div"
                                      className="field-error text-danger"
                                    />
                                  </div>
                                </div>

                                <div className="col-12 col-md-4">
                                  <div className="form-group">
                                    <label
                                      htmlFor="longitude"
                                      className="pb-2 form_label"
                                    >
                                      Longitude
                                    </label>
                                    <Field
                                      type="text"
                                      name="longitude"
                                      className={`form-control font-size-15 rounded-1 ${
                                        errors.longitude &&
                                        touched.longitude &&
                                        "is-invalid input-box-error"
                                      }`}
                                    />
                                    <ErrorMessage
                                      name="longitude"
                                      component="div"
                                      className="field-error text-danger"
                                    />
                                  </div>
                                </div>
                                <div className="col-12 col-md-4">
                                  <div className="form-group">
                                    <label
                                      htmlFor="latitude"
                                      className="pb-2 form_label"
                                    >
                                      Latitude
                                    </label>
                                    <Field
                                      type="text"
                                      name="latitude"
                                      className={`form-control font-size-15 rounded-1 ${
                                        errors.latitude &&
                                        touched.latitude &&
                                        "is-invalid input-box-error"
                                      }`}
                                    />
                                    <ErrorMessage
                                      name="latitude"
                                      component="div"
                                      className="field-error text-danger"
                                    />
                                  </div>
                                </div>
                                <div className="col-12 col-md-4">
                                  <div className="form-group autosuggest-container">
                                    <label
                                      htmlFor="reference_contact"
                                      className="pb-2 form_label"
                                    >
                                      Reference Contact Details
                                    </label>
                                    <input
                                      type="text"
                                      title="Search Contacts"
                                      aria-label="Search Contacts"
                                      placeholder="Search Contacts"
                                      ref={searchInputRef}
                                      onFocus={(e) => e.target.select()}
                                      maxLength={MINI_TEXT_LENGTH}
                                      value={searchTerm}
                                      onChange={(e) =>
                                        handleSearchChange(e, setFieldValue)
                                      }
                                      onKeyDown={(e) => {
                                        if (users.length === 0) return;

                                        if (e.key === "ArrowDown") {
                                          e.preventDefault();
                                          setHighlightedIndex((prev) =>
                                            prev < users.length - 1
                                              ? prev + 1
                                              : prev,
                                          );
                                        } else if (e.key === "ArrowUp") {
                                          e.preventDefault();
                                          setHighlightedIndex((prev) =>
                                            prev > 0 ? prev - 1 : -1,
                                          );
                                        } else if (
                                          e.key === "Enter" &&
                                          highlightedIndex >= 0
                                        ) {
                                          e.preventDefault();
                                          const selectedUser =
                                            users[highlightedIndex];
                                          handleContactSelect(
                                            {
                                              value: selectedUser.id,
                                              label:
                                                selectedUser.person_name &&
                                                selectedUser.company_name
                                                  ? `${selectedUser.company_name} (${selectedUser.person_name})`
                                                  : selectedUser.person_name ||
                                                    selectedUser.company_name ||
                                                    selectedUser.mobile_number ||
                                                    selectedUser.email_id ||
                                                    "Unknown",
                                            },
                                            setFieldValue,
                                          );
                                          setHighlightedIndex(-1);
                                        }
                                      }}
                                      className="form-control font-size-15 rounded-1"
                                    />
                                    {(searchTerm.length >= 5 ||
                                      referenceContactId) &&
                                      users.length > 0 &&
                                      searchTerm != null &&
                                      searchTerm != undefined &&
                                      searchTerm != "" && (
                                        <div className="autosuggest-suggestions">
                                          {users.map((user, index) => (
                                            <div
                                              key={user.id}
                                              className={`autosuggest-suggestion ${index === highlightedIndex ? "highlighted" : ""}`}
                                              onClick={() => {
                                                handleContactSelect(
                                                  {
                                                    value: user.id,
                                                    label:
                                                      user.person_name &&
                                                      user.company_name
                                                        ? `${user.company_name} (${user.person_name})`
                                                        : user.person_name ||
                                                          user.company_name ||
                                                          user.mobile_number ||
                                                          user.email_id ||
                                                          "Unknown",
                                                  },
                                                  setFieldValue,
                                                );
                                                setHighlightedIndex(-1);
                                              }}
                                            >
                                              {user.person_name &&
                                              user.company_name
                                                ? `${user.company_name} (${user.person_name})`
                                                : user.person_name ||
                                                  user.company_name ||
                                                  user.mobile_number ||
                                                  user.email_id ||
                                                  "Unknown"}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    <ErrorMessage
                                      name="reference_contact"
                                      component="div"
                                      className="field-error text-danger"
                                    />
                                  </div>
                                </div>

                                {/* {isMenuOpen && (
                                <>
                                  <div className="row mt-2">
                                    {customFormList &&
                                      customFormList.map((item, index) => (
                                        <React.Fragment
                                          key={`${item.reference_column_name}-${index}-${item.form_type}`} // Enhanced key for uniqueness
                                        >
                                          {item.form_type === 1
                                            ? renderInputField(
                                              item,
                                              item.title,
                                              item.reference_column_name,
                                              setFieldValue,
                                              errors,
                                              touched,
                                            )
                                            : null}
                                        </React.Fragment>
                                      ))}
                                  </div>
                                </>
                              )} */}
                              </div>
                            </>
                          )}

                          {title == 2 && (
                            <>
                              {contactData && customFormList.length > 0 ? (
                                <span></span>
                              ) : (
                                <>
                                  <div className="col-12">
                                    <p className="text-left form_header_text">
                                      Create Inquiry
                                    </p>
                                  </div>
                                  <div className="col-6 col-md-4">
                                    <div className="form-group">
                                      <label
                                        htmlFor="category_id"
                                        className="pb-2 mb-1 form_label"
                                      >
                                        Product Category Name
                                      </label>
                                      {canAddCategory && (
                                        <span
                                          className="ms-2"
                                          style={{ cursor: "pointer" }}
                                          onClick={() =>
                                            setIsOpenAddCategoryModal(true)
                                          }
                                        >
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            height="24px"
                                            viewBox="0 -960 960 960"
                                            width="24px"
                                            fill="currentColor"
                                          >
                                            <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                                          </svg>
                                        </span>
                                      )}
                                      <FormikCustomSearchDropdown
                                        name="category_id"
                                        options={categoryOptions}
                                        className={` ${
                                          errors.category_id &&
                                          touched.category_id &&
                                          "is-invalid input-box-error"
                                        }`}
                                        onChange={handleCategoryChange}
                                      />
                                      <ErrorMessage
                                        name="category_id"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div>
                                  <div className="col-12 col-md-4">
                                    <div className="form-group">
                                      <label
                                        htmlFor="product_id"
                                        className="pb-2 form_label"
                                      >
                                        Product Name
                                      </label>
                                      <FormikCustomSearchDropdown
                                        name="product_id"
                                        options={productOptions}
                                        className={` ${
                                          errors.product_id &&
                                          touched.product_id &&
                                          "is-invalid input-box-error"
                                        }`}
                                      />
                                      <ErrorMessage
                                        name="product_id"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div>
                                  <div className="col-12 col-md-4">
                                    <div className="form-group">
                                      <label
                                        htmlFor="qty"
                                        className="pb-2 form_label"
                                      >
                                        Required Quantity
                                      </label>
                                      <Field
                                        type="number"
                                        name="qty"
                                        className={`form-control font-size-15 rounded-1 ${
                                          errors.qty &&
                                          touched.qty &&
                                          "is-invalid input-box-error"
                                        }`}
                                      />
                                    </div>
                                  </div>
                                  <div className="col-12 col-md-6">
                                    <div className="form-group">
                                      <label
                                        htmlFor="static"
                                        className="mb-1 form_label"
                                      >
                                        Requirement Type
                                      </label>
                                      <FormikCustomSearchDropdown
                                        name="static"
                                        options={requirementTypesOptions}
                                        className={` ${
                                          errors.static &&
                                          touched.static &&
                                          "is-invalid input-box-error"
                                        }`}
                                      />
                                      <ErrorMessage
                                        name="static"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div>
                                  <div className="col-12 col-md-6">
                                    <div className="form-group">
                                      <label
                                        htmlFor="description"
                                        className="pb-2 form_label"
                                      >
                                        Description
                                      </label>
                                      <Field
                                        as="textarea"
                                        name="description"
                                        maxLength={TEXTAREA_TEXT_LENGTH}
                                        className={`form-control ${
                                          errors.description &&
                                          touched.description &&
                                          "is-invalid input-box-error"
                                        }`}
                                        rows={1}
                                      />
                                      <ErrorMessage
                                        name="description"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div>
                                  <div className="col-6"></div>
                                  {/* {customFormList &&
                              customFormList.map((item, index) => (
                                <React.Fragment
                                  key={`${item.reference_column_name}-${index}-toggle-${item.form_type}`} // Enhanced key for uniqueness
                                >
                                  {item.form_type === 2 ? (
                                    <div
                                      className="col-12 border rounded bg-secondary"
                                      onClick={toggleMenu2}
                                      style={{ cursor: "pointer" }}
                                    >
                                      <b
                                        style={{
                                          cursor: "pointer",
                                          display: "block",
                                          color: "#ffff",
                                        }}
                                      >
                                        <span className="ms-2">
                                          More Inquiry Information {isMenuOpen2 ? "▲" : "▼"}
                                        </span>
                                      </b>
                                    </div>
                                  ) : null}
                                </React.Fragment>
                              ))} */}

                                  {isMenuOpen2 && customFormList.length > 0 && (
                                    <div className="row mt-2">
                                      {customFormList &&
                                        customFormList.map((item, index) => (
                                          <React.Fragment
                                            key={`${item.reference_column_name}-${index}-${item.form_type}`} // Enhanced key for uniqueness
                                          >
                                            {item.form_type === 2
                                              ? renderInputField(
                                                  item,
                                                  item.title,
                                                  item.reference_column_name,
                                                  setFieldValue,
                                                  errors,
                                                  touched,
                                                )
                                              : null}
                                          </React.Fragment>
                                        ))}
                                    </div>
                                  )}
                                </>
                              )}
                            </>
                          )}
                        </div>
                        <div className="col-12 col-12 pt-4 d-flex justify-content-end modal-buttons">
                          {/* <button
                          type="button"
                          className="border border-1  px-4 me-2 py-2  rounded-1 form_label"
                          onClick={onHide}
                          style={{color:"#f58634"}}
                        >
                          Close
                        </button> */}
                          <button
                            type="button"
                            className="modal-button1"
                            onClick={onHide}
                            // style={{color:"#f58634"}}
                          >
                            Close
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary px-4 py-2 ms-2 text-light form_label rounded-1"
                            style={{ backgroundColor: "#f58634" }}
                            disabled={isSubmitting}
                            onClick={async (e) => {
                              e.preventDefault();

                              const validationErrors =
                                await validateForm(values);

                              if (Object.keys(validationErrors).length !== 0) {
                                toast.error(
                                  "Required Field Is Missing Please Check Form",
                                );
                                setIsMenuOpen(true);
                                Object.keys(validationErrors).forEach(
                                  (field) => {
                                    setFieldTouched(field, true, false);
                                  },
                                );
                              } else {
                                try {
                                  await submitForm();
                                } catch (error) {
                                  console.error(
                                    "Form submission error:",
                                    error,
                                  );
                                }
                              }
                            }}
                          >
                            {isSubmitting ? "Saving..." : "Save Contact"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
            {isOpenAddSourceTypeModal && (
              <AddCategoryModal
                show={isOpenAddSourceTypeModal}
                onHide={() => {
                  setIsOpenAddSourceTypeModal(false);
                  fetchSourceTypeApi();
                }}
                title="Add Source Type"
                placeholder="Enter Source Type"
                btn1="Cancel"
                btn2="Add"
                displayClearButton={true}
                payloadKey="addContactSourceType"
              />
            )}
            {isOpenAddAssignLabelModal && (
              <AddCategoryModal
                show={isOpenAddAssignLabelModal}
                onHide={() => {
                  setIsOpenAddAssignLabelModal(false);
                  fetchLabelTypeApi();
                }}
                title="Add Label"
                placeholder="Enter Label"
                btn1="Cancel"
                btn2="Add"
                displayClearButton={true}
                payloadKey="addContactAssignLabel"
              />
            )}
            {isOpenAddCountryModal && (
              <AddCategoryModal
                show={isOpenAddCountryModal}
                onHide={() => {
                  setIsOpenAddCountryModal(false);
                  fetchcontryapi();
                }}
                title="Add Country"
                btn1="Cancel"
                btn2="Add"
                displayClearButton={true}
                payloadKey="addCountry"
                dynamicFields={[
                  {
                    name: "country_name",
                    placeholder: "Enter Country Name",
                    label: "Country Name",
                  },
                  {
                    name: "country_code",
                    placeholder: "Enter Country Code",
                    label: "Country Code",
                  },
                  {
                    name: "country_iso",
                    placeholder: "Enter Country ISO",
                    label: "Country ISO",
                  },
                ]}
              />
            )}
            {isOpenAddStateModal && (
              <AddCategoryModal
                show={isOpenAddStateModal}
                onHide={() => {
                  setIsOpenAddStateModal(false);
                  fetchStateapi();
                }}
                title="Add State"
                btn1="Cancel"
                btn2="Add"
                placeholder="Enter State Name"
                displayClearButton={true}
                payloadKey="addState"
                extraPayloadFields={{ country_id: selectedCountryId }}
              />
            )}
            {isOpenAddCityModal && (
              <AddCategoryModal
                show={isOpenAddCityModal}
                onHide={() => {
                  setIsOpenAddCityModal(false);
                  fetchCityApi();
                }}
                title="Add City"
                btn1="Cancel"
                btn2="Add"
                placeholder="Enter City Name"
                displayClearButton={true}
                payloadKey="addCity"
                extraPayloadFields={{
                  country_id: selectedCountryId,
                  state_id: selectedStateId,
                }}
              />
            )}
            {isOpenAddAreaModal && (
              <AddCategoryModal
                show={isOpenAddAreaModal}
                onHide={() => {
                  setIsOpenAddAreaModal(false);
                  fetchAreaApi();
                }}
                title="Add Area"
                btn1="Cancel"
                btn2="Add"
                placeholder="Enter Area Name"
                displayClearButton={true}
                payloadKey="addArea"
                extraPayloadFields={{
                  country_id: selectedCountryId,
                  state_id: selectedStateId,
                  city_id: selectedCityId,
                }}
              />
            )}
            {isOpenAddCategoryModal && (
              <AddCategoryModal
                show={isOpenAddCategoryModal}
                onHide={() => {
                  setIsOpenAddCategoryModal(false);
                  // fetchCategoryApiForProduct(setCategoryList, null);
                  fetchCategoryApi(setCategoryList);
                }}
                title="Add Product Category"
                placeholder="Enter Product Category"
                btn1="Cancel"
                btn2="Add"
                displayClearButton={true}
                payloadKey="addProductCategory"
              />
            )}
          </div>
        )}
      </React.Fragment>
    </div>
  );
};

export default CreateContactView;
