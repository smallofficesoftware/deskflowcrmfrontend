import React from "react";
interface IPropsRAI {
  isRequestOpen: boolean;
  closeRequest: () => void;
}
const RequestAccountInfo = ({ isRequestOpen, closeRequest }: IPropsRAI) => {
  return (
    <>
      {isRequestOpen ? (
        <div
          className="request animate__animated animate__fadeInLeft"
          id="request"
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
                onClick={closeRequest}
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
              <h2>Request Account Info</h2>
            </div>
          </div>
          {/* <!-- Chats --> */}
          <div className="chats-request">
            <div className="top-pad">
              <div className="icons-pad">
                <div aria-disabled="false" className="icons" data-tab="2">
                  <span
                    data-testid="document"
                    data-icon="document"
                    className=""
                  >
                    <svg
                      width="112"
                      height="112"
                      viewBox="0 0 112 112"
                      fill="none"
                      className=""
                    >
                      <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M112 56c0 30.928-25.072 56-56 56S0 86.928 0 56 25.072 0 56 0s56 25.072 56 56Zm-70.06-7.334h28a2 2 0 0 1 0 4h-28a2 2 0 1 1 0-4Zm0 10h28a2 2 0 0 1 0 4h-28a2 2 0 1 1 0-4Zm12 10h-12a2 2 0 1 0 0 4h12a2 2 0 1 0 0-4Z"
                        fill="#06CF9C"
                        fill-opacity=".15"
                      ></path>
                      <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M68 19H34a6 6 0 0 0-6 6v62a6 6 0 0 0 6 6h44a6 6 0 0 0 6-6V35L68 19ZM42 49h28a2 2 0 1 1 0 4H42a2 2 0 1 1 0-4Zm0 10h28a2 2 0 1 1 0 4H42a2 2 0 1 1 0-4Zm12 10H42a2 2 0 1 0 0 4h12a2 2 0 1 0 0-4Z"
                        fill="#06CF9C"
                      ></path>
                      <path
                        d="M84 35 68 19v10a6 6 0 0 0 6 6h10Z"
                        fill="#00A884"
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
                  <p>
                    Create a report of your deskflow crm account information and
                    settings, which you can access or port to another app. This
                    report does not include your messages.
                  </p>
                  <a href="">Learn more</a>
                </div>
              </div>
            </div>

            {/* <!-- Chats 2 --> */}
            <div className="block top">
              {/* <!-- Icon --> */}
              <div aria-disabled="false" className="icons-R" data-tab="2">
                <span
                  data-testid="business-hours"
                  data-icon="business-hours"
                  className=""
                >
                  <svg viewBox="0 0 24 24" width="24" height="24" className="">
                    <path
                      fill="currentColor"
                      d="M12.514 6.858h-1.543v6.172l5.349 3.29.821-1.336-4.628-2.777V6.858zM12 1.714C6.342 1.714 1.714 6.344 1.714 12c0 5.658 4.628 10.287 10.286 10.287S22.286 17.658 22.286 12c0-5.656-4.628-10.286-10.286-10.286zm0 18.516c-4.526 0-8.23-3.703-8.23-8.23 0-4.525 3.703-8.228 8.23-8.228S20.23 7.475 20.23 12c0 4.526-3.704 8.23-8.23 8.23z"
                    ></path>
                  </svg>
                </span>
              </div>
              {/* <!-- Text --> */}
              <div className="R-text">
                <div className="head">
                  <h4 title="Request sent" aria-label="Request sent">
                    Request sent
                  </h4>
                </div>
                <div className="message">
                  <p
                    title="Ready by September 6, 20222"
                    aria-label="Ready by September 6, 20222"
                  >
                    Ready by September 6, 20222
                  </p>
                </div>
              </div>
            </div>

            <div className="block">
              <div className="F-head">
                {/* <!-- Text --> */}
                <div className="text-inner">
                  <p className="F-p">
                    Your report will be ready in about 3 days. You'll have a few
                    weeks to download your report after it's available.
                  </p>

                  <p className="S-p">
                    Your request will be canceled if you make changes to your
                    account such as changing your number or deleting your
                    account.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default RequestAccountInfo;
