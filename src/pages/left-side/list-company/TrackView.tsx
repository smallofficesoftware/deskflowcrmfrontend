import {
  GoogleMap,
  InfoWindow,
  Marker,
  Polyline,
  useJsApiLoader,
} from "@react-google-maps/api";
import { useEffect, useReducer, useRef, useState } from "react";
import DatePicker, { DateObject } from "react-multi-date-picker";
import { toast } from "react-toastify";
import { DEFAULT_MESSAGE_ERROR_PERMISSION, GOOGLE_MAP_KEY } from "../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../helpers/AppEnum";
import useCheckUserPermission from "../../../hooks/useCheckUserPermission";
import { ICompanyTeam } from "./ListCompanyController";
import { fetchTrackApi, ITracking } from "./TrackController";
declare global {
  interface Window {
    initMap: () => void;
    google: any;
  }
}
interface IPropsTrackView {
  show: boolean;
  onHide: () => void;
  companyTeamInfo: ICompanyTeam | undefined;
  DateAndId: string;
  latitude?: string;
  longitude?: string;
  address?: string;
}
interface ILocation {
  lat: number;
  lng: number;
  address: string;
  created_date_time: string;
  title: string;
  color: string;
}
const TrackView = ({
  show,
  onHide,
  companyTeamInfo,
  DateAndId,
  latitude,
  longitude,
  address,
}: IPropsTrackView) => {
  const [expenseLists, setExpenseList] = useState<ITracking[]>([]);
  const [selectDate, setSelectDate] = useState<any>(DateAndId || null);
  const [DateAndIdState, setDateAndIdState] = useState<{ date: string } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownOpenCreateOrder, setDropdownOpenCreateOrder] = useState(false);
  const dropdownCreateOrderRef = useRef<HTMLButtonElement>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [animatedPosition, setAnimatedPosition] =
    useState<google.maps.LatLngLiteral | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeMarker, setActiveMarker] = useState<number | null>(null);
  const [showOnlyLastLocation, setShowOnlyLastLocation] = useState(true);
  const [selectedMode, setSelectedMode] = useState<number | null>(null);
  const [mapKey, setMapKey] = useState<number>(Date.now());
  const [showRoute, setShowRoute] = useState(false);
  const [locations, setLocations] = useState<ILocation[]>([]);
  const [, forceRender] = useReducer((x) => x + 1, 0);
  const [userMovedMap, setUserMovedMap] = useState(false);
  const [showSingleMarker, setShowSingleMarker] = useState<number | null>(null);

  const hasPropCoordinates = !!(latitude && longitude);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAP_KEY,
  });
  const containerStyle = {
    width: "100%",
    height: "100%",
  };
  const modeMap: Record<number | string, { title: string; color: string }> = {
    1: { title: "Quotation", color: "#E6194B" },
    2: { title: "Order", color: "#3CB44B" },
    3: { title: "Invoice", color: "#4363D8" },
    4: { title: "Purchase", color: "#F58231" },
    5: { title: "Login", color: "#911EB4" },
    6: { title: "LogOut", color: "#46F0F0" },
    7: { title: "CheckIn", color: "#F032E6" },
    8: { title: "CheckOut", color: "#BFEF45" },
    9: { title: "Inquiry", color: "#FFD700" },
    10: { title: "Visit Start", color: "#FFD700" },
    11: { title: "Dispatch", color: "#3c98b4" },
    12: { title: "Return Sales Invoice", color: "#d84357" },
    13: { title: "Purchase Order", color: "#dce630" },
    14: { title: "Return Purchase Invoice", color: "#f23a0b" },
    15: { title: "Good Receive Note", color: "#30e6b2" },
    16: { title: "Contact", color: "#2de11c" },
    17: { title: "Expense", color: "#f5a700" },
    18: { title: "Visit Stop", color: "#FFD700" },
    "-1": { title: "Sync", color: "#A52A2A" },
  };

  const canViewLocation = useCheckUserPermission(
    PAGE_ID.LOCATION_SERVICE,
    PERMISSION_TYPE.VIEW
  );

  const getLocations = (): ILocation[] => {
    return (expenseLists || [])
      .filter((item) => selectedMode === null || item.mode === selectedMode)
      .map((item) => {
        const { title = "Unknown", color = "#FF8C00" } =
          modeMap[item.mode] || {};
        return {
          lat: parseFloat(item.latitude),
          lng: parseFloat(item.longitude),
          address: item.address,
          created_date_time: item.m_timestamp,
          title,
          color,
        };
      })
      .sort(
        (a, b) =>
          new Date(a.created_date_time).getTime() -
          new Date(b.created_date_time).getTime()
      );
  };

  useEffect(() => {
    if (hasPropCoordinates) {
      setLocations([
        {
          lat: parseFloat(latitude as string),
          lng: parseFloat(longitude as string),
          address: address || "Pinned Location",
          created_date_time: new Date().toISOString(),
          title: "Pin",
          color: "#E6194B",
        },
      ]);
    } else {
      setLocations(getLocations());
    }
  }, [expenseLists, selectedMode, latitude, longitude, hasPropCoordinates]);

  const interpolate = (
    start: google.maps.LatLngLiteral,
    end: google.maps.LatLngLiteral,
    fraction: number
  ): google.maps.LatLngLiteral => {
    const lat = start.lat + (end.lat - start.lat) * fraction;
    const lng = start.lng + (end.lng - start.lng) * fraction;
    return { lat, lng };
  };
  const startMarkerAnimation = (): void => {
    if (locations.length < 2) return;
    let currentSegment = 0;
    let progress = 0;
    const steps = 300;
    const duration = 3000;
    const intervalTime = duration / steps;
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
    }
    setAnimatedPosition(locations[0]);
    setUserMovedMap(false);
    animationIntervalRef.current = setInterval(() => {
      if (currentSegment >= locations.length - 1) {
        if (animationIntervalRef.current) {
          clearInterval(animationIntervalRef.current);
          animationIntervalRef.current = null;
        }
        return;
      }
      const start = locations[currentSegment];
      const end = locations[currentSegment + 1];
      const position = interpolate(start, end, progress);
      setAnimatedPosition(position);
      progress += 1 / (steps / (locations.length - 1));
      if (progress >= 1) {
        progress = 0;
        currentSegment++;
      }
    }, intervalTime);
  };

  const handleModeFilter = (mode: number | null): void => {
    setSelectedMode(mode);
    setShowSingleMarker(null);
    setShowOnlyLastLocation(true);
    setShowRoute(false);
    setAnimatedPosition(null);
    setUserMovedMap(false);
    setMapKey(Date.now());

    if (hasPropCoordinates) {
      forceRender();
      return;
    }

    const filteredLocations = expenseLists
      .filter((item) => mode === null || item.mode === mode)
      .map((item) => {
        const { title = "Unknown", color = "#FF8C00" } =
          modeMap[item.mode] || {};
        return {
          lat: parseFloat(item.latitude),
          lng: parseFloat(item.longitude),
          address: item.address,
          created_date_time: item.m_timestamp,
          title,
          color,
        };
      });

    setLocations(filteredLocations);
    setTimeout(() => {
      if (filteredLocations.length > 0) {
        const lastLocation = filteredLocations[filteredLocations.length - 1];
        if (mapInstanceRef.current && lastLocation) {
          mapInstanceRef.current.setCenter(lastLocation);
          mapInstanceRef.current.setZoom(20);
        }
      }
    }, 100);
    forceRender();
  };
  const toggleDropdownCreate = (): void => {
    setDropdownOpenCreateOrder(!dropdownOpenCreateOrder);
  };
  const toggleDropdown = (): void => {
    setDropdownOpen(!dropdownOpen);
  };
  const handleDate = (date: DateObject | null): void => {
    setSelectDate(date);
    setShowOnlyLastLocation(true);
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
      animationIntervalRef.current = null;
    }
    setAnimatedPosition(null);
    setShowRoute(false);
    setMapKey(Date.now());
    setDateAndIdState({
      date: selectDate instanceof DateObject
        ? selectDate.format("YYYY-MM-DD") : ""
    });
  };

  const handleCurrentLocationClick = (): void => {
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
      animationIntervalRef.current = null;
    }
    setAnimatedPosition(null);
    setShowRoute(false);
    setShowSingleMarker(null); // Reset single marker mode
    setShowOnlyLastLocation(true);
    setUserMovedMap(false);
    closeAllInfoWindows();
    forceRender();
    setMapKey(Date.now());
    if (locations.length > 0) {
      const lastLocation = locations[locations.length - 1];
      if (mapInstanceRef.current && lastLocation) {
        mapInstanceRef.current.setCenter(lastLocation);
        mapInstanceRef.current.setZoom(20);
      }
    }
  };

  const handleLocationItemClick = (index: number): void => {
    const actualIndex = locations.length - 1 - index;
    const location = locations[actualIndex];

    if (location) {
      setActiveMarker(actualIndex);
      setShowSingleMarker(actualIndex); // Show only this marker
      setShowOnlyLastLocation(false); // Disable last location mode
      setShowRoute(false); // Disable route mode
      setUserMovedMap(false); // Reset user moved map flag

      if (mapInstanceRef.current) {
        mapInstanceRef.current.setCenter({
          lat: location.lat,
          lng: location.lng,
        });
        mapInstanceRef.current.setZoom(20); // Adjust zoom level as needed
      }
    }
  };

  const hideRouteAndFetchData = async (): Promise<void> => {
    setShowRoute(false);
    setAnimatedPosition(null);
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
    }
  };
  const showRouteWithAnimation = (): void => {
    setShowRoute(true);
    setShowOnlyLastLocation(false);
    setUserMovedMap(false);
    setTimeout(() => {
      startMarkerAnimation();
    }, 50);
  };

  const handleRouteToggle = (): void => {
    if (showRoute) {
      hideRouteAndFetchData();
    } else {
      setShowSingleMarker(null); // Reset single marker mode
      showRouteWithAnimation();
    }
  };

  useEffect(() => {
    setSelectDate(DateAndId || new DateObject().format("YYYY-MM-DD"));
  }, [DateAndId]);
  useEffect(() => {
    if (canViewLocation) {
      if (hasPropCoordinates) return;

      if (selectDate && companyTeamInfo?.id) {
        if (animationIntervalRef.current) {
          clearInterval(animationIntervalRef.current);
          animationIntervalRef.current = null;
        }
        setAnimatedPosition(null);
        setShowRoute(false);
        const selectedDate = selectDate instanceof DateObject
          ? selectDate.format("YYYY-MM-DD")
          : selectDate;
        fetchTrackApi(
          setExpenseList,
          setLoading,
          selectedDate,
          companyTeamInfo.id
        );
      }
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  }, [selectDate, companyTeamInfo]);
  useEffect(() => {
    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
        animationIntervalRef.current = null;
      }
    };
  }, []);
  const closeAllInfoWindows = (): void => {
    setActiveMarker(null);
    setTimeout(() => {
      forceRender();
    }, 50);
  };
  return (
    <>
      {show && (
        <div className="modal1">
          <div
            className="modal-content1"
            style={{
              maxHeight: "90%",
              maxWidth: "100%",
              width: "90vw",
              height: "85vh",

            }}
          >
            <div className="d-flex align-items-center justify-content-between">

              <div className="col-8">
                <h2 className="modal-title1 form_header_text">
                  You are Tracking :{" "}
                  {companyTeamInfo ? companyTeamInfo?.username : null}
                </h2>
              </div>
              <div className="col-4">
                <span
                  className="close ms-3 pb-3"
                  onClick={onHide}
                  style={{ cursor: "pointer" }}
                >
                  &times;
                </span>


              </div>
            </div>


            {/* <h2 className="modal-title1 form_header_text">
              You are Tracking :{" "}
              {companyTeamInfo ? companyTeamInfo?.username : null}
            </h2> */}
            <div className={`m-title-2 col-12`}>
              <div className="head">
                <div className="source-of-type-list-grid-block">
                  <div
                    className="source-of-type-list-grid-main table-responsive"
                    style={{ height: "70vh", overflowX: "hidden" }}
                  >
                    <div className="model1">
                      <div
                        className="header"
                        style={{ margin: "0px", padding: "0px" }}
                      >
                        <span style={{ marginLeft: "20px" }}>
                          <span className="landing-page-text">
                            Filter With Date :{" "}
                          </span>
                          <DatePicker
                            value={selectDate}
                            onChange={handleDate}
                            // format="DD-MM-YYYY"
                            maxDate={new DateObject()}
                            calendarPosition="bottom-left"
                            style={{ width: "100%", paddingLeft: "5px" }}
                            placeholder="DD-MM-YYYY"
                            className="form-control font-size-15 rounded-1"
                          />
                        </span>
                        <div className="d-flex">
                          <button
                            className="icons"
                            onClick={handleCurrentLocationClick}
                            disabled={locations.length === 0}
                          >
                            <span title="Current Location">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="24px"
                                viewBox="0 -960 960 960"
                                width="24px"
                                fill="currentColor"
                              >
                                <path d="M440-42v-80q-125-14-214.5-103.5T122-440H42v-80h80q14-125 103.5-214.5T440-838v-80h80v80q125 14 214.5 103.5T838-520h80v80h-80q-14 125-103.5 214.5T520-122v80h-80Zm40-158q116 0 198-82t82-198q0-116-82-198t-198-82q-116 0-198 82t-82 198q0 116 82 198t198 82Zm0-120q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47Zm0-80q33 0 56.5-23.5T560-480q0-33-23.5-56.5T480-560q-33 0-56.5 23.5T400-480q0 33 23.5 56.5T480-400Zm0-80Z" />
                              </svg>
                            </span>
                          </button>
                          <button
                            className="icons mx-2"
                            onClick={handleRouteToggle}
                            disabled={locations.length < 2}
                          >
                            <span title="Route">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="24px"
                                viewBox="0 -960 960 960"
                                width="24px"
                                fill="currentColor"
                              >
                                <path d="m600-120-240-84-186 72q-20 8-37-4.5T120-170v-560q0-13 7.5-23t20.5-15l212-72 240 84 186-72q20-8 37 4.5t17 33.5v560q0 13-7.5 23T812-192l-212 72Zm-40-98v-468l-160-56v468l160 56Zm80 0 120-40v-474l-120 46v468Zm-440-10 120-46v-468l-120 40v474Zm440-458v468-468Zm-320-56v468-468Z" />
                              </svg>
                            </span>
                          </button>
                          <button
                            className="icons"
                            style={{ marginRight: "20px" }}
                            onClick={toggleDropdownCreate}
                            ref={dropdownCreateOrderRef}
                            disabled={hasPropCoordinates}
                          >
                            <span title="Pins">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="24px"
                                viewBox="0 -960 960 960"
                                width="24px"
                                fill="currentColor"
                              >
                                <path d="M480-480q33 0 56.5-23.5T560-560q0-33-23.5-56.5T480-640q-33 0-56.5 23.5T400-560q0 33 23.5 56.5T480-480Zm0 294q122-112 181-203.5T720-552q0-109-69.5-178.5T480-800q-101 0-170.5 69.5T240-552q0 71 59 162.5T480-186Zm0 106Q319-217 239.5-334.5T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 100-79.5 217.5T480-80Zm0-480Z" />
                              </svg>
                            </span>
                            <div className="dropdown-icon">
                              <ul
                                className={`drop-order ${dropdownOpenCreateOrder
                                  ? "isVisible"
                                  : "isHidden"
                                  }`}
                                style={{ margin: "0px", padding: "0px" }}
                              >
                                <li
                                  className="listItem"
                                  role="button"
                                  onClick={() => handleModeFilter(null)}
                                >
                                  All
                                </li>
                                <li
                                  className="listItem"
                                  role="button"
                                  onClick={() => handleModeFilter(1)}
                                >
                                  Quotation
                                </li>
                                <li
                                  className="listItem"
                                  role="button"
                                  onClick={() => handleModeFilter(2)}
                                >
                                  Order
                                </li>
                                <li
                                  className="listItem"
                                  role="button"
                                  onClick={() => handleModeFilter(3)}
                                >
                                  Invoice
                                </li>
                                <li
                                  className="listItem"
                                  role="button"
                                  onClick={() => handleModeFilter(4)}
                                >
                                  Purchase
                                </li>
                                <li
                                  className="listItem"
                                  role="button"
                                  onClick={() => handleModeFilter(5)}
                                >
                                  Login
                                </li>
                                <li
                                  className="listItem"
                                  role="button"
                                  onClick={() => handleModeFilter(6)}
                                >
                                  LogOut
                                </li>
                                <li
                                  className="listItem"
                                  role="button"
                                  onClick={() => handleModeFilter(7)}
                                >
                                  Check In
                                </li>
                                <li
                                  className="listItem"
                                  role="button"
                                  onClick={() => handleModeFilter(8)}
                                >
                                  Check Out
                                </li>
                                <li
                                  className="listItem"
                                  role="button"
                                  onClick={() => handleModeFilter(9)}
                                >
                                  Inquiry
                                </li>
                                <li
                                  className="listItem"
                                  role="button"
                                  onClick={() => handleModeFilter(10)}
                                >
                                  Visit
                                </li>
                                <li
                                  className="listItem"
                                  role="button"
                                  onClick={() => handleModeFilter(11)}
                                >
                                  dispach
                                </li>
                                <li
                                  className="listItem"
                                  role="button"
                                  onClick={() => handleModeFilter(12)}
                                >
                                  returnsalesInvoice
                                </li>
                                <li
                                  className="listItem"
                                  role="button"
                                  onClick={() => handleModeFilter(13)}
                                >
                                  purchaseOrder
                                </li>
                                <li
                                  className="listItem"
                                  role="button"
                                  onClick={() => handleModeFilter(14)}
                                >
                                  Return Purchase Invoice
                                </li>
                                <li
                                  className="listItem"
                                  role="button"
                                  onClick={() => handleModeFilter(15)}
                                >
                                  Good Receive Note
                                </li>
                                <li
                                  className="listItem"
                                  role="button"
                                  onClick={() => handleModeFilter(16)}
                                >
                                  Contact
                                </li>
                                <li
                                  className="listItem"
                                  role="button"
                                  onClick={() => handleModeFilter(17)}
                                >
                                  Expense
                                </li>
                                <li
                                  className="listItem"
                                  role="button"
                                  onClick={() => handleModeFilter(-1)}
                                >
                                  Sync
                                </li>
                              </ul>
                            </div>
                          </button>
                        </div>
                      </div>
                      <div className="container google-Map">
                        <div className="col-9" style={{ height: "100vh" }}>
                          {isLoaded && (
                            <GoogleMap
                              key={`map-${mapKey}`}
                              mapContainerStyle={containerStyle}
                              center={
                                userMovedMap
                                  ? undefined
                                  : showSingleMarker !== null &&
                                    locations[showSingleMarker]
                                    ? {
                                      lat: locations[showSingleMarker].lat,
                                      lng: locations[showSingleMarker].lng,
                                    }
                                    : showOnlyLastLocation && locations.length > 0
                                      ? {
                                        lat: locations[locations.length - 1].lat,
                                        lng: locations[locations.length - 1].lng,
                                      }
                                      : animatedPosition
                                        ? animatedPosition
                                        : locations.length > 0
                                          ? {
                                            lat: locations[locations.length - 1].lat,
                                            lng: locations[locations.length - 1].lng,
                                          }
                                          : undefined
                              }
                              zoom={18}
                              options={{
                                draggable: true,
                                zoomControl: true,
                                scrollwheel: true,
                                disableDoubleClickZoom: false,
                              }}
                              // onLoad={(map) => {
                              //   mapInstanceRef.current = map;
                              //   if (
                              //     locations.length > 0 &&
                              //     showSingleMarker === null &&
                              //     showOnlyLastLocation
                              //   ) {
                              //     const lastLocation =
                              //       locations[locations.length - 1];
                              //     map.setCenter({
                              //       lat: lastLocation.lat,
                              //       lng: lastLocation.lng,
                              //     });
                              //     map.setZoom(20);
                              //   }
                              // }}
                              onDragStart={() => {
                                setUserMovedMap(true);
                              }}
                              onCenterChanged={() => {
                                if (mapInstanceRef.current && !userMovedMap) {
                                  setUserMovedMap(true);
                                }
                              }}
                            >
                              {/* Render single marker when showSingleMarker is set */}
                              {showSingleMarker !== null &&
                                locations[showSingleMarker] && (
                                  <Marker
                                    key={`marker-${showSingleMarker}-${mapKey}`}
                                    position={{
                                      lat: locations[showSingleMarker].lat,
                                      lng: locations[showSingleMarker].lng,
                                    }}
                                    onClick={() => {
                                      closeAllInfoWindows();
                                      setTimeout(() => {
                                        setActiveMarker(showSingleMarker);
                                      }, 10);
                                    }}
                                    icon={{
                                      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24">
            <path fill="${locations[showSingleMarker].color}" d="M15 12.91V26a1 1 0 0 0 2 0V12.91a6 6 0 1 0-2 0z"/>
          </svg>`)}`,
                                      scaledSize: new window.google.maps.Size(
                                        30,
                                        30
                                      ),
                                    }}
                                  >
                                    {activeMarker === showSingleMarker && (
                                      <InfoWindow
                                        position={{
                                          lat: locations[showSingleMarker].lat,
                                          lng: locations[showSingleMarker].lng,
                                        }}
                                        onCloseClick={() =>
                                          setActiveMarker(null)
                                        }
                                      >
                                        <div>
                                          <div
                                            style={{
                                              fontWeight: "bold",
                                              color: "#000",
                                              fontSize: "18px",
                                            }}
                                          >
                                            {locations[showSingleMarker].title}
                                          </div>
                                          <div
                                            style={{
                                              fontWeight: "normal",
                                              color: "#000",
                                            }}
                                          >
                                            Address:{" "}
                                            {
                                              locations[showSingleMarker]
                                                .address
                                            }
                                          </div>
                                          <div
                                            style={{
                                              fontWeight: "normal",
                                              color: "#000",
                                            }}
                                          >
                                            Latitude:{" "}
                                            {locations[showSingleMarker].lat}{" "}
                                            Longitude:{" "}
                                            {locations[showSingleMarker].lng}
                                          </div>
                                          <div
                                            style={{
                                              fontWeight: "normal",
                                              color: "#000",
                                            }}
                                          >
                                            Date:{" "}
                                            {new Date(
                                              locations[
                                                showSingleMarker
                                              ].created_date_time
                                            ).toLocaleDateString("en-GB")}
                                          </div>
                                          <div
                                            style={{
                                              fontWeight: "normal",
                                              color: "#000",
                                            }}
                                          >
                                            Time:{" "}
                                            {new Date(
                                              locations[
                                                showSingleMarker
                                              ].created_date_time
                                            ).toLocaleTimeString()}
                                          </div>
                                        </div>
                                      </InfoWindow>
                                    )}
                                  </Marker>
                                )}

                              {/* Render last location marker if showSingleMarker is null and showOnlyLastLocation is true */}
                              {showSingleMarker === null &&
                                showOnlyLastLocation &&
                                locations.length > 0 && (
                                  <Marker
                                    key={`last-marker-${mapKey}-${Date.now()}`}
                                    position={{
                                      lat: locations[locations.length - 1].lat,
                                      lng: locations[locations.length - 1].lng,
                                    }}
                                    onClick={() => {
                                      setActiveMarker(null);
                                      setTimeout(() => {
                                        setActiveMarker(locations.length - 1);
                                      }, 50);
                                    }}
                                    icon={{
                                      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24">
            <path fill="${locations[locations.length - 1].color
                                        }" d="M15 12.91V26a1 1 0 0 0 2 0V12.91a6 6 0 1 0-2 0z"/>
          </svg>`)}`,
                                      scaledSize: new window.google.maps.Size(
                                        30,
                                        30
                                      ),
                                    }}
                                  >
                                    {activeMarker === locations.length - 1 && (
                                      <InfoWindow
                                        position={{
                                          lat: locations[locations.length - 1]
                                            .lat,
                                          lng: locations[locations.length - 1]
                                            .lng,
                                        }}
                                        onCloseClick={() =>
                                          setActiveMarker(null)
                                        }
                                      >
                                        <div>
                                          <div
                                            style={{
                                              fontWeight: "bold",
                                              color: "#000",
                                              fontSize: "18px",
                                            }}
                                          >
                                            {
                                              locations[locations.length - 1]
                                                .title
                                            }
                                          </div>
                                          <div
                                            style={{
                                              fontWeight: "normal",
                                              color: "#000",
                                            }}
                                          >
                                            Address:{" "}
                                            {
                                              locations[locations.length - 1]
                                                .address
                                            }
                                          </div>
                                          <div
                                            style={{
                                              fontWeight: "normal",
                                              color: "#000",
                                            }}
                                          >
                                            Latitude:{" "}
                                            {
                                              locations[locations.length - 1]
                                                .lat
                                            }{" "}
                                            Longitude:{" "}
                                            {
                                              locations[locations.length - 1]
                                                .lng
                                            }
                                          </div>
                                          <div
                                            style={{
                                              fontWeight: "normal",
                                              color: "#000",
                                            }}
                                          >
                                            Date:{" "}
                                            {new Date(
                                              locations[
                                                locations.length - 1
                                              ].created_date_time
                                            ).toLocaleDateString("en-GB")}
                                          </div>
                                          <div
                                            style={{
                                              fontWeight: "normal",
                                              color: "#000",
                                            }}
                                          >
                                            Time:{" "}
                                            {new Date(
                                              locations[
                                                locations.length - 1
                                              ].created_date_time
                                            ).toLocaleTimeString()}
                                          </div>
                                        </div>
                                      </InfoWindow>
                                    )}
                                  </Marker>
                                )}

                              {/* Render all markers when showing route and no single marker is selected */}
                              {showSingleMarker === null &&
                                !showOnlyLastLocation &&
                                locations.length > 0 &&
                                locations.map((loc, index) => (
                                  <Marker
                                    key={`marker-${index}-${mapKey}`}
                                    position={{ lat: loc.lat, lng: loc.lng }}
                                    onClick={() => {
                                      closeAllInfoWindows();
                                      setTimeout(() => {
                                        setActiveMarker(index);
                                      }, 10);
                                    }}
                                    icon={{
                                      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24">
              <path fill="${loc.color}" d="M15 12.91V26a1 1 0 0 0 2 0V12.91a6 6 0 1 0-2 0z"/>
            </svg>`)}`,
                                      scaledSize: new window.google.maps.Size(
                                        30,
                                        30
                                      ),
                                    }}
                                  >
                                    {activeMarker === index && (
                                      <InfoWindow
                                        position={{
                                          lat: loc.lat,
                                          lng: loc.lng,
                                        }}
                                        onCloseClick={() =>
                                          setActiveMarker(null)
                                        }
                                      >
                                        <div>
                                          <div
                                            style={{
                                              fontWeight: "bold",
                                              color: "#000",
                                              fontSize: "18px",
                                            }}
                                          >
                                            {loc.title}
                                          </div>
                                          <div
                                            style={{
                                              fontWeight: "normal",
                                              color: "#000",
                                            }}
                                          >
                                            Address: {loc.address}
                                          </div>
                                          <div
                                            style={{
                                              fontWeight: "normal",
                                              color: "#000",
                                            }}
                                          >
                                            Latitude: {loc.lat} Longitude:{" "}
                                            {loc.lng}
                                          </div>
                                          <div
                                            style={{
                                              fontWeight: "normal",
                                              color: "#000",
                                            }}
                                          >
                                            Date:{" "}
                                            {new Date(
                                              loc.created_date_time
                                            ).toLocaleDateString("en-GB")}
                                          </div>
                                          <div
                                            style={{
                                              fontWeight: "normal",
                                              color: "#000",
                                            }}
                                          >
                                            Time:{" "}
                                            {new Date(
                                              loc.created_date_time
                                            ).toLocaleTimeString()}
                                          </div>
                                        </div>
                                      </InfoWindow>
                                    )}
                                  </Marker>
                                ))}

                              {/* Render polyline and animated marker when route is shown */}
                              {showSingleMarker === null &&
                                showRoute &&
                                locations.length > 1 && (
                                  <>
                                    <Polyline
                                      path={locations}
                                      options={{
                                        strokeColor: "#FF0000",
                                        strokeOpacity: 0.8,
                                        strokeWeight: 4,
                                      }}
                                    />
                                    {animatedPosition && (
                                      <Marker
                                        key={`animated-marker-${mapKey}`}
                                        position={animatedPosition}
                                        options={{
                                          optimized: true,
                                          clickable: false,
                                          zIndex: 999,
                                          draggable: false,
                                        }}
                                        icon={{
                                          path: window.google.maps.SymbolPath
                                            .CIRCLE,
                                          scale: 8,
                                          fillColor: "#0000FF",
                                          fillOpacity: 1,
                                          strokeWeight: 4,
                                        }}
                                      />
                                    )}
                                  </>
                                )}
                            </GoogleMap>
                          )}{" "}
                        </div>
                        <div className="col-3" style={{ height: "100vh" }}>
                          {locations.length === 0 ? (
                            <div className="source-of-type-list-grid-main">
                              <p className="text-center pt-5">No Data Found</p>
                            </div>
                          ) : (
                            <div
                              className="chats"
                              style={{ overflowY: "auto", height: "100%" }}
                            >
                              {locations
                                .slice()
                                .reverse()
                                .map((loc, index) => (
                                  <button
                                    key={index}
                                    className="block chat-list"
                                    onClick={() => {
                                      handleLocationItemClick(index);
                                    }}
                                    style={{ cursor: "pointer" }}
                                  >
                                    <div className="imgBox">
                                      <div className="userImg location-img">
                                        <img
                                          src={`data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                                       <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24">
                                          <path fill="${loc.color}" d="M15 12.91V26a1 1 0 0 0 2 0V12.91a6 6 0 1 0-2 0z"/>
                                      </svg>`)}`}
                                          alt="Pin"
                                          className="cover"
                                          style={{ marginLeft: "-6px" }}
                                        />
                                      </div>
                                    </div>
                                    <div className="h-text">
                                      <div className="head">
                                        <h4>{loc.title}</h4>
                                      </div>
                                      <div className="message-chat d-flex justify-content-between">
                                        <div className="chat-text-icon">
                                          <span className="thanks">
                                            {loc.address}
                                          </span>
                                        </div>
                                        <div className="text-end col-4">
                                          <p className="contact-text">
                                            {new Date(
                                              loc.created_date_time
                                            ).toLocaleDateString("en-GB")}
                                          </p>
                                          <p className="contact-text">
                                            {new Date(
                                              loc.created_date_time
                                            ).toLocaleTimeString()}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </button>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
export default TrackView;
