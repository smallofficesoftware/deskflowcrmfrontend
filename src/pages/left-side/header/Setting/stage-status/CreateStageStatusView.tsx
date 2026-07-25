import React, { useEffect, useState } from "react";
import { SingleValue } from "react-select";
import { toast } from "react-toastify";
import CustomSearchDropdown from "../../../../../components/CustomSearchDropdown";
import MultiSelect from "../../../../../components/MultiSelect";
import { DEFAULT_MESSAGE_ERROR_PERMISSION, DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED, SMALL_TEXT_LENGTH } from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import { IOption } from "../../../../../helpers/AppInterface";
import { TOnChangeInput, TReactSetState } from "../../../../../helpers/AppType";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import { axiosInstance } from "../../../../../services/axiosInstance";
import { fetchCompanyForTitle, ICompany } from "../custom-inquiry-from/CustomInquiryFromController";
import { createStageStatus, IStageStatusView, orderTypesStageList, updateStageStatus } from "./StageStatusController";

interface IPropsCreateStageStatus {
    show: boolean;
    onHide: () => void;
    headerName: string;
    productToEdit: IStageStatusView | undefined;
    setLoading: TReactSetState<boolean>;
    // handleRefreshStageStatus: () => void;
    handleOutsideOrderDisplayChange: (data: SingleValue<IOption>) => void;
}

