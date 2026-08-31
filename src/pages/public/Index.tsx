import { DndContext, useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AppContext } from "../../common/AppContext";
import { handleRefresh } from "../../common/SharedFunction";
import Maintenance from "../../components/Maintenance";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../helpers/AppConstants";
import { axiosInstance } from "../../services/axiosInstance";
import useAdvertisementStore from "../../store/advertisement/useAdvertisemrntStore";
import useTrainingStore from "../../store/training/useTrainingStore";
import { useFeatureFlagStore } from "../../store/supportTicket/useSupportTicketFlag";
import CustomerSupportFormView from "../customer-support/customer-support-form/CustomerSupportFormView";
import { logOutApi } from "../left-side/LeftSideController";
import LeftSideView from "../left-side/LeftSideView";
import { TaskStickyIcon } from "../StickyNotes/TaskStickyIcon";
import LoginView from "./login/LoginView";
import PricingTable from "./payment-gateway/PricingTable";
import TeamPriceTable from "./payment-gateway/TeamPriceTable";
import { useTaskCategoryStore } from "./UseTaskCategoryStore";



const DraggableWidget = ({
  children,
  position,
}: {
  children: React.ReactNode;
  position: { x: number; y: number };
}) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: "support-widget",
  });

  const style: React.CSSProperties = {
    position: "fixed",
    bottom: `${position.y}px`,
    right: `${position.x}px`,
    transform: CSS.Translate.toString(transform),
    zIndex: 9999,
    touchAction: "none",
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>
  );
};

