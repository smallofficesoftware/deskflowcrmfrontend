import React from "react";

interface IPropGroup {
  isGroupOpen: boolean;
  closeGroup: () => void;
}
const Group = ({ isGroupOpen, closeGroup }: IPropGroup) => {
  return (
    <>
      {isGroupOpen ? (
        <>
          <div
            className="group animate__animated animate__fadeInLeft"
            id="group"
          >
            {/* <!-- Header --> */}
            <div className="header-Chat">
              {/* <!-- Icons --> */}
              <div className="ICON">
                <button className="icons" onClick={closeGroup}>
                  <span className="">
                    <svg
                      viewBox="0 0 24 24"
                      width="24"
                      height="24"
                      className=""
                    >
                      <path
                        fill="currentColor"
                        d="m12 4 1.4 1.4L7.8 11H20v2H7.8l5.6 5.6L12 20l-8-8 8-8z"
                      ></path>
                    </svg>
                  </span>
                </button>
              </div>

              <div className="newText">
                <h2>Add group participants</h2>
              </div>
            </div>
            {/* <!-- Search Bar --> */}
            <div className="search-bar">
              <div>
                <button className="search">
                  <span className="">
                    <svg
                      viewBox="0 0 24 24"
                      width="24"
                      height="24"
                      className=""
                    >
                      <path
                        fill="currentColor"
                        d="M15.009 13.805h-.636l-.22-.219a5.184 5.184 0 0 0 1.256-3.386 5.207 5.207 0 1 0-5.207 5.208 5.183 5.183 0 0 0 3.385-1.255l.221.22v.635l4.004 3.999 1.194-1.195-3.997-4.007zm-4.808 0a3.605 3.605 0 1 1 0-7.21 3.605 3.605 0 0 1 0 7.21z"
                      ></path>
                    </svg>
                  </span>
                </button>

                <span className="go-back">
                  <svg viewBox="0 0 24 24" width="24" height="24" className="">
                    <path
                      fill="currentColor"
                      d="m12 4 1.4 1.4L7.8 11H20v2H7.8l5.6 5.6L12 20l-8-8 8-8z"
                    ></path>
                  </svg>
                </span>
                <input
                  type="text"
                  title="Type contact name"
                  aria-label="Type contact name"
                  placeholder="Type contact name"
                />
              </div>
            </div>
            {/* <!-- Chats --> */}
            <div className="chats-group">
              <div className="a">
                <h3>A</h3>
              </div>

              {/* <!-- Chats 1 --> */}
              <div className="block top">
                {/* <!-- Img --> */}
                <div className="imgBox">
                  <img
                    src={require("../../../assets/images/Avatar-7.jpeg")}
                    alt=""
                    className="cover"
                  />
                </div>
                {/* <!-- Text --> */}
                <div className="h-text">
                  <div className="head">
                    <h4 title="Abhishek Anant" aria-label="Abhishek Anant">
                      Abhishek Anant
                    </h4>
                  </div>
                  <div className="message">
                    <p title="Jai Shree Ram." aria-label="Jai Shree Ram.">
                      Jai Shree Ram.
                    </p>
                  </div>
                </div>
              </div>

              {/* <!-- Chats 2 --> */}
              <div className="block">
                {/* <!-- Img --> */}
                <div className="imgBox">
                  <img
                    src={require("../../../assets/images/Avatar-1.png")}
                    alt=""
                    className="cover"
                  />
                </div>
                {/* <!-- Text --> */}
                <div className="h-text">
                  <div className="head">
                    <h4 title="Anamika" aria-label="Anamika">
                      Anamika
                    </h4>
                  </div>
                  <div className="message">
                    <p
                      title="Simplicity is the Best Policy."
                      aria-label="Simplicity is the Best Policy."
                    >
                      Simplicity is the Best Policy.
                    </p>
                  </div>
                </div>
              </div>

              {/* <!-- Chats 3 --> */}
              <div className="block">
                {/* <!-- Img --> */}
                <div className="imgBox">
                  <img
                    src={require("../../../assets/images/avatar-8.jpeg")}
                    alt=""
                    className="cover"
                  />
                </div>
                {/* <!-- Text --> */}
                <div className="h-text">
                  <div className="head">
                    <h4 title="Abhishek" aria-label="Abhishek">
                      Abhishek
                    </h4>
                  </div>
                  <div className="message">
                    <p
                      title="Don't Compare Yourself with anyone."
                      aria-label="Don't Compare Yourself with anyone."
                    >
                      Don't Compare Yourself with anyone.
                    </p>
                  </div>
                </div>
              </div>

              <div className="block">
                {/* <!-- Img --> */}
                <div className="imgBox">
                  <img
                    src={require("../../../assets/images/avatar-8.jpeg")}
                    alt=""
                    className="cover"
                  />
                </div>
                {/* <!-- Text --> */}
                <div className="h-text">
                  <div className="head">
                    <h4 title="Abhishek" aria-label="Abhishek">
                      Abhishek
                    </h4>
                  </div>
                  <div className="message">
                    <p
                      title="Don't Compare Yourself with anyone."
                      aria-label="Don't Compare Yourself with anyone."
                    >
                      Don't Compare Yourself with anyone.
                    </p>
                  </div>
                </div>
              </div>
              <div className="block">
                {/* <!-- Img --> */}
                <div className="imgBox">
                  <img
                    src={require("../../../assets/images/avatar-8.jpeg")}
                    alt=""
                    className="cover"
                  />
                </div>
                {/* <!-- Text --> */}
                <div className="h-text">
                  <div className="head">
                    <h4 title="Abhishek" aria-label="Abhishek">
                      Abhishek
                    </h4>
                  </div>
                  <div className="message">
                    <p
                      title="Don't Compare Yourself with anyone."
                      aria-label="Don't Compare Yourself with anyone."
                    >
                      Don't Compare Yourself with anyone.
                    </p>
                  </div>
                </div>
              </div>
              <div className="block">
                {/* <!-- Img --> */}
                <div className="imgBox">
                  <img
                    src={require("../../../assets/images/avatar-8.jpeg")}
                    alt=""
                    className="cover"
                  />
                </div>
                {/* <!-- Text --> */}
                <div className="h-text">
                  <div className="head">
                    <h4 title="Abhishek" aria-label="Abhishek">
                      Abhishek
                    </h4>
                  </div>
                  <div className="message">
                    <p
                      title="Don't Compare Yourself with anyone."
                      aria-label="Don't Compare Yourself with anyone."
                    >
                      Don't Compare Yourself with anyone.
                    </p>
                  </div>
                </div>
              </div>
              <div className="block">
                {/* <!-- Img --> */}
                <div className="imgBox">
                  <img
                    src={require("../../../assets/images/avatar-8.jpeg")}
                    alt=""
                    className="cover"
                  />
                </div>
                {/* <!-- Text --> */}
                <div className="h-text">
                  <div className="head">
                    <h4 title="Abhishek" aria-label="Abhishek">
                      Abhishek
                    </h4>
                  </div>
                  <div className="message">
                    <p
                      title="Don't Compare Yourself with anyone."
                      aria-label="Don't Compare Yourself with anyone."
                    >
                      Don't Compare Yourself with anyone.
                    </p>
                  </div>
                </div>
              </div>
              <div className="block">
                {/* <!-- Img --> */}
                <div className="imgBox">
                  <img
                    src={require("../../../assets/images/avatar-8.jpeg")}
                    alt=""
                    className="cover"
                  />
                </div>
                {/* <!-- Text --> */}
                <div className="h-text">
                  <div className="head">
                    <h4 title="Abhishek" aria-label="Abhishek">
                      Abhishek
                    </h4>
                  </div>
                  <div className="message">
                    <p
                      title="Don't Compare Yourself with anyone."
                      aria-label="Don't Compare Yourself with anyone."
                    >
                      Don't Compare Yourself with anyone.
                    </p>
                  </div>
                </div>
              </div>
              <div className="block">
                {/* <!-- Img --> */}
                <div className="imgBox">
                  <img
                    src={require("../../../assets/images/avatar-8.jpeg")}
                    alt=""
                    className="cover"
                  />
                </div>
                {/* <!-- Text --> */}
                <div className="h-text">
                  <div className="head">
                    <h4 title="Abhishek" aria-label="Abhishek">
                      Abhishek
                    </h4>
                  </div>
                  <div className="message">
                    <p
                      title="Don't Compare Yourself with anyone."
                      aria-label="Don't Compare Yourself with anyone."
                    >
                      Don't Compare Yourself with anyone.
                    </p>
                  </div>
                </div>
              </div>
              <div className="block">
                {/* <!-- Img --> */}
                <div className="imgBox">
                  <img
                    src={require("../../../assets/images/avatar-8.jpeg")}
                    alt=""
                    className="cover"
                  />
                </div>
                {/* <!-- Text --> */}
                <div className="h-text">
                  <div className="head">
                    <h4 title="Abhishek" aria-label="Abhishek">
                      Abhishek
                    </h4>
                  </div>
                  <div className="message">
                    <p
                      title="Don't Compare Yourself with anyone."
                      aria-label="Don't Compare Yourself with anyone."
                    >
                      Don't Compare Yourself with anyone.
                    </p>
                  </div>
                </div>
              </div>
              <div className="block">
                {/* <!-- Img --> */}
                <div className="imgBox">
                  <img
                    src={require("../../../assets/images/avatar-8.jpeg")}
                    alt=""
                    className="cover"
                  />
                </div>
                {/* <!-- Text --> */}
                <div className="h-text">
                  <div className="head">
                    <h4 title="Abhishek" aria-label="Abhishek">
                      Abhishek
                    </h4>
                  </div>
                  <div className="message">
                    <p
                      title="Don't Compare Yourself with anyone."
                      aria-label="Don't Compare Yourself with anyone."
                    >
                      Don't Compare Yourself with anyone.
                    </p>
                  </div>
                </div>
              </div>
              <div className="block">
                {/* <!-- Img --> */}
                <div className="imgBox">
                  <img
                    src={require("../../../assets/images/avatar-8.jpeg")}
                    alt=""
                    className="cover"
                  />
                </div>
                {/* <!-- Text --> */}
                <div className="h-text">
                  <div className="head">
                    <h4 title="Abhishek" aria-label="Abhishek">
                      Abhishek
                    </h4>
                  </div>
                  <div className="message">
                    <p
                      title="Don't Compare Yourself with anyone."
                      aria-label="Don't Compare Yourself with anyone."
                    >
                      Don't Compare Yourself with anyone.
                    </p>
                  </div>
                </div>
              </div>
              <div className="block">
                {/* <!-- Img --> */}
                <div className="imgBox">
                  <img
                    src={require("../../../assets/images/avatar-8.jpeg")}
                    alt=""
                    className="cover"
                  />
                </div>
                {/* <!-- Text --> */}
                <div className="h-text">
                  <div className="head">
                    <h4 title="Abhishek" aria-label="Abhishek">
                      Abhishek
                    </h4>
                  </div>
                  <div className="message">
                    <p
                      title="Don't Compare Yourself with anyone."
                      aria-label="Don't Compare Yourself with anyone."
                    >
                      Don't Compare Yourself with anyone.
                    </p>
                  </div>
                </div>
              </div>
              <div className="block">
                {/* <!-- Img --> */}
                <div className="imgBox">
                  <img
                    src={require("../../../assets/images/avatar-8.jpeg")}
                    alt=""
                    className="cover"
                  />
                </div>
                {/* <!-- Text --> */}
                <div className="h-text">
                  <div className="head">
                    <h4 title="Abhishek" aria-label="Abhishek">
                      Abhishek
                    </h4>
                  </div>
                  <div className="message">
                    <p
                      title="Don't Compare Yourself with anyone."
                      aria-label="Don't Compare Yourself with anyone."
                    >
                      Don't Compare Yourself with anyone.
                    </p>
                  </div>
                </div>
              </div>
              <div className="block">
                {/* <!-- Img --> */}
                <div className="imgBox">
                  <img
                    src={require("../../../assets/images/avatar-8.jpeg")}
                    alt=""
                    className="cover"
                  />
                </div>
                {/* <!-- Text --> */}
                <div className="h-text">
                  <div className="head">
                    <h4 title="Abhishek" aria-label="Abhishek">
                      Abhishek
                    </h4>
                  </div>
                  <div className="message">
                    <p
                      title="Don't Compare Yourself with anyone."
                      aria-label="Don't Compare Yourself with anyone."
                    >
                      Don't Compare Yourself with anyone.
                    </p>
                  </div>
                </div>
              </div>
              {/* <!-- Chats 18 --> */}
            </div>
          </div>
        </>
      ) : null}
    </>
  );
};

export default Group;
