import React, { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { AppContext } from "../../common/AppContext";
import ConfirmationModal from "../../components/model/ConfirmationModal";
import { DEFAULT_MESSAGE_ERROR_PERMISSION, DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../helpers/AppEnum";
import useCheckUserPermission from "../../hooks/useCheckUserPermission";
import { axiosInstance } from "../../services/axiosInstance";
import { IUserList } from "../left-side/LeftSideController";
import { fetchCustomInqFromApiForContact } from "../left-side/create-contact/CreateContactController";
import CreateContactView from "../left-side/create-contact/CreateContactView";
import { deleteMessages } from "./RightViewController";
import { ICustomFromList } from "./create-inquiry/CreateInquiryController";

interface IPropsProfile {
  isProfile: boolean;
  closeChatAbout: () => void;
  getInfo?: IUserList;
  deleteContact: () => void;
  setIsCreateContact1: any;
}

const RightSideProfile = ({
  isProfile,
  closeChatAbout,
  getInfo,
  deleteContact,
  setIsCreateContact1,
}: IPropsProfile) => {
  const { isEditContact, setIsEditContact } = useContext(AppContext)!;
  const [isClearConfirmation, setIsClearConfirmation] = useState(false);
  const [isLoadedMessage, setIsLoadedMessage] = useState(false);
  const [whatsAppSyncStatus, setWhatsAppSyncStatus] = useState(getInfo?.sync_whatsapp || 0);
  useEffect(() => {
    if (getInfo) {
      setWhatsAppSyncStatus(getInfo?.sync_whatsapp || 0);
    }
  }, [getInfo?.id])
  const [customFormList, setCustomFromList] = useState<ICustomFromList[]>([]);
  const labelColor = getInfo?.label_color
    ? getInfo?.label_color.split(",")
    : [];

  const statusColor = getInfo?.stage_status_color
    ? getInfo?.stage_status_color.split(",")
    : [];

  const labelNames = getInfo?.label_name ? getInfo?.label_name.split(",") : [];
  const statusName = getInfo?.stage_status_name
    ? getInfo?.stage_status_name.split(",")
    : [];

  useEffect(() => {
    if (getInfo?.id) {
      closeChatAbout();
      setIsCreateContact1(true);
    }
  }, [getInfo?.id, setIsCreateContact1]);

  useEffect(() => {
    fetchCustomInqFromApiForContact(setCustomFromList);
  }, []);

  const canDelete = useCheckUserPermission(
    PAGE_ID.CONTACT,
    PERMISSION_TYPE.DELETE
  );
  const canEdit = useCheckUserPermission(PAGE_ID.CONTACT, PERMISSION_TYPE.EDIT);

  const handleChangeEditContact = () => {
    if (canEdit) {
      setIsEditContact(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
      setIsEditContact(false);
    }
  };
  const handleWhatsAppSync = async () => {
    const requestData = {
      table: "contact_masters",
      where: `{"id":${getInfo?.id}}`,
      data: `{"sync_whatsapp":${whatsAppSyncStatus === 1 ? 0 : 1}}`,
    };
    const getUUID = await localStorage.getItem("UUID");
    try {
      const response = await axiosInstance.post("commonUpdate", requestData);
      if (response.data.code === 200) {
        if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          setWhatsAppSyncStatus((pre) =>
            pre === 1 ? 0 : 1
          );
        } else {
          toast.error(
            response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED
          );
        }
      } else {
        toast.error(MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } catch (error: any) {
      toast.error(error.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  }

  const openPrint = (id: number | undefined) => {
    const baseURL = window.location.origin;

    const printUrl = `${baseURL}/ContactAddressPrintView1/${id}`;

    const myWindow = window.open(printUrl, "_blank", "width=1000,height=1000");

    if (myWindow) {
      let isPrinted = false;

      myWindow.onload = () => {
        const checkContent = setInterval(() => {
          const contentElement = myWindow.document.querySelector("body > *");
          if (contentElement && myWindow.document.readyState === "complete") {
            clearInterval(checkContent);

            if (!isPrinted) {
              isPrinted = true;
              setTimeout(() => {
                myWindow.print();
              }, 2000);
              myWindow.onafterprint = () => {
                myWindow.close();
              };
              myWindow.addEventListener("afterprint", () => {
                myWindow.close();
              });
            }
          } else {
            console.log("waiting...");
          }
        }, 100);
      };

      myWindow.addEventListener("beforeunload", () => {
        if (!isPrinted) {
          isPrinted = true;
        }
      });

      setTimeout(() => {
        if (!isPrinted) {
          myWindow.close();
        }
      }, 10000);
    } else {
      console.error("Failed to open print");
    }
    // window.open(`${baseURL}/AccountPrintView1/${id}`, "_blank");
  };

  const openEnvelopePrint = (id: number | undefined) => {
    const baseURL = window.location.origin;

    const printUrl = `${baseURL}/ContactAddressEnvelopePrintView/${id}`;

    const myWindow = window.open(printUrl, "_blank", "width=1000,height=1000");

    if (myWindow) {
      let isPrinted = false;

      myWindow.onload = () => {
        const checkContent = setInterval(() => {
          const contentElement = myWindow.document.querySelector("body > *");
          if (contentElement && myWindow.document.readyState === "complete") {
            clearInterval(checkContent);

            if (!isPrinted) {
              isPrinted = true;
              setTimeout(() => {
                myWindow.print();
              }, 2000);
              myWindow.onafterprint = () => {
                myWindow.close();
              };
              myWindow.addEventListener("afterprint", () => {
                myWindow.close();
              });
            }
          } else {
            console.log("waiting...");
          }
        }, 100);
      };

      myWindow.addEventListener("beforeunload", () => {
        if (!isPrinted) {
          isPrinted = true;
        }
      });

      setTimeout(() => {
        if (!isPrinted) {
          myWindow.close();
        }
      }, 10000);
    } else {
      console.error("Failed to open print");
    }
    // window.open(`${baseURL}/AccountPrintView1/${id}`, "_blank");
  };

  const handleChangeDeleteContact = () => {
    if (canDelete) {
      deleteContact();
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const handelClearMessage = async () => {
    setIsLoadedMessage(false);
    if (await deleteMessages(getInfo?.id)) {
      setIsLoadedMessage(true);
    }
    setIsClearConfirmation(false);
    closeChatAbout();
  };

  const renderCustomField = (item: ICustomFromList) => {
    const fieldValue =
      getInfo?.[item.reference_column_name as keyof IUserList] || "";
    let displayValue = fieldValue;
    switch (item.data_type) {
      case 7:
        displayValue =
          fieldValue === true || fieldValue === "true" ? "Yes" : "No";
        break;
      case 9:
      case 10:
        displayValue = fieldValue || "-";
        break;
      default:
        displayValue = fieldValue || "-";
    }

    return (
      <div className="block" key={item.reference_column_name}>
        <div className="h-text">
          <div className="titlePro">
            <p>{item.title}</p>
          </div>
          <div className="bio">
            <div className="text-inner">
              <h4>{displayValue}</h4>
            </div>
          </div>
        </div>
      </div>
    );
  };



  return (
    <>
      {isProfile && (
        <div
          className="ChatAbout animate__animated animate__fadeInRight"
          id="ChatAbout"
        >
          <div className="header-Chat">
            <div className="ICON">
              <button className="icons" onClick={closeChatAbout}>
                <span>
                  <svg
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                  >
                    <path d="m19.1 17.2-5.3-5.3 5.3-5.3-1.8-1.8-5.3 5.4-5.3-5.3-1.8 1.7 5.3 5.3-5.3 5.3L6.7 19l5.3-5.3 5.3 5.3 1.8-1.8z"></path>
                  </svg>
                </span>
              </button>
            </div>
            <div className="newText">
              <h2>Contact Info</h2>
            </div>
            <div className=" ms-auto justify-content-end d-flex">
              <button className="icons" onClick={() => handleWhatsAppSync()} title="Sync WHatsApp Chats">
                <span>{whatsAppSyncStatus === 1 ? "On" : "Off"}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill={whatsAppSyncStatus === 1 ? "green" : "gray"} className="bi bi-whatsapp ms-2" viewBox="0 0 16 16">
                  <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232" />
                </svg>
              </button>
              <button title="Print Address" className="icons" onClick={() => openPrint(getInfo?.id)}>
                <span data-testid="print" data-icon="print">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path
                      fill="currentColor"
                      d="M6 9V3h12v6H6zm10-4H8v2h8V5zM18 14h2v5H4v-5h2v3h12v-3zm3-7H3c-1.1 0-2 .9-2 2v6h4v-4h14v4h4V9c0-1.1-.9-2-2-2z"
                    />
                  </svg>
                </span>
              </button>
              <button title="Print Envelope" className="icons" onClick={() => openEnvelopePrint(getInfo?.id)}>
                <span data-testid="print envelope" data-icon="print enveolpe">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
                    viewBox="0 -960 960 960"
                    width="24px"
                  >
                    <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm0-80h280v-480H160v480Zm360 0h280v-480H520v480Zm40-120h200v-60H560v60Zm0-100h200v-60H560v60Zm0-100h200v-60H560v60ZM160-240v-480 480Z" fill="currentColor" />
                  </svg>
                </span>
              </button>
              <button className="icons" onClick={handleChangeEditContact}>
                <span data-testid="pencil" data-icon="pencil">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path
                      fill="currentColor"
                      d="M3.95 16.7v3.4h3.4l9.8-9.9-3.4-3.4-9.8 9.9zm15.8-9.1c.4-.4.4-.9 0-1.3l-2.1-2.1c-.4-.4-.9-.4-1.3 0l-1.6 1.6 3.4 3.4 1.6-1.6z"
                    ></path>
                  </svg>
                </span>
              </button>
            </div>
          </div>
          <div className="chats-chatAbout">
            <div className="img-about">
              <div className="img-Ani">

              </div>
              <div className="text-Ani">
                <h3 style={{ fontWeight: "bold" }}>{getInfo?.company_name}</h3>
                <h3>{getInfo?.person_name}</h3>
                <p>{getInfo?.mobile_number}</p>
                <p>{getInfo?.assined_team_person_list}</p>
                <p>{"Created by " + getInfo?.created_by_name}</p>
              </div>
            </div>
            <div className="block">
              <div className="h-text">
                <div className="titlePro">
                  <p>Email Id</p>
                </div>
                <div className="bio">
                  <div className="text-inner">
                    <h4>{getInfo?.email_id}</h4>
                  </div>
                </div>
              </div>
            </div>
            <div className="block">
              <div className="h-text">
                <div className="titlePro">
                  <p>Address</p>
                </div>
                <div className="bio">
                  <div className="text-inner">
                    <h4>{getInfo?.address}</h4>
                  </div>
                </div>
              </div>
            </div>
            <div className="block">
              <div className="h-text">
                <div className="titlePro">
                  <p>Country</p>
                </div>
                <div className="bio">
                  <div className="text-inner">
                    <h4>{getInfo?.country_name}</h4>
                  </div>
                </div>
              </div>
            </div>
            <div className="block">
              <div className="h-text">
                <div className="titlePro">
                  <p>State</p>
                </div>
                <div className="bio">
                  <div className="text-inner">
                    <h4>{getInfo?.state_name}</h4>
                  </div>
                </div>
              </div>
            </div>
            <div className="block">
              <div className="h-text">
                <div className="titlePro">
                  <p>City</p>
                </div>
                <div className="bio">
                  <div className="text-inner">
                    <h4>{getInfo?.city_name}</h4>
                  </div>
                </div>
              </div>
            </div>
            <div className="block">
              <div className="h-text">
                <div className="titlePro">
                  <p>Pin Code</p>
                </div>
                <div className="bio">
                  <div className="text-inner">
                    <h4>{getInfo?.pincode}</h4>
                  </div>
                </div>
              </div>
            </div>
            <div className="block">
              <div className="h-text">
                <div className="titlePro">
                  <p>Source Type</p>
                </div>
                <div className="bio">
                  <div className="text-inner">
                    <div>
                      <span
                        style={{
                          backgroundColor: getInfo?.source_name_color,
                        }}
                        className="badge rounded-pill"
                      >
                        {getInfo?.source_name || "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="block">
              <div className="h-text">
                <div className="titlePro">
                  <p>Labels</p>
                </div>
                <div className="bio">
                  <div className="text-inner">
                    {labelNames.map((name, index) => (
                      <div
                        key={index}
                        style={{
                          backgroundColor: labelColor[index] || "#eeeeee",
                          padding: "5px 10px",
                          borderRadius: "12px",
                          margin: "2px",
                          display: "inline-block",
                        }}
                        className="badge rounded-pill"
                      >
                        {name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="block">
              <div className="h-text">
                <div className="titlePro">
                  <p>Status</p>
                </div>
                <div className="bio">
                  <div className="text-inner">
                    {statusName.map((name, index) => (
                      <div
                        key={index}
                        style={{
                          backgroundColor: statusColor[index] || "#eeeeee",
                          padding: "5px 10px",
                          borderRadius: "12px",
                          margin: "2px",
                          display: "inline-block",
                        }}
                        className="badge rounded-pill"
                      >
                        {name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Render custom fields */}
            {customFormList.map((item) => (
              <React.Fragment key={item.reference_column_name}>
                {item.form_type === 1 ? renderCustomField(item) : null}
              </React.Fragment>
            ))}

            <div className="bottom">
              <div className="h-text">
                <div className="Block-head" onClick={handleChangeDeleteContact}>
                  <div className="contact-star">
                    <span className="star">
                      <svg viewBox="0 0 24 24" width="24" height="24">
                        <path
                          fill="currentColor"
                          d="M6 18c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V6H6v12zM19 3h-3.5l-1-1h-5l-1 1H5v2h14V3z"
                        ></path>
                      </svg>
                    </span>
                  </div>
                  <div className="contact-text">
                    <span className="star-text">Delete Contact</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {isEditContact && (
        <CreateContactView
          show={isEditContact}
          onHide={() => setIsEditContact(false)}
          contactData={getInfo}
          headerName={"Edit Contact"}
          setIsCreateContact1={setIsCreateContact1}
          closeChatAbout={closeChatAbout}
        />
      )}
      {isClearConfirmation && (
        <ConfirmationModal
          show={isClearConfirmation}
          onHide={() => setIsClearConfirmation(false)}
          handleSubmit={() => handelClearMessage()}
          title={"Clear this chats"}
          message={"Are you sure you want Clear this Chats?"}
          btn1="CANCEL"
          btn2="CLEAR CHATS"
        />
      )}
    </>
  );
};

export default RightSideProfile;
