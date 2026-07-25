import { useEffect, useState } from "react";
import CustomSearchDropdown from "../../../../../../../components/CustomSearchDropdown";
import MultiSelect from "../../../../../../../components/MultiSelect";
import { IMachineView } from "../../../machineManagement/Machine-managementController";
import { IProductView } from "../../ProductController";
import { createProcess, fetchMachineApi, searchProcessApi, updateProcess } from "./BomProcessFieldController";

interface IPropsBOM {
    show: boolean;
    product: IProductView;
    bomId: any;
    handleRefreshListView: (data: boolean) => void;
    editTimeData: any;
    handleSetEditTimeData: (data: any) => void
}

const BomProcessField = ({
    show,
    product,
    bomId,
    handleRefreshListView,
    editTimeData,
    handleSetEditTimeData
}: IPropsBOM) => {

    const [processName, setProcessName] = useState("");
    const [workstation, setWorkstation] = useState("");
    const [requiredTime, setRequiredTime] = useState("");
    const [cost, setCost] = useState("");
    const [manPowerCost, setManPowerCost] = useState("");
    const [machineList, setMachineList] = useState<IMachineView[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedMachines, setSelectedMachines] = useState<any[]>([]);
    const [machineOptions, setMachineOptions] = useState<any[]>([]);
    const [processOptions, setProcessOptions] = useState<any[]>([]);
    const [selectedProcess, setSelectedProcess] = useState<any>(null);

    const handleAdd = async () => {
        if (!selectedProcess || selectedMachines.length === 0 || !requiredTime || !cost || !manPowerCost) {
            return;
        }

        if (!editTimeData) {
            await createProcess(
                selectedProcess?.value,
                selectedMachines.map((m) => m.value).join(","),
                requiredTime,
                cost,
                manPowerCost,
                product.id,
                bomId,
            );
        } else {

            await updateProcess(
                editTimeData.id,
                selectedProcess?.value,
                selectedMachines.map((m) => m.value).join(","),
                requiredTime,
                cost,
                manPowerCost,
                product.id,
                bomId
            );
        }
        handleSetEditTimeData(null);

        handleRefreshListView(true);

        setProcessName("");
        setWorkstation("");
        setRequiredTime("");
        setCost("");
        setManPowerCost("");
        setSelectedMachines([]);
        setSelectedProcess(null)
    };

    const handleMachineSearch = async (input: string) => {
        const data = await fetchMachineApi(input);
        setMachineOptions(data);
    };

    useEffect(() => {
        handleMachineSearch("");
    }, []);

    const handleSearchProcessApi = async (input: string) => {
        const data = await searchProcessApi(input);
        setProcessOptions(data);
    }

    useEffect(() => {
        handleSearchProcessApi("");
    }, []);

    useEffect(() => {
        if (editTimeData) {
            const process = processOptions.find(
                (p) => p.value === editTimeData.process_id
            );
            setSelectedProcess(process);
            if (editTimeData.workstation_id) {
                const ids = Array.isArray(editTimeData.workstation_id)
                    ? editTimeData.workstation_id
                    : typeof editTimeData.workstation_id === "string"
                        ? editTimeData.workstation_id.split(",")
                        : editTimeData.workstation_id
                            ? [editTimeData.workstation_id]
                            : [];

                const machines = machineOptions.filter((m) =>
                    ids.includes(String(m.value))
                );

                setSelectedMachines(machines);

                setWorkstation(ids.join(","));
            }
            setRequiredTime(editTimeData.required_time);
            setCost(editTimeData.process_cost);
            setManPowerCost(editTimeData.manpower_cost);
        }
    }, [editTimeData, processOptions, machineOptions]);

    return (
        <>
            {show && (
                <div className="head" style={{ fontSize: "15px" }}>
                    <div className="source-of-type-list-grid-block">
                        <div className="source-of-type-list-grid-main">
                            <table className="table" style={{ tableLayout: "inherit", width: "100%" }}>
                                <thead>
                                    <tr>
                                        <th>
                                            Process Name<span className="text-danger">*</span>
                                        </th>
                                        <th className="text-end">Workstation</th>
                                        <th className="text-end">Required Time (In Minute)</th>
                                        <th className="text-end">Process Cost</th>
                                        <th className="text-end">Manpower Cost</th>
                                        <th className="text-end">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="text-start" style={{ paddingTop: "15px" }}>
                                            <div className="add-source-of-type-section ">
                                                <CustomSearchDropdown
                                                    isAsync={true}
                                                    options={processOptions}
                                                    value={selectedProcess}
                                                    onChange={(selected: any) => {
                                                        setSelectedProcess(selected);
                                                        setProcessName(selected?.label || "");
                                                    }}
                                                    className="w-100"
                                                    placeholder="Search Process"
                                                />
                                            </div>
                                        </td>
                                        <td className="text-start" style={{ paddingTop: "15px" }}>
                                            <div className="form-group">
                                                <MultiSelect
                                                    options={machineOptions}
                                                    value={selectedMachines}
                                                    onChange={(selected: any) => {
                                                        setSelectedMachines(selected);

                                                        const ids = selected.map((item: any) => item.value);
                                                        setWorkstation(ids.join(","));
                                                    }}
                                                    isSelectAll={true}
                                                    menuPlacement="bottom"
                                                    menuStyle={{
                                                        left: "90%",
                                                        right: "auto",
                                                        transform: "none",
                                                        height: "42px",
                                                    }}
                                                />
                                            </div>
                                        </td>
                                        <td className="text-start">
                                            <div className="search-bar ">
                                                <div className="add-source-of-type-section ">
                                                    <input
                                                        type="text"
                                                        title="Required Time"
                                                        placeholder="Required Time"
                                                        value={requiredTime}
                                                        onChange={(e) => {
                                                            const value = e.target.value.replace(/[^0-9]/g, "");
                                                            setRequiredTime(value);
                                                        }}
                                                        style={{ textAlign: "end" }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-start">
                                            <div className="search-bar ">
                                                <div className="add-source-of-type-section ">
                                                    <input
                                                        type="text"
                                                        title="Process Cost"
                                                        placeholder="Total Process Cost"
                                                        value={cost}
                                                        onChange={(e) => {
                                                            let value = e.target.value
                                                                .replace(/[^0-9.]/g, "")
                                                                .replace(/(\..*)\./g, "$1");

                                                            setCost(value);
                                                        }}
                                                        style={{
                                                            backgroundColor: "#f0f2f5",
                                                            textAlign: "end",
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-start">
                                            <div className="search-bar ">
                                                <div className="add-source-of-type-section ">
                                                    <input
                                                        type="text"
                                                        title="Manpower Cost"
                                                        placeholder="Total Manpower Cost"
                                                        value={manPowerCost}
                                                        onChange={(e) => {
                                                            let value = e.target.value
                                                                .replace(/[^0-9.]/g, "")
                                                                .replace(/(\..*)\./g, "$1");

                                                            setManPowerCost(value);
                                                        }}
                                                        style={{
                                                            backgroundColor: "#f0f2f5",
                                                            textAlign: "end",
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-start">
                                            <div className="text-center mt-2">
                                                <button className=""
                                                    onClick={handleAdd}
                                                >
                                                    <span>
                                                        {editTimeData ? (
                                                            <span>
                                                                <svg
                                                                    data-name="Layer 1"
                                                                    height={24}
                                                                    id="Layer_1"
                                                                    viewBox="0 0 200 200"
                                                                >
                                                                    <title />
                                                                    <path
                                                                        fill="currentColor"
                                                                        d="M177.68,43.9c-4.5-3.5-10.5-3-14,1.5l-74,89.5-55-40c-4.5-3-10.5-2.5-14,2-3,4.5-2.5,10.5,2,14l62.5,45.5a.49.49,0,0,1,.5.5c.5,0,.5.5,1,.5s.5.5,1,.5.5,0,1,.5h6c.5,0,.5,0,1-.5.5,0,.5-.5,1-.5s.5-.5,1-.5.5-.5,1-.5a.49.49,0,0,0,.5-.5l.5-.5,80-97C182.18,53.9,181.68,47.4,177.68,43.9Z"
                                                                    />
                                                                </svg>
                                                            </span>
                                                        ) : (
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                height="26px"
                                                                viewBox="0 -960 960 960"
                                                                width="26px"
                                                                fill="#5f6368"
                                                            >
                                                                <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                                                            </svg>
                                                        )}
                                                    </span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default BomProcessField;