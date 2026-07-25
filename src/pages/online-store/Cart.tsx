import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import productImagePlaceholder from "../../assets/images/no_image.jpeg";
import { BACKEND_OF_SMALL_OFFICE_CRM_END_POINT, DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED, PACKING_FORWARDING_CHARGE_GST, TRANSPORT_CHARGE__GST } from '../../helpers/AppConstants';
import { axiosInstance } from '../../services/axiosInstance';
import { CartItem, useOnlineStore } from '../../store/onlineStore/useOnlineStore';

interface CartProps {
    qrCode: string;
}

const Cart = ({ qrCode }: CartProps) => {
    const {
        cart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        categories,
        currencyData,
        companyData,
        customerData,
        checkoutSuccess,
        setCheckoutSuccess
    } = useOnlineStore();

    const [showFullTerms, setShowFullTerms] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Additional state for calculations
    const [packingForwardingCharge, setPackingForwardingCharge] = useState<number>(0);
    const [transportCharge, setTransportCharge] = useState<number>(0);
    const [discount, setDiscount] = useState<number>(0);
    const [isTcsActive, setIsTcsActive] = useState(false);
    const [isGstActive, setIsGstActive] = useState(true);
    const [tcsRate, setTcsRate] = useState<number>(0);

    const truncateText = (text: string, limit: number) => {
        if (!text) return "";
        if (text.length <= limit) return text;
        return text.substring(0, limit) + "...";
    };

    // Helper: effective rate & net_rate
    const getEffectiveRate = (item: CartItem) =>
        Number(item.price_list?.rate ?? item.rate);

    const getEffectiveNetRate = (item: CartItem) =>
        Number(item.price_list?.net_rate ?? item.net_rate);

    // GST override: if company has no GST number, all GST = 0
    const cartWithGST: CartItem[] = cart.map((item) => ({
        ...item,
        GST: companyData?.gst_number ? item.GST : 0,
    }));

    // Calculate totals similar to OrderCreateModal
    const totalQuantity = cart.reduce((total, item) => total + item.quantity, 0);

    // Check if GST should be applied based on order_view_formate
    const shouldApplyGst = companyData?.order_view_formate != 2 && companyData?.order_view_formate != 4;

    // Calculations with GST factor
    const calculations = cartWithGST.reduce(
        (acc, item) => {
            const rate = getEffectiveRate(item);
            const gstPercent = item.GST;

            const discountPercent = Number(item.price_list?.discount || 0);

            // Step 1: Rate se discount minus karo
            const rateAfterDiscount = rate - (rate * discountPercent / 100);

            // Step 2: Agar GST applicable hai, toh add karo
            let netRate = rateAfterDiscount;
            let gstAmountPerUnit = 0;

            if (shouldApplyGst && companyData?.gst_number) {
                gstAmountPerUnit = rateAfterDiscount * (gstPercent / 100);
                netRate = rateAfterDiscount + gstAmountPerUnit;
            }

            const itemTotal = netRate * item.quantity;

            acc.totalAmount += rateAfterDiscount * item.quantity; // taxable amount (before GST)
            acc.totalGST += gstAmountPerUnit * item.quantity;
            acc.grandTotal += itemTotal;

            return acc;
        },
        { totalAmount: 0, totalGST: 0, grandTotal: 0 }
    );

    // Discount amount
    const showDiscount = (calculations.totalAmount * discount) / 100;

    // Packing and transport GST (only if GST should be applied)
    const packingForwardingChargeGst = shouldApplyGst
        ? packingForwardingCharge * (PACKING_FORWARDING_CHARGE_GST / 100)
        : 0;
    const transportChargeGst = shouldApplyGst
        ? transportCharge * (TRANSPORT_CHARGE__GST / 100)
        : 0;

    // Taxable amount (after discount + charges)
    const taxableAmount = calculations.totalAmount - showDiscount + packingForwardingCharge + transportCharge;

    // GST amount (conditionally applied)
    const gstAmount = (isGstActive && shouldApplyGst)
        ? calculations.totalGST + packingForwardingChargeGst + transportChargeGst
        : 0;

    // TCS amount
    const tcsAmount = isTcsActive
        ? (taxableAmount + gstAmount) * (tcsRate / 100)
        : 0;

    // Grand total before rounding
    const grandTotalBeforeRound = taxableAmount + gstAmount + tcsAmount;

    // Round off
    const grandTotalRounded = Math.round(grandTotalBeforeRound);
    const roundOff = grandTotalRounded - grandTotalBeforeRound;

    // Final calculations object
    const finalCalculations = {
        totalAmount: taxableAmount,
        totalGST: gstAmount,
        grandTotal: grandTotalRounded,
        roundOff: roundOff,
        tcsAmount: tcsAmount,
        discount: showDiscount
    };

    const handleCheckout = async () => {
        try {
            setIsSubmitting(true);

            const payload = {
                cart: {
                    type: 2,
                    cart_remark: "Customer requested express shipping",
                    cart_notes: "",
                    cart_terms_and_condition: "",
                    cart_date: new Date().toISOString().split("T")[0],
                    grand_total: grandTotalRounded,
                    taxable_amt: finalCalculations.totalAmount,
                    gst_amt: finalCalculations.totalGST,
                    tcs_amt: finalCalculations.tcsAmount,
                    total_amt: grandTotalRounded,
                    total_qty: cart.length,
                    discount_pct: discount,
                    discount_pr: finalCalculations.discount,
                    packing_forwarding_charge: packingForwardingCharge,
                    transport_charge: transportCharge,
                    round_off: finalCalculations.roundOff,
                    shipping_address: companyData?.shipping_address ?? "",
                    Address: companyData?.address ?? "",
                    to_customer_email: customerData?.email_id,
                    to_customer_phone: customerData?.mobile_number,
                    to_customer_name: customerData?.person_name,
                    to_customer_company_name: customerData?.company_name
                },
                items: cart.map((item) => ({
                    item_product_id: item.id,
                    item_product_code: item.product_code,
                    item_qty: item.quantity,
                    item_discount_pct: item.price_list?.discount || 0,
                    item_category_id: item.category_id,
                    item_category_name: categories.find(c => c.id === item.category_id)?.category_name || "",
                    item_rate: getEffectiveRate(item),
                    item_net_rate: getEffectiveNetRate(item),
                    item_gst: item.GST,
                }))
            };

            const { data } = await axiosInstance.post(
                `/create-order-by-online-store/${qrCode}`,
                payload
            );

            if (data.code === 200 && data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
                clearCart();
                setCheckoutSuccess(true);
                toast.success("Checkout successful!");

                const modal = document.getElementById("btn-close");
                if (modal) {
                    modal.click();
                }
                const modalBackdrop = document.getElementById("modal-backdrop");
                if (modalBackdrop) {
                    modalBackdrop.style.display = "none";
                }
            } else {
                toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
            }
        } catch (error: any) {
            toast.error(error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        if (checkoutSuccess) {
            setTimeout(() => {
                setCheckoutSuccess(false);
            }, 3000);
        }
    }, [checkoutSuccess, setCheckoutSuccess]);

    // Initialize GST active state based on company GST number and order_view_formate
    useEffect(() => {
        const shouldApplyGst = companyData?.order_view_formate != 2 && companyData?.order_view_formate != 4;
        if (companyData?.gst_number && shouldApplyGst) {
            setIsGstActive(true);
        } else {
            setIsGstActive(false);
        }
    }, [companyData]);

    return (
        <div className="modal fade" id="cartModal" tabIndex={-1} aria-hidden="true">
            <div className="modal-dialog modal-xl modal-dialog-scrollable">
                <div className="modal-content">
                    {!checkoutSuccess ? (
                        <>
                            <div className="modal-header bg-light">
                                <h5 className="modal-title fw-bold">
                                    <i className="bi bi-cart3 me-2"></i>
                                    Shopping Cart ({cart.length} items)
                                </h5>
                                <button className="btn-close" data-bs-dismiss="modal" id="btn-close"></button>
                            </div>

                            <div className="modal-body">
                                <style>{`
                                    .table th,
                                    .table td {
                                        vertical-align: middle;
                                    }

                                    .table img {
                                        transition: transform 0.2s ease;
                                    }

                                    .table img:hover {
                                        transform: scale(1.05);
                                    }
                                `}</style>

                                {cart.length === 0 ? (
                                    <div className="text-center py-5">
                                        <i
                                            className="bi bi-cart-x text-muted"
                                            style={{ fontSize: "4rem" }}
                                        ></i>
                                        <h4 className="text-muted mt-3">Your cart is empty</h4>
                                        <p className="text-muted">
                                            Add some products to get started!
                                        </p>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-bordered align-middle text-center">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Sr No.</th>
                                                    <th>Image</th>
                                                    <th>Product Name</th>
                                                    <th>Rate</th>
                                                    {(companyData?.gst_number && shouldApplyGst) && <th>GST</th>}
                                                    <th>Discount</th>
                                                    <th>Net Rate</th>
                                                    <th style={{ width: "160px" }}>Quantity</th>
                                                    <th>Amount</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {cartWithGST.map((item: CartItem, index: number) => {
                                                    // Database se sirf teen values use karenge
                                                    const rate = getEffectiveRate(item); // Original rate
                                                    const gstPercent = item.GST; // GST percentage
                                                    const discountPercent = Number(item.price_list?.discount || 0); // Discount percentage

                                                    // Step 1: Rate se discount minus karo
                                                    const rateAfterDiscount = rate - (rate * discountPercent / 100);

                                                    // Step 2: Agar GST applicable hai, toh add karo, nahi toh nahi
                                                    let netRate = rateAfterDiscount;
                                                    if (shouldApplyGst && companyData?.gst_number) {
                                                        const gstAmount = rateAfterDiscount * (gstPercent / 100);
                                                        netRate = rateAfterDiscount + gstAmount;
                                                    }

                                                    const displayRate = rate.toFixed(2);
                                                    const displayDiscount = discountPercent.toFixed(2);
                                                    const displayNetRate = netRate.toFixed(2);
                                                    const itemTotal = netRate * item.quantity;
                                                    const amount = itemTotal.toFixed(2);

                                                    return (
                                                        <tr key={item.id}>
                                                            <td>{index + 1}</td>
                                                            <td>
                                                                <img
                                                                    src={
                                                                        item.product_img
                                                                            ? `${BACKEND_OF_SMALL_OFFICE_CRM_END_POINT}/productImg/${item.product_img}`
                                                                            : productImagePlaceholder
                                                                    }
                                                                    alt={item.product_name}
                                                                    className="img-fluid rounded"
                                                                    style={{
                                                                        width: "60px",
                                                                        height: "60px",
                                                                        objectFit: "cover",
                                                                        border: "1px solid #ccc"
                                                                    }}
                                                                />
                                                            </td>
                                                            <td className="text-start">
                                                                <strong>{item.product_name}</strong>
                                                                <br />
                                                                <small className="text-muted">
                                                                    {categories.find(c => c.id === item.category_id)?.category_name}
                                                                </small>
                                                            </td>
                                                            <td>
                                                                {currencyData?.symbol || "₹"}
                                                                {displayRate}
                                                            </td>
                                                            {(companyData?.gst_number && shouldApplyGst) && (
                                                                <td>{gstPercent}%</td>
                                                            )}
                                                            <td>
                                                                {displayDiscount}%
                                                            </td>
                                                            <td>
                                                                {currencyData?.symbol || "₹"}
                                                                {displayNetRate}
                                                            </td>
                                                            <td>
                                                                <div className="d-flex justify-content-center align-items-center">
                                                                    <button
                                                                        className="btn btn-sm btn-outline-secondary"
                                                                        disabled={item.quantity <= 0.5}
                                                                        onClick={() =>
                                                                            updateCartQuantity(
                                                                                item.id,
                                                                                parseFloat((item.quantity - 0.5).toFixed(2))
                                                                            )
                                                                        }
                                                                    >
                                                                        -
                                                                    </button>

                                                                    <input
                                                                        type="number"
                                                                        min="1"
                                                                        step="1"
                                                                        value={item.quantity}
                                                                        onChange={(e) => {
                                                                            const value = parseFloat(e.target.value);
                                                                            updateCartQuantity(
                                                                                item.id,
                                                                                isNaN(value) ? 1 : value
                                                                            );
                                                                        }}
                                                                        className="form-control form-control-sm text-center mx-2"
                                                                        style={{ width: "60px" }}
                                                                    />

                                                                    <button
                                                                        className="btn btn-sm btn-outline-secondary"
                                                                        onClick={() =>
                                                                            updateCartQuantity(
                                                                                item.id,
                                                                                parseFloat((item.quantity + 1).toFixed(2))
                                                                            )
                                                                        }
                                                                    >
                                                                        +
                                                                    </button>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <strong>
                                                                    {currencyData?.symbol || "₹"}
                                                                    {amount}
                                                                </strong>
                                                            </td>
                                                            <td>
                                                                <button
                                                                    className="btn btn-sm btn-outline-danger"
                                                                    onClick={() => removeFromCart(item.id)}
                                                                >
                                                                    <i className="bi bi-trash"></i>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>

                                            <tfoot style={{ backgroundColor: "rgb(240, 242, 245)" }}>
                                                {cart.length > 0 && (
                                                    <>
                                                        <tr>
                                                            <td colSpan={8} className="text-end">Taxable Amount</td>
                                                            <td><strong>{currencyData?.symbol || "₹"}{taxableAmount.toFixed(2)}</strong></td>
                                                            <td></td>
                                                        </tr>
                                                        {(isGstActive && shouldApplyGst) && (
                                                            <tr>
                                                                <td colSpan={8} className="text-end">GST</td>
                                                                <td>{currencyData?.symbol || "₹"}{gstAmount.toFixed(2)}</td>
                                                                <td></td>
                                                            </tr>
                                                        )}
                                                        {isTcsActive && (
                                                            <tr>
                                                                <td colSpan={8} className="text-end">TCS ({tcsRate}%)</td>
                                                                <td>{currencyData?.symbol || "₹"}{tcsAmount.toFixed(2)}</td>
                                                                <td></td>
                                                            </tr>
                                                        )}
                                                        <tr>
                                                            <td colSpan={8} className="text-end">Round Off</td>
                                                            <td>{currencyData?.symbol || "₹"}{roundOff.toFixed(2)}</td>
                                                            <td></td>
                                                        </tr>
                                                        <tr>
                                                            <td colSpan={8} className="text-end"><strong>Grand Total</strong></td>
                                                            <td><strong className="text-primary">{currencyData?.symbol || "₹"}{grandTotalRounded}</strong></td>
                                                            <td></td>
                                                        </tr>
                                                    </>
                                                )}
                                            </tfoot>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {cart.length > 0 && (
                                <div className="modal-footer bg-light">
                                    <div className="container-fluid">
                                        <div className="row align-items-center">
                                            <div className="col-12 col-md-6 mb-2 mb-md-0">
                                                {companyData?.order_terms_conditions && (
                                                    <>
                                                        <span>Terms & Conditions:</span>
                                                        <p className="text-muted">
                                                            {truncateText(companyData.order_terms_conditions, 150)}
                                                            {companyData.order_terms_conditions.length > 150 && (
                                                                <span
                                                                    className="text-primary ms-2"
                                                                    style={{
                                                                        cursor: "pointer",
                                                                        textDecoration: "underline"
                                                                    }}
                                                                    onClick={() => setShowFullTerms(true)}
                                                                >
                                                                    Read more
                                                                </span>
                                                            )}
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                            <div className="col-12 col-md-6 text-end">
                                                <h5 className="mt-2">
                                                    Grand Total:{" "}
                                                    <span className="text-primary">
                                                        {currencyData?.symbol || "₹"}
                                                        {grandTotalRounded}
                                                    </span>
                                                </h5>
                                                <div className="d-flex justify-content-end gap-2">
                                                    <button
                                                        className="btn btn-outline-danger mt-2"
                                                        disabled={cart.length === 0 || isSubmitting}
                                                        onClick={clearCart}
                                                    >
                                                        Clear Cart
                                                    </button>
                                                    <button
                                                        className="btn btn-success mt-2"
                                                        disabled={cart.length === 0 || isSubmitting}
                                                        onClick={handleCheckout}
                                                    >
                                                        Proceed to Checkout
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="d-flex justify-content-center align-items-center vh-100 bg-light px-2">
                                <style>{`
                                    @keyframes tick-pop {
                                      0% { transform: scale(0); opacity: 0; }
                                      60% { transform: scale(1.25); opacity: 1; }
                                      100% { transform: scale(1); }
                                    }

                                    .success-card {
                                      max-width: 95mm;
                                      width: 100%;
                                      height: auto;
                                      min-height: 150mm;
                                      background: white;
                                      padding: 18px;
                                      border-radius: 16px;
                                      box-shadow: 0px 6px 18px rgba(0,0,0,0.10);
                                      display: flex;
                                      flex-direction: column;
                                    }

                                    .success-logo {
                                      width: 80px;
                                      height: 80px;
                                      border-radius: 50%;
                                      object-fit: cover;
                                      border: 2px solid #eee;
                                    }

                                    .tick-icon {
                                      color: #28a745;
                                      font-size: 3.8rem;
                                      animation: tick-pop 0.9s ease;
                                    }

                                    .company-text {
                                      font-size: 15px;
                                      line-height: 1.3;
                                    }

                                    .success-title {
                                      font-size: 26px;
                                      color: #28a745;
                                      font-weight: 700;
                                    }

                                    .thank-you-container {
                                      flex-grow: 1;
                                      display: flex;
                                      flex-direction: column;
                                      justify-content: center;
                                      align-items: center;
                                      margin-top: 10px;
                                    }
                                `}</style>

                                <div className="success-card">
                                    {/* LOGO */}
                                    {companyData?.company_logo && (
                                        <img
                                            src={`${BACKEND_OF_SMALL_OFFICE_CRM_END_POINT}/companyImg/${companyData.company_logo}`}
                                            alt="Logo"
                                            className="success-logo mx-auto mb-2"
                                        />
                                    )}

                                    {/* COMPANY NAME */}
                                    <h1
                                        className="text-center fw-bold mb-1"
                                        style={{ fontSize: "18px" }}
                                    >
                                        {companyData?.company_name}
                                    </h1>

                                    {/* COMPANY DETAILS */}
                                    <p className="text-center text-muted mb-1 company-text">
                                        {companyData?.company_email}
                                    </p>
                                    <p className="text-center text-muted mb-1 company-text">
                                        {companyData?.company_contact}
                                    </p>
                                    <p className="text-center text-muted mb-2 company-text text-break">
                                        {companyData?.address}
                                    </p>

                                    {/* SUCCESS MESSAGE */}
                                    <div className="thank-you-container">
                                        <i className="bi bi-check-circle-fill tick-icon mb-3" />
                                        <h2 className="success-title">Thank You!</h2>
                                        <p
                                            className="text-muted mt-1 text-center"
                                            style={{ fontSize: "14px" }}
                                        >
                                            Your order has been placed successfully.
                                        </p>
                                        <p
                                            className="text-muted mt-1 text-center"
                                            style={{ fontSize: "14px" }}
                                        >
                                            Our company representative will contact you soon.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Full Terms Popup */}
            <div
                className={`modal fade ${showFullTerms ? "show d-block" : ""}`}
                tabIndex={-1}
            >
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Terms & Conditions</h5>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={() => setShowFullTerms(false)}
                            ></button>
                        </div>

                        <div className="modal-body">
                            <p className="text-muted">
                                {companyData?.order_terms_conditions}
                            </p>
                        </div>

                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowFullTerms(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Backdrop */}
            {showFullTerms && <div className="modal-backdrop fade show"></div>}
        </div>
    );
};

export default Cart;
