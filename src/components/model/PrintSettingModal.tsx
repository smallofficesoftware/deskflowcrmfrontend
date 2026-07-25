import React, { useEffect, useState } from "react";
import { Card, Col, Row } from "react-bootstrap";
import { toast } from "react-toastify";
import { newRightsForPrint, useEscapeKey } from "../../common/SharedFunction";
import { DEFAULT_MESSAGE_ERROR_PERMISSION, DEFAULT_STATUS_CODE_SUCCESS } from "../../helpers/AppConstants";
import { PAGE_ID, PRINT_SETTING_TYPE_OBJ } from "../../helpers/AppEnum";
import { TReactSetState } from "../../helpers/AppType";
import {
    IUserList,
} from "../../pages/left-side/LeftSideController";
import { axiosInstance } from "../../services/axiosInstance";

interface PrintSettings {
    type: number;
    print_version: number;
    a_application_login_id: string | number | null | undefined;
    headerImage: boolean;
    headerDetails: boolean;
    toBuyer: boolean;
    billingAddress: boolean;
    shippingAddress: boolean;
    gstinNo: boolean;
    orderNo: boolean;
    orderDateTime: boolean;
    contactPerson: boolean;
    debitCredit: boolean;
    orignalDuplicate: boolean;
    hsnColumn: boolean;
    hsnSummery: boolean;
    rate: boolean;
    discountColumn: boolean;
    gstColumn: boolean;
    note: boolean;
    bankDetails: boolean;
    pageURL: boolean;
    pageText: boolean;
    product_custom_feilds: boolean;
    cart_custom_feilds: boolean;
    termsCondition: boolean;
    signSignatory: boolean;
    footerImage: boolean;
    supplyTo: boolean;
    closingBalance: boolean;
    productImage: boolean;
    productBottomBorder: boolean;
    headerDetailsWithLogo: boolean;
    headerLogoOnRightSide: boolean;
    paymentQR: boolean;
    productImageinColumn: boolean;
    productCode: boolean;
    unitName: boolean;
    orderTimeOnly: boolean;
    displayMainPage: boolean;
    contactDetails: boolean;
    employeeDetails: boolean;
    ContactMobileNumber: boolean;
    ProductSection: boolean;
    ShippingLabelCustomForm: boolean;
    showLinesBetweenProducts: boolean;
    qtycolumn: boolean;
}

interface IOrderCreateModal {
    show?: boolean;
    setShow: TReactSetState<boolean>;
    onHide?: () => void;
    handleSubmit?: () => void;
    orderType?: number;
    viewFormate?: number;
    titles?: string;
    message?: string;
    btn1?: string;
    btn2?: string;
    Contact?: IUserList;
    orderById?: PrintSettings; // Type remains unchanged
    reportName?: string;
    getID?: number | string;
}

