import { Button } from "primereact/button";
import { useState } from "react";
import { IProductView } from "../ProductController";
import BomDetailsView from "./bom-details/BomDetailsView";
import BomProcessView from "./bom-process/BomProcessView";
import CostingView from "./costing/CostingView";


interface IPropsBOM {
    show: boolean;
    onHide: () => void;
    handelRefreshProduct: () => void;
    product: IProductView;
}

const BomMasterView = ({
    show,
    onHide,
    handelRefreshProduct,
    product
}: IPropsBOM) => {

    const [activeTab, setActiveTab] = useState<string>("BOM Details");
    const [isBomAvailable, setIsBomAvailable] = useState(false);
    const [bomId, setBomId] = useState(0);

    const getButtonStyle = (tabName: string): React.CSSProperties => ({
        backgroundColor: activeTab === tabName ? "#f58634" : "transparent",
        color: activeTab === tabName ? "#ffffff" : "#000000",
        border: activeTab === tabName ? "none" : "1px solid #ccc",
        boxShadow: "none",
    });


    const handleBomId = (data: any) => {
        setBomId(data);
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case "BOM Details":
                return <BomDetailsView show={show} onHide={onHide} product={product} setIsBomAvailable={setIsBomAvailable} handleBomId={handleBomId} />;

            case "BOM Process":
                return <BomProcessView show={show} onHide={onHide} product={product} bomId={bomId} />;

            case "Costing":
                return <CostingView show={show} onHide={onHide} bomId={bomId} product={product} />;

            default:
                return null;
        }
    };

    const openBomPdfView = () => {
        const getUUID = localStorage.getItem("UUID");
        const baseURL = window.location.origin;
        const supportURL = `${baseURL}/BomPdfView/${product.id}/${bomId}`;
        const myWindow = window.open(supportURL, "_blank");
    };


    return (
        <>
            {show && (
                <div className="modal1">
                    <div className="modal-content1" style={{ width: "90%", height: "85vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                        <div
                            style={{
                                position: "sticky",
                                top: 0,
                                zIndex: 1000,
                            }}
                        >
                            <div className="d-flex align-items-center justify-content-between">
                                <div className="col-8">
                                    <h2 className="modal-title1 form_header_text">Bill Of Materials</h2>
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
                            <div className="d-flex align-items-center justify-content-between mb-3">
                                <nav
                                    className="nav nav-pills flex-column flex-sm-row flex-wrap gap-2"
                                    style={{ width: "100%" }}
                                >
                                    <button
                                        className="flex-sm-fill text-sm-center nav-link"
                                        type="button"
                                        onClick={() => setActiveTab("BOM Details")}
                                        style={getButtonStyle("BOM Details")}
                                    >
                                        <span className="m-1">BOM Details</span>
                                    </button>

                                    {/* <button
                                        className="flex-sm-fill text-sm-center nav-link"
                                        type="button"
                                        onClick={() => setActiveTab("BOM Items")}
                                        style={getButtonStyle("BOM Items")}
                                    >
                                        <span className="m-1">BOM Items</span>
                                    </button> */}

                                    <button
                                        className="flex-sm-fill text-sm-center nav-link"
                                        type="button"
                                        onClick={() => setActiveTab("BOM Process")}
                                        style={{
                                            ...getButtonStyle("BOM Process"),
                                            opacity: isBomAvailable ? 1 : 0.5,
                                            cursor: isBomAvailable ? "pointer" : "not-allowed"
                                        }}
                                        disabled={!isBomAvailable}
                                    >
                                        <span className="m-1">BOM Process</span>
                                    </button>

                                    <button
                                        className="flex-sm-fill text-sm-center nav-link"
                                        type="button"
                                        onClick={() => setActiveTab("Costing")}
                                        style={{
                                            ...getButtonStyle("Costing"),
                                            opacity: isBomAvailable ? 1 : 0.5,
                                            cursor: isBomAvailable ? "pointer" : "not-allowed"
                                        }}
                                        disabled={!isBomAvailable}
                                    >
                                        <span className="m-1">Costing</span>
                                    </button>
                                    <Button
                                        icon="pi pi-file-pdf"
                                        className="report_button"
                                        style={{ backgroundColor: "green" }}
                                        severity="danger"
                                        // rounded
                                        onClick={() => {
                                            openBomPdfView();
                                        }
                                        }
                                    // tooltip="Export PDF"
                                    // disabled={customers.length === 0}
                                    />
                                </nav>
                            </div>
                            <hr style={{ border: "none", borderTop: "4px solid grey" }} />
                        </div>
                        <div className="mt-3" style={{
                            flex: 1,
                            overflowY: "auto",
                            padding: "10px",
                            paddingBottom: 0
                        }}>
                            {renderTabContent()}
                        </div>

                    </div>
                </div >
            )}
        </>
    );
};

export default BomMasterView;