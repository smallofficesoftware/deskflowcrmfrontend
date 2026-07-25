import { useEffect, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../common/SharedFunction";
import ConfirmationModal from "../../../components/model/ConfirmationModal";
import { useTheme } from "../../../components/ThemeContext";
import {
  DEFAULT_MESSAGE_ERROR_PERMISSION
} from "../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../helpers/AppEnum";
import { TOnChangeInput } from "../../../helpers/AppType";
import useCheckUserPermission from "../../../hooks/useCheckUserPermission";
import CreateNoteView from "./CreateNoteView";
import {
  createnote,
  fetchNoteApi,
  handleDeletenote,
  INoteList,
  updateNote,
} from "./NoteController";

interface IPropsNote {
  isNoteOpen: boolean;
  closeNote: () => void;
}

const ListNoteView = ({ isNoteOpen, closeNote }: IPropsNote) => {
  const [noteLists, setNoteList] = useState<INoteList[]>([]);
  const [noteInput, setNoteInputInput] = useState("");
  const [noteError, setNoteError] = useState("");
  const [noteHexColorInput, setNoteHexColorInput] = useState("#999999");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const { darkMode, toggleTheme } = useTheme();
  const [hasIdAvail, setHasIdAvail] = useState<number>();
  const [noteDropdown, setNoteDropdown] = useState<number | null>(null);
  const [editNoteId, setEditNoteId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [isLoadedMessage, setIsLoadedMessage] = useState(false);
  const dropdownContactRef = useRef<Record<number, HTMLUListElement | null>>(
    {}
  );
  const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
  const [existingNoteContent, setExistingNoteContent] = useState<string>("");
  const [editorContentToEdit, setEditorContentToEdit] = useState("");
  const [emptyTextArea, setemptyTextArea] = useState(false);
  const [initialContent, setInitialContent] = useState("");

  const [isCreateModel, setIsCreateModel] = useState<boolean>(false);
  const [isUpdateModel, setIsUpdateModel] = useState<boolean>(false);
  const [editableProduct, setEditableProduct] = useState<INoteList>({
    notes: "",
    id: 0,
    color: "",
    created_date_time: "",
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

  // escape handle
  useEscapeKey(closeNote);

  const handleSend = (fieldName: string, html: string) => {
    setNoteInputInput(html);
  };

  const clearForm = () => {
    setNoteHexColorInput("#999999");
    setExistingNoteContent("");
    setNoteInputInput("");
    setEditorContentToEdit("");
    setIsEditing(false);
    setEditNoteId(undefined);
    setemptyTextArea(true);
  };

  const toggleDropdownCategory = (noteId: number | undefined) => {
    if (!noteId) return;

    setNoteDropdown((prev) => (prev === noteId ? null : noteId));
    setHasIdAvail(noteId);
  };
  const handleClickOutside = (event: { target: any }) => {
    const clickedOutside = Object.values(dropdownContactRef.current).every(
      (ref) => ref && !ref.contains(event.target)
    );
    if (clickedOutside) {
      setNoteDropdown(null);
    }
  };

  useEffect(() => {
    if (noteDropdown !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [noteDropdown]);

  useEffect(() => {
    if (canView) {
      if (isNoteOpen) {
        fetchNoteApi(setNoteList, setLoading);
      }
    }
  }, [isNoteOpen, canView]);

  const handleEdit = (item: INoteList) => {
    if (canEdit) {
      // setEditorContentToEdit(item.notes);
      setNoteDropdown(null);
      // setNoteInputInput("");
      // setNoteHexColorInput(item.color || "#999999");
      // setIsEditing(true);
      // setEditNoteId(item.id);
      // setNoteError("");
      setEditableProduct(item);
      setIsUpdateModel(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handelChangeHexColor = (event: TOnChangeInput) => {
    setNoteHexColorInput(event.target.value);
  };

  const handelRefreshNotes = async () => {
    if (canView) {
      await fetchNoteApi(setNoteList, setLoading);
    }
  };

  const handelSubmit = () => {
    const cleanedNoteInput = noteInput
      .split(/<p><br><\/p>|<br>/)
      .filter((line) => line.trim() !== "")
      .join("");

    const isEmptyContent = /^(\s*<p><br><\/p>\s*)*$/i.test(cleanedNoteInput);

    if (isEmptyContent) {
      setNoteError("Note name is required");
      return;
    }

    setNoteError("");
    if (cleanedNoteInput) {
      if (isEditing && editNoteId !== null) {
        updateNote(
          {
            note_name: cleanedNoteInput,
            color: noteHexColorInput,
          },
          editNoteId,
          setLoading,
          clearForm
        );
      } else {
        if (!canAdd) {
          toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
          return;
        }
        createnote(
          {
            note_name: cleanedNoteInput,
            color: noteHexColorInput,
          },
          setLoading,
          () => {
            clearForm();
          }
        );
      }
    } else {
      setNoteError("Note name is required");
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

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setNoteDropdown(null);
        // setIsActionDropdownOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscKey);

    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, []);

  const openCreateNoteView = () => {
    if (canAdd) {
      setIsCreateModel(true);
    } else {
      setIsCreateModel(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  }

  return (
    <>
      {isNoteOpen ? (
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
                onClick={closeNote}
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

            <div className="newText col-7">
              <h2 className="">Personal Notes List</h2>
            </div>
            <div className="col-4 text-end mb-2">
              <div
                className="ICON"
                style={{
                  position: "absolute",
                  right: "60px",
                }}
              >
                <button
                  className="icons"
                  onClick={openCreateNoteView}
                  title="Refresh"
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
                  onClick={handelRefreshNotes}
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
                <div
                  className="head personal-note-head"
                  style={{ display: "block" }}
                >
                  {/* <label
                    className="form-check-label"
                    htmlFor="flexCheckDefault"
                  >
                    <h4>
                      Enter Note<span className="text-danger">*</span>
                    </h4>
                  </label>
                  <div className="col-12 d-flex">
                    <div
                      className="col-9 d-flex justify-content-end align-items-center mx-1"
                      style={{ maxWidth: "250px" }}
                    >
                      <NoteEditor
                        fieldName={noteInput}
                        onSend={handleSend}
                        editMsg={editorContentToEdit}
                        emptyTextArea={emptyTextArea}
                        setemptyTextArea={setemptyTextArea}
                        setInitialContent={setInitialContent}
                        setNoteInputInput={setNoteInputInput}
                      />
                    </div>

                    <div className="col-3 d-flex justify-content-end align-items-center mx-1">
                      <input
                        type="color"
                        value={noteHexColorInput}
                        className="mx-2"
                        style={{ width: "30px", height: "30px" }}
                        onChange={(e) => handelChangeHexColor(e)}
                        required
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
                  </div> */}
                  <div>
                    {canView ? (
                      <>
                        {loading ? (
                          Array.from({ length: 5 }).map((_, index) => (
                            <div className="chats" key={index}>
                              <button className="block chat-list">
                                <div className="h-text ps-2">
                                  <Skeleton
                                    width="80%"
                                    height={15}
                                    duration={5}
                                    style={{ opacity: darkMode ? "" : 0.8 }}
                                  />
                                  <Skeleton
                                    width="80%"
                                    height={15}
                                    duration={5}
                                    style={{ opacity: darkMode ? "" : 0.8 }}
                                  />
                                  <Skeleton
                                    width="80%"
                                    height={15}
                                    duration={5}
                                    style={{ opacity: darkMode ? "" : 0.8 }}
                                  />
                                  <Skeleton
                                    width="80%"
                                    height={15}
                                    duration={5}
                                    style={{ opacity: darkMode ? "" : 0.8 }}
                                  />
                                  <Skeleton
                                    width="80%"
                                    height={15}
                                    duration={5}
                                    style={{ opacity: darkMode ? "" : 0.8 }}
                                  />
                                  <Skeleton
                                    width="80%"
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
                            <div
                              className="chats"
                              style={{ paddingTop: "30px" }}
                            >
                              <p
                                className={`${noteLists ? "" : "text-center pt-5"
                                  }`}
                              >
                                {noteLists ? "" : "No Data Found"}
                              </p>
                              {noteLists &&
                                noteLists.map((item, index) => (
                                  <>
                                    <button
                                      key={index}
                                      className={`block chat-list ${isEditing}`}
                                      style={{ padding: "6" }}
                                    >
                                      <div
                                        className="h-text ps-2 "
                                        style={{
                                          display: "flex",
                                          justifyContent: "space-between",
                                        }}
                                      >
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
                                            }}
                                          >
                                            <div
                                              className="personal_note"
                                              key={item.id}
                                              style={{ color: "#000000" }}
                                              dangerouslySetInnerHTML={{
                                                __html: item.notes,
                                              }}
                                            />
                                          </h4>
                                        </div>

                                        <div>
                                          {item.id === -1 ? (
                                            <span></span>
                                          ) : (
                                            <>
                                              <button
                                                className="icon-more float-end d-flex"
                                                onClick={() =>
                                                  toggleDropdownCategory(
                                                    item.id
                                                  )
                                                }
                                              >
                                                <span
                                                  style={{
                                                    backgroundColor: item.color
                                                      ? item.color
                                                      : "#999999",
                                                    height: "15px",
                                                    width: "15px",
                                                    display: "inline-block",
                                                  }}
                                                  className="badge rounded-pill"
                                                ></span>
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
                                                className={`source-of-types-options labelDropLeft ${noteDropdown === item.id ? "isVisible" : "isHidden"
                                                  }`}
                                                id="dropLeft"
                                                ref={(el) =>
                                                (dropdownContactRef.current[
                                                  item.id
                                                ] = el)
                                                }
                                                style={{
                                                  width: "120px",
                                                  right: "0%",
                                                  // top: "30%",
                                                }}
                                              >
                                                <li
                                                  className="listItem text-start"
                                                  role="button"
                                                  onClick={() =>
                                                    handleEdit(item)
                                                  }
                                                >
                                                  Edit
                                                </li>
                                                <li
                                                  className="listItem text-start"
                                                  role="button"
                                                  onClick={() =>
                                                    handleCopyNotes(item)
                                                  }
                                                >
                                                  Copy Notes
                                                </li>
                                                <li
                                                  className="listItem text-start"
                                                  role="button"
                                                  onClick={openDeleteModel}
                                                  style={{ color: "red", fontWeight: "600" }}
                                                >
                                                  Delete
                                                </li>
                                              </ul>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </button>
                                  </>
                                ))}
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <p className="text-danger p-1">
                        {DEFAULT_MESSAGE_ERROR_PERMISSION}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
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
        </div>
      ) : null}
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
    </>
  );
};

export default ListNoteView;
