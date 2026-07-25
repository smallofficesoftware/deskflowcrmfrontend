import React, { useEffect, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { toast } from "react-toastify";
import ConfirmationModal from "../../../../../components/model/ConfirmationModal";
import { useTheme } from "../../../../../components/ThemeContext";
import {
  fetchApiTargetVsIncentive,
  handleDeleteTarget,
  ITargetVsIncentiveView,
} from "./TargetVsIncentiveController";

import { useEscapeKey } from "../../../../../common/SharedFunction";
import {
  DEFAULT_MESSAGE_ERROR_PERMISSION,
  MIN_WIDTH_FOR_TEXT,
} from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import CreateTargetVsIncentive from "./create-target-vs-incentive/CreateTargetVsIncentiveView";

interface IPropsTargetVsIncentiveView {
  isTargetVsIncentiveView: boolean;
  closeTargetVsIncentiveView: () => void;
  searchTermFromRightSide: string;
  setSearchTermFromRightSide: (data: string) => void;
}
const TargetVsIncentiveView = ({
  isTargetVsIncentiveView,
  closeTargetVsIncentiveView,
  searchTermFromRightSide,
  setSearchTermFromRightSide,
}: IPropsTargetVsIncentiveView) => {
  const [targetVsIncentiveList, setTargetVsIncentiveList] = useState<
    ITargetVsIncentiveView[]
  >([]);
  const dropdownContactRef = useRef<Record<number, HTMLUListElement | null>>(
    {},
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const [targetVsIncenTiveDropdown, setTargetVsIncentiveDropdown] =
    useState<any>(null);
  const [deleteItemId, setDeleteItemId] = useState<number | undefined>(
    undefined,
  );
  const [hasIdAvail, setHasIdAvail] = useState<number>();
  const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
  const [isOpenCreateModel, setIsCreateModel] = useState(false);
  const [isOpenEditModel, setIsOpenEditModel] = useState(false);
  const [loading, setLoading] = useState(false);
  const { darkMode, toggleTheme } = useTheme();
  const [editTargetVsIncentiveItem, setEditTargetVsIncentiveItem] =
    useState<ITargetVsIncentiveView>();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [refreshProduct, setRefreshProduct] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  const canView = useCheckUserPermission(
    PAGE_ID.TARGET_VS_INCENTIVE,
    PERMISSION_TYPE.VIEW,
  );
  const canAdd = useCheckUserPermission(
    PAGE_ID.TARGET_VS_INCENTIVE,
    PERMISSION_TYPE.ADD,
  );

  const canEdit = useCheckUserPermission(
    PAGE_ID.TARGET_VS_INCENTIVE,
    PERMISSION_TYPE.EDIT,
  );
  const canDelete = useCheckUserPermission(
    PAGE_ID.TARGET_VS_INCENTIVE,
    PERMISSION_TYPE.DELETE,
  );

  useEscapeKey(() => {
    if (!isOpenCreateModel && !isOpenEditModel) {
      closeTargetVsIncentiveView();
    } else {
      setIsCreateModel(false);
      setIsOpenEditModel(false);
    }
  });

  const toggleDropdownProduct = (id: number | undefined) => {
    if (id === undefined) return;

    setOpenDropdownId((prevId) => {
      return prevId === id ? null : id;
    });
  };

  const handleEdit = (item: ITargetVsIncentiveView) => {
    setOpenDropdownId(null);
    if (canEdit) {
      setEditTargetVsIncentiveItem(item);
      setIsOpenEditModel(true);
      setTargetVsIncentiveDropdown(null);
    } else {
      setTargetVsIncentiveDropdown(null);
      setIsOpenEditModel(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  useEscapeKey(closeTargetVsIncentiveView);

  useEffect(() => {
    if (canView && isTargetVsIncentiveView) {
      fetchApiTargetVsIncentive(
        setTargetVsIncentiveList,
        setLoading,
        searchTerm,
      );
    }
  }, [isTargetVsIncentiveView, canView, searchTerm, refreshProduct]);

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as Node;

    const isDropdownButton = (target as HTMLElement).closest(".icon-more");
    if (isDropdownButton) {
      return;
    }

    const clickedOutside = Object.values(dropdownContactRef.current).every(
      (ref) => ref && !ref.contains(target),
    );
    if (clickedOutside) {
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

  const handelRefreshProduct = async () => {
    if (canView) {
      setSearchTerm("");
      setSearchOpen(false);
      await fetchApiTargetVsIncentive(setTargetVsIncentiveList, setLoading, "");
    }
  };

  function openSearch() {
    if (canView) {
      setSearchOpen(!searchOpen);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    if (value.length >= 3 || value === "") {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      setSearchTimeout(
        setTimeout(() => {
          fetchApiTargetVsIncentive(
            setTargetVsIncentiveList,
            setLoading,
            value,
          );
        }, 500),
      );
    }
  };

  const handleSearchClear = () => {
    setSearchTerm("");
    setSearchOpen(false);
  };

  function openDeleteModel(itemId: number) {
    if (canDelete) {
      setDeleteItemId(itemId);
      setIsDeleteConfirmation(true);
    } else {
      setIsDeleteConfirmation(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  }

  function openCreateTargetVsIncentive() {
    if (canAdd) {
      setIsCreateModel(true);
    } else {
      setIsCreateModel(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  }

  useEffect(() => {
    if (searchTermFromRightSide === "Create Target Vs Incentive") {
      openCreateTargetVsIncentive();
    }
  }, []);

  return (
    <>
      {isTargetVsIncentiveView ? (
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
                onClick={closeTargetVsIncentiveView}
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
              <h2>Target Vs Incentive</h2>
            </div>

            <div className="col-4 text-end mb-2 ">
              <div
                className="ICON "
                style={{
                  position: "absolute",
                  right: "1px",
                }}
              >
                <button
                  className="icons text-white"
                  onClick={openCreateTargetVsIncentive}
                >
                  <span
                    title="Create Target Vs Incentive"
                    className="text-white"
                  >
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
                  onClick={handelRefreshProduct}
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
                <div className=" d-flex justify-content-between">
                  <button className="search">
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
                  </button>

                  <span className="go-back" onClick={handleSearchClear}>
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
                    title="Search "
                    aria-label="Search or start new chat"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="search-message-input"
                    autoFocus
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
          <div className="chats-notifications">
            <div className="block p-0">
              <div className="h-text">
                {canView ? (
                  <div>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <div className="chats" key={index}>
                          <button className="block chat-list">
                            <div>
                              <Skeleton
                                width="100%"
                                height="100%"
                                duration={5}
                                style={{ opacity: darkMode ? "" : 0.8 }}
                              />
                            </div>
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
                        <div className="chats">
                          <p
                            className={`${
                              targetVsIncentiveList?.length > 0
                                ? ""
                                : " text-center pt-5"
                            }`}
                          >
                            {targetVsIncentiveList?.length > 0
                              ? ""
                              : "No Data Found"}
                          </p>
                          {targetVsIncentiveList &&
                            targetVsIncentiveList.map((item, index) => (
                              <button
                                key={index}
                                className={`block chat-list `}
                                style={{ padding: "6" }}
                              >
                                <div className="h-text ps-2">
                                  <div className="d-flex">
                                    <div
                                      className=""
                                      style={{
                                        paddingBottom: "2px",
                                        borderBottom: "unset",
                                      }}
                                    >
                                      <h4 className="inquiry-front">
                                        <b>Target From Date </b> :
                                      </h4>
                                    </div>
                                    <div
                                      className=""
                                      style={{
                                        borderBottom: "unset",
                                        textAlign: "left",
                                      }}
                                    >
                                      <h4
                                        className="inquiry-front"
                                        style={{
                                          wordWrap: "break-word",
                                          width: `${MIN_WIDTH_FOR_TEXT}`,
                                        }}
                                      >
                                        {item.target_fromdate}
                                      </h4>
                                    </div>
                                  </div>
                                  <div className="d-flex">
                                    <div
                                      className=""
                                      style={{
                                        paddingBottom: "2px",
                                        borderBottom: "unset",
                                      }}
                                    >
                                      <h4 className="inquiry-front">
                                        <b>Target To Date </b> :
                                      </h4>
                                    </div>
                                    <div
                                      className=""
                                      style={{
                                        paddingBottom: "2px",
                                        borderBottom: "unset",
                                        textAlign: "left",
                                      }}
                                    >
                                      <h4
                                        className="inquiry-front"
                                        style={{
                                          wordWrap: "break-word",
                                          width: `${MIN_WIDTH_FOR_TEXT}`,
                                        }}
                                      >
                                        {item.target_todate}
                                      </h4>
                                    </div>
                                  </div>
                                  {item.id === -1 ? (
                                    <span></span>
                                  ) : (
                                    <>
                                      <button
                                        className="icon-more float-end"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleDropdownProduct(item.id);
                                        }}
                                        style={{
                                          marginTop: "-8%",
                                        }}
                                      >
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
                                      <ul
                                        className={`labelDropLeft ${
                                          openDropdownId === item.id
                                            ? "isVisible"
                                            : "isHidden"
                                        }`}
                                        id="dropLeft"
                                        ref={(el) =>
                                          (dropdownContactRef.current[item.id] =
                                            el)
                                        }
                                        style={{
                                          width: "126px",
                                          marginLeft: "70%",
                                          marginTop: "-4%",
                                        }}
                                      >
                                        <li
                                          className="listItem text-start"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenDropdownId(null);
                                            handleEdit(item);
                                          }}
                                          role="button"
                                        >
                                          Edit
                                        </li>
                                        <li
                                          style={{
                                            color: "red",
                                            fontWeight: "600",
                                          }}
                                          className="listItem text-start"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenDropdownId(null);
                                            openDeleteModel(item.id);
                                          }}
                                          role="button"
                                        >
                                          Delete
                                        </li>
                                      </ul>
                                    </>
                                  )}
                                  <div className="d-flex">
                                    <div
                                      className=""
                                      style={{
                                        paddingBottom: "2px",
                                        borderBottom: "unset",
                                      }}
                                    >
                                      <h4 className="inquiry-front">
                                        <b>Incentive Type </b> :
                                      </h4>
                                    </div>
                                    <div
                                      className=""
                                      style={{
                                        borderBottom: "unset",
                                        textAlign: "left",
                                      }}
                                    >
                                      <h4
                                        className="inquiry-front"
                                        style={{
                                          wordWrap: "break-word",
                                          width: `${MIN_WIDTH_FOR_TEXT}`,
                                        }}
                                      >
                                        {item.incentive_type === 1
                                          ? "Percentage"
                                          : item.incentive_type === 2
                                            ? "Flat"
                                            : "None"}
                                      </h4>
                                    </div>
                                  </div>
                                  <div className="d-flex">
                                    <div
                                      className=""
                                      style={{
                                        paddingBottom: "2px",
                                        borderBottom: "unset",
                                      }}
                                    >
                                      <h4 className="inquiry-front">
                                        <b>Target Count </b> :
                                      </h4>
                                    </div>
                                    <div
                                      className=""
                                      style={{
                                        borderBottom: "unset",
                                        textAlign: "left",
                                      }}
                                    >
                                      <h4
                                        className="inquiry-front"
                                        style={{
                                          wordWrap: "break-word",
                                          width: `${MIN_WIDTH_FOR_TEXT}`,
                                        }}
                                      >
                                        {item.target_count}
                                      </h4>
                                    </div>
                                  </div>
                                  <div className="d-flex">
                                    <div
                                      className=""
                                      style={{
                                        paddingBottom: "2px",
                                        borderBottom: "unset",
                                      }}
                                    >
                                      <h4 className="inquiry-front">
                                        <b>Target Value </b> :
                                      </h4>
                                    </div>
                                    <div
                                      className=""
                                      style={{
                                        borderBottom: "unset",
                                        textAlign: "left",
                                      }}
                                    >
                                      <h4
                                        className="inquiry-front"
                                        style={{
                                          wordWrap: "break-word",
                                          width: `${MIN_WIDTH_FOR_TEXT}`,
                                        }}
                                      >
                                        {item.target_value}
                                      </h4>
                                    </div>
                                  </div>
                                  <div className="d-flex">
                                    <div
                                      className=""
                                      style={{
                                        paddingBottom: "2px",
                                        borderBottom: "unset",
                                      }}
                                    >
                                      <h4 className="inquiry-front">
                                        <b>Assigned To </b> :
                                      </h4>
                                    </div>
                                    <div
                                      className=""
                                      style={{
                                        borderBottom: "unset",
                                        textAlign: "left",
                                      }}
                                    >
                                      <h4
                                        className="inquiry-front"
                                        style={{
                                          wordWrap: "break-word",
                                        }}
                                      >
                                        {item.assigned_team_member_name}
                                      </h4>
                                    </div>
                                  </div>
                                </div>
                              </button>
                            ))}
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
                setDeleteItemId(undefined);
              }}
              handleSubmit={() =>
                handleDeleteTarget(
                  deleteItemId,
                  setIsDeleteConfirmation,
                  setLoading,
                  setTargetVsIncentiveList,
                )
              }
              title={"Delete this Target Vs Incentive"}
              message={"Are You Sure You Want To Target Vs Incentive?"}
              btn1="CANCEL"
              btn2="DELETE"
            />
          )}
        </div>
      ) : null}

      {isOpenCreateModel && (
        <CreateTargetVsIncentive
          show={isOpenCreateModel}
          onHide={() => {
            setIsCreateModel(false);
            setSearchTermFromRightSide("");
          }}
          setTargetVsIncentiveList={setTargetVsIncentiveList}
          setLoading={setLoading}
          headerName="Create Target Vs Incentive"
          setRefreshProduct={setRefreshProduct}
          productToEdit={undefined}
        />
      )}

      {isOpenEditModel && (
        <CreateTargetVsIncentive
          show={isOpenEditModel}
          onHide={() => setIsOpenEditModel(false)}
          productToEdit={editTargetVsIncentiveItem}
          headerName="Edit Target Vs Incentive"
          setRefreshProduct={setRefreshProduct}
          setTargetVsIncentiveList={setTargetVsIncentiveList}
          setLoading={setLoading}
        />
      )}
    </>
  );
};
export default TargetVsIncentiveView;
