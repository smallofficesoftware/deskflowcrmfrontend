import { useEffect, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import ConfirmationModal from "../../../../../components/model/ConfirmationModal";
import { useTheme } from "../../../../../components/ThemeContext";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import AddWorkStationView from "./AddWorkStationView";
import {
  fetchMachineApi,
  handleDeleteMachine,
  IMachineView,
} from "./Machine-managementController";

interface IPropsmachineView {
  isMachineView: boolean;
  closeMachineView: () => void;
}
const MachineManagement = ({
  isMachineView,
  closeMachineView,
}: IPropsmachineView) => {
  const [machineLists, setMachineList] = useState<IMachineView[]>([]);
  // const [machineManagementInput, setMachineManagementInput] = useState("");
  // const [machineHexColorInput, setmachineHexColorInput] = useState("#353434fd");
  const [loading, setLoading] = useState(false);
  const { darkMode, toggleTheme } = useTheme();
  // const machineRefDropdown = useRef<HTMLButtonElement>(null);
  const dropdownContactRef = useRef<Record<number, HTMLUListElement | null>>(
    {},
  );
  const [machineDropdown, setmachineDropdown] = useState<any>(null);
  const [hasIdAvail, setHasIdAvail] = useState<number>();
  const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
  // const [isEditing, setIsEditing] = useState<boolean>(false);
  // const [editmachineId, setEditmachineId] = useState<number | undefined>(
  //   undefined,
  // );

  const [isCreateModel, setIsCreateModel] = useState<boolean>(false);
  const [isUpdateModel, setIsUpdateModel] = useState<boolean>(false);
  const [editableProduct, setEditableProduct] = useState<IMachineView>({
    machine_name: "",
    id: 0,
    color: "",
    created_date_time: "",
  });

  // State for validation messages
  // const [machineError, setmachineError] = useState("");

  useEscapeKey(closeMachineView);

  const canView = useCheckUserPermission(
    PAGE_ID.MACHINE_MANAGEMENTS,
    PERMISSION_TYPE.VIEW,
  );
  const canAdd = useCheckUserPermission(
    PAGE_ID.MACHINE_MANAGEMENTS,
    PERMISSION_TYPE.ADD,
  );

  const canEdit = useCheckUserPermission(
    PAGE_ID.MACHINE_MANAGEMENTS,
    PERMISSION_TYPE.EDIT,
  );
  const canDelete = useCheckUserPermission(
    PAGE_ID.MACHINE_MANAGEMENTS,
    PERMISSION_TYPE.DELETE,
  );

  // const handelChange = (event: TOnChangeInput) => {
  //   const value = event.target.value;
  //   setMachineManagementInput(value);
  //   setmachineError(value ? "" : "Work Station name is required");
  // };
  // const handelChangeHexColor = (event: TOnChangeInput) => {
  //   setmachineHexColorInput(event.target.value);
  // };
  // const clearForm = () => {
  //   setMachineManagementInput("");
  //   setmachineHexColorInput("#eeeeee");
  //   setIsEditing(false);
  //   setEditmachineId(undefined);
  // };
  // const handelSubmit = () => {
  //   if (machineManagementInput.trim() === "") {
  //     setmachineError("Work Station name is required");
  //     return;
  //   }

  //   setmachineError("");

  //   if (machineManagementInput) {
  //     if (isEditing && editmachineId !== null) {
  //       updatemachine(
  //         {
  //           machine_name: machineManagementInput,
  //           color: machineHexColorInput,
  //         },
  //         editmachineId,
  //         setLoading,
  //         clearForm,
  //       );
  //     } else {
  //       if (!canAdd) {
  //         toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
  //         return;
  //       }
  //       createMachineManagement(
  //         {
  //           machine_name: machineManagementInput,
  //           color: machineHexColorInput,
  //         },
  //         setLoading,
  //         clearForm,
  //       );
  //     }
  //   }
  // };
  const toggleDropdownmachine = (machineId: number | undefined) => {
    const checkedId = machineLists.find((abv) => abv.id === machineId);
    if (checkedId) {
      setHasIdAvail((prev) =>
        prev === checkedId.id ? undefined : checkedId.id,
      );
    }
    setmachineDropdown(!machineDropdown);
  };
  const handleClickOutside = (event: { target: any }) => {
    const clickedOutside = Object.values(dropdownContactRef.current).every(
      (ref) => ref && !ref.contains(event.target),
    );
    if (clickedOutside) {
      setmachineDropdown(null);
    }
  };

  useEffect(() => {
    if (machineDropdown !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [machineDropdown]);
  useEffect(() => {
    if (canView) {
      if (isMachineView) {
        fetchMachineApi(setMachineList, setLoading);
      }
    }
  }, [isMachineView, canView]);
  const handleEdit = (item: IMachineView) => {
    setmachineDropdown(null);

    if (canEdit) {
      // setMachineManagementInput(item.machine_name);
      // setmachineHexColorInput(item.color || "#eeeeee");
      // setIsEditing(true);
      // setEditmachineId(item.id);
      // setmachineError("");
      setEditableProduct(item);
      setIsUpdateModel(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handelRefreshmachine = async () => {
    if (canView) {
      await fetchMachineApi(setMachineList, setLoading);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  function openDeleteModel() {
    setmachineDropdown(null);

    if (canDelete) {
      setIsDeleteConfirmation(true);
    } else {
      setIsDeleteConfirmation(false);

      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  }

  const openAddWorkStationView = () => {
    if (canAdd) {
      setIsCreateModel(true);
    } else {
      setIsCreateModel(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  return (
    <>
      {isMachineView ? (
        <div
          className="notifications animate__animated animate__fadeInLeft"
          id="notifications"
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
                title="Back"
                aria-label="New chat"
                onClick={closeMachineView}
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
              <h2>Work Station</h2>
            </div>
            <div className=" text-end mb-2">
              <div
                className="ICON"
                style={{
                  position: "absolute",
                  right: "60px",
                }}
              >
                <button
                  className="icons"
                  onClick={openAddWorkStationView}
                  title="Add Work Station"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="30px"
                    viewBox="0 -960 960 960"
                    width="30px"
                    fill="#fff"
                  >
                    <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                  </svg>
                </button>
              </div>
              <div
                className="ICON"
                style={{
                  position: "absolute",
                  right: "20px",
                }}
              >
                <button
                  className="icons"
                  onClick={handelRefreshmachine}
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
            </div>
          </div>

          {/* <!-- Chats --> */}
          <div className="chats-notifications">
            {/* <!-- Chats 1 --> */}
            <div className="block">
              {/* <!-- Text --> */}
              <div className="h-text">
                {/* <div className="head" style={{ display: "block" }}>
                  <label
                    className="form-check-label"
                    htmlFor="flexCheckDefault"
                  >
                    <h4>
                      Enter Work Station Name
                      <span className="text-danger">*</span>
                    </h4>
                  </label>
                  <div className="col-12 d-flex">
                    <div className="col-10">
                      <div className="search-bar ">
                        <div className="add-source-of-type-section ">
                          <input
                            type="text"
                            title="Work Station"
                            placeholder="Add Work Station"
                            value={machineManagementInput}
                            maxLength={BIG_TEXT_LENGTH}
                            onChange={(e) => handelChange(e)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="col-2 d-flex justify-content-end align-items-center mx-1">
                      <input
                        type="color"
                        value={machineHexColorInput}
                        className="   mx-1"
                        onChange={(e) => handelChangeHexColor(e)}
                      />
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
                  </div>
                  <div className="col-12">
                    {machineError && (
                      <span className="text-danger">{machineError}</span>
                    )}
                  </div>
                </div> */}
                {canView ? (
                  <div>
                    {loading ? (
                      Array.from({ length: 12 }).map((_, index) => (
                        <div
                          className="source-of-type-list-grid-main"
                          key={index}
                        >
                          <div className="source-of-type-list-grid-list">
                            <div
                              style={{
                                display: "inline-block",
                                marginLeft: "8px",
                              }}
                            >
                              <Skeleton
                                width="100px"
                                height="25px"
                                duration={5}
                                borderRadius={50}
                                style={{ opacity: darkMode ? "" : 0.8 }}
                              />
                            </div>
                          </div>
                        </div>
                        // </div>
                      ))
                    ) : (
                      <>
                        <div className="source-of-type-list-grid-block">
                          <div className="source-of-type-list-grid-main">
                            <p
                              className={`${
                                machineLists.length > 0
                                  ? ""
                                  : " text-center pt-5"
                              }`}
                            >
                              {machineLists.length > 0 ? "" : "No Data Found"}
                            </p>

                            {machineLists &&
                              machineLists.map((item, index) => (
                                <div
                                  key={index}
                                  className="source-of-type-list-grid-list"
                                >
                                  <span
                                    style={{
                                      backgroundColor: item.color
                                        ? item.color
                                        : "#eeeeee",
                                    }}
                                    className="badge rounded-pill"
                                  >
                                    {item.machine_name}
                                  </span>
                                  {item.id === -1 ? (
                                    <span></span>
                                  ) : (
                                    <>
                                      <button
                                        className="source-of-type-list-grid-options"
                                        id="source-of-types-options-id"
                                        onClick={() =>
                                          toggleDropdownmachine(item.id)
                                        }
                                      >
                                        <span>
                                          <svg
                                            viewBox="0 0 24 24"
                                            width="24"
                                            height="24"
                                          >
                                            <path
                                              fill="currentColor"
                                              d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z"
                                            ></path>
                                          </svg>
                                        </span>
                                      </button>
                                      <ul
                                        className={`source-of-types-options ${
                                          hasIdAvail === item.id &&
                                          machineDropdown
                                            ? "isVisible"
                                            : "isHidden"
                                        } `}
                                        id="dropLeft"
                                        ref={(el) =>
                                          (dropdownContactRef.current[item.id] =
                                            el)
                                        }
                                        style={{
                                          width: "120px",
                                          marginLeft: "60%",
                                        }}
                                      >
                                        <li
                                          className="listItem"
                                          role="button"
                                          onClick={() => handleEdit(item)}
                                        >
                                          Edit
                                        </li>
                                        <li
                                          style={{
                                            color: "red",
                                            fontWeight: "600",
                                          }}
                                          className="listItem"
                                          role="button"
                                          onClick={openDeleteModel}
                                        >
                                          Delete
                                        </li>
                                      </ul>
                                    </>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-danger p-1">
                    {DEFAULT_MESSAGE_ERROR_PERMISSION}
                  </p>
                )}
              </div>
            </div>
          </div>

          {isDeleteConfirmation && (
            <ConfirmationModal
              show={isDeleteConfirmation}
              onHide={() => setIsDeleteConfirmation(false)}
              handleSubmit={() =>
                handleDeleteMachine(
                  hasIdAvail,
                  setIsDeleteConfirmation,
                  setMachineList,
                  setLoading,
                )
              }
              title={"Delete this Machine"}
              message={"Are You Sure You Want To Delete This Machine?"}
              btn1="CANCEL"
              btn2="DELETE"
            />
          )}
        </div>
      ) : null}
      {isCreateModel && (
        <AddWorkStationView
          show={isCreateModel}
          onHide={() => {
            setIsCreateModel(false);
            // setSearchTermFromRightSide("");
          }}
          setLoading={setLoading}
          headerName="Add Work Station"
          handelRefreshmachine={handelRefreshmachine}
          productToEdit={undefined}
        />
      )}
      {isUpdateModel && (
        <AddWorkStationView
          show={isUpdateModel}
          onHide={() => {
            setIsUpdateModel(false);
            // setSearchTermFromRightSide("");
          }}
          setLoading={setLoading}
          headerName="Update Work Station"
          handelRefreshmachine={handelRefreshmachine}
          productToEdit={editableProduct}
        />
      )}
    </>
  );
};

export default MachineManagement;
