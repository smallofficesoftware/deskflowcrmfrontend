// useStickyNotes.ts
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { axiosInstance } from "../../services/axiosInstance";

export interface IStickyCategory {
    category_id: number;
    category_name: string;
    category_color: string;
    notes: IStickyNote[];
}

export interface IStickyNote {
    id: number;
    title?: string;
    content: string;
    category_id: number;
    category_name: string;
    color: string;
    created_date_time: string;
    status?: number;
    position_x?: number;
    position_y?: number;
    z_index?: number;
}

export const useStickyNotes = (categoryIds: string) => {
    const [notesData, setNotesData] = useState<IStickyCategory[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchStickyNotes = useCallback(async () => {
        if (!categoryIds) return;
        setLoading(true);
        try {
            const getUUID = localStorage.getItem("UUID");
            const res = await axiosInstance.post("stickyNotesGet", {
                task_category_id: categoryIds,
                a_application_login_id: getUUID,
            });

            setNotesData(res?.data?.data?.item || []);
        } catch (err: any) {
            toast.error(err?.response?.data?.ack_msg || "Failed to load notes");
        } finally {
            setLoading(false);
        }
    }, [categoryIds]);

    // Create New Note
    const createNote = useCallback(
        async (categoryId: any, content: string) => {

            try {

                const getUUID = localStorage.getItem("UUID");

                await axiosInstance.post("stickyNotesCreate", {
                    task_category_id: categoryId,
                    content: content,
                    a_application_login_id: getUUID,
                });

                toast.success("Note created");

                // refresh latest data
                await fetchStickyNotes();

            } catch (err: any) {

                toast.error(
                    err?.response?.data?.ack_msg ||
                    "Failed to create note"
                );
            }

        },
        [fetchStickyNotes]
    );


    // Update Note Status (for checkbox)
    const updateNoteStatus = useCallback(
        async (
            noteId: number,
        ) => {

            try {

                const getUUID = localStorage.getItem("UUID");

                await axiosInstance.post("stickyNotesComplate", {
                    note_id: noteId,
                    a_application_login_id: getUUID,
                });

                await fetchStickyNotes();

            } catch (err) {

                toast.error("Failed to update note");
            }

        },
        [fetchStickyNotes]
    );
    const deleteNote = useCallback(
        async (noteId: number) => {

            try {

                const getUUID = localStorage.getItem("UUID");

                await axiosInstance.post("stickyNotesDelete", {
                    note_id: noteId,
                    a_application_login_id: getUUID,
                });

                toast.success("Note deleted");

                await fetchStickyNotes();

            } catch (err) {

                toast.error("Failed to delete note");
            }

        },
        [fetchStickyNotes]
    );

    const editNote = useCallback(
        async (
            noteId: number,
            content: string
        ) => {

            try {

                const getUUID = localStorage.getItem("UUID");

                await axiosInstance.post("stickyNotesEdit", {
                    note_id: noteId,
                    content: content,
                    a_application_login_id: getUUID,
                });

                toast.success("Note updated");

                await fetchStickyNotes();

            } catch (err) {

                toast.error("Failed to edit note");
            }

        },
        [fetchStickyNotes]
    );

    useEffect(() => {
        fetchStickyNotes();
    }, [fetchStickyNotes]);

    return {
        notesData,
        loading,
        fetchStickyNotes,
        createNote,
        updateNoteStatus,
        editNote,
        deleteNote
    };
};