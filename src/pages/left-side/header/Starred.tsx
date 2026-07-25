import React from "react";

interface IPropsStarred {
  isStarredOpen: boolean;
  closeStarred: () => void;
}
const Starred = ({ isStarredOpen, closeStarred }: IPropsStarred) => {
  return (
    <>
      {isStarredOpen ? (
        <div
          className="starred animate__animated animate__fadeInLeft"
          id="starred"
        >
          {/* <!-- Header --> */}
          <div className="header-Chat">
            {/* <!-- Icons --> */}
            <div className="ICON">
              <div
                aria-disabled="false"
                role="button"
                tabIndex={0}
                className="icons"
                data-tab="2"
                title="New chat"
                aria-label="New chat"
                onClick={closeStarred}
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
              <h2>Starred messages</h2>
            </div>
          </div>
          {/* <!-- Chats --> */}
          <div className="chats-star">
            <div className="text-Ani">
              <p>No starred messages</p>
            </div>

            <div className="block">
              <div className="text-sec">
                <p>
                  Use deskflow crm on your phone to see older chats and messages
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default Starred;