const CreateStageStatusView = ({
    show,
    onHide,
    headerName,
    productToEdit,
    setLoading,
    // handleRefreshStageStatus,
    handleOutsideOrderDisplayChange,
}: IPropsCreateStageStatus) => {

    const [titleList, setTitleList] = useState<ICompany | undefined>();
    const [selectedOrderList, setSelectedOrderList] = useState<IOption | null>(
        null,
    );
    const [isStatusInputReadOnly, setIsStatusInputReadOnly] = useState(false);
    const [OrderListError, setOrderListError] = useState("");
    const [
        selectedTeamPersonToChangeStatus,
        setSelectedTeamPersonToChangeStatus,
    ] = useState<any[]>([]);
    const [
        selectedTeamPersonToShowStatusData,
        setSelectedTeamPersonToShowStatusData,
    ] = useState<any[]>([]);
    const [selectedStatusType, setSelectedStatusType] = useState<any>({
        label: "Neutral",
        value: "0",
    });
    const handleStatusChange = (selectedOption: SingleValue<IOption>) => {
        setSelectedStatusType(selectedOption);
    };
    const [visibility, setVisibility] = useState<0 | 1>(0);  // 0 = internal, 1 = external
    const [stagestatusInput, setStageStatusInput] = useState("");
    const [stagestatusError, setstagestatusError] = useState("");
    const [stagestatusHexColorInput, setStageStatusHexColorInput] =
        useState("#999999");
    const [teamPersonList, setTeamPersonList] = useState<any>([]);

    const canView = useCheckUserPermission(PAGE_ID.STATUS, PERMISSION_TYPE.VIEW);
    const canAdd = useCheckUserPermission(PAGE_ID.STATUS, PERMISSION_TYPE.ADD);

    useEffect(() => {
        if (!canView) return;

        fetchCompanyForTitle(setTitleList);
    }, [canView]);

    const teamsPersonStatusOptions = teamPersonList.map((t: any) => ({
        value: t.id,
        label: t.username,
    }));

    useEffect(() => {
        if (!productToEdit) return;

        // wait until titleList loads because
        // orderDisplayOptions depends on it
        if (!titleList) return;

        const selectedCategoryOption =
            orderDisplayOptions.find(
                (option: { value: string }) =>
                    String(option.value) === String(productToEdit.order_type),
            ) || null;

        setSelectedOrderList(selectedCategoryOption);
    }, [productToEdit, titleList]);

    useEffect(() => {
        if (!selectedOrderList?.value) return;

        fetchAllCompanyApi();
    }, [selectedOrderList]);


    useEffect(() => {
        if (!productToEdit) return;

        // wait for api data
        if (teamPersonList.length === 0) return;

        setOrderListError("");
        setstagestatusError("");

        setStageStatusInput(productToEdit.name);

        setStageStatusHexColorInput(
            productToEdit.color || "#999999",
        );

        setVisibility(
            productToEdit.visibility === 1 ? 1 : 0,
        );

        const change_status_team_person_arr =
            productToEdit.change_status_team_ids
                ? productToEdit.change_status_team_ids.split(",")
                : [];

        const show_status_data_team_ids_arr =
            productToEdit.show_status_data_team_ids
                ? productToEdit.show_status_data_team_ids.split(",")
                : [];

        const change_status_team_person =
            change_status_team_person_arr
                .map((v) =>
                    teamsPersonStatusOptions.find(
                        (option: { value: string }) =>
                            String(option.value) === String(v),
                    ),
                )
                .filter(Boolean);

        const show_status_data_team =
            show_status_data_team_ids_arr
                .map((v) =>
                    teamsPersonStatusOptions.find(
                        (option: { value: string }) =>
                            String(option.value) === String(v),
                    ),
                )
                .filter(Boolean);

        const selectedStatusTypeOption = [
            { label: "Neutral", value: "0" },
            { label: "Negative", value: "1" },
            { label: "Positive", value: "2" },
        ].find(
            (option: { value: string }) =>
                option.value === String(productToEdit.status_type),
        );

        setSelectedTeamPersonToChangeStatus(
            change_status_team_person,
        );

        setSelectedTeamPersonToShowStatusData(
            show_status_data_team,
        );

        setSelectedStatusType(
            selectedStatusTypeOption || {
                label: "Neutral",
                value: "0",
            },
        );

        setIsStatusInputReadOnly(productToEdit.id < 0);

    }, [productToEdit, teamPersonList]);

    const fetchAllCompanyApi = async () => {
        const token = await localStorage.getItem("token");
        const getUUID = await localStorage.getItem("UUID");

        const requestData = {
            a_application_login_id: getUUID,
        };

        try {
            const data = await axiosInstance.post(
                "my-team",
                requestData,
                {
                    headers: {
                        Authorization: `${token}`,
                    },
                },
            );

            if (
                data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS
            ) {
                setTeamPersonList([]);
                return;
            }

            setTeamPersonList(data.data.data.item || []);
        } catch (error: any) {
            toast.error(
                error || MESSAGE_UNKNOWN_ERROR_OCCURRED,
            );
        }
    };

    const customLabels: Record<string, string> = {
        "3": titleList?.quotation_title || "Quotation",
        "4": titleList?.order_title || "Sales Order",
        "5": titleList?.invoice_title || "Sales Invoice",
        "9": titleList?.return_sales_invoice_title || "Return Sales Invoice",
        "6": titleList?.purchase_title || "Purchase Invoice",
        "7": titleList?.purchase_order_title || "Purchase Order",
        "10":
            titleList?.return_purchase_invoice_title ||
            "Return Purchase Invoice",
        "11": titleList?.dispatch_title || "Dispatch",
        "12": titleList?.inward_title || "Goods Received Note",
    };

    const orderDisplayOptions = orderTypesStageList?.map((option) => ({
        value: option.id,
        label: customLabels[String(option.id)] || option.order_type_display,
    }));

    const handleOrderDisplayChange = (selectedOption: SingleValue<IOption>) => {
        setSelectedOrderList(selectedOption);
        setOrderListError(selectedOption ? "" : "Please Select Type");
    };

    const handelChange = (event: TOnChangeInput) => {
        const value = event.target.value;
        setStageStatusInput(value);
        setstagestatusError(value ? "" : "Stage and Status Name is required");
    };

    const handelChangeHexColor = (event: TOnChangeInput) => {
        setStageStatusHexColorInput(event.target.value);
    };

    const clearForm = () => {
        setStageStatusInput("");
        setStageStatusHexColorInput("#999999");
        setSelectedOrderList(false || null);
        setIsStatusInputReadOnly(false);
        setIsStatusInputReadOnly(false);
        setSelectedTeamPersonToChangeStatus([]);
        setSelectedTeamPersonToShowStatusData([]);
        setSelectedStatusType([{ label: "Neutral", value: "0" }]);
        setVisibility(0);
    };

    const handelSubmit = async () => {
        if (stagestatusInput.trim() === "") {
            setstagestatusError("Stage and Status is required");
            return;
        }
        if (!selectedOrderList) setOrderListError("Please Select Type");

        if (stagestatusInput && selectedOrderList) {
            if (productToEdit && productToEdit.id !== undefined) {
                await updateStageStatus(
                    {
                        name: stagestatusInput,
                        color: stagestatusHexColorInput,
                        order_type: Number(selectedOrderList.value),
                        change_status_team_ids: selectedTeamPersonToChangeStatus,
                        show_status_data_team_ids: selectedTeamPersonToShowStatusData,
                        status_type: selectedStatusType.value,
                        visibility: visibility
                    },
                    setLoading,
                    productToEdit.id,
                    clearForm,
                    Number(selectedOrderList?.value),
                );
            } else {
                if (!canAdd) {
                    toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                    return;
                }
                await createStageStatus(
                    {
                        name: stagestatusInput,
                        color: stagestatusHexColorInput,
                        order_type: Number(selectedOrderList?.value),
                        change_status_team_ids: selectedTeamPersonToChangeStatus,
                        show_status_data_team_ids: selectedTeamPersonToShowStatusData,
                        status_type: selectedStatusType.value,
                        visibility: visibility
                    },
                    setLoading,
                    clearForm,
                    Number(selectedOrderList?.value),
                );
            }
            handleOutsideOrderDisplayChange(selectedOrderList);
            // handleRefreshStageStatus();
            onHide();
        }
    };

    return (
        <React.Fragment>
            {show && (
                <div className="modal1">
                    <div className="modal-content1" style={{ width: "35%" }}>
                        <span className="close" onClick={onHide}>
                            &times;
                        </span>
                        <h2 className="modal-title1 form_header_text">{headerName}</h2>

                        <div className="head" style={{ display: "block", marginLeft: "20px" }}>
                            <div className="col-12 ">
                                <p className="thanks text-danger">
                                    If you want to set a sequence, start from 1 and continue
                                    onward.
                                </p>
                            </div>
                            <div className="col-12">
                                <label
                                    className="form-check-label"
                                    htmlFor="flexCheckDefault"
                                >
                                    <h6>
                                        Type
                                        <span className="text-danger">*</span>
                                    </h6>
                                </label>
                                <div className="">
                                    <div className="add-source-of-type-section ">
                                        <CustomSearchDropdown
                                            options={orderDisplayOptions}
                                            value={selectedOrderList}
                                            onChange={handleOrderDisplayChange}
                                            className="w-100"
                                            isDisabled={
                                                isStatusInputReadOnly ? "disabled" : false
                                            }
                                        />
                                    </div>
                                </div>
                                {OrderListError && (
                                    <span className="text-danger">{OrderListError}</span>
                                )}
                            </div>

                            <div className="col-12 mt-1">
                                <label className="form-check-label">
                                    <h6>Who can change the status</h6>
                                </label>
                                <div className="">
                                    <div className="add-status-action-teams-section">
                                        <MultiSelect
                                            options={teamsPersonStatusOptions}
                                            value={selectedTeamPersonToChangeStatus}
                                            onChange={(selected: any) => {
                                                setSelectedTeamPersonToChangeStatus(selected);
                                            }}
                                            isSelectAll={false}
                                            menuPlacement="bottom"
                                            menuStyle={{
                                                left: "90%",
                                                right: "auto",
                                                transform: "none",
                                                height: "42px",
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="col-12 mt-1">
                                <label className="form-check-label">
                                    <h6>Who can see this status data.</h6>
                                </label>
                                <div>
                                    <div className="add-status-action-teams-to-show-data-section">
                                        <MultiSelect
                                            options={teamsPersonStatusOptions}
                                            value={selectedTeamPersonToShowStatusData}
                                            onChange={(selected: any) => {
                                                setSelectedTeamPersonToShowStatusData(selected);
                                            }}
                                            isSelectAll={false}
                                            menuPlacement="bottom"
                                            menuStyle={{
                                                left: "90%",
                                                right: "auto",
                                                transform: "none",
                                                height: "42px",
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="col-12 mt-1">
                                <label
                                    className="form-check-label"
                                    htmlFor="flexCheckDefault"
                                >
                                    <h6>
                                        Set Status Type
                                        <span className="text-danger">*</span>
                                    </h6>
                                </label>
                                <div className="">
                                    <div className="add-source-of-type-section ">
                                        <CustomSearchDropdown
                                            options={[
                                                { label: "Neutral", value: "0" },
                                                { label: "Negative", value: "1" },
                                                { label: "Positive", value: "2" },
                                            ]}
                                            value={selectedStatusType}
                                            onChange={handleStatusChange}
                                            className="w-100"
                                            isDisabled={
                                                isStatusInputReadOnly ? "disabled" : false
                                            }
                                        />
                                    </div>
                                </div>
                                {OrderListError && (
                                    <span className="text-danger">{OrderListError}</span>
                                )}
                            </div>
                            <div className="col-12 mt-1">
                                <label className="form-check-label">
                                    <h6>Visibility</h6>
                                </label>
                                <div className="d-flex gap-4 mt-2">
                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            name="visibility"
                                            id="internal"
                                            value="0"
                                            checked={visibility === 0}
                                            onChange={() => setVisibility(0)}
                                        />
                                        <label className="form-check-label" htmlFor="internal">
                                            Internal
                                        </label>
                                    </div>
                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            name="visibility"
                                            id="external"
                                            value="1"
                                            checked={visibility === 1}
                                            onChange={() => setVisibility(1)}
                                        />
                                        <label className="form-check-label" htmlFor="external">
                                            External
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="col-12 mt-1">
                                <label
                                    className="form-check-label"
                                    htmlFor="flexCheckDefault"
                                >
                                    <h6>
                                        Enter Stages & Status Name
                                        <span className="text-danger">*</span>
                                    </h6>
                                </label>
                                <div className="col-12 d-flex">
                                    <div className="col-11">
                                        <div className="search-bar ">
                                            <div className="add-source-of-type-section ">
                                                <input
                                                    type="text"
                                                    title="Add Stages & Status Name"
                                                    placeholder="Add Stages & Status Name"
                                                    maxLength={SMALL_TEXT_LENGTH}
                                                    value={stagestatusInput}
                                                    onChange={(e) => handelChange(e)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            handelSubmit();
                                                        }
                                                    }}
                                                // readOnly={isStatusInputReadOnly}
                                                />
                                            </div>
                                        </div>
                                        {stagestatusError && (
                                            <span className="text-danger">
                                                {stagestatusError}
                                            </span>
                                        )}
                                    </div>
                                    <div className="col-1 d-flex justify-content-end align-items-center mx-1">
                                        <input
                                            type="color"
                                            value={stagestatusHexColorInput}
                                            className="mx-1"
                                            onChange={(e) => handelChangeHexColor(e)}
                                            onKeyDown={(e) => {
                                                if (stagestatusInput.trim() === "") {
                                                    setstagestatusError(
                                                        "Stage and Status is required",
                                                    );
                                                    return;
                                                }
                                                if (e.key === "Enter") {
                                                    handelSubmit();
                                                }
                                            }}
                                            style={{ width: "25px", height: '25px' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 col-12 pt-4 pe-3 d-flex justify-content-end modal-buttons">
                            <button
                                className="modal-button1"
                                onClick={onHide}
                                type="button"
                            >
                                Close
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary px-4 py-2 ms-2 text-light form_label rounded-1"
                                onClick={handelSubmit}
                                style={{
                                    backgroundColor: "#f58634",
                                }}
                            >
                                {productToEdit ? "Save" : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </React.Fragment>
    );
};

export default CreateStageStatusView;