import React from "react";
interface IPropStatus {
  isStatusShow: boolean;
  closeStatus: () => void;
}
const Status = ({ isStatusShow, closeStatus }: IPropStatus) => {
  return (
    <>
      {isStatusShow ? (
        <>
          <div
            className="status animate__animated animate__fadeInLeft"
            id="status"
          >
            {/* <!-- Header --> */}

            <div className="header">
              {/* <!-- Profile Picture --> */}
              <div className="imgText">
                <div className="userImg">
                  <img
                    src={require("../../../assets/images/Avatar-10.jpeg")}
                    alt=""
                    className="cover"
                  />
                </div>
                <h4 title="My Status" aria-label="My Status">
                  My Status
                  <br />
                  <span aria-label="No Updates">No updates</span>
                </h4>
              </div>
            </div>
            {/* <!-- Chats --> */}
            <div className="chats-status">
              <div className="recent">
                {/* <!-- Text --> */}
                <div className="h-text">
                  <div className="head">
                    <h4>Recent</h4>
                  </div>
                </div>
              </div>

              {/* <!-- Chats 1 --> */}
              <div className="block">
                {/* <!-- Img --> */}
                <svg
                  className="circle"
                  width="48"
                  height="48"
                  viewBox="0 0 104 104"
                >
                  <circle
                    cx="52"
                    cy="52"
                    r="50"
                    fill="none"
                    stroke-linecap="round"
                    className="stroke"
                    stroke-dashoffset="387.69908169872417"
                    stroke-dasharray="34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10"
                    stroke-width="4"
                  ></circle>
                </svg>
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
                    <p>today at 5:19 PM</p>
                  </div>
                </div>
              </div>

              {/* <!-- Chats 2 --> */}
              <div className="block">
                {/* <!-- Img --> */}
                <svg
                  className="circle"
                  width="48"
                  height="48"
                  viewBox="0 0 104 104"
                >
                  <circle
                    cx="52"
                    cy="52"
                    r="50"
                    fill="none"
                    stroke-linecap="round"
                    className="stroke"
                    stroke-dashoffset="387.69908169872417"
                    stroke-dasharray="94.71975511965978 219.43951023931953"
                    stroke-width="4"
                  ></circle>
                  <circle
                    cx="52"
                    cy="52"
                    r="50"
                    fill="none"
                    stroke-linecap="round"
                    className="Stroke2"
                    stroke-dashoffset="282.9793265790644"
                    stroke-dasharray="94.71975511965978 10 94.71975511965978 114.71975511965977"
                    stroke-width="4"
                  ></circle>
                </svg>
                <div className="imgBox">
                  <img
                    src={require("../../../assets/images/avatar-3.png")}
                    className="cover"
                  />
                </div>
                {/* <!-- Text --> */}
                <div className="h-text">
                  <div className="head">
                    <h4 title="Saksham" aria-label="Saksham">
                      Saksham
                    </h4>
                  </div>
                  <div className="message">
                    <p>today at 5:19 PM</p>
                  </div>
                </div>
              </div>

              {/* <!-- Chats 3 --> */}
              <div className="block">
                {/* <!-- Img -->/ */}
                <svg
                  className="circle"
                  width="48"
                  height="48"
                  viewBox="0 0 104 104"
                >
                  <circle
                    cx="52"
                    cy="52"
                    r="50"
                    fill="none"
                    stroke-linecap="round"
                    className="stroke"
                    stroke-dashoffset="387.69908169872417"
                    stroke-dasharray="5.7079632679489665 10 5.7079632679489665 10 5.7079632679489665 10 5.7079632679489665 10 5.7079632679489665 10 5.7079632679489665 10 5.7079632679489665 10 5.7079632679489665 10 5.7079632679489665 10 5.7079632679489665 10 5.7079632679489665 10 5.7079632679489665 10 5.7079632679489665 10 5.7079632679489665 10 5.7079632679489665 10 5.7079632679489665 10 5.7079632679489665 10 5.7079632679489665 10 5.7079632679489665 10 5.7079632679489665 10"
                    stroke-width="4"
                  ></circle>
                </svg>
                <div className="imgBox">
                  <img src="images/Avatar-1.png" className="cover" />
                </div>
                {/* <!-- Text --> */}
                <div className="h-text">
                  <div className="head">
                    <h4 title="Kashish" aria-label="Kashish">
                      Kashish
                    </h4>
                  </div>
                  <div className="message">
                    <p>today at 5:19 PM</p>
                  </div>
                </div>
              </div>

              {/* <!-- Chats 4 -->/ */}
              <div className="block">
                {/* <!-- Img --> */}
                <svg
                  className="circle"
                  width="48"
                  height="48"
                  viewBox="0 0 104 104"
                >
                  <circle
                    cx="52"
                    cy="52"
                    r="50"
                    fill="none"
                    stroke-linecap="round"
                    className="stroke"
                    stroke-width="4"
                  ></circle>
                </svg>
                <div className="imgBox">
                  <img src="images/Avatar-2.png" className="cover" />
                </div>
                {/* <!-- Text --> */}
                <div className="h-text">
                  <div className="head">
                    <h4 title="Anamika" aria-label="Anamika">
                      Anamika
                    </h4>
                  </div>
                  <div className="message">
                    <p>today at 5:19 PM</p>
                  </div>
                </div>
              </div>

              {/* <!-- Chats 5 --> */}
              <div className="block">
                {/* <!-- Img --> */}
                <svg
                  className="circle"
                  width="48"
                  height="48"
                  viewBox="0 0 104 104"
                >
                  <circle
                    cx="52"
                    cy="52"
                    r="50"
                    fill="none"
                    stroke-linecap="round"
                    className="stroke"
                    stroke-dashoffset="387.69908169872417"
                    stroke-dasharray="34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10"
                    stroke-width="4"
                  ></circle>
                </svg>
                <div className="imgBox">
                  <img src="images/Avatar-5.jpeg" className="cover" />
                </div>
                {/* <!-- Text --> */}
                <div className="h-text">
                  <div className="head">
                    <h4 title="Rahul" aria-label="Rahul">
                      Rahul
                    </h4>
                  </div>
                  <div className="message">
                    <p>today at 5:19 PM</p>
                  </div>
                </div>
              </div>

              {/* <!-- Chats 6 --> */}
              <div className="block">
                {/* <!-- Img --> */}
                <svg
                  className="circle"
                  width="48"
                  height="48"
                  viewBox="0 0 104 104"
                >
                  <circle
                    cx="52"
                    cy="52"
                    r="50"
                    fill="none"
                    stroke-linecap="round"
                    className="stroke"
                    stroke-dashoffset="387.69908169872417"
                    stroke-dasharray="34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10"
                    stroke-width="4"
                  ></circle>
                </svg>
                <div className="imgBox">
                  <img src="images/Avatar-16.jpeg" className="cover" />
                </div>
                {/* <!-- Text --> */}
                <div className="h-text">
                  <div className="head">
                    <h4 title="Amit" aria-label="Amit">
                      Amit
                    </h4>
                  </div>
                  <div className="message">
                    <p>today at 5:19 PM</p>
                  </div>
                </div>
              </div>

              {/* <!-- Chats 7 --> */}
              <div className="block">
                {/* <!-- Img --> */}
                <svg
                  className="circle"
                  width="48"
                  height="48"
                  viewBox="0 0 104 104"
                >
                  <circle
                    cx="52"
                    cy="52"
                    r="50"
                    fill="none"
                    stroke-linecap="round"
                    className="stroke"
                    stroke-dashoffset="387.69908169872417"
                    stroke-dasharray="68.53981633974483 10 68.53981633974483 10 68.53981633974483 10 68.53981633974483 10"
                    stroke-width="4"
                  ></circle>
                </svg>
                <div className="imgBox">
                  <img src="images/Avatar-11.jpg" className="cover" />
                </div>
                {/* <!-- Text --> */}
                <div className="h-text">
                  <div className="head">
                    <h4 title="Divyanshu" aria-label="Divyanshu">
                      Divyanshu
                    </h4>
                  </div>
                  <div className="message">
                    <p>today at 5:19 PM</p>
                  </div>
                </div>
              </div>

              {/* <!-- Chats 8 --> */}
              <div className="block">
                {/* <!-- Img --> */}
                <svg
                  className="circle"
                  width="48"
                  height="48"
                  viewBox="0 0 104 104"
                >
                  <circle
                    cx="52"
                    cy="52"
                    r="50"
                    fill="none"
                    stroke-linecap="round"
                    className="stroke"
                    stroke-dashoffset="387.69908169872417"
                    stroke-dasharray="34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10"
                    stroke-width="4"
                  ></circle>
                </svg>
                <div className="imgBox">
                  <img src="images/avatar-8.jpeg" className="cover" />
                </div>
                {/* <!-- Text --> */}
                <div className="h-text">
                  <div className="head">
                    <h4 title="Komal" aria-label="Komal">
                      Komal
                    </h4>
                  </div>
                  <div className="message">
                    <p>today at 5:19 PM</p>
                  </div>
                </div>
              </div>

              {/* <!-- Chats 9 --> */}
              <div className="block">
                {/* <!-- Img --> */}
                <svg
                  className="circle"
                  width="48"
                  height="48"
                  viewBox="0 0 104 104"
                >
                  <circle
                    cx="52"
                    cy="52"
                    r="50"
                    fill="none"
                    stroke-linecap="round"
                    className="stroke"
                    stroke-dashoffset="387.69908169872417"
                    stroke-dasharray="34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10"
                    stroke-width="4"
                  ></circle>
                </svg>
                <div className="imgBox">
                  <img src="images/Avatar-15.jpeg" className="cover" />
                </div>
                {/* <!-- Text --> */}
                <div className="h-text">
                  <div className="head">
                    <h4 title="Ananya" aria-label="Ananya">
                      Ananya
                    </h4>
                  </div>
                  <div className="message">
                    <p>today at 5:19 PM</p>
                  </div>
                </div>
              </div>

              {/* <!-- Chats 10 --> */}
              <div className="block">
                {/* <!-- Img -->/ */}
                <svg
                  className="circle"
                  width="48"
                  height="48"
                  viewBox="0 0 104 104"
                >
                  <circle
                    cx="52"
                    cy="52"
                    r="50"
                    fill="none"
                    stroke-linecap="round"
                    className="stroke"
                    stroke-dashoffset="387.69908169872417"
                    stroke-dasharray="34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10"
                    stroke-width="4"
                  ></circle>
                </svg>
                <div className="imgBox">
                  <img src="images/Avatar-10.jpeg" className="cover" />
                </div>
                {/* <!-- Text --> */}
                <div className="h-text">
                  <div className="head">
                    <h4 title="Aditya" aria-label="Aditya">
                      Aditya
                    </h4>
                  </div>
                  <div className="message">
                    <p>today at 5:19 PM</p>
                  </div>
                </div>
              </div>

              {/* <!-- Chats 11 --> */}
              <div className="block">
                {/* <!-- Img --> */}
                <svg
                  className="circle"
                  width="48"
                  height="48"
                  viewBox="0 0 104 104"
                >
                  <circle
                    cx="52"
                    cy="52"
                    r="50"
                    fill="none"
                    stroke-linecap="round"
                    className="stroke"
                    stroke-dashoffset="387.69908169872417"
                    stroke-dasharray="34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10"
                    stroke-width="4"
                  ></circle>
                </svg>
                <div className="imgBox">
                  <img src="images/Avatar-12.jpg" className="cover" />
                </div>
                {/* <!-- Text --> */}
                <div className="h-text">
                  <div className="head">
                    <h4 title="Sakshi" aria-label="Sakshi">
                      Sakshi
                    </h4>
                  </div>
                  <div className="message">
                    <p>today at 5:19 PM</p>
                  </div>
                </div>
              </div>

              {/* <!-- Chats 12 --> */}
              <div className="block">
                {/* <!-- Img --> */}
                <svg
                  className="circle"
                  width="48"
                  height="48"
                  viewBox="0 0 104 104"
                >
                  <circle
                    cx="52"
                    cy="52"
                    r="50"
                    fill="none"
                    stroke-linecap="round"
                    className="stroke"
                    stroke-dashoffset="387.69908169872417"
                    stroke-dasharray="34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10"
                    stroke-width="4"
                  ></circle>
                </svg>
                <div className="imgBox">
                  <img src="images/Avatar-13.jpg" className="cover" />
                </div>
                {/* <!-- Text --> */}
                <div className="h-text">
                  <div className="head">
                    <h4 title="Vinay" aria-label="Vinay">
                      Vinay
                    </h4>
                  </div>
                  <div className="message">
                    <p>today at 5:19 PM</p>
                  </div>
                </div>
              </div>

              {/* <!-- Chats 13 --> */}
              <div className="block">
                {/* <!-- Img --> */}
                <svg
                  className="circle"
                  width="48"
                  height="48"
                  viewBox="0 0 104 104"
                >
                  <circle
                    cx="52"
                    cy="52"
                    r="50"
                    fill="none"
                    stroke-linecap="round"
                    className="stroke"
                    stroke-dashoffset="387.69908169872417"
                    stroke-dasharray="34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10"
                    stroke-width="4"
                  ></circle>
                </svg>
                <div className="imgBox">
                  <img src="images/Avatar-14.jpeg" className="cover" />
                </div>
                {/* <!-- Text --> */}
                <div className="h-text">
                  <div className="head">
                    <h4 title="Mantu" aria-label="Mantu">
                      Mantu
                    </h4>
                  </div>
                  <div className="message">
                    <p>today at 5:19 PM</p>
                  </div>
                </div>
              </div>

              {/* <!-- Chats 14 --> */}
              <div className="block">
                {/* <!-- Img -->/ */}
                <svg
                  className="circle"
                  width="48"
                  height="48"
                  viewBox="0 0 104 104"
                >
                  <circle
                    cx="52"
                    cy="52"
                    r="50"
                    fill="none"
                    stroke-linecap="round"
                    className="stroke"
                    stroke-dashoffset="387.69908169872417"
                    stroke-dasharray="34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10"
                    stroke-width="4"
                  ></circle>
                </svg>
                <div className="imgBox">
                  <img src="images/Avatar-17.jpeg" className="cover" />
                </div>
                {/* <!-- Text --> */}
                <div className="h-text">
                  <div className="head">
                    <h4 title="Aryan" aria-label="Aryan">
                      Aryan
                    </h4>
                  </div>
                  <div className="message">
                    <p>today at 5:19 PM</p>
                  </div>
                </div>
              </div>

              {/* <!-- Chats 15 --> */}
              <div className="block">
                {/* <!-- Img --> */}
                <svg
                  className="circle"
                  width="48"
                  height="48"
                  viewBox="0 0 104 104"
                >
                  <circle
                    cx="52"
                    cy="52"
                    r="50"
                    fill="none"
                    stroke-linecap="round"
                    className="stroke"
                    stroke-dashoffset="387.69908169872417"
                    stroke-dasharray="34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10"
                    stroke-width="4"
                  ></circle>
                </svg>
                <div className="imgBox">
                  <img src="images/Avatar-1.png" className="cover" />
                </div>
                {/* <!-- Text --> */}
                <div className="h-text">
                  <div className="head">
                    <h4 title="Shayam" aria-label="Shayam">
                      Shayam
                    </h4>
                  </div>
                  <div className="message">
                    <p>today at 5:19 PM</p>
                  </div>
                </div>
              </div>

              {/* <!-- Chats 16 --> */}
              <div className="block">
                {/* <!-- Img --> */}
                <svg
                  className="circle"
                  width="48"
                  height="48"
                  viewBox="0 0 104 104"
                >
                  <circle
                    cx="52"
                    cy="52"
                    r="50"
                    fill="none"
                    stroke-linecap="round"
                    className="stroke"
                    stroke-dashoffset="387.69908169872417"
                    stroke-dasharray="34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10"
                    stroke-width="4"
                  ></circle>
                </svg>
                <div className="imgBox">
                  <img src="images/img16.jpg" className="cover" />
                </div>
                {/* <!-- Text --> */}
                <div className="h-text">
                  <div className="head">
                    <h4 title="Soniya" aria-label="Soniya">
                      Soniya
                    </h4>
                  </div>
                  <div className="message">
                    <p>today at 5:19 PM</p>
                  </div>
                </div>
              </div>

              {/* <!-- Chats 17 --> */}
              <div className="block">
                {/* <!-- Img --> */}
                <svg
                  className="circle"
                  width="48"
                  height="48"
                  viewBox="0 0 104 104"
                >
                  <circle
                    cx="52"
                    cy="52"
                    r="50"
                    fill="none"
                    stroke-linecap="round"
                    className="stroke"
                    stroke-dashoffset="387.69908169872417"
                    stroke-dasharray="34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10"
                    stroke-width="4"
                  ></circle>
                </svg>
                <div className="imgBox">
                  <img src="images/img17.jpg" className="cover" />
                </div>
                {/* <!-- Text --> */}
                <div className="h-text">
                  <div className="head">
                    <h4 title="Shakti" aria-label="Shakti">
                      Shakti
                    </h4>
                  </div>
                  <div className="message">
                    <p>today at 5:19 PM</p>
                  </div>
                </div>
              </div>

              {/* <!-- Chats 18 --> */}
              <div className="block">
                {/* <!-- Img --> */}
                <svg
                  className="circle"
                  width="48"
                  height="48"
                  viewBox="0 0 104 104"
                >
                  <circle
                    cx="52"
                    cy="52"
                    r="50"
                    fill="none"
                    stroke-linecap="round"
                    className="stroke"
                    stroke-dashoffset="387.69908169872417"
                    stroke-dasharray="34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10 34.87989505128276 10"
                    stroke-width="4"
                  ></circle>
                </svg>
                <div className="imgBox">
                  <img src="images/img18.jpg" className="cover" />
                </div>
                {/* <!-- Text --> */}
                <div className="h-text">
                  <div className="head">
                    <h4 title="Vishu" aria-label="Vishu">
                      Vishu
                    </h4>
                  </div>
                  <div className="message">
                    <p>today at 5:19 PM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className="rightStatus animate__animated animate__fadeInRight"
            id="rightStatus"
          >
            <div className="_shbxn">
              <div className="_13bjQ">
                <div className="status-placeholder">
                  <span
                    data-testid="status-v3-placeholder"
                    data-icon="status-v3-placeholder"
                    className=""
                  >
                    <svg
                      version="1.1"
                      id="Layer_1"
                      x="0"
                      y="0"
                      viewBox="0 0 80 80"
                      width="80"
                      height="80"
                      className=""
                    >
                      <path
                        fill="currentColor"
                        d="M30.566 78.982c-.222 0-.447-.028-.672-.087C12.587 74.324.5 58.588.5 40.631c0-3.509.459-6.989 1.363-10.343a2.625 2.625 0 0 1 5.068 1.366 34.505 34.505 0 0 0-1.182 8.977c0 15.578 10.48 29.226 25.485 33.188a2.625 2.625 0 0 1-.668 5.163zm19.355-.107C67.336 74.364 79.5 58.611 79.5 40.563c0-3.477-.452-6.933-1.345-10.27a2.624 2.624 0 1 0-5.071 1.356 34.578 34.578 0 0 1 1.166 8.914c0 15.655-10.545 29.319-25.646 33.23a2.625 2.625 0 0 0 1.317 5.082zM15.482 16.5C21.968 9.901 30.628 6.267 39.867 6.267c9.143 0 17.738 3.569 24.202 10.05a2.625 2.625 0 0 0 3.717-3.708C60.329 5.135 50.413 1.018 39.867 1.018c-10.658 0-20.648 4.191-28.128 11.802a2.624 2.624 0 1 0 3.743 3.68z"
                      ></path>
                    </svg>
                  </span>
                </div>
                <div className="status-text">
                  Click on a contact to view their status updates
                </div>
              </div>
            </div>

            <div className="ICON">
              <div
                aria-disabled="true"
                role="button"
                tabIndex={0}
                className="icons"
                data-tab="0"
                onClick={closeStatus}
              >
                <span data-testid="x-viewer" data-icon="x-viewer" className="">
                  <svg viewBox="0 0 24 24" width="24" height="24" className="">
                    <path
                      fill="currentColor"
                      d="m19.8 5.8-1.6-1.6-6.2 6.2-6.2-6.2-1.6 1.6 6.2 6.2-6.2 6.2 1.6 1.6 6.2-6.2 6.2 6.2 1.6-1.6-6.2-6.2 6.2-6.2z"
                    ></path>
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
};

export default Status;
