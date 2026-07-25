import React, { useEffect, useState } from "react";
import ConfirmationModal from "../../../../../../../components/model/ConfirmationModal";
import { IProductView } from "../../ProductController";
import ProcessItemTable from "./BomItemView";
import { getProcess, handleDelete } from "./BomProcessFieldController";

export interface IProcess {
    process_name: string;
    machine_name: string;
    required_time: string;
    process_cost: string;
    manpower_cost: string;
    process_id: number;
    id: number
}

interface IProps {
    product: IProductView;
    recallGetProcessOnCreate: any;
    handleRefreshListView: (data: boolean) => void;
    handleSetEditTimeData: (item: IProcess) => void;
    bomId: number;
}

const BomProcessList = ({
    product,
    recallGetProcessOnCreate,
    handleRefreshListView,
    handleSetEditTimeData,
    bomId
}: IProps) => {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    const [allProcessLists, setAllProcessLists] = useState<IProcess[]>([]);
    const [recallGetProcessOnDelete, setRecallGetProcessOnDelete] = useState<boolean>(false);
    const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
    const [netRateInput1, setNetRateInput1] = useState<number>();
    const [processId, setProcessId] = useState<number>(0);

    useEffect(() => {
        getProcess(product.id, setAllProcessLists)
    }, [])

    useEffect(() => {
        if (recallGetProcessOnDelete || recallGetProcessOnCreate) {
            getProcess(product.id, setAllProcessLists);
            setRecallGetProcessOnDelete(false);
            handleRefreshListView(false);
        }
    }, [recallGetProcessOnDelete, recallGetProcessOnCreate]);

    const handleDeleteById = (id: number) => {
        setNetRateInput1(id);
        setIsDeleteConfirmation(true);
    };

    const handleEdit = (item: IProcess) => {
        handleSetEditTimeData(item);
    }

    return (
        <div className="p-3" style={{ fontSize: "15px" }}>
            <table className="table process-table">
                <thead>
                    <tr>
                        <th>Sr no.</th>
                        <th>Process Name</th>
                        <th>Workstation</th>
                        <th>Required Time</th>
                        <th>Process Cost</th>
                        <th>Manpower Cost</th>
                        <th className="text-center">Action</th>
                    </tr>
                </thead>

                <tbody style={{ backgroundColor: "#eeeeee" }}>
                    {allProcessLists.map((item, index) => {
                        const isExpanded = expandedIndex === index;

                        return (
                            <React.Fragment key={index}>
                                <tr
                                    style={{
                                        background: isExpanded ? "#eeeeee" : "#fcfcfc",
                                        transition: "0.3s",
                                        cursor: "pointer",
                                        boxShadow: "0 7px 12px rgba(0,0,0,0.1)"
                                    }}
                                >
                                    <td>{index+1}</td>
                                    <td>{item.process_name}</td>
                                    <td>{item.machine_name}</td>
                                    <td className="text-center">{item.required_time}</td>
                                    <td className="text-center">{item.process_cost}</td>
                                    <td className="text-center">{item.manpower_cost}</td>

                                    <td className="text-center">
                                        <div style={{ width: "100%" }}>
                                            <button
                                                onClick={() => {
                                                    setProcessId(item.id);
                                                    setExpandedIndex(isExpanded ? null : index)
                                                }}
                                                style={{ marginRight: "10px" }}
                                            >
                                                {isExpanded ? "▲" : "▼"}
                                            </button>
                                            <button
                                                style={{ cursor: "pointer", marginRight: "10px" }}
                                                onClick={() => handleDeleteById(item.id)}
                                            >
                                                <svg
                                                    viewBox="0 -960 960 960"
                                                    width="22px"
                                                    fill="currentColor"
                                                >
                                                    <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
                                                </svg>
                                            </button>
                                            <button>
                                                <span
                                                    data-testid="pencil"
                                                    data-icon="pencil"
                                                    className=""
                                                    style={{ cursor: "pointer" }}
                                                    onClick={() => handleEdit(item)}
                                                >
                                                    <svg
                                                        viewBox="0 0 24 24"
                                                        width="24"
                                                        height="24"
                                                        className=""
                                                    >
                                                        <path
                                                            fill="currentColor"
                                                            d="M3.95 16.7v3.4h3.4l9.8-9.9-3.4-3.4-9.8 9.9zm15.8-9.1c.4-.4.4-.9 0-1.3l-2.1-2.1c-.4-.4-.9-.4-1.3 0l-1.6 1.6 3.4 3.4 1.6-1.6z"
                                                        ></path>
                                                    </svg>
                                                </span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>

                                {isExpanded && (
                                    <tr>
                                        <td colSpan={8} style={{ padding: 0 }}>
                                            <div
                                                style={{
                                                    background: "#ffffffee",
                                                    padding: "15px 15px 0 15px",
                                                    borderRadius: "8px",
                                                    margin: "10px",
                                                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                                                    animation: "fadeIn 0.3s ease-in-out"
                                                }}
                                            >
                                                <ProcessItemTable product={product} bomId={bomId} processId={processId} />
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {isDeleteConfirmation && (
                                    <ConfirmationModal
                                        show={isDeleteConfirmation}
                                        onHide={() => setIsDeleteConfirmation(false)}
                                        handleSubmit={() =>
                                            handleDelete(
                                                netRateInput1,
                                                setRecallGetProcessOnDelete,
                                                setIsDeleteConfirmation,
                                            )
                                        }
                                        title={"Delete this Process"}
                                        message={"Are You Sure You Want To Delete This Process?"}
                                        btn1="CANCEL"
                                        btn2="DELETE"
                                    />
                                )}
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>

            <style>
                {`

                .process-table {
                border-collapse: separate !important;
                border-spacing: 0 20px;
                }

                @keyframes fadeIn {
                from {
                    opacity: 0;
                    transform: translateY(-5px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
                }
                `}
            </style>
        </div>
    );
};

export default BomProcessList;