const PrintSettingModal: React.FC<IOrderCreateModal> = ({
    show,
    setShow,
    onHide,
    handleSubmit,
    orderType,
    viewFormate,
    titles,
    message,
    btn1,
    btn2,
    Contact,
    orderById,
    reportName,
    getID
}) => {
    const [isCloseConfirmation, setIsCloseConfirmation] = useState(false);
    const login_id = localStorage.getItem("UUID");
    const orderTypeDefined =
        PRINT_SETTING_TYPE_OBJ[String(orderType) as keyof typeof PRINT_SETTING_TYPE_OBJ];
    // alert(orderTypeDefined + " " + orderType)
    const [printSettings, setPrintSettings] = useState<PrintSettings>({
        type: Number(orderTypeDefined) || 0,
        print_version: viewFormate || 1,
        a_application_login_id: login_id,
        headerImage: true,
        headerDetails: true,
        toBuyer: true,
        billingAddress: true,
        shippingAddress: true,
        gstinNo: true,
        orderNo: true,
        orderDateTime: true,
        orderTimeOnly: true,
        contactPerson: true,
        debitCredit: true,
        orignalDuplicate: true,
        hsnColumn: true,
        hsnSummery: true,
        rate: true,
        discountColumn: true,
        gstColumn: true,
        note: true,
        bankDetails: true,
        pageURL: true,
        pageText: true,
        cart_custom_feilds: true,
        product_custom_feilds: true,
        termsCondition: true,
        signSignatory: true,
        footerImage: true,
        supplyTo: true,
        closingBalance: true,
        productImage: true,
        productBottomBorder: true,
        headerDetailsWithLogo: true,
        headerLogoOnRightSide: true,
        paymentQR: true,
        productImageinColumn: true,
        productCode: true,
        unitName: true,
        displayMainPage: true,
        contactDetails: true,
        employeeDetails: true,
        ContactMobileNumber: true,
        ProductSection: true,
        ShippingLabelCustomForm: true,
        showLinesBetweenProducts: true,
        qtycolumn: true,
    });
    console.log("orderTypeorderTypeorderTypeorderType", orderTypeDefined);

    // const canUpdatePrintSetting = useCheckUserPermission(
    //     PAGE_ID.PRINT_SETTINGS_RIGHTS,
    //     PERMISSION_TYPE.EDIT
    // );
    // const canAddPrintSetting = useCheckUserPermission(
    //     PAGE_ID.PRINT_SETTINGS_RIGHTS,
    //     PERMISSION_TYPE.ADD
    // );

    const [canUpdatePrintSetting, setcanUpdatePrintSetting] =
        useState<boolean>(false);
    const [canAddPrintSetting, setcanAddPrintSetting] =
        useState<boolean>(false);

    useEffect(() => {
        loadRights();
    }, []);

    const loadRights = async () => {
        const a_application_login_id = getID || localStorage.getItem("UUID");
        const response = await newRightsForPrint(
            PAGE_ID.PRINT_SETTINGS_RIGHTS,
            a_application_login_id,
        );
        setcanUpdatePrintSetting(response?.edit);

        const response1 = await newRightsForPrint(
            PAGE_ID.PRINT_SETTINGS_RIGHTS,
            a_application_login_id,
        );
        setcanAddPrintSetting(response1?.add);
    }

    useEffect(() => {
        if (orderById) {
            setPrintSettings({
                type: Number(orderTypeDefined) || 0,
                print_version: viewFormate || 1,
                a_application_login_id: login_id || orderById.a_application_login_id || null,
                headerImage: orderById.headerImage ?? false,
                headerDetails: orderById.headerDetails ?? false,
                toBuyer: orderById.toBuyer ?? false,
                billingAddress: orderById.billingAddress ?? false,
                shippingAddress: orderById.shippingAddress ?? false,
                gstinNo: orderById.gstinNo ?? false,
                orderNo: orderById.orderNo ?? false,
                orderDateTime: orderById.orderDateTime ?? false,
                orderTimeOnly: orderById.orderTimeOnly ?? false,
                contactPerson: orderById.contactPerson ?? false,
                debitCredit: orderById.debitCredit ?? false,
                orignalDuplicate: orderById.orignalDuplicate ?? false,
                hsnColumn: orderById.hsnColumn ?? false,
                hsnSummery: orderById.hsnSummery ?? false,
                discountColumn: orderById.discountColumn ?? false,
                rate: orderById.rate ?? false,
                gstColumn: orderById.gstColumn ?? false,
                note: orderById.note ?? false,
                bankDetails: orderById.bankDetails ?? false,
                pageURL: orderById.pageURL ?? false,
                pageText: orderById.pageText ?? false,
                cart_custom_feilds: orderById.cart_custom_feilds ?? false,
                product_custom_feilds: orderById.product_custom_feilds ?? false,
                termsCondition: orderById.termsCondition ?? false,
                signSignatory: orderById.signSignatory ?? false,
                footerImage: orderById.footerImage ?? false,
                supplyTo: orderById.supplyTo ?? false,
                closingBalance: orderById.closingBalance ?? false,
                productImage: orderById.productImage ?? false,
                productBottomBorder: orderById.productBottomBorder ?? false,
                headerDetailsWithLogo: orderById.headerDetailsWithLogo ?? false,
                headerLogoOnRightSide: orderById.headerLogoOnRightSide ?? false,
                paymentQR: orderById.paymentQR ?? false,
                productImageinColumn: orderById.productImageinColumn ?? false,
                productCode: orderById.productCode ?? false,
                unitName: orderById.unitName ?? true,
                displayMainPage: orderById.displayMainPage ?? true,
                contactDetails: orderById.contactDetails ?? true,
                employeeDetails: orderById.employeeDetails ?? true,
                ContactMobileNumber: orderById.ContactMobileNumber ?? true,
                ProductSection: orderById.ProductSection ?? true,
                ShippingLabelCustomForm: orderById.ShippingLabelCustomForm ?? true,
                showLinesBetweenProducts: orderById.showLinesBetweenProducts ?? false,
                qtycolumn: orderById.qtycolumn ?? true,
            });
        }
    }, [orderById, orderTypeDefined, viewFormate, login_id]);

    const onSaveAndDraft = async () => {
        const token = await localStorage.getItem("token");
        const localId = await localStorage.getItem("UUID");

        const { data } = await axiosInstance.post(
            "printSetting",
            {
                printSettings
            }
        );

        if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
            console.error("createContact :", data.ack_msg);
        } else {
            console.error("createContact API error:", data.ack_msg);
            return;
        }
    };

    const handleHide = () => {
        onHide && onHide();
        setIsCloseConfirmation(false);
        setShow(false);

    };

    const handleSwitchChange = (key: keyof PrintSettings) => {
        if (canUpdatePrintSetting) {
            if (Number(orderTypeDefined) == 8 || Number(orderTypeDefined) == 9) {
                const alwaysOffKeys = ['hsnSummery', 'rate', 'discountColumn', 'gstColumn'];
                if (alwaysOffKeys.includes(key)) return;
            }

            const exclusiveKeys = ['headerImage', 'headerDetails', 'headerDetailsWithLogo'];

            setPrintSettings((prev) => {
                const newValue = !prev[key];

                if (exclusiveKeys.includes(key)) {
                    if (newValue === true) {
                        return {
                            ...prev,
                            headerImage: key === 'headerImage',
                            headerDetails: key === 'headerDetails',
                            headerDetailsWithLogo: key === 'headerDetailsWithLogo',
                        };
                    }
                }

                return {
                    ...prev,
                    [key]: newValue,
                };
            });
        } else {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }

    };



    const handleSave = async () => {
        if (canAddPrintSetting) {
            try {
                await onSaveAndDraft();
                setIsCloseConfirmation(false);
                handleSubmit && handleSubmit()
                handleHide();
            } catch (error) {
                console.error("Error saving print settings:", error);
            }
        } else {
            toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        }

    };

    useEscapeKey(handleHide);
    return (
        <div>
            {show && (
                <div className="modal1" style={{ backgroundColor: "transparent" }}>
                    <div
                        className="modal-content1"
                        style={{
                            // marginLeft: "65%",
                            marginRight: "1%",
                            width: "28%",
                            backgroundColor: "rgb(240 242 245)",
                            marginTop: "1%",
                        }}
                    >
                        <div className="row" style={{ height: "20px" }}>
                            <div className="col-10">
                                <h2
                                    className="modal-title1"
                                    style={{
                                        fontSize: "18px",
                                        fontWeight: "bold",
                                        letterSpacing: "0.4px",
                                        marginBottom: "0"
                                    }}
                                >
                                    Print Setting
                                </h2>
                            </div>
                            <div className="col-2">
                                <div className="d-flex align-items-center justify-content-end">
                                    <span
                                        className="close ms-3 pb-3"
                                        onClick={() => handleHide()}
                                    >
                                        ×
                                    </span>
                                </div>
                            </div>
                        </div>
                        <p className="text-center" style={{ color: "#999" }}>
                            <p></p>
                        </p>
                        <div
                            className="row"
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                height: "100%",
                            }}
                        >
                            <Row style={{ padding: "none" }}>
                                <Col>
                                    <Card
                                        className="text-center"
                                        style={{ borderRadius: "0px" }}
                                    >
                                        <Card.Body>
                                            <div className="container-fluid d-flex flex-column" style={{
                                                height: (Number(orderTypeDefined) === 12) ? "15vh" : "60vh",
                                                overflow: "scroll",
                                            }}
                                            >
                                                {Number(orderTypeDefined) === 14 ? (
                                                    <>
                                                        <div
                                                            className="col-12"
                                                            style={{
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                alignItems: "center",
                                                            }}
                                                        >
                                                            <div>
                                                                <p>Product Section</p>
                                                            </div>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={printSettings.ProductSection}
                                                                    onChange={() => handleSwitchChange("ProductSection")}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div
                                                            className="col-12"
                                                            style={{
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                alignItems: "center",
                                                            }}
                                                        >
                                                            <div>
                                                                <p>Show Custom Form Feilds</p>
                                                            </div>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={printSettings.ShippingLabelCustomForm}
                                                                    onChange={() => handleSwitchChange("ShippingLabelCustomForm")}
                                                                />
                                                            </div>
                                                        </div>
                                                    </>
                                                ) : Number(orderTypeDefined) === 12 ? (
                                                    <>
                                                        <div className="col-12 d-flex justify-content-between align-items-center">
                                                            <p>Header Image</p>
                                                            <input
                                                                type="checkbox"
                                                                className="form-check-input"
                                                                checked={printSettings.headerImage}
                                                                onChange={() => handleSwitchChange("headerImage")}
                                                            />
                                                        </div>

                                                        <div className="col-12 d-flex justify-content-between align-items-center">
                                                            <p>Contact Details</p>
                                                            <input
                                                                type="checkbox"
                                                                className="form-check-input"
                                                                checked={printSettings.contactDetails}
                                                                onChange={() => handleSwitchChange("contactDetails")}
                                                            />
                                                        </div>

                                                        <div className="col-12 d-flex justify-content-between align-items-center">
                                                            <p>Footer Image</p>
                                                            <input
                                                                type="checkbox"
                                                                className="form-check-input"
                                                                checked={printSettings.footerImage}
                                                                onChange={() => handleSwitchChange("footerImage")}
                                                            />
                                                        </div>
                                                    </>
                                                ) : Number(orderTypeDefined) === 13 ? (
                                                    <>
                                                        <div className="col-12 d-flex justify-content-between align-items-center">
                                                            <p>Header Image</p>
                                                            <input
                                                                type="checkbox"
                                                                className="form-check-input"
                                                                checked={printSettings.headerImage}
                                                                onChange={() => handleSwitchChange("headerImage")}
                                                            />
                                                        </div>

                                                        <div className="col-12 d-flex justify-content-between align-items-center">
                                                            <p>Employee Details</p>
                                                            <input
                                                                type="checkbox"
                                                                className="form-check-input"
                                                                checked={printSettings.employeeDetails}
                                                                onChange={() => handleSwitchChange("employeeDetails")}
                                                            />
                                                        </div>

                                                        <div className="col-12 d-flex justify-content-between align-items-center">
                                                            <p>Footer Image</p>
                                                            <input
                                                                type="checkbox"
                                                                className="form-check-input"
                                                                checked={printSettings.footerImage}
                                                                onChange={() => handleSwitchChange("footerImage")}
                                                            />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div
                                                            className="col-12"
                                                            style={{
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                alignItems: "center",
                                                            }}
                                                        >
                                                            <div><p>Header Image</p></div>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={printSettings.headerImage}
                                                                    onChange={() => handleSwitchChange('headerImage')}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div
                                                            className="col-12"
                                                            style={{
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                alignItems: "center",
                                                            }}
                                                        >
                                                            <div><p>Header Details</p></div>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={printSettings.headerDetails}
                                                                    onChange={() => handleSwitchChange('headerDetails')}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div
                                                            className="col-12"
                                                            style={{
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                alignItems: "center",
                                                            }}
                                                        >
                                                            <div><p className="text-start">Header Details With Logo</p></div>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={printSettings.headerDetailsWithLogo}
                                                                    onChange={() => handleSwitchChange('headerDetailsWithLogo')}
                                                                />
                                                            </div>
                                                        </div>
                                                        {printSettings.headerDetailsWithLogo == true && <>

                                                            <div
                                                                className="col-12"
                                                                style={{
                                                                    display: "flex",
                                                                    justifyContent: "space-between",
                                                                    alignItems: "center",
                                                                }}
                                                            >
                                                                <div><p className="text-start">Header Logo On Right Side</p></div>
                                                                <div className="form-check form-switch">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="form-check-input"
                                                                        checked={printSettings.headerLogoOnRightSide}
                                                                        onChange={() => handleSwitchChange('headerLogoOnRightSide')}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </>}

                                                        <div
                                                            className="col-12"
                                                            style={{
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                alignItems: "center",
                                                            }}
                                                        >
                                                            <div><p>To / Buyer</p></div>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={printSettings.toBuyer}
                                                                    onChange={() => handleSwitchChange('toBuyer')}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div
                                                            className="col-12"
                                                            style={{
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                alignItems: "center",
                                                            }}
                                                        >
                                                            <div><p>Billing Address</p></div>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={printSettings.billingAddress}
                                                                    onChange={() => handleSwitchChange('billingAddress')}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div
                                                            className="col-12"
                                                            style={{
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                alignItems: "center",
                                                            }}
                                                        >
                                                            <div><p>Shipping Address</p></div>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={printSettings.shippingAddress}
                                                                    onChange={() => handleSwitchChange('shippingAddress')}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div
                                                            className="col-12"
                                                            style={{
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                alignItems: "center",
                                                            }}
                                                        >
                                                            <div><p>GSTIN No.</p></div>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={printSettings.gstinNo}
                                                                    onChange={() => handleSwitchChange('gstinNo')}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div
                                                            className="col-12"
                                                            style={{
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                alignItems: "center",
                                                            }}
                                                        >
                                                            <div><p>Contact Mobile Number</p></div>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={printSettings.ContactMobileNumber}
                                                                    onChange={() => handleSwitchChange('ContactMobileNumber')}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div
                                                            className="col-12"
                                                            style={{
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                alignItems: "center",
                                                            }}
                                                        >
                                                            <div><p>Supply To</p></div>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={printSettings.supplyTo}
                                                                    onChange={() => handleSwitchChange('supplyTo')}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div
                                                            className="col-12"
                                                            style={{
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                alignItems: "center",
                                                            }}
                                                        >
                                                            <div><p>No.</p></div>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={printSettings.orderNo}
                                                                    onChange={() => handleSwitchChange('orderNo')}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div
                                                            className="col-12"
                                                            style={{
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                alignItems: "center",
                                                            }}
                                                        >
                                                            <div><p>Date</p></div>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={printSettings.orderDateTime}
                                                                    onChange={() => handleSwitchChange('orderDateTime')}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div
                                                            className="col-12"
                                                            style={{
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                alignItems: "center",
                                                            }}
                                                        >
                                                            <div><p>Time</p></div>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={printSettings.orderTimeOnly}
                                                                    onChange={() => handleSwitchChange('orderTimeOnly')}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div
                                                            className="col-12"
                                                            style={{
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                alignItems: "center",
                                                            }}
                                                        >
                                                            <div><p>Contact Person</p></div>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={printSettings.contactPerson}
                                                                    onChange={() => handleSwitchChange('contactPerson')}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div
                                                            className="col-12"
                                                            style={{
                                                                display: "flex",
                                                                justifyContent: "space-between",

                                                            }}
                                                        >
                                                            <div><p className="text-start">Debit / Credit Memo Header Title</p></div>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={printSettings.debitCredit}
                                                                    onChange={() => handleSwitchChange('debitCredit')}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div
                                                            className="col-12"
                                                            style={{
                                                                display: "flex",
                                                                justifyContent: "space-between",

                                                            }}
                                                        >
                                                            <div><p className="text-start">Orignal / Duplicate Header Title</p></div>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={printSettings.orignalDuplicate}
                                                                    onChange={() => handleSwitchChange('orignalDuplicate')}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div
                                                            className="col-12"
                                                            style={{
                                                                display: "flex",
                                                                justifyContent: "space-between",

                                                            }}
                                                        >
                                                            <div><p className="text-start">Product Image</p></div>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={printSettings.productImage}
                                                                    onChange={() => handleSwitchChange('productImage')}
                                                                />
                                                            </div>
                                                        </div>
                                                        {printSettings.productImage == true && <>
                                                            <div
                                                                className="col-12"
                                                                style={{
                                                                    display: "flex",
                                                                    justifyContent: "space-between",

                                                                }}
                                                            >
                                                                <div><p className="text-start">Display Image in New Column</p></div>
                                                                <div className="form-check form-switch">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="form-check-input"
                                                                        checked={printSettings.productImageinColumn}
                                                                        onChange={() => handleSwitchChange('productImageinColumn')}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </>}

                                                        <div
                                                            className="col-12"
                                                            style={{
                                                                display: "flex",
                                                                justifyContent: "space-between",

                                                            }}
                                                        >
                                                            <div><p className="text-start">Product Code</p></div>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={printSettings.productCode}
                                                                    onChange={() => handleSwitchChange('productCode')}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div
                                                            className="col-12"
                                                            style={{
                                                                display: "flex",
                                                                justifyContent: "space-between",

                                                            }}
                                                        >
                                                            <div><p className="text-start">unit Name</p></div>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={printSettings.unitName}
                                                                    onChange={() => handleSwitchChange('unitName')}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div
                                                            className="col-12"
                                                            style={{
                                                                display: "flex",
                                                                justifyContent: "space-between",

                                                            }}
                                                        >
                                                            <div><p className="text-start">Display Main Page</p></div>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={printSettings.displayMainPage}
                                                                    onChange={() => handleSwitchChange('displayMainPage')}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div
                                                            className="col-12"
                                                            style={{
                                                                display: "flex",
                                                                justifyContent: "space-between",

                                                            }}
                                                        >
                                                            <div><p className="text-start">Hide Bottom Lines</p></div>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={printSettings.productBottomBorder}
                                                                    onChange={() => handleSwitchChange('productBottomBorder')}
                                                                />
                                                            </div>
                                                        </div>
                                                        {printSettings.productBottomBorder == true && <>
                                                            <div className="col-12"
                                                                style={{
                                                                    display: "flex",
                                                                    justifyContent: "space-between",

                                                                }}>
                                                                <div><p className="text-start">Show Line Between Products</p></div>
                                                                <div className="form-check form-switch">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="form-check-input"
                                                                        checked={printSettings.showLinesBetweenProducts}
                                                                        onChange={() => handleSwitchChange('showLinesBetweenProducts')}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </>}
                                                        <div
                                                            className="col-12"
                                                            style={{
                                                                display: "flex",
                                                                justifyContent: "space-between",

                                                            }}
                                                        >
                                                            <div><p className="text-start">HSN/SAC Code</p></div>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={printSettings.hsnColumn}
                                                                    onChange={() => handleSwitchChange('hsnColumn')}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div
                                                            className="col-12"
                                                            style={{
                                                                display: "flex",
                                                                justifyContent: "space-between",

                                                            }}
                                                        >
                                                            <div><p className="text-start">Show Qty</p></div>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={printSettings.qtycolumn}
                                                                    onChange={() => handleSwitchChange('qtycolumn')}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div
                                                            className="col-12"
                                                            style={{
                                                                display: "flex",
                                                                justifyContent: "space-between",

                                                            }}
                                                        >
                                                            <div><p className="text-start">HSN Summery</p></div>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={printSettings.hsnSummery}
                                                                    onChange={() => handleSwitchChange('hsnSummery')}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div
                                                            className="col-12"
                                                            style={{
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                alignItems: "center",
                                                            }}
                                                        >
                                                            <div><p>Rate</p></div>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={printSettings.rate}
                                                                    onChange={() => handleSwitchChange('rate')}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div
                                                            className="col-12"
                                                            style={{
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                alignItems: "center",
                                                            }}
                                                        >
                                                            <div><p>Discount(%)</p></div>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={printSettings.discountColumn}
                                                                    onChange={() => handleSwitchChange('discountColumn')}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div
                                                            className="col-12"
                                                            style={{
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                alignItems: "center",
                                                            }}
                                                        >
                                                            <div><p>Note</p></div>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={printSettings.note}
                                                                    onChange={() => handleSwitchChange('note')}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div
                                                            className="col-12"
                                                            style={{
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                alignItems: "center",
                                                            }}
                                                        >
                                                            <div><p>GST(%)</p></div>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={printSettings.gstColumn}
                                                                    onChange={() => handleSwitchChange('gstColumn')}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div
                                                            className="col-12"
                                                            style={{
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                alignItems: "center",
                                                            }}
                                                        >
                                                            <div><p>Bank Details</p></div>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={printSettings.bankDetails}
                                                                    onChange={() => handleSwitchChange('bankDetails')}
                                                                />
                                                            </div>
                                                        </div>

                                                        {(Number(orderTypeDefined) == 2 || Number(orderTypeDefined) == 3 || Number(orderTypeDefined) == 1) &&
                                                            <>
                                                                <div
                                                                    className="col-12"
                                                                    style={{
                                                                        display: "flex",
                                                                        justifyContent: "space-between",
                                                                        alignItems: "center",
                                                                    }}
                                                                >
                                                                    <div><p>Paymnent QRcode</p></div>
                                                                    <div className="form-check form-switch">
                                                                        <input
                                                                            type="checkbox"
                                                                            className="form-check-input"
                                                                            checked={printSettings.paymentQR}
                                                                            onChange={() => handleSwitchChange('paymentQR')}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </>}

                                                        {(Number(orderTypeDefined) == 3 || Number(orderTypeDefined) == 4) &&
                                                            <>

                                                                <div
                                                                    className="col-12"
                                                                    style={{
                                                                        display: "flex",
                                                                        justifyContent: "space-between",
                                                                        alignItems: "center",
                                                                    }}
                                                                >
                                                                    <div><p>Closing Balance</p></div>
                                                                    <div className="form-check form-switch">
                                                                        <input
                                                                            type="checkbox"
                                                                            className="form-check-input"
                                                                            checked={printSettings.closingBalance}
                                                                            onChange={() => handleSwitchChange('closingBalance')}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </>
                                                        }
                                                        <div
                                                            className="col-12"
                                                            style={{
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                alignItems: "center",
                                                            }}
                                                        >
                                                            <div><p>Terms & Condition</p></div>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={printSettings.termsCondition}
                                                                    onChange={() => handleSwitchChange('termsCondition')}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div
                                                            className="col-12"
                                                            style={{
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                alignItems: "center",
                                                            }}
                                                        >
                                                            <div><p>Sign & Signatory</p></div>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={printSettings.signSignatory}
                                                                    onChange={() => handleSwitchChange('signSignatory')}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div
                                                            className="col-12"
                                                            style={{
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                alignItems: "center",
                                                            }}
                                                        >
                                                            <div><p>Page URL</p></div>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={printSettings.pageURL}
                                                                    onChange={() => handleSwitchChange('pageURL')}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div
                                                            className="col-12"
                                                            style={{
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                alignItems: "center",
                                                            }}
                                                        >
                                                            <div><p>Page Text</p></div>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={printSettings.pageText}
                                                                    onChange={() => handleSwitchChange('pageText')}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div
                                                            className="col-12"
                                                            style={{
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                alignItems: "start",
                                                            }}
                                                        >
                                                            <div><p className="text-start">Cart Custom Form Feilds</p></div>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={printSettings.cart_custom_feilds}
                                                                    onChange={() => handleSwitchChange('cart_custom_feilds')}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div
                                                            className="col-12"
                                                            style={{
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                alignItems: "start",
                                                            }}
                                                        >
                                                            <div><p className="text-start">Product Custom Form Feilds</p></div>
                                                            <div className="form-check form-switch">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={printSettings.product_custom_feilds}
                                                                    onChange={() => handleSwitchChange('product_custom_feilds')}
                                                                />
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                                <hr />
                                            </div>
                                            <div
                                                className="modal-buttons text-end"
                                                style={{ margin: "0px" }}
                                            >
                                                <button
                                                    className="modal-button2"
                                                    style={{ color: "white" }}
                                                    onClick={handleSave}
                                                >
                                                    save
                                                </button>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
};

export default PrintSettingModal;
