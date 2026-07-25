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
import CreateExpenseTypeView from "./CreateExpenseTypeView";
import {
  fetchExpenseTypeApi,
  handleDeleteExpenseType,
  IExpenseTypeView
} from "./ExpenseTypeController";

interface IPropsExpenseTypeView {
  isExpenseTypeView: boolean;
  closeExpenseTypeView: () => void;
}

const ExpenseTypeView = ({
  isExpenseTypeView,
  closeExpenseTypeView,
}: IPropsExpenseTypeView) => {
  const [expenseTypeLists, setExpenseTypeList] = useState<IExpenseTypeView[]>(
    [],
  );
  // const [expenseTypeInput, setExpenseTypeInput] = useState("");
  // const [expenseTypeHexColorInput, setExpenseTypeHexColorInput] =
  //   useState("#999999");
  const [loading, setLoading] = useState(false);
  const { darkMode } = useTheme();
  const dropdownContactRef = useRef<Record<number, HTMLUListElement | null>>(
    {},
  );
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  // const [expenseTypeDropdown, setExpenseTypeDropdown] = useState<any>({});
  const [deleteItemIds, setDeleteItemIds] = useState<number[]>([]);
  const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
  // const [isEditing, setIsEditing] = useState<boolean>(false);
  // const [editExpenseTypeId, setEditExpenseTypeId] = useState<
  //   number | undefined
  // >(undefined);
  // const [expenseTypeError, setExpenseTypeError] = useState("");
  // const isUserChangingSubTypeRef = useRef(false);
  const actionDropdownRef = useRef<HTMLUListElement>(null);
  const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // const [expenseSubType, setExpenseSubType] = useState<number>(1);

  // General fields
  // const [minTime, setMinTime] = useState<any>(null);
  // const [maxTime, setMaxTime] = useState<any>(null);
  // const maxTimeRef = useRef<any>(null);
  // const [minAmount, setMinAmount] = useState<string>("");
  // const [maxAmount, setMaxAmount] = useState<string>("");
  // const [fixedAmount, setFixedAmount] = useState<string>("");

  // Kilometer field
  // const [amountPerKm, setAmountPerKm] = useState<string>("");

  // Common
  // const [isImageRequired, setIsImageRequired] = useState<number>(2);

  // Add near other state declarations
  // const [minTimeError, setMinTimeError] = useState<string>("");
  // const [maxTimeError, setMaxTimeError] = useState<string>("");
  // const [minAmountError, setMinAmountError] = useState<string>("");
  // const [fixAmountError, setFixAmountError] = useState<string>("");
  // const [maxAmountError, setMaxAmountError] = useState<string>("");
  // const [kiloAmountError, setKiloAmountError] = useState<string>("");

  const [isCreateModel, setIsCreateModel] = useState<boolean>(false);
  const [isUpdateModel, setIsUpdateModel] = useState<boolean>(false);
  const [editableExpenseType, setEditableExpenseType] = useState<IExpenseTypeView>({
    id: 0,
    expense_name: "",
    color: "",
    expense_subtype: 0,
    compulsory_image: 0,
    min_time: "",
    max_time: "",
    min_amount: 0,
    max_amount: 0,
    fix_amount: 0,
    amount_per_km: 0,
    created_date_time: "",
  });

  const canView = useCheckUserPermission(
    PAGE_ID.EXPENSE_TYPE,
    PERMISSION_TYPE.VIEW,
  );
  const canAdd = useCheckUserPermission(
    PAGE_ID.EXPENSE_TYPE,
    PERMISSION_TYPE.ADD,
  );
  const canEdit = useCheckUserPermission(
    PAGE_ID.EXPENSE_TYPE,
    PERMISSION_TYPE.EDIT,
  );
  const canDelete = useCheckUserPermission(
    PAGE_ID.EXPENSE_TYPE,
    PERMISSION_TYPE.DELETE,
  );

  useEscapeKey(closeExpenseTypeView);

  // const EXPENSE_SUB_TYPES = [
  //   { id: 1, name: "General" },
  //   { id: 2, name: "Kilometer" },
  // ];
  // const COMPULSORY_IMAGE = [
  //   { id: 1, name: "Yes" },
  //   { id: 2, name: "No" },
  // ];

  // const handelChange = (event: TOnChangeInput) => {
  //   const value = event.target.value;
  //   setExpenseTypeInput(value);
  //   setExpenseTypeError(value ? "" : "Expense Type name is required");
  // };

  // const handelChangeHexColor = (event: TOnChangeInput) => {
  //   setExpenseTypeHexColorInput(event.target.value);
  // };

  // const clearForm = () => {
  //   setExpenseTypeInput("");
  //   setExpenseTypeHexColorInput("#999999");
  //   setIsEditing(false);
  //   setEditExpenseTypeId(undefined);
  //   setExpenseSubType(1);
  //   setIsImageRequired(2);
  //   setMinTime(null);
  //   setMaxTime(null);
  //   setMinAmount("");
  //   setMaxAmount("");
  //   setFixedAmount("");
  //   setAmountPerKm("");
  //   setExpenseTypeError("");
  //   setMinTimeError("");
  //   setMaxTimeError("");
  //   setMinAmountError("");
  //   setMaxAmountError("");
  //   setFixAmountError("");
  //   setKiloAmountError("");
  // };

  // const hasFormErrors =
  //   Boolean(expenseTypeError) ||
  //   Boolean(maxTimeError) ||
  //   Boolean(minAmountError) ||
  //   Boolean(maxAmountError) ||
  //   Boolean(fixAmountError) ||
  //   Boolean(kiloAmountError);

  // const handelSubmit = () => {
  //   if (hasFormErrors) {
  //     toast.error("Please fix validation errors before submitting");
  //     return;
  //   }
  //   // if (isTimeMissingForSubType1) {
  //   //   toast.error("Please fix time validation errors before submitting");
  //   //   return;
  //   // }
  //   if (expenseTypeInput.trim() === "") {
  //     setExpenseTypeError("Expense Type name is required");
  //     return;
  //   }

  //   setExpenseTypeError("");

  //   const minTimeFormatted = minTime
  //     ? `${String(minTime.hour).padStart(2, "0")}:${String(minTime.minute).padStart(2, "0")}:00`
  //     : undefined;
  //   const maxTimeFormatted = maxTime
  //     ? `${String(maxTime.hour).padStart(2, "0")}:${String(maxTime.minute).padStart(2, "0")}:00`
  //     : undefined;
  //   const minAmountNum = minAmount !== "" ? Number(minAmount) : undefined;
  //   const maxAmountNum = maxAmount !== "" ? Number(maxAmount) : undefined;
  //   const fixedAmountNum = fixedAmount !== "" ? Number(fixedAmount) : undefined;
  //   const amountPerKmNum = amountPerKm !== "" ? Number(amountPerKm) : undefined;

  //   if (expenseTypeInput) {
  //     if (isEditing && editExpenseTypeId !== undefined) {
  //       updateExpenseType(
  //         {
  //           expense_name: expenseTypeInput,
  //           color: expenseTypeHexColorInput,
  //           expense_subtype: expenseSubType,
  //           compulsory_image: isImageRequired,
  //           min_time: minTimeFormatted,
  //           max_time: maxTimeFormatted,
  //           min_amount: minAmountNum,
  //           max_amount: maxAmountNum,
  //           fix_amount: fixedAmountNum,
  //           amount_per_km: amountPerKmNum,
  //         },
  //         editExpenseTypeId,
  //         setLoading,
  //         clearForm,
  //       );
  //     } else {
  //       if (!canAdd) {
  //         toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
  //         return;
  //       }
  //       createExpenseType(
  //         {
  //           expense_name: expenseTypeInput,
  //           color: expenseTypeHexColorInput,
  //           expense_subtype: expenseSubType,
  //           compulsory_image: isImageRequired,
  //           min_time: minTimeFormatted,
  //           max_time: maxTimeFormatted,
  //           min_amount: minAmountNum,
  //           max_amount: maxAmountNum,
  //           fix_amount: fixedAmountNum,
  //           amount_per_km: amountPerKmNum,
  //         },
  //         setLoading,
  //         clearForm,
  //       );
  //     }
  //   }
  // };

  const toggleDropdownExpenseType = (expenseTypeId: number | undefined) => {
    if (expenseTypeId === undefined) return;

    setIsActionDropdownOpen(false);

    setOpenDropdownId((prevId) => {
      return prevId === expenseTypeId ? null : expenseTypeId;
    });
  };

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    const clickedOnButton = target.closest(".source-of-type-list-grid-options");
    if (clickedOnButton) return;

    const clickedInsideDropdown = Object.values(
      dropdownContactRef.current,
    ).some((ref) => ref && ref.contains(target));

    const clickedInsideActionDropdown =
      actionDropdownRef.current?.contains(target) ||
      target.closest(".selected-btn");

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
    if (canView && isExpenseTypeView) {
      fetchExpenseTypeApi(setExpenseTypeList, setLoading);
    }
  }, [isExpenseTypeView, canView]);

  // useEffect(() => {
  //   // Reset only if USER changed subtype
  //   if (!isUserChangingSubTypeRef.current) return;

  //   if (expenseSubType === 1) {
  //     // General → clear KM fields
  //     setAmountPerKm("");
  //     setKiloAmountError("");
  //   }

  //   if (expenseSubType === 2) {
  //     // Kilometer → clear General fields
  //     setMinTime(null);
  //     setMaxTime(null);
  //     setMinAmount("");
  //     setMaxAmount("");
  //     setFixedAmount("");
  //     setMinTimeError("");
  //     setMaxTimeError("");
  //     setMinAmountError("");
  //     setMaxAmountError("");
  //     setFixAmountError("");
  //   }

  //   // Reset the flag
  //   isUserChangingSubTypeRef.current = false;
  // }, [expenseSubType]);

  // const validateMinTime = (value: any) => {
  //   setMinTimeError("");
  // };

  const handleEdit = (item: IExpenseTypeView) => {
    setOpenDropdownId(null);
    if (canEdit) {
      // setExpenseTypeDropdown({});
      // setExpenseTypeInput(item.expense_name);
      // setExpenseTypeHexColorInput(item.color || "#999999");
      // setExpenseSubType(item.expense_subtype);
      // setIsImageRequired(item.compulsory_image);
      // setMinAmount(item.min_amount?.toString() ?? "");
      // setMaxAmount(item.max_amount?.toString() ?? "");
      // setFixedAmount(item.fix_amount?.toString() ?? "");
      // setAmountPerKm(item.amount_per_km?.toString() ?? "");
      setEditableExpenseType(item);
      // if (item.min_time) {
      //   const [h, m] = item.min_time.split(":");
      //   setMinTime(
      //     new DateObject().set({
      //       hour: Number(h),
      //       minute: Number(m),
      //     }),
      //   );
      // } else {
      //   setMinTime(null);
      // }

      // if (item.max_time) {
      //   const [h, m] = item.max_time.split(":");
      //   setMaxTime(
      //     new DateObject().set({
      //       hour: Number(h),
      //       minute: Number(m),
      //     }),
      //   );
      //   // })
      // } else {
      //   setMaxTime(null);
      // }
      // setIsEditing(true);
      // setEditExpenseTypeId(item.id);
      // setExpenseTypeError("");
      setIsUpdateModel(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleDelete = (itemId: number) => {
    setOpenDropdownId(null);
    if (canDelete) {
      // setExpenseTypeDropdown({});
      setDeleteItemIds([itemId]);
      setIsDeleteConfirmation(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleRefreshExpenseType = async () => {
    if (canView) {
      await fetchExpenseTypeApi(setExpenseTypeList, setLoading);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) => {
      const newSelected = prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [...prev, id];
      const totalSelectable = expenseTypeLists.filter(
        (c) => c.id !== -1,
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
      const allIds = expenseTypeLists
        .map((c) => c.id)
        .filter((id): id is number => id !== -1 && id !== undefined);
      setSelectedIds(allIds);
      setIsAllSelected(true);
    }
  };

  const openDeleteSelected = () => {
    if (selectedIds.length === 0) {
      toast.error("No expense types selected");
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

    await handleDeleteExpenseType(
      deleteItemIds,
      setIsDeleteConfirmation,
      setExpenseTypeList,
      setLoading,
    );
    setIsDeleteConfirmation(false);
    setDeleteItemIds([]);
    setSelectedIds([]);
    setIsAllSelected(false);
  };

  // const validateMaxTime = (min: any, max: any) => {
  //   setMaxTimeError("");

  //   if (!max || !min) return;

  //   const minMinutes = min.hour * 60 + min.minute;
  //   const maxMinutes = max.hour * 60 + max.minute;

  //   if (maxMinutes <= minMinutes) {
  //     setMaxTimeError("Max time must be greater than Min time");
  //   }
  // };

  // const validateMinAmount = (value: string) => {
  //   setMinAmountError("");

  //   if (!value) return; // allow empty for optional field

  //   const num = Number(value);
  //   if (isNaN(num)) {
  //     setMinAmountError("Must be a number");
  //     return;
  //   }
  //   if (num < 0) {
  //     setMinAmountError("Cannot be negative");
  //   }
  // };
  // const validateFixedAmount = (value: string) => {
  //   setFixAmountError("");

  //   if (!value) return; // allow empty for optional field

  //   const num = Number(value);
  //   if (isNaN(num)) {
  //     setFixAmountError("Must be a number");
  //     return;
  //   }
  //   if (num < 0) {
  //     setFixAmountError("Cannot be negative");
  //   }
  // };
  // const validateKilometerAmount = (value: string) => {
  //   setKiloAmountError("");

  //   if (!value) return; // allow empty for optional field

  //   const num = Number(value);
  //   if (isNaN(num)) {
  //     setKiloAmountError("Must be a number");
  //     return;
  //   }
  //   if (num < 0) {
  //     setKiloAmountError("Cannot be negative");
  //   }
  // };

  // const validateMaxAmount = (minVal: string, maxVal: string) => {
  //   setMaxAmountError("");

  //   if (!maxVal) return;

  //   const minNum = minVal ? Number(minVal) : null;
  //   const maxNum = Number(maxVal);

  //   if (isNaN(maxNum)) {
  //     setMaxAmountError("Must be a number");
  //     return;
  //   }

  //   if (maxNum < 0) {
  //     setMaxAmountError("Cannot be negative");
  //     return;
  //   }

  //   if (minNum !== null && maxNum < minNum) {
  //     setMaxAmountError("Max amount cannot be less than Min amount");
  //   }
  // };

  const openCreateExpenseType = () => {
    if (canAdd) {
      setIsCreateModel(true);
    } else {
      setIsCreateModel(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  }

  return (
    <>
      {isExpenseTypeView ? (
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
                onClick={closeExpenseTypeView}
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
              <h2>Expense Type</h2>
            </div>
            <div className="text-end mb-2">
              <div className="ICON"
                style={{
                  position: "absolute",
                  right: "60px"
                }}
              >
                <button
                  className="icons"
                  onClick={openCreateExpenseType}
                  title="Create Expense Type"
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
                  onClick={handleRefreshExpenseType}
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
                {/* <div className="head mx-2" style={{ display: "block" }}>
                  <label
                    className="form-check-label mx-2"
                    htmlFor="flexCheckDefault"
                  >
                    <h4>
                      Enter Expense Type Name
                      <span className="text-danger">*</span>
                    </h4>
                  </label>
                  <div className="col-12 d-flex">
                    <div className="search-bar">
                      <div className="add-source-of-type-section">
                        <input
                          type="text"
                          title="Expense Type"
                          placeholder="Add Expense Type"
                          maxLength={SMALL_TEXT_LENGTH}
                          value={expenseTypeInput}
                          onChange={(e) => handelChange(e)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handelSubmit();
                            }
                          }}
                        />
                      </div>
                    </div>
                    <div className="col-2 d-flex justify-content-end align-items-center">
                      <input
                        type="color"
                        value={expenseTypeHexColorInput}
                        className="mx-1 h-50 w-40"
                        onChange={(e) => handelChangeHexColor(e)}
                        onKeyDown={(e) => {
                          if (expenseTypeInput.trim() === "") {
                            setExpenseTypeError(
                              "Expense Type name is required",
                            );
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
                            <svg
                              data-name="Layer 1"
                              height={24}
                              id="Layer_1"
                              viewBox="0 0 200 200"
                            >
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
                            >
                              <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                            </svg>
                          )}
                        </span>
                      </button>
                    </div>
                  </div>
                  <div className="col-12 mx-2">
                    {expenseTypeError && (
                      <span className="text-danger">{expenseTypeError}</span>
                    )}
                  </div>
                  <div className="col-12 mt-2">
                    <label className="form-check-label">Expense Sub Type</label>
                    <select
                      className="form-select"
                      value={expenseSubType}
                      onChange={(e) => {
                        isUserChangingSubTypeRef.current = true;
                        setExpenseSubType(Number(e.target.value));
                      }}
                    >
                      {EXPENSE_SUB_TYPES.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {expenseSubType === 1 && (
                    <div className="row mt-3">
                      <div className="col-6 mb-2">
                        <label className="form-check-label">Minimum Time</label>
                        <DatePicker
                          value={minTime}
                          onChange={(value) => {
                            setMinTime(value);
                            // Also re-validate max time if it exists
                            if (maxTime) validateMaxTime(value, maxTime);
                          }}
                          disableDayPicker
                          format="HH:mm"
                          placeholder="Min Time"
                          plugins={[<TimePicker hideSeconds />]}
                          inputClass="form-control"
                          containerClassName="w-100"
                        />
                        {minTimeError && (
                          <small className="text-danger d-block">
                            {minTimeError}
                          </small>
                        )}
                      </div>

                      <div className="col-6 mb-2">
                        <label className="form-check-label">Maximum Time</label>
                        <DatePicker
                          value={maxTime}
                          disabled={!minTime}
                          onChange={(value) => {
                            setMaxTime(value);
                            validateMaxTime(minTime, value);
                          }}
                          disableDayPicker
                          format="HH:mm"
                          placeholder="Max Time"
                          plugins={[<TimePicker hideSeconds />]}
                          inputClass="form-control"
                          containerClassName="w-100"
                        />
                        {maxTimeError && (
                          <small className="text-danger d-block">
                            {maxTimeError}
                          </small>
                        )}
                      </div>

                      <div className="col-6 mb-2">
                        <label className="form-check-label">Minimum Amount</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="Min Amount"
                          value={minAmount}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMinAmount(val);
                            validateMinAmount(val);
                            // Re-validate max amount
                            validateMaxAmount(val, maxAmount);
                          }}
                        />
                        {minAmountError && (
                          <small className="text-danger d-block">
                            {minAmountError}
                          </small>
                        )}
                      </div>

                      <div className="col-6 mb-2">
                        <label className="form-check-label">Maximum Amount</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="Max Amount"
                          value={maxAmount}
                          disabled={!minAmount}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMaxAmount(val);
                            validateMaxAmount(minAmount, val);
                          }}
                        />
                        {maxAmountError && (
                          <small className="text-danger d-block">
                            {maxAmountError}
                          </small>
                        )}
                      </div>

                      <div className="col-12 mb-2">
                        <label className="form-check-label">Fixed Amount</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="Fixed Amount"
                          value={fixedAmount}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFixedAmount(val);
                            validateFixedAmount(val);
                          }}
                        />
                        {fixAmountError && (
                          <small className="text-danger d-block">
                            {fixAmountError}
                          </small>
                        )}
                      </div>
                    </div>
                  )}
                  {expenseSubType === 2 && (
                    <div className="row mt-3">
                      <div className="col-12 mb-2">
                        <label className="form-check-label">Amount Per KM</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="Amount Per KM"
                          value={amountPerKm}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAmountPerKm(val);
                            validateKilometerAmount(val);
                          }}
                        />
                        {kiloAmountError && (
                          <small className="text-danger d-block">
                            {kiloAmountError}
                          </small>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="col-12 mt-2">
                    <label className="form-check-label">Compulsory Image</label>
                    <select
                      className="form-select"
                      value={isImageRequired}
                      onChange={(e) =>
                        setIsImageRequired(Number(e.target.value))
                      }
                    >
                      {COMPULSORY_IMAGE.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
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
                      ))
                    ) : (
                      <>
                        <div className="source-of-type-list-grid-block">
                          <div className="source-of-type-list-grid-main">
                            {selectedIds.length > 0 && (
                              <div className="pb-0">
                                <span
                                  className="selected-btn rounded-5"
                                  style={{
                                    width: "fit-content",
                                    height: "fit-content",
                                    paddingTop: "0.100rem",
                                    paddingBottom: "0.375rem",
                                    paddingLeft: "0.20rem",
                                    paddingRight: "0.75rem",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    className="custom-checkbox mx-1"
                                    checked={isAllSelected}
                                    title="Select All Expense Types"
                                    onChange={handleSelectAll}
                                  />
                                  <div className="position-relative d-inline-block ms-1 dropdown-end">
                                    <button
                                      className="border-0"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenDropdownId(null);
                                        setIsActionDropdownOpen(
                                          (prev) => !prev,
                                        );
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
                                          height: "7vh",
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
                                          Delete Selected Expense Types
                                        </li>
                                      </ul>
                                    )}
                                  </div>
                                </span>
                              </div>
                            )}
                            <p
                              className={`${expenseTypeLists.length > 0 ? "" : "text-center pt-5"}`}
                            >
                              {expenseTypeLists.length > 0
                                ? ""
                                : "No Data Found"}
                            </p>
                            {expenseTypeLists &&
                              expenseTypeLists.map((item, index) => (
                                <div
                                  className="source-of-type-list-grid-list"
                                  key={index}
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
                                    style={{
                                      backgroundColor: item.color || "#999999",
                                      marginLeft: "5px",
                                    }}
                                    className="badge rounded-pill"
                                    title={item.expense_name}
                                  >
                                    {item.expense_name}
                                  </span>
                                  {item.id !== -1 && (
                                    <>
                                      <button
                                        className="source-of-type-list-grid-options"
                                        id="source-of-types-options-id"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setIsActionDropdownOpen(false); // Close action dropdown when opening individual dropdown
                                          toggleDropdownExpenseType(item.id);
                                        }}
                                      >
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
                                      </button>
                                      <ul
                                        className={`source-of-types-options ${openDropdownId === item.id
                                          ? "isVisible"
                                          : "isHidden"
                                          }`}
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
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenDropdownId(null);
                                            handleEdit(item);
                                          }}
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
                  ? "Delete Expense Types"
                  : "Delete this Expense Type"
              }
              message={`Are you sure you want to delete ${deleteItemIds.length > 1
                ? "these expense types"
                : "this expense type"
                }?`}
              btn1="CANCEL"
              btn2="DELETE"
            />
          )}
        </div>
      ) : null}
      {isCreateModel && (
        <CreateExpenseTypeView
          show={isCreateModel}
          onHide={() => {
            setIsCreateModel(false);
            // setSearchTermFromRightSide("");
          }}
          setLoading={setLoading}
          headerName="Create Expense Type"
          handleRefreshExpenseType={handleRefreshExpenseType}
          productToEdit={undefined}
        />
      )}
      {isUpdateModel && (
        <CreateExpenseTypeView
          show={isUpdateModel}
          onHide={() => {
            setIsUpdateModel(false);
            // setSearchTermFromRightSide("");
          }}
          setLoading={setLoading}
          headerName="Update Expense Type"
          handleRefreshExpenseType={handleRefreshExpenseType}
          productToEdit={editableExpenseType}
        />
      )}
    </>
  );
};

export default ExpenseTypeView;
