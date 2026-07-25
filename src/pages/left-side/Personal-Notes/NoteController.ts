import { toast } from "react-toastify";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../helpers/AppConstants";
import { TReactSetState } from "../../../helpers/AppType";
import {
  axiosInstance
} from "../../../services/axiosInstance";

export interface INoteList {
  notes: string;
  id: number;
  color: string | undefined | null;
  created_date_time?: string;
}

export interface INote {
  note_name: string;
  color: string | undefined | null;
  created_date_time?: string;
}

export const createnote = async (
  noteInput: INote,
  setLoading: TReactSetState<boolean>,
  clearFormCallback: () => void
) => {
  const getUUID = await localStorage.getItem("UUID");

  const NoteReplce = noteInput.note_name.replace(/\n/g, "<br>");
  const requestData = {
    table: "personal_notes",
    data: `{"notes":"${NoteReplce}","color":"${noteInput.color
      }","a_application_login_id":${Number(getUUID)}}`,
  };
  try {
    const { data } = await axiosInstance.post("commonCreate", requestData
    );

    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        toast.success(data.ack_msg);
        clearFormCallback();

      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const handleDeletenote = async (
  categoryId: number | undefined,
  setIsDeleteConfirmation: TReactSetState<boolean>,
  setNoteList: TReactSetState<INoteList[]>,
  setLoading: TReactSetState<boolean>
) => {
  const requestData = {
    table: "personal_notes",
    where: `{"id":${categoryId}}`,
    data: `{"isDelete":"1"}`,
  };
  const getUUID = localStorage.getItem("UUID")
  try {
    const data = await axiosInstance.post("commonUpdate", requestData

    );
    if (data.data.code === 200) {
      if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setIsDeleteConfirmation(false);
        fetchNoteApi(setNoteList, setLoading);
        toast.success("Personal Note Deleted Successfully");

      } else {
        toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const fetchNoteApi = async (
  setNoteList: TReactSetState<INoteList[]>,
  setLoading: TReactSetState<boolean>
) => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    table: "personal_notes",
    columns: "id,notes,color",
    where: ["isDelete=0", `a_application_login_id=${getUUID}||0`],
    request_flag: 0,
    order: `{"id":"DESC"}`,
    personal_flag: 1
  };
  try {
    const data = await axiosInstance.post("commonGet", requestData

    );
    if (data.status === 200) {
      if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        setLoading(false);
        setNoteList([]);
      }
      setLoading(true);
      setNoteList(data.data.data);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }
};

export const updateNote = async (
  noteInput: INote,
  editNoteId: number | undefined,
  setLoading: TReactSetState<boolean>,
  clearFormCallback: () => void
) => {
  const NoteReplce = noteInput.note_name.replace(/\n/g, "<br>");

  const requestData = {
    table: "personal_notes",
    where: `{"id":"${editNoteId}"}`,
    data: `{"notes":"${NoteReplce}","color":"${noteInput.color
      }"}`,
  };
  const getUUID = localStorage.getItem("UUID")

  try {
    const { data } = await axiosInstance.post("commonUpdate", requestData

    );
    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        clearFormCallback();
        toast.success(data.ack_msg);
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};
