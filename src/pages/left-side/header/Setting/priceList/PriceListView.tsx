import { useEffect, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { toast } from "react-toastify";
import {
  useEscapeKey
} from "../../../../../common/SharedFunction";
import ConfirmationModal from "../../../../../components/model/ConfirmationModal";
import { useTheme } from "../../../../../components/ThemeContext";
import {
  DEFAULT_MESSAGE_ERROR_PERMISSION,
  SMALL_WIDTH_FOR_TEXT
} from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import CreatePriceListView from "./CreatePriceListView";
import {
  fetchPriceListApi,
  handleDeletePriceList,
  IPriceListView
} from "./PriceListController";
import PriceListItemView from "./PriceListItemView";

interface IPropsPriceListView {
  isPriceListView: boolean;
  closePriceListView: () => void;
}

const PriceListView = ({
  isPriceListView,
  closePriceListView,
}: IPropsPriceListView) => {
  const [priceListLists, setPriceListList] = useState<IPriceListView[]>([]);
  // const [priceListInput, setPriceListInputInput] = useState("");
  // const [effectiveDateInput, setEffectiveDateInput] = useState<DateObject | null>(null);
  const dropdownContactRef = useRef<Record<number, HTMLUListElement | null>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
  // const [selectedCountryId, setSelectedCountryId] = useState<any>(false);
  // const [selectedStateId, setSelectedStateId] = useState<any>(false);
  // const [selectedCityId, setSelectedCityId] = useState<any>(false);
  // const [editSelectedCategoryId, setEditSelectedCategoryId] = useState("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editPriceListId, setEditPriceListId] = useState<number | undefined>(undefined);
  // const [countriesList, setCountriesList] = useState([]);
  // const [stateList, setStateList] = useState([]);
  // const [cityList, setCityList] = useState([]);
  const [isPriceListItemShow, setIsPriceListItemShow] = useState(false);
  const [passDataInAddItem, setPassDataInAddItem] = useState<IPriceListView>();
  // const [priceNameError, setPriceNameError] = useState("");
  // const [effectiveDataInputError, setEffectiveDataInputError] = useState("");
  // const [countryError, setCountryError] = useState("");
  // const [cityError, setCityError] = useState("");
  // const [stateError, setStateError] = useState("");
  const [loading, setLoading] = useState(false);
  const { darkMode } = useTheme();
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const actionDropdownRef = useRef<HTMLUListElement>(null);
  const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);
  const [deleteItemIds, setDeleteItemIds] = useState<number[]>([]);

  const [isCreateModel, setIsCreateModel] = useState<boolean>(false);
  const [isUpdateModel, setIsUpdateModel] = useState<boolean>(false);
  const [editableProduct, setEditableProduct] = useState<IPriceListView>({
    price_list_name: "",
    id: 0,
    effective_from: "",
    created_date_time: "",
    country_id: "",
    state_id: "",
    city_id: "",
    city_name: "",
    state_name: "",
    country_name: "",
  });

  const canView = useCheckUserPermission(PAGE_ID.PRICE_LIST, PERMISSION_TYPE.VIEW);
  const canAdd = useCheckUserPermission(PAGE_ID.PRICE_LIST, PERMISSION_TYPE.ADD);
  const canEdit = useCheckUserPermission(PAGE_ID.PRICE_LIST, PERMISSION_TYPE.EDIT);
  const canDelete = useCheckUserPermission(PAGE_ID.PRICE_LIST, PERMISSION_TYPE.DELETE);
  const canViewPriceItem = useCheckUserPermission(PAGE_ID.PRICE_LIST_ITEM, PERMISSION_TYPE.VIEW);

  useEscapeKey(() => {
    if (!isPriceListItemShow) {
      closePriceListView();
    } else {
      setIsPriceListItemShow(false);
    }
  });

  // const handleCountryChange = (selectedOption: SingleValue<IOption>) => {
  //   setSelectedCountryId(selectedOption);
  //   setCountryError(selectedOption ? "" : "Country is required");
  //   if (!selectedOption) {
  //     setSelectedStateId(false);
  //     setStateList([]);
  //     setSelectedCityId(false);
  //     setCityList([]);
  //   }
  // };

  // const handleStateChange = (selectedOption: SingleValue<IOption>) => {
  //   setSelectedStateId(selectedOption);
  //   setSelectedCityId(false);
  //   setCityList([]);
  // };

  // const handleCityChange = (selectedOption: SingleValue<IOption>) => {
  //   setSelectedCityId(selectedOption);
  // };

  // const handelChange = (event: TOnChangeInput) => {
  //   const value = event.target.value;
  //   setPriceListInputInput(value);
  //   setPriceNameError(value ? "" : "Price Name is required");
  // };

  // const handelChangeEffectiveDate = (date: DateObject | null) => {
  //   const value = date instanceof DateObject
  //     ? date.format("YYYY-MM-DD")
  //     : "";
  //   setEffectiveDateInput(date);
  //   setEffectiveDataInputError(value ? "" : "Date is required");
  // };

  // const clearForm = () => {
  //   setPriceListInputInput("");
  //   setSelectedCountryId(false);
  //   setSelectedStateId(false);
  //   setSelectedCityId(false);
  //   setEffectiveDateInput(null);
  //   setIsEditing(false);
  //   setEditPriceListId(undefined);
  // };

  // const handelSubmit = () => {
  //   let hasError = false;

  //   if (!priceListInput) {
  //     setPriceNameError("Price Name is required");
  //     hasError = true;
  //   }
  //   if (!selectedCountryId) {
  //     setCountryError("Country is required");
  //     hasError = true;
  //   }
  //   if (!effectiveDateInput) {
  //     setEffectiveDataInputError("Date is required");
  //     hasError = true;
  //   }

  //   if (!hasError) {
  //     if (isEditing && editPriceListId !== undefined) {
  //       updatePriceList(
  //         {
  //           price_list_name: priceListInput,
  //           country_id: selectedCountryId?.value,
  //           effective_from: effectiveDateInput instanceof DateObject
  //             ? effectiveDateInput.format("YYYY-MM-DD")
  //             : "",
  //           state_id: selectedStateId?.value,
  //           city_id: selectedCityId?.value,
  //         },
  //         editPriceListId,
  //         setLoading,
  //         clearForm
  //       );
  //     } else {
  //       if (!canAdd) {
  //         toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
  //         return;
  //       }
  //       createPriceList(
  //         {
  //           price_list_name: priceListInput,
  //           country_id: selectedCountryId?.value,
  //           effective_from: effectiveDateInput instanceof DateObject
  //             ? effectiveDateInput.format("YYYY-MM-DD")
  //             : "",
  //           state_id: selectedStateId?.value,
  //           city_id: selectedCityId?.value,
  //         },
  //         setLoading,
  //         clearForm
  //       );
  //     }

  //   }
  // };

  const toggleDropdownPriceList = (PriceListId: number | undefined) => {
    if (PriceListId === undefined) return;

    // Close action dropdown when opening individual dropdown
    setIsActionDropdownOpen(false);

    setOpenDropdownId((prevId) => {
      if (prevId === PriceListId) {
        return null;
      }
      return PriceListId;
    });
  };

  useEffect(() => {
    if (isPriceListView) {
      const fetchData = async () => {
        try {
          if (canView) {
            await fetchPriceListApi(setPriceListList, setLoading);
          }
        } catch (error) {
          console.error("Error fetching price list:", error);
        }
      };
      fetchData();
    }
  }, [isPriceListView, canView]);

  // useEffect(() => {
  //   if (selectedCountryId) {
  //     fetchStateApiForPriceList(setStateList, selectedCountryId.value);
  //   } else {
  //     setStateList([]);
  //     setSelectedStateId(false);
  //     setCityList([]);
  //     setSelectedCityId(false);
  //   }
  // }, [selectedCountryId]);

  // useEffect(() => {
  //   if (selectedStateId) {
  //     fetchCityApiForPriceList(setCityList, selectedStateId.value);
  //   } else {
  //     setCityList([]);
  //     setSelectedCityId(false);
  //   }
  // }, [selectedStateId]);

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    const clickedOnButton = target.closest('.icon-more');
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

  // const countryOptions = countriesList.map((category: any) => ({
  //   value: category.id,
  //   label: category.country_name,
  // }));
  // const stateOptions = stateList.map((category: any) => ({
  //   value: category.id,
  //   label: category.state_name,
  // }));
  // const cityOptions = cityList.map((category: any) => ({
  //   value: category.id,
  //   label: category.city_name,
  // }));

  const handleEdit = async (item: IPriceListView) => {
    setOpenDropdownId(null);

    if (canEdit) {
      // setPriceListInputInput(item.price_list_name);
      // setEffectiveDateInput(new DateObject(item.effective_from));
      // setEditSelectedCategoryId(item.country_id);
      // setIsEditing(true);
      // setEditPriceListId(item.id);
      // setSelectedCountryId({ value: item.country_id, label: item.country_name });
      // setSelectedStateId({ value: item.state_id, label: item.state_name });
      // setSelectedCityId({ value: item.city_id, label: item.city_name });
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      setEditableProduct(item);
      setIsUpdateModel(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const handelPriceListAddItem = (item: IPriceListView) => {
    setOpenDropdownId(null);
    if (canViewPriceItem) {
      setPassDataInAddItem(item);
      setIsPriceListItemShow(true);
    } else {
      setIsPriceListItemShow(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const currentDate = getCurrentDate();

  const handelRefreshProduct = async () => {
    await fetchPriceListApi(setPriceListList, setLoading);
  };

  const openDeleteModel = (itemId: number) => {
    setOpenDropdownId(null);
    if (canDelete) {
      setDeleteItemIds([itemId]);
      setIsDeleteConfirmation(true);
    } else {
      setIsDeleteConfirmation(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const toggleSelection = (id: number) => {
    setSelectedIds((prev) => {
      const newSelected = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
      const totalSelectable = priceListLists.filter((c) => c.id !== -1).length;
      setIsAllSelected(newSelected.length === totalSelectable);
      return newSelected;
    });
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
      setIsAllSelected(false);
    } else {
      const allIds = priceListLists
        .map((c) => c.id)
        .filter((id): id is number => id !== -1 && id !== undefined);
      setSelectedIds(allIds);
      setIsAllSelected(true);
    }
  };

  const openDeleteSelected = () => {
    if (selectedIds.length === 0) {
      toast.error("No price lists selected");
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

    await handleDeletePriceList(
      deleteItemIds,
      setIsDeleteConfirmation,
      setPriceListList,
      setLoading
    );

    setIsDeleteConfirmation(false);
    setDeleteItemIds([]);
    setSelectedIds([]);
    setIsAllSelected(false);
  };

  const openCreatePriceListView = () => {
    if (canAdd) {
      setIsCreateModel(true);
    } else {
      setIsCreateModel(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  }

  return (
    <>
      {isPriceListView ? (
        <div className="notifications animate__animated animate__fadeInLeft" id="notifications">
          <div className="header-Chat">
            <div className="ICON">
              <div
                aria-disabled="false"
                role="button"
                className="icons"
                data-tab="2"
                title="Back"
                aria-label="New chat"
                onClick={closePriceListView}
              >
                <span data-testid="chat" data-icon="chat" className="">
                  <svg viewBox="0 0 24 24" width="24" height="24" className="">
                    <path fill="currentColor" d="m12 4 1.4 1.4L7.8 11H20v2H7.8l5.6 5.6L12 20l-8-8 8-8z"></path>
                  </svg>
                </span>
              </div>
            </div>
            <div className="newText">
              <h2>Price List</h2>
            </div>
            <div className="col-7 text-end mb-2">
              <div className="ICON" style={{ position: "absolute", right: "10px" }}>
                <button className="icons" onClick={openCreatePriceListView} title="Create Price List">
                  <svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 -960 960 960" width="30px" fill="#fff">
                    <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                  </svg>
                </button>
              </div>
              <div className="ICON" style={{ position: "absolute", right: "45px" }}>
                <button className="icons" onClick={handelRefreshProduct} title="Refresh">
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
            <div className="block p-0">
              <div className="h-text">
                {/* <div className="head" style={{ display: "block" }}> */}
                {/* <div className="col-12 d-flex justify-content-between w-100">
                    <div className="col-5">
                      <label className="form-check-label" htmlFor="flexCheckDefault">
                        <h4>
                          Select Country<span className="text-danger">*</span>
                        </h4>
                      </label>
                      <div className="add-source-of-type-section">
                        <CustomSearchDropdown
                          options={countryOptions}
                          value={selectedCountryId}
                          onChange={handleCountryChange}
                          className="w-100"
                        />
                      </div>
                      {countryError && <span className="text-danger">{countryError}</span>}
                    </div>
                    <div className="col-5">
                      <label className="form-check-label" htmlFor="flexCheckDefault">
                        <h4>
                          Select State
                        </h4>
                      </label>
                      <div className="add-source-of-type-section">
                        <CustomSearchDropdown
                          options={stateOptions}
                          value={selectedStateId}
                          onChange={handleStateChange}
                          className="w-100"
                        />
                      </div>
                      {stateError && <span className="text-danger">{stateError}</span>}
                    </div>
                  </div>
                  <div className="col-12 d-flex justify-content-between w-100 mt-2">
                    <div className="col-5">
                      <label className="form-check-label" htmlFor="flexCheckDefault">
                        <h4>
                          Select City
                        </h4>
                      </label>
                      <div className="add-source-of-type-section">
                        <CustomSearchDropdown
                          options={cityOptions}
                          value={selectedCityId}
                          onChange={handleCityChange}
                          className="w-100"
                        />
                      </div>
                      {cityError && <span className="text-danger">{cityError}</span>}
                    </div>
                    <div className="col-5">
                      <label
                        className="form-check-label"
                        htmlFor="flexCheckDefault"
                      >
                        <h4>
                          Price List Name <span className="text-danger">*</span>
                        </h4>
                      </label>
                      <div className="search-bar ">
                        <div className="add-source-of-type-section ">
                          <input
                            type="text"
                            title="Price List Name"
                            placeholder="Price List Name"
                            maxLength={BIG_TEXT_LENGTH}
                            value={priceListInput}
                            onChange={(e) => handelChange(e)}
                            ref={inputRef}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-12 d-flex justify-content-between w-100 mt-2">
                    <div className="col-11">
                      <label className="form-check-label" htmlFor="flexCheckDefault">
                        <h4>
                          Effective Date <span className="text-danger">*</span>
                        </h4>
                      </label>
                      <div className="search-bar">
                        <div className="add-source-of-type-section d-flex">
                          <DatePicker
                            value={effectiveDateInput}
                            onChange={handelChangeEffectiveDate}
                            format="DD-MM-YYYY"
                            calendarPosition="bottom-left"
                            style={{ width: "100%", zIndex: "9999999 !important" }}
                            placeholder="DD-MM-YYYY"
                            className="form-control font-size-15 rounded-1"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="col-1 d-flex align-items-center mt-2">
                      <button className="" onClick={handelSubmit}>
                        <span>
                          {isEditing ? (
                            <svg data-name="Layer 1" height={24} id="Layer_1" viewBox="0 0 200 200">
                              <path
                                fill="currentColor"
                                d="M177.68,43.9c-4.5-3.5-10.5-3-14,1.5l-74,89.5-55-40c-4.5-3-10.5-2.5-14,2-3,4.5-2.5,10.5,2,14l62.5,45.5a.49.49,0,0,1,.5.5c.5,0,.5.5,1,.5s.5.5,1,.5.5,0,1,.5h6c.5,0,.5,0,1-.5.5,0,.5-.5,1-.5s.5-.5,1-.5.5-.5,1-.5a.49.49,0,0,0,.5-.5l.5-.5,80-97C182.18,53.9,181.68,47.4,177.68,43.9Z"
                              />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" height="26px" viewBox="0 -960 960 960" width="26px" fill="#5f6368">
                              <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                            </svg>
                          )}
                        </span>
                      </button>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-6">
                      {priceNameError && <span className="text-danger">{priceNameError}</span>}
                    </div>
                    <div className="col-6">
                      {effectiveDataInputError && <span className="text-danger">{effectiveDataInputError}</span>}
                    </div>
                  </div> */}
                {selectedIds.length > 0 && (
                  <span
                    className="selected-btn rounded-5"
                    style={{
                      width: "fit-content",
                      height: "fit-content",
                      paddingTop: "0.375rem",
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
                      title="Select All Price Lists"
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
                            <path fill="currentColor" d="M3.8 6.7l5.7 5.7 5.7-5.7 1.6 1.6-7.3 7.2-7.3-7.2 1.6-1.6z"></path>
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
                            height: "5vh", // if add more options the add +5 VH per options
                          }}
                          ref={actionDropdownRef}
                        >
                          <li
                            className="listItem"
                            // className="listItem-contact-tabs mb-1"
                            role="button"
                            onClick={() => {
                              openDeleteSelected();
                              setIsActionDropdownOpen(false);
                            }}
                          >
                            <span>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12z"></path>
                              </svg>
                            </span>{" "}
                            Delete Selected Price Lists
                          </li>
                        </ul>
                      )}
                    </div>
                  </span>
                )}
                {/* </div> */}
                {canView ? (
                  <div>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <div className="chats h-100" key={index}>
                          <button className="block chat-list">
                            <div className="h-text ps-2">
                              <Skeleton width="100%" height={15} duration={5} style={{ opacity: darkMode ? "" : 0.8 }} />
                              <Skeleton width="100%" height={15} duration={5} style={{ opacity: darkMode ? "" : 0.8 }} />
                              <Skeleton width="100%" height={15} duration={5} style={{ opacity: darkMode ? "" : 0.8 }} />
                              <Skeleton width="100%" height={15} duration={5} style={{ opacity: darkMode ? "" : 0.8 }} />
                              <Skeleton width="100%" height={15} duration={5} style={{ opacity: darkMode ? "" : 0.8 }} />
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
                          {priceListLists.length === 0 ? (
                            <p className="text-center pt-5">No Data Found</p>
                          ) : (
                            priceListLists.map((item, index) => (
                              <div
                                key={index}
                                className="block chat-list"
                                style={{ padding: "6px" }}
                              >
                                <div className="align-self-stretch">
                                  {item.id !== -1 && (
                                    <input
                                      type="checkbox"
                                      className="custom-checkbox mx-1 mt-2"
                                      checked={selectedIds.includes(item.id)}
                                      onChange={() => toggleSelection(item.id)}
                                    />
                                  )}
                                </div>
                                <div
                                  className={`h-text ps-2 ${isEditing && item.id === editPriceListId ? "bg-secondary" : ""}`}
                                >
                                  {item.id === -1 ? (
                                    <span></span>
                                  ) : (
                                    <>
                                      <button
                                        className="icon-more float-end"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setIsActionDropdownOpen(false);
                                          toggleDropdownPriceList(item.id);
                                        }}
                                      >
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          viewBox="0 0 19 20"
                                          width="19"
                                          height="20"
                                          className="hide animate__animated animate__fadeInUp"
                                        >
                                          <path fill="currentColor" d="M3.8 6.7l5.7 5.7 5.7-5.7 1.6 1.6-7.3 7.2-7.3-7.2 1.6-1.6z"></path>
                                        </svg>
                                      </button>
                                      <ul
                                        className={`price-list-option labelDropLeft ${openDropdownId === item.id ? "isVisible" : "isHidden"}`}
                                        id="dropLeft"
                                        ref={(el) => (dropdownContactRef.current[item.id] = el)}
                                        style={{ width: "160px", top: "-55px", right: "30px" }}
                                      >
                                        <li
                                          className="listItem"
                                          role="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenDropdownId(null);
                                            handelPriceListAddItem(item);
                                          }}
                                        >
                                          Add Item / View
                                        </li>

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
                                            openDeleteModel(item.id);
                                          }}
                                        >
                                          Delete
                                        </li>
                                      </ul>
                                    </>
                                  )}
                                  <div className="d-flex">
                                    <div style={{ paddingBottom: "2px", borderBottom: "unset" }}>
                                      <h4 className="inquiry-front">
                                        <b>Price List Name</b>:
                                      </h4>
                                    </div>
                                    <div
                                      style={{
                                        paddingBottom: "2px",
                                        borderBottom: "unset",
                                        textAlign: "left",
                                      }}
                                    >
                                      <h4
                                        className="inquiry-front ms-1"
                                        style={{
                                          wordWrap: "break-word",
                                          width: `${SMALL_WIDTH_FOR_TEXT}`,
                                          whiteSpace: "nowrap",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                        }}
                                      >
                                        {item.price_list_name
                                          ? item.price_list_name
                                          : ""}
                                      </h4>
                                    </div>
                                  </div>
                                  <div className="d-flex">
                                    <div style={{ paddingBottom: "2px", borderBottom: "unset" }}>
                                      <h4 className="inquiry-front">
                                        <b>Effective Date</b>:
                                      </h4>
                                    </div>
                                    <div
                                      style={{
                                        paddingBottom: "2px",
                                        borderBottom: "unset",
                                        textAlign: "left",
                                      }}
                                    >
                                      <h4
                                        className="inquiry-front ms-1"
                                        style={{
                                          wordWrap: "break-word",
                                          width: `${SMALL_WIDTH_FOR_TEXT}`,
                                          whiteSpace: "nowrap",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                        }}
                                      >
                                        {item.effective_from
                                          ? item.effective_from
                                          : ""}
                                      </h4>
                                    </div>
                                  </div>
                                  <div className="d-flex">
                                    <div style={{ paddingBottom: "2px", borderBottom: "unset" }}>
                                      <h4 className="inquiry-front">
                                        <b>Country Name</b>:
                                      </h4>
                                    </div>
                                    <div
                                      style={{
                                        paddingBottom: "2px",
                                        borderBottom: "unset",
                                        textAlign: "left",
                                      }}
                                    >
                                      <h4
                                        className="inquiry-front ms-1"
                                        style={{
                                          wordWrap: "break-word",
                                          width: `${SMALL_WIDTH_FOR_TEXT}`,
                                          whiteSpace: "nowrap",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                        }}
                                      >
                                        {item.country_name
                                          ? item.country_name
                                          : ""}
                                      </h4>
                                    </div>
                                  </div>
                                  <div className="d-flex">
                                    <div style={{ paddingBottom: "2px", borderBottom: "unset" }}>
                                      <h4 className="inquiry-front">
                                        <b>State Name</b>:
                                      </h4>
                                    </div>
                                    <div
                                      style={{
                                        paddingBottom: "2px",
                                        borderBottom: "unset",
                                        textAlign: "left",
                                      }}
                                    >
                                      <h4
                                        className="inquiry-front ms-1"
                                        style={{
                                          wordWrap: "break-word",
                                          width: `${SMALL_WIDTH_FOR_TEXT}`,
                                          whiteSpace: "nowrap",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                        }}
                                      >
                                        {item.state_name
                                          ? item.state_name
                                          : ""}
                                      </h4>
                                    </div>
                                  </div>
                                  <div className="d-flex">
                                    <div style={{ paddingBottom: "2px", borderBottom: "unset" }}>
                                      <h4 className="inquiry-front">
                                        <b>City Name</b>:
                                      </h4>
                                    </div>
                                    <div
                                      style={{
                                        paddingBottom: "2px",
                                        borderBottom: "unset",
                                        textAlign: "left",
                                      }}
                                    >
                                      <h4
                                        className="inquiry-front ms-1"
                                        style={{
                                          wordWrap: "break-word",
                                          width: `${SMALL_WIDTH_FOR_TEXT}`,
                                          whiteSpace: "nowrap",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                        }}
                                      >
                                        {item.city_name
                                          ? item.city_name
                                          : ""}
                                      </h4>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
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

        </div>
      ) : null}
      {isDeleteConfirmation && (
        <ConfirmationModal
          show={isDeleteConfirmation}
          onHide={() => {
            setIsDeleteConfirmation(false);
            setDeleteItemIds([]);
          }}
          handleSubmit={handleDeleteSubmit}
          title={deleteItemIds.length > 1 ? "Delete Price Lists" : "Delete this Price List"}
          message={`Are you sure you want to delete ${deleteItemIds.length > 1 ? "these price lists" : "this price list"}?`}
          btn1="CANCEL"
          btn2="DELETE"
        />
      )}
      {isPriceListItemShow && (
        <PriceListItemView
          show={isPriceListItemShow}
          onHide={() => setIsPriceListItemShow(false)}
          title={"Price List Item"}
          btn1={"Cancel"}
          btn2={"Save"}
          passDataInAddItem={passDataInAddItem}
        />
      )}
      {isCreateModel && (
        <CreatePriceListView
          show={isCreateModel}
          onHide={() => {
            setIsCreateModel(false);
            // setSearchTermFromRightSide("");
          }}
          setLoading={setLoading}
          headerName="Create Price List"
          handelRefreshProduct={handelRefreshProduct}
          productToEdit={undefined}
        />
      )}
      {isUpdateModel && (
        <CreatePriceListView
          show={isUpdateModel}
          onHide={() => {
            setIsUpdateModel(false);
            // setSearchTermFromRightSide("");
          }}
          setLoading={setLoading}
          headerName="Update Price List"
          handelRefreshProduct={handelRefreshProduct}
          productToEdit={editableProduct}
        />
      )}
    </>
  );
};

export default PriceListView;