import "primeicons/primeicons.css";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import {
    DataTable,
    type DataTableFilterEvent,
    type DataTableFilterMeta
} from "primereact/datatable";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../common/SharedFunction";
import ConfirmationModal from "../../../../components/model/ConfirmationModal";
import SafeHtml from "../../../../components/SafeHtml";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import CreateNoteView from "../../../left-side/Personal-Notes/CreateNoteView";
import { fetchNoteApi, handleDeletenote, INoteList } from "../../../left-side/Personal-Notes/NoteController";

interface IPersonalNotesReport {
    onHide?: () => void;
}

const PersonalNotesReport = ({ onHide }: IPersonalNotesReport) => {
    const [loading, setLoading] = useState(false);
    const [noteLists, setNoteList] = useState<INoteList[]>([]);
    const [globalSearchText, setGlobalSearchText] = useState("");

    const [debouncedSearchText, setDebouncedSearchText] = useState("");


    const searchInputRef = useRef<HTMLInputElement>(null);

    const [filters, setFilters] = useState<DataTableFilterMeta>({
        source_name: {
            value: null,
            matchMode: "contains",
        },
    });
    const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);
    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
    const dropdownContactRef = useRef<Record<number, HTMLUListElement | null>>(
        {}
    );
    const [isCreateModel, setIsCreateModel] = useState<boolean>(false);
    const [noteDropdown, setNoteDropdown] = useState<number | null>(null);
    const [editNoteId, setEditNoteId] = useState<number | undefined>(undefined);
    const [isUpdateModel, setIsUpdateModel] = useState<boolean>(false);
    const [editableProduct, setEditableProduct] = useState<INoteList>({
        notes: "",
        id: 0,
        color: "",
        created_date_time: "",
    });
    const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
    const [hasIdAvail, setHasIdAvail] = useState<number>();
    const actionDropdownRef = useRef<HTMLUListElement>(null);

    const onFilter = (event: DataTableFilterEvent) => {
        setFilters(event.filters);
    };

    useEffect(() => {
        if (canView) {
            fetchNoteApi(
                setNoteList,
                setLoading
            );
        }
    }, []);

    useEscapeKey(() => {
        if (
            !isCreateModel &&
            !openDropdownId &&
            !isUpdateModel
        ) {
            onHide?.();
        } else {
            setIsCreateModel(false);
            setOpenDropdownId(null);
            setIsUpdateModel(false);
        }
    });

    const canView = useCheckUserPermission(
        PAGE_ID.PERSONAL_NOTE,
        PERMISSION_TYPE.VIEW
    );
    const canAdd = useCheckUserPermission(
        PAGE_ID.PERSONAL_NOTE,
        PERMISSION_TYPE.ADD
    );

    const canEdit = useCheckUserPermission(
        PAGE_ID.PERSONAL_NOTE,
        PERMISSION_TYPE.EDIT
    );
    const canDelete = useCheckUserPermission(
        PAGE_ID.PERSONAL_NOTE,
        PERMISSION_TYPE.DELETE
    );

    const handelRefreshNotes = async () => {
        if (canView) {
            await fetchNoteApi(setNoteList, setLoading);
        }
    };
    const handleEdit = (item: INoteList) => {
        if (canEdit) {
            setNoteDropdown(null);
            setEditableProduct(item);
            setIsUpdateModel(true);
        } else {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    };

    const handleCopyNotes = (item: INoteList) => {
        try {
            if (!item?.notes) {
                toast.error("No note content to copy");
                return;
            }
            const textarea = document.createElement("textarea");
            textarea.value = item.notes.replace(/<[^>]*>/g, "");
            textarea.style.position = "fixed";
            document.body.appendChild(textarea);
            textarea.select();

            try {
                if (navigator.clipboard) {
                    navigator.clipboard
                        .writeText(textarea.value)
                        .then(() => {
                            toast.success("Note copied to clipboard!");
                        })
                        .catch(() => {
                            // Fallback to execCommand if modern API fails
                            fallbackCopy();
                        });
                } else {
                    // Use fallback for older browsers
                    fallbackCopy();
                }
            } catch (err) {
                console.error("Copy failed:", err);
                toast.error("Failed to copy note");
            } finally {
                document.body.removeChild(textarea);
            }

            function fallbackCopy() {
                const successful = document.execCommand("copy");
                if (successful) {
                    toast.success("Note copied to clipboard!");
                } else {
                    toast.error("Failed to copy note");
                }
            }
        } catch (err) {
            console.error("Copy error:", err);
            toast.error("Failed to copy note");
        }
    };

    function openDeleteModel() {
        if (canDelete) {
            setIsDeleteConfirmation(true);
        } else {
            setIsDeleteConfirmation(false);

            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }
    }

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

    const actionBodyTemplate = useCallback((rowData: any) => {
        return (
            <div className="gap-2" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <>
                    <Button
                        icon="pi pi-cog"
                        className="p-button-text source-of-type-list-grid-options"
                        style={{ color: "green", width: "2rem" }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsActionDropdownOpen(false);
                            setOpenDropdownId((prev) => prev === rowData.id ? null : rowData.id);
                        }}
                    />

                    <ul
                        ref={(el) => (dropdownContactRef.current[rowData.id] = el)}
                        style={{
                            width: "150px",
                            marginLeft: "15%",
                            height: "auto",
                            display: openDropdownId === rowData.id ? "block" : "none",
                            position: "absolute",
                            zIndex: 9999,
                            background: "#fff",
                            boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
                            borderRadius: "6px",
                            padding: "5px 0",
                            listStyle: "none",
                        }}
                    >
                        <li
                            className="listItem"
                            role="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdownId(null);
                                handleEdit(rowData);
                            }}
                            style={{ marginLeft: "10px", height: "25px", display: "flex", alignItems: "center" }}
                        >
                            Edit
                        </li>
                        <li
                            className="listItem"
                            role="button"
                            onClick={() =>
                                handleCopyNotes(rowData)
                            }
                            style={{ marginLeft: "10px", height: "25px", display: "flex", alignItems: "center" }}
                        >
                            Copy Notes
                        </li>
                        <li
                            style={{ color: "red", fontWeight: "600", marginLeft: "10px", height: "25px", display: "flex", alignItems: "center" }}
                            className="listItem"
                            role="button"
                            onClick={openDeleteModel}
                        >
                            Delete
                        </li>
                    </ul>
                </>
            </div>
        );
    }, [openDropdownId, canEdit, canDelete]);

    return (
        <div>
            <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                <h3
                    style={{ fontSize: "20px", paddingLeft: "12px" }}
                    className="dash-board-text-count"
                >
                    All Notes
                </h3>
                <div className="d-flex gap-2 align-items-center">

                    <Button
                        icon="pi pi-plus"
                        className="report_button"
                        style={{ backgroundColor: "rgb(245, 134, 52)" }}
                        rounded
                        onClick={() => {
                            if (canAdd) {
                                setIsCreateModel(true);
                            } else {
                                toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                            }
                        }}
                        tooltip={`Add Notes`}
                        tooltipOptions={{
                            position: "left",
                            style: {
                                fontSize: "14px",
                            },
                        }}
                    />
                </div>
            </div>

            <div
                className="report_card"
                style={{
                    height: "90vh",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <DataTable
                    value={noteLists}
                    loading={loading}
                    resizableColumns
                    columnResizeMode="fit"
                    scrollable
                    scrollHeight="flex"
                    className="custom-centered-table"
                    tableStyle={{ tableLayout: "fixed", width: "100%" }}
                    emptyMessage="No data found"
                    filterDisplay="row"
                    filters={filters}
                    onFilter={onFilter}
                    key={openDropdownId}
                >
                    <Column
                        field="actions"
                        headerClassName="center-header"
                        headerStyle={{
                            width: "30px",
                            position: "sticky",
                            top: 0,
                            zIndex: 1,
                        }}
                        body={actionBodyTemplate}

                    />
                    <Column
                        field="notes"
                        header={
                            <span>
                                Notes
                            </span>
                        }
                        sortable
                        filter
                        filterPlaceholder="Search"
                        filterMatchMode="contains"
                        headerStyle={{
                            width: "350px",
                            background: "#f8f9fa",
                            fontSize: "14px",
                        }}
                        bodyStyle={{ fontSize: "14px" }}
                        body={(rowData: INoteList) => {
                            return (
                                <span
                                // style={{
                                //     backgroundColor: rowData.color
                                //         ? rowData.color
                                //         : "#eeeeee"
                                // }}
                                // className="badge rounded-pill"
                                >
                                    <SafeHtml
                                        htmlContent={
                                            rowData.notes
                                        }
                                    />
                                </span>
                            );
                        }}
                    />
                </DataTable>
            </div>
            {isDeleteConfirmation && (
                <ConfirmationModal
                    show={isDeleteConfirmation}
                    onHide={() => setIsDeleteConfirmation(false)}
                    handleSubmit={() =>
                        handleDeletenote(
                            hasIdAvail,
                            setIsDeleteConfirmation,
                            setNoteList,
                            setLoading
                        )
                    }
                    title={"Delete this Note"}
                    message={"Are You Sure You Want To Delete This Note?"}
                    btn1="CANCEL"
                    btn2="DELETE"
                />
            )}
            {isCreateModel && (
                <CreateNoteView
                    show={isCreateModel}
                    onHide={() => {
                        setIsCreateModel(false);
                        // setSearchTermFromRightSide("");
                    }}
                    setLoading={setLoading}
                    headerName="Create Note"
                    handelRefreshNotes={handelRefreshNotes}
                    productToEdit={undefined}
                />
            )}
            {isUpdateModel && (
                <CreateNoteView
                    show={isUpdateModel}
                    onHide={() => {
                        setIsUpdateModel(false);
                        // setSearchTermFromRightSide("");
                    }}
                    setLoading={setLoading}
                    headerName="Update Note"
                    handelRefreshNotes={handelRefreshNotes}
                    productToEdit={editableProduct}
                />
            )}
        </div>
    );
};

export default PersonalNotesReport;