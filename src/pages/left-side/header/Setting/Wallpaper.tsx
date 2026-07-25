import React from "react";
interface IPropsWallpaper {
  isWallpaperOpen: boolean;
  closeWallpaper: () => void;
}
const Wallpaper = ({ isWallpaperOpen, closeWallpaper }: IPropsWallpaper) => {
  const colors = [
    "rgb(15, 36, 36)",
    "rgb(18, 38, 31)",
    "rgb(17, 36, 28)",
    "rgb(17, 30, 39)",
    "rgb(15, 34, 36)",
    "rgb(14, 33, 37)",
    "rgb(31, 29, 37)",
    "rgb(33, 33, 33)",
    "rgb(31, 33, 28)",
    "rgb(35, 35, 27)",
    "rgb(38, 36, 25)",
    "rgb(38, 31, 23)",
    "rgb(38, 23, 23)",
    "rgb(38, 15, 16)",
    "rgb(38, 10, 16)",
    "rgb(25, 5, 11)",
    "rgb(33, 16, 12)",
    "rgb(15, 12, 12)",
    "rgb(16, 25, 25)",
    "rgb(10, 29, 37)",
    "rgb(13, 21, 35)",
    "rgb(13, 15, 17)",
    "rgb(10, 12, 13)",
    "rgb(17, 11, 18)",
    "rgb(30, 31, 31)",
    "rgb(38, 38, 24)",
    "rgb(35, 35, 31)",
  ];

  return (
    <>
      {isWallpaperOpen ? (
        <div
          className="wallpaper animate__animated animate__fadeInLeft"
          id="wallpaper"
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
                onClick={closeWallpaper}
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
              <h2>Set Chat Wallpaper</h2>
            </div>
          </div>
          {/* <!-- Chats --> */}
          <div className="chats-wallpaper">
            {/* <!-- Chats 1 --> */}
            <div className="block">
              {/* <!-- Text --> */}
              <div className="h-text">
                <div className="head">
                  <div className="doodles">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      value=""
                      id="doodles"
                    />
                    <h4>Add Deskflow crm Doodles</h4>
                  </div>
                </div>
                <div className="BOX">
                  <span
                    className="boxes active"
                    style={{ backgroundColor: "#0b141a" }}
                  >
                    Default
                  </span>
                  {colors.map((color, index) => (
                    <span
                      key={index}
                      className="boxes"
                      style={{ backgroundColor: color }}
                    ></span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default Wallpaper;
