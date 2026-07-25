import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { axiosInstance } from "../../../../../services/axiosInstance";
import { ITaskCreate } from "../../../../right-side/create-task/CreateTaskController";
import CreateTaskView from "../../../../right-side/create-task/CreateTaskView";
import { ITaskTemplateView } from "./TaskTemplateController";

const TaskTemplateDataSourceView = ({
  show,
  onHide,
  passDataInAddItem,
  title,
}: {
  show: boolean;
  onHide: () => void;
  passDataInAddItem: ITaskTemplateView | undefined;
  title: string;
}) => {
  const getUUID = localStorage.getItem("UUID");
  const token = localStorage.getItem("token");

  useEffect(() => {
    const handleKeyDown = (event: any) => {
      if (event.key === "Enter") {
        event.preventDefault();
      }
    };

    if (show) {
      document.addEventListener("keydown", handleKeyDown);
    } else {
      document.removeEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [show]);

  const [dataSource, setDataSource] = useState<number>(0);
  const [sources, setSources] = useState<
    {
      id: number;
      task_title: string;
      data_sorce: string;
      display_order: number;
      notification_time_gap: number | string;
      notification_time: number | string;
      is_depend_on_previous_task: boolean;
    }[]
  >([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [targetVsIncentiveList, setTargetVsIncentiveList] = useState<
    ITaskCreate[]
  >([]);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editingSrNo, setEditingSrNo] = useState<number | null>(null);
  const [isOpenEditModel, setIsOpenEditModel] = useState(false);
  // Fetch data sources from server
  const getDatavalues = async () => {
    if (!passDataInAddItem?.id) return;

    const requestData = {
      a_application_login_id: getUUID,
      task_template_master_id: passDataInAddItem?.id,
      isDelete: 0,
    };

    try {
      setLoading(true);
      const response = await axiosInstance.post(
        "getTaskTemplateDataSource",
        requestData,
      );

      let newSources: {
        id: number;
        task_title: string;
        data_sorce: string;
        display_order: number;
        notification_time_gap: number | string;
        notification_time: number | string;
        is_depend_on_previous_task: boolean;
      }[] = [];

      if (response.data && Array.isArray(response.data)) {
        newSources = response.data
          .map((item: any, index: number) => ({
            id: item.id,
            data_sorce:
              typeof item.data_sorce === "object"
                ? item.data_sorce?.id || ""
                : item.data_sorce?.trim() || "",
            task_title:
              typeof item.data_sorce === "object"
                ? item.data_sorce?.task_title.trim() || ""
                : item.data_sorce?.trim() || "",
            display_order: item.display_order || index + 1,
            notification_time_gap: item.notification_time_gap || "",
            notification_time: item.notification_time || "",
            is_depend_on_previous_task:
              item.is_depend_on_previous_task === 1 ? true : false || false,
          }))
          .filter(
            (item: {
              id: number;
              task_title: string;
              data_sorce: string;
              display_order: number;
            }) => item.data_sorce !== "",
          );
      } else if (
        response.data &&
        response.data.data &&
        Array.isArray(response.data.data)
      ) {
        newSources = response.data.data
          .map((item: any, index: number) => ({
            id: item.id,
            data_sorce:
              typeof item.data_sorce === "object"
                ? item.data_sorce?.id || ""
                : item.data_sorce?.trim() || "",
            task_title:
              typeof item.data_sorce === "object"
                ? item.data_sorce?.task_title.trim() || ""
                : item.data_sorce?.trim() || "",
            display_order: item.display_order || index + 1,
            notification_time_gap: item.notification_time_gap || "",
            notification_time: item.notification_time || "",
            is_depend_on_previous_task:
              item.is_depend_on_previous_task === 1 ? true : false || false,
          }))
          .filter(
            (item: {
              id: number;
              task_title: string;
              data_sorce: string;
              display_order: number;
            }) => item.data_sorce !== "",
          );
      }

      setSources(newSources);
    } catch (error) {
      console.error("Error fetching sources:", error);
      toast.error("Failed to load sources");
    } finally {
      setLoading(false);
    }
  };

  const onHides = () => {
    setIsOpenEditModel(false);
    getDatavalues();
  };

  useEffect(() => {
    if (show && passDataInAddItem?.id) {
      getDatavalues();
    } else {
      setSources([]);
      setEditIndex(null);
      setDataSource(0);
      setEditingSrNo(null);
    }
  }, [show, passDataInAddItem?.id]);

  const handleSrNoChange = (itemId: number, newSrNo: string) => {
    const updatedSources = sources.map((item) =>
      item.id === itemId
        ? { ...item, display_order: parseInt(newSrNo) || 0 }
        : item,
    );
    setSources(updatedSources);
  };

  const handleSrNoBlur = async (itemId: number, srNo: number) => {
    setEditingSrNo(null);

    const requestData = {
      table: "task_templete_datasources",
      where: `{"id":"${itemId}"}`,
      data: `{"display_order":"${srNo}"}`,
    };

    try {
      const response = await axiosInstance.post("commonUpdate", requestData);
    } catch (error) {
      console.error("Error updating Sr No:", error);
      getDatavalues();
    }
  };

  const handleDayGapNotifiedChange = async (
    itemId: number,
    gap: number | string,
  ) => {
    const updatedSources = sources.map((item) =>
      item.id === itemId
        ? { ...item, notification_time_gap: parseInt(String(gap)) || 0 }
        : item,
    );
    setSources(updatedSources);
    const requestData = {
      table: "task_templete_datasources",
      where: `{"id":"${itemId}"}`,
      data: `{"notification_time_gap":"${gap}"}`,
    };

    try {
      await axiosInstance.post("commonUpdate", requestData);
    } catch (error) {
      console.error("Error updating Sr No:", error);
      getDatavalues();
    }
  };

  const handleTimeNotifiedChange = async (
    itemId: number,
    time: number | string,
  ) => {
    const updatedSources = sources.map((item) =>
      item.id === itemId ? { ...item, notification_time: time || 0 } : item,
    );
    setSources(updatedSources);
    const requestData = {
      table: "task_templete_datasources",
      where: `{"id":"${itemId}"}`,
      data: `{"notification_time":"${time}"}`,
    };

    try {
      await axiosInstance.post("commonUpdate", requestData);
    } catch (error) {
      console.error("Error updating Sr No:", error);
      getDatavalues();
    }
  };

  const handleCheckboxChange = async (itemId: number, checked: boolean) => {
    const updatedSources = sources.map((item) =>
      item.id === itemId
        ? { ...item, is_depend_on_previous_task: checked || false }
        : item,
    );
    setSources(updatedSources);
    const requestData = {
      table: "task_templete_datasources",
      where: `{"id":"${itemId}"}`,
      data: `{"is_depend_on_previous_task":"${checked ? 1 : 2}"}`,
    };

    try {
      await axiosInstance.post("commonUpdate", requestData);
    } catch (error) {
      console.error("Error updating Sr No:", error);
      getDatavalues();
    }
  };

  const handleChangeInput = (data_sorce: string) => {
    setDataSource(Number(data_sorce));
    setIsOpenEditModel(true);
  };

  return (
    <React.Fragment>
      {show && (
        <div className="modal1">
          <div className="modal-content1" style={{ maxHeight: "80%" }}>
            <strong> Data Sources Of : {title}</strong>
            <span className="close" onClick={onHide}>
              ×
            </span>

            <div className="m-title-2 col-12">
              <div className="head">
                <div
                  className="source-of-type-list-grid-block"
                  style={{ overflowX: "scroll", maxHeight: "550px" }}
                >
                  {loading && sources.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "20px" }}>
                      Loading sources...
                    </div>
                  ) : sources.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "20px",
                        color: "#888",
                      }}
                    >
                      No data sources added yet.
                    </div>
                  ) : (
                    <div className="source-of-type-list-grid-main">
                      <table className="table table-hover" border={0}>
                        <thead>
                          <tr>
                            <th
                              className="text-center"
                              style={{ width: "100px" }}
                            >
                              Sr No
                            </th>
                            <th className="">Data Sources</th>
                            <th className="text-center">
                              Day Gap To Notified
                              <span style={{ fontSize: "10px", color: "red" }}>
                                <br />0 indicates that messages will be sent on
                                the starting date.
                              </span>
                            </th>
                            <th className="text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="text-center">
                          {sources.map((item, index) => {
                            let parsedData;
                            try {
                              parsedData = item.data_sorce;
                            } catch (error) {
                              parsedData = item.data_sorce;
                            }
                            return (
                              <tr key={item.id}>
                                <td className="text-center">
                                  <input
                                    type="text"
                                    className="form-control"
                                    style={{
                                      width: "80px",
                                      margin: "0 auto",
                                      textAlign: "center",
                                    }}
                                    value={item.display_order}
                                    onChange={(e) =>
                                      handleSrNoChange(item.id, e.target.value)
                                    }
                                    onFocus={() => setEditingSrNo(item.id)}
                                    onBlur={() =>
                                      handleSrNoBlur(
                                        item.id,
                                        item.display_order,
                                      )
                                    }
                                    min="1"
                                  />
                                </td>
                                <td className="text-start">
                                  <span>#{item.data_sorce}</span>
                                  <br />
                                  <span>
                                    <strong>Task Title : </strong>
                                    {item.task_title}
                                  </span>
                                </td>
                                <td className="text-center">
                                  <div className="d-flex">
                                    <div style={{ margin: "0 10px 0 0" }}>
                                      <span>Day Gap</span>
                                      <input
                                        type="text"
                                        className="form-control"
                                        style={{
                                          width: "80px",
                                          margin: "0 auto",
                                          textAlign: "center",
                                        }}
                                        value={item.notification_time_gap}
                                        onChange={(e) =>
                                          handleDayGapNotifiedChange(
                                            item.id,
                                            e.target.value,
                                          )
                                        }
                                        min="1"
                                      />
                                    </div>
                                    <div style={{ margin: "0 10px 0 0" }}>
                                      <span>Time</span>
                                      <input
                                        type="time"
                                        className="form-control"
                                        style={{
                                          width: "130px",
                                          margin: "0 auto",
                                          textAlign: "center",
                                        }}
                                        value={item.notification_time}
                                        onChange={(e) =>
                                          handleTimeNotifiedChange(
                                            item.id,
                                            e.target.value,
                                          )
                                        }
                                      />
                                    </div>
                                    <div>
                                      <span>Is depent on previous task</span>
                                      <br />
                                      <input
                                        disabled={index === 0}
                                        type="checkbox"
                                        checked={
                                          item.is_depend_on_previous_task
                                        }
                                        onChange={(e) =>
                                          handleCheckboxChange(
                                            item.id,
                                            e.target.checked,
                                          )
                                        }
                                      />
                                    </div>
                                  </div>
                                </td>
                                <td className="text-center">
                                  <span
                                    style={{ cursor: "pointer" }}
                                    onClick={() =>
                                      handleChangeInput(item.data_sorce)
                                    }
                                  >
                                    <svg
                                      viewBox="0 0 24 24"
                                      width="24"
                                      height="24"
                                      className=""
                                    >
                                      <path
                                        fill="currentColor"
                                        d="M3.95 16.7v3.4h3.4l9.8-9.9-3.4-3.4-9.8 9.9zm15.8-9.1c.4-.4.4-.9 0-1.3l-2.1-2.1c-.4-.4-.9-.4-1.3 0l-1.6 1.6 3.4 3.4 1.6-1.6z"
                                      />
                                    </svg>
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {isOpenEditModel && (
        <CreateTaskView
          show={isOpenEditModel}
          onHide={() => onHides()}
          headerName="Edit Task"
          productToEdit={dataSource || undefined}
          setTargetVsIncentiveList={setTargetVsIncentiveList}
          setLoading={setLoading}
        />
      )}
    </React.Fragment>
  );
};

export default TaskTemplateDataSourceView;
