import React, { useEffect, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import { useTheme } from "../../../../../components/ThemeContext";
import ConfirmationModal from "../../../../../components/model/ConfirmationModal";
import {
  DEFAULT_MESSAGE_ERROR_PERMISSION,
  ITEMS_PER_PAGE,
} from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import StockAdjustmentModel from "./StockAdjustmentModel";
import {
  fetchStockAdjustmentApi,
  handleDeleteStockAdjustment,
  IStockAdjustmentView,
} from "./StockAdjustmentViewController";

interface IPropsStockAdjustmentView {
  isStockAdjustmentView: boolean;
  closeStockAdjustmentView: () => void;
  searchTermFromRightSide: string;
  setSearchTermFromRightSide: (data: string) => void;
}

const StockAdjustmentView = ({
  isStockAdjustmentView,
  closeStockAdjustmentView,
  searchTermFromRightSide,
  setSearchTermFromRightSide
}: IPropsStockAdjustmentView) => {
  const [stockAdjustmentLists, setStockAdjustmentList] = useState<
    IStockAdjustmentView[]
  >([]);
  const dropdownContactRef = useRef<Record<number, HTMLUListElement | null>>(
    {},
  );

  const [stockAdjustmentDropdown, setStockAdjustmentDropdown] =
    useState<any>(null);
  const [hasIdAvail, setHasIdAvail] = useState<number>();
  const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const { darkMode } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);

  const [refreshStockAdjustment, setRefreshStockAdjustment] =
    useState<boolean>(false);
  const listInnerRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const actionDropdownRef = useRef<HTMLUListElement>(null);
  const [deleteItemIds, setDeleteItemIds] = useState<number>();
  const [isOpenCreateModel, setIsCreateModel] = useState(false);

  const [editStockAdjustment, setEditStockAdjustment] =
    useState<IStockAdjustmentView>();
  const [isOpenEditModel, setIsOpenEditModel] = useState(false);

  const canView = useCheckUserPermission(
    PAGE_ID.STOCK_ADJUSTMENT,
    PERMISSION_TYPE.VIEW,
  );
  const canEdit = useCheckUserPermission(
    PAGE_ID.STOCK_ADJUSTMENT,
    PERMISSION_TYPE.EDIT,
  );
  const canDelete = useCheckUserPermission(
    PAGE_ID.STOCK_ADJUSTMENT,
    PERMISSION_TYPE.DELETE,
  );

  const canAdd = useCheckUserPermission(
    PAGE_ID.STOCK_ADJUSTMENT,
    PERMISSION_TYPE.ADD,
  );

  let itemsPerPage = ITEMS_PER_PAGE;

  useEscapeKey(closeStockAdjustmentView);

  const toggleDropdownStockAdjustment = (
    stockAdjustmentId: number | undefined,
  ) => {
    if (stockAdjustmentId !== undefined) {
      if (hasIdAvail === stockAdjustmentId && stockAdjustmentDropdown) {
        setHasIdAvail(undefined);
        setStockAdjustmentDropdown(null);
      } else {
        setHasIdAvail(stockAdjustmentId);
        setStockAdjustmentDropdown(true);
      }
    }
  };

  const handleEdit = (item: IStockAdjustmentView) => {
    setStockAdjustmentDropdown(null);
    setHasIdAvail(undefined);

    if (canEdit) {
      setEditStockAdjustment(item);
      setIsOpenEditModel(true);
      setStockAdjustmentDropdown(null);
    } else {
      setStockAdjustmentDropdown(null);
      setIsOpenEditModel(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  useEffect(() => {
    if (canView && isStockAdjustmentView) {
      fetchStockAdjustmentApi(
        0,
        itemsPerPage,
        setStockAdjustmentList,
        setLoading,
        searchTerm,
      );
    }
  }, [isStockAdjustmentView, canView]);

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    const clickedOnButton = target.closest(".icon-more");
    if (clickedOnButton) return;

    const clickedInsideDropdown = Object.values(
      dropdownContactRef.current,
    ).some((ref) => ref && ref.contains(target));

    const clickedInsideActionDropdown =
      actionDropdownRef.current?.contains(target) ||
      target.closest(".selected-btn");

    if (!clickedInsideDropdown && !clickedInsideActionDropdown) {
      setStockAdjustmentDropdown(null);
      setHasIdAvail(undefined);
    }
  };

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setStockAdjustmentDropdown(null);
        setHasIdAvail(undefined);
      }
    };

    document.addEventListener("keydown", handleEscKey);
    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleEscKey);
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const handelRefreshStockAdjustment = async () => {
    if (canView) {
      await fetchStockAdjustmentApi(
        0,
        itemsPerPage,
        setStockAdjustmentList,
        setLoading,
        "",
      );
    }
  };

  const openSearch = () => {
    if (canView) {
      setSearchOpen(!searchOpen);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);

    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Only call API after user stops typing for 1 second
    const newTimeout = setTimeout(() => {
      fetchStockAdjustmentApi(
        0,
        itemsPerPage,
        setStockAdjustmentList,
        setLoading,
        value,
      );
    }, 1000);

    setSearchTimeout(newTimeout);
  };

  const handleSearchClear = () => {
    setSearchTerm("");
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    setSearchOpen(!searchOpen);
    setSearchTimeout(
      setTimeout(() => {
        fetchStockAdjustmentApi(
          0,
          itemsPerPage,
          setStockAdjustmentList,
          setLoading,
          "",
        );
      }, 1000),
    );
  };

  const openDeleteModel = (itemId: number) => {
    setStockAdjustmentDropdown(null);
    setHasIdAvail(undefined);
    if (canDelete) {
      setDeleteItemIds(itemId);
      setIsDeleteConfirmation(true);
      setStockAdjustmentDropdown(null);
    } else {
      setIsDeleteConfirmation(false);
      setStockAdjustmentDropdown(null);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  useEffect(() => {
    if (refreshStockAdjustment) {
      fetchStockAdjustmentApi(
        0,
        itemsPerPage,
        setStockAdjustmentList,
        setLoading,
        searchTerm,
      );
      setRefreshStockAdjustment(false);
    }
  }, [refreshStockAdjustment, itemsPerPage, searchTerm]);

  useEffect(() => {
    const handleScroll = () => {
      const el = listInnerRef.current;
      if (el && !loading) {
        const isBottomReached =
          el.scrollTop + el.clientHeight >= el.scrollHeight - 10;
        if (isBottomReached) {
          fetchStockAdjustmentApi(
            currentPage + 1,
            ITEMS_PER_PAGE,
            (newItems) => {
              if (newItems.length > 0) {
                setStockAdjustmentList((prev) => [...prev, ...newItems]);
                setCurrentPage((prevPage) => prevPage + 1);
              }
            },
            setLoading,
            searchTerm,
          );
        }
      }
    };

    const el = listInnerRef.current;
    if (el) el.addEventListener("scroll", handleScroll);
    return () => el?.removeEventListener("scroll", handleScroll);
  }, [currentPage, searchTerm, loading]);

  const handleDeleteSubmit = async () => {
    if (!canDelete) {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
      return;
    }

    await handleDeleteStockAdjustment(
      deleteItemIds || 0,
      setIsDeleteConfirmation,
      setLoading,
      setStockAdjustmentList,
    );

    setIsDeleteConfirmation(false);
    setDeleteItemIds(0);
  };

  const openCreateStockAdustment = () => {
    if (canAdd) {
      setIsCreateModel(true);
    } else {
      setIsCreateModel(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  useEffect(() => {
    if (searchTermFromRightSide === "Add Stock Adjustment") {
      openCreateStockAdustment();
    }
  }, []);

  const handlePrintViewOpen = (stock_id: number) => {
    const getUUID = localStorage.getItem("UUID");
    const baseURL = window.location.origin;
    const supportURL = `${baseURL}/StockAdjustmentPrintView/${stock_id}`;
    const myWindow = window.open(supportURL, "_blank");
  };

  return (
    <>
      {isStockAdjustmentView ? (
        <div
          className="leftSide animate__animated animate__fadeInLeft"
          id="notifications"
        >
          <div className="header-Chat">
            <div className="ICON">
              <div
                aria-disabled="false"
                role="button"
                className="icons text-light"
                data-tab="2"
                title="Back"
                aria-label="New chat"
                onClick={closeStockAdjustmentView}
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
              <h2>Stock Adjustment</h2>
            </div>
            <div className="col-4 text-end mb-2">
              <div
                className="ICON"
                style={{ position: "absolute", right: "1px" }}
              >
                <button
                  className="icons text-white"
                  onClick={openCreateStockAdustment}
                >
                  <span title="Add Stock Adjustment" className="text-white">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="26px"
                      viewBox="0 -960 960 960"
                      width="26px"
                      fill="currentColor"
                    >
                      <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                    </svg>
                  </span>
                </button>
                <button
                  className="icons text-white"
                  onClick={openSearch}
                  title="Search"
                >
                  <svg viewBox="0 0 24 24" width="24" height="24" className="">
                    <path
                      fill="currentColor"
                      d="M15.9 14.3H15l-.3-.3c1-1.1 1.6-2.7 1.6-4.3 0-3.7-3-6.7-6.7-6.7S3 6 3 9.7s3 6.7 6.7 6.7c1.6 0 3.2-.6 4.3-1.6l.3.3v.8l5.1 5.1 1.5-1.5-5-5.2zm-6.2 0c-2.6 0-4.6-2.1-4.6-4.6s2.1-4.6 4.6-4.6 4.6 2.1 4.6 4.6-2 4.6-4.6 4.6z"
                    ></path>
                  </svg>
                </button>
                <button
                  className="icons text-light"
                  onClick={handelRefreshStockAdjustment}
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
          {searchOpen && (
            <div className="header-search" style={{ zIndex: "1" }}>
              <div className="search-bar">
                <div className="d-flex justify-content-between">
                  <button className="search">
                    <span>
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
                  </button>
                  <span className="go-back">
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
                  <input
                    type="text"
                    title="Search"
                    aria-label="Search or start new chat"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="search-message-input"
                  />
                  <span
                    role="button"
                    className="p-1"
                    onClick={handleSearchClear}
                  >
                    <svg
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      fill="#5f6368"
                    >
                      <path d="M280-80q-83 0-141.5-58.5T80-280q0-83 58.5-141.5T280-480q83 0 141.5 58.5T480-280q0 83-58.5 141.5T280-80Zm544-40L568-376q-12-13-25.5-26.5T516-428q38-24 61-64t23-88q0-75-52.5-127.5T420-760q-75 0-127.5 52.5T240-580q0 6 .5 11.5T242-557q-18 2-39.5 8T164-535q-2-11-3-22t-1-23q0-109 75.5-184.5T420-840q109 0 184.5 75.5T680-580q0 43-13.5 81.5T629-428l251 252-56 56Zm-615-61 71-71 70 71 29-28-71-71 71-71-28-28-71 71-71-71-28 28 71 71-71 71 28 28Z" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          )}
          <div className="chats-notifications" ref={listInnerRef}>
            <div className="block p-0">
              <div className="h-text">
                {canView ? (
                  <div>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <div
                          key={index}
                          className="block chat-list"
                          style={{
                            padding: "6px",
                            borderBottom: "1px solid #e0e0e0",
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-start">
                            {/* LEFT SIDE */}
                            <div style={{ width: "60%" }}>
                              {/* Cart Number */}
                              <Skeleton
                                height={16}
                                width={180}
                                style={{ marginBottom: 8 }}
                              />

                              {/* Total Qty */}
                              <Skeleton
                                height={12}
                                width={140}
                                style={{ marginBottom: 6 }}
                              />

                              {/* Transfer Date */}
                              <Skeleton height={12} width={120} />
                            </div>

                            {/* RIGHT SIDE */}
                            <div style={{ width: "35%", textAlign: "right" }}>
                              {/* Created Date Label */}
                              <Skeleton
                                height={12}
                                width={120}
                                style={{ marginBottom: 6, marginLeft: "auto" }}
                              />

                              {/* Created Date Value */}
                              <Skeleton
                                height={12}
                                width={140}
                                style={{ marginLeft: "auto" }}
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <>
                        <div
                          className="chats h-100"
                          style={{ paddingBottom: "100px" }}
                        >
                          <p
                            className={`${stockAdjustmentLists && stockAdjustmentLists?.length > 0 ? "" : "text-center pt-5"}`}
                          ></p>
                          {/* {stockAdjustmentLists.length === 0 && <p className="no_found">No Stock Adjustment found</p>} */}
                          {stockAdjustmentLists &&
                            stockAdjustmentLists.length > 0 ? (
                            stockAdjustmentLists.map((item, index) => (
                              <div
                                key={index}
                                className="block chat-list"
                                style={{
                                  padding: "6px",
                                  borderBottom: "1px solid #e0e0e0",
                                  position: "relative",
                                }}
                              >
                                <div className="h-text ps-2">
                                  {/* MAIN ROW */}
                                  <div className="d-flex justify-content-between align-items-start">
                                    {/* LEFT SIDE */}
                                    <div>
                                      <h2
                                        className="inquiry-front"
                                        style={{
                                          fontWeight: "bold",
                                          marginBottom: "4px",
                                        }}
                                      >
                                        # {item.cart_number}
                                      </h2>

                                      <h4
                                        className="inquiry-front"
                                        style={{ margin: "2px 0" }}
                                      >
                                        <b>Total Qty :</b> {item.total_qty}
                                      </h4>

                                      <h4
                                        className="inquiry-front"
                                        style={{ margin: "2px 0" }}
                                      >
                                        <b>Transfer Date :</b> {item.cart_date}
                                      </h4>
                                    </div>

                                    {/* RIGHT SIDE (DATE + BUTTON) */}
                                    <div
                                      className="d-flex align-items-start"
                                      style={{ gap: "10px" }}
                                    >
                                      {/* DATE */}
                                      <div style={{ textAlign: "right" }}>
                                        <h4
                                          className="inquiry-front"
                                        // style={{ margin: "2px 0" }}
                                        >
                                          <b>Created Date :</b>
                                        </h4>
                                        <h4
                                          className="inquiry-front"
                                          style={{ margin: "2px 0" }}
                                        >
                                          {item.created_date_time}
                                        </h4>
                                        <h4
                                          className="inquiry-front"
                                          style={{ margin: "2px 0" }}
                                        >
                                          <b>Created By :</b>
                                        </h4>
                                        <h4
                                          className="inquiry-front"
                                          style={{ margin: "2px 0" }}
                                        >
                                          {item.created_by_name}
                                        </h4>
                                      </div>

                                      {/* DRAWER BUTTON */}
                                      {item.id !== -1 && (
                                        <button
                                          className="icon-more"
                                          style={{
                                            background: "transparent",
                                            border: "none",
                                            cursor: "pointer",
                                            padding: "4px",
                                            // marginTop: "4px",
                                          }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleDropdownStockAdjustment(
                                              item.id,
                                            );
                                          }}
                                        >
                                          {/* 3 DOT ICON */}
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 19 20"
                                            width="19"
                                            height="20"
                                            className="hide animate__animated animate__fadeInUp"
                                          >
                                            <path
                                              fill="currentColor"
                                              d="M3.8 6.7l5.7 5.7 5.7-5.7 1.6 1.6-7.3 7.2-7.3-7.2 1.6-1.6z"
                                            ></path>
                                          </svg>
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* DROPDOWN */}
                                  {item.id !== -1 && (
                                    <ul
                                      className={`labelDropLeft-product labelDropLeft ${hasIdAvail === item.id &&
                                        stockAdjustmentDropdown
                                        ? "isVisible"
                                        : "isHidden"
                                        }`}
                                      ref={(el) =>
                                      (dropdownContactRef.current[item.id] =
                                        el)
                                      }
                                      style={{
                                        position: "absolute",
                                        right: "30px",
                                        top: "-50px",
                                        width: "130px",
                                        background: "#fff",
                                        boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                                        borderRadius: "6px",
                                        zIndex: 100,
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <li
                                        style={{
                                          fontWeight: "600",
                                          padding: "8px",
                                          cursor: "pointer",
                                        }}
                                        className="listItem text-start"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handlePrintViewOpen(item.id);
                                        }}
                                      >
                                        View Print
                                      </li>
                                      <li
                                        style={{
                                          color: "red",
                                          fontWeight: "600",
                                          padding: "8px",
                                          cursor: "pointer",
                                        }}
                                        className="listItem text-start"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openDeleteModel(item.id);
                                        }}
                                      >
                                        Delete
                                      </li>
                                    </ul>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="no_found">
                              No Stock Adjustment found
                            </p>
                          )}
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
        </div>
      ) : null}
      {isDeleteConfirmation && (
        <ConfirmationModal
          show={isDeleteConfirmation}
          onHide={() => {
            setIsDeleteConfirmation(false);
            setDeleteItemIds(0);
          }}
          handleSubmit={handleDeleteSubmit}
          title={"Delete this Stock Adjustment"}
          message={`Are you sure you want to delete this Stock Adjustment ?`}
          btn1="CANCEL"
          btn2="DELETE"
        />
      )}
      {isOpenCreateModel && (
        <StockAdjustmentModel
          show={isOpenCreateModel}
          onHide={() => {
            setIsCreateModel(false);
            setSearchTermFromRightSide("");
          }}
          flag={1}
          where_action={1}
          setRefreshStockAdjustment={setRefreshStockAdjustment}
        />
      )}
      {isOpenEditModel && (
        <StockAdjustmentModel
          show={isOpenEditModel}
          onHide={() => {
            setIsCreateModel(false);
            setSearchTermFromRightSide("");
          }}
          editStockAdjustment={editStockAdjustment}
          flag={2}
          setRefreshStockAdjustment={setRefreshStockAdjustment}
          where_action={1}
        />
      )}
    </>
  );
};

export default StockAdjustmentView;
