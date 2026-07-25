import {
  FormikErrors,
  useFormikContext
} from "formik";
import React, { useContext, useEffect, useState } from "react";

import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { AppContext } from "../../../common/AppContext";
import { handleRefresh } from "../../../common/SharedFunction";
import ImageCropperToolModel from "../../../components/model/ImageCroperToolModel";
import OtpConfirmationModal from "../../../components/model/OtpConfirmationModal";
import PrintSettingModal from "../../../components/model/PrintSettingModal";
import {
  DEFAULT_MESSAGE_ERROR_PERMISSION,
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED
} from "../../../helpers/AppConstants";

import { axiosInstance } from "../../../services/axiosInstance";

import {
  createCompany,
  fetchCategoryB2BApi,
  fetchCountryApiForCompany,
  fetchCurrency,
  ICreateCompany,
  updateOpenImageSettings
} from "./NewCreateCompanyController";

const NewOpenImageSettings = ({
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

  const [currency, setCurrency] = useState<ICurrency[]>([]);

  const [selectedStateId, setSelectedStateId] = useState<number>();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>();

  const [isPrintSettingShow, setIsPrintSettingShow] = useState(false);
  const [isModalImageTool, setIsModalImageTool] = useState<boolean>(false);
  const [isModalImageToolForHeader, setIsModalImageToolForHeader] =
    useState<boolean>(false);
  const [isModalImageToolForFooter, setIsModalImageToolForFooter] =
    useState<boolean>(false);

  const [headerCroppedImageUrl, setHeaderCroppedImageUrl] = useState<
    string | undefined
  >();
  const [footerCroppedImageUrl, setFooterCroppedImageUrl] = useState<
    string | undefined
  >();

  const [headerCroppedImage, setHeaderCroppedImage] = useState<Blob | null>(
    null,
  );
  const [footerCroppedImage, setFooterCroppedImage] = useState<Blob | null>(
    null,
  );

  // online Store Banner States
  const [
    isModalImageToolForOnlineStoreBanner,
    setIsModalImageToolForOnlineStoreBanner,
  ] = useState<boolean>(false);
  const [onlineStoreBannerCroppedImage, setOnlineStoreBannerCroppedImage] =
    useState<Blob | null>(null);
  const [
    onlineStoreBannerCroppedImageUrl,
    setOnlineStoreBannerCroppedImageUrl,
  ] = useState<string | undefined>();
  const [storeBannerOneimage, setStoreBannerOneimage] = useState(
    companyToEdit?.banner_img_one || "",
  );
  const [storeBannerOnePreview, setStoreBannerOnePreview] = useState<
    string | null
  >(null);

  const [
    isModalImageToolForOnlineStoreBannertwo,
    setIsModalImageToolForOnlineStoreBannertwo,
  ] = useState<boolean>(false);
  const [
    onlineStoreBannertwoCroppedImage,
    setOnlineStoreBannertwoCroppedImage,
  ] = useState<Blob | null>(null);
  const [
    onlineStoreBannertwoCroppedImageUrl,
    setOnlineStoreBannertwoCroppedImageUrl,
  ] = useState<string | undefined>();
  const [storeBannertwoimage, setStoreBannertwoimage] = useState(
    companyToEdit?.banner_img_two || "",
  );
  const [storeBannertwoPreview, setStoreBannertwoOnePreview] = useState<
    string | null
  >(null);

  const handleViewImageTool = () => {
    if (true) {
      setIsModalImageTool(true);
      // alert("click");
      // alert(isModalImageTool)
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleViewImageToolForHeader = () => {
    if (true) {
      setIsModalImageToolForHeader(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const handleViewImageToolForOnlineStoreBanner = () => {
    if (true) {
      setIsModalImageToolForOnlineStoreBanner(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const handleViewImageToolForOnlineStoreBannertwo = () => {
    if (true) {
      setIsModalImageToolForOnlineStoreBannertwo(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleViewImageToolForFooter = () => {
    if (true) {
      setIsModalImageToolForFooter(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleViewImageToolForSign = () => {
    if (true) {
      setIsModalImageToolForSign(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const [croppedImage, setCroppedImage] = useState<Blob | null>(null);

  const [croppedImageBlob, setCroppedImageBlob] = useState<Blob | null>(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | undefined>();

  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [image, setImage] = useState(companyToEdit?.company_logo || "abcd");
  const [headerimage, setHeaderimage] = useState(
    companyToEdit?.header_image || "",
  );
  const [footerimage, setFooterimage] = useState(
    companyToEdit?.footer_image || "",
  );
  const [isModalImageToolForSign, setIsModalImageToolForSign] =
    useState<boolean>(false);
  const [signCroppedImageUrl, setSignCroppedImageUrl] = useState<
    string | undefined
  >();
  const [signCroppedImage, setSignCroppedImage] = useState<Blob | null>(null);

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

  const handleCroppedImage = async (blob: Blob | null, url: string | null) => {
    if (blob && url) {
      setCroppedImage(blob);
      setCroppedImageUrl(url);
      const croppedFile = new File([blob], "cropped-logo.jpg", {
        type: "image/jpeg",
      });
      setFieldValue("company_logo", croppedFile);
    } else {
      if (croppedImageUrl) {
        URL.revokeObjectURL(croppedImageUrl);
      }
      setFieldValue("company_logo", ""); // Clear Formik field
      await handleDeleteImage("company_logo");
      // Optionally clear Formik field if needed
    }
  };
  const handleCroppedImageForHeader = async (
    blob: Blob | null,
    url: string | null,
  ) => {
    if (blob && url) {
      setHeaderCroppedImage(blob);
      setHeaderCroppedImageUrl(url);
      const croppedFile = new File([blob], "cropped-header.jpg", {
        type: "image/jpeg",
      });
      setFieldValue("headerImg", croppedFile);
    } else {
      if (headerCroppedImageUrl) {
        URL.revokeObjectURL(headerCroppedImageUrl);
      }
      setHeaderCroppedImage(null);
      setHeaderCroppedImageUrl("");
      setFieldValue("headerImg", "");
      await handleDeleteImage("header_img");
    }
  };

  const handleCroppedImageForFooter = async (
    blob: Blob | null,
    url: string | null,
  ) => {
    if (blob && url) {
      setFooterCroppedImage(blob);
      setFooterCroppedImageUrl(url);
      const croppedFile = new File([blob], "cropped-footer.jpg", {
        type: "image/jpeg",
      });
      setFieldValue("footerImg", croppedFile);
    } else {
      if (footerCroppedImageUrl) {
        URL.revokeObjectURL(footerCroppedImageUrl);
      }
      setFooterCroppedImage(null);
      setFooterCroppedImageUrl("");
      setFieldValue("footerImg", "");
      await handleDeleteImage("footer_img");
    }
  };
  const handleCroppedImageForOnlineStoreBanner = async (
    blob: Blob | null,
    url: string | null,
  ) => {
    if (blob && url) {
      setOnlineStoreBannerCroppedImage(blob);
      setOnlineStoreBannerCroppedImageUrl(url);
      const croppedFile = new File(
        [blob],
        "cropped-online-store-banner-one.jpg",
        { type: "image/jpeg" },
      );
      setFieldValue("bannerimgone", croppedFile);
    } else {
      if (onlineStoreBannerCroppedImageUrl) {
        URL.revokeObjectURL(onlineStoreBannerCroppedImageUrl);
      }
      setOnlineStoreBannerCroppedImage(null);
      setOnlineStoreBannerCroppedImageUrl("");
      setFieldValue("bannerimgone", "");
      await handleDeleteImage("banner_img_one");
    }
  };
  const handleCroppedImageForOnlineStoreBannertwo = async (
    blob: Blob | null,
    url: string | null,
  ) => {
    if (blob && url) {
      setOnlineStoreBannertwoCroppedImage(blob);
      setOnlineStoreBannertwoCroppedImageUrl(url);
      const croppedFile = new File(
        [blob],
        "cropped-online-store-banner-one.jpg",
        { type: "image/jpeg" },
      );
      setFieldValue("bannerimgtwo", croppedFile);
    } else {
      if (onlineStoreBannertwoCroppedImageUrl) {
        URL.revokeObjectURL(onlineStoreBannertwoCroppedImageUrl);
      }
      setOnlineStoreBannertwoCroppedImage(null);
      setOnlineStoreBannertwoCroppedImageUrl("");
      setFieldValue("bannerimgtwo", "");
      await handleDeleteImage("banner_img_two");
    }
  };

  const handleCroppedImageForSign = async (
    blob: Blob | null,
    url: string | null,
  ) => {
    if (blob && url) {
      setSignCroppedImage(blob);
      setSignCroppedImageUrl(url);
      const croppedFile = new File([blob], "cropped-sign.jpg", {
        type: "image/jpeg",
      });
      setFieldValue("company_sign", croppedFile);
    } else {
      if (signCroppedImageUrl) {
        URL.revokeObjectURL(signCroppedImageUrl);
      }
      setSignCroppedImage(null);
      setSignCroppedImageUrl("");
      setFieldValue("company_sign", "");
      await handleDeleteImage("company_sign");
    }
  };

  const validateImageDimensions = (
    file: File,
    width: number,
    height: number,
    callback: (isValid: boolean) => void,
  ) => {
    // Check if the file is an image
    if (!file.type.startsWith("image/")) {
      console.warn("Invalid file type for image validation:", file.type);
      toast.error("Please upload a valid image file (PNG, JPG, or JPEG).");
      callback(false);
      return;
    }

    try {
      const img = new Image();
      img.src = URL.createObjectURL(file);

      img.onload = () => {
        try {
          if (img.width === width && img.height === height) {
            callback(true);
          } else {
            callback(false);
          }
        } catch (error) {
          console.error("Error processing image dimensions:", error);
          callback(false);
        } finally {
          URL.revokeObjectURL(img.src);
        }
      };

      img.onerror = () => {
        console.error(
          "Failed to load image for dimension validation:",
          file.name,
        );
        toast.error("Could not load the image. Please try another file.");
        callback(false);
        URL.revokeObjectURL(img.src);
      };
    } catch (error) {
      console.error("Error in validateImageDimensions:", error);
      toast.error("An error occurred while validating the image.");
      callback(false);
    }
  };
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
    if (croppedImageUrl) {
      setImage(croppedImageUrl);
    } else if (logPreview) {
      setImage(logPreview);
    } else if (companyToEdit?.company_logo) {
      setImage(companyToEdit.company_logo);
    } else {
      setImage("");
    }
  }, [croppedImageUrl, logPreview, companyToEdit?.company_logo]);

  // For Header
  useEffect(() => {
    if (headerCroppedImageUrl) {
      setHeaderimage(headerCroppedImageUrl);
    } else if (headerPreview) {
      setHeaderimage(headerPreview);
    } else if (companyToEdit?.header_image) {
      setHeaderimage(companyToEdit.header_image);
    } else {
      setHeaderimage("");
    }
  }, [headerCroppedImageUrl, headerPreview, companyToEdit?.header_image]);

  // For Online Store Banner One
  useEffect(() => {
    if (onlineStoreBannerCroppedImageUrl) {
      setStoreBannerOneimage(onlineStoreBannerCroppedImageUrl);
    } else if (storeBannerOnePreview) {
      setStoreBannerOneimage(storeBannerOnePreview);
    } else if (companyToEdit?.banner_img_one) {
      setStoreBannerOneimage(companyToEdit.banner_img_one);
    } else {
      setStoreBannerOneimage("");
    }
  }, [
    onlineStoreBannerCroppedImageUrl,
    storeBannerOnePreview,
    companyToEdit?.banner_img_one,
  ]);

  // For Online Store Banner One Two
  useEffect(() => {
    if (onlineStoreBannertwoCroppedImageUrl) {
      setStoreBannertwoimage(onlineStoreBannertwoCroppedImageUrl);
    } else if (storeBannertwoPreview) {
      setStoreBannertwoimage(storeBannertwoPreview);
    } else if (companyToEdit?.banner_img_two) {
      setStoreBannertwoimage(companyToEdit.banner_img_two);
    } else {
      setStoreBannertwoimage("");
    }
  }, [
    onlineStoreBannertwoCroppedImageUrl,
    storeBannertwoPreview,
    companyToEdit?.banner_img_two,
  ]);

  // For Footer
  useEffect(() => {
    if (footerCroppedImageUrl) {
      setFooterimage(footerCroppedImageUrl);
    } else if (footerPreview) {
      setFooterimage(footerPreview);
    } else if (companyToEdit?.footer_image) {
      setFooterimage(companyToEdit.footer_image);
    } else {
      setFooterimage("");
    }
  }, [footerCroppedImageUrl, footerPreview, companyToEdit?.footer_image]);

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
      updateOpenImageSettings(
        values,
        setRefresh,
        companyToEdit,
        onHide,
        values.headerImg,
        values.footerImg,
        values.company_logo,
        values.company_sign,
        values.company_catalog,
        values.bannerimgone,
        values.bannerimgtwo,
      );
      setImage(values.company_logo);
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
    setHeaderPreview("");
    // handleRefresh();
    onHide();
    setFooterPreview("");
    setLogPreview("");
    setSignPreview("");
    setCataLogPreview("");
    setCataLogView("");
    setImage("");
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

  const handleDeleteImage = async (columnName: string) => {
    try {
      setIsDeletingImage(true);
      const requestData = {
        table: "company_masters",
        where: `{"id":"${companyToEdit?.id}"}`,
        data: `{"${columnName}":""}`,
      };
      const { data } = await axiosInstance.post(
        "mainCommonUpdate",
        requestData,
      );
      if (data.code === 200) {
        if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          if (columnName === "company_logo") {
            setFieldValue("company_logo", "");
          } else if (columnName === "company_sign") {
            setFieldValue("company_sign", "");
          } else if (columnName === "company_catalog") {
            setFieldValue("company_catalog", "");
          } else if (columnName === "header_img") {
            setFieldValue("headerImg", "");
          } else if (columnName === "footer_img") {
            setFieldValue("footerImg", "");
          } else if (columnName === "banner_img_one") {
            setFieldValue("bannerimgone", "");
          } else if (columnName === "banner_img_two") {
            setFieldValue("bannerimgtwo", "");
          }
          setCroppedImage(null);
          setCroppedImageUrl(undefined);
          setLogPreview("");
          setImage("");
          if (croppedImageUrl) {
            URL.revokeObjectURL(croppedImageUrl);
          }
          // handleRefresh();
        } else {
          toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED,
      );
    } finally {
      setIsDeletingImage(false);
    }
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    fieldName: string,
    setFieldValue: {
      (
        field: string,
        value: any,
        shouldValidate?: boolean,
      ): Promise<void | FormikErrors<ICreateCompany>>;
      (arg0: any, arg1: any): void;
    },
    setPreview: {
      (value: React.SetStateAction<string | null>): void;
      (arg0: string): void;
    },
  ) => {
    const file = event.currentTarget.files?.[0];
    const inputRef = event.currentTarget; // Store reference to the input element
    if (file) {
      if (fieldName === "headerImg" || fieldName === "footerImg") {
        validateImageDimensions(file, 600, 90, (isValid) => {
          if (isValid) {
            setFieldValue(fieldName, file);
            setPreview(URL.createObjectURL(file));
          } else {
            toast.error("Please Select File with 600px X 90px dimension");
            inputRef.value = ""; // Reset the input using the stored reference
          }
        });
      } else {
        setFieldValue(fieldName, file);
        setPreview(URL.createObjectURL(file));
        if (fieldName === "company_catalog") {
          setCataLogView(file.name);
        }
      }
    }
  };

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

  const dropDownOptions = [
    { label: "V1-A4 (With GST)", value: 1 },
    { label: "V2-A4 (Without GST)", value: 2 },
    { label: "V3-A5 (With GST)", value: 3 },
    { label: "V4-A5 (Without GST)", value: 4 },
    { label: "V5-POS", value: 5 },
  ];

  return (
    <>
      <div className="mt-4 d-flex justify-content-center">
        <div className="mb-3 py-4  ">
          <div className="row  mx-0 px-2 gy-3  d-flex justify-content-center">
            <div className="row">
              <div className="col-4 mt-2">
                <div className="add-source-of-type-section">
                  <p>
                    Company Logo
                    <small className="text-danger ps-2">
                      Best Size(521 X 512px)
                    </small>
                  </p>
                </div>
                <div className="imgBox-product d-flex align-items-end">
                  {croppedImageUrl ? (
                    <img
                      onClick={handleViewImageTool}
                      src={croppedImageUrl}
                      alt=""
                      className="imgBox-product-cover animate__animated animate__fadeIn"
                    />
                  ) : logPreview ? (
                    <img
                      onClick={handleViewImageTool}
                      src={logPreview}
                      alt=""
                      className="imgBox-product-cover animate__animated animate__fadeIn"
                    />
                  ) : values.company_logo ? (
                    <>
                      <img
                        onClick={handleViewImageTool}
                        src={values.company_logo}
                        alt=""
                        className="imgBox-product-cover animate__animated animate__fadeIn"
                      />
                    </>
                  ) : (
                    <img
                      onClick={handleViewImageTool}
                      src={require("../../../assets/images/company_logo.png")}
                      alt=""
                      className="imgBox-product-cover animate__animated animate__fadeIn"
                    />
                  )}
                  {values.company_logo && (
                    <button
                      type="button"
                      title="Delete"
                      disabled={isDeletingImage}
                      onClick={() => handleDeleteImage("company_logo")}
                    >
                      <svg
                        className="btn-outline-danger-hover"
                        width="25"
                        height="25"
                        viewBox="0 0 24 24"
                        fill={isDeletingImage ? "currentColor" : "red"}
                      >
                        <path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12z"></path>
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              <div
                className="col-4 mt-2"
              // style={{
              //   position: "absolute",
              //   top: "5%",
              //   left: "70%",
              // }}
              >
                <div className="add-source-of-type-section">
                  <p>
                    Company Sign / Stamp 
                    <small className="text-danger ps-2">
                      Best Size(521 X 512px)
                    </small>
                  </p>
                </div>
                <div
                  className="imgBox-product d-flex align-items-end"
                  style={{
                    maxWidth: "200px",
                    maxHeight: "200px",
                  }}
                >
                  <label htmlFor="input-files-company-sign">
                    <div>
                      {signCroppedImageUrl ? (
                        <img
                          onClick={handleViewImageToolForSign}
                          src={signCroppedImageUrl}
                          alt=""
                          className="imgBox-product-cover animate__animated animate__fadeIn"
                          style={{
                            width: "100%",
                            height: "100%",
                          }}
                        />
                      ) : signPreview ? (
                        <img
                          onClick={handleViewImageToolForSign}
                          src={signPreview}
                          alt=""
                          className="imgBox-product-cover animate__animated animate__fadeIn"
                          style={{
                            width: "100%",
                            height: "100%",
                          }}
                        />
                      ) : values.company_sign ? (
                        <img
                          onClick={handleViewImageToolForSign}
                          src={values.company_sign}
                          alt=""
                          className="imgBox-product-cover animate__animated animate__fadeIn"
                          style={{
                            width: "100%",
                            height: "100%",
                          }}
                        />
                      ) : (
                        <img
                          onClick={handleViewImageToolForSign}
                          src={require("../../../assets/images/company_logo.png")}
                          alt=""
                          className="imgBox-product-cover animate__animated animate__fadeIn"
                          style={{
                            width: "100%",
                            height: "100%",
                          }}
                        />
                      )}
                    </div>

                    {/* <div>
                                            <div className="form-group1">
                                              <input
                                                type="file"
                                                name="image"
                                                id="input-files-company-sign"
                                                className="form-control-file border"
                                                onChange={(event) =>
                                                  handleFileChange(
                                                    event,
                                                    "company_sign",
                                                    setFieldValue,
                                                    setSignPreview
                                                  )
                                                }
                                                style={{ display: "none" }}
                                                accept=".png,.jpg,.jpeg"
                                              />
                                            </div>
                                          </div> */}
                  </label>
                </div>
              </div>

              <div className="col-4 mt-2">
                <div className="add-source-of-type-section">
                  <p>Company Profile</p>
                </div>
                <div className=" px-2 chat-attach">
                  <label
                    style={{
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                    }}
                    htmlFor="file-upload-company-catalog"
                  >
                    <div className="col-7 card p-4">
                      <div className="text-center">
                        {catalogview ? (
                          <span>
                            <b>{catalogview}</b>
                          </span>
                        ) : (
                          <span
                            style={{
                              color: "rgb(153, 153, 153)",
                            }}
                          >
                            Please select file
                          </span>
                        )}
                      </div>
                    </div>
                  </label>

                  <input
                    type="file"
                    id="file-upload-company-catalog"
                    onChange={(event) =>
                      handleFileChange(
                        event,
                        "company_catalog", // The field name you want to set
                        setFieldValue, // Function to update the field value
                        setCataLogPreview, // Function to set the image preview
                      )
                    }
                    style={{ display: "none" }} // Hide the actual file input
                    accept=".pdf"
                  />
                </div>
                <div className="ml-2 d-flex align-items-center">
                  {catalogview ? (
                    ""
                  ) : values.company_catalog ? (
                    <Link to={values.company_catalog} target="_blank">
                      <i>Click Hear, to View Catalog</i>
                    </Link>
                  ) : (
                    ""
                  )}
                  {values.company_catalog && (
                    <button
                      type="button"
                      disabled={isDeletingImage}
                      onClick={() => handleDeleteImage("company_catalog")}
                      className="btn"
                      title="Delete"
                    >
                      <svg
                        className="btn-outline-danger-hover"
                        width="25"
                        height="25"
                        viewBox="0 0 24 24"
                        fill={isDeletingImage ? "currentColor" : "red"}
                      >
                        <path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12z"></path>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-6 mt-2" style={{
                position: "relative",
                paddingBottom: "40px",
              }}>
                {/* Header Image Upload */}
                <p>
                  Header Image
                  <small>(minimum image size 1200 PX x 180 PX)</small>
                </p>
                {headerCroppedImageUrl ? (
                  <img
                    onClick={handleViewImageToolForHeader}
                    src={headerCroppedImageUrl}
                    alt=""
                    className="imgBox-company"
                  />
                ) : headerPreview ? (
                  <img
                    onClick={handleViewImageToolForHeader}
                    src={headerPreview}
                    alt=""
                    className="imgBox-company"
                  />
                ) : values.header_img ? (
                  <img
                    onClick={handleViewImageToolForHeader}
                    src={values.header_img}
                    alt=""
                    className="imgBox-company"
                  />
                ) : (
                  <img
                    onClick={handleViewImageToolForHeader}
                    src={require("../../../assets/images/header.png")}
                    alt=""
                    className="imgBox-company"
                  />
                )}
                {/* {
                                          values.header_img && <button type="button" title="Delete" disabled={isDeletingImage} onClick={() => handleDeleteImage("header_img")} style={{ position: "absolute", bottom: "1px", right: "15px" }}>
                                            <svg className="btn-outline-danger-hover" width="25" height="25" viewBox="0 0 24 24" fill={isDeletingImage ? "currentColor" : "red"}>
                                              <path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12z"></path>
                                            </svg>
                                          </button>
                                        } */}
              </div>
              {/* Footer Image Upload */}
              <div className="col-6 mt-2" style={{ position: "relative" }}>
                <p>
                  Footer Image
                  <small>(minimum image size 1200 PX x 180 PX)</small>
                </p>
                {/* <small> minimum image size 500 x 120</small> */}
                {footerCroppedImageUrl ? (
                  <img
                    onClick={handleViewImageToolForFooter}
                    src={footerCroppedImageUrl}
                    alt=""
                    className="imgBox-company"
                  />
                ) : footerPreview ? (
                  <img
                    onClick={handleViewImageToolForFooter}
                    src={footerPreview}
                    alt=""
                    className="imgBox-company"
                  />
                ) : values.footer_img ? (
                  <img
                    onClick={handleViewImageToolForFooter}
                    src={values.footer_img}
                    alt=""
                    className="imgBox-company"
                  />
                ) : (
                  <img
                    onClick={handleViewImageToolForFooter}
                    src={require("../../../assets/images/footer.png")}
                    alt=""
                    className="imgBox-company"
                  />
                )}
                {/* <div>
                                          <div className="form-group1">
                                            <input
                                              type="file"
                                              name="image"
                                              id="input-files-footer"
                                              className="form-control-file border"
                                              onChange={(event) =>
                                                handleFileChange(
                                                  event,
                                                  "footerImg", // The field name you want to set
                                                  setFieldValue, // Function to update the field value
                                                  setFooterPreview // Function to set the image preview
                                                )
                                              }
                                              style={{ display: "none" }}
                                              accept=".png,.jpg,.jpeg"
                                            />
                                          </div>
                                        </div> */}
              </div>
            </div>
            <div className="row">
                <div className="col-6 mt-2" style={{
                  position: "relative",
                  paddingBottom: "40px",
                }}>
                  {/* Header Image Upload */}
                    <p>
                      Online Store Banner
                      <small>(minimum image size 2400 PX x 800 PX)</small>
                    </p>
                    {onlineStoreBannerCroppedImageUrl ? (
                      <img
                        onClick={handleViewImageToolForOnlineStoreBanner}
                        src={onlineStoreBannerCroppedImageUrl}
                        alt=""
                        className="imgBox-company"
                      />
                    ) : storeBannerOnePreview ? (
                      <img
                        onClick={handleViewImageToolForOnlineStoreBanner}
                        src={storeBannerOnePreview}
                        alt=""
                        className="imgBox-company"
                      />
                    ) : values.banner_img_one ? (
                      <img
                        onClick={handleViewImageToolForOnlineStoreBanner}
                        src={values.banner_img_one}
                        alt=""
                        className="imgBox-company"
                      />
                    ) : (
                      <img
                        onClick={handleViewImageToolForOnlineStoreBanner}
                        src={require("../../../assets/images/header.png")}
                        alt=""
                        className="imgBox-company"
                      />
                    )}
                    {/* {
                                          values.banner_img_one && <button type="button" title="Delete" disabled={isDeletingImage} onClick={() => handleDeleteImage("banner_img_one")} style={{ position: "absolute", bottom: "1px", right: "15px" }}>
                                            <svg className="btn-outline-danger-hover" width="25" height="25" viewBox="0 0 24 24" fill={isDeletingImage ? "currentColor" : "red"}>
                                              <path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12z"></path>
                                            </svg>
                                          </button>
                                        } */}
                  
                </div>
                {/* Footer Image Upload */}
                <div className="col-6 mt-2" style={{ position: "relative" }}>
                  <p>
                    Online Store Banner two
                    <small>(minimum image size 2400 PX x 800 PX)</small>
                  </p>
                  {/* <small> minimum image size 500 x 120</small> */}
                  {onlineStoreBannertwoCroppedImageUrl ? (
                    <img
                      onClick={handleViewImageToolForOnlineStoreBannertwo}
                      src={onlineStoreBannertwoCroppedImageUrl}
                      alt=""
                      className="imgBox-company"
                    />
                  ) : storeBannertwoPreview ? (
                    <img
                      onClick={handleViewImageToolForOnlineStoreBannertwo}
                      src={storeBannertwoPreview}
                      alt=""
                      className="imgBox-company"
                    />
                  ) : values.banner_img_two ? (
                    <img
                      onClick={handleViewImageToolForOnlineStoreBannertwo}
                      src={values.banner_img_two}
                      alt=""
                      className="imgBox-company"
                    />
                  ) : (
                    <img
                      onClick={handleViewImageToolForOnlineStoreBannertwo}
                      src={require("../../../assets/images/footer.png")}
                      alt=""
                      className="imgBox-company"
                    />
                  )}
                  {/* <div>
                                          <div className="form-group1">
                                            <input
                                              type="file"
                                              name="image"
                                              id="input-files-footer"
                                              className="form-control-file border"
                                              onChange={(event) =>
                                                handleFileChange(
                                                  event,
                                                  "footerImg", // The field name you want to set
                                                  setFieldValue, // Function to update the field value
                                                  setFooterPreview // Function to set the image preview
                                                )
                                              }
                                              style={{ display: "none" }}
                                              accept=".png,.jpg,.jpeg"
                                            />
                                          </div>
                                        </div> */}
                </div>
              
            </div>

            <div
              style={{
                bottom: "0px",
                background: "#fff",
                padding: "15px",
                borderTop: "1px solid #ddd",
                zIndex: 1000,
                position: "sticky",
                overflow: "auto"
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
      )}
    </>
  );
};
export default NewOpenImageSettings;
