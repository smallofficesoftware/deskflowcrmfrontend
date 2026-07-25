import React from "react";

interface IPropsPricacy {
  isPrivayOpen: boolean;
  closePrivacy: () => void;
}
const Privacy = ({ isPrivayOpen, closePrivacy }: IPropsPricacy) => {
  function openLast() {
    const lastSeenElement = document.getElementById("last-seen");
    const privacyElement = document.getElementById("privacy");
    if (lastSeenElement && privacyElement) {
      (lastSeenElement as HTMLElement).style.display = "block";
      (privacyElement as HTMLElement).style.display = "none";
    }
  }

  function closeLast() {
    const privacyElement = document.getElementById("privacy");
    const lastSeenElement = document.getElementById("last-seen");

    if (privacyElement && lastSeenElement) {
      privacyElement.style.display = "block";
      lastSeenElement.style.display = "none";
    }
  }
  function openPhoto() {
    const privacyElement = document.getElementById("privacy");
    const photoElement = document.getElementById("p-photo");

    if (privacyElement && photoElement) {
      photoElement.style.display = "block";
      privacyElement.style.display = "none";
    }
  }
  function closePhoto() {
    const privacyElement = document.getElementById("privacy");
    const photoElement = document.getElementById("p-photo");

    if (privacyElement && photoElement) {
      privacyElement.style.display = "block";
      photoElement.style.display = "none";
    }
  }
  function openAbout() {
    const privacyElement = document.getElementById("privacy");
    const aboutElement = document.getElementById("about");

    if (privacyElement && aboutElement) {
      aboutElement.style.display = "block";
      privacyElement.style.display = "none";
    }
  }

  function closeAbout() {
    const privacyElement = document.getElementById("privacy");
    const aboutElement = document.getElementById("about");

    if (privacyElement && aboutElement) {
      privacyElement.style.display = "block";
      aboutElement.style.display = "none";
    }
  }
  function openDmessage() {
    const privacyElement = document.getElementById("privacy");
    const dmessageElement = document.getElementById("D-message");

    if (privacyElement && dmessageElement) {
      dmessageElement.style.display = "block";
      privacyElement.style.display = "none";
    }
  }

  function closeDmessage() {
    const privacyElement = document.getElementById("privacy");
    const dmessageElement = document.getElementById("D-message");

    if (privacyElement && dmessageElement) {
      privacyElement.style.display = "block";
      dmessageElement.style.display = "none";
    }
  }

  function openGroups() {
    const privacyElement = document.getElementById("privacy");
    const groupsElement = document.getElementById("groups");

    if (privacyElement && groupsElement) {
      groupsElement.style.display = "block";
      privacyElement.style.display = "none";
    }
  }

  function closeGroups() {
    const privacyElement = document.getElementById("privacy");
    const groupsElement = document.getElementById("groups");

    if (privacyElement && groupsElement) {
      privacyElement.style.display = "block";
      groupsElement.style.display = "none";
    }
  }
  function openBlock() {
    const privacyElement = document.getElementById("privacy");
    const blocksElement = document.getElementById("blocks");

    if (privacyElement && blocksElement) {
      blocksElement.style.display = "block";
      privacyElement.style.display = "none";
    }
  }

  function closeBlock() {
    const privacyElement = document.getElementById("privacy");
    const blocksElement = document.getElementById("blocks");

    if (privacyElement && blocksElement) {
      privacyElement.style.display = "block";
      blocksElement.style.display = "none";
    }
  }
  return (
    <>
      {isPrivayOpen ? (
        <>
          <div
            className="privacy animate__animated animate__fadeInLeft"
            id="privacy"
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
                  onClick={closePrivacy}
                >
                  <span data-testid="chat" data-icon="chat" className="">
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
                </div>
              </div>

              <div className="newText">
                <h2>Privacy</h2>
              </div>
            </div>
            {/* <!-- Chats --> */}
            <div className="chats-privacy">
              {/* <!-- Chats 1 --> */}
              <div className="block">
                {/* <!-- Text --> */}
                <div className="h-text">
                  <div className="titlePro">
                    <p>Who can see my personal info</p>
                  </div>

                  <div className="head" onClick={openLast}>
                    <div className="text-inner">
                      <h4>Last seen</h4>
                      <p>Everyone</p>
                    </div>
                    <span className="material-symbols-outlined">
                      chevron_right
                    </span>
                  </div>

                  <div className="head" onClick={openPhoto}>
                    <div className="text-inner">
                      <h4>Profile photo</h4>
                      <p>Everyone</p>
                    </div>
                    <span className="material-symbols-outlined">
                      chevron_right
                    </span>
                  </div>

                  <div className="head" onClick={openAbout}>
                    <div className="text-inner">
                      <h4>About</h4>
                      <p>Everyone</p>
                    </div>
                    <span className="material-symbols-outlined">
                      chevron_right
                    </span>
                  </div>

                  <div className="F-head">
                    <div className="text-inner">
                      <label className="form-check-label" htmlFor="CheckRead">
                        <h4>Read Receipts</h4>
                        <p>
                          If turned off, you won't send or receive Read
                          receipts. Read receipts are always sent htmlFor group
                          chats.
                        </p>
                      </label>
                    </div>
                    <input
                      className="form-check-input"
                      type="checkbox"
                      value=""
                      id="CheckRead"
                    />
                  </div>
                </div>
              </div>

              {/* <!-- Chats 2 --> */}
              <div className="block">
                {/* <!-- Text --> */}
                <div className="h-text">
                  <div className="titlePro">
                    <p>Disappearing messages</p>
                  </div>

                  <div className="T-head" onClick={openDmessage}>
                    <div className="text-inner">
                      <h4>Default message timer</h4>
                      <p>Off</p>
                    </div>
                    <span className="material-symbols-outlined">
                      chevron_right
                    </span>
                  </div>
                </div>
              </div>

              {/* <!-- Chats 2 --> */}
              <div className="block">
                <div className="h-text">
                  <div className="G-head" onClick={openGroups}>
                    <div className="text-inner">
                      <h4>Groups</h4>
                      <p>My contacts</p>
                    </div>
                    <span className="material-symbols-outlined">
                      chevron_right
                    </span>
                  </div>

                  <div className="R-head" onClick={openBlock}>
                    <div className="text-inner">
                      <h4>Blocked contacts</h4>
                      <p>1</p>
                    </div>
                    <span className="material-symbols-outlined">
                      chevron_right
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* -------last-seen----------*/}
          <div
            className="last-seen animate__animated animate__fadeInLeft"
            id="last-seen"
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
                  onClick={closeLast}
                >
                  <span data-testid="chat" data-icon="chat" className="">
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
                </div>
              </div>

              <div className="newText">
                <h2>Last seen</h2>
              </div>
            </div>
            {/* <!-- Chats --> */}
            <div className="chats-last">
              {/* <!-- Chats 1 --> */}
              <div className="block">
                {/* <!-- Text --> */}
                <div className="h-text">
                  <div className="titlePro">
                    <p>
                      If you don't share your Last Seen, you won't be able to
                      see other people's Last Seen
                    </p>
                  </div>

                  <div className="head">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="exampleRadios"
                        value=""
                        id="first"
                        checked
                      />
                      <label className="form-check-label" htmlFor="first">
                        <h4>Everyone</h4>
                      </label>
                    </div>
                  </div>

                  <div className="head">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="exampleRadios"
                        value=""
                        id="second"
                      />
                      <label className="form-check-label" htmlFor="second">
                        <h4>My contacts</h4>
                      </label>
                    </div>
                  </div>

                  <div className="head">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="exampleRadios"
                        value=""
                        id="third"
                      />
                      <label className="form-check-label" htmlFor="third">
                        <h4>My contacts except...</h4>
                      </label>
                    </div>
                  </div>

                  <div className="head">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="exampleRadios"
                        value=""
                        id="fourt"
                      />
                      <label className="form-check-label" htmlFor="fourt">
                        <h4>Nobody</h4>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/*-------Profile photo ------*/}
          <div
            className="p-photo animate__animated animate__fadeInLeft"
            id="p-photo"
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
                  onClick={closePhoto}
                >
                  <span data-testid="chat" data-icon="chat" className="">
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
                </div>
              </div>

              <div className="newText">
                <h2>Profile photo</h2>
              </div>
            </div>
            {/* <!-- Chats --> */}
            <div className="chats-photo">
              {/* <!-- Chats 1 --> */}
              <div className="block">
                {/* <!-- Text --> */}
                <div className="h-text">
                  <div className="titlePro">
                    <p>Who can see my Profile Photo</p>
                  </div>

                  <div className="head">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="Radios"
                        value=""
                        id="P-first"
                        checked
                      />
                      <label className="form-check-label" htmlFor="P-first">
                        <h4>Everyone</h4>
                      </label>
                    </div>
                  </div>

                  <div className="head">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="Radios"
                        value=""
                        id="P-second"
                      />
                      <label className="form-check-label" htmlFor="P-second">
                        <h4>My contacts</h4>
                      </label>
                    </div>
                  </div>

                  <div className="head">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="Radios"
                        value=""
                        id="P-third"
                      />
                      <label className="form-check-label" htmlFor="P-third">
                        <h4>My contacts except...</h4>
                      </label>
                    </div>
                  </div>

                  <div className="head">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="Radios"
                        value=""
                        id="P-fourt"
                      />
                      <label className="form-check-label" htmlFor="P-fourt">
                        <h4>Nobody</h4>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/*------ about------------ */}
          <div
            className="about animate__animated animate__fadeInLeft"
            id="about"
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
                  onClick={closeAbout}
                >
                  <span data-testid="chat" data-icon="chat" className="">
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
                </div>
              </div>

              <div className="newText">
                <h2>About</h2>
              </div>
            </div>
            {/* <!-- Chats --> */}
            <div className="chats-about">
              {/* <!-- Chats 1 --> */}
              <div className="block">
                {/* <!-- Text --> */}
                <div className="h-text">
                  <div className="titlePro">
                    <p>Who can see my About</p>
                  </div>

                  <div className="head">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="aboutRadios"
                        value=""
                        id="A-first"
                        checked
                      />
                      <label className="form-check-label" htmlFor="A-first">
                        <h4>Everyone</h4>
                      </label>
                    </div>
                  </div>

                  <div className="head">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="aboutRadios"
                        value=""
                        id="A-second"
                      />
                      <label className="form-check-label" htmlFor="A-second">
                        <h4>My contacts</h4>
                      </label>
                    </div>
                  </div>

                  <div className="head">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="aboutRadios"
                        value=""
                        id="A-third"
                      />
                      <label className="form-check-label" htmlFor="A-third">
                        <h4>My contacts except...</h4>
                      </label>
                    </div>
                  </div>

                  <div className="head">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="aboutRadios"
                        value=""
                        id="A-fourt"
                      />
                      <label className="form-check-label" htmlFor="A-fourt">
                        <h4>Nobody</h4>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/*------Default message timer----- */}
          <div
            className="D-message animate__animated animate__fadeInLeft"
            id="D-message"
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
                  onClick={closeDmessage}
                >
                  <span data-testid="chat" data-icon="chat" className="">
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
                </div>
              </div>

              <div className="newText">
                <h2>Default message timer</h2>
              </div>
            </div>
            {/* <!-- Chats --> */}
            <div className="chats-default">
              {/* <!-- Images --> */}
              <div className="img-top">
                <img
                  src={require("../../../../assets/images/dissapering.png")}
                  alt=""
                  className="disappear"
                />
              </div>

              {/* <!-- Chats 1 --> */}
              <div className="block">
                {/* <!-- Text --> */}
                <div className="h-text">
                  <div className="titlePro">
                    <p>Start new chats with disappearing s</p>
                  </div>

                  <div className="head">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="d-Radios"
                        value=""
                        id="D-first"
                      />
                      <label className="form-check-label" htmlFor="D-first">
                        <h4>24 hours</h4>
                      </label>
                    </div>
                  </div>

                  <div className="head">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="d-Radios"
                        value=""
                        id="D-second"
                      />
                      <label className="form-check-label" htmlFor="D-second">
                        <h4>7 days</h4>
                      </label>
                    </div>
                  </div>

                  <div className="head">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="d-Radios"
                        value=""
                        id="D-third"
                      />
                      <label className="form-check-label" htmlFor="D-third">
                        <h4>90 days</h4>
                      </label>
                    </div>
                  </div>

                  <div className="head">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="d-Radios"
                        value=""
                        id="D-fourt"
                        checked
                      />
                      <label className="form-check-label" htmlFor="D-fourt">
                        <h4>Off</h4>
                      </label>
                    </div>
                  </div>

                  <div className="Learn-more">
                    <a>Learn more</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className="groups animate__animated animate__fadeInLeft"
            id="groups"
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
                  onClick={closeGroups}
                >
                  <span data-testid="chat" data-icon="chat" className="">
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
                </div>
              </div>

              <div className="newText">
                <h2>Groups</h2>
              </div>
            </div>
            {/* <!-- Chats --> */}
            <div className="chats-groups">
              {/* <!-- Chats 1 --> */}
              <div className="block">
                {/* <!-- Text --> */}
                <div className="h-text">
                  <div className="titlePro">
                    <p>Who can add me to groups</p>
                  </div>

                  <div className="head">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="groupsRadios"
                        value=""
                        id="G-first"
                      />
                      <label className="form-check-label" htmlFor="G-first">
                        <h4>Everyone</h4>
                      </label>
                    </div>
                  </div>

                  <div className="head">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="groupsRadios"
                        value=""
                        id="G-second"
                        checked
                      />
                      <label className="form-check-label" htmlFor="G-second">
                        <h4>My contacts</h4>
                      </label>
                    </div>
                  </div>

                  <div className="head">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="groupsRadios"
                        value=""
                        id="G-third"
                      />
                      <label className="form-check-label" htmlFor="G-third">
                        <h4>My contacts except...</h4>
                      </label>
                    </div>
                  </div>

                  <div className="admins">
                    <p>
                      Admins who can't add you to a group will have the option
                      of inviting you privately instead.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            className="blocks animate__animated animate__fadeInLeft"
            id="blocks"
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
                  onClick={closeBlock}
                >
                  <span data-testid="chat" data-icon="chat" className="">
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
                </div>
              </div>

              <div className="newText">
                <h2>Blocked contacts</h2>
              </div>
            </div>
            <div className="chats-block">
              {/* <!-- Chats 1 --> */}
              <div className="block">
                {/* <!-- Img --> */}
                <div className="iconBox">
                  <div
                    aria-disabled="false"
                    role="button"
                    className="icons"
                    data-tab="2"
                    title="Add blocked contact"
                  >
                    <span
                      data-testid="add-user"
                      data-icon="add-user"
                      className=""
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="24"
                        height="24"
                        className=""
                      >
                        <path
                          fill="currentColor"
                          d="M14.7 12c2 0 3.6-1.6 3.6-3.6s-1.6-3.6-3.6-3.6-3.6 1.6-3.6 3.6 1.6 3.6 3.6 3.6zm-8.1-1.8V7.5H4.8v2.7H2.1V12h2.7v2.7h1.8V12h2.7v-1.8H6.6zm8.1 3.6c-2.4 0-7.2 1.2-7.2 3.6v1.8H22v-1.8c-.1-2.4-4.9-3.6-7.3-3.6z"
                        ></path>
                      </svg>
                    </span>
                  </div>
                </div>

                <div className="Add-text">
                  <div className="head">
                    <h4>Add blocked contact</h4>
                  </div>
                </div>
              </div>

              {/* <!-- Chats 1 --> */}
              <div className="block top">
                {/* <!-- Img --> */}
                <div className="imgBox">
                  <img
                    src={require("../../../../assets/images/Avatar-7.jpeg")}
                    alt=""
                    className="cover"
                  />
                </div>
                {/* <!-- Text --> */}
                <div className="h-text">
                  <div className="head">
                    <h4 title="Virat Kohli" aria-label="Virat Kohli">
                      Virat Kohli
                    </h4>
                  </div>
                  <div className="message">
                    <p title="Fun to chat with." aria-label="Fun to chat with.">
                      Fun to chat with.
                    </p>
                  </div>
                </div>

                <div className="iconBox">
                  <div
                    data-testid="chat-controls"
                    className="icons"
                    role="button"
                  >
                    <span data-testid="x-alt" data-icon="x-alt" className="">
                      <svg
                        viewBox="0 0 24 24"
                        width="24"
                        height="24"
                        className=""
                      >
                        <path
                          fill="currentColor"
                          d="M17.25 7.8 16.2 6.75l-4.2 4.2-4.2-4.2L6.75 7.8l4.2 4.2-4.2 4.2 1.05 1.05 4.2-4.2 4.2 4.2 1.05-1.05-4.2-4.2 4.2-4.2z"
                        ></path>
                      </svg>
                    </span>
                  </div>
                </div>
              </div>

              <div className="b-con">
                <p>
                  Blocked contacts will no longer be able to call you or send
                  you messages
                </p>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
};

export default Privacy;
