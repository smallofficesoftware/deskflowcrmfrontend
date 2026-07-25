import { useEffect, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { SingleValue } from "react-select";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import CustomSearchDropdown from "../../../../../components/CustomSearchDropdown";
import AddCategoryModal from "../../../../../components/model/AddCategoryModal";
import ConfirmationModal from "../../../../../components/model/ConfirmationModal";
import { useTheme } from "../../../../../components/ThemeContext";
import {
  DEFAULT_MESSAGE_ERROR_PERMISSION
} from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import { IOption } from "../../../../../helpers/AppInterface";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import AddAreaView from "./AddAreaView";
import {
  fetchAreasApi,
  fetchCitiesApi,
  fetchCountriesApi,
  fetchStatesApi,
  handleDeleteAreas,
  IAreasView,
  ICitiesView,
  ICountriesView,
  IStatesView
} from "./AreasController";

interface IPropsAreas {
  isAreasView: boolean;
  closeAreasView: () => void;
}

const AreasView = ({ isAreasView, closeAreasView }: IPropsAreas) => {
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  const [areasList, setAreasList] = useState<IAreasView[]>([]);
  const [countriesList, setCountriesList] = useState<ICountriesView[]>([]);
  const [statesList, setStatesList] = useState<IStatesView[]>([]);
  const [citiesList, setCitiesList] = useState<ICitiesView[]>([]);
  // const [areaInput, setAreaInput] = useState("");
  const [countryIdInput, setCountryIdInput] = useState<number | null>(null);
  const [stateIdInput, setStateIdInput] = useState<number | null>(null);
  const [cityIdInput, setCityIdInput] = useState<number | null>(null);
  const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
  // const [isEditing, setIsEditing] = useState<boolean>(false);
  // const [editAreaId, setEditAreaId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const { darkMode } = useTheme();
  const areaRefDropdown = useRef<HTMLButtonElement>(null);
  const dropdownAreaRef = useRef<Record<number, HTMLUListElement | null>>({});
  const actionDropdownRef = useRef<HTMLUListElement>(null);
  const [areaDropdown, setAreaDropdown] = useState<Record<number, boolean>>({});
  // const [hasIdAvail, setHasIdAvail] = useState<number | undefined>(undefined);
  const [deleteItemIds, setDeleteItemIds] = useState<number[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);
  // const [areaError, setAreaError] = useState("");
  const [countryError, setCountryError] = useState("");
  const [stateError, setStateError] = useState("");
  const [cityError, setCityError] = useState("");
  const [isOpenAddCountryModal, setIsOpenAddCountryModal] = useState(false)
  const [isOpenAddStateModal, setIsOpenAddStateModal] = useState(false)
  const [isOpenAddCityModal, setIsOpenAddCityModal] = useState(false)

  const [isCreateModel, setIsCreateModel] = useState<boolean>(false);
  const [isUpdateModel, setIsUpdateModel] = useState<boolean>(false);
  const [editableProduct, setEditableProduct] = useState<IAreasView>({
    id: 0,
    area_name: "",
    city_id: 0,
    state_id: 0,
    country_id: 0,
    isDelete: 0,
    isActive: 0,
  });

  const canView = useCheckUserPermission(PAGE_ID.AREAS, PERMISSION_TYPE.VIEW);
  const canAdd = useCheckUserPermission(PAGE_ID.AREAS, PERMISSION_TYPE.ADD);
  const canEdit = useCheckUserPermission(PAGE_ID.AREAS, PERMISSION_TYPE.EDIT);
  const canDelete = useCheckUserPermission(PAGE_ID.AREAS, PERMISSION_TYPE.DELETE);
  const canAddCountry = useCheckUserPermission(PAGE_ID.COUNTRIE, PERMISSION_TYPE.DELETE);
  const canAddstate = useCheckUserPermission(PAGE_ID.STATES, PERMISSION_TYPE.DELETE);
  const canAddCity = useCheckUserPermission(PAGE_ID.CITIES, PERMISSION_TYPE.DELETE);


  useEscapeKey(closeAreasView);

  // const handleChange = (event: TOnChangeInput) => {
  //   const value = event.target.value;
  //   setAreaInput(value);
  //   setAreaError(value ? "" : "Area name is required");
  // };

  const handleCountryChange = (selectedOption: SingleValue<IOption>) => {
    const newCountryId = selectedOption ? Number(selectedOption.value) : null;
    setCountryIdInput(newCountryId);
    setCountryError(selectedOption ? "" : "Country is required");
    setStateIdInput(null);
    setCityIdInput(null);
    setStateError("");
    setCityError("");
    setAreasList([]);
    if (newCountryId && canView) {
      fetchStatesApi(setStatesList, setLoading, newCountryId);
      fetchCitiesApi(setCitiesList, setLoading, newCountryId, null);
      fetchAreasApi(setAreasList, setLoading, newCountryId, null, null);
    } else {
      setStatesList([]);
      setCitiesList([]);
      setAreasList([]);
    }
  };

  const handleStateChange = (selectedOption: SingleValue<IOption>) => {
    const newStateId = selectedOption ? Number(selectedOption.value) : null;
    setStateIdInput(newStateId);
    setStateError(selectedOption ? "" : "State is required");
    setCityIdInput(null);
    setCityError("");
    setAreasList([]);
    if (newStateId && countryIdInput && canView) {
      fetchCitiesApi(setCitiesList, setLoading, countryIdInput, newStateId);
      fetchAreasApi(setAreasList, setLoading, countryIdInput, newStateId, null);
    } else {
      setCitiesList([]);
      setAreasList([]);
    }
  };

  const handleCityChange = (selectedOption: SingleValue<IOption>) => {
    const newCityId = selectedOption ? Number(selectedOption.value) : null;
    setCityIdInput(newCityId);
    setCityError(selectedOption ? "" : "City is required");
    if (newCityId && countryIdInput && stateIdInput && canView) {
      fetchAreasApi(setAreasList, setLoading, countryIdInput, stateIdInput, newCityId);
    } else {
      setAreasList([]);
    }
  };

  // const clearForm = () => {
  //   setAreaInput("");
  //   setIsEditing(false);
  //   setEditAreaId(undefined);
  //   setAreaError("");
  //   setCountryError("");
  //   setStateError("");
  //   setCityError("");
  // };

  // const handleSubmit = () => {
  //   if (areaInput.trim() === "") {
  //     setAreaError("Area name is required");
  //     return;
  //   }
  //   if (!countryIdInput) {
  //     setCountryError("Country is required");
  //     return;
  //   }
  //   if (!stateIdInput) {
  //     setStateError("State is required");
  //     return;
  //   }
  //   if (!cityIdInput) {
  //     setCityError("City is required");
  //     return;
  //   }

  //   if (isEditing && editAreaId !== undefined) {
  //     if (!canEdit) {
  //       toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
  //       return;
  //     }
  //     updateAreas(
  //       {
  //         area_name: areaInput,
  //         city_id: cityIdInput,
  //         state_id: stateIdInput,
  //         country_id: countryIdInput,
  //       },
  //       setLoading,
  //       editAreaId,
  //       clearForm
  //     );
  //   } else {
  //     if (!canAdd) {
  //       toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
  //       return;
  //     }
  //     createAreas(
  //       {
  //         area_name: areaInput,
  //         city_id: cityIdInput,
  //         state_id: stateIdInput,
  //         country_id: countryIdInput,
  //       },
  //       setLoading,
  //       clearForm
  //     );
  //   }
  // };


  const toggleDropdownAreas = (areaId: number | undefined) => {
    if (areaId === undefined) return;

    setIsActionDropdownOpen(false);


    setOpenDropdownId((prevId) => {
      return prevId === areaId ? null : areaId;
    });
  };

  const handleEdit = (item: IAreasView) => {
    setOpenDropdownId(null);
    if (canEdit) {
      // setAreaDropdown({});
      // setAreaError("");
      // setCountryError("");
      // setStateError("");
      // setCityError("");
      // setAreaInput(item.area_name);
      // setCountryIdInput(item.country_id);
      // setStateIdInput(item.state_id);
      // setCityIdInput(item.city_id);
      // setIsEditing(true);
      // setEditAreaId(item.id);
      // if (item.country_id && canView) {
      //   fetchStatesApi(setStatesList, setLoading, item.country_id);
      //   fetchCitiesApi(setCitiesList, setLoading, item.country_id, item.state_id);
      // }
      setEditableProduct(item);
      setIsUpdateModel(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };


  // const handleClickOutside = (event: MouseEvent) => {
  //   const target = event.target as Node;

  //   const isDropdownButton = (target as HTMLElement).closest('.source-of-type-list-grid-options');
  //   if (isDropdownButton) {
  //     return;
  //   }

  //   const isOutsideDropdown =
  //     !Object.values(dropdownAreaRef.current).some(
  //       (ref) => ref && ref.contains(target)
  //     ) &&
  //     (!areaRefDropdown.current ||
  //       !areaRefDropdown.current.contains(target)) &&
  //     (!actionDropdownRef.current ||
  //       !actionDropdownRef.current.contains(target));
  //   if (isOutsideDropdown) {
  //     setOpenDropdownId(null);
  //     setIsActionDropdownOpen(false);
  //   }
  // };

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    const clickedOnButton = target.closest('.source-of-type-list-grid-options');
    if (clickedOnButton) return;

    const clickedInsideDropdown = Object.values(dropdownAreaRef.current).some(
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
      setAreaDropdown({});
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
      const totalSelectable = areasList.filter((a) => a.id !== -1).length;
      setIsAllSelected(newSelected.length === totalSelectable);
      return newSelected;
    });
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
      setIsAllSelected(false);
    } else {
      const allIds = areasList
        .map((a) => a.id)
        .filter((id): id is number => id !== -1 && id !== undefined);
      setSelectedIds(allIds);
      setIsAllSelected(true);
    }
  };

  const openDeleteSelected = () => {
    if (selectedIds.length === 0) {
      toast.error("No areas selected");
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

    await handleDeleteAreas(
      deleteItemIds,
      setIsDeleteConfirmation,
      setAreasList,
      setLoading,
      countryIdInput,
      stateIdInput,
      cityIdInput
    );

    setIsDeleteConfirmation(false);
    setDeleteItemIds([]);
    setSelectedIds([]);
    setIsAllSelected(false);
  };

  useEffect(() => {
    fetchCountriesApi(setCountriesList, setLoading);
  }, [setCountriesList, setLoading])

  const handleRefreshAreas = async () => {
    await fetchCountriesApi(setCountriesList, setLoading);
    if (countryIdInput) {
      await fetchStatesApi(setStatesList, setLoading, countryIdInput);
      if (stateIdInput) {
        await fetchCitiesApi(setCitiesList, setLoading, countryIdInput, stateIdInput);
        await fetchAreasApi(setAreasList, setLoading, countryIdInput, stateIdInput, cityIdInput);
      } else {
        setCitiesList([]);
        setAreasList([]);
      }
    } else {
      setStatesList([]);
      setCitiesList([]);
      setAreasList([]);
    }
  };

  const countryOptions = countriesList.map((country) => ({
    value: String(country.id),
    label: country.country_name,
  }));

  const stateOptions = statesList
    .filter((state) => (countryIdInput ? state.country_id === countryIdInput : true))
    .map((state) => ({
      value: String(state.id),
      label: state.state_name,
    }));

  const cityOptions = citiesList
    .filter((city) => (stateIdInput ? city.state_id === stateIdInput : true))
    .map((city) => ({
      value: String(city.id),
      label: city.city_name,
    }));

  const openAddAreaView = () => {
    if (canAdd) {
      setIsCreateModel(true);
    } else {
      setIsCreateModel(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  }

  return (
    <>
      {isAreasView ? (
        <div className="notifications animate__animated animate__fadeInLeft" id="notifications">
          <style>
            {`
              .table-container {
                width: 100%;
                overflow-x: auto;
              }
              .table {
                table-layout: fixed;
                width: 100%;
                border-collapse: collapse;
              }
              .table th, .table td {
                padding: 8px;
                text-align: left;
                vertical-align: middle;
                width: auto;
              }
              .checkbox-column {
                width: 10% !important;
              }
              .country-state-city-column {
                width: 35% !important;
                white-space: normal;
                word-wrap: break-word;
                position: relative;
              }
              .area-name-column {
                width: 40% !important;
                white-space: normal;
                word-wrap: break-word;
                position: relative;
              }
              .action-column {
                width: 15% !important;
                text-align: right;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }
              .source-of-types-options {
                position: absolute;
                z-index: 1000;
                background: ${darkMode ? "#333" : "#fff"};
                border: 1px solid ${darkMode ? "#555" : "#ccc"};
                border-radius: 4px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                width: 120px;
                right: 10px;
              }
              .source-of-types-options.isVisible {
                display: block;
              }
              .source-of-types-options.isHidden {
                display: none;
              }
              .source-of-types-options li {
                padding: 8px;
                cursor: pointer;
              }
              .source-of-types-options li:last-child {
                border-bottom: none;
              }
              .source-of-types-options li:hover {
                background: ${darkMode ? "#444" : "#f0f0f0"};
              }
              .search-bar {
                display: flex;
                align-items: center;
                gap: 10px;
              }
              .truncate-text {
                display: block;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                cursor: pointer;
              }
              .truncate-wrapper {
                position: relative;
                display: inline-block;
                width: 100%;
              }
    
              .truncate-wrapper:hover .hover-tooltip {
                display: block;
              }
    
              .hover-tooltip {
                display: none;
                position: absolute;
                left: 0;
                top: calc(100% + 4px);
                background: ${darkMode ? "#2a2a2a" : "#fff"};
                color: ${darkMode ? "#fff" : "#000"};
                z-index: 10000;
                padding: 8px 12px;
                border: 1px solid ${darkMode ? "#555" : "#ccc"};
                border-radius: 4px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                max-width: 300px;
                min-width: 150px;
                white-space: normal;
                word-wrap: break-word;
                pointer-events: none;
              }
            `}
          </style>
          <div className="header-Chat">
            <div className="ICON">
              <button
                aria-disabled="false"
                role="button"
                className="icons"
                data-tab="2"
                title="Back"
                aria-label="Back to previous view"
                onClick={closeAreasView}
              >
                <span data-testid="chat" data-icon="chat" className="">
                  <svg viewBox="0 0 24 24" width="24" height="24" className="">
                    <path
                      fill="currentColor"
                      d="m12 4 1.4 1.4L7.8 11H20v2H7.8l5.6 5.6L12 20l-8-8 8-8z"
                    ></path>
                  </svg>
                </span>
              </button>
            </div>
            <div className="newText">
              <h2>Areas</h2>
            </div>
            <div className="col-8 text-end mb-2">
              <div className="ICON" style={{ position: "absolute", right: "60px" }}>
                <button
                  className="icons"
                  onClick={openAddAreaView}
                  title="Add Area"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="30px"
                    viewBox="0 -960 960 960"
                    width="30px"
                    fill="#fff"
                    aria-hidden="true"
                  >
                    <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                  </svg>
                </button>
              </div>
              <div className="ICON" style={{ position: "absolute", right: "20px" }}>
                <button
                  className="icons"
                  onClick={handleRefreshAreas}
                  title="Refresh Areas"
                >
                  <svg width="30" height="30" viewBox="0 0 50 50" aria-label="Refresh">
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
                {canView ? (
                  <>
                    <div className="head" style={{ display: "block" }}>
                      <div className="col-12 mt-1">
                        <label className="form-check-label">
                          <h4>
                            Country
                          </h4>
                        </label>
                        {canAddCountry &&
                          <span className="ms-2" style={{ cursor: "pointer" }} onClick={() => setIsOpenAddCountryModal(true)}>
                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" /></svg>
                          </span>
                        }


                        <CustomSearchDropdown
                          options={countryOptions}
                          value={
                            countryOptions.find((option) => option.value === String(countryIdInput)) || null
                          }
                          onChange={handleCountryChange}
                          className="w-100"
                        />
                        {countryError && <span className="text-danger">{countryError}</span>}
                      </div>
                      <div className="col-12 mt-1">
                        <label className="form-check-label">
                          <h4>
                            State
                          </h4>
                        </label>

                        {
                          countryIdInput && canAddstate && <span className="ms-2" style={{ cursor: "pointer" }} onClick={() => setIsOpenAddStateModal(true)}>
                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" /></svg>
                          </span>
                        }
                        <CustomSearchDropdown
                          options={stateOptions}
                          value={
                            stateOptions.find((option) => option.value === String(stateIdInput)) || null
                          }
                          onChange={handleStateChange}
                          className="w-100"
                          isDisabled={!countryIdInput}
                        />
                        {stateError && <span className="text-danger">{stateError}</span>}
                      </div>
                      <div className="col-12 mt-1">
                        <label className="form-check-label">
                          <h4>
                            City
                          </h4>
                        </label>
                        {stateIdInput && canAddCity && <span className="ms-2" style={{ cursor: "pointer" }} onClick={() => setIsOpenAddCityModal(true)}>
                          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" /></svg>
                        </span>}
                        <CustomSearchDropdown
                          options={cityOptions}
                          value={
                            cityOptions.find((option) => option.value === String(cityIdInput)) || null
                          }
                          onChange={handleCityChange}
                          className="w-100"
                          isDisabled={!stateIdInput}
                        />
                        {cityError && <span className="text-danger">{cityError}</span>}
                      </div>
                      {/* <div className="col-12 mt-1">
                        <label className="form-check-label">
                          <h4>
                            Area Name <span className="text-danger">*</span>
                          </h4>
                        </label>
                        <div className="search-bar">
                          <div className="add-source-of-type-section" style={{ width: "90%" }}>
                            <input
                              type="text"
                              title="Add Area Name"
                              placeholder="Add Area Name"
                              maxLength={SMALL_TEXT_LENGTH}
                              value={areaInput}
                              onChange={handleChange}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleSubmit();
                                }
                              }}
                            />
                          </div>
                          <div className="add-source-of-type-section" style={{ width: "10%" }}>
                            <button className="btn" onClick={handleSubmit} aria-label={isEditing ? "Update Area" : "Add Area"}>
                              <span>
                                {isEditing ? (
                                  <svg data-name="Layer 1" height={24} viewBox="0 0 200 200" aria-hidden="true">
                                    <path
                                      fill="currentColor"
                                      d="M177.68,43.9c-4.5-3.5-10.5-3-14,1.5l-74,89.5-55-40c-4.5-3-10.5-2.5-14,2-3,4.5-2.5,10.5,2,14l62.5,45.5a.49.49,0,0,1,.5.5c.5,0,.5.5,1,.5s.5.5,1,.5.5,0,1,.5h6c.5,0,.5,0,1-.5.5,0,.5-.5,1-.5s.5-.5,1-.5.5-.5,1-.5a.49.49,0,0,0,.5-.5l.5-.5,80-97C182.18,53.9,181.68,47.4,177.68,43.9Z"
                                    />
                                  </svg>
                                ) : (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    height="26px"
                                    viewBox="0 -960 960 960"
                                    width="26px"
                                    fill="#5f6368"
                                    aria-hidden="true"
                                  >
                                    <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                                  </svg>
                                )}
                              </span>
                            </button>
                          </div>
                        </div>
                        {areaError && <span className="text-danger">{areaError}</span>}
                      </div> */}
                    </div>
                    <div className="table-container">
                      {loading ? (
                        Array.from({ length: 12 }).map((_, index) => (
                          <tr key={index}>
                            <td className="checkbox-column">
                              <Skeleton
                                width="24px"
                                height="24px"
                                duration={5}
                                borderRadius={50}
                                style={{ opacity: darkMode ? "" : 0.8 }}
                              />
                            </td>
                            <td className="country-state-city-column">
                              <Skeleton
                                width="100%"
                                height="25px"
                                duration={5}
                                borderRadius={50}
                                style={{ opacity: darkMode ? "" : 0.8 }}
                              />
                            </td>
                            <td className="area-name-column">
                              <Skeleton
                                width="100%"
                                height="25px"
                                duration={5}
                                borderRadius={50}
                                style={{ opacity: darkMode ? "" : 0.8 }}
                              />
                            </td>
                            <td className="action-column">
                              <Skeleton
                                width="24px"
                                height="24px"
                                duration={5}
                                borderRadius={50}
                                style={{ opacity: darkMode ? "" : 0.8 }}
                              />
                            </td>
                          </tr>
                        ))
                      ) : (
                        <div className="source-of-type-list-grid-block">
                          <div className="source-of-type-list-grid-main">
                            <table className="table table-bordered table-sm">
                              <thead>
                                <tr>
                                  <th className="checkbox-column">
                                    {selectedIds.length > 0 && (
                                      <span className="selected-btn rounded-5">
                                        <input
                                          type="checkbox"
                                          className="custom-checkbox"
                                          checked={isAllSelected}
                                          title="Select All Areas"
                                          onChange={handleSelectAll}
                                          style={{ margin: "0 6px" }}
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
                                                className="listItem-contact-tabs mb-1"
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
                                                Delete Selected Areas
                                              </li>
                                            </ul>
                                          )}
                                        </div>
                                      </span>
                                    )}
                                  </th>
                                  <th className="country-state-city-column">Country/State/City</th>
                                  <th className="area-name-column">Area Name</th>
                                  <th className="action-column">Options</th>
                                </tr>
                              </thead>
                              <tbody>
                                {areasList.length === 0 ? (
                                  <tr>
                                    <td colSpan={4} className="text-center pt-5">
                                      No Data Found
                                    </td>
                                  </tr>
                                ) : (
                                  areasList.map((item, index) => {
                                    const city = citiesList.find((c) => c?.id === item.city_id);
                                    const state = statesList.find((s) => s?.id === item.state_id);
                                    const country = countriesList.find((c) => c?.id === item.country_id);
                                    return (
                                      <tr key={index}>
                                        <td className="checkbox-column">
                                          {item.id !== -1 && (
                                            <input
                                              type="checkbox"
                                              className="custom-checkbox"
                                              checked={selectedIds.includes(item.id)}
                                              onChange={() => toggleSelection(item.id)}
                                              style={{ margin: "0 6px" }}
                                            />
                                          )}
                                        </td>
                                        <td className="country-state-city-column">
                                          <div className="truncate-wrapper">
                                            <span className="truncate-text">
                                              {country ? country.country_name : "Unknown"}
                                              {state ? ` / ${state.state_name}` : " / Unknown"}
                                              {city ? ` / ${city.city_name}` : " / Unknown"}
                                            </span>
                                            <div className="hover-tooltip">
                                              {country ? country.country_name : "Unknown"}
                                              {state ? ` / ${state.state_name}` : " / Unknown"}
                                              {city ? ` / ${city.city_name}` : " / Unknown"}
                                            </div>
                                          </div>
                                        </td>
                                        <td className="area-name-column">
                                          <div className="truncate-wrapper">
                                            <span className="truncate-text">
                                              {item.area_name}
                                            </span>
                                            <div className="hover-tooltip">
                                              {item.area_name}
                                            </div>
                                          </div>
                                        </td>
                                        <td className="action-column">
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
                                                  toggleDropdownAreas(item.id)
                                                }}
                                                ref={areaRefDropdown}
                                                aria-label={`Options for ${item.area_name}`}
                                                aria-expanded={areaDropdown[item.id]}
                                              >
                                                <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                                                  <path
                                                    fill="currentColor"
                                                    d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z"
                                                  ></path>
                                                </svg>
                                              </button>
                                              <ul
                                                className={`source-of-types-options-status source-of-types-options ${openDropdownId === item.id ? "isVisible" : "isHidden"
                                                  }`}
                                                id="dropLeft"
                                                ref={(el) => (dropdownAreaRef.current[item.id] = el)}
                                              >

                                                <li
                                                  className="listItem"
                                                  role="menuitem"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenDropdownId(null);
                                                    handleEdit(item)
                                                  }}
                                                  onKeyDown={(e) => e.key === "Enter" && handleEdit(item)}
                                                  tabIndex={0}
                                                  aria-label={`Edit ${item.area_name}`}
                                                >
                                                  Edit
                                                </li>
                                                <li
                                                  style={{ color: "red", fontWeight: "600" }}
                                                  className="listItem"
                                                  role="menuitem"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenDropdownId(null);
                                                    handleDelete(item.id)
                                                  }}
                                                  onKeyDown={(e) => e.key === "Enter" && handleDelete(item.id)}
                                                  tabIndex={0}
                                                  aria-label={`Delete ${item.area_name}`}
                                                >
                                                  Delete
                                                </li>
                                              </ul>
                                            </>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
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
              title={deleteItemIds.length > 1 ? "Delete Areas" : "Delete this Area"}
              message={`Are you sure you want to delete ${deleteItemIds.length > 1 ? "these areas" : "this area"}?`}
              btn1="CANCEL"
              btn2="DELETE"
            />
          )}
        </div>
      ) : null}
      {
        isOpenAddCountryModal && <AddCategoryModal
          show={isOpenAddCountryModal}
          onHide={() => {
            setIsOpenAddCountryModal(false); fetchCountriesApi(setCountriesList, setLoading);
            if (!countryIdInput) {
              setStatesList([]);
            }
          }}
          title="Add Country"
          btn1="Cancel"
          btn2="Add"
          displayClearButton={true}
          payloadKey="addCountry"
          dynamicFields={[
            { name: "country_name", placeholder: "Enter Country Name", label: "Country Name" },
            { name: "country_code", placeholder: "Enter Country Code", label: "Country Code" },
            { name: "country_iso", placeholder: "Enter Country ISO", label: "Country ISO" },
          ]}
        />
      }
      {
        isOpenAddStateModal && <AddCategoryModal
          show={isOpenAddStateModal}
          onHide={async () => {
            setIsOpenAddStateModal(false); await fetchStatesApi(setStatesList, setLoading, countryIdInput);
          }}
          title="Add State"
          btn1="Cancel"
          btn2="Add"
          placeholder="Enter State Name"
          displayClearButton={true}
          payloadKey="addState"
          extraPayloadFields={{ "country_id": countryIdInput }}
        />
      }
      {
        isOpenAddCityModal && <AddCategoryModal
          show={isOpenAddCityModal}
          onHide={async () => {
            setIsOpenAddCityModal(false); await fetchStatesApi(setStatesList, setLoading, countryIdInput);
            await fetchCitiesApi(
              setCitiesList,
              setLoading,
              countryIdInput,
              stateIdInput
            );
          }}
          title="Add City"
          btn1="Cancel"
          btn2="Add"
          placeholder="Enter City Name"
          displayClearButton={true}
          payloadKey="addCity"
          extraPayloadFields={{ "country_id": countryIdInput, "state_id": stateIdInput }}
        />
      }
      {isCreateModel && (
        <AddAreaView
          show={isCreateModel}
          onHide={() => {
            setIsCreateModel(false);
            // setSearchTermFromRightSide("");
          }}
          setLoading={setLoading}
          headerName="Add Area"
          productToEdit={undefined}
          handleRefreshAreas={handleRefreshAreas}
          handleOutsideCountryChange={handleCountryChange}
          handleOutsideStateChange={handleStateChange}
          handleOutsideCityChange={handleCityChange}
        />
      )}
      {isUpdateModel && (
        <AddAreaView
          show={isUpdateModel}
          onHide={() => {
            setIsUpdateModel(false);
            // setSearchTermFromRightSide("");
          }}
          setLoading={setLoading}
          headerName="Update Area"
          productToEdit={editableProduct}
          handleRefreshAreas={handleRefreshAreas}
          handleOutsideCountryChange={handleCountryChange}
          handleOutsideStateChange={handleStateChange}
          handleOutsideCityChange={handleCityChange}
        />
      )}
    </>
  );
};

export default AreasView;