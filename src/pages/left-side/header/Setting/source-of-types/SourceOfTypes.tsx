import { useEffect, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import ConfirmationModal from "../../../../../components/model/ConfirmationModal";
import { useTheme } from "../../../../../components/ThemeContext";
import {
  DEFAULT_MESSAGE_ERROR_PERMISSION
} from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import CreateSourceTypeView from "./CreateSourceTypeView";
import {
  fetchSourceOfTypesApi,
  handleDeleteSourceType,
  ISourceOfTypes
} from "./SourceOfTypesController";

interface IPropsSourceOfType {
  isSourceOfTypeOpen: boolean;
  closeSourceOfType: () => void;
}

const SourceOfTypes = ({
  isSourceOfTypeOpen,
  closeSourceOfType,
}: IPropsSourceOfType) => {
  const [sourceOfTypesLists, setSourceOfTypesLists] = useState<
    ISourceOfTypes[]
  >([]);
  // const [sourceOfTypeInput, setSourceOfTypeInput] = useState("");
  // const [sourceOfTypesHexColorInput, setSourceOfTypesHexColorInput] =
  //   useState("#999999");
  const sourceOfTypesRefDropdown = useRef<HTMLButtonElement>(null);
  const dropdownContactRef = useRef<Record<number, HTMLUListElement | null>>(
    {}
  );
  // const [sourceOfTypesDropdown, setSourceOfTypesDropdown] = useState<any>(null);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [deleteItemIds, setDeleteItemIds] = useState<number[]>([]);
  const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
  // const [isEditing, setIsEditing] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const { darkMode } = useTheme();
  // const [editSourceOfTypeId, setEditSourceOfTypeId] = useState<
  //   number | undefined
  // >(undefined);
  // const [sourceOfError, setsourceOfError] = useState("");
  // const [isSourceInputReadOnly, setIsSourceInputReadOnly] = useState(false);
  const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const actionDropdownRef = useRef<HTMLUListElement>(null);

  const [isCreateModel, setIsCreateModel] = useState<boolean>(false);
  const [isUpdateModel, setIsUpdateModel] = useState<boolean>(false);
  const [editableProduct, setEditableProduct] = useState<ISourceOfTypes>({
    source_name: "",
    id: 0,
    color: "",
  });

  const canView = useCheckUserPermission(PAGE_ID.SOURCE, PERMISSION_TYPE.VIEW);
  const canAdd = useCheckUserPermission(PAGE_ID.SOURCE, PERMISSION_TYPE.ADD);
  const canEdit = useCheckUserPermission(PAGE_ID.SOURCE, PERMISSION_TYPE.EDIT);
  const canDelete = useCheckUserPermission(
    PAGE_ID.SOURCE,
    PERMISSION_TYPE.DELETE
  );

  useEscapeKey(closeSourceOfType);

  // const handelChange = (event: TOnChangeInput) => {
  //   const value = event.target.value;
  //   setSourceOfTypeInput(value);
  //   setsourceOfError(value ? "" : "Source of Type is required");
  // };

  // const handelChangeHexColor = (event: TOnChangeInput) => {
  //   setSourceOfTypesHexColorInput(event.target.value);
  // };

  // const clearForm = () => {
  //   setSourceOfTypeInput("");
  //   setSourceOfTypesHexColorInput("#999999");
  //   setIsEditing(false);
  //   setEditSourceOfTypeId(undefined);
  //   setIsSourceInputReadOnly(false);

  // };

  // const handelSubmit = () => {
  //   if (sourceOfTypeInput.trim() === "") {
  //     setsourceOfError("Source of Type is required");
  //     return;
  //   }

  //   setsourceOfError("");
  //   if (sourceOfTypeInput) {
  //     if (isEditing && editSourceOfTypeId !== undefined) {
  //       updateSourceOfTypes(
  //         { source_name: sourceOfTypeInput, color: sourceOfTypesHexColorInput },
  //         setLoading,
  //         editSourceOfTypeId,
  //         clearForm
  //       );
  //     } else {
  //       if (!canAdd) {
  //         toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
  //         return;
  //       }
  //       createSourceOfType(
  //         { source_name: sourceOfTypeInput, color: sourceOfTypesHexColorInput },
  //         setLoading,
  //         clearForm
  //       );
  //     }
  //   }
  // };

  const toggleDropdownSourceOfTypes = (sourceOfTypesId: number | undefined) => {
    if (sourceOfTypesId === undefined) return;

    setIsActionDropdownOpen(false);

    setOpenDropdownId((prevId) => {
      return prevId === sourceOfTypesId ? null : sourceOfTypesId;
    });
  };

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    const clickedOnButton = target.closest('.source-of-type-list-grid-options');
    if (clickedOnButton) return;

    const clickedInsideDropdown = Object.values(dropdownContactRef.current).some(
      (ref) => ref && ref.contains(target)
    );

    const clickedInsideActionDropdown =
      actionDropdownRef.current?.contains(target) ||
      target.closest('.selected-btn');

    if (!clickedInsideDropdown && !clickedInsideActionDropdown) {
      setOpenDropdownId(null);
      setIsActionDropdownOpen(false);
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
        setIsActionDropdownOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscKey);

    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, []);

  useEffect(() => {
    if (canView && isSourceOfTypeOpen) {
      fetchSourceOfTypesApi(setSourceOfTypesLists, setLoading);
    }
  }, [isSourceOfTypeOpen, canView]);

  const handleEdit = (item: ISourceOfTypes) => {
    setOpenDropdownId(null);
    if (canEdit) {
      // setSourceOfTypeInput(item.source_name);
      // setSourceOfTypesHexColorInput(item.color || "#999999");
      // setIsEditing(true);
      // setEditSourceOfTypeId(item.id);
      // setsourceOfError("");
      // setIsSourceInputReadOnly(item.id < 0);
      setEditableProduct(item);
      setIsUpdateModel(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleDelete = (itemId: number) => {
    setOpenDropdownId(null);
    if (canDelete) {
      setDeleteItemIds([itemId]);
      setIsDeleteConfirmation(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleRefreshSourceofType = async () => {
    if (canView) {
      await fetchSourceOfTypesApi(setSourceOfTypesLists, setLoading);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) => {
      const newSelected = prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [...prev, id];
      const totalSelectable = sourceOfTypesLists.filter(
        (c) => c.id !== -1
      ).length;
      setIsAllSelected(newSelected.length === totalSelectable);
      return newSelected;
    });
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
      setIsAllSelected(false);
    } else {
      const allIds = sourceOfTypesLists
        .map((source) => source.id)
        .filter((id): id is number => id > 0 && id !== undefined);
      setSelectedIds(allIds);
      setIsAllSelected(true);
    }
  };

  const openDeleteSelected = () => {
    if (selectedIds.length === 0) {
      toast.error("No sources selected");
      return;
    }
    if (canDelete) {
      setDeleteItemIds(selectedIds);
      setIsDeleteConfirmation(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!canDelete) {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
      return;
    }

    await handleDeleteSourceType(
      deleteItemIds,
      setIsDeleteConfirmation,
      setSourceOfTypesLists,
      setLoading
    );
    setDeleteItemIds([]);
    setSelectedIds([]);
    setIsAllSelected(false);
  };

  const openCreateSorceTypetView = () => {
    if (canAdd) {
      setIsCreateModel(true);
    } else {
      setIsCreateModel(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  }

  return (
    <>
      {isSourceOfTypeOpen ? (
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
                onClick={closeSourceOfType}
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
              <h2>Source</h2>
            </div>
            <div className="text-end " style={{ width: "100%" }}>
              <div className="ICON"
                style={{
                  position: "absolute",
                  right: "60px"
                }}
              >
                <button
                  className="icons"
                  onClick={openCreateSorceTypetView}
                  title="Create Source Type"
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
              <div className="ICON"
                style={{
                  position: "absolute",
                  right: "20px"
                }}
              >
                <button
                  className="icons"
                  onClick={handleRefreshSourceofType}
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
                      Enter Source Name<span className="text-danger">*</span>
                    </h4>
                  </label>
                  <div className="col-12 d-flex">
                    <div className="col-10">
                      <div className="search-bar ">
                        <div className="add-source-of-type-section ">
                          <input
                            type="text"
                            title="Add Source Type"
                            placeholder="Add Source Type"
                            maxLength={SMALL_TEXT_LENGTH}
                            value={sourceOfTypeInput}
                            onChange={(e) => handelChange(e)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handelSubmit();
                              }
                            }}
                            readOnly={isSourceInputReadOnly}

                          />
                        </div>
                      </div>
                    </div>
                    <div className="col-2 d-flex justify-content-end align-items-center mx-1">
                      <input
                        type="color"
                        value={sourceOfTypesHexColorInput}
                        className="mx-1"
                        onChange={(e) => handelChangeHexColor(e)}
                        onKeyDown={(e) => {
                          if (sourceOfTypeInput.trim() === "") {
                            setsourceOfError("Source of Type is required");
                            return;
                          }
                          if (e.key === "Enter") {
                            handelSubmit();
                          }
                        }}
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
                  <div>
                    {sourceOfError && (
                      <span className="text-danger">{sourceOfError}</span>
                    )}
                  </div>
                </div> */}
                {canView ? (
                  <div>
                    {loading ? (
                      Array.from({ length: 10 }).map((_, index) => (
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
                                height="30px"
                                duration={5}
                                borderRadius={50}
                                style={{ opacity: darkMode ? "" : 0.8 }}
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="source-of-type-list-grid-block">
                          <div className="source-of-type-list-grid-main">
                            {selectedIds.length > 0 && (
                              <div className="pb-1">
                                <span
                                  className="selected-btn rounded-5"
                                  style={{
                                    width: "fit-content",
                                    height: "fit-content",
                                    paddingTop: "0.100rem",
                                    paddingBottom: "0.375rem",
                                    paddingLeft: "0.10rem",
                                    paddingRight: "0.75rem",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    className="custom-checkbox mx-1"
                                    checked={isAllSelected}
                                    title="Select All Contacts"
                                    onChange={handleSelectAll}
                                  />
                                  <div className="position-relative d-inline-block ms-1 dropdown-end">
                                    <button
                                      className="border-0"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenDropdownId(null);
                                        setIsActionDropdownOpen((prev) => !prev);
                                      }}
                                      disabled={selectedIds.length === 0}
                                    >
                                      <span className="contact-btn-search-text">
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          viewBox="0 0 19 20"
                                          width="22px"
                                          height="22px"
                                          className="hide animate__animated animate__fadeInUp"
                                        >
                                          <path
                                            fill="currentColor"
                                            d="M3.8 6.7l5.7 5.7 5.7-5.7 1.6 1.6-7.3 7.2-7.3-7.2 1.6-1.6z"
                                          ></path>
                                        </svg>
                                      </span>
                                    </button>
                                    {isActionDropdownOpen && (
                                      <ul
                                        className="labelDropLeft isVisible"
                                        style={{
                                          position: "absolute",
                                          left: -40,
                                          minWidth: "220px",
                                          background: "#fff",
                                          border: "1px solid #ddd",
                                          borderRadius: "5px",
                                          zIndex: "1000",
                                          overflowY: "auto",
                                          height: "5vh",
                                        }}
                                        ref={actionDropdownRef}
                                      >
                                        <li
                                          // className="listItem-contact-tabs mb-1"
                                          className="listItem"
                                          role="button"
                                          onClick={() => {
                                            openDeleteSelected();
                                            setIsActionDropdownOpen(false);
                                          }}
                                        >
                                          <span>
                                            <svg
                                              width="15"
                                              height="15"
                                              viewBox="0 0 24 24"
                                              fill="currentColor"
                                            >
                                              <path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12z"></path>
                                            </svg>
                                          </span>{" "}
                                          Delete Selected Source
                                        </li>
                                      </ul>
                                    )}
                                  </div>
                                </span>
                              </div>
                            )}
                            {Array.isArray(sourceOfTypesLists) &&
                              sourceOfTypesLists.map((item, index) => (
                                <div
                                  key={index}
                                  className="source-of-type-list-grid-list"
                                >
                                  {item.id > 0 && (
                                    <input
                                      type="checkbox"
                                      className="custom-checkbox mx-1"
                                      checked={selectedIds.includes(item.id)}
                                      onChange={() => toggleSelection(item.id)}
                                    />
                                  )}
                                  <span
                                    style={{
                                      backgroundColor: item.color
                                        ? item.color
                                        : "#999999",
                                      marginLeft: "5px",
                                    }}
                                    className="badge rounded-pill"
                                  >
                                    {item.source_name}
                                  </span>

                                  <button
                                    className="source-of-type-list-grid-options"
                                    id="source-of-types-options-id"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setIsActionDropdownOpen(false);
                                      toggleDropdownSourceOfTypes(item?.id);
                                    }}
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
                                    className={`source-of-types-options ${openDropdownId === item.id ? "isVisible" : "isHidden"
                                      }`}
                                    id="dropLeft"
                                    ref={(el) => {
                                      if (dropdownContactRef.current) {
                                        dropdownContactRef.current[
                                          item?.id
                                        ] = el;
                                      }
                                    }}
                                    style={{
                                      width: "120px",
                                    }}
                                  >


                                    <li
                                      className="listItem"
                                      role="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenDropdownId(null);
                                        handleEdit(item);
                                      }}
                                    >
                                      Edit
                                    </li>
                                    {item.id > 0 && <li
                                      style={{ color: "red", fontWeight: "600" }}
                                      className="listItem"
                                      role="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenDropdownId(null);
                                        handleDelete(item.id);
                                      }}
                                    >
                                      Delete
                                    </li>}
                                  </ul>

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
              onHide={() => {
                setIsDeleteConfirmation(false);
                setDeleteItemIds([]);
              }}
              handleSubmit={handleDeleteSubmit}
              title={
                deleteItemIds.length > 1
                  ? "Delete Sources"
                  : "Delete this Source Type"
              }
              message={`Are you sure you want to delete ${deleteItemIds.length > 1 ? "these sources" : "this source type"
                }?`}
              btn1="CANCEL"
              btn2="DELETE"
            />
          )}
        </div>
      ) : null}
      {isCreateModel && (
        <CreateSourceTypeView
          show={isCreateModel}
          onHide={() => {
            setIsCreateModel(false);
            // setSearchTermFromRightSide("");
          }}
          setLoading={setLoading}
          headerName="Create Source Type"
          handleRefreshSourceofType={handleRefreshSourceofType}
          productToEdit={undefined}
        />
      )}
      {isUpdateModel && (
        <CreateSourceTypeView
          show={isUpdateModel}
          onHide={() => {
            setIsUpdateModel(false);
            // setSearchTermFromRightSide("");
          }}
          setLoading={setLoading}
          headerName="Create Source Type"
          handleRefreshSourceofType={handleRefreshSourceofType}
          productToEdit={editableProduct}
        />
      )}
    </>
  );
};

export default SourceOfTypes;