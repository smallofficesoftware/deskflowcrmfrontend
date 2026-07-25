import React from "react";
interface IPropsHelp{
  isHelpOpen : boolean
  closeHelp : () => void
}
const Help = ({ isHelpOpen, closeHelp } : IPropsHelp) => {
  return (
    <>
      {isHelpOpen ? (
        <div className="help animate__animated animate__fadeInLeft" id="help">
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
                onClick={closeHelp}
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
              <h2>Help</h2>
            </div>
          </div>
          {/* <!-- Chats --> */}
          <div className="chats-help">
            <div className="img-Ani">
              <div className="img-animated"></div>
            </div>

            <div className="text-Ani">
              <p>Version 2.2232.8</p>
            </div>

            {/* <!-- Chats 2 --> */}
            <div className="block top">
              {/* <!-- Icon --> */}
              <div
                aria-disabled="false"
                tabIndex={0}
                className="icons-R"
                data-tab="2"
              >
                <span
                  data-testid="settings-help"
                  data-icon="settings-help"
                  className=""
                >
                  <svg viewBox="0 0 24 24" width="24" height="24" className="">
                    <path
                      fill="currentColor"
                      d="M12 4.7c-4.5 0-8.2 3.7-8.2 8.2s3.7 8.2 8.2 8.2 8.2-3.7 8.2-8.2-3.7-8.2-8.2-8.2zm.8 13.9h-1.6V17h1.6v1.6zm1.7-6.3-.7.7c-.7.6-1 1.1-1 2.3h-1.6v-.4c0-.9.3-1.7 1-2.3l1-1.1c.3-.2.5-.7.5-1.1 0-.9-.7-1.6-1.6-1.6s-1.6.7-1.6 1.6H8.7c0-1.8 1.5-3.3 3.3-3.3s3.3 1.5 3.3 3.3c0 .8-.4 1.4-.8 1.9z"
                    ></path>
                  </svg>
                </span>
              </div>
              {/* <!-- Text --> */}
              <div className="R-text">
                <div className="head">
                  <h4 title="Help Center" aria-label="Help Center">
                    Help Center
                  </h4>
                </div>
              </div>
            </div>

            <div className="blocked">
              {/* <!-- Icon --> */}
              <div
                aria-disabled="false"
                tabIndex={0}
                className="icons-R"
                data-tab="2"
              >
                <span data-testid="group" data-icon="group" className="">
                  <svg width="24" height="24" viewBox="0 0 24 24" className="">
                    <path
                      d="M16.67 9.76a2.394 2.394 0 0 1 .029-1.226 2.222 2.222 0 0 1 .332-.664 2.114 2.114 0 0 1 1.106-.774A2.32 2.32 0 0 1 18.803 7c1.247 0 2.2.953 2.2 2.2 0 1.247-.953 2.2-2.2 2.2a2.352 2.352 0 0 1-.666-.096 2.219 2.219 0 0 1-.664-.332 2.115 2.115 0 0 1-.774-1.106 2.42 2.42 0 0 1-.028-.106Zm-9.295-.218a2.27 2.27 0 0 1-.143.528 2.163 2.163 0 0 1-.26.46 2.117 2.117 0 0 1-1.106.774 2.31 2.31 0 0 1-.666.096c-1.247 0-2.2-.953-2.2-2.2C3 7.953 3.953 7 5.2 7a2.352 2.352 0 0 1 .666.096 2.182 2.182 0 0 1 .664.332 2.115 2.115 0 0 1 .774 1.106 2.227 2.227 0 0 1 .071.324c.033.227.033.457 0 .684Zm15.418 4.764a3.165 3.165 0 0 1 .207.37V16h-3.95l-.016-.107c-.038-.152-.098-.408-.18-.543a5.534 5.534 0 0 0-.363-.543 7.06 7.06 0 0 0-.587-.686 7.212 7.212 0 0 0-1.627-1.252l-.053-.029c.031-.015.061-.032.094-.047l.06-.03c.599-.268 1.352-.456 2.287-.456.936 0 1.688.188 2.298.462a4.606 4.606 0 0 1 .989.612 4.312 4.312 0 0 1 .715.746c.048.063.09.123.126.18Zm-7.621-6.562a3.543 3.543 0 0 1-.063 1.334 3.397 3.397 0 0 1-.15.457 3.19 3.19 0 0 1-.383.68 3.124 3.124 0 0 1-1.189.973 3.268 3.268 0 0 1-.76.248c-.221.043-.445.064-.67.064-1.84 0-3.25-1.408-3.25-3.25S10.118 5 11.958 5a3.476 3.476 0 0 1 .985.142 3.25 3.25 0 0 1 .98.49 3.124 3.124 0 0 1 1.037 1.333 3.204 3.204 0 0 1 .213.78Zm2.653 8.075c.065.107.123.217.175.33V18H6v-1.85s.023-.054.072-.147a3.81 3.81 0 0 1 .103-.184 4.904 4.904 0 0 1 .309-.46 5.826 5.826 0 0 1 .509-.595 6.287 6.287 0 0 1 1.871-1.323c.03-.013.057-.028.087-.041.86-.388 1.691-.657 3.036-.657s2.202.27 3.078.664a6.37 6.37 0 0 1 1.943 1.356 6.05 6.05 0 0 1 .69.854c.049.074.09.141.127.202Zm-12.873.075L4.945 16H1v-1.324s.04-.088.125-.23c.025-.042.057-.089.091-.14a3.665 3.665 0 0 1 .286-.38 4.214 4.214 0 0 1 .556-.545 4.41 4.41 0 0 1 1-.617c.6-.27 1.352-.457 2.287-.457.936 0 1.689.188 2.287.457l.06.029c.027.012.051.026.077.039-.06.033-.12.066-.178.1a7.14 7.14 0 0 0-1.841 1.543 6.238 6.238 0 0 0-.471.634c-.058.088-.1.167-.152.256-.048.08-.07.148-.101.206-.072.136-.074.323-.074.323Z"
                      fill="currentColor"
                    ></path>
                  </svg>
                </span>
              </div>
              {/* <!-- Text --> */}
              <div className="R-text">
                <div className="head">
                  <h4 title="Contact us" aria-label="Contact us">
                    Contact us
                  </h4>
                </div>
              </div>
            </div>

            <div className="block top">
              {/* <!-- Icon --> */}
              <div
                aria-disabled="false"
                tabIndex={0}
                className="icons-R"
                data-tab="2"
              >
                <span
                  data-testid="settings-document"
                  data-icon="settings-document"
                  className=""
                >
                  <svg height="24" viewBox="0 0 24 24" fill="none" className="">
                    <path
                      fill-rule="evenodd"
                      clip-rule="evenodd"
                      d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8.83c0-.53-.21-1.04-.59-1.41l-4.83-4.83c-.37-.38-.88-.59-1.41-.59H6Zm7 6V3.5L18.5 9H14c-.55 0-1-.45-1-1Zm-5 4a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2H8Zm6 5a1 1 0 0 0-1-1H8a1 1 0 1 0 0 2h5a1 1 0 0 0 1-1Z"
                      fill="currentColor"
                    ></path>
                  </svg>
                </span>
              </div>
              {/* <!-- Text --> */}
              <div className="R-text">
                <div className="head">
                  <h4
                    title="Terms and Privacy Policy"
                    aria-label="Terms and Privacy Policy"
                  >
                    Terms and Privacy Policy
                  </h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default Help;
