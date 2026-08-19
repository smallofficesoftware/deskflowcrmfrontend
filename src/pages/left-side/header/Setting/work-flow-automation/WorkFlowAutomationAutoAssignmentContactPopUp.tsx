import { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { MultiValue, SingleValue } from "react-select";
import CustomSearchDropdown from "../../../../../components/CustomSearchDropdown";
import MultiSelect from "../../../../../components/MultiSelect";
import { IOption } from "../../../../../helpers/AppInterface";
import {
  addWorkFlowAutomationAutoContactAssignementDetail,
  deleteWorkFlowAutomationAutoContactAssignementDetail,
  fetchChainWiseTeamApi,
  getCountry,
  getSourceTypes,
  getState,
  getWorkFlowAutomationAutoContactAssignementDetail,
  ICountryList,
  IDataList,
  ISourceTypesList,
  IStateList,
  loadAreaOptionsv,
  loadCityOptionsv,
  TeamMember,
  updateWhatsappModual,
} from "./WorkFlowAutomationAutoAssignmentContactPopUpController";
import {
  fetchTemplate,
  sendTemplateMessagePdf,
} from "../../../../../components/model/whatsapp_template_sender/WhatsappTemplateSenderController";
import useWhatsappPlatformStore from "../../../../../store/whatsapp/useWhatsappPlateformFlagStore";
import WhatsappTemplateSenderPreviewModal from "../../../../../components/model/whatsapp_template_sender/WhatsappTemplateSenderPreviewModal";

interface IRequiredDetail {
  title: string;
}
interface IPropsWorkFlowAutomation {
  show: boolean;
  onHide: () => void;
  RequiredDetail: IRequiredDetail;
}

interface OptionType {
  value: string | number;
  label: string;
}

interface IReadMoreProps {
  text?: string; // '?' makes it optional in case data is null
  limit?: number; // Optional, defaults to 50
}

const ReadMore = ({ text, limit = 50 }: IReadMoreProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return <span>-</span>;
  if (text.length <= limit) {
    return <span>{text}</span>;
  }
  return (
    <span>
      {isExpanded ? text : text.substring(0, limit) + "..."}
      <span
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          color: "blue",
          cursor: "pointer",
          marginLeft: "5px",
          fontSize: "0.85em",
          fontWeight: "bold",
          whiteSpace: "nowrap",
        }}
      >
        {isExpanded ? " (Read Less)" : " Read More"}
      </span>
    </span>
  );
};
export interface ITemplateOptionList {
  value: string | number;
  label: string;
}

// Helper: compute per-row group metadata for source_type_id based rowSpan rendering
interface IGroupedRow {
  row: IDataList;
  index: number;
  isFirstInGroup: boolean;
  groupSize: number;
  groupHasWhatsappFlag: boolean;
}

const buildGroupedRows = (datalist: IDataList[]): IGroupedRow[] => {
  // Sort by source_type_id first so same-source rows are guaranteed adjacent,
  // regardless of the order the API returns them in. Without this, rowSpan math
  // breaks (columns shift/overlap) whenever two rows of the same source type
  // aren't already next to each other in the raw array.
  const sorted = [...datalist].sort(
    (a, b) => Number(a.source_type_id) - Number(b.source_type_id),
  );

  // First pass: count group sizes and whether any row in the group has the whatsapp flag,
  // keyed by source_type_id.
  const groupSizeMap = new Map<string, number>();
  const groupWhatsappFlagMap = new Map<string, boolean>();

  sorted.forEach((dl) => {
    const key = String(dl.source_type_id);
    groupSizeMap.set(key, (groupSizeMap.get(key) || 0) + 1);
    if (dl.is_whatsapp_email_send_flag === 1) {
      groupWhatsappFlagMap.set(key, true);
    }
  });

  const seen = new Set<string>();

  return sorted.map((dl, index) => {
    const key = String(dl.source_type_id);
    const isFirstInGroup = !seen.has(key);
    if (isFirstInGroup) {
      seen.add(key);
    }
    return {
      row: dl,
      index,
      isFirstInGroup,
      groupSize: groupSizeMap.get(key) || 1,
      groupHasWhatsappFlag: groupWhatsappFlagMap.get(key) || false,
    };
  });
};

