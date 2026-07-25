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
import AddCountryView from "./AddCountryView";
import {
  fetchCountriesApi,
  handleDeleteCountries,
  ICountriesView
} from "./CountriesController";

interface IPropsCountriesView {
  isCountriesView: boolean;
  closeCountriesView: () => void;
}

const CountriesView = ({
  isCountriesView,
  closeCountriesView,
}: IPropsCountriesView) => {
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [countriesList, setCountriesList] = useState<ICountriesView[]>([]);
  // const [countryInput, setCountryInput] = useState("");
  // const [countryCodeInput, setCountryCodeInput] = useState("");
  // const [countryIsoInput, setIsoCodeInput] = useState("");
  const countryRefDropdown = useRef<HTMLButtonElement>(null);
  const dropdownContactRef = useRef<Record<number, HTMLUListElement | null>>({});
  const actionDropdownRef = useRef<HTMLUListElement>(null);
  const [countryDropdown, setCountryDropdown] = useState<any>({});
  // const [hasIdAvail, setHasIdAvail] = useState<number>();
  const [deleteItemIds, setDeleteItemIds] = useState<number[]>([]);
  const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
  // const [isEditing, setIsEditing] = useState<boolean>(false);
  // const [editCountryId, setEditCountryId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const { darkMode } = useTheme();
  const sourceOfTypesRefDropdown = useRef<HTMLButtonElement>(null);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);

  const [isCreateModel, setIsCreateModel] = useState<boolean>(false);
  const [isUpdateModel, setIsUpdateModel] = useState<boolean>(false);
  const [editableProduct, setEditableProduct] = useState<ICountriesView>({
    country_name: "",
    id: 0,
    country_code: "",
    country_iso: "",
  });

  const canView = useCheckUserPermission(PAGE_ID.COUNTRIE, PERMISSION_TYPE.VIEW);
  const canAdd = useCheckUserPermission(PAGE_ID.COUNTRIE, PERMISSION_TYPE.ADD);
  const canEdit = useCheckUserPermission(PAGE_ID.COUNTRIE, PERMISSION_TYPE.EDIT);
  const canDelete = useCheckUserPermission(PAGE_ID.COUNTRIE, PERMISSION_TYPE.DELETE);
  // const [countryError, setCountryError] = useState("");

  useEscapeKey(closeCountriesView);

  // const handleChange = (event: TOnChangeInput) => {
  //   const value = event.target.value;
  //   setCountryInput(value);
  //   setCountryError(value ? "" : "Country Name is required");
  // };

  // const handleCountryCodeChange = (event: TOnChangeInput) => {
  //   const value = event.target.value;
  //   setCountryCodeInput(value);
  // };

  // const handleCountryISOChange = (event: TOnChangeInput) => {
  //   const value = event.target.value;
  //   setIsoCodeInput(value);
  // };

  // const clearForm = () => {
  //   setCountryInput("");
  //   setCountryCodeInput("");
  //   setIsoCodeInput("");
  //   setIsEditing(false);
  //   setEditCountryId(undefined);
  // };

  // const handleSubmit = () => {
  //   if (countryInput.trim() === "") {
  //     setCountryError("Country Name is required");
  //     return;
  //   }

  //   if (countryInput) {
  //     if (isEditing && editCountryId !== undefined) {
  //       const currentCountry = countriesList.find((item) => item.id === editCountryId);
  //       if (
  //         currentCountry &&
  //         currentCountry.country_name === countryInput &&
  //         (currentCountry.country_code || "") === countryCodeInput &&
  //         (currentCountry.country_iso || "") === countryIsoInput
  //       ) {
  //         toast.info("No changes made to the country data");
  //         clearForm();
  //         return;
  //       }
  //       updateCountries(
  //         {
  //           country_name: countryInput,
  //           country_code: countryCodeInput,
  //           country_iso: countryIsoInput,
  //         },
  //         setLoading,
  //         editCountryId,
  //         clearForm
  //       );
  //     } else {
  //       if (!canAdd) {
  //         toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
  //         return;
  //       }
  //       createCountries(
  //         { country_name: countryInput, country_code: countryCodeInput, country_iso: countryIsoInput },
  //         setLoading,
  //         clearForm
  //       );
  //     }
  //   }
  // };

  const toggleDropdownCountry = (countryId: number | undefined) => {
    if (countryId === undefined) return;

    setIsActionDropdownOpen(false);

    setOpenDropdownId((prevId) => {
      return prevId === countryId ? null : countryId;
    });
  };


  useEffect(() => {
    if (canView && isCountriesView) {
      fetchCountriesApi(setCountriesList, setLoading);
    }
  }, [isCountriesView, canView]);

  const handleEdit = (item: ICountriesView) => {
    setOpenDropdownId(null);
    if (canEdit) {
      // setCountryDropdown({});
      // setCountryInput(item.country_name);
      // setCountryCodeInput(item.country_code || "");
      // setIsoCodeInput(item.country_iso || "");
      // setIsEditing(true);
      // setEditCountryId(item.id);
      // setCountryError("");
      setEditableProduct(item);
      setIsUpdateModel(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
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

  const handleDelete = (itemId: number) => {
    setOpenDropdownId(null);
    if (canDelete) {
      setCountryDropdown({});
      setDeleteItemIds([itemId]);
      setIsDeleteConfirmation(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) => {
      const newSelected = prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [...prev, id];
      const totalSelectable = countriesList.filter((c) => c.id !== -1).length;
      setIsAllSelected(newSelected.length === totalSelectable);
      return newSelected;
    });
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
      setIsAllSelected(false);
    } else {
      const allIds = countriesList
        .map((c) => c.id)
        .filter((id): id is number => id !== -1 && id !== undefined);
      setSelectedIds(allIds);
      setIsAllSelected(true);
    }
  };

  const openDeleteSelected = () => {
    if (selectedIds.length === 0) {
      toast.error("No countries selected");
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

    await handleDeleteCountries(
      deleteItemIds,
      setIsDeleteConfirmation,
      setCountriesList,
      setLoading
    );
    setIsDeleteConfirmation(false);
    setDeleteItemIds([]);
    setSelectedIds([]);
    setIsAllSelected(false);
  };

  const handleRefreshCountries = async () => {
    if (canView) {
      await fetchCountriesApi(setCountriesList, setLoading);
    }
  };

  const openAddCountryView = () => {
    if (canAdd) {
      setIsCreateModel(true);
    } else {
      setIsCreateModel(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  }

  return (
    <>
      {isCountriesView ? (
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
                onClick={closeCountriesView}
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
              <h2>Countries</h2>
            </div>
            <div className="col-8 text-end mb-2">
              <div
                className="ICON"
                style={{
                  position: "absolute",
                  right: "60px",
                }}
              >
                <button
                  className="icons"
                  onClick={openAddCountryView}
                  title="Add Country"
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
                  onClick={handleRefreshCountries}
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
          <div className="chats-notifications">
            <div className="block">
              <div className="h-text">
                {/* <div className="head" style={{ display: "block" }}>
                  <label className="form-check-label" htmlFor="flexCheckDefault">
                    <h4>
                      Enter Country Name<span className="text-danger">*</span>
                    </h4>
                  </label>
                  <div className="col-12">
                    <div
                      className="row"
                      style={{ width: "100%", gap: "10px" }}
                    >
                      <div
                        className="add-source-of-type-section"
                        style={{ width: "45%", marginRight: "10px" }}
                      >
                        <input
                          type="text"
                          title="Country Name"
                          placeholder="Country Name"
                          maxLength={SMALL_TEXT_LENGTH}
                          value={countryInput}
                          onChange={(e) => handleChange(e)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSubmit();
                            }
                          }}
                          style={{
                            width: "100%",
                            padding: "8px",
                            borderRadius: "4px",
                            border: "1px solid #ddd",
                            fontSize: "14px",
                          }}
                        />
                      </div>
                      <div
                        className="d-flex align-items-center"
                        style={{ width: "45%", gap: "10px" }}
                      >
                        <div style={{ width: "40%" }}>
                          <input
                            type="text"
                            value={countryCodeInput}
                            maxLength={SMALL_TEXT_LENGTH}
                            placeholder="Code"
                            onChange={(e) => handleCountryCodeChange(e)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleSubmit();
                              }
                            }}
                            style={{
                              width: "100%",
                              padding: "8px",
                              borderRadius: "4px",
                              border: "1px solid #ddd",
                              fontSize: "14px",
                            }}
                          />
                        </div>
                        <div style={{ width: "40%" }}>
                          <input
                            type="text"
                            value={countryIsoInput}
                            maxLength={SMALL_TEXT_LENGTH}
                            placeholder="ISO Code"
                            onChange={(e) => handleCountryISOChange(e)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleSubmit();
                              }
                            }}
                            style={{
                              width: "100%",
                              padding: "8px",
                              borderRadius: "4px",
                              border: "1px solid #ddd",
                              fontSize: "14px",
                            }}
                          />
                        </div>
                        <div style={{ width: "15%", display: "flex", alignItems: "center" }}>
                          <button
                            className="icons"
                            onClick={handleSubmit}
                            style={{
                              padding: "8px",
                              borderRadius: "4px",
                              border: "1px solid #ddd",
                              background: darkMode ? "#333" : "#fff",
                              cursor: "pointer",
                            }}
                          >
                            <span>
                              {isEditing ? (
                                <svg
                                  data-name="Layer 1"
                                  height={24}
                                  id="Layer_1"
                                  viewBox="0 0 200 200"
                                  fill={darkMode ? "#fff" : "#5f6368"}
                                >
                                  <path
                                    d="M177.68,43.9c-4.5-3.5-10.5-3-14,1.5l-74,89.5-55-40c-4.5-3-10.5-2.5-14,2-3,4.5-2.5,10.5,2,14l62.5,45.5a.49.49,0,0,1,.5.5c.5,0,.5.5,1,.5s.5.5,1,.5.5,0,1,.5h6c.5,0,.5,0,1-.5.5,0,.5-.5,1-.5s.5-.5,1-.5.5-.5,1-.5a.49.49,0,0,0,.5-.5l.5-.5,80-97C182.18,53.9,181.68,47.4,177.68,43.9Z"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  height="24px"
                                  viewBox="0 -960 960 960"
                                  width="24px"
                                  fill={darkMode ? "#fff" : "#5f6368"}
                                >
                                  <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                                </svg>
                              )}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    {countryError && (
                      <span className="text-danger">{countryError}</span>
                    )}
                  </div>
                </div> */}
                {canView ? (
                  <div>
                    {loading ? (
                      Array.from({ length: 12 }).map((_, index) => (
                        <div className="source-of-type-list-grid-main" key={index}>
                          <div className="source-of-type-list-grid-list">
                            <div style={{ display: "inline-block", marginLeft: "8px" }}>
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
                      ))
                    ) : (
                      <>
                        <div className="source-of-type-list-grid-block">
                          <div className="source-of-type-list-grid-main">
                            {selectedIds.length > 0 && (
                              <span
                                className="selected-btn rounded-5"
                                style={{
                                  width: "fit-content",
                                  height: "fit-content",
                                  paddingTop: "0.200rem",
                                  paddingBottom: "0.375rem",
                                  paddingLeft: "0.20rem",
                                  paddingRight: "0.75rem",
                                  marginRight: "10px",
                                }}
                              >
                                <input
                                  type="checkbox"
                                  className="custom-checkbox mx-1"
                                  checked={isAllSelected}
                                  title="Select All Countries"
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
                                        Delete Selected Countries
                                      </li>
                                    </ul>
                                  )}
                                </div>
                              </span>
                            )}
                            <p
                              className={`${countriesList.length > 0 ? "" : "text-center pt-5"}`}
                            >
                              {countriesList.length > 0 ? "" : "No Data Found"}
                            </p>
                            {countriesList &&
                              countriesList.map((item, index) => (
                                <div
                                  key={index}
                                  className="source-of-type-list-grid-list"
                                >
                                  {item.id !== -1 && (
                                    <input
                                      type="checkbox"
                                      className="custom-checkbox mx-1"
                                      checked={selectedIds.includes(item.id)}
                                      onChange={() => toggleSelection(item.id)}
                                    />
                                  )}
                                  <span
                                    style={{ color: "black" }}
                                    className="badge rounded-pill"
                                  >
                                    {item.country_name}
                                    {item.country_code && ` (${item.country_code})`}
                                    {item.country_iso && ` [${item.country_iso}]`}
                                  </span>
                                  {item.id === -1 ? (
                                    <span></span>
                                  ) : (
                                    <>
                                      <button
                                        className="source-of-type-list-grid-options"
                                        id="source-of-types-options-id"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setIsActionDropdownOpen(false);
                                          toggleDropdownCountry(item?.id);
                                        }}
                                        ref={countryRefDropdown}
                                      >
                                        <span>
                                          <svg viewBox="0 0 24 24" width="24" height="24">
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
                                        ref={(el) => (dropdownContactRef.current[item.id] = el)}
                                        style={{
                                          width: "120px",
                                          marginLeft: "60%",
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
                                        <li
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
                  <p className="text-danger p-1">{DEFAULT_MESSAGE_ERROR_PERMISSION}</p>
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
              title={deleteItemIds.length > 1 ? "Delete Countries" : "Delete this Country"}
              message={`Are you sure you want to delete ${deleteItemIds.length > 1 ? "these countries" : "this country"
                }?`}
              btn1="CANCEL"
              btn2="DELETE"
            />
          )}
        </div>
      ) : null}
      {isCreateModel && (
        <AddCountryView
          show={isCreateModel}
          onHide={() => {
            setIsCreateModel(false);
            // setSearchTermFromRightSide("");
          }}
          setLoading={setLoading}
          headerName="Add Country"
          handleRefreshCountries={handleRefreshCountries}
          productToEdit={undefined}
        />
      )}
      {isUpdateModel && (
        <AddCountryView
          show={isUpdateModel}
          onHide={() => {
            setIsUpdateModel(false);
            // setSearchTermFromRightSide("");
          }}
          setLoading={setLoading}
          headerName="Update Country"
          handleRefreshCountries={handleRefreshCountries}
          productToEdit={editableProduct}
        />
      )}
    </>
  );
};

export default CountriesView;