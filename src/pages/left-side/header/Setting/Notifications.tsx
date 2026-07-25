import React from "react";

interface IpropsNotifications {
  isNotificationOpen: boolean;
  closeNotifications: () => void;
}
const Notifications = ({
  isNotificationOpen,
  closeNotifications,
}: IpropsNotifications) => {
  return (
    <>
      {isNotificationOpen ? (
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
                title="New chat"
                aria-label="New chat"
                onClick={closeNotifications}
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

            <div className="newText">
              <h2>Notifications</h2>
            </div>
          </div>
          {/* <!-- Chats --> */}
          <div className="chats-notifications">
            {/* <!-- Chats 1 --> */}
            <div className="block">
              {/* <!-- Text --> */}
              <div className="h-text">
                <div className="titlePro">
                  <p>Messages</p>
                </div>

                <div className="head">
                  <label
                    className="form-check-label"
                    htmlFor="flexCheckDefault"
                  >
                    <h4>Message notifications</h4>
                    <p>Show notifications for new messages</p>
                  </label>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    value=""
                    id="flexCheckDefault"
                  />
                </div>

                <div className="S-head">
                  <label className="form-check-label" htmlFor="flexCheck">
                    <h4>Show Previews</h4>
                  </label>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    value=""
                    id="flexCheck"
                  />
                </div>

                <div className="S-head">
                  <label className="form-check-label" htmlFor="flex">
                    <h4>Show reaction notifications</h4>
                  </label>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    value=""
                    id="flex"
                  />
                </div>
              </div>
            </div>
            {/* <!-- Chats 2 --> */}
            <div className="block">
              {/* <!-- Text --> */}
              <div className="h-text">
                <div className="T-head">
                  <label className="form-check-label" htmlFor="Check">
                    <h4>Sounds</h4>
                    <p>Play sounds for incoming messages</p>
                  </label>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    value=""
                    id="Check"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default Notifications;
