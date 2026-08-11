import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { openInNewTab } from "../../../common/SharedFunction";
import "../../../components/model/ConfirmationModal.css";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
  SMALL_TEXT_LENGTH,
} from "../../../helpers/AppConstants";
import { axiosInstance } from "../../../services/axiosInstance";
import { ICompanyTeam } from "./ListCompanyController";

interface ITeamRights {
  id: number;
  page_name: string;
  a_page_id_rights_jason: any;
  page_id: number;
  company_masters_id: number;
  modual_name: string;
}

type PermissionKeys =
  | "view"
  | "add"
  | "edit"
  | "delete"
  | "approve"
  | "import"
  | "print"
  | "share"
  | "all_data"
  | "personal";

const parseRights = (raw: any) => {
  if (!raw) {
    return {
      view: 0,
      add: 0,
      edit: 0,
      delete: 0,
      approve: 0,
      import: 0,
      print: 0,
      share: 0,
      all_data: 0,
      personal: 0,
    };
  }
  let parsed = raw;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
      if (typeof parsed === "string") {
        parsed = JSON.parse(parsed);
      }
    } catch {
      return {
        view: 0,
        add: 0,
        edit: 0,
        delete: 0,
        approve: 0,
        import: 0,
        print: 0,
        share: 0,
        all_data: 0,
        personal: 0,
      };
    }
  }
  return typeof parsed === "object" && parsed !== null
    ? parsed
    : {
        view: 0,
        add: 0,
        edit: 0,
        delete: 0,
        approve: 0,
        import: 0,
        print: 0,
        share: 0,
        all_data: 0,
        personal: 0,
      };
};

