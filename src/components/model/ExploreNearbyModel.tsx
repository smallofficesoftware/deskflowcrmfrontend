import React, { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { SingleValue } from "react-select";
import { toast } from "react-toastify";
import googleLogo from "../../assets/images/google-map-logo.png";
import { openInNewTab, useEscapeKey } from "../../common/SharedFunction";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../helpers/AppConstants";
import { IOption } from "../../helpers/AppInterface";
import { TOnKeyboardInput } from "../../helpers/AppType";
import { axiosInstance } from "../../services/axiosInstance";
import CustomSearchDropdown from "../CustomSearchDropdown";
import { useTheme } from "../ThemeContext";

interface IOrderCreateModal {
  show: boolean;
  onHide: () => void;
}

const ExploreNearbyModal: React.FC<IOrderCreateModal> = ({ show, onHide }) => {
  const [serpSearchQuery, setSerpSearchQuery] = useState("");
  const [searchedData, setSearchedData] = useState({});
  const [selectedReqList, setSelectedReqList] =
    useState<SingleValue<IOption> | null>(null);
  const [showSerpSearchedLimit, setShowSerpSearchedLimit] = useState("");
  const [serpLocationSearcedData, setSerpLocationSearcedData] = useState([]);
  const { darkMode, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (show) {
      getSerpAccountDetail();
    }
  }, [show]);

  const handleReqDisplayChange = (selectedOption: SingleValue<IOption>) => {
    setSelectedReqList(selectedOption);
  };

  const loadCountryOptions = async (inputValue: string): Promise<IOption[]> => {
    const result = await loadCountryOptionsv(inputValue);
    return result || []; // Handle undefined case
  };

  // Function to fetch data from API based on search input
  const loadCountryOptionsv = async (
    inputValue: string,
  ): Promise<IOption[]> => {
    // Changed to if (inputValue) - only fetch when there's input
    if (inputValue) {
      try {
        // localStorage is synchronous - no await needed
        const getUUID = localStorage.getItem("UUID");
        const token = localStorage.getItem("token");

        const { data } = await axiosInstance.post(
          `get-serp-countries/${inputValue}`,
          {},
        );

        if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          const countries = data.data.map((country: any) => ({
            value: country.canonical_name,
            label: country.canonical_name,
          }));
          return countries;
        }

        return [];
      } catch (error) {
        console.error("Error loading options:", error);
        return [];
      }
    }

    // Return empty array when no input
    return [];
  };

  const handelClickbtn = async () => {
    if (!selectedReqList) {
      toast.error("Select Place");
      return;
    }
    setLoading(true);
    await getGoogleDetail(serpSearchQuery);
  };
  const [serpFetchedDataList, setserpFetchedDataList] = useState<
    DataList | null | undefined
  >({});
  const [page, setPage] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const getGoogleDetail = async (query: string) => {
    try {
      if (query && query.trim() != "" && query.length > 0) {
        const getUUID = await localStorage.getItem("UUID");
        const token = await localStorage.getItem("token");
        const requestData = {
          query: query,
          place: selectedReqList?.value || "",
          a_application_login_id: getUUID,
        };

        const { data } = await axiosInstance.post(
          `global-search/${page}/desktop/1`,
          requestData,
        );

        if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          await getSerpAccountDetail();
          // setserpFetchedDataList(data.data)
          // setserpFetchedDataList((prevData) => [...prevData, ...data.data]);

          setserpFetchedDataList((prevData) => {
            const oldList = prevData?.local_results ?? [];
            const newList = data.data?.local_results ?? [];

            const merged = [...oldList, ...newList];

            // Remove duplicates by place_id
            const uniqueList = merged.filter(
              (item, index, self) =>
                index === self.findIndex((t) => t.place_id === item.place_id),
            );

            return { local_results: uniqueList };
          });

          if (data.data?.local_results.length === 0) {
            setHasMore(false);
          }

          // await addSearchedGoogleData(data.data)
          toast.success(data.ack_msg);
        } else {
          toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
      }
    } catch (error: any) {
      toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (hasMore) {
      setPage((prev) => prev + 20);
    }
  };

  useEffect(() => {
    setLoading(true);
    getGoogleDetail(serpSearchQuery);
  }, [page]);

  const getSerpAccountDetail = async () => {
    const getUUID = await localStorage.getItem("UUID");
    const token = await localStorage.getItem("token");
    const { data } = await axiosInstance.post(
      `get-serp-account-details/${getUUID}`,
      {},
    );

    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setShowSerpSearchedLimit(
        `${data.data.total_searches_left} / ${data.data.searches_per_month} searches limit`,
      );
    } else {
      toast.error(
        `Set SERP API KEY in Company Section \n ${data.developer_msg}`,
      );
    }
  };

  interface Gpscoordinates {
    latitude?: string | number;
    longitude?: string | number;
  }
  interface Links {
    website?: string;
    directions?: string;
  }

  interface LocalResult {
    place_id: string;
    title?: string;
    address?: string;
    phone?: string;
    gps_coordinates?: Gpscoordinates;
    links?: Links;
    rating?: string | number;
    reviews?: string | number;
    description?: string;
    type?: string;
    hours?: string;
    position?: string | number;
    extensions?: any;
  }

  interface DataList {
    local_results?: LocalResult[];
  }

  interface FilteredList {
    person_name: string;
    address: string;
    mobile_number: string;
    latitude: string | number;
    longitude: string | number;
    description: string | number;
  }

  interface messageList {
    mobile_number: string;
    description: string;
  }

  const addSearchedGoogleData = async (localList: LocalResult[]) => {
    try {
      // let localList: LocalResult[] | undefined | null;
      // localList = dataList?.local_results;

      if (localList) {
        let filterdList: FilteredList[] = [];
        let messageList: messageList[] = [];
        localList.map((list: LocalResult) => {
          filterdList.push({
            person_name: list?.title || "",
            address: list?.address || "",
            mobile_number: list?.phone || "",
            latitude: list?.gps_coordinates?.latitude || "",
            longitude: list?.gps_coordinates?.longitude || "",
            description: list?.description || "",
          });
          messageList.push({
            mobile_number: list?.phone || "",
            description: `
                                <b>Title: </b>${list?.title || ""}<br/>
                                <b>Address: </b>${list?.address || ""}<br/>
                                <b>Phone: </b>${list?.phone || ""}<br/>
                                <b>Website: </b>${list?.links?.website || ""}<br/>
                                <b>Directions: </b>${list?.links?.directions || ""}<br/>
                                <b>Rating: </b>${list?.rating || ""}<br/>
                                <b>Reviews: </b>${list?.reviews || ""}<br/>
                                <b>Description: </b>${list?.description || ""}<br/>
                                <b>Type: </b>${list?.type || ""}<br/>
                                <b>Hours: </b>${list?.hours || ""}<br/>
                            `,
          });
        });

        const getUUID = await localStorage.getItem("UUID");
        const token = await localStorage.getItem("token");

        const requestData = {
          a_application_login_id: getUUID,
          data: filterdList,
          messageList: messageList,
        };

        const { data } = await axiosInstance.post(
          "add-global-search-data",
          requestData,
        );

        if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          toast.success(data.ack_msg);
        } else {
          toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
      }
    } catch (error: any) {
      toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  };
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const toggleSelection = (placeId: string): void => {
    setSelected(
      (prevSelected) =>
        prevSelected.includes(placeId)
          ? prevSelected.filter((i) => i !== placeId) // uncheck
          : [...prevSelected, placeId], // check
    );

    const newSelected = new Set(selectedItems);
    if (newSelected.has(placeId)) {
      newSelected.delete(placeId);
    } else {
      newSelected.add(placeId);
    }
    setSelectedItems(newSelected);
  };

  const handleSaveSelected = (): void => {
    const selectedData: any =
      serpFetchedDataList && serpFetchedDataList.local_results
        ? serpFetchedDataList.local_results.filter((item) =>
            selectedItems.has(item.place_id),
          )
        : [];
    if (selectedData) {
      addSearchedGoogleData(selectedData);
    } else {
      console.log("Selected items to save:", selectedData);
      // alert(`${selectedData.length} items ready to save to database!`);
    }
  };

  const handleHide = () => {
    onHide();
  };

  const handleSelectAll = () => {
    setSelectedItems(new Set<string>());
    setSelectAll((prev) => !prev);
  };

  useEffect(() => {
    let newSelected = new Set(selectedItems);
    selectAll &&
      serpFetchedDataList &&
      serpFetchedDataList.local_results &&
      serpFetchedDataList.local_results.map((list: LocalResult) => {
        const placeId = list.place_id;
        newSelected.add(placeId);
        setSelectedItems(newSelected);
      });
  }, [selectAll]);

  useEscapeKey(handleHide);

  return (
    <div>
      {show && (
        <div className="modal1">
          <div
            className="modal-content1 "
            style={{
              width: "98%",
              height: "90vh",
              backgroundColor: "var(--side)",
              marginTop: "10px",
            }}
          >
            <div className="row">
              <div className="col-10">
                <h2
                  className="modal-title1"
                  style={{
                    fontSize: "28px",
                    fontWeight: "bold",
                    letterSpacing: "0.4px",
                    marginBottom: "0",
                  }}
                >
                  &nbsp;
                </h2>
              </div>
              <div className="col-2">
                <div className="d-flex align-items-center justify-content-end">
                  <span>
                    <p
                      className="landing-page-text text-end"
                      style={{
                        cursor: "pointer",
                        color: "blue",
                        float: "right",
                        fontSize: "13px",
                      }}
                      onClick={() => openInNewTab("/videoTutorial", 12)}
                    >
                      Learn More :{" "}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="24px"
                        viewBox="0 -960 960 960"
                        width="24px"
                        fill="#0000FF"
                      >
                        <path d="M616-242q-27 1-51.5 1.5t-43.5.5h-41q-71 0-133-2-53-2-104.5-5.5T168-257q-26-7-45-26t-26-45q-6-23-9.5-56T82-447q-2-36-2-73t2-73q2-30 5.5-63t9.5-56q7-26 26-45t45-26q23-6 74.5-9.5T347-798q62-2 133-2t133 2q53 2 104.5 5.5T792-783q26 7 45 26t26 45q6 23 9.5 56t5.5 63q2 36 2 73v17q-19-8-39-12.5t-41-4.5q-83 0-141.5 58.5T600-320q0 21 4 40.5t12 37.5ZM400-400l208-120-208-120v240Zm360 200v-80h-80v-80h80v-80h80v80h80v80h-80v80h-80Z" />
                      </svg>
                    </p>
                  </span>

                  <span
                    className="close ms-3 pb-3"
                    onClick={() => handleHide()}
                  >
                    ×
                  </span>
                </div>
              </div>
            </div>

            <div
              style={{ margin: "5px 0 15px 0" }}
              className="row explore_google"
            >
              <div
                className="col-12"
                style={{
                  display: "block",
                  // margin: "10vh auto",
                  textAlign: "center",
                }}
              >
                <div>
                  <img
                    style={{ width: "240px" }}
                    src={googleLogo}
                    alt=""
                    className="imgBox-product-cover animate__animated animate__fadeIn"
                  />
                  <br />
                  <span>Powered By SERP API</span>
                  <br />
                  <span>
                    Google Map logo is trademarks of their respective companies
                  </span>
                  <br />
                </div>

                <div
                  className="search-bar"
                  style={{ width: "50vw", margin: "0 auto" }}
                >
                  <div
                    className="search-bar-div"
                    style={{ margin: "0 5px 0 0" }}
                  >
                    <button className="search_explore">
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

                    <span className="go-back_explore">
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
                      type="search"
                      title="Search in google"
                      aria-label="Search in google"
                      placeholder="Search in google"
                      onKeyUp={(e: TOnKeyboardInput) =>
                        setSerpSearchQuery(e.currentTarget.value)
                      }
                    />
                  </div>

                  <div style={{ margin: "0 5px 0 0", width: "25vw" }}>
                    <CustomSearchDropdown
                      isAsync={true}
                      loadOptions={loadCountryOptions}
                      value={selectedReqList}
                      onChange={handleReqDisplayChange}
                      className="w-100"
                      placeholder="search place..."
                    />
                  </div>
                  <button
                    className="btn"
                    style={{ backgroundColor: "var(--secondary)" }}
                    onClick={handelClickbtn}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      fill="#1f1f1f"
                    >
                      <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z" />
                    </svg>
                  </button>
                </div>
                <span style={{ color: "red", margin: "10px" }}>
                  {showSerpSearchedLimit}
                </span>
              </div>
            </div>
            <style>
              {`
                                .table-container {
                                max-height: 50vh; /* adjust scroll height */
                                overflow-y: auto;
                                border: 1px solid #ddd;
                                }

                                /* Make header fixed */
                                .table-container table {
                                border-collapse: collapse;
                                width: 100%;
                                }

                                .table-container thead th {
                                position: sticky;
                                top: 0;
                                background: #f4f4f4; /* header bg */
                                z-index: 2;
                                }

                                .table-container th,
                                .table-container td {
                                padding: 8px 12px;
                                border: 1px solid #ddd;
                                text-align: left;
                                }
                                `}
            </style>
            {selectedItems && (
              <button
                onClick={handleSaveSelected}
                disabled={selectedItems.size === 0}
                className={`btn btn-success ${
                  selectedItems.size === 0
                    ? "btn btn-success m-1"
                    : "btn btn-success m-1"
                }`}
              >
                Add Selected ({selectedItems.size})
              </button>
            )}
            <div className="table-container mb-1">
              <table className="table table-scroll">
                <thead>
                  <tr>
                    <th scope="col">
                      #{" "}
                      {serpFetchedDataList &&
                        serpFetchedDataList.local_results && (
                          <button
                            onClick={handleSelectAll}
                            className="btn btn-info"
                          >
                            Check All
                            <input type="checkbox" checked={selectAll} />
                          </button>
                        )}
                    </th>
                    <th scope="col">Title</th>
                    <th scope="col">Type</th>
                    <th scope="col">Address</th>
                    <th scope="col">Phone</th>
                    <th scope="col">Hours</th>
                    <th scope="col">Links</th>
                    <th scope="col">Rating</th>
                    <th scope="col">Reviews</th>
                  </tr>
                </thead>
                <tbody className="body-half-screen">
                  {serpFetchedDataList &&
                    serpFetchedDataList.local_results &&
                    serpFetchedDataList.local_results.map(
                      (list: LocalResult, i) => (
                        <tr key={list.place_id}>
                          <th scope="row" style={{ whiteSpace: "nowrap" }}>
                            <input
                              onClick={() => toggleSelection(list.place_id)}
                              type="checkbox"
                              checked={selected.includes(list.place_id)}
                            />{" "}
                            {i + 1}
                          </th>
                          <td>{list?.title}</td>
                          <td>{list?.type}</td>
                          <td>{list?.address}</td>
                          <td>{list?.phone}</td>
                          <td>{list?.hours}</td>
                          <td>{list?.links?.website}</td>
                          <td>{list?.rating}</td>
                          <td>{list?.reviews}</td>
                        </tr>
                      ),
                    )}

                  {loading &&
                    Array.from({ length: 20 }).map((_, index) => (
                      <tr key={index}>
                        <td>
                          <Skeleton
                            style={{
                              marginLeft: "10px",
                              opacity: darkMode ? "" : 0.5,
                            }}
                            width={100}
                          />
                        </td>
                        <td>
                          <Skeleton
                            style={{
                              marginLeft: "10px",
                              opacity: darkMode ? "" : 0.5,
                            }}
                            width={100}
                          />
                        </td>
                        <td>
                          <Skeleton
                            style={{
                              marginLeft: "10px",
                              opacity: darkMode ? "" : 0.5,
                            }}
                            width={100}
                          />
                        </td>
                        <td>
                          <Skeleton
                            style={{
                              marginLeft: "10px",
                              opacity: darkMode ? "" : 0.5,
                            }}
                            width={100}
                          />
                        </td>
                        <td>
                          <Skeleton
                            style={{
                              marginLeft: "10px",
                              opacity: darkMode ? "" : 0.5,
                            }}
                            width={100}
                          />
                        </td>
                        <td>
                          <Skeleton
                            style={{
                              marginLeft: "10px",
                              opacity: darkMode ? "" : 0.5,
                            }}
                            width={100}
                          />
                        </td>
                        <td>
                          <Skeleton
                            style={{
                              marginLeft: "10px",
                              opacity: darkMode ? "" : 0.5,
                            }}
                            width={100}
                          />
                        </td>
                        <td>
                          <Skeleton
                            style={{
                              marginLeft: "10px",
                              opacity: darkMode ? "" : 0.5,
                            }}
                            width={100}
                          />
                        </td>
                        <td>
                          <Skeleton
                            style={{
                              marginLeft: "10px",
                              opacity: darkMode ? "" : 0.5,
                            }}
                            width={100}
                          />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {serpFetchedDataList && serpFetchedDataList.local_results && (
              <div className="text-center">
                <button
                  onClick={handleLoadMore}
                  className="btn  text-light   rounded-5   fw_500"
                  style={{ backgroundColor: "#f58634" }}
                >
                  Load More
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExploreNearbyModal;
