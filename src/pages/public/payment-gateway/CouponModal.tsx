import { useEffect, useRef, useState } from "react";
import StepCompanyView from "../step-company/StepCompanyView";
import displayRazorpay from "./PaymentGateway";
import { couponCodeGetData, createPlanOtp, updateCompanyForPlan } from "./PricingTableController";
interface IPropCoupon {
  companyId: number | undefined;
  companyName: string | undefined;
  companyEmailId: string | undefined;
  companyContact: string | undefined;
  renew_flag?: string | number;
  onHide: () => void;
  plan_id: number;
  plan_amount: number;
  plan_name: string;
  monthly_plan_amount: number;
}

const CouponModal = ({
  companyId,
  companyName,
  companyEmailId,
  companyContact,
  renew_flag,
  onHide,
  plan_id,
  plan_amount,
  plan_name,
  monthly_plan_amount,
}: IPropCoupon) => {
  const [couponCode, setCouponCode] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [finalAmount, setFinalAmount] = useState<number>(plan_amount);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [gstAmount, setGstAmount] = useState<number>(0);
  const [couponCodeId, setCouponCodeId] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>("1");
  const [couponError, setCouponError] = useState<string>("");
  const [showMenu, setShowMenu] = useState<any>();
  const [showBaseAmount, setBaseAmount] = useState<number>(0);
  const PlanMonthRef = useRef<number>(12);
  const [RoundOffAmount, setRoundOffAmount] = useState<number>(0);
  const [isPaying, setIsPaying] = useState(false);
  const [isStaticCouponApplied, setIsStaticCouponApplied] = useState(false);
  const [isActivating, setIsActivating] = useState(false);


  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [encryptedOtp, setEncryptedOtp] = useState<string | null>(null);
  console.log("encryptedOtpencryptedOtp", encryptedOtp);

  useEffect(() => {
    const loadScript = (src: string) => {
      return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    };
    loadScript("https://checkout.razorpay.com/v1/checkout.js");
  }, []);
  // const applyIndianRoundOff = (amount: number): { finalAmount: number; roundOff: number } => {
  //     const total = Number(amount.toFixed(2)); // Ensure 2 decimal precision
  //     const rupees = Math.floor(total);
  //     const paise = Math.round((total - rupees) * 100); // Convert decimal to paise

  //     let finalAmount: number;
  //     let roundOff: number;

  //     if (paise > 50) {
  //         // 51–99 paise → next rupee
  //         finalAmount = rupees + 1;
  //         roundOff = 1 - (paise / 100); // e.g. 0.67 → roundOff = 0.33 (add 33 paise to make ₹1)
  //     } else {
  //         // 0–50 paise → same rupee
  //         finalAmount = rupees;
  //         roundOff = -(paise / 100); // e.g. 0.37 → roundOff = -0.37 (cut 37 paise)
  //     }

  //     return {
  //         finalAmount: Number(finalAmount.toFixed(2)),
  //         roundOff: Number(roundOff.toFixed(2)),
  //     };
  // };
  useEffect(() => {
    const code = couponCode.trim().toUpperCase();
    if (code === "2442") {
      setIsStaticCouponApplied(true);
      setSelectedYear("4"); // Automatically select 1 Month
    } else {
      setIsStaticCouponApplied(false);
      // अगर पहले 1 month selected था और coupon हटाया तो default 1 Year पर ले जाओ
      if (
        selectedYear === "4" ||
        selectedYear === "5" ||
        selectedYear === "6"
      ) {
        setSelectedYear("1");
      }
    }
  }, [couponCode]);
  useEffect(() => {
    const code = couponCode.trim();
    const yearMultiplier = Number(selectedYear);

    // Special handling for "1 Month" option (value "4")
    let updatedPlanMonth: number;
    if (selectedYear === "4") {
      updatedPlanMonth = 1;
    } else if (selectedYear === "5") {
      updatedPlanMonth = 3;
    } else if (selectedYear === "6") {
      updatedPlanMonth = 6;
    } else {
      updatedPlanMonth = 12 * yearMultiplier; // 1 Year = 12, 2 Years = 24, etc.
    }

    PlanMonthRef.current = updatedPlanMonth;

    const calculateBaseAndGST = (amount: number) => {
      const baseAmount = Number((amount / 1.18).toFixed(2));
      const gst = Number((amount - baseAmount).toFixed(2));
      const total_amount = Number((baseAmount + gst).toFixed(2));
      const total_amount_round = Math.round(total_amount);
      const round_amt = Number(
        Math.abs(total_amount - total_amount_round).toFixed(2),
      );

      setBaseAmount(baseAmount);
      setGstAmount(gst);
      setRoundOffAmount(round_amt);
      setFinalAmount(total_amount_round);
    };

    // Determine total amount based on selection
    let totalPlanAmount: number;
    if (selectedYear === "4") {
      // totalPlanAmount = plan_amount * 1; // 1 month plan
      totalPlanAmount = monthly_plan_amount; // 1 month plan
    } else if (selectedYear === "5") {
      totalPlanAmount = monthly_plan_amount * 3; // 3 month plan
    } else if (selectedYear === "6") {
      totalPlanAmount = monthly_plan_amount * 6; // 6 month plan
    } else {
      totalPlanAmount = plan_amount * yearMultiplier; // yearly plans
    }

    // Case 1: No coupon entered
    if (code.length < 3) {
      const finalAmountRound = Math.round(totalPlanAmount);
      calculateBaseAndGST(totalPlanAmount);
      setDiscountAmount(0);
      setFinalAmount(finalAmountRound);
      setCouponError("");
      setCouponCodeId(null);
      return;
    }

    // Case 2: Coupon entered (debounce 500ms)
    const timer = setTimeout(async () => {
      setIsApplying(true);
      const response = await couponCodeGetData(
        companyId,
        plan_id,
        selectedYear,
        code,
      );

      if (response?.ack === 1 && response?.data) {
        const {
          total_discount,
          gst_amount,
          payable_amount,
          coupon_code_id,
          round_off_amount,
        } = response.data;
        setDiscountAmount(total_discount ?? 0);
        setGstAmount(gst_amount ?? 0);
        setRoundOffAmount(round_off_amount ?? 0);
        setFinalAmount(payable_amount ?? totalPlanAmount);
        setCouponCodeId(coupon_code_id ?? null);
        setCouponError("");
      } else {
        setCouponError(response?.ack_msg || "Invalid coupon code");
        calculateBaseAndGST(totalPlanAmount);
        setDiscountAmount(0);
        setFinalAmount(Math.round(totalPlanAmount));
        setCouponCodeId(null);
      }
      setIsApplying(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [couponCode, selectedYear, companyId, plan_id, plan_amount]);
  // Prevent changing duration if static coupon is applied
  const handleDurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = couponCode.trim().toUpperCase();
    if (code === "2442") {
      // Do nothing - lock to "1 Month"
      return;
    }
    setSelectedYear(e.target.value);
  };

  const proceedToPayment = async () => {
    if (isPaying) return;
    const code = couponCode.trim().toUpperCase();

    const isStaticCoupon = code === "2442";

    if (code.length >= 3 && !isStaticCoupon) {
      setIsApplying(true);
      const response = await couponCodeGetData(
        companyId,
        plan_id,
        selectedYear,
        code,
      );

      if (response?.ack !== 1 || !response?.data) {
        setCouponError(response?.msg || "Invalid coupon");
        setIsApplying(false);
        return; // Stop Razorpay
      }

      const {
        total_discount,
        gst_amount,
        payable_amount,
        coupon_code_id,
        round_off_amount,
      } = response.data;
      setDiscountAmount(total_discount ?? 0);
      setGstAmount(gst_amount ?? 0);
      setRoundOffAmount(round_off_amount ?? 0);
      setFinalAmount(payable_amount ?? plan_amount);
      setCouponCodeId(coupon_code_id ?? null);

      setCouponError("");
      setIsApplying(false);
    } else if (isStaticCoupon) {
      setCouponError("");
    }

    setIsPaying(true);
    displayRazorpay(
      setShowMenu,
      finalAmount,
      companyId,
      plan_id,
      companyName,
      companyEmailId,
      companyContact,
      PlanMonthRef.current,
      0,
      renew_flag,
      plan_name,
      plan_amount,
      discountAmount,
      gstAmount,
      selectedYear,
      couponCodeId,
      RoundOffAmount,
      setIsPaying,
    );
  };
  const decryptOtp = async (encryptedText: string) => {
    try {
      const SECRET_KEY = "my_secret_key_123";

      const [ivHex, encryptedHex] = encryptedText.split(":");

      // Convert hex → Uint8Array
      const iv = Uint8Array.from(ivHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
      const encryptedBytes = Uint8Array.from(encryptedHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

      // 🔑 Create SHA-256 key (same as backend)
      const keyMaterial = await window.crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(SECRET_KEY)
      );

      const cryptoKey = await window.crypto.subtle.importKey(
        "raw",
        keyMaterial,
        { name: "AES-CBC" },
        false,
        ["decrypt"]
      );

      // 🔓 Decrypt
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: "AES-CBC",
          iv: iv,
        },
        cryptoKey,
        encryptedBytes
      );

      // Convert buffer → string
      return new TextDecoder().decode(decryptedBuffer);
    } catch (err) {
      console.error("Decrypt Error:", err);
      return "";
    }
  };
  const activatePlanWithoutPayment = async () => {
    setIsActivating(true);
    setOtpError("");
    setOtp("");

    try {
      const response = await createPlanOtp(companyId, plan_id);

      if (response?.ack === 1) {
        setEncryptedOtp(response?.data?.otp); // 👈 encrypted OTP store
        setShowOtpModal(true);
      } else {
        setOtpError(response?.ack_msg || "Failed to send OTP");
      }
    } catch (error) {
      console.error(error);
      setOtpError("Something went wrong");
    } finally {
      setIsActivating(false);
    }
  };


  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setOtpError("Please enter OTP");
      return;
    }

    if (!encryptedOtp) {
      setOtpError("OTP not found. Please retry.");
      return;
    }

    setOtpLoading(true);
    setOtpError("");

    try {
      const decryptedOtp = await decryptOtp(encryptedOtp);

      console.log("Decrypted OTP:", decryptedOtp);
      console.log("Entered OTP:", otp);

      if (otp.trim() === decryptedOtp) {
        const months = PlanMonthRef.current;

        await updateCompanyForPlan(
          setShowMenu,
          companyId,
          plan_id,
          months,
          0
        );

        setShowOtpModal(false);
        setOtp("");
        setEncryptedOtp(null);
      } else {
        setOtpError("Invalid OTP ❌");
      }
    } catch (err) {
      console.error(err);
      setOtpError("Verification failed");
    } finally {
      setOtpLoading(false);
    }
  };

  const closeOtpModal = () => {
    setShowOtpModal(false);
    setOtp("");
    setOtpError("");
  };
  return (
    <>

      {showOtpModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100000,   // Very high z-index
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "30px 25px",
              borderRadius: "12px",
              width: "340px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
              textAlign: "center",
            }}
          >
            <h5 className="mb-3">Enter OTP</h5>
            <p style={{ fontSize: "14px", color: "#666", marginBottom: "15px" }}>
              OTP has been sent to your registered email / mobile
            </p>

            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6 digit OTP"
              maxLength={6}
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "16px",
                textAlign: "center",
                borderRadius: "8px",
                border: "1px solid #ddd",
                marginBottom: "12px",
              }}
            />

            {otpError && (
              <p style={{ color: "red", fontSize: "13px", marginBottom: "12px" }}>
                {otpError}
              </p>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={handleVerifyOtp}
                disabled={otpLoading || !otp.trim()}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "bold",
                }}
              >
                {otpLoading ? "Verifying..." : "Verify OTP"}
              </button>

              <button
                onClick={closeOtpModal}
                disabled={otpLoading}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isPaying && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.7)", // Dark semi-transparent
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)", // Safari support
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            transition: "all 0.3s ease",
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: "32px 48px",
              borderRadius: "16px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
              textAlign: "center",
              minWidth: "300px",
            }}
          >
            <i
              className="fas fa-spinner fa-spin"
              style={{
                fontSize: "48px",
                color: "#f58634",
                marginBottom: "16px",
              }}
            ></i>
            <h4 style={{ margin: "0 0 8px 0", color: "#333" }}>
              Processing Payment
            </h4>
            <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
              Please do not close or refresh the page...
            </p>
          </div>
        </div>
      )}
      {showMenu ? (
        <StepCompanyView isVisibleStepCompany={true} companyId={companyId} />
      ) : (
        <div className="modal1">
          <div
            className="modal-content1"
            style={{
              width: "90%",
              maxWidth: "700px",
              margin: "60px auto",
              backgroundColor: "#fff",
              padding: "16px",
              borderRadius: "12px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
              fontSize: "15px",
              lineHeight: "1.4",
            }}
          >
            <div className="text-center mb-3">
              <h6 className="fw-bold text-dark" style={{ fontSize: "15px" }}>
                Subscription Summary
              </h6>
            </div>

            <div className="row">
              {/* Left Side - Registered Info */}
              <div className="col-md-6 mb-2">
                <h6
                  className="fw-bold mb-2"
                  style={{ fontSize: "15px", color: "#f58634" }}
                >
                  Registered Details
                </h6>
                <p>
                  <strong>Name:</strong> {companyName}
                </p>
                <p>
                  <strong>Contact:</strong> {companyContact}
                </p>
                <p>
                  <strong>Email:</strong> {companyEmailId}
                </p>
                {/* <p>
                                    <strong>City:</strong> -
                                </p>
                                <p>
                                    <strong>State:</strong> -
                                </p> */}
              </div>

              <div className="col-md-6 mb-2">
                <h6
                  className="fw-bold mb-2"
                  style={{ fontSize: "15px", color: "#f58634" }}
                >
                  Plan Details
                </h6>

                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "15px",
                  }}
                >
                  <tbody>
                    <tr>
                      <td style={{ padding: "4px 4px" }}>Plan</td>
                      <td style={{ padding: "4px 4px" }}>{plan_name}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "4px 4px" }}>Price</td>
                      <td style={{ padding: "4px 4px" }}>
                        ₹{showBaseAmount.toFixed(2)}
                      </td>
                    </tr>

                    {/* Duration */}
                    <tr>
                      <td style={{ padding: "4px 4px" }}>Duration</td>
                      <td style={{ padding: "4px 4px" }}>
                        <select
                          value={selectedYear}
                          onChange={handleDurationChange}
                          className="form-select"
                          style={{
                            fontSize: "11px",
                            height: "24px",
                            padding: "0 4px",
                          }}
                          disabled={couponCode.trim().toUpperCase() === "2442"}
                        >
                          <option value="1">1 Year</option>
                          <option value="2">2 Years</option>
                          <option value="3">3 Years</option>
                          {/* {isStaticCouponApplied &&
                            <option value="4">1 Month</option>
                          } */}
                          <option value="4">1 Month</option>
                          <option value="5">3 Month</option>
                          <option value="6">6 Month</option>
                        </select>
                      </td>
                    </tr>

                    {/* Coupon code input */}
                    <tr>
                      <td style={{ padding: "4px 4px" }}>Coupon Code</td>
                      <td style={{ padding: "4px 4px" }}>
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) =>
                            setCouponCode(e.target.value.toUpperCase())
                          }
                          placeholder="Enter coupon"
                          maxLength={15}
                          style={{
                            fontSize: "11px",
                            height: "22px",
                            width: "100%",
                            padding: "2px 4px",
                          }}
                        />
                        {couponError && (
                          <div
                            style={{
                              color: "red",
                              fontSize: "10px",
                              marginTop: "2px",
                            }}
                          >
                            {couponError}
                          </div>
                        )}
                      </td>
                    </tr>

                    {/* Discount from API */}
                    <tr>
                      <td style={{ padding: "4px 4px" }}>Discount</td>
                      <td style={{ padding: "4px 4px" }}>
                        ₹{discountAmount.toFixed(2)}
                      </td>
                    </tr>

                    {/* GST from API */}
                    <tr>
                      <td style={{ padding: "4px 4px" }}>Taxable Amount</td>
                      <td style={{ padding: "4px 4px" }}>
                        ₹{(showBaseAmount - discountAmount).toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "4px 4px" }}>GST (18%)</td>
                      <td style={{ padding: "4px 4px" }}>
                        ₹{gstAmount.toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "4px 4px" }}>Round Off Amount</td>
                      <td style={{ padding: "4px 4px" }}>₹{RoundOffAmount}</td>
                    </tr>

                    {/* Net Amount from API */}
                    <tr>
                      <td
                        style={{
                          padding: "4px 4px",
                          fontWeight: "bold",
                          borderTop: "1px solid #ddd",
                        }}
                      >
                        Net Amount
                      </td>
                      <td
                        style={{
                          padding: "4px 4px",
                          fontWeight: "bold",
                          borderTop: "1px solid #ddd",
                          color: "#f58634",
                        }}
                      >
                        ₹{Math.round(finalAmount)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pay button */}
            <div className="text-center mt-3 d-flex justify-content-center gap-3 flex-wrap">
              <button
                className="btn fw-bold"
                onClick={activatePlanWithoutPayment}
                disabled={isActivating || isApplying || isPaying}
                style={{
                  backgroundColor: "#28a745",
                  color: "#fff",
                  border: "none",
                  borderRadius: "20px",
                  padding: "8px 20px",
                  fontSize: "14px",
                  minWidth: "160px",     // Chhota kiya
                  maxWidth: "180px",
                }}
              >
                {isActivating ? (
                  <>
                    Activating Plan...{" "}
                    <i className="fas fa-spinner fa-spin ms-2"></i>
                  </>
                ) : (
                  "Pay Manual"
                )}
              </button>

              <button
                className="btn fw-bold"
                onClick={proceedToPayment}
                disabled={isApplying || isPaying}
                style={{
                  backgroundColor: "#f58634",
                  color: "#fff",
                  border: "none",
                  borderRadius: "20px",
                  padding: "8px 20px",
                  fontSize: "14px",
                  minWidth: "160px",     // Chhota kiya
                  maxWidth: "180px",
                }}
              >
                {isPaying ? (
                  <>
                    Processing Payment...{" "}
                    <i className="fas fa-spinner fa-spin ms-2"></i>
                  </>
                ) : isApplying ? (
                  "Validating Coupon..."
                ) : (
                  `Pay Online ₹${Math.round(finalAmount)}`
                )}
              </button>
            </div>

            {/* Cancel */}
            <div className="text-center mt-2">
              <button
                className="btn btn-link text-danger"
                onClick={onHide}
                disabled={isApplying}
                style={{ fontSize: "11px", padding: "2px 4px" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>

  );
};

export default CouponModal;
