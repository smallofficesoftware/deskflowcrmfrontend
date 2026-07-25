import { useState } from "react";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import MiracleConfigurationsView from "./MiracleConfigurationsView";
import WhatsappConfigurationView from "./whatsappConfigurationView";
import WorkFlowAutomationAutoAssignmentContactPopUp from "./WorkFlowAutomationAutoAssignmentContactPopUp";
import WorkFlowAutomationPopUp from "./WorkFlowAutomationPopUp";

interface IPropsWorkFlowView {
  isWorkFlowView: boolean;
  closeWorkFlowView: () => void;
}

const WorkFlowAutomationView = ({
  isWorkFlowView,
  closeWorkFlowView,
}: IPropsWorkFlowView) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownOpenAutoAssignContact, setDropdownOpenAutoAssignContact] = useState(false);
  const [dropdownOpenMiracle, setDropdownOpenMiracle] = useState(false);
  const [dropdownOpenWhatsapp, setDropdownOpenWhatsapp] = useState(false);
  const toggleDropdown = () => {
    setDropdownOpen(true);
  };
  const toggleDropdownAutoAssignContact = () => {
    setDropdownOpenAutoAssignContact(true);
  };
  const toggleDropdownMiracleIntegrations = () => {
    setDropdownOpenMiracle(true);
  };
  const toggleDropdownWhatsappConfigurations = () => {
    setDropdownOpenWhatsapp(true);
  };

  // escape handle
  useEscapeKey(closeWorkFlowView);

  return (
    <>
      {isWorkFlowView ? (
        <div
          className="notifications animate__animated animate__fadeInLeft"
          id="notifications"
        >
          {/* <!-- Header --> */}

          <div className="header-Chat">
            <div className="ICON">
              <div
                aria-disabled="false"
                role="button"
                className="icons text-light"
                data-tab="2"
                title="Back"
                aria-label="New chat"
                onClick={closeWorkFlowView}
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

            <div className="newText col-8">
              <h2>Work Flow Automation</h2>
            </div>

            <div className="col-4 text-end mb-2 ">
              <div
                className="ICON "
                style={{
                  position: "absolute",
                  right: "1px",
                }}
              >
                <button
                  className="icons text-light"
                  onClick={closeWorkFlowView}
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

          <div
            className="p-3 animate__animated animate__fadeInLeft overflow-auto"
            id="settings"
            style={{ maxHeight: "80vh" }}
          >
            <div className="mb-4 d-flex justify-content-between align-items-start border-bottom pb-3">
              <div className="pe-3">
                <>
                  <h6 className="fw-semibold mb-1">Third Party Scheduler</h6>
                  <p className="text-muted small mb-0">
                    Set Timer to Fetch Data From Third Party Api Which is Set in
                    Company Setting
                  </p>
                </>
              </div>
              <div
                className="form-check form-switch mt-1"
                onClick={toggleDropdown}
              >
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
              </div>
            </div>

            <div className="mb-4 d-flex justify-content-between align-items-start border-bottom pb-3">
              <div className="pe-3">
                <>
                  <h6 className="fw-semibold mb-1">
                    Auto Contact Reminder Daily
                  </h6>
                  <p className="text-muted small mb-0">
                    System Find Contact From Your Database and set as unread
                    based on Performance Formula: No Order From Last XX Days, No
                    Inquiery From Last XX Days
                  </p>
                </>
              </div>
              <div className="form-check form-switch mt-1">
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
              </div>
            </div>

            <div className="mb-4 d-flex justify-content-between align-items-start border-bottom pb-3">
              <div className="pe-3">
                <>
                  <h6 className="fw-semibold mb-1">
                    Auto Assignment of Contact
                  </h6>
                  <p className="text-muted small mb-0">
                    System will assign Contact to particular Team member Using
                    Automation Formula to set please click Setting button
                  </p>
                </>
              </div>
              <div className="form-check form-switch mt-1"
                onClick={toggleDropdownAutoAssignContact}
              >
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
              </div>
            </div>

            <div className="mb-4 d-flex justify-content-between align-items-start border-bottom pb-3">
              <div className="pe-3">
                <>
                  <h6 className="fw-semibold mb-1">
                    Miracle Integrations
                  </h6>
                  {/* <p className="text-muted small mb-0">
                    Something will be displayed here by Dinesh(Homelander) Lodhavi.
                  </p> */}
                </>
              </div>
              <div className="form-check form-switch mt-1"
                onClick={toggleDropdownMiracleIntegrations}
              >
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
              </div>
            </div>

            <div className="mb-4 d-flex justify-content-between align-items-start border-bottom pb-3">
              <div className="pe-3">
                <>
                  <h6 className="fw-semibold mb-1">
                    Whatsapp Configurations
                  </h6>
                  {/* <p className="text-muted small mb-0">
                    Something will be displayed here by Dinesh(Homelander) Lodhavi.
                  </p> */}
                </>
              </div>
              <div className="form-check form-switch mt-1"
                onClick={toggleDropdownWhatsappConfigurations}
              >
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
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {dropdownOpen && (
        <WorkFlowAutomationPopUp
          show={dropdownOpen}
          onHide={() => setDropdownOpen(false)}
        />
      )}
      {
        (
          <WorkFlowAutomationAutoAssignmentContactPopUp
            show={dropdownOpenAutoAssignContact}
            onHide={() => setDropdownOpenAutoAssignContact(false)}
            RequiredDetail={{ title: "Auto Assignment Of Contact" }}
          />
        )
      }
      {dropdownOpenMiracle && (
        <MiracleConfigurationsView
          show={dropdownOpenMiracle}
          onHide={() => setDropdownOpenMiracle(false)}
          headerName="Add Miracle Configurations"
        />
      )}
      {dropdownOpenWhatsapp && (
        <WhatsappConfigurationView
          show={dropdownOpenWhatsapp}
          onHide={() => setDropdownOpenWhatsapp(false)}
          headerName="Add Whatsapp Configurations"
        />
      )}
    </>
  );
};

export default WorkFlowAutomationView;
