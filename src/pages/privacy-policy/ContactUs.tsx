import { INSTRUCTION_URL_ENDPOINT } from "../../helpers/AppConstants";

const ContactUs = () => {
 const handleContactUsClose = () => {
    window.location.href = "/";
  }
    return (
      <div className="body">
        <div className="container main ">
          <div className="row Intro-Left1">
            <div className="col-12">
               <div className="d-flex justify-content-center mt-3">
              <div className="col-4">
              <svg style={{cursor: "pointer"}} onClick={handleContactUsClose} xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f"><path d="M360-240 120-480l240-240 56 56-144 144h568v80H272l144 144-56 56Z" /></svg>
              </div>

              <div className="col-4 d-flex justify-content-center">
                <img
                  width={400}
                  src={require("../../assets/images/deshFlow_log.png")}
                  alt="Office Logo"
                />
              </div>
              <div className="col-4">

              </div>
            </div>
              <div className="d-flex justify-content-center mt-3">
                {/* <p>Contact Us</p> */}
              </div>
              <div className="d-flex justify-content-center ">
                <iframe
                  src={`${INSTRUCTION_URL_ENDPOINT}/contact_us.html`}
                  title="External HTML"
                  width="100%"
                  height="500px"
                  style={{ border: "none" }}
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  export default ContactUs;