const TeamRightsView = ({
  show,
  onHide,
  companyTeamInfo,
}: {
  show: boolean;
  onHide: () => void;
  companyTeamInfo: ICompanyTeam | undefined;
}) => {
  const [teamRightList, setTeamRightList] = useState<ITeamRights[]>([]);
  const [updatedPermissions, setUpdatedPermissions] = useState<{
    [key: number]: any;
  }>({});
  const [searchTerm, setSearchTerm] = useState<string>("");

  const fetchApiTeamRight = async () => {
    const getUUID = await localStorage.getItem("UUID");
    const token = await localStorage.getItem("token");
    const requestData = {
      a_application_login_id: companyTeamInfo?.id,
    };
    try {
      const data = await axiosInstance.post("getTeamRights", requestData, {
        headers: {
          Authorization: `${token}`,
        },
      });
      if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        setTeamRightList([]);
      }
      setTeamRightList(data.data.data.item);
    } catch (error: any) {
      toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };


  useEffect(() => {
    fetchApiTeamRight();
  }, [show]);

  const handleToggle = (
    id: number,
    field: PermissionKeys | "all",
    modual_name: string
  ) => {
    setUpdatedPermissions((prevPermissions) => {
      const prevRights =
        prevPermissions[id] ||
        (teamRightList.find((item) => item.id === id)?.a_page_id_rights_jason
          ? parseRights(
            teamRightList.find((item) => item.id === id)!.a_page_id_rights_jason
          )
          : {
            view: 0,
            add: 0,
            edit: 0,
            delete: 0,
            approve: 0,
            import: 0,
            print: 0,
            share: 0,
            all_data: 0,
            personal: 0,
          });

      let newRights = { ...prevRights };

      if (field === "all") {
        const allToggled = !isRowFullyToggled(id);
        newRights = {
          ...newRights,
          view: allToggled ? 1 : 0,
          add: allToggled ? 1 : 0,
          edit: allToggled ? 1 : 0,
          delete: allToggled ? 1 : 0,
          approve: allToggled ? 1 : 0,
          import: allToggled ? 1 : 0,
          print: allToggled ? 1 : 0,
          share: allToggled ? 1 : 0,
          all_data: allToggled ? 1 : 0,
          personal: allToggled ? 0 : 0,   // ← usually keep personal off when "all" is used
        };
      } else {
        // Normal single field toggle
        newRights[field] = prevRights[field] === 1 ? 0 : 1;

        // ────────────────────────────────────────────────
        //     MUTUALLY EXCLUSIVE LOGIC: all_data ↔ personal
        // ────────────────────────────────────────────────
        if (field === "all_data" && newRights.all_data === 1) {
          newRights.personal = 0;
        }
        if (field === "personal" && newRights.personal === 1) {
          newRights.all_data = 0;
        }
        // ────────────────────────────────────────────────
      }

      return {
        ...prevPermissions,
        [id]: newRights,
      };
    });
  };

  // Updated function to handle toggling all rows for a specific permission
  const handleToggleAll = (field: PermissionKeys) => {
    setUpdatedPermissions((prevPermissions) => {
      const newPermissions = { ...prevPermissions };

      const anyOff = teamRightList.some((item) => {
        const rights =
          prevPermissions[item.id] ||
          (item.a_page_id_rights_jason
            ? parseRights(item.a_page_id_rights_jason)
            : {
              view: 0,
              add: 0,
              edit: 0,
              delete: 0,
              approve: 0,
              import: 0,
              print: 0,
              share: 0,
              all_data: 0,
              personal: 0,
            });
        return rights[field] !== 1;
      });

      const newValue = anyOff ? 1 : 0;

      teamRightList.forEach((item) => {
        const prevRights =
          prevPermissions[item.id] ||
          (item.a_page_id_rights_jason
            ? parseRights(item.a_page_id_rights_jason)
            : {
              view: 0,
              add: 0,
              edit: 0,
              delete: 0,
              approve: 0,
              import: 0,
              print: 0,
              share: 0,
              all_data: 0,
              personal: 0,
            });

        let updatedRow = {
          ...prevRights,
          [field]: newValue,
        };

        // Enforce mutual exclusivity when bulk toggling
        if (field === "all_data" && newValue === 1) {
          updatedRow.personal = 0;
        }
        if (field === "personal" && newValue === 1) {
          updatedRow.all_data = 0;
        }

        newPermissions[item.id] = updatedRow;
      });

      return newPermissions;
    });
  };

  // Helper function to check if all permissions in a row are toggled
  const isRowFullyToggled = (id: number) => {
    const rights =
      updatedPermissions[id] ||
      (teamRightList.find((item) => item.id === id)?.a_page_id_rights_jason
        ? parseRights(
          teamRightList.find((item) => item.id === id)!.a_page_id_rights_jason
        )
        : {
          view: 0,
          add: 0,
          edit: 0,
          delete: 0,
          approve: 0,
          import: 0,
          print: 0,
          share: 0,
          all_data: 0,
          personal: 0,
        });

    return (
      rights.view === 1 &&
      rights.add === 1 &&
      rights.edit === 1 &&
      rights.delete === 1 &&
      rights.approve === 1 &&
      rights.import === 1 &&
      rights.print === 1 &&
      rights.share === 1 &&
      rights.all_data === 1 &&
      rights.personal === 1
    );
  };

  // Updated function to check if all rows have a specific permission toggled
  const isPermissionFullyToggled = (field: PermissionKeys) => {
    return teamRightList.every((item) => {
      const rights =
        updatedPermissions[item.id] ||
        (item.a_page_id_rights_jason
          ? parseRights(item.a_page_id_rights_jason)
          : {
            view: 0,
            add: 0,
            edit: 0,
            delete: 0,
            approve: 0,
            import: 0,
            print: 0,
            share: 0,
            all_data: 0,
            personal: 0,
          });
      return rights[field] === 1;
    });
  };

  const handleSave = async () => {
    const token = await localStorage.getItem("token");
    const finalData = teamRightList.map((item) => {
      const existingRights = item.a_page_id_rights_jason
        ? parseRights(item.a_page_id_rights_jason)
        : {
          view: 0,
          add: 0,
          edit: 0,
          delete: 0,
          approve: 0,
          import: 0,
          print: 0,
          share: 0,
          all_data: 0,
          personal: 0,
        };

      const mergedPermissions = updatedPermissions[item.id] || existingRights;

      return {
        page_id: item.page_id ? item.page_id : item.id,
        modual_name: item.modual_name,
        a_page_id_rights_jason: mergedPermissions,
      };
    });

    const requestData = {
      permissionsData: finalData,
      a_application_login_id: companyTeamInfo?.id,
    };
    // return
    try {
      const response = await axiosInstance.post(
        "createAppLoginRights",
        requestData,
        {
          headers: {
            Authorization: `${token}`,
          },
        }
      );
      if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        toast.success(response.data.ack_msg);
        onHide();
      } else {
        toast.error(response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } catch (error: any) {
      toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  };

  const handleClose = () => {
    onHide();
    setUpdatedPermissions({});
  };

  const filteredTeamRightList = teamRightList.filter((item) =>
    item.modual_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  return (
    <React.Fragment>
      {show && (
        <div className="modal1">
          <div
            className="modal-content1"
            style={{
              maxHeight: "90%",
              maxWidth: "100%",
              width: "85vw",
              height: "90vh",
            }}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div className="col-8">
                <h2 className="modal-title1 form_header_text">
                  You are Granted the Rights of a: {companyTeamInfo?.username}
                </h2>
              </div>
              <div className="col-4 d-flex justify-content-end align-items-center gap-3">

                <p
                  className="landing-page-text text-end"
                  style={{ cursor: "pointer", color: "blue", fontSize: "13px" }}
                  onClick={() => openInNewTab("/videoTutorial", 26)}
                >
                  Learn More :
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
                <span
                  className="close ms-3 pb-3"
                  onClick={onHide}
                  style={{ cursor: "pointer" }}
                >
                  &times;
                </span>
              </div>
            </div>
            <div className="m-title-2 col-12">
              <div className="head">
                <div className="source-of-type-list-grid-block">
                  <div
                    className="source-of-type-list-grid-main table-responsive"
                    style={{ maxHeight: "62vh", overflowX: "scroll" }}
                  >
                    <table className="table table-hover" border={0}>
                      <thead
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 1000,
                          backgroundColor: "white",
                        }}
                      >
                        <tr>
                          <th className=""></th>
                          <th className="text-start">

                            <div className="search-bar">
                              <div>
                                {/* <button className="search">
                                  <span className="">
                                    <svg
                                      viewBox="0 0 24 24"
                                      width="24"
                                      height="24"
                                      className=""
                                    >
                                      <path
                                        fill="currentColor"
                                        d="M15.009 13.805h-.636l-.22-.219a5.184 5.184 0 0 0 1.256-3.386 5.207 5.207 0 1 0-5.207 5.208 5.183 5.183 0 0 0 3.385-1.255l.221.22v.635l4.004 3.999 1.194-1.195-3.997-4.007zm-4.808 0a3.605 3.605 0 1 1 0-7.21 3.605 3.605 0 0 1 0 7.21z"
                                      ></path>
                                    </svg>
                                  </span>
                                </button> */}

                                {/* <span className="go-back">
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
                                </span> */}

                                <input
                                  type="text"
                                  title="Search or start new chat"
                                  aria-label="Search or start new chat"
                                  placeholder="Search Module"
                                  maxLength={SMALL_TEXT_LENGTH}
                                  value={searchTerm}
                                  onChange={handleSearchChange}
                                />
                              </div>
                            </div>
                          </th>
                          <th className="text-center"></th>
                          <th className="text-center">
                            All View
                            <div className="form-check form-switch d-flex justify-content-center align-items-center">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                role="switch"
                                id="selectAllViewSwitch"
                                checked={isPermissionFullyToggled("view")}
                                onChange={() => handleToggleAll("view")}
                              />
                            </div>
                          </th>
                          <th className="text-center">
                            All Add
                            <div className="form-check form-switch d-flex justify-content-center align-items-center">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                role="switch"
                                id="selectAllAddSwitch"
                                checked={isPermissionFullyToggled("add")}
                                onChange={() => handleToggleAll("add")}
                              />
                            </div>
                          </th>
                          <th className="text-center">
                            All Edit
                            <div className="form-check form-switch d-flex justify-content-center align-items-center">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                role="switch"
                                id="selectAllEditSwitch"
                                checked={isPermissionFullyToggled("edit")}
                                onChange={() => handleToggleAll("edit")}
                              />
                            </div>
                          </th>
                          <th className="text-center">
                            All Delete
                            <div className="form-check form-switch d-flex justify-content-center align-items-center">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                role="switch"
                                id="selectAllDeleteSwitch"
                                checked={isPermissionFullyToggled("delete")}
                                onChange={() => handleToggleAll("delete")}
                              />
                            </div>
                          </th>
                          <th className="text-center">
                            All Approve
                            <div className="form-check form-switch d-flex justify-content-center align-items-center">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                role="switch"
                                id="selectAllApproveSwitch"
                                checked={isPermissionFullyToggled("approve")}
                                onChange={() => handleToggleAll("approve")}
                              />
                            </div>
                          </th>
                          <th className="text-center">
                            All Import
                            <div className="form-check form-switch d-flex justify-content-center align-items-center">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                role="switch"
                                id="selectAllImportSwitch"
                                checked={isPermissionFullyToggled("import")}
                                onChange={() => handleToggleAll("import")}
                              />
                            </div>
                          </th>
                          <th className="text-center">
                            All Print
                            <div className="form-check form-switch d-flex justify-content-center align-items-center">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                role="switch"
                                id="selectAllPrintSwitch"
                                checked={isPermissionFullyToggled("print")}
                                onChange={() => handleToggleAll("print")}
                              />
                            </div>
                          </th>
                          <th className="text-center">
                            All Share
                            <div className="form-check form-switch d-flex justify-content-center align-items-center">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                role="switch"
                                id="selectAllShareSwitch"
                                checked={isPermissionFullyToggled("share")}
                                onChange={() => handleToggleAll("share")}
                              />
                            </div>
                          </th>
                          <th className="text-center">
                            All Data
                            <div className="form-check form-switch d-flex justify-content-center align-items-center">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                role="switch"
                                id="selectAllDataSwitch"
                                checked={isPermissionFullyToggled("all_data")}
                                onChange={() => handleToggleAll("all_data")}
                              />
                            </div>
                          </th>
                          <th className="text-center">
                            Personal Data
                            <div className="form-check form-switch d-flex justify-content-center align-items-center">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                role="switch"
                                id="selectAllPersonalSwitch"
                                checked={isPermissionFullyToggled("personal")}
                                onChange={() => handleToggleAll("personal")}
                              />
                            </div>
                          </th>
                          <th className="text-center"></th>
                        </tr>
                        <tr>
                          <th className="">No.</th>
                          <th className="text-start">Module Name</th>
                          <th className="text-center">Select All</th>
                          <th className="text-center">View</th>
                          <th className="text-center">Add</th>
                          <th className="text-center">Edit</th>
                          <th className="text-center">Delete</th>
                          <th className="text-center">Approve</th>
                          <th className="text-center">Import</th>
                          <th className="text-center">Print</th>
                          <th className="text-center">Share</th>
                          <th className="text-center">Data</th>
                          <th className="text-center">Personal</th>
                          <th className="text-center">Limit</th>
                        </tr>
                      </thead>
                      <tbody className="text-center">
                        {filteredTeamRightList.length > 0 ? (
                          filteredTeamRightList.map((item, index) => {
                            const rights = item.a_page_id_rights_jason
                              ? parseRights(item.a_page_id_rights_jason)
                              : {
                                view: 0,
                                add: 0,
                                edit: 0,
                                delete: 0,
                                approve: 0,
                                import: 0,
                                print: 0,
                                share: 0,
                                all_data: 0,
                                personal: 0,
                              };
                            const updatedRights =
                              updatedPermissions[item.id] || rights;
                            return (
                              <tr key={item.id} className="">
                                <td>{index + 1}</td>
                                <td className="text-start">{item.modual_name}</td>
                                <td className="text-center">
                                  <div className="form-check form-switch d-flex justify-content-center align-items-center">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      role="switch"
                                      id={`selectAllSwitch-${item.id}`}
                                      checked={isRowFullyToggled(item.id)}
                                      onChange={() =>
                                        handleToggle(
                                          item.id,
                                          "all",
                                          item.modual_name
                                        )
                                      }
                                    />
                                  </div>
                                </td>
                                <td className="text-center">
                                  <div className="form-check form-switch d-flex justify-content-center align-items-center">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      role="switch"
                                      id={`viewSwitch-${item.id}`}
                                      checked={updatedRights.view === 1}
                                      onChange={() =>
                                        handleToggle(
                                          item.id,
                                          "view",
                                          item.modual_name
                                        )
                                      }
                                    />
                                  </div>
                                </td>
                                <td className="text-center">
                                  <div className="form-check form-switch d-flex justify-content-center align-items-center">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      role="switch"
                                      id={`addSwitch-${item.id}`}
                                      checked={updatedRights.add === 1}
                                      onChange={() =>
                                        handleToggle(
                                          item.id,
                                          "add",
                                          item.modual_name
                                        )
                                      }
                                    />
                                  </div>
                                </td>
                                <td className="text-center">
                                  <div className="form-check form-switch d-flex justify-content-center align-items-center">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      role="switch"
                                      id={`editSwitch-${item.id}`}
                                      checked={updatedRights.edit === 1}
                                      onChange={() =>
                                        handleToggle(
                                          item.id,
                                          "edit",
                                          item.modual_name
                                        )
                                      }
                                    />
                                  </div>
                                </td>
                                <td className="text-center">
                                  <div className="form-check form-switch d-flex justify-content-center align-items-center">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      role="switch"
                                      id={`deleteSwitch-${item.id}`}
                                      checked={updatedRights.delete === 1}
                                      onChange={() =>
                                        handleToggle(
                                          item.id,
                                          "delete",
                                          item.modual_name
                                        )
                                      }
                                    />
                                  </div>
                                </td>
                                <td className="text-center">
                                  <div className="form-check form-switch d-flex justify-content-center align-items-center">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      role="switch"
                                      id={`approveSwitch-${item.id}`}
                                      checked={updatedRights.approve === 1}
                                      onChange={() =>
                                        handleToggle(
                                          item.id,
                                          "approve",
                                          item.modual_name
                                        )
                                      }
                                    />
                                  </div>
                                </td>
                                <td className="text-center">
                                  <div className="form-check form-switch d-flex justify-content-center align-items-center">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      role="switch"
                                      id={`importSwitch-${item.id}`}
                                      checked={updatedRights.import === 1}
                                      onChange={() =>
                                        handleToggle(
                                          item.id,
                                          "import",
                                          item.modual_name
                                        )
                                      }
                                    />
                                  </div>
                                </td>
                                <td className="text-center">
                                  <div className="form-check form-switch d-flex justify-content-center align-items-center">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      role="switch"
                                      id={`printSwitch-${item.id}`}
                                      checked={updatedRights.print === 1}
                                      onChange={() =>
                                        handleToggle(
                                          item.id,
                                          "print",
                                          item.modual_name
                                        )
                                      }
                                    />
                                  </div>
                                </td>
                                <td className="text-center">
                                  <div className="form-check form-switch d-flex justify-content-center align-items-center">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      role="switch"
                                      id={`shareSwitch-${item.id}`}
                                      checked={updatedRights.share === 1}
                                      onChange={() =>
                                        handleToggle(
                                          item.id,
                                          "share",
                                          item.modual_name
                                        )
                                      }
                                    />
                                  </div>
                                </td>
                                <td className="text-center">
                                  <div className="form-check form-switch d-flex justify-content-center align-items-center">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      role="switch"
                                      id={`allDataSwitch-${item.id}`}
                                      checked={updatedRights.all_data === 1}
                                      onChange={() =>
                                        handleToggle(
                                          item.id,
                                          "all_data",
                                          item.modual_name
                                        )
                                      }
                                    />
                                  </div>
                                </td>
                                <td className="text-center">
                                  <div className="form-check form-switch d-flex justify-content-center align-items-center">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      role="switch"
                                      id={`personalSwitch-${item.id}`}
                                      checked={updatedRights.personal === 1}
                                      onChange={() =>
                                        handleToggle(
                                          item.id,
                                          "personal",
                                          item.modual_name
                                        )
                                      }
                                    />
                                  </div>
                                </td>
                                <td
                                  className="text-center"
                                  style={{ width: "8vw" }}
                                >
                                  <div className="search-bar">
                                    <div className="add-source-of-type-section">
                                      <input
                                        type="text"
                                        title="Limit"
                                        placeholder="Limit"
                                        value={rights.limit || "Unlimited"}
                                        readOnly
                                        style={{
                                          backgroundColor: "#f0f2f5",
                                          textAlign: "end",
                                        }}
                                      />
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={14} className="text-center">
                              No modules found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-buttons">
              <button className="modal-button1" onClick={handleClose}>
                Close
              </button>
              <button className="modal-button2" onClick={handleSave}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

export default TeamRightsView;