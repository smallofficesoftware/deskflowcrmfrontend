import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { handleRefresh } from "../../../../common/SharedFunction";
import ImageCropperToolModel from "../../../../components/model/ImageCroperToolModel";
import MobileNumberChangeModel from "../../../../components/model/mobileNumberChangeModel/mobileNumberChangeModel";
import OtpConfirmationModal from "../../../../components/model/OtpConfirmationModal";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../helpers/AppConstants";
import {
  axiosInstance,
  axiosInstanceFormData,
} from "../../../../services/axiosInstance";
import PersonalSettingView from "./personal-setting/PersonalSettingView";
import EmailAddressChangeModelView from "../../../../components/model/emailAddressChangeModel/emailAddressChangeModelView";
interface IPropsProfileSetting {
  isProfileOpen: boolean;
  closeProfile: () => void;
  profileDetail: any;
}
const ProfileSetting = ({
  isProfileOpen,
  closeProfile,
  profileDetail,
}: IPropsProfileSetting) => {
  const [loginById, setLoginById] = useState<any>();
  const [isUsernameEditMode, setIsUsernameEditMode] = useState(false);
  const [isLoginPinEditMode, setIsLoginPinEditMode] = useState(false);
  const [editedUsername, setEditedUsername] = useState(profileDetail.username);
  const [isPersonalSettingOpen, setIsPersonalSettingOpen] = useState(false);
  const [editedEmail, setEditedEmail] = useState(profileDetail.recovery_email);
  const [editedLoginPin, setEditedLoginPin] = useState(profileDetail.login_pin);
  const [loginPinError, setLoginPinError] = useState("");
  const [isLoginPinValid, setIsLoginPinValid] = useState(false);
  const [isModalImageTool, setIsModalImageTool] = useState<boolean>(false);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
  const [croppedImageBlob, setCroppedImageBlob] = useState<Blob | null>(null);
  const [currentProfilePic, setCurrentProfilePic] = useState<string | null>(
    null,
  );
  const [isLoadApi, setIsLoadApi] = useState(false);
  const [selectedGender, setSelectedGender] = useState(profileDetail.gender);
  const [tempGender, setTempGender] = useState(profileDetail.gender);
  const [isGenderEditMode, setIsGenderEditMode] = useState(false);
  const [isCloseConfirmation, setIsCloseConfirmation] = useState(false);
  const [isMobileNumberConfirmation, setIsMobileNumberCloseConfirmation] =
    useState(false);
  const [isEmailVerifyConfirmation, setIsEmailVerifyCloseConfirmation] =
    useState(false);

  const [editedMobile, setEditedMobile] = useState(
    profileDetail.recovery_mobile,
  );
  const [isMobileNumberChangeModelOpen, setIsMobileNumberChangeOpen] =
    useState(false);

  const [isEmailChangeModelOpen, setIsEmailChangeOpen] = useState(false);

  const handleGenderChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setTempGender(Number(event.target.value));
  };

  const handleViewImageTool = () => {
    setIsModalImageTool(true);
  };

  const uploadCroppedImage = async (blob: Blob) => {
    const token = localStorage.getItem("token");
    const getUUID = localStorage.getItem("UUID");

    if (!getUUID) {
      toast.error("User ID not found");
      return;
    }

    const file = new File([blob], "profile.jpg", { type: "image/jpeg" });
    const formData = new FormData();
    formData.append("image", file);
    formData.append("id", getUUID);

    try {
      const response = await axiosInstanceFormData.post(
        "changeProfile",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: token || "",
          },
        },
      );

      if (response.data.code === 200) {
        toast.success("Profile picture updated successfully");
        // Optional: reload or update profileDetail
      } else {
        toast.error(
          response.data.ack_msg || "Failed to update profile picture",
        );
      }
    } catch (error: any) {
      toast.error(error?.message || "Error uploading profile picture");
    }
  };

  const handleCroppedImage = (blob: Blob | null, url: string | null) => {
    if (blob && url) {
      setCroppedImageUrl(url);
      setCroppedImageBlob(blob);
      uploadCroppedImage(blob);
      setCurrentProfilePic(url);
    }
    setIsModalImageTool(false);
  };
  const handleConfirmClickGender = async () => {
    const newGender = tempGender;
    setSelectedGender(newGender);
    const requestData = {
      table: "a_application_logins",
      where: `{"id":"${profileDetail.id}"}`,
      data: `{"gender":"${newGender}"}`,
    };
    try {
      const { data } = await axiosInstance.post(
        "mainCommonUpdate",
        requestData,
      );
      if (data.code === 200) {
        if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          handleRefresh();
        } else {
          toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
      }
    } catch (error: any) {
      toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
    setIsGenderEditMode(false);
  };

  const handleCancelClickGender = () => {
    setTempGender(selectedGender);
    setIsGenderEditMode(false);
  };

  const handleUsernameEditClick = () => {
    setIsUsernameEditMode(true);
  };

  const handleEmailEditClick = () => {
    setIsEmailChangeOpen(true);
  };

  const handleLoginPinEditClick = () => {
    setIsLoginPinEditMode(true);
  };
  const handleUpdateMobileNumber = () => {
    setIsMobileNumberChangeOpen(true);
  };

  const handleUsernameSaveClick = async () => {
    // Perform save operation for username (e.g., API call)
    const requestData = {
      table: "a_application_logins",
      where: `{"id":"${profileDetail.id}"}`,
      data: `{"username":"${editedUsername}"}`,
    };

    try {
      const { data } = await axiosInstance.post(
        "mainCommonUpdate",
        requestData,
      );

      if (data.code === 200) {
        if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          // Reload the window to reflect changes
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
      setIsUsernameEditMode(false);
    }
  };

  const handleLoginPinSaveClick = async () => {
    // Perform save operation for email (e.g., API call)
    const requestData = {
      table: "a_application_logins",
      where: `{"id":"${profileDetail.id}"}`,
      data: `{"login_pin":"${editedLoginPin}"}`,
    };
    try {
      const { data } = await axiosInstance.post(
        "mainCommonUpdate",
        requestData,
      );
      if (data.code === 200) {
        if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          // handleRefresh();
        } else {
          toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
      }
    } catch (error: any) {
      toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
    setIsLoginPinEditMode(false);
    // Update profile detail or perform necessary actions
  };
  const handleCancelClick = () => {
    // Reset edited values and toggle off edit mode
    setEditedUsername(profileDetail.username);
    setIsUsernameEditMode(false);
  };

  const handleUsernameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditedUsername(event.target.value);
  };

  const handleLoginPinChange = (e: any) => {
    const loginPin = e.target.value;
    setEditedLoginPin(loginPin);

    if (validateLoginPin(loginPin)) {
      setLoginPinError("");
      setIsLoginPinValid(true);
    } else {
      setLoginPinError("Please enter 6 numeric digits only");
      setIsLoginPinValid(false);
    }
  };
  const validateLoginPin = (pin: any) => {
    // PIN validation regex for exactly 4 numeric digits only
    const pinRegex = /^\d{6}$/;
    return pinRegex.test(pin);
  };

  const fetchGetByIdUser = async () => {
    const token = await localStorage.getItem("token");
    const localId = await localStorage.getItem("UUID");
    try {
      const { data } = await axiosInstance.post(
        "loginId",
        {
          loginId: localId,
        },
        {
          headers: {
            Authorization: `${token}`,
          },
        },
      );
      if (data.code === 200) {
        if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          setLoginById(data.data);
        } else {
          toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
      }
    } catch (error: any) {
      handleRefresh();

      toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  };

  useEffect(() => {
    if (isLoadApi || isProfileOpen) {
      fetchGetByIdUser();
    }
  }, [isLoadApi, isProfileOpen]);

  useEffect(() => {
    const pic = loginById?.profile_pic || profileDetail?.profile_pic || null;
    setCurrentProfilePic(pic);
  }, [loginById, profileDetail]);

  const handleLogout = () => {
    handleRefresh();
    localStorage.clear();
    setIsCloseConfirmation(false);
  };

  const handelCloseChangeNumberOtp = () => {
    handleRefresh();
    setIsMobileNumberCloseConfirmation(false);
  };
  const handelSendOtpForEmailVerify = async () => {
    const token = await localStorage.getItem("token");

    try {
      const response = await axiosInstance.post(
        "otpSendEmailVerifyLogin",
        {
          loginId: profileDetail.id,
        },
        {
          headers: {
            Authorization: `${token}`,
          },
        },
      );
      setIsEmailVerifyCloseConfirmation(true);

      if (response.data.code === 200) {
        if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          setIsEmailVerifyCloseConfirmation(true);
        } else {
          toast.error(response.data.ack_msg);
        }
      } else {
        toast.error(response.data.ack_msg);
      }
    } catch (error) {
      setIsEmailVerifyCloseConfirmation(false);

      toast.error("Failed to send OTP. Please try again.-1-1-1-1");
    }
  };

  const handleCloseEmailVerification = () => {
    handleRefresh();
    setIsEmailVerifyCloseConfirmation(false);
  };

  const handleOpenPersonalSetting = async () => {
    setIsPersonalSettingOpen(true);
    const mobileNo = profileDetail?.recovery_mobile || 0;
    
  };
  return (
    <>
      {isProfileOpen ? (
        <div
          className="profile animate__animated animate__fadeInLeft"
          id="profile"
        >
          {/* <!-- Header --> */}
          <div className="header-Chat">
            {/* <!-- Icons --> */}
            <div className="ICON">
              <div
                aria-disabled="false"
                role="button"
                className="icons"
                data-tab="2"
                title="New chat"
                aria-label="New chat"
                onClick={closeProfile}
              >
                <span data-testid="chat" data-icon="chat" className="">
                  <svg viewBox="0 0 24 24" width="24" height="24" className="">
                    <path
                      fill="currentColor"
                      d="m12 4 1.4 1.4L7.8 11H20v2H7.8l5.6 5.6L12 20l-8-8 8-8z"
                    ></path>
                  </svg>
                </span>
              </div>
            </div>

            <div className="newText">
              <h2>Profile</h2>
            </div>
          </div>
          {/* <!-- Chats --> */}
          <div className="chats-profile">
            {/* <!-- Profile --> */}
            <div className="top">
              <div className="imgBox">
                <div
                  onClick={handleViewImageTool}
                  style={{ cursor: "pointer" }}
                >
                  {currentProfilePic ? (
                    <img
                      src={currentProfilePic}
                      alt=""
                      className="cover animate__animated animate__fadeIn"
                    />
                  ) : (
                    <img
                      src={require("../../../../assets/images/no_image.jpeg")}
                      alt=""
                      className="cover animate__animated animate__fadeIn"
                    />
                  )}
                </div>

                {/* <img
                  src={
                    croppedImageUrl
                      ? croppedImageUrl
                      : loginById?.profile_pic
                        ? loginById.profile_pic
                        : profileDetail?.profile_pic
                          ? profileDetail.profile_pic
                          : require("../../../../assets/images/no_image.jpeg")
                  }
                  alt=""
                  className="cover animate__animated animate__fadeIn"
                /> */}

                <label>
                  <div className="middle" style={{ cursor: "pointer" }}>
                    <div
                      aria-disabled="false"
                      role="button"
                      className="icons-profile"
                      data-tab="2"
                      title="Camera"
                      aria-label="Camera"
                    >
                      <div className="form-group1">
                        <span
                          data-testid="camera"
                          data-icon="camera"
                          className=""
                        >
                          <svg
                            viewBox="0 0 24 24"
                            width="24"
                            height="24"
                            className=""
                          >
                            <path
                              fill="currentColor"
                              d="M21.317 4.381H10.971L9.078 2.45c-.246-.251-.736-.457-1.089-.457H4.905c-.352 0-.837.211-1.078.468L1.201 5.272C.96 5.529.763 6.028.763 6.38v1.878l-.002.01v11.189a1.92 1.92 0 0 0 1.921 1.921h18.634a1.92 1.92 0 0 0 1.921-1.921V6.302a1.92 1.92 0 0 0-1.92-1.921zM12.076 18.51a5.577 5.577 0 1 1 0-11.154 5.577 5.577 0 0 1 0 11.154zm0-9.506a3.929 3.929 0 1 0 0 7.858 3.929 3.929 0 0 0 0-7.858z"
                            ></path>
                          </svg>
                        </span>
                        {/* <input
                          type="file"
                          name="image"
                          id="input-files"
                          className="form-control-file border"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const url = URL.createObjectURL(file);
                              setCroppedImageUrl(url); // Temp preview
                              setIsModalImageTool(true);
                            }
                            e.target.value = ""; // Reset input
                          }}
                          style={{ display: "none" }}
                          accept=".png,.jpg,.jpeg"
                        /> */}
                      </div>
                    </div>
                    <div className="text" onClick={handleViewImageTool}>
                      CHANGE PROFILE PHOTO
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* <!-- Chats 1 --> */}
            <div className="block">
              {/* <!-- Text --> */}
              <div className="h-text">
                <div className="titlePro">
                  <p>Your Name</p>
                </div>

                <div className="head">
                  {isUsernameEditMode ? (
                    <>
                      <div className="search-bar">
                        <div className="add-source-of-type-section">
                          <input
                            type="text"
                            value={editedUsername}
                            onChange={handleUsernameChange}
                          />
                        </div>
                      </div>
                      <div className="d-flex">
                        <button onClick={handleUsernameSaveClick}>
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
                        </button>
                        <span className="m-1">|</span>
                        <button onClick={handleCancelClick}>
                          <svg
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="#5f6368"
                          >
                            <path d="m336-280 144-144 144 144 56-56-144-144 144-144-56-56-144 144-144-144-56 56 144 144-144 144 56 56ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
                          </svg>
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h4>{editedUsername}</h4>
                      <div
                        aria-disabled="false"
                        role="button"
                        className="icons-prof"
                        data-tab="2"
                        title="Edit"
                        aria-label="Edit"
                        onClick={handleUsernameEditClick}
                      >
                        <span
                          data-testid="pencil"
                          data-icon="pencil"
                          className=""
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
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="warning">
              <div className="warn-text">
                <h4>
                  This is not your username or pin. This name will be visible to
                  your deskflow crm contacts.
                </h4>
              </div>
            </div>

            <div className="block">
              {/* <!-- Text --> */}
              <div className="h-text d-flex justify-content-between">
                <div className="titlePro">
                  <p>Personal Settings</p>
                </div>

                <div className="head">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
                    viewBox="0 -960 960 960"
                    width="24px"
                    fill="#1f1f1f"
                    onClick={handleOpenPersonalSetting}
                  >
                    <path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* <!-- Chats 2 --> */}
            <div className="block">
              {/* <!-- Text --> */}
              <div className="h-text">
                <div className="titlePro">
                  <p>Gender</p>
                </div>

                {isGenderEditMode ? (
                  <div className="head">
                    <div className="d-flex gap-2">
                      <label>
                        <input
                          type="radio"
                          className="mx-1"
                          value="1"
                          checked={tempGender === 1}
                          onChange={handleGenderChange}
                        />
                        Male
                      </label>

                      <label>
                        <input
                          type="radio"
                          value="2"
                          className="mx-1"
                          checked={tempGender === 2}
                          onChange={handleGenderChange}
                        />
                        Female
                      </label>

                      <label>
                        <input
                          type="radio"
                          value="3"
                          className="mx-1"
                          checked={tempGender === 3}
                          onChange={handleGenderChange}
                        />
                        Other
                      </label>
                    </div>

                    {isGenderEditMode && (
                      <div className="d-flex">
                        <button onClick={handleConfirmClickGender}>
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
                        </button>
                        <span className="m-1">|</span>
                        <button onClick={handleCancelClickGender}>
                          <svg
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="#5f6368"
                          >
                            <path d="m336-280 144-144 144 144 56-56-144-144 144-144-56-56-144 144-144-144-56 56 144 144-144 144 56 56ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
                          </svg>
                        </button>
                      </div>
                    )}

                    {!isGenderEditMode && (
                      <button onClick={() => setIsGenderEditMode(true)}>
                        Edit Gender
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="d-flex justify-content-between">
                      <p>
                        {selectedGender === 1
                          ? "Male"
                          : selectedGender === 2
                            ? "Female"
                            : "Other"}
                      </p>
                      <div
                        aria-disabled="false"
                        role="button"
                        className="icons-prof"
                        data-tab="2"
                        title="Edit"
                        aria-label="Edit"
                        onClick={() => setIsGenderEditMode(true)}
                      >
                        <span
                          data-testid="pencil"
                          data-icon="pencil"
                          className=""
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
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            {
              <div className="block">
                <div className="h-text">
                  <div className="titlePro">
                    <p>Phone Number</p>
                  </div>

                  <div className="head">
                    {
                      <>
                        <div className="search-bar">
                          <div className="add-source-of-type-section">
                            <input type="email" value={editedMobile} />
                          </div>
                        </div>
                        <div
                          aria-disabled="false"
                          role="button"
                          className="icons-prof"
                          data-tab="2"
                          title="Edit"
                          aria-label="Edit"
                          onClick={handleUpdateMobileNumber}
                        >
                          <span
                            data-testid="pencil"
                            data-icon="pencil"
                            className=""
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
                        </div>
                      </>
                    }
                  </div>
                  {profileDetail.isOtpVerified != 1 && (
                    <p
                      style={{
                        color: "red",
                        fontStyle: "italic",
                        fontSize: "12px",
                      }}
                    >
                      The phone number has been automatically generated by the
                      system. Kindly update it with a valid phone number.
                    </p>
                  )}
                </div>
              </div>
            }
            {
              <div className="block">
                {/* <!-- Text --> */}
                <div className="h-text">
                  <div className="titlePro">
                    <p>Email</p>
                  </div>

                  <div className="head">
                    {
                      <>
                        <h4>
                          {editedEmail}{" "}
                          {profileDetail.is_email_verified === 1 && (
                            <span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="24px"
                                viewBox="0 -960 960 960"
                                width="24px"
                                fill="#3ef706"
                              >
                                <path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q65 0 123 19t107 53l-58 59q-38-24-81-37.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160q133 0 226.5-93.5T800-480q0-18-2-36t-6-35l65-65q11 32 17 66t6 70q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm-56-216L254-466l56-56 114 114 400-401 56 56-456 457Z" />
                              </svg>
                            </span>
                          )}
                        </h4>
                        {
                          <div
                            aria-disabled="false"
                            role="button"
                            className="icons-prof"
                            data-tab="2"
                            title="Edit"
                            aria-label="Edit"
                            onClick={handleEmailEditClick}
                          >
                            <span
                              data-testid="pencil"
                              data-icon="pencil"
                              className=""
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
                          </div>
                        }
                      </>
                    }
                  </div>
                  {
                    <div className="">
                      {profileDetail.registration_flag == 2 && (
                        <p
                          style={{
                            color: "red",
                            fontStyle: "italic",
                            fontSize: "12px",
                          }}
                        >
                          The email address has been automatically generated by
                          the system. Kindly update it with a valid email
                          address.
                        </p>
                      )}
                      {profileDetail.is_email_verified === 1
                        ? null
                        : profileDetail.registration_flag != 2 && (
                            <p style={{ color: `red` }}>
                              <i>
                                Please{" "}
                                <b
                                  style={{
                                    color: "blue",
                                    textDecoration: "underline",
                                    fontWeight: "normal",
                                    cursor: "pointer",
                                  }}
                                  onClick={handelSendOtpForEmailVerify}
                                >
                                  Click Here
                                </b>{" "}
                                To Verify Your Email
                              </i>
                            </p>
                          )}
                    </div>
                  }
                </div>
              </div>
            }
            <div className="block">
              <div className="h-text">
                <div className="titlePro">
                  <p>Set Login Pin</p>
                </div>

                <div className="head">
                  {isLoginPinEditMode ? (
                    <>
                      <div className="search-bar">
                        <div className="add-source-of-type-section">
                          <input
                            type="text"
                            value={editedLoginPin}
                            onChange={handleLoginPinChange}
                            className={loginPinError ? "error" : ""}
                          />
                        </div>
                      </div>

                      <div className="d-flex">
                        {isLoginPinValid && (
                          <button onClick={handleLoginPinSaveClick}>
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
                          </button>
                        )}
                        <span className="m-1">|</span>
                        <button onClick={() => setIsLoginPinEditMode(false)}>
                          <svg
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="#5f6368"
                          >
                            <path d="m336-280 144-144 144 144 56-56-144-144 144-144-56-56-144 144-144-144-56 56 144 144-144 144 56 56ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
                          </svg>
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h4>******</h4>

                      <div
                        aria-disabled="false"
                        role="button"
                        className="icons-prof"
                        data-tab="2"
                        title="Edit"
                        aria-label="Edit"
                        onClick={handleLoginPinEditClick}
                      >
                        <span
                          data-testid="pencil"
                          data-icon="pencil"
                          className=""
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
                      </div>
                    </>
                  )}
                </div>
                {loginPinError && (
                  <div className="error-message ">{loginPinError}</div>
                )}
              </div>
            </div>
            <div className="block">
              {/* <!-- Text --> */}
              <div className="h-text">
                <div className="titlePro">
                  <p>Account Delete</p>
                </div>
                <div className="head">
                  <button
                    className="btn btn-danger"
                    onClick={() => setIsCloseConfirmation(true)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <OtpConfirmationModal
        show={isCloseConfirmation}
        onHide={() => setIsCloseConfirmation(false)}
        handleSubmit={handleLogout}
        title={`Delete this Account `}
        message={`Are you sure you want Delete this Account?`}
        btn1="Close"
        btn2="Delete"
        mobileNumber={
          profileDetail?.registration_flag !== 1
            ? profileDetail?.recovery_mobile
            : ""
        }
        emailId={
          profileDetail?.registration_flag !== 2
            ? profileDetail?.recovery_email
            : ""
        }
        profileId={profileDetail.id}
        position={1}
      />
      <MobileNumberChangeModel
        show={isMobileNumberChangeModelOpen}
        onHide={() => setIsMobileNumberChangeOpen(false)}
        RequiredDetail={{
          title: "Change Mobile Number",
          phone_number: editedMobile,
          is_auto_generate_phone: profileDetail.registration_flag == 1,
        }}
      />
      <EmailAddressChangeModelView
        show={isEmailChangeModelOpen}
        onHide={() => setIsEmailChangeOpen(false)}
        RequiredDetail={{
          title: "Change Email Address",
          email_address: editedEmail,
          is_auto_generate_email: profileDetail.registration_flag == 2,
        }}
      />
      <PersonalSettingView
        show={isPersonalSettingOpen}
        onHide={() => setIsPersonalSettingOpen(false)}
        companyToEdit={loginById}
        headerName="Save Personal Detail"
        setIsLoadApi={setIsLoadApi}
      />
      <OtpConfirmationModal
        show={isMobileNumberConfirmation}
        onHide={() => setIsMobileNumberCloseConfirmation(false)}
        handleSubmit={handelCloseChangeNumberOtp}
        title={`Change this Mobile Number`}
        message={`Are you sure you want Change this Mobile Number?`}
        btn1="CANCEL"
        btn2="Change"
        mobileNumber={profileDetail?.recovery_mobile}
        emailId={profileDetail?.recovery_email}
        profileId={profileDetail.id}
        position={2}
      />
      <OtpConfirmationModal
        show={isEmailVerifyConfirmation}
        onHide={() => setIsEmailVerifyCloseConfirmation(false)}
        handleSubmit={handleCloseEmailVerification}
        title={`Verify Email`}
        message={`Please check this ${profileDetail?.recovery_email} Email for OTP`}
        btn1="CANCEL"
        btn2="verify"
        mobileNumber={profileDetail?.recovery_mobile}
        emailId={profileDetail?.recovery_email}
        profileId={profileDetail.id}
        position={3}
      />

      {isModalImageTool && (
        <ImageCropperToolModel
          show={isModalImageTool}
          onHide={() => setIsModalImageTool(false)}
          onSubmit={handleCroppedImage}
          initialImage={
            croppedImageUrl ||
            loginById?.profile_pic ||
            profileDetail?.profile_pic
          }
          width={512 * 2}
          height={512 * 2}
          title="Crop Your Profile Picture"
        />
      )}
    </>
  );
};

export default ProfileSetting;
