import React, { useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { DEFAULT_STATUS_CODE_SUCCESS } from "../../../helpers/AppConstants";
import { axiosInstance } from "../../../services/axiosInstance";
import { toast } from "react-toastify";

const ActivationCodeView = () => {
  const { id } = useParams();
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [formData, setFormData] = useState({
    mobileNumber: "",
    code: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    const min = 1000000000; // Example: Minimum value
    const max = 9999999999; // Example: Maximum value

    if (value === "") {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
      setErrorMessage("");
    } else if (Number(value) < min) {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
      setErrorMessage(`Min mobile number 10.`);
    } else if (Number(value) > max) {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
      setErrorMessage(`Max mobile number 10`);
    } else {
      // Valid input
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
      setErrorMessage("");
    }
  };
  const handleInputChangeActivationCode = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prevFormData) => ({
      ...prevFormData, // Keep other fields intact
      [name]: value,   // Update only the specific field
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post("verifyActivationCode", {
        activation_code: formData.code,
        contact_number: formData.mobileNumber,
      });
      if (response.data.code === 200) {
        if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {

          toast.success(response.data.ack_msg);
          setFormData({ code: "", mobileNumber: "" });
        } else {

          toast.error(response.data.ack_msg);
        }
      } else {

        toast.error(response.data.ack_msg);
      }
    } catch (error) {

      toast.error("Failed to send OTP. Please try again.");
    }
  };



  return (
    <div className="body">
      <div className="container main ">
        <div className="row Intro-Left1">

          <form onSubmit={handleSubmit}>
            <div className="col-12">
              <span className="d-flex justify-content-center mt-3">
                <img
                  width={400}
                  src={require("../../../assets/images/deshFlow_log.png")}
                  alt=""
                />
              </span>
            </div>

            <div className="d-flex justify-content-center mt-3 col-12">
              <p className="modal-title1 form_header_text">Activate your license</p>

            </div>

            <div className="col-12 d-flex justify-content-center my-2">
              <div className="form-group">
                <label htmlFor="mobileNumber" className="form_label">
                  Mobile Number<span className="text-danger">*</span>
                </label>

                <input
                  type="text"
                  name="mobileNumber"
                  className="form-control "
                  value={formData.mobileNumber}
                  onChange={handleInputChange}
                  placeholder="Enter mobile number"
                  onInput={(e: any) => e.target.value = e.target.value.replace(/[^0-9]/g, '')}


                />
                {errorMessage && <p className="text-danger">{errorMessage}</p>}

              </div>

            </div>
            <div className="col-12 d-flex justify-content-center">
              <div className="form-group">
                <label htmlFor="code" className="form_label">
                  Activation Code<span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="code"
                  className="form-control "
                  value={formData.code}
                  onChange={handleInputChangeActivationCode}
                  placeholder="Enter Activation Code"
                  required
                />
              </div>
            </div>
            <div className="col-12 d-flex justify-content-center">
              {!errorMessage && <button className="px-4 py-2 ms-2  text-light form_label rounded-1 " style={{
                backgroundColor: "#f58634",
              }} type="submit" >
                Submit
              </button>}
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default ActivationCodeView;
