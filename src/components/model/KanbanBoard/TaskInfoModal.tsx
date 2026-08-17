import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../helpers/AppConstants";
import { ITaskView } from "../../../pages/left-side/header/Setting/taskList/TaskListController";
import { taskPriorityList } from "../../../pages/right-side/create-task/CreateTaskController";
import { axiosInstance } from "../../../services/axiosInstance";
import StatusTimeLine from "../EventLogModel/StatusTimeLine";

interface TaskInfoModalProps {
    title: string;
    show: boolean;
    onHide: () => void;
    supportTicketFlag: number;
    taskId: any
}

const TaskInfoModal = ({ title, show, onHide, supportTicketFlag, taskId }: TaskInfoModalProps) => {
    const [taskData, setTaskData] = useState<ITaskView[]>([]);
    const getTaskData = async () => {
        try {
            const getUUID = localStorage.getItem("UUID");
            const data = await axiosInstance.post("get-task", {
                a_application_login_id: getUUID,
                ul: 0,
                ll: 50,
            });
            if (data.status === 200) {
                if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
                    const items: ITaskView[] = data.data.data.item || [];
                    setTaskData(items.filter((item) => item.id === Number(taskId)));
                }
            }
        } catch (error: any) {
            toast.error(error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
    }
    useEffect(() => {
        if (taskId) {
            getTaskData()
        }
    }, [taskId])
    console.log("taskData", taskData)
    return (
        <div>
            {show && (
                <div className="modal1">
                    <div className="modal-content1" style={{ width: "92%" }}>
                        <div className="d-flex align-items-center justify-content-end">
                            <div className="col-8">
                                <h2 className="modal-title1 form_header_text">{title}</h2>
                            </div>
                            <div className="col-4">
                                <span className="close ms-3 pb-3" onClick={onHide}>
                                    &times;
                                </span>
                            </div>
                        </div>
                        <div className="m-title-2">
                            <div className="row">
                                <div className="col-6">
                                    <table className="table table-bordered table-sm">
                                        <tbody>
                                            <tr>
                                                <th>Task ID</th>
                                                <td>{taskData[0]?.id}</td>
                                            </tr>
                                            <tr>
                                                <th>Title</th>
                                                <td>{taskData[0]?.task_title}</td>
                                            </tr>
                                            <tr>
                                                <th>Description</th>
                                                <td>{taskData[0]?.task_remark}</td>
                                            </tr>
                                            <tr>
                                                <th>Priority</th>
                                                <td>{taskPriorityList.find((e) => e.id === (taskData[0]?.task_priority + ""))?.mode_name}</td>
                                            </tr>
                                            <tr>
                                                <th>Status</th>
                                                <td>
                                                    <span className="py-1 px-2 text-white" style={{ backgroundColor: taskData[0]?.stage_status_color, borderRadius: "10px" }}>{taskData[0]?.stage_status_name}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <th>Assigned To</th>
                                                <td>{taskData[0]?.assigned_team_member_names}</td>
                                            </tr>
                                            <tr>
                                                <th>Created By</th>
                                                <td>{taskData[0]?.created_by_name}</td>
                                            </tr>
                                            <tr>
                                                <th>From Date</th>
                                                <td>{taskData[0]?.task_fromdate}</td>
                                            </tr>
                                            <tr>
                                                <th>End Date</th>
                                                <td>{taskData[0]?.task_enddate}</td>
                                            </tr>
                                            <tr>
                                                <th>Category</th>
                                                <td>{taskData[0]?.category_name}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div className="col-6">
                                    <table className="table table-bordered table-sm">
                                        <tbody>
                                            {taskData[0]?.contact_person_name && (<tr>
                                                <th>Person Name</th>
                                                <td>{taskData[0]?.contact_person_name}</td>
                                            </tr>)}
                                            {taskData[0]?.contact_company_name && (<tr>
                                                <th>Company Name</th>
                                                <td>{taskData[0]?.contact_company_name}</td>
                                            </tr>)}
                                            {taskData[0]?.contact_person_number && (<tr>
                                                <th>Mobile Number</th>
                                                <td>{taskData[0]?.contact_person_number}</td>
                                            </tr>)}
                                            {/* <tr>
                                                <th>Contact Person</th>
                                                <td>{taskData[0]?.contact_person_name}</td>
                                            </tr>
                                            <tr>
                                                <th>Contact Number</th>
                                                <td>{taskData[0]?.contact_person_number}</td>
                                            </tr>
                                            <tr>
                                                <th>Company</th>
                                                <td>{taskData[0]?.contact_company_name}</td>
                                            </tr> */}
                                            <tr>
                                                <th>Notifications</th>
                                                <td>
                                                    Email : {taskData[0]?.is_notification_sand_email ? "Yes" : "No"} <br />
                                                    WhatsApp : {taskData[0]?.is_notification_sand_wp ? "Yes" : "No"}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <hr className="hr" />
                            <h6 className="fw-bold">Task TimeLine</h6>
                            <div className="row">
                                <div className="col-12">
                                    <StatusTimeLine
                                        show={true}
                                        reference_id={taskId}
                                        reference_table={"task_managements"}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default TaskInfoModal