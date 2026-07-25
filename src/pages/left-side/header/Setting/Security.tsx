import React from "react";
interface IPropSecurity {
  isSecurityOpen?: boolean;
  closeSecurity?: () => void;
}
const Security = ({ isSecurityOpen, closeSecurity }: IPropSecurity) => {
  return (
    <>
      {isSecurityOpen ? (
        <div
          className="security animate__animated animate__fadeInLeft"
          id="security"
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
                onClick={closeSecurity}
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
              <h2>Security</h2>
            </div>
          </div>
          {/* <!-- Chats --> */}
          <div className="chats-security">
            <div className="top-pad">
              <div className="icons-pad">
                <div aria-disabled="false" className="icons" data-tab="2">
                  <span
                    data-testid="security-drawer-lock"
                    data-icon="security-drawer-lock"
                    className=""
                  >
                    <svg
                      width="84"
                      viewBox="0 0 84 84"
                      fill="none"
                      preserveAspectRatio="xMidYMid meet"
                      className=""
                    >
                      <circle cx="42" cy="42" r="42" fill="#07CD9E"></circle>
                      <path
                        d="M53.241 33.432c0-2.079-.508-3.988-1.523-5.728a11.102 11.102 0 0 0-4.092-4.157C45.914 22.516 44.042 22 42.013 22c-2.046 0-3.934.516-5.662 1.547-1.713 1.015-3.077 2.4-4.092 4.157-1 1.74-1.5 3.65-1.5 5.728v4.375a5.657 5.657 0 0 0-2.925 2.658 6.438 6.438 0 0 0-.643 1.861c-.127.677-.19 1.684-.19 3.021v8.532c0 1.338.063 2.345.19 3.021a6.44 6.44 0 0 0 .643 1.861 5.668 5.668 0 0 0 2.355 2.393 5.91 5.91 0 0 0 1.808.653c.682.129 1.673.193 2.974.193h14.06c1.3 0 2.284-.064 2.95-.193a5.904 5.904 0 0 0 1.832-.653 5.668 5.668 0 0 0 2.355-2.393 6.44 6.44 0 0 0 .643-1.86c.127-.677.19-1.684.19-3.022v-8.532c0-1.337-.063-2.344-.19-3.02a6.438 6.438 0 0 0-.643-1.862 5.667 5.667 0 0 0-2.926-2.658v-4.375Zm-17.986 0c0-1.24.302-2.385.904-3.432a6.725 6.725 0 0 1 2.45-2.514 6.621 6.621 0 0 1 3.403-.918c1.221 0 2.347.306 3.378.918A6.725 6.725 0 0 1 47.84 30a6.76 6.76 0 0 1 .905 3.432v3.795h-13.49v-3.795Z"
                        fill="#fff"
                      ></path>
                    </svg>
                  </span>
                </div>
              </div>
            </div>

            {/* <!-- Chats 1 --> */}
            <div className="block">
              {/* <!-- Text --> */}
              <div className="h-text">
                <div className="text-yur">
                  <h3>Your chats and calls are private</h3>
                  <p>
                    End-to-end encryption keeps your personal messages and calls
                    between you and the people you choose. Not even Deskflow crm can
                    read or listen to them. This includes your:
                  </p>
                  <ul>
                    <li>
                      <span
                        data-testid="e2e-message"
                        data-icon="e2e-message"
                        className="t-v"
                      >
                        <svg
                          width="25"
                          height="25"
                          viewBox="0 0 24 24"
                          fill="none"
                          preserveAspectRatio="xMidYMid meet"
                          className=""
                        >
                          <path
                            clip-rule="evenodd"
                            d="M13.147 3H5.192A3.203 3.203 0 0 0 2 6.192v4.044a3.203 3.203 0 0 0 3.192 3.193h.719v2.607l3.476-2.607h3.76a3.203 3.203 0 0 0 3.192-3.193V6.192A3.203 3.203 0 0 0 13.147 3Z"
                            stroke="#8696A0"
                            stroke-width="1.2"
                            stroke-linejoin="round"
                          ></path>
                          <path
                            d="M7.214 15.058v.393a3.203 3.203 0 0 0 3.193 3.192h3.76l3.476 2.607v-2.607h.718a3.203 3.203 0 0 0 3.193-3.193v-4.043a3.203 3.203 0 0 0-3.193-3.193H16.34"
                            stroke="#8696A0"
                            stroke-width="1.2"
                            stroke-linejoin="round"
                          ></path>
                        </svg>
                      </span>
                      Text and voice messages
                    </li>
                    <li>
                      <span
                        data-testid="e2e-contact-info-call"
                        data-icon="e2e-contact-info-call"
                        className="t-v"
                      >
                        <svg
                          width="25"
                          height="25"
                          viewBox="0 0 24 24"
                          fill="none"
                          preserveAspectRatio="xMidYMid meet"
                          className=""
                        >
                          <path
                            d="M15.951 20.15c1.453 0 2.407-.39 3.246-1.336.066-.067.133-.142.19-.208.499-.556.731-1.104.731-1.627 0-.598-.348-1.154-1.087-1.668l-2.416-1.677c-.747-.515-1.618-.573-2.316.116l-.639.64c-.19.19-.357.198-.54.082-.448-.282-1.352-1.07-1.967-1.685-.647-.64-1.27-1.353-1.602-1.876-.108-.19-.1-.348.092-.54l.63-.639c.698-.697.64-1.577.125-2.315L8.72 5c-.514-.739-1.07-1.08-1.668-1.087-.523-.009-1.071.232-1.627.73l-.208.183c-.946.846-1.336 1.8-1.336 3.237 0 2.374 1.46 5.263 4.142 7.944 2.665 2.664 5.561 4.142 7.927 4.142Zm.008-1.278c-2.116.041-4.83-1.586-6.98-3.727-2.167-2.159-3.869-4.964-3.827-7.081.016-.913.34-1.702.988-2.266.058-.05.1-.091.157-.133.25-.216.515-.332.756-.332.24 0 .456.091.614.34l1.61 2.416c.175.257.191.548-.066.805l-.73.73c-.573.573-.532 1.27-.117 1.827.473.639 1.295 1.569 1.934 2.2.631.639 1.636 1.535 2.283 2.017.556.415 1.254.456 1.826-.117l.73-.73c.258-.258.54-.24.806-.075l2.415 1.61c.25.166.34.374.34.623 0 .24-.116.506-.331.755l-.133.158c-.565.648-1.353.963-2.275.98Z"
                            fill="#8696A0"
                          ></path>
                        </svg>
                      </span>
                      Audio and video calls
                    </li>
                    <li>
                      <span
                        data-testid="e2e-attachment"
                        data-icon="e2e-attachment"
                        className="t-v"
                      >
                        <svg
                          width="25"
                          height="25"
                          viewBox="0 0 24 24"
                          fill="none"
                          preserveAspectRatio="xMidYMid meet"
                          className=""
                        >
                          <path
                            d="m10.064 6.341 7.462 6.26c1.474 1.236 1.88 3.416.79 5.001a3.676 3.676 0 0 1-5.403.741l-8.718-7.312c-.924-.775-1.207-2.142-.53-3.136a2.302 2.302 0 0 1 3.39-.473l7.405 6.212c.388.325.44.909.114 1.297a.923.923 0 0 1-1.297.113L7.105 9.868a.695.695 0 0 0-.972.085.695.695 0 0 0 .085.973l6.073 5.094c.924.774 2.319.816 3.18-.024.993-.97.913-2.55-.123-3.42L8.062 6.464c-1.474-1.236-3.691-1.258-5.063.091a3.68 3.68 0 0 0 .21 5.451l8.654 7.26c2.024 1.697 5.08 1.737 6.962-.12a5.068 5.068 0 0 0-.292-7.503l-7.582-6.36a.696.696 0 0 0-.973.085.695.695 0 0 0 .086.973Z"
                            fill="#8696A0"
                          ></path>
                        </svg>
                      </span>
                      Photos, videos and documents
                    </li>
                    <li>
                      <span
                        data-testid="e2e-location"
                        data-icon="e2e-location"
                        className="t-v"
                      >
                        <svg
                          width="25"
                          height="25"
                          viewBox="0 0 24 24"
                          fill="none"
                          preserveAspectRatio="xMidYMid meet"
                          className=""
                        >
                          <path
                            fill-rule="evenodd"
                            clip-rule="evenodd"
                            d="M12 3.85c3.263 0 5.9 2.637 5.9 5.9 0 1.45-.666 3.164-1.73 4.923-1.046 1.725-2.367 3.32-3.44 4.491a.962.962 0 0 1-1.46 0c-1.072-1.171-2.394-2.766-3.44-4.491C6.767 12.914 6.1 11.2 6.1 9.75c0-3.263 2.637-5.9 5.9-5.9Zm0-1.6c4.146 0 7.5 3.354 7.5 7.5 0 3.77-3.369 8.07-5.59 10.495a2.561 2.561 0 0 1-3.82 0C7.87 17.819 4.5 13.52 4.5 9.75c0-4.146 3.354-7.5 7.5-7.5Zm0 11.35a3.475 3.475 0 1 0 0-6.95 3.475 3.475 0 0 0 0 6.95Zm1.875-3.475a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Z"
                            fill="#8696A0"
                          ></path>
                        </svg>
                      </span>
                      Location sharing
                    </li>
                    <li>
                      <span
                        data-testid="e2e-status"
                        data-icon="e2e-status"
                        className="t-v"
                      >
                        <svg
                          width="25"
                          height="25"
                          viewBox="0 0 24 24"
                          fill="none"
                          preserveAspectRatio="xMidYMid meet"
                          className=""
                        >
                          <path
                            d="M20.335 11.583a8.408 8.408 0 0 1-6.763 8.598M5.614 6.4a8.367 8.367 0 0 1 3.498-2.377 8.389 8.389 0 0 1 7.296.799M10.304 20.182a8.4 8.4 0 0 1-6.281-5.42A8.367 8.367 0 0 1 3.98 9.23"
                            stroke="#8696A0"
                            stroke-width="1.4"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          ></path>
                          <path
                            d="M17.277 11.937a5.34 5.34 0 1 1-2.512-4.53"
                            stroke="#8696A0"
                            stroke-width="1.4"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          ></path>
                        </svg>
                      </span>
                      Status updates
                    </li>
                  </ul>
                  <div className="Learn-more">
                    <a href="">Learn more</a>
                  </div>
                </div>

                <div className="F-head">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    value=""
                    id="show"
                  />
                  <div className="text-inner">
                    <label className="form-check-label" htmlFor="show">
                      <h4>Show security notifications on this computer</h4>
                    </label>
                    <p>
                      Get notified when your security code changes for a
                      contact's <br /> phone. If you have multiple devices, this
                      setting must be <br /> enabled on each device where you
                      want to get notifications.
                    </p>
                    <a href="">Learn more</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default Security;
