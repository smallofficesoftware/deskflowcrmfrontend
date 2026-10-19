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
import {
  fetchAttributeMastersApi,
  handleDeleteAttributeMasterApi,
  IAttributeMasterView,
} from "./AttributeMasterController";
import CreateAttributeMasterView from "./CreateAttributeMasterView";

interface IPropsAttributeMaster {
  isAttributeMasterView: boolean;
  closeAttributeMasterView: () => void;
}

// Reusable attribute/value catalog (Settings > Attribute Master) -
// plans/2026-10-18-product-variants-and-qty-pricing-plan.txt. Mirrors UnitMasterView.tsx's
// list/create/edit/delete pattern, kept simpler since there's no bulk-select here yet.
const AttributeMasterView = ({
  isAttributeMasterView,
  closeAttributeMasterView,
}: IPropsAttributeMaster) => {
  const [attributeList, setAttributeList] = useState<IAttributeMasterView[]>([]);
  const [loading, setLoading] = useState(false);
  const { darkMode } = useTheme();
  const dropdownRef = useRef<Record<number, HTMLUListElement | null>>({});
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [deleteIds, setDeleteIds] = useState<number[]>([]);
  const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
  const [isCreateModel, setIsCreateModel] = useState(false);
  const [isUpdateModel, setIsUpdateModel] = useState(false);
  const [editableAttribute, setEditableAttribute] = useState<IAttributeMasterView | undefined>(
    undefined
  );

  const canView = useCheckUserPermission(PAGE_ID.ATTRIBUTE_MASTER, PERMISSION_TYPE.VIEW);
  const canAdd = useCheckUserPermission(PAGE_ID.ATTRIBUTE_MASTER, PERMISSION_TYPE.ADD);
  const canEdit = useCheckUserPermission(PAGE_ID.ATTRIBUTE_MASTER, PERMISSION_TYPE.EDIT);
  const canDelete = useCheckUserPermission(PAGE_ID.ATTRIBUTE_MASTER, PERMISSION_TYPE.DELETE);

  useEscapeKey(closeAttributeMasterView);

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const clickedOnButton = target.closest(".source-of-type-list-grid-options");
    if (clickedOnButton) return;
    const clickedInsideDropdown = Object.values(dropdownRef.current).some(
      (ref) => ref && ref.contains(target)
    );
    if (!clickedInsideDropdown) setOpenDropdownId(null);
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (canView && isAttributeMasterView) {
      fetchAttributeMastersApi(setAttributeList, setLoading);
    }
  }, [isAttributeMasterView, canView]);

  const handleRefresh = async () => {
    if (canView) await fetchAttributeMastersApi(setAttributeList, setLoading);
  };

  const handleEdit = (item: IAttributeMasterView) => {
    setOpenDropdownId(null);
    if (canEdit) {
      setEditableAttribute(item);
      setIsUpdateModel(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const openDeleteModel = (id: number) => {
    setOpenDropdownId(null);
    if (canDelete) {
      setDeleteIds([id]);
      setIsDeleteConfirmation(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleDeleteSubmit = async () => {
    await handleDeleteAttributeMasterApi(
      deleteIds,
      setIsDeleteConfirmation,
      setAttributeList,
      setLoading
    );
    setDeleteIds([]);
  };

  const openCreateView = () => {
    if (canAdd) {
      setIsCreateModel(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  return (
    <>
      {isAttributeMasterView ? (
        <div className="notifications animate__animated animate__fadeInLeft" id="notifications">
          <div className="header-Chat">
            <div className="ICON">
              <div
                aria-disabled="false"
                role="button"
                className="icons"
                title="Back"
                aria-label="Back"
                onClick={closeAttributeMasterView}
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
              <h2>Attribute Master</h2>
            </div>
            <div className="text-end mb-2">
              <div className="ICON" style={{ position: "absolute", right: "60px" }}>
                <button className="icons" onClick={openCreateView} title="Create Attribute">
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
              <div className="ICON" style={{ position: "absolute", right: "20px" }}>
                <button className="icons" onClick={handleRefresh} title="Refresh">
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
                {canView ? (
                  <div>
                    {loading ? (
                      Array.from({ length: 8 }).map((_, index) => (
                        <div className="source-of-type-list-grid-main" key={index}>
                          <div className="source-of-type-list-grid-list">
                            <div style={{ display: "inline-block", marginLeft: "8px" }}>
                              <Skeleton
                                width="160px"
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
                      <div className="source-of-type-list-grid-block">
                        <div className="source-of-type-list-grid-main">
                          <p className={attributeList.length > 0 ? "" : "text-center pt-5"}>
                            {attributeList.length > 0 ? "" : "No Data Found"}
                          </p>

                          {attributeList.map((item) => (
                            <div
                              key={item.id}
                              className="source-of-type-list-grid-list"
                              style={{ minHeight: "40px" }}
                            >
                              <span
                                style={{ marginLeft: "5px", color: "black" }}
                                className="badge rounded-pill"
                                title={item.attribute_name}
                              >
                                {item.attribute_name}
                              </span>
                              <span className="ms-2 text-muted small">
                                {item.values.length > 0
                                  ? item.values.map((v) => v.value).join(", ")
                                  : "No values yet"}
                              </span>

                              <button
                                className="source-of-type-list-grid-options"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdownId((prev) =>
                                    prev === item.id ? null : item.id
                                  );
                                }}
                              >
                                <svg viewBox="0 0 24 24" width="24" height="24">
                                  <path
                                    fill="currentColor"
                                    d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z"
                                  ></path>
                                </svg>
                              </button>
                              <ul
                                className={`source-of-types-options ${
                                  openDropdownId === item.id ? "isVisible" : "isHidden"
                                }`}
                                ref={(el) => (dropdownRef.current[item.id] = el)}
                                style={{ width: "120px", marginLeft: "60%" }}
                              >
                                <li
                                  className="listItem"
                                  role="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(item);
                                  }}
                                >
                                  Edit / Values
                                </li>
                                <li
                                  style={{ color: "red", fontWeight: "600" }}
                                  className="listItem"
                                  role="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openDeleteModel(item.id);
                                  }}
                                >
                                  Delete
                                </li>
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
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
                setDeleteIds([]);
              }}
              handleSubmit={handleDeleteSubmit}
              title="Delete this Attribute"
              message="Are you sure you want to delete this attribute? This also removes its values."
              btn1="CANCEL"
              btn2="DELETE"
            />
          )}
        </div>
      ) : null}
      {isCreateModel && (
        <CreateAttributeMasterView
          show={isCreateModel}
          onHide={() => setIsCreateModel(false)}
          setLoading={setLoading}
          headerName="Create Attribute"
          handleRefresh={handleRefresh}
          attributeToEdit={undefined}
        />
      )}
      {isUpdateModel && (
        <CreateAttributeMasterView
          show={isUpdateModel}
          onHide={() => setIsUpdateModel(false)}
          setLoading={setLoading}
          headerName="Edit Attribute"
          handleRefresh={handleRefresh}
          attributeToEdit={editableAttribute}
        />
      )}
    </>
  );
};

export default AttributeMasterView;
