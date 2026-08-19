import { useEffect, useState } from "react";
import { handleRefresh } from "../../../common/SharedFunction";
import ConfirmationModal from "../../../components/model/ConfirmationModal";
import StepCompanyView from "../step-company/StepCompanyView";
import CouponModal from "./CouponModal";
import {
  fetchApiPlan,
  IPlanList,
  updateCompanyForPlan
} from "./PricingTableController";

interface IPropPricingTable {
  companyId: number | undefined;
  companyName: string | undefined;
  companyEmailId: string | undefined;
  companyContact: string | undefined;
  planAmount?: number;
  checkCompanyAlreadyExists?: number;
  renew_flag?: string | number;
  innnerRenualFlag?: string | number;
  onHide: () => void;
}

const PricingTable = ({
  companyId,
  companyName,
  companyEmailId,
  companyContact,
  planAmount,
  checkCompanyAlreadyExists,
  renew_flag,
  innnerRenualFlag,
  onHide,
}: IPropPricingTable) => {
  // const loadScript = (src: string) => {
  //   return new Promise((resolve) => {
  //     const script = document.createElement("script");
  //     script.src = src;
  //     script.onload = () => resolve(true);
  //     script.onerror = () => resolve(false);
  //     document.body.appendChild(script);
  //   });
  // };

  // useEffect(() => {
  //   loadScript("https://checkout.razorpay.com/v1/checkout.js");
  // }, []);

  const [planList, setPlanList] = useState<IPlanList[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [isCloseConfirmation, setIsCloseConfirmation] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<IPlanList | null>(null);

  const handleHide = () => {
    onHide();
    setIsCloseConfirmation(false);
  };
  useEffect(() => {
    fetchApiPlan(setPlanList);
  }, []);

  // const handleChoosePlan = async (item: IPlanList) => {
  //   if (item.trail_days !== 0 && item.isRenewal !== 1) {
  //     await updateCompanyForPlan(
  //       setShowMenu,
  //       companyId,
  //       item.plan_id,
  //       item.months,
  //       item.trail_days
  //     );
  //   } else {
  //     displayRazorpay(
  //       setShowMenu,
  //       item.plan_amount,
  //       companyId,
  //       item.plan_id,
  //       companyName,
  //       companyEmailId,
  //       companyContact,
  //       item.months,
  //       item.trail_days,
  //       renew_flag
  //     );
  //   }
  // };

  const handleChoosePlan = async (item: IPlanList) => {
    if (item.trail_days !== 0 && item.isRenewal !== 1) {
      await updateCompanyForPlan(
        setShowMenu,
        companyId,
        item.plan_id,
        item.months,
        item.trail_days,
      );
    } else {
      // PAID PLAN → Open CouponModal instead of Razorpay
      setSelectedPlan(item); // NEW: Store selected plan
      setShowCouponModal(true); // NEW: Open Coupon Modal
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    handleRefresh();
  };

  const person_limit = ["For Small Team", "For Medium Team", "For Big Team"];
  // const discount_price = [
  //   "₹ 4,999/- Per Year",
  //   "₹ 9,999/- Per Year",
  //   "₹ 17,000/- Per Year",
  // ];

  return (
    <>
      {showMenu || checkCompanyAlreadyExists === 4 ? (
        <StepCompanyView isVisibleStepCompany={true} companyId={companyId} />
      ) : (
        <div className="modal1">
          <div
            className="modal-content1"
            style={{
              width: "98%",
              backgroundColor: "rgb(240 242 245)",
              marginTop: "10px",
            }}
          >
            <div className="main-pricing w-100 px-2 mx-2">
              <div className="Intro-Left1">
                <div className="row">
                  <div className="text-center pt-3">
                    <img
                      src={require("../../../assets/images/deshFlow_log.png")}
                      width={400}
                      alt=""
                    />
                    {innnerRenualFlag === 1 ? (
                      <span
                        className="close ms-3 pb-3"
                        onClick={() => setIsCloseConfirmation(true)}
                      >
                        ×
                      </span>
                    ) : (
                      ""
                    )}
                  </div>

                  <div>
                    <p className="text-center h3 fw-bold mt-4">
                      Best Pricing Plans
                    </p>
                  </div>
                  <div className="d-flex justify-content-center">
                    <p
                      className="py-2 text-center"
                      style={{ color: "black", width: "90%" }}
                    >
                      Discover the best pricing plans designed for every budget.
                      Choose a plan that suits your business
                      <br />
                      and unlock powerful CRM features to enhance your
                      productivity.
                    </p>
                  </div>
                </div>
                <div
                  className="row mx-3 "
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <div
                    className="d-flex p-2"
                    style={{
                      // borderRadius: "15px",
                      justifyContent: "center",
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    {/* Feature Column */}
                    <div className="mt-2 flex-fill" style={{ width: "39%" }}>
                      <div
                        className="card text-left"
                        style={{ backgroundColor: "#f0f2f5", border: "0px" }}
                      >
                        <div
                          className="card-header mb-0"
                          style={{
                            backgroundColor: "#e0ddddff",
                            borderRadius: "0px",
                          }}
                        >
                          <h4 className="my-0" style={{ fontWeight: "bold" }}>
                            Features
                          </h4>
                          <p>&nbsp; &nbsp;</p>

                          <h1
                            className="card-title pricing-card-title"
                            style={{ color: "#f58634" }}
                          >
                            &nbsp; &nbsp;
                          </h1>
                          <span>&nbsp; &nbsp;</span>
                          <br />
                          <span>&nbsp; &nbsp;</span>
                        </div>
                        <div className="card-body" style={{ padding: "0px" }}>
                          <ul className="mt-3 ps-0">
                            {planList &&
                              planList[0]?.plan_pages.map((feature, index) => (
                                <li
                                  key={index}
                                  style={{
                                    listStyle: "none",
                                    padding: "10px 0",
                                    fontSize: "16px",
                                    borderBottom: "1px solid #e2dcd1",
                                  }}
                                >
                                  {feature.page_id == 34 ? (
                                    <div
                                      dangerouslySetInnerHTML={{
                                        __html: `${feature.page_name} <br/> &nbsp;`,
                                      }}
                                    />
                                  ) : (
                                    `${feature.page_name}`
                                  )}
                                  {/* {feature.page_name} */}
                                </li>
                              ))}
                          </ul>
                          <h4 className="my-0" style={{ fontWeight: "bold" }}>
                            Features
                          </h4>
                          <p>&nbsp; &nbsp;</p>
                          <h1
                            className="card-title pricing-card-title"
                            style={{ color: "#f58634" }}
                          >
                            &nbsp; &nbsp;
                          </h1>
                          <span>&nbsp; &nbsp;</span>
                          <br />
                          <span>&nbsp; &nbsp;</span>
                          <br /> <br />
                          <button
                            type="button"
                            className="btn btn-lg btn-primary m-1"
                            // onClick={() => handleChoosePlan(plan)}
                            style={{
                              backgroundColor: "#f58634",
                              fontSize: "18px",
                              paddingInline: "15px",
                              borderRadius: "30px",
                              visibility: "hidden",
                            }}
                          >
                            {/* {1 === 0 ||
                                    plan.isRenewal === 1 ||
                                    innnerRenualFlag === 1
                                      ? "Pay Now"
                                      : `Start ${plan.trail_days} Days Free Trial`} */}
                            start
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Pricing Plans */}
                    <div
                      className="d-flex "
                      style={{ width: "70%", border: "0px" }}
                    >
                      {planList &&
                        planList
                          .filter((plan) =>
                            planAmount !== undefined
                              ? plan.plan_amount > planAmount
                              : true,
                          )
                          .map((plan, index) => (
                            <div className="mt-2 flex-fill" key={index}>
                              <div
                                className="card text-center"
                                style={{ border: "0px" }}
                              >
                                <div
                                  className="card-header mb-0"
                                  style={{
                                    backgroundColor: "#e0ddddff",
                                    borderRadius: "0px",
                                  }}
                                >
                                  <h4
                                    className="my-0"
                                    style={{ fontWeight: "bold" }}
                                  >
                                    {plan.plan_name}
                                  </h4>
                                  <p>{person_limit[index]}</p>

                                  <h1
                                    className="card-title pricing-card-title"
                                    style={{ color: "#f58634" }}
                                  >
                                    ₹ {(plan.plan_amount / 1.18).toFixed(2)}
                                    /year
                                  </h1>
                                  <del>
                                    ₹ {plan.actual_amount + "/-" + "Per Year"}
                                  </del>
                                  <br />

                                  <span>(+ GST)</span>
                                </div>
                                <div
                                  className="card-body"
                                  style={{
                                    backgroundColor: "#f0f2f5",
                                    padding: "0px",
                                    border: "0px",
                                  }}
                                >
                                  <ul className="mt-3 ps-0">
                                    {plan.plan_pages.map((feature, idx) => (
                                      <li
                                        key={idx}
                                        style={{
                                          listStyle: "none",
                                          padding: "10px 0",
                                          fontSize: "16px",
                                          textAlign: "center",
                                          borderBottom: "1px solid #e2dcd1",
                                        }}
                                      >
                                        {feature.is_allow === 1 ? (
                                          <span style={{ color: "green" }}>
                                            {feature.dataLimit != "0" &&
                                              feature.dataLimit != " " &&
                                              feature.page_id == 1 ? (
                                              <div
                                                dangerouslySetInnerHTML={{
                                                  __html: ` <span style="color:#000;">${feature.dataLimit}</span> `,
                                                }}
                                              />
                                            ) : feature.page_id == 34 &&
                                              plan.plan_id == 1 ? (
                                              <div
                                                dangerouslySetInnerHTML={{
                                                  __html: `<span style="color:#000;">Up to ${feature.dataLimit} Users</span> <br> <b style="color:#f58634;">${feature.extra_information}</b>`,
                                                }}
                                              />
                                            ) : feature.page_id == 34 &&
                                              plan.plan_id == 2 ? (
                                              <div
                                                dangerouslySetInnerHTML={{
                                                  __html: ` <span style="color:#000;">Up to ${feature.dataLimit} Users</span> <br> <b style="color:#f58634;">${feature.extra_information}</b>`,
                                                }}
                                              />
                                            ) : feature.page_id == 34 &&
                                              plan.plan_id == 3 ? (
                                              <div
                                                dangerouslySetInnerHTML={{
                                                  __html: `<span style="color:#000;">Up to ${feature.dataLimit} Users</span> <br> <b style="color:#f58634">${feature.extra_information}</b>`,
                                                }}
                                              />
                                            ) : feature.page_id == 7 &&
                                              plan.plan_id == 1 ? (
                                              <div
                                                dangerouslySetInnerHTML={{
                                                  __html: `<span style="color:#000;">Up to ${feature.dataLimit}`,
                                                }}
                                              />
                                            ) : feature.page_id == 7 &&
                                              plan.plan_id == 2 ? (
                                              <div
                                                dangerouslySetInnerHTML={{
                                                  __html: `<span style="color:#000;">Up to ${feature.dataLimit}`,
                                                }}
                                              />
                                            ) : feature.page_id == 7 &&
                                              plan.plan_id == 3 ? (
                                              <div
                                                dangerouslySetInnerHTML={{
                                                  __html: `<span style="color:#000;">Up to ${feature.dataLimit}`,
                                                }}
                                              />
                                            ) : feature.page_id == 38 ? (
                                              <div
                                                dangerouslySetInnerHTML={{
                                                  __html: `<b style="color:#f58634; font-size:'10px';">${feature.extra_information}</b>`,
                                                }}
                                              />
                                            ) : feature.page_id == 39 &&
                                              (plan.plan_id == 1 ||
                                                plan.plan_id == 2) ? (
                                              <div
                                                dangerouslySetInnerHTML={{
                                                  __html: `<b style="color:#f58634; font-size:'10px';">${feature.extra_information}</b>`,
                                                }}
                                              />
                                            ) : feature.page_id == 39 &&
                                              plan.plan_id == 3 ? (
                                              <div
                                                dangerouslySetInnerHTML={{
                                                  __html: `<b style="color:#f58634; font-size:'10px';">${feature.extra_information}</b>`,
                                                }}
                                              />
                                            ) : feature.page_id == 91 ? (
                                              <div
                                                dangerouslySetInnerHTML={{
                                                  __html: `<b style="color:#f58634;">Up to ${feature.dataLimit} GB</b>`,
                                                }}
                                              />
                                            ) : (
                                              "✔"
                                            )}
                                          </span>
                                        ) : (
                                          <span style={{ color: "red" }}>
                                            X
                                          </span>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                  <h4
                                    className="my-0"
                                    style={{ fontWeight: "bold" }}
                                  >
                                    {plan.plan_name}
                                  </h4>
                                  <p>{person_limit[index]}</p>
                                  <h1
                                    className="card-title pricing-card-title"
                                    style={{ color: "#f58634" }}
                                  >
                                    ₹ {(plan.plan_amount / 1.18).toFixed(2)}
                                    /year
                                  </h1>
                                  <del>
                                    ₹ {plan.actual_amount + "/-" + "Per Year"}
                                  </del>
                                  <br />
                                  <span>(+ GST)</span>
                                  <br />
                                  <br />
                                  <button
                                    type="button"
                                    className="btn btn-lg btn-primary m-1"
                                    onClick={() => handleChoosePlan(plan)}
                                    style={{
                                      backgroundColor: "#f58634",
                                      fontSize: "18px",
                                      paddingInline: "15px",
                                      borderRadius: "30px",
                                    }}
                                  >
                                    {plan.trail_days === 0 ||
                                      plan.isRenewal === 1 ||
                                      innnerRenualFlag === 1
                                      ? "Pay Now"
                                      : `${plan.trail_days} Days Free Trial`}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                    </div>
                  </div>
                  <div className="" style={{ width: "90%" }}>
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
                </div>{" "}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COUPON MODAL */}
      {showCouponModal && selectedPlan && (
        <CouponModal
          companyId={companyId}
          companyName={companyName}
          companyEmailId={companyEmailId}
          companyContact={companyContact}
          // checkCompanyAlreadyExists={checkCompanyAlreadyExists}
          renew_flag={renew_flag}
          // innnerRenualFlag={innnerRenualFlag}
          onHide={() => setShowCouponModal(false)}
          plan_id={selectedPlan.plan_id}
          plan_amount={selectedPlan.plan_amount}
          plan_name={selectedPlan.plan_name}
          monthly_plan_amount={selectedPlan.monthly_plan_amount}
        />
      )}

      {isCloseConfirmation && (
        <ConfirmationModal
          show={isCloseConfirmation}
          onHide={() => setIsCloseConfirmation(false)}
          handleSubmit={() => handleHide()}
          title={`Close this`}
          message={`Are you sure you want Close this Plans ?`}
          btn1="No"
          btn2="Yes"
        />
      )}
    </>
  );
};

export default PricingTable;
