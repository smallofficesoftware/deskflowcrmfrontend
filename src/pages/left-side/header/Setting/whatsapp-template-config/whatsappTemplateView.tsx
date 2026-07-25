import { useEffect, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { useEscapeKey } from "../../../../../common/SharedFunction";

import { sendTemplateMessagePdf } from "../../../../../components/model/whatsapp_template_sender/WhatsappTemplateSenderController";
import WhatsappTemplateSenderPreviewModal from "../../../../../components/model/whatsapp_template_sender/WhatsappTemplateSenderPreviewModal";
import { useTheme } from "../../../../../components/ThemeContext";
import {
  fetchCompanyApi,
  ICompany,
} from "../../../list-company/ListCompanyController";
import { CompanyField, fetchCompanyTitleFields, fetchWhatsappTemplateConfig, IConfigList, removeWhatsappConfig } from './whatsappTemplateController';

interface IPropsWhatsappTemplate {
  isWhatsappTemplateView: boolean;
  closeWhatsappTemplateView: () => void;
}

const WhatsappTemplateView = ({
  isWhatsappTemplateView,
  closeWhatsappTemplateView,
}: IPropsWhatsappTemplate) => {
  const [configList, setConfigList] = useState<IConfigList[]>([]);

  const dropdownContactRef = useRef<Record<number, HTMLUListElement | null>>(
    {},
  );
  const sourceOfTypesRefDropdown = useRef<HTMLButtonElement>(null);
  const [loading, setLoading] = useState(false);

  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  const [customFeildName, setCustomFeildName] = useState<number>(0);
  console.log("customFeildNamecustomFeildNamecustomFeildName", customFeildName);

  const { darkMode } = useTheme();

  const [companyLists, setCompanyLists] = useState<ICompany[]>([]);
  const [noDataFound, setNoDataFound] = useState(false);
  const [companyJoinOrCreate, setCompanyJoinOrCreate] = useState();
  const [whatsappTemplateShowModal, setWhatsappTemplateShowModal] =
    useState<boolean>(false);
  const [isOrderShowNum, setIsOrderShowNum] = useState<string>("");
  const [dynamicName, setDynamicName] = useState<string>("");
  const [contextParamsKey, setContextParamsKey] = useState<string>("");
  const [companyTitleFields, setCompanyTitleFields] = useState<CompanyField[]>();
  const [refreshTemplates, setRefreshTemplates] = useState<boolean>(false);

  useEffect(() => {
    const fetchCompanyTittles = async () => {
      await fetchCompanyApi(
        setCompanyLists,
        "",
        setNoDataFound,
        setCompanyJoinOrCreate,
        setLoading,
      );
    };

    fetchCompanyTittles();
  }, [isWhatsappTemplateView]);

  useEscapeKey(closeWhatsappTemplateView);

  useEffect(() => {
    const fetchData = async () => {
      // if (canView) {
      await fetchWhatsappTemplateConfig(
        setConfigList,
        setLoading,
      );
      // } else {
      //     toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
      // }
    }
    fetchData();
  }, [isWhatsappTemplateView, refreshTemplates]);

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as Node;

    const isDropdownButton = (target as HTMLElement).closest(
      ".source-of-type-list-grid-options",
    );
    if (isDropdownButton) {
      return;
    }

    const isOutsideCategoryDropdown =
      !Object.values(dropdownContactRef.current).some(
        (ref) => ref && ref.contains(target),
      ) &&
      (!sourceOfTypesRefDropdown.current ||
        !sourceOfTypesRefDropdown.current.contains(target));

    if (isOutsideCategoryDropdown) {
      setOpenDropdownId(null);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener("keydown", handleEscKey);

    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, []);

  const handleRefreshConfigs = async () => {
    await fetchCompanyApi(
      setCompanyLists,
      "",
      setNoDataFound,
      setCompanyJoinOrCreate,
      setLoading,
    );
  };

  const handleSendTemplate = async (
    template: any,
    variables: any,
    receiverClue: any,
    quickFillVars: any,
  ) => {
    /*     console.log("Sending template:", template);
        console.log("With variables:", variables);
    
        // Here you would typically make an API call to send the WhatsApp message
        alert(
          `Template "${template.name}" ready to send with variables: ${JSON.stringify(variables)}`,
        );
        setWhatsappTemplateShowModal(false); */
    await sendTemplateMessagePdf(
      template,
      variables,
      setWhatsappTemplateShowModal,
      receiverClue,
      quickFillVars,
    );
  };

  const companyData = companyLists?.[0];

  useEffect(() => {
    fetchCompanyTitleFields(companyData, setIsOrderShowNum, setDynamicName, setContextParamsKey, setWhatsappTemplateShowModal, setCompanyTitleFields);
  }, []);

  const handleRemoveConfig = (module: string) => {
    removeWhatsappConfig(module);
    setOpenDropdownId(null);
    setRefreshTemplates(!refreshTemplates);
  }

  return (
    <>
      {isWhatsappTemplateView ? (
        <>
          <div
            className="notifications animate__animated animate__fadeInLeft"
            id="notifications"
          >
            <div className="header-Chat">
              <div className="ICON">
                <div
                  aria-disabled="false"
                  role="button"
                  className="icons"
                  data-tab="2"
                  title="Back"
                  aria-label="New chat"
                  onClick={closeWhatsappTemplateView}
                >
                  <span data-testid="chat" data-icon="chat" className="">
                    <svg
                      viewBox="0 0 24 24"
                      width="24"
                      height="24"
                      className=""
                    >
                      <path
                        fill="currentColor"
                        d="m12 4 1.4 1.4L7.8 11H20v2H7.8l5.6 5.6L12 20l-8-8 8-8z"
                      ></path>
                    </svg>
                  </span>
                </div>
              </div>
              <div className="newText">
                <h2>Whatsapp Template</h2>
              </div>
              {/* <div className="text-end mb-2">
                <div
                  className="ICON"
                  style={{
                    position: "absolute",
                    right: "20px",
                  }}
                >
                  <button
                    className="icons"
                    onClick={handleRefreshConfigs}
                    title="Refresh"
                  >
                    <svg width="30" height="30" viewBox="0 0 50 50">
                      <path
                        fill="currentColor"
                        d="M25 38c-7.2 0-13-5.8-13-13 0-3.2 1.2-6.2 3.3-8.6l1.5 1.3C15 19.7 14 22.3 14 25c0 6.1 4.9 11 11 11 1.6 0 3.1-.3 4.6-1l.8 1.8c-1.7.8-3.5 1.2-5.4 1.2z"
                      />
                      <path
                        fill="currentColor"
                        d="M34.7 33.7l-1.5-1.3c1.8-2 2.8-4.6 2.8-7.3 0-6.1-4.9-11-11-11-1.6 0-3.1.3-4.6 1l-.8-1.8c1.7-.8 3.5-1.2 5.4-1.2 7.2 0 13 5.8 13 13 0 3.1-1.2 6.2-3.3 8.6z"
                      />
                      <path fill="currentColor" d="M18 24h-2v-6h-6v-2h8z" />
                      <path fill="currentColor" d="M40 34h-8v-8h2v6h6z" />
                    </svg>
                  </button>
                </div>
              </div> */}
            </div>
            <div className="chats-notifications">
              <div
                className="block"
                style={{ paddingLeft: "15px", paddingRight: "15px" }}
              >
                <div className="h-text">
                  <div>
                    {loading ? (
                      Array.from({ length: 12 }).map((_, index) => (
                        <div className="chats h-100" key={index}>
                          <button className="block chat-list">
                            <div className="h-text ps-2">
                              <Skeleton
                                width="100%"
                                height={15}
                                duration={5}
                                style={{ opacity: darkMode ? "" : 0.8 }}
                              />
                              <Skeleton
                                width="100%"
                                height={15}
                                duration={5}
                                style={{ opacity: darkMode ? "" : 0.8 }}
                              />
                              <Skeleton
                                width="100%"
                                height={15}
                                duration={5}
                                style={{ opacity: darkMode ? "" : 0.8 }}
                              />
                              <Skeleton
                                width="100%"
                                height={15}
                                duration={5}
                                style={{ opacity: darkMode ? "" : 0.8 }}
                              />
                              <Skeleton
                                width="100%"
                                height={15}
                                duration={5}
                                style={{ opacity: darkMode ? "" : 0.8 }}
                              />
                            </div>
                          </button>
                        </div>
                      ))
                    ) : (
                      <>
                        <div
                          className="chats h-100"
                          style={{ paddingBottom: "100px" }}
                        >
                          {companyTitleFields ? (companyTitleFields.map((field) => (
                            <div
                              key={field.key}
                              className="block chat-list"
                              style={{ padding: "6px", background: "#fff" }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "flex-start",
                                  backgroundColor: "#fff",
                                  width: "100%",
                                }}
                              >
                                {/* LEFT SECTION */}
                                <div style={{ flex: 1 }}>
                                  <div className="d-flex">
                                    <div
                                      style={{
                                        paddingBottom: "2px",
                                        borderBottom: "unset",
                                      }}
                                    >
                                      <h4 className="inquiry-front">
                                        {field.type === "company"
                                          ? companyData?.[field.key] || field.label
                                          : field.label}
                                      </h4>
                                    </div>
                                  </div>
                                </div>

                                {companyData?.id === -1 ? (
                                  <span></span>
                                ) : (
                                  <>
                                    <button
                                      className="icon-more float-end"
                                      onClick={() => {
                                        setOpenDropdownId((prevId) => {
                                          if (prevId === field.id) {
                                            return null;
                                          }
                                          return field.id;
                                        });
                                      }}
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 19 20"
                                        width="19"
                                        height="20"
                                        className="animate__animated animate__fadeInUp"
                                        fill="#8696a0"
                                      >
                                        <path fill="#8696a0" d="M3.8 6.7l5.7 5.7 5.7-5.7 1.6 1.6-7.3 7.2-7.3-7.2 1.6-1.6z"></path>
                                      </svg>
                                    </button>
                                    <ul
                                      className={`price-list-option labelDropLeft ${openDropdownId === field.id ? "isVisible" : "isHidden"}`}
                                      id="dropLeft"
                                      ref={(el) => (dropdownContactRef.current[field.id] = el)}
                                      style={{ width: "160px", top: "-70px", right: "30px" }}
                                    >
                                      <li
                                        className="listItem"
                                        role="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setOpenDropdownId(null);
                                          field.action();
                                        }}
                                      >
                                        Edit Config
                                      </li>
                                      {(configList.find(c => c.module === field.module) ? true : false) && (
                                        <li
                                          className="listItem"
                                          role="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveConfig(field.module);
                                          }}
                                          style={{ color: "red", fontWeight: "600" }}
                                        >
                                          Remove Config
                                        </li>
                                      )}
                                    </ul>
                                  </>
                                )}
                              </div>
                            </div>
                          ))) : (
                            <p className="text-center pt-5">No Data Found</p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
      {whatsappTemplateShowModal && (
        <WhatsappTemplateSenderPreviewModal
          show={whatsappTemplateShowModal}
          onHide={() => setWhatsappTemplateShowModal(false)}
          onSend={handleSendTemplate}
          module={isOrderShowNum}
          displayModule={dynamicName}
          contextParams={/* { [contextParamsKey]: null } */ null} // Parameters needed for this context
          onSuccesDefautlSaveConfig={async () => {
            setRefreshTemplates(!refreshTemplates);
          }}
        />
      )}
    </>
  );
};

export default WhatsappTemplateView;
