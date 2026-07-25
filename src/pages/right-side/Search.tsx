import React from "react";
interface IPropsSearch {
  isSearchShow: boolean
  closeSearch: () => void
}

const Search = ({ isSearchShow, closeSearch }: IPropsSearch) => {
  return (
    <>
      {isSearchShow ? (
        <div
          className="search-message animate__animated animate__fadeInRight"
          id="search-message"
        >
          {/* <!-- Header --> */}
          <div className="header-Chat">
            {/* <!-- Icons --> */}
            <div className="ICON">
              <button role="button" className="icons" onClick={closeSearch}>
                <span className="">
                  <svg
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    className=""
                  >
                    <path d="m19.1 17.2-5.3-5.3 5.3-5.3-1.8-1.8-5.3 5.4-5.3-5.3-1.8 1.7 5.3 5.3-5.3 5.3L6.7 19l5.3-5.3 5.3 5.3 1.8-1.8z"></path>
                  </svg>
                </span>
              </button>
            </div>

            <div className="newText">
              <h2>Search Messages</h2>
            </div>
          </div>
          <div className="search-bar">
            <div>
              <button className="search">
                <span className="">
                  <svg viewBox="0 0 24 24" width="24" height="24" className="">
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
                title="Search"
                aria-label="Search"
                placeholder="Search"
                className="search-Wrapper"
              />
            </div>
          </div>
          <div className="chats-search">
            <div className="a">
              <h3>Searching for messages with Shayam</h3>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default Search;
