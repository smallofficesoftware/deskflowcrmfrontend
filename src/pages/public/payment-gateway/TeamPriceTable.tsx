import { ErrorMessage } from "formik";
import React from "react";
import { Link } from "react-router-dom";
import { APPLICATION_VERSION } from "../../../helpers/AppConstants";
import { handleRefresh } from "../../../common/SharedFunction";

const TeamPriceTable = () => {
  const handleLogout = () => {
    localStorage.clear();
    handleRefresh();
  };

  return (
    <div className="modal1">
      <div
        className="modal-content1"
        style={{
          width: "80vw",
          height: "80vh",
          backgroundColor: "rgb(240 242 245)",
          marginTop: "10px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <div style={{ color: "red", fontSize: "20px", marginTop: "45px" }}>
          <strong>Your Plan is expired please Renew Now.</strong>
        </div>
        <div>Contact Your Owner For More Details.</div>

        <div style={{ marginTop: "20px" }}>
          <p>
            <Link to="/PrivacyPolicy" target="_blank">
              Privacy Policy
            </Link>
            &nbsp;|&nbsp;
            <Link to="ContactUs" target="_blank">
              Contact Us
            </Link>
          </p>
        </div>
        <div>
          <span
            style={{
              color: "blue",
              cursor: "pointer",
              // marginBottom: "8px",
            }}
            onClick={handleLogout}
          >
            <u>Logout Here</u>
          </span>
          <button className="btn " title="logout"></button>
        </div>
        <small style={{ textAlign: "center" }}>{APPLICATION_VERSION}</small>
      </div>
    </div>
  );
};

export default TeamPriceTable;
