import React from "react";
import { Link } from "react-router-dom";

const Maintenance = () => {
  return (
    <div className="body">
      <div className="container main ">
        <div className=" Intro-Left1">
          <div className="col-12">
            <span className="d-flex justify-content-center mt-3">
              <img
                width={400}
                src={require("../assets/images/deshFlow_log.png")}
                alt=""
              />
            </span>
            <div style={{ textAlign: "center", padding: "50px", color: "red" }}>
              <h1>Maintenance Mode</h1>
              <p>
                We are currently undergoing maintenance. Please check back
                later.
              </p>
            </div>
            
          </div>
          <div className="d-flex justify-content-center align-items-end h-50 ">
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
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
