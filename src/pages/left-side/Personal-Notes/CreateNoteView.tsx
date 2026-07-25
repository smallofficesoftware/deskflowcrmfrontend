import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from '../../../helpers/AppConstants';
import { PAGE_ID, PERMISSION_TYPE } from '../../../helpers/AppEnum';
import { TOnChangeInput, TReactSetState } from '../../../helpers/AppType';
import useCheckUserPermission from '../../../hooks/useCheckUserPermission';
import { createnote, INoteList, updateNote } from './NoteController';
import NoteEditor from './NoteEditor';

interface IPropsCreateNote {
    show: boolean;
    onHide: () => void;
    headerName: string;
    productToEdit: INoteList | undefined;
    setLoading: TReactSetState<boolean>;
    handelRefreshNotes: () => void;
}

const CreateNoteView = ({
    show,
    onHide,
    headerName,
    productToEdit,
    setLoading,
    handelRefreshNotes,
}: IPropsCreateNote) => {

    const [noteHexColorInput, setNoteHexColorInput] = useState("#999999");
    const [noteError, setNoteError] = useState("");
    const [noteInput, setNoteInputInput] = useState("");
    const [editorContentToEdit, setEditorContentToEdit] = useState("");
    const [emptyTextArea, setemptyTextArea] = useState(false);
    const [initialContent, setInitialContent] = useState("");

    const canAdd = useCheckUserPermission(
        PAGE_ID.PERSONAL_NOTE,
        PERMISSION_TYPE.ADD
    );

    const handelChangeHexColor = (event: TOnChangeInput) => {
        setNoteHexColorInput(event.target.value);
    };

    const handleSend = (fieldName: string, html: string) => {
        setNoteInputInput(html);
    };

    const clearForm = () => {
        setNoteHexColorInput("#999999");
        setNoteInputInput("");
        setEditorContentToEdit("");
        setemptyTextArea(true);
    };

    const handelSubmit = async () => {
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
            if (productToEdit && productToEdit.id !== null) {
                await updateNote(
                    {
                        note_name: cleanedNoteInput,
                        color: noteHexColorInput,
                    },
                    productToEdit.id,
                    setLoading,
                    clearForm
                );
            } else {
                if (!canAdd) {
                    toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                    return;
                }
                await createnote(
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

            onHide();
            handelRefreshNotes();
        } else {
            setNoteError("Note name is required");
        }
    };

    useEffect(() => {
        if (productToEdit) {
            setEditorContentToEdit(productToEdit.notes);
            setNoteInputInput("");
            setNoteHexColorInput(productToEdit.color || "#999999");
            setNoteError("");
        }
    }, []);

    return (
        <div>
            <React.Fragment>
                {show && (
                    <div className="modal1">
                        <div className="modal-content1" style={{ width: "30%" }}>
                            <span className="close" onClick={onHide}>
                                &times;
                            </span>
                            <h2 className="modal-title1 form_header_text">{headerName}</h2>

                            <div
                                className="head personal-note-head"
                                style={{ display: "block", marginLeft: "20px" }}
                            >
                                <label
                                    className="form-check-label"
                                    htmlFor="flexCheckDefault"
                                >
                                    <h6>
                                        Enter Note<span className="text-danger">*</span>
                                    </h6>
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

                                    <div className="col-2 d-flex justify-content-end align-items-center mx-1">
                                        <input
                                            type="color"
                                            value={noteHexColorInput}
                                            className="mx-2"
                                            style={{ width: "30px", height: "30px" }}
                                            onChange={(e) => handelChangeHexColor(e)}
                                            required
                                        />
                                    </div>
                                </div>
                                {noteError && (
                                    <div style={{ color: "red", zIndex: "1" }}>
                                        {noteError}
                                    </div>
                                )}
                            </div>

                            <div className="col-12 col-12 pt-4 pe-3 d-flex justify-content-end modal-buttons">
                                <button
                                    className="modal-button1"
                                    onClick={onHide}
                                    type="button"
                                >
                                    Close
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary px-4 py-2 ms-2 text-light form_label rounded-1"
                                    onClick={handelSubmit}
                                    style={{
                                        backgroundColor: "#f58634",
                                    }}
                                >
                                    {productToEdit ? "Save" : "Create"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </React.Fragment>
        </div>
    )
}

export default CreateNoteView;