const Index = () => {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [widgetPosition, setWidgetPosition] = useState(() => {
    const saved = localStorage.getItem("support-widget-position");
    if (saved) {
      return JSON.parse(saved);
    }
    // const x = window.innerWidth * 0.02;
    // const y = window.innerHeight * 0.2;
    return {
       x: 37.44, 
       y: 90.6 
      };
  });
  const [isFormViewOpen, setIsFormViewOpen] = useState<boolean>(false);

  const handleExtraClick = () => {
    const getUUID = localStorage.getItem("UUID");
    const baseURL = window.location.origin;
    const supportURL = `${baseURL}/customer-support/`;
    const myWindow = window.open(supportURL, "_blank");
  }


  const flag = useFeatureFlagStore(
    (state) => state.flags.RAISE_SUPPORT_TICKET_FLAG
  );
  const handleDragEnd = (event: any) => {
    setIsDragging(false);
    const { delta } = event;
    const newPosition = {
      x: Math.max(
        0,
        Math.min(window.innerWidth - 80, widgetPosition.x - delta.x),
      ),
      y: Math.max(
        0,
        Math.min(window.innerHeight - 80, widgetPosition.y - delta.y),
      ),
    };
    setWidgetPosition(newPosition);
    localStorage.setItem("support-widget-position", JSON.stringify(newPosition));
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  let isGroupOpen;
  const [timestamp, setTimestamp] = useState(true);
  const {
    checkToken,
    setCheckToken,
    setCheckPlan,
    isSetCheckPlan,
    checkPlan,
    setPermissions,
    showAttendancePopup,
    setShowAttendancePopup,
    companyFlag,
    setCompanyFlag,
    setCompulsaryAttendance,
  } = useContext(AppContext)!;
  const [checkToken1, setCheckToken1] = useState(false);
  const [showRenewPlan, setShowRenewPlan] = useState(false);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const { setAdvertisement } = useAdvertisementStore();
  const { setTrainingDisabled } = useTrainingStore();

  const LoginSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token || token === "" || null) {
      setCheckToken(true);
    }
    const device_id = localStorage.getItem("device_id");
    const getUUID = await localStorage.getItem("UUID");
    if (!getUUID || getUUID === "") {
      setCheckToken1(true);
    } else {
      setCheckToken1(false);
    }
    try {
      const response = await axiosInstance.post(
        "onLoad",
        {
          a_application_login_id: getUUID,
          device_id: device_id || "",
          platform: "web",
        },
        {
          headers: token
            ? {
              Authorization: `${token}`,
            }
            : {},
        },
      );
      if (response.data.ack === -1) {
        setIsMaintenanceMode(true);
      }
      if (response.data.ack === 1) {
        const assignIdsString = response?.data?.data?.customer_support_ticket_ids ?? "";

        const assignIdsArray = assignIdsString
          .split(",")
          .map((id: any) => id.trim())
          .filter((id: any) => id !== "");

        const isAssignedToMe = assignIdsArray.includes(String(getUUID));
        useFeatureFlagStore.getState().setFlags({
          RAISE_SUPPORT_TICKET_FLAG: Number(
            response?.data?.data?.RAISE_SUPPORT_TICKET_FLAG ?? 2
          ),
          SUPPORT_TICKET_INFO_MESSAGE:
            response?.data?.data?.SUPPORT_TICKET_INFO_MESSAGE ?? "",
          CUSTOMER_SUPPORT_TICKET_ASSING_ID: isAssignedToMe
        });
        const val = response?.data?.data?.hasCheckedInToday;
        if (typeof val !== "boolean") {
          handleRefresh();
        }
        setAdvertisement(response.data.data.advertisement);
        setTrainingDisabled(response.data.data.is_training_disabled === 1);
        setCompulsaryAttendance(
          response.data.data.compulsary_attendance === true,
        );
        setShowAttendancePopup(
          response.data.data.compulsary_attendance === true &&
          response.data.data.hasCheckedInToday === false,
        );
        setCheckToken(false);
        setPermissions(response.data.data.resultRights);
        setCompanyFlag(response.data.data.findCompanyId?.company_flag ?? 1);
        if (response.data.data.expiryDays) {
          if (
            response.data.data.expiryDays === -1 ||
            response.data.data.expiryDays === -1
          ) {
            isSetCheckPlan(false);
            setShowRenewPlan(false);
          }
          if (response.data?.data?.expiryMsg) {
            toast.error(response.data?.data?.expiryMsg, {
              theme: "colored",
            });
          }
        } else {
          isSetCheckPlan(true);
          setShowRenewPlan(true);
          setCheckPlan(response.data.data.item);
        }
      } else {
        setCheckToken(true);
        localStorage.clear();
      }
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        setCheckToken(true);
      } else {
        if (error?.response?.data?.ack_msg === "Please Login") {
          localStorage.removeItem("token");
          localStorage.removeItem("UUID");
          // navigate("/");
        }
        toast.error(error?.response?.data?.ack_msg);
      }
    }
  };

  useEffect(() => {
    LoginSubmit();
    const interval = setInterval(() => {
      setTimestamp(false);
    }, 1000);
    return () => clearInterval(interval);
  }, [setCheckToken]);

  const takeAttendance = async () => {
    const token = await localStorage.getItem("token");
    const getUUID = await localStorage.getItem("UUID");
    const requestData = {
      attendance_status: 1,
      a_application_login_id: getUUID,
      device_type: 1,
    };
    try {
      const data = await axiosInstance.post("check-attendance", requestData);
      if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setShowAttendancePopup(false);
      }
      toast.success(data.data.ack_msg);
    } catch (error: any) {
      toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  };

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const handleLogout = async (e?: React.MouseEvent) => {
    // useFeatureFlagStore.getState().setFlags({
    //   RAISE_SUPPORT_TICKET_FLAG: 1,
    // });
    if (e) e.preventDefault();
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    const result = await logOutApi();
    setIsLoggingOut(false);
    if (result.success) {
      localStorage.clear();
      handleRefresh();
    } else {
      toast.error(result.message || "Logout failed");
    }
  };

  const { taskCategories } = useTaskCategoryStore();

  const categoryIds = taskCategories
    .map((item) => item.id)
    .join(",");

  if (isMaintenanceMode) {
    return <Maintenance />;
  }

  const getUUID = localStorage.getItem("UUID");

  if (showAttendancePopup) {
    return (
      <div
        className="modal show fade"
        tabIndex={-1}
        style={{ display: "block" }}
        aria-modal="true"
        role="dialog"
      >
        <div className="modal-dialog modal-fullscreen">
          <div className="modal-content bg-light">
            <div className="modal-body d-flex flex-column justify-content-center align-items-center text-center">
              <img
                src={require("../../assets/images/deshFlow_log.png")}
                width={350}
                alt=""
                className="mb-5"
              />
              <h2 className="fw-semibold mb-4 text-dark">
                Please Check-in First
              </h2>
              <button
                className="btn text-light btn rounded-circle shadow-lg d-flex align-items-center justify-content-center"
                title="Check Out"
                onClick={takeAttendance}
                style={{
                  backgroundColor: "rgb(0, 128, 0)",
                  borderRadius: "50%",
                  height: "80px",
                  width: "80px",
                  border: "none",
                  cursor: "pointer",
                  padding: "10px",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="45px"
                  viewBox="0 -960 960 960"
                  width="45px"
                  fill="#fff"
                >
                  <path d="M481-781q106 0 200 45.5T838-604q7 9 4.5 16t-8.5 12q-6 5-14 4.5t-14-8.5q-55-78-141.5-119.5T481-741q-97 0-182 41.5T158-580q-6 9-14 10t-14-4q-7-5-8.5-12.5T126-602q62-85 155.5-132T481-781Zm0 94q135 0 232 90t97 223q0 50-35.5 83.5T688-257q-51 0-87.5-33.5T564-374q0-33-24.5-55.5T481-452q-34 0-58.5 22.5T398-374q0 97 57.5 162T604-121q9 3 12 10t1 15q-2 7-8 12t-15 3q-104-26-170-103.5T358-374q0-50 36-84t87-34q51 0 87 34t36 84q0 33 25 55.5t59 22.5q34 0 58-22.5t24-55.5q0-116-85-195t-203-79q-118 0-203 79t-85 194q0 24 4.5 60t21.5 84q3 9-.5 16T208-205q-8 3-15.5-.5T182-217q-15-39-21.5-77.5T154-374q0-133 96.5-223T481-687Zm0-192q64 0 125 15.5T724-819q9 5 10.5 12t-1.5 14q-3 7-10 11t-17-1q-53-27-109.5-41.5T481-839q-58 0-114 13.5T260-783q-8 5-16 2.5T232-791q-4-8-2-14.5t10-11.5q56-30 117-46t124-16Zm0 289q93 0 160 62.5T708-374q0 9-5.5 14.5T688-354q-8 0-14-5.5t-6-14.5q0-75-55.5-125.5T481-550q-76 0-130.5 50.5T296-374q0 81 28 137.5T406-123q6 6 6 14t-6 14q-6 6-14 6t-14-6q-59-62-90.5-126.5T256-374q0-91 66-153.5T481-590Zm-1 196q9 0 14.5 6t5.5 14q0 75 54 123t126 48q6 0 17-1t23-3q9-2 15.5 2.5T744-191q2 8-3 14t-13 8q-18 5-31.5 5.5t-16.5.5q-89 0-154.5-60T460-374q0-8 5.5-14t14.5-6Z"></path>
                </svg>
              </button>
              <p className="mt-4 text-muted">
                Tap the button above to mark your attendance to access your
                system.
              </p>
              <button
                className="mt-2"
                style={{ cursor: "pointer" }}
                onClick={async () => {
                  await handleLogout();
                }}
              >
                Logout
              </button>
            </div>
            <div className="modal-footer border-0 justify-content-center">
              <small className="text-muted">
                Deskflow CRM &copy; {new Date().getFullYear()}
              </small>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // if (!isLoaded) return null;

  return (
    <div className="body">
      <div className="media">
        <div className="pt-4">
          <img
            width={400}
            src={require("../../assets/images/deshFlow_log.png")}
            alt=""
          />
          <h1 className="logo-main-text-small ">&nbsp;</h1>
        </div>
        <h1 className="pt-2">
          For a better experience, install our app on your mobile!
        </h1>

        <div className="pt-3">
          <Link to="https://apps.apple.com/in/app/deskflow-crm/id6757629548" target="_blank">
            <img
              className="w-50"
              alt="ios"
              src={require("../../assets/images/appleIos.png")}
            />
          </Link>
          <Link to="https://play.google.com/store/apps/details?id=com.smalloffice" target="_blank">
            <img
              className="w-50"
              alt="android"
              src={require("../../assets/images/android.png")}
            />
          </Link>
        </div>
      </div>
      {timestamp ? (
        <div className="container main ">
          <div className="d-flex  align-items-center  Intro-Left1">
            <div className="col-12 text-center">
              <img
                width={400}
                src={require("../../assets/images/deshFlow_log.png")}
                alt=""
              />

              <h1 className="logo-main-text p-3">&nbsp;</h1>
            </div>
          </div>
        </div>
      ) : (
        <>
          {checkToken || checkToken1 ? (
            <div className="container main">
              <LoginView />
            </div>
          ) : (
            <div className="container main">

              {/* <TaskStickyIcon
                categoryIds={categoryIds}
              /> */}
              {showRenewPlan && companyFlag !== null ? (
                companyFlag === 1 ? (
                  <PricingTable
                    companyId={checkPlan?.id}
                    companyName={checkPlan?.company_name}
                    companyEmailId={checkPlan?.company_email}
                    companyContact={checkPlan?.company_contact}
                    planAmount={0}
                    renew_flag={1}
                    onHide={() => setShowRenewPlan(false)}
                  />
                ) : (
                  <TeamPriceTable />
                )
              ) : (
                <LeftSideView isVisible={!isGroupOpen} />
              )}
            </div>
          )}
        </>
      )}

      {(flag === 1 || flag === 2) && (<DndContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
        <DraggableWidget position={widgetPosition}>
          <div
            onMouseDown={(e) => { }}
            onMouseUp={(e) => {
              if (!isDragging) {
                if (isFormViewOpen) {
                  setIsFormViewOpen(false);
                } else {
                  setIsFormViewOpen(true);
                }
                setShowForm(prev => !prev);
              }
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              backgroundColor: "#FF7D12",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              transition: isDragging
                ? "none"
                : "transform 0.2s, box-shadow 0.2s",
              cursor: isDragging ? "grabbing" : "grab",
              userSelect: "none",
            }}
            onMouseEnter={(e) => {
              if (!isDragging) {
                e.currentTarget.style.transform = "scale(1.1)";
                e.currentTarget.style.boxShadow =
                  "0 6px 16px rgba(0, 0, 0, 0.2)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isDragging) {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(0, 0, 0, 0.15)";
              }
            }}
          >
            {isFormViewOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px" fill="#e3e3e3"
              >
                <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"
                />
              </svg>) : (
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H6L4 18V4H20V16Z"
                  fill="white"
                />
                <circle cx="8" cy="10" r="1.5" fill="white" />
                <circle cx="12" cy="10" r="1.5" fill="white" />
                <circle cx="16" cy="10" r="1.5" fill="white" />
              </svg>)}
          </div>
        </DraggableWidget>
      </DndContext>)}
      {getUUID &&
        <TaskStickyIcon
          categoryIds={categoryIds}
        // categoryNames={categoryNames}
        />
      }
      {(flag === 1 || flag === 2) && showForm && (
        <div
          style={{
            position: "fixed",
            bottom: "90px",
            right: "30px",
            left: "10px",
            width: "480px",
            // maxWidth: "480px",      
            marginLeft: "auto",
            background: "#fff",
            borderRadius: "10px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            zIndex: 1000,
            maxHeight: "80vh",
            overflowY: "auto",
          }}
        >
          <CustomerSupportFormView
            onSuccess={() => {
              setShowForm(false);
              setIsFormViewOpen(false);
            }}
            showExtraButton={true}
            fullWidth={true}
            isExtraVisible={false}
            onExtraClick={handleExtraClick}
          />
        </div>
      )}
    </div>
  );
};

export default Index;