const WorkFlowAutomationAutoAssignmentContactPopUp = ({
  show,
  onHide,
  RequiredDetail,
}: IPropsWorkFlowAutomation) => {
  const [sourceTypesList, setSourceTypesList] = useState<ISourceTypesList[]>(
    [],
  );
  const [whatsappTemplateShowModal, setWhatsappTemplateShowModal] =
    useState<boolean>(false);
  const [selectedSourceId, setSelectedSourceId] = useState<any>(false);
  const [sourceError, setSourceError] = useState("");

  const [countryList, setCountryList] = useState<ICountryList[]>([]);
  const [selectedCountryId, setSelectedCountryId] = useState<any>(false);

  const [stateList, setStateList] = useState<IStateList[]>([]);
  const [selectedStateId, setSelectedStateId] = useState<any>(false);

  const [selectedCityId, setSelectedCityId] =
    useState<SingleValue<IOption> | null>(null);
  const [selectedAreaId, setSelectedAreaId] =
    useState<SingleValue<IOption> | null>(null);

  const [teamLoading, setTeamLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<OptionType[]>([]);
  const initialAssignedIds = "";
  const [teamMemberList, setTeamMemberList] = useState<TeamMember[]>([]);

  const [datalist, setDataList] = useState<IDataList[]>([]);
  const [isDataRefresh, setIsDataRefresh] = useState(false);

  const [customText, setCustomText] = useState("");
  const [isAgreed, setIsAgreed] = useState(false);
  const [showExtraText, setShowExtraText] = useState(false);
  const [extraText, setExtraText] = useState("");
  const [templateUpdateFields, setTemplateUpdateFields] = useState<{
    sourceId: string;
  }>({ sourceId: "" });
  // const [templateOptionList, setTemplateOptionList] = useState
  //   ITemplateOptionList[]
  // >([]);
  // const [templateOptionSelected, setTemplateOptionSelected] = useState
  //   any | null
  // >(null);
  const { platformType } = useWhatsappPlatformStore();
  // const generateTemplateFromMeta = async () => {
  //   await fetchTemplate(null, null, setTemplateOptionList);
  // };
  // useEffect(() => {
  //   if (show) {
  //     generateTemplateFromMeta();
  //   }
  // }, [show]);
  useEffect(() => {
    if (!show) {
      setCustomText("");
      setIsAgreed(false);
      setShowExtraText(false);
      setExtraText("");
      setSelectedSourceId(false);
      setSourceError("");
      setSelectedCountryId(false);
      setSelectedStateId(false);
      setSelectedCityId(null);
      setSelectedAreaId(null);
      setSelectedUsers([]);
    }
  }, [show]);

  useEffect(() => {
    if (show) {
      getSourceTypes(setSourceTypesList);
      getCountry(setCountryList);
    }
  }, [show]);

  useEffect(() => {
    if (selectedCountryId?.value) {
      getState(selectedCountryId, setStateList);
    }
  }, [selectedCountryId]);

  const sourceOptions = sourceTypesList.map(
    (source_list: ISourceTypesList) => ({
      value: source_list.id,
      label: source_list.source_name,
    }),
  );

  const countryOption = countryList.map((country_list: ICountryList) => ({
    value: country_list.id,
    label: country_list.country_name,
  }));

  const stateOption = stateList.map((country_list: IStateList) => ({
    value: country_list.id,
    label: country_list.state_name,
  }));

  const handleSourceChange = (selectedOption: SingleValue<any>) => {
    setSelectedSourceId(selectedOption);
    setSourceError(selectedOption ? "" : "Source is required");
  };

  const handleCountryChange = (selectedOption: SingleValue<any>) => {
    setSelectedCountryId(selectedOption);
    if (!selectedOption) {
      setSelectedStateId("");
      setStateList([]);
      setSelectedCityId(null);
      setSelectedAreaId(null);
    }
  };

  const handleStateChange = (selectedOption: SingleValue<any>) => {
    setSelectedStateId(selectedOption);
    if (!selectedOption) {
      setSelectedCityId(null);
      setSelectedAreaId(null);
    }
  };

  const handleCityChange = (selectedOption: SingleValue<IOption>) => {
    setSelectedCityId(selectedOption);
    if (!selectedOption) {
      setSelectedAreaId(null);
    }
  };

  const handleAreaChange = (selectedOption: SingleValue<IOption>) => {
    setSelectedAreaId(selectedOption);
  };

  const loadCityOptions = async (inputValue: string): Promise<IOption[]> => {
    const result = await loadCityOptionsv(
      inputValue,
      selectedCountryId,
      selectedStateId,
    );
    return result || []; // Handle undefined case
  };

  const loadAreaOptions = async (inputValue: string): Promise<IOption[]> => {
    const result = await loadAreaOptionsv(
      inputValue,
      selectedCountryId,
      selectedStateId,
      selectedCityId,
    );
    return result || []; // Handle undefined case
  };

  const handelClickAddContactAssignmentContact = async () => {
    const selectedArray = selectedUsers as OptionType[];
    const data = selectedArray.map((item) => item.value);
    await addWorkFlowAutomationAutoContactAssignementDetail(
      {
        source_type_id: selectedSourceId?.value || "",
        country_id: selectedCountryId?.value || "",
        state_id: selectedStateId?.value || "",
        city_id: selectedCityId?.value || "",
        area_id: selectedAreaId?.value || "",
        team_person_ids: data,
        text_match_description: customText,
        auto_sequence_flag: isAgreed ? 1 : 2,
        is_whatsapp_email_send_flag: showExtraText ? 1 : 2,
        send_description: extraText,
      },
      setIsDataRefresh,
    );
  };

  const handelClickDeleteData = async (rowId: string | number) => {
    await deleteWorkFlowAutomationAutoContactAssignementDetail(
      rowId,
      setIsDataRefresh,
    );
  };

  useEffect(() => {
    if (show) {
      if (initialAssignedIds && teamMemberOptions.length > 0) {
        const ids = String(initialAssignedIds)
          .split(",")
          .map((id) => id.trim())
          .filter((id) => id);
        const initialSelected = teamMemberOptions.filter((opt) =>
          ids.includes(String(opt.value)),
        );
        setSelectedUsers(initialSelected);
      } else {
        setSelectedUsers([]);
      }
    }
  }, [show]);

  useEffect(() => {
    if (show) {
      fetchChainWiseTeamApi(setTeamLoading, setTeamMemberList);
      getWorkFlowAutomationAutoContactAssignementDetail(setDataList);
    }
  }, [show]);

  useEffect(() => {
    if (isDataRefresh) {
      getWorkFlowAutomationAutoContactAssignementDetail(setDataList);
    }
  }, [isDataRefresh]);

  const handleChangeTeam = async (selected: MultiValue<OptionType>) => {
    const selectedArray = selected as OptionType[];
    const data = selectedArray.map((item) => item.value);
    setSelectedUsers(selectedArray);
  };

  const teamMemberOptions: OptionType[] = teamMemberList
    .filter(
      (member) =>
        member.id && member.username && typeof member.username === "string",
    )
    .map((member) => ({
      value: member.id,
      label: member.username,
    }));

  const handelClickWhatsappTemplate = async () => {
    setWhatsappTemplateShowModal(true);
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

  const groupedRows = buildGroupedRows(datalist);

  return (
    <div>
      {show && (
        <div className="modal1 ">
          <div className="modal-content1">
            <div className="d-flex align-items-center justify-content-between">
              <div className="col-8">
                <h2 className="modal-title1 form_header_text">
                  {RequiredDetail?.title}
                </h2>
              </div>
              <div className="col-4">
                <span
                  className="close ms-3 pb-3"
                  onClick={onHide}
                  style={{ cursor: "pointer" }}
                >
                  ×
                </span>
              </div>
            </div>
            <hr />
            <div className="row">
              <div className="col-md-3 col-sm-12">
                <label htmlFor="">Source Type</label>
                <div className="w-100">
                  <CustomSearchDropdown
                    options={sourceOptions}
                    value={selectedSourceId}
                    onChange={handleSourceChange}
                    className="w-100"
                  />
                </div>
                {sourceError && (
                  <span className="text-danger">{sourceError}</span>
                )}
              </div>
              <div className="col-md-3 col-sm-12">
                <label htmlFor="">Country</label>
                <div className="w-100">
                  <CustomSearchDropdown
                    options={countryOption}
                    value={selectedCountryId}
                    onChange={handleCountryChange}
                    className="w-100"
                  />
                </div>
              </div>
              <div className="col-md-3 col-sm-12">
                <label htmlFor="">State</label>
                <div className="w-100">
                  <CustomSearchDropdown
                    options={stateOption}
                    value={selectedStateId}
                    onChange={handleStateChange}
                    className="w-100"
                  />
                </div>
              </div>
              <div className="col-md-3 col-sm-12">
                <label htmlFor="">City</label>
                <div className="w-100">
                  <CustomSearchDropdown
                    isAsync={true}
                    loadOptions={loadCityOptions}
                    value={selectedCityId}
                    onChange={handleCityChange}
                    className="w-100"
                    placeholder="search City..."
                  />
                </div>
              </div>
              <div className="col-md-3 col-sm-12">
                <label htmlFor="">Area</label>
                <div className="w-100">
                  <CustomSearchDropdown
                    isAsync={true}
                    loadOptions={loadAreaOptions}
                    value={selectedAreaId}
                    onChange={handleAreaChange}
                    className="w-100"
                    placeholder="search Area..."
                  />
                </div>
              </div>
              <div className="col-md-3 col-sm-12">
                <label htmlFor="">Team Person</label>
                <div className="w-100">
                  {teamLoading ? (
                    <Skeleton width="100%" height={42} />
                  ) : (
                    <MultiSelect
                      options={teamMemberOptions}
                      value={selectedUsers}
                      onChange={handleChangeTeam}
                      isSelectAll={true}
                      menuPlacement="bottom"
                      menuStyle={{
                        left: "90%",
                        right: "auto",
                        transform: "none",
                        height: "42px",
                      }}
                      isMulti
                      isClearable={selectedUsers.length > 0}
                      placeholder="Select team persons..."
                    />
                  )}
                </div>
              </div>
              <div className="col-md-3 col-sm-12">
                <label htmlFor="newTextBox">Text Match</label>
                <div className="w-100">
                  <textarea
                    className="form-control"
                    placeholder="Enter Text"
                    style={{ height: "45px", resize: "vertical" }}
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-3 col-sm-12">
                <label htmlFor="yesNoSwitch">Auto Sequence</label>
                <div
                  className="w-100 d-flex align-items-center"
                  style={{ height: "38px" }}
                >
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="yesNoSwitch"
                      style={{ cursor: "pointer" }}
                      checked={isAgreed}
                      onChange={(e) => setIsAgreed(e.target.checked)}
                    />
                    <label
                      className="form-check-label ms-2"
                      htmlFor="yesNoSwitch"
                      style={{ cursor: "pointer" }}
                    >
                      {isAgreed ? "Yes" : "No"}
                    </label>
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-sm-12">
                <label htmlFor="toggleSwitch">Is Whatsapp & Email Send</label>
                <div
                  className="w-100 d-flex align-items-center"
                  style={{ height: "38px" }}
                >
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="toggleSwitch"
                      style={{ cursor: "pointer" }}
                      checked={showExtraText}
                      onChange={(e) => {
                        setShowExtraText(e.target.checked);
                        if (!e.target.checked) setExtraText(""); // Optional: Clear text when hiding
                      }}
                    />
                    <label
                      className="form-check-label ms-2"
                      htmlFor="toggleSwitch"
                      style={{ cursor: "pointer" }}
                    >
                      {showExtraText ? "Yes" : "No"}
                    </label>
                  </div>
                </div>
              </div>
              {showExtraText && platformType == 1 && (
                <div className="col-md-6 col-sm-12">
                  <label htmlFor="extraTextArea">Message</label>
                  <div className="w-100">
                    <textarea
                      id="extraTextArea"
                      className="form-control"
                      placeholder="Enter Message"
                      style={{ height: "60px", resize: "vertical" }}
                      value={extraText}
                      onChange={(e) => setExtraText(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="col-md-3 col-sm-12">
                <button
                  className={"btn btn-primary mt-4"}
                  onClick={handelClickAddContactAssignmentContact}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
                    viewBox="0 -960 960 960"
                    width="24px"
                    fill="#fefefe"
                  >
                    <path d="M240-160q-33 0-56.5-23.5T160-240q0-33 23.5-56.5T240-320q33 0 56.5 23.5T320-240q0 33-23.5 56.5T240-160Zm0-240q-33 0-56.5-23.5T160-480q0-33 23.5-56.5T240-560q33 0 56.5 23.5T320-480q0 33-23.5 56.5T240-400Zm0-240q-33 0-56.5-23.5T160-720q0-33 23.5-56.5T240-800q33 0 56.5 23.5T320-720q0 33-23.5 56.5T240-640Zm240 0q-33 0-56.5-23.5T400-720q0-33 23.5-56.5T480-800q33 0 56.5 23.5T560-720q0 33-23.5 56.5T480-640Zm240 0q-33 0-56.5-23.5T640-720q0-33 23.5-56.5T720-800q33 0 56.5 23.5T800-720q0 33-23.5 56.5T720-640ZM480-400q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm40 240v-123l221-220q9-9 20-13t22-4q12 0 23 4.5t20 13.5l37 37q8 9 12.5 20t4.5 22q0 11-4 22.5T863-380L643-160H520Zm300-263-37-37 37 37ZM580-220h38l121-122-18-19-19-18-122 121v38Zm141-141-19-18 37 37-18-19Z" />
                  </svg>
                  Applied
                </button>
              </div>
            </div>
            <hr />
            <style>
              {`
                                .table-container {
                                max-height: 60vh; /* adjust scroll height */
                                overflow-y: auto;
                                border: 1px solid #ddd;
                                }

                                /* Make header fixed */
                                .table-container table {
                                border-collapse: collapse;
                                width: 100%;
                                }

                                .table-container thead th {
                                position: sticky;
                                top: 0;
                                background: #f4f4f4; /* header bg */
                                z-index: 0;
                                }

                                .table-container th,
                                .table-container td {
                                padding: 8px 12px;
                                border: 1px solid #ddd;
                                text-align: left;
                                }

                                /* Slight visual separation between source-type groups */
                                .table-container td.group-start {
                                border-top: 2px solid #999;
                                }
                                `}
            </style>
            <div className="table-container mb-1">
              <table className="table table-scroll">
                <thead>
                  <tr>
                    <th scope="col">Action</th>
                    <th scope="col">#</th>
                    <th scope="col">Source Type</th>
                    <th scope="col">Country</th>
                    <th scope="col">State</th>
                    <th scope="col">City</th>
                    <th scope="col">Area</th>
                    <th scope="col">Team Person</th>
                    <th scope="col">Text Match</th>
                    <th scope="col">Auto Sequence</th>
                    <th scope="col">Is Whatsapp & Email Send</th>
                    <th scope="col">Template Config</th>
                    <th scope="col">Message</th>
                    <th scope="col">Created At</th>
                  </tr>
                </thead>
                <tbody className="body-half-screen">
                  {groupedRows && groupedRows.length > 0 ? (
                    groupedRows.map(
                      ({
                        row: dl,
                        index: i,
                        isFirstInGroup,
                        groupSize,
                        groupHasWhatsappFlag,
                      }) => (
                        <tr key={dl.id}>
                          <td className={isFirstInGroup ? "group-start" : ""}>
                            <button
                              className="btn btn-danger"
                              onClick={() => handelClickDeleteData(dl.id)}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="24px"
                                viewBox="0 -960 960 960"
                                width="24px"
                                fill="#fefefe"
                              >
                                <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
                              </svg>
                            </button>
                          </td>
                          <td className={isFirstInGroup ? "group-start" : ""}>
                            {i + 1}
                          </td>

                          {/* Source Type - merged across the group */}
                          {isFirstInGroup && (
                            <td
                              className="group-start"
                              rowSpan={groupSize}
                              style={{ verticalAlign: "middle" }}
                            >
                              {dl.source_name}
                            </td>
                          )}

                          <td className={isFirstInGroup ? "group-start" : ""}>
                            {dl.country_name}
                          </td>
                          <td className={isFirstInGroup ? "group-start" : ""}>
                            {dl.state_name}
                          </td>
                          <td className={isFirstInGroup ? "group-start" : ""}>
                            {dl.city_name}
                          </td>
                          <td className={isFirstInGroup ? "group-start" : ""}>
                            {dl.area_name}
                          </td>
                          <td className={isFirstInGroup ? "group-start" : ""}>
                            {dl.team_person_name}
                          </td>
                          <td className={isFirstInGroup ? "group-start" : ""}>
                            {dl.text_match_description}
                          </td>

                          {/* Per-row Yes/No - unchanged */}
                          <td className={isFirstInGroup ? "group-start" : ""}>
                            {dl.auto_sequence_flag === 1 ? (
                              <span className="badge bg-success">Yes</span>
                            ) : (
                              <span className="badge bg-secondary">No</span>
                            )}
                          </td>

                          <td className={isFirstInGroup ? "group-start" : ""}>
                            {dl.is_whatsapp_email_send_flag === 1 ? (
                              <span className="badge bg-success">Yes</span>
                            ) : (
                              <span className="badge bg-secondary">No</span>
                            )}
                          </td>

                          {/* Template Config - merged across the group, own column */}
                          {isFirstInGroup && (
                            <td
                              className="group-start"
                              rowSpan={groupSize}
                              style={{ verticalAlign: "middle" }}
                            >
                              {groupHasWhatsappFlag && platformType == 2 ? (
                                <span
                                  style={{ cursor: "pointer" }}
                                  onClick={() => {
                                    setTemplateUpdateFields({
                                      sourceId: String(dl.source_type_id),
                                    });
                                    handelClickWhatsappTemplate();
                                  }}
                                  className="badge bg-success"
                                >
                                  Template Config
                                </span>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                          )}

                          <td className={isFirstInGroup ? "group-start" : ""}>
                            <ReadMore text={dl.send_description} limit={30} />
                          </td>
                          <td className={isFirstInGroup ? "group-start" : ""}>
                            {dl.created_at_formatted}
                          </td>
                        </tr>
                      ),
                    )
                  ) : (
                    <tr>
                      <td colSpan={14} className="text-center text-muted">
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {whatsappTemplateShowModal && (
              <WhatsappTemplateSenderPreviewModal
                show={whatsappTemplateShowModal}
                onHide={() => setWhatsappTemplateShowModal(false)}
                onSend={handleSendTemplate}
                module={`auto_contact_assignment_${templateUpdateFields.sourceId}`}
                displayModule={"Auto Contact Assignment"}
                contextParams={/* { [contextParamsKey]: null } */ null} // Parameters needed for this context
                onSuccesDefautlSaveConfig={async () =>
                  await updateWhatsappModual(
                    templateUpdateFields,
                    setTemplateUpdateFields,
                  )
                }
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkFlowAutomationAutoAssignmentContactPopUp;
