import { toast } from "react-toastify";
import { TReactSetState } from "../../../../helpers/AppType";
import { axiosInstance } from "../../../../services/axiosInstance";
import { ICompanyTeam } from "../../../left-side/LeftSideController";

export const fetchMyTeamForReport = async (
    company_id: number,
    setMyTeamList: TReactSetState<ICompanyTeam[]>,
    setLoading: TReactSetState<boolean>,
) => {

    const token = localStorage.getItem("token");
    const GetID = localStorage.getItem("UUID");

    const requestData = {
        company_masters_id: company_id,
        searchTerm: "",
    };

    try {
        setLoading(true);

        const res = await axiosInstance.post("my-team", requestData, {
            headers: {
                Authorization: `${token}`,
                "x-tenant-id": `${GetID}`,
            },
        });

        const teamData = res.data.data.item || [];

        setMyTeamList(teamData);

    } catch (err) {
        toast.error("Failed to load team");
    } finally {
        setLoading(false);
    }
};