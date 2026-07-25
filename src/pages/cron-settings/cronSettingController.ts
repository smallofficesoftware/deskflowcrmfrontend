import { toast } from "react-toastify";
import { TReactSetState } from "../../helpers/AppType";
import { axiosInstance } from "../../services/axiosInstance";

export interface ICronData {
  id: number;
  cron_title: string;
  cron_time: string;
  cron_start_time: string;
  cron_stop_time: string;
  created_date_time: string;
  displayCronTime: string;
  crone_tab_start_stop_flag: string | number;
}

export const addCronData = async (title: string, selectDuration: string) => {
  const token = localStorage.getItem("token")
  const requestedData = {
    cron_title: title,
    cron_time: selectDuration,
  };

  const data = await axiosInstance.post("addCron", requestedData, {
    headers: {
      Authorization: `${token}`
    }
  });

  if (data.data.ack != 3) {
    return data.data;
  }
  else if (data.data.ack == 3) {
    toast.error(data.data.ack_msg)

  }
};

export const viewCronData = async (
  setCronData: TReactSetState<ICronData[]>
) => {
  const token = localStorage.getItem("token")
  const data = await axiosInstance.post("viewCron", {}, {
    headers: {
      Authorization: `${token}`
    }
  });

  if (data.data.ack != 3) {
    setCronData(data.data.data.item);
  }
  else if (data.data.ack == 3) {
    toast.error(data.data.ack_msg)

  }
};

export const startReminderNotificationCron = async (
  id: number,
  time: string,
  title: string
) => {
  const token = localStorage.getItem("token")
  const requestedData = {
    request_flag: 1,
    id: id,
    cron_time: time,
    // cron_title: title,
  };

  const data = await axiosInstance.post(
    "start-stop-reminder-notificaition",
    requestedData,
    {
      headers: {
        Authorization: `${token}`
      }
    }
  );
  return data.data;
};




export const stopCron = async (id: number) => {
  const token = localStorage.getItem("token")

  const requestedData = {
    request_flag: 2,
    id: id,
  };

  const data = await axiosInstance.post(
    "start-stop-reminder-notificaition",
    requestedData,
    {
      headers: {
        Authorization: `${token}`
      }
    }
  );
  return data.data;
};

export const startAllCron = async () => {
  try {
    const token = localStorage.getItem("token")

    const data = await axiosInstance.post("startAllCron", {}, {
      headers: {
        Authorization: `${token}`
      }
    });
    return data.data;
  } catch (error) {
    console.error("Failed to start all cron job:", error);
    return error;
  }
};

export const stopAllCron = async () => {
  try {
    const token = localStorage.getItem("token")

    const data = await axiosInstance.post("stopAllCron", {},
      {
        headers: {
          Authorization: `${token}`
        }
      }
    );
    return data.data;
  } catch (error) {
    console.error("Failed to stop all cron job:", error);
    return error;
  }
};

export const stopCroneTab = async (title: string) => {
  try {
    const token = localStorage.getItem("token")

    const data = await axiosInstance.post("mainCommonUpdate", { table: "cron_jobs", where: `{"cron_title":"crone_tab_remainder_notification"}`, data: `{"crone_tab_start_stop_flag":"0"}` },
      {
        headers: {
          Authorization: `${token}`
        }
      }
    );
    return data.data;
  } catch (error) {
    console.error("Failed to stop all cron job:", error);
    return error;
  }
};

export const startCroneTab = async (title: string) => {
  try {
    const token = localStorage.getItem("token")

    const data = await axiosInstance.post("mainCommonUpdate", { table: "cron_jobs", where: `{"cron_title":"crone_tab_remainder_notification"}`, data: `{"crone_tab_start_stop_flag":"1"}` },
      {
        headers: {
          Authorization: `${token}`
        }
      }
    );
    return data.data;
  } catch (error) {
    console.error("Failed to start all cron job:", error);
    return error;
  }
};
