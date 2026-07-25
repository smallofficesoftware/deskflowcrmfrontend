

import { toast } from "react-toastify";
import { RAZORPAY_KEY_ID } from "../../../helpers/AppConstants";
import { TReactSetState } from "../../../helpers/AppType";
import { axiosInstance } from "../../../services/axiosInstance";
import {
  createCompanyVsPlan,
  updateCompanyForPlan,
} from "./PricingTableController";


interface RazorpayData {
  data: any;
  currency: string;
  amount: number;
  id: string;
}


interface RazorpayOptions {
  key: string;
  currency: string;
  amount: number;
  name: string;
  description: string;
  image: string;
  order_id: string;
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  prefill: {
    name: string | undefined;
    email: string | undefined;
    contact: string | undefined;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

export default async function displayRazorpay(
  setShowMenu: TReactSetState<boolean>,
  planPrice: string | number,
  companyId: number | undefined,
  planId: number,
  companyName: string | undefined,
  companyEmailId: string | undefined,
  companyContact: string | undefined,
  planMonth: number,
  planTrailDays: number,
  renew_flag: number | string | undefined,
  plan_name: number | string,
  plan_amount: number | string,
  discountAmount: number | string,
  gstAmount: number | string,
  selectedYear: number | string,
  couponCodeId: number | null,
  RoundOffAmount: number,
  setIsPaying?: (value: boolean) => void
) {
  try {
    const numericPrice = Number(planPrice) * 100;

    const { data }: { data: RazorpayData } = await axiosInstance.post<RazorpayData>("razorpay", {
      companyId,
      planId,
      amount: numericPrice,
    });

    const options: RazorpayOptions = {
      key: RAZORPAY_KEY_ID!,
      currency: data.currency,
      amount: numericPrice,
      name: "DeskFlow Systems Private Limited",
      description: "Subscription Payment",
      image: "https://app.smalloffice.in/static/media/smalll_office_logo.c2928bc5691423063005.png",
      order_id: data.data.item.id,
      handler: async function (response) {
        try {
          // Step 1: Verify Payment
          const verifyResponse = await axiosInstance.post("/verify-payment-razorpay", {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
          });

          if (verifyResponse.data.ack !== 1) {
            toast.error(verifyResponse.data.ack_msg || "Payment verification failed");
            setIsPaying?.(false);
            return;
          }

          // Step 2: Update Company Plan
          await updateCompanyForPlan(setShowMenu, companyId, planId, planMonth, planTrailDays);

          // Step 3: Save Payment History
          await createCompanyVsPlan(
            setShowMenu,
            response.razorpay_payment_id,
            response.razorpay_order_id,
            response.razorpay_signature,
            planPrice,
            planId,
            plan_name,
            plan_amount,
            discountAmount,
            gstAmount,
            selectedYear,
            couponCodeId,
            RoundOffAmount
          );

          // Final Success
          toast.success("Payment successful! Your plan has been activated.");
          setShowMenu(true);

        } catch (error: any) {
          console.error("Post-payment processing failed:", error);
          toast.error(error?.response?.data?.ack_msg || "Something went wrong after payment");
        } finally {
          setIsPaying?.(false);
        }
      },
      prefill: {
        name: companyName,
        email: companyEmailId,
        contact: companyContact || "0000000000",
      },
      modal: {
        ondismiss: () => {
          setIsPaying?.(false);
          toast.info("Payment cancelled");
        }
      }
    };

    const Razorpay = (window as any).Razorpay;
    if (Razorpay) {
      const paymentObject = new Razorpay(options);
      paymentObject.open();
    } else {
      toast.error("Payment gateway not loaded. Please try again.");
      setIsPaying?.(false);
    }
  } catch (error) {
    console.error("Error initiating Razorpay:", error);
    toast.error("Failed to initiate payment");
    setIsPaying?.(false);
  }
}
