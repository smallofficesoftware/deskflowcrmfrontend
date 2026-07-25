import { useEffect, useState } from "react";
import { handleRefresh } from "../../common/SharedFunction";
import {
  addCronData,
  ICronData,
  startAllCron,
  startCroneTab,
  startReminderNotificationCron,
  stopAllCron,
  stopCron,
  stopCroneTab,
  viewCronData,
} from "./cronSettingController";

const CronSetting = () => {
  const [title, setTitle] = useState("");
  const [selectDuration, setSelectDuration] = useState("");
  const [message, setMessage] = useState("");
  const [cronData, setCronData] = useState<ICronData[]>([]);

  useEffect(() => {
    viewCronData(setCronData);
  }, []);

  const handleSubmit = async () => {
    await addCronData(title, selectDuration);
    handleRefresh();
  };

  const handleStartCron = async (id: number, time: string, title: string) => {
    if (title === "reminder_notification") {
      await startReminderNotificationCron(id, time, title);
      handleRefresh();
    } else {
      console.log("error");
    }
  };

  const handleStopCron = async (id: number, title: string) => {
    if (title === "reminder_notification") {
      await stopCron(id);
      handleRefresh();
    } else {
      console.log("error");
    }
  };

  const handleStopCronTab = async (title: string) => {
    await stopCroneTab(title);
    handleRefresh();
  };

  const handleStartCronTab = async (title: string) => {
    await startCroneTab(title);
    handleRefresh();
  };

  const handleStartAllCron = async () => {
    await startAllCron();
    handleRefresh();
  };

  const handleStopAllCron = async () => {
    await stopAllCron();
    handleRefresh();
  };

  const displayCronTimes = cronData.map((e) => {
    if (e.cron_time === "*/5 * * * * *") {
      e.displayCronTime = "Every 5 Seconds";
    } else if (e.cron_time === "* * * * *") {
      e.displayCronTime = "Every minute";
    } else if (e.cron_time === "*/5 * * * *") {
      e.displayCronTime = "Every 5 Minutes";
    } else if (e.cron_time === "*/15 * * * *") {
      e.displayCronTime = "Every 15 Minutes";
    } else if (e.cron_time === "*/30 * * * *") {
      e.displayCronTime = "Every 30 Minutes";
    } else if (e.cron_time === "0 */6 * * *") {
      e.displayCronTime = "Every 6 Hours";
    } else if (e.cron_time === "59 59 23 * * *") {
      e.displayCronTime = "Every Day";
    } else {
      e.displayCronTime = e.cron_time;
    }
    return e;
  });
  return (
    <div className="body">
      <div className="container main ">
        <div className="row Intro-Left1">
          <div className="col-12">
            <span className="d-flex justify-content-center mt-3">
              <img
                width={400}
                src={require("../../assets/images/deshFlow_log.png")}
                alt=""
              />
            </span>
            <div className="mt-3">
              <p className="text-center">Cron Settings</p>
              <center>
                <p className="fs-3">Add New Cron</p>
              </center>

              <form>
                <div className="row mb-3 w-100 align-items-center">
                  <div className="col-5">
                    <label>Select Cron Name</label>
                    <select
                      className="form-select"
                      onChange={(e) => setTitle(e.target.value)}
                    >
                      <option value="">Select</option>
                      <option value="reminder_notification">
                        Reminder Notification
                      </option>
                    </select>
                  </div>

                  <div className="col-5">
                    <label>Select Cron Time</label>
                    <select
                      className="form-select"
                      onChange={(e) => setSelectDuration(e.target.value)}
                    >
                      <option value="default">Select</option>
                      <option value="*/5 * * * * *">Every 5 Seconds</option>
                      <option value="* * * * *">Every Minute</option>
                      <option value="*/5 * * * *">Every 5 Minutes</option>
                      <option value="*/15 * * * *">Every 15 Minutes</option>
                      <option value="*/30 * * * *">Every 30 Minutes</option>
                      <option value="0 */6 * * *">Every 6 Hours</option>
                      <option value="59 59 23 * * *">Every Day</option>
                    </select>
                  </div>

                  <div className="col-2 d-flex justify-content-center align-items-center">
                    <button
                      type="button"
                      style={{ height: "35px", fontSize: "16px" }}
                      className="btn btn-success"
                      onClick={handleSubmit}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </form>
            </div>
            <br />
            <div className="mt-3">
              <p className="text-center fs-3">Cron List</p>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  marginTop: "20px",
                }}
              >
                <thead>
                  <tr>
                    <th
                      colSpan={3}
                      style={{
                        padding: "10px",
                        border: "1px solid #ddd",
                        textAlign: "left",
                      }}
                    ></th>
                    <th
                      colSpan={1}
                      style={{
                        padding: "10px",
                        border: "1px solid #ddd",
                        textAlign: "left",
                      }}
                    >
                      <button
                        style={{
                          background: "#28a745",
                          color: "white",
                          padding: "5px 10px 5px 10px",
                          borderRadius: "5px",
                          cursor: "pointer",
                          border: "0px",
                        }}
                        onClick={handleStartAllCron}
                      >
                        Start All Cron
                      </button>
                      <button
                        style={{
                          background: "#dc3545",
                          color: "white",
                          marginLeft: "15px",
                          padding: "5px 10px 5px 10px",
                          borderRadius: "5px",
                          cursor: "pointer",
                          border: "0px",
                        }}
                        onClick={handleStopAllCron}
                      >
                        Stop All Cron
                      </button>
                    </th>
                  </tr>
                  <tr style={{ backgroundColor: "#f4f4f4" }}>
                    <th
                      style={{
                        padding: "10px",
                        border: "1px solid #ddd",
                        textAlign: "left",
                      }}
                    >
                      No.
                    </th>
                    <th
                      style={{
                        padding: "10px",
                        border: "1px solid #ddd",
                        textAlign: "left",
                      }}
                    >
                      Cron Name
                    </th>
                    <th
                      style={{
                        padding: "10px",
                        border: "1px solid #ddd",
                        textAlign: "left",
                      }}
                    >
                      Cron Timing
                    </th>
                    <th
                      style={{
                        padding: "10px",
                        border: "1px solid #ddd",
                        textAlign: "left",
                      }}
                    >
                      Cron Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cronData &&
                    cronData.map((e, i) => {
                      return (
                        <tr
                          key={i}
                          style={{
                            backgroundColor: i % 2 === 0 ? "#f9f9f9" : "#fff",
                          }}
                        >
                          <td
                            style={{
                              padding: "10px",
                              border: "1px solid #ddd",
                            }}
                          >
                            {e.id}
                          </td>
                          <td
                            style={{
                              padding: "10px",
                              border: "1px solid #ddd",
                            }}
                          >
                            {e.cron_title}
                          </td>
                          <td
                            style={{
                              padding: "10px",
                              border: "1px solid #ddd",
                            }}
                          >
                            {e.displayCronTime}
                          </td>
                          <td
                            style={{
                              padding: "10px",
                              border: "1px solid #ddd",
                            }}
                          >
                            {((!e.cron_start_time && !e.cron_stop_time) ||
                              (!e.cron_start_time && e.cron_stop_time)) && (
                                <button
                                  style={{
                                    background: "#28a745",
                                    color: "white",
                                    padding: "5px 15px",
                                    borderRadius: "5px",
                                    cursor: "pointer",
                                    border: "0px",
                                  }}
                                  onClick={() =>
                                    handleStartCron(
                                      e.id,
                                      e.cron_time,
                                      e.cron_title
                                    )
                                  }
                                >
                                  Start
                                </button>
                              )}

                            {((!e.cron_start_time && !e.cron_stop_time) ||
                              (e.cron_start_time && !e.cron_stop_time)) && (
                                <button
                                  style={{
                                    background: "#dc3545",
                                    color: "white",
                                    marginLeft: "15px",
                                    padding: "5px 15px",
                                    borderRadius: "5px",
                                    cursor: "pointer",
                                    border: "0px",
                                  }}
                                  onClick={() => handleStopCron(e.id, e.cron_title)}
                                >
                                  Stop
                                </button>
                              )}

                            {
                              e.crone_tab_start_stop_flag ? (
                                <button
                                  style={{
                                    background: "#fac04bff",
                                    color: "white",
                                    marginLeft: "15px",
                                    padding: "5px 15px",
                                    borderRadius: "5px",
                                    cursor: "pointer",
                                    border: "0px",
                                  }}
                                  onClick={() => handleStopCronTab(e.cron_title)}
                                >
                                  Stop Crone Tab
                                </button>
                              ) : (
                                <button
                                  style={{
                                    background: "#40b531ff",
                                    color: "white",
                                    marginLeft: "15px",
                                    padding: "5px 15px",
                                    borderRadius: "5px",
                                    cursor: "pointer",
                                    border: "0px",
                                  }}
                                  onClick={() => handleStartCronTab(e.cron_title)}
                                >
                                  Start Crone Tab
                                </button>
                              )
                            }
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* <div className="d-flex justify-content-center ">
            <iframe
                src={`http://192.168.1.54/smalofficecrminstruction/${Number(id)}.html`}
                title="External HTML"
                width="100%"
                height="500px"
                style={{ border: "none" }}
              ></iframe>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CronSetting;
