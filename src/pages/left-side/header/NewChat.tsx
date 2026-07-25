import React, { useState } from "react";
import Group from "./Group";

interface IPropsNewChat {
  isNewChatOpen: boolean;
  closeForm: () => void;
}
const NewChat = ({ isNewChatOpen, closeForm }: IPropsNewChat) => {
  const [showGroup, setShowGroup] = useState(false);

  const openGroup = () => {
    setShowGroup(true);
  };
  return (
    <>
      {showGroup ? (
        <Group isGroupOpen={showGroup} closeGroup={() => setShowGroup(false)} />
      ) : (
        <>
          {isNewChatOpen ? (
            <div
              className="Newchat animate__animated animate__fadeInLeft"
              id="Newchat"
            >
              {/* <!-- Header --> */}
              <div className="header-Chat">
                {/* <!-- Icons --> */}
                <div className="ICON">
                  <button className="icons" onClick={closeForm}>
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
                  <h2>New Chat</h2>
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
                  <input
                    type="text"
                    title="Search contacts"
                    aria-label="Search contacts"
                    placeholder="Search contacts"
                  />
                </div>
              </div>
              {/* <!-- Chats --> */}
              <div className="chats-new">
                {/* <!-- Chats 1 --> */}
                <div className="block group" onClick={openGroup}>
                  {/* <!-- Img --> */}
                  <div className="iconBox">
                    <i className="bi bi-people-fill"></i>
                  </div>
                  <div className="head">
                    <h4 title="New group" aria-label="New group">
                      New group
                    </h4>
                  </div>
                </div>

                <div className="a">
                  <h3>A</h3>
                </div>

                {/* <!-- Chats 1 --> */}
                <div className="block top">
                  {/* <!-- Img --> */}
                  <div className="imgBox">
                    <img
                      src={require("../../../assets/images/Avatar-7.jpeg")}
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
                        title="Don't Compare Yourself with Anyone."
                        aria-label="Don't Compare Yourself with Anyone."
                      >
                        Don't Compare Yourself with Anyone.
                      </p>
                    </div>
                  </div>
                </div>

                {/* <!-- Chats 4 --> */}
                <div className="block">
                  {/* <!-- Img --> */}
                  <div className="imgBox">
                    <img
                      src={require("../../../assets/images/Avatar-2.png")}
                      className="cover"
                    />
                  </div>
                  {/* <!-- Text --> */}
                  <div className="h-text">
                    <div className="head">
                      <h4 title="Amrita" aria-label="Amrita">
                        Amrita
                      </h4>
                    </div>
                    <div className="message">
                      <p title="Trust on GOD " aria-label="Trust on GOD">
                        Trust on GOD
                      </p>
                    </div>
                  </div>
                </div>

                {/* <!-- Chats 5 --> */}
                <div className="block">
                  {/* <!-- Img --> */}
                  <div className="imgBox">
                    <img src="images/Avatar-5.jpeg" className="cover" />
                  </div>
                  {/* <!-- Text --> */}
                  <div className="h-text">
                    <div className="head">
                      <h4 title="Anand Singh" aria-label="Anand Singh">
                        Anand Singh
                      </h4>
                    </div>
                    <div className="message">
                      <p
                        title="Hey there! I am using WhatsApp."
                        aria-label="Hey there! I am using WhatsApp."
                      >
                        Hey there! I am using WhatsApp.
                      </p>
                    </div>
                  </div>
                </div>

                {/* <!-- Chats 6 --> */}
                <div className="block">
                  {/* <!-- Img --> */}
                  <div className="imgBox">
                    <img src="images/Avatar-16.jpeg" className="cover" />
                  </div>
                  {/* <!-- Text --> */}
                  <div className="h-text">
                    <div className="head">
                      <h4 title="Ajay" aria-label="Ajay">
                        Ajay
                      </h4>
                    </div>
                    <div className="message">
                      <p
                        title="Hey there! I am using WhatsApp."
                        aria-label="Hey there! I am using WhatsApp."
                      >
                        Hey there! I am using WhatsApp.
                      </p>
                    </div>
                  </div>
                </div>

                {/* <!-- Chats 7 --> */}
                <div className="block">
                  {/* <!-- Img --> */}
                  <div className="imgBox">
                    <img src="images/Avatar-11.jpg" className="cover" />
                  </div>
                  {/* <!-- Text --> */}
                  <div className="h-text">
                    <div className="head">
                      <h4 title="Aditya" aria-label="Aditya">
                        Aditya
                      </h4>
                    </div>
                    <div className="message">
                      <p
                        title="Hey there! I am using WhatsApp."
                        aria-label="Hey there! I am using WhatsApp."
                      >
                        Hey there! I am using WhatsApp.
                      </p>
                    </div>
                  </div>
                </div>

                {/* <!-- Chats 8 --> */}
                <div className="block">
                  {/* <!-- Img --> */}
                  <div className="imgBox">
                    <img src="images/avatar-3.png" className="cover" />
                  </div>
                  {/* <!-- Text --> */}
                  <div className="h-text">
                    <div className="head">
                      <h4 title="Ashwini" aria-label="Ashwini">
                        Ashwini
                      </h4>
                    </div>
                    <div className="message">
                      <p title="Always Busy.." aria-label="Always Busy..">
                        Always Busy..
                      </p>
                    </div>
                  </div>
                </div>

                {/* <!-- Chats 9 --> */}
                <div className="block">
                  {/* <!-- Img --> */}
                  <div className="imgBox">
                    <img src="images/Avatar-15.jpeg" className="cover" />
                  </div>
                  {/* <!-- Text --> */}
                  <div className="h-text">
                    <div className="head">
                      <h4 title="Alok" aria-label="Alok">
                        Alok
                      </h4>
                    </div>
                    <div className="message">
                      <p
                        title="Hey there! I am using WhatsApp."
                        aria-label="Hey there! I am using WhatsApp."
                      >
                        Hey there! I am using WhatsApp.
                      </p>
                    </div>
                  </div>
                </div>

                {/* <!-- Chats 10 --> */}
                <div className="block">
                  {/* <!-- Img --> */}
                  <div className="imgBox">
                    <img src="images/Avatar-10.jpeg" className="cover" />
                  </div>
                  {/* <!-- Text --> */}
                  <div className="h-text">
                    <div className="head">
                      <h4 title="Aman" aria-label="Aman">
                        Aman
                      </h4>
                    </div>
                    <div className="message">
                      <p
                        title="Hey there! I am using WhatsApp."
                        aria-label="Hey there! I am using WhatsApp."
                      >
                        Hey there! I am using WhatsApp.
                      </p>
                    </div>
                  </div>
                </div>

                {/* <!-- Chats 11 --> */}
                <div className="block">
                  {/* <!-- Img --> */}
                  <div className="imgBox">
                    <img src="images/Avatar-12.jpg" className="cover" />
                  </div>
                  {/* <!-- Text --> */}
                  <div className="h-text">
                    <div className="head">
                      <h4>Amrendra</h4>
                    </div>
                    <div className="message">
                      <p
                        title="Hey there! I am using WhatsApp."
                        aria-label="Hey there! I am using WhatsApp."
                      >
                        Hey there! I am using WhatsApp.
                      </p>
                    </div>
                  </div>
                </div>

                {/* <!-- Chats 12 --> */}
                <div className="block">
                  {/* <!-- Img --> */}
                  <div className="imgBox">
                    <img src="images/Avatar-13.jpg" className="cover" />
                  </div>
                  {/* <!-- Text --> */}
                  <div className="h-text">
                    <div className="head">
                      <h4 title="Amit" aria-label="Amit">
                        Amit
                      </h4>
                    </div>
                    <div className="message">
                      <p
                        title="Hey there! I am using WhatsApp."
                        aria-label="Hey there! I am using WhatsApp."
                      >
                        Hey there! I am using WhatsApp.
                      </p>
                    </div>
                  </div>
                </div>

                {/* <!-- Chats 13 --> */}
                <div className="block">
                  {/* <!-- Img --> */}
                  <div className="imgBox">
                    <img src="images/Avatar-14.jpeg" className="cover" />
                  </div>
                  {/* <!-- Text --> */}
                  <div className="h-text">
                    <div className="head">
                      <h4>Ananya</h4>
                    </div>
                    <div className="message">
                      <p
                        title="Hey there! I am using WhatsApp."
                        aria-label="Hey there! I am using WhatsApp."
                      >
                        Hey there! I am using WhatsApp.
                      </p>
                    </div>
                  </div>
                </div>

                {/* <!-- Chats 14 --> */}
                <div className="block">
                  {/* <!-- Img --> */}
                  <div className="imgBox">
                    <img src="images/Avatar-17.jpeg" className="cover" />
                  </div>
                  {/* <!-- Text --> */}
                  <div className="h-text">
                    <div className="head">
                      <h4 title="Anjali" aria-label="Anjali">
                        Anjali
                      </h4>
                    </div>
                    <div className="message">
                      <p
                        title="Hey there! I am using WhatsApp."
                        aria-label="Hey there! I am using WhatsApp."
                      >
                        Hey there! I am using WhatsApp.
                      </p>
                    </div>
                  </div>
                </div>

                {/* <!-- Chats 15 --> */}
                <div className="block">
                  {/* <!-- Img --> */}
                  <div className="imgBox">
                    <img src="images/Avatar-1.png" className="cover" />
                  </div>
                  {/* <!-- Text --> */}
                  <div className="h-text">
                    <div className="head">
                      <h4 title="Adarsh" aria-label="Adarsh">
                        Adarsh
                      </h4>
                    </div>
                    <div className="message">
                      <p
                        title="Hey there! I am using WhatsApp."
                        aria-label="Hey there! I am using WhatsApp."
                      >
                        Hey there! I am using WhatsApp.
                      </p>
                    </div>
                  </div>
                </div>

                {/* <!-- Chats 16 --> */}
                <div className="block">
                  {/* <!-- Img --> */}
                  <div className="imgBox">
                    <img src="images/img16.jpg" className="cover" />
                  </div>
                  {/* <!-- Text --> */}
                  <div className="h-text">
                    <div className="head">
                      <h4 title="Aryan" aria-label="Aryan">
                        Aryan
                      </h4>
                    </div>
                    <div className="message">
                      <p
                        title="Hey there! I am using WhatsApp."
                        aria-label="Hey there! I am using WhatsApp."
                      >
                        Hey there! I am using WhatsApp.
                      </p>
                    </div>
                  </div>
                </div>

                {/* <!-- Chats 17 --> */}
                <div className="block">
                  {/* <!-- Img --> */}
                  <div className="imgBox">
                    <img src="images/img17.jpg" className="cover" />
                  </div>
                  {/* <!-- Text --> */}
                  <div className="h-text">
                    <div className="head">
                      <h4 title="Ashok" aria-label="Ashok">
                        Ashok
                      </h4>
                    </div>
                    <div className="message">
                      <p
                        title="Hey there! I am using WhatsApp."
                        aria-label="Hey there! I am using WhatsApp."
                      >
                        Hey there! I am using WhatsApp.
                      </p>
                    </div>
                  </div>
                </div>

                {/* <!-- Chats 18 --> */}
                <div className="block">
                  {/* <!-- Img --> */}
                  <div className="imgBox">
                    <img src="images/img18.jpg" className="cover" />
                  </div>
                  {/* <!-- Text --> */}
                  <div className="h-text">
                    <div className="head">
                      <h4 title="Ayush" aria-label="Ayush">
                        Ayush
                      </h4>
                    </div>
                    <div className="message">
                      <p
                        title="Hey there! I am using WhatsApp."
                        aria-label="Hey there! I am using WhatsApp."
                      >
                        Hey there! I am using WhatsApp.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}
    </>
  );
};

export default NewChat;
