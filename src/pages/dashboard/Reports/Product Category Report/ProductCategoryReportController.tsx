import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../helpers/AppType";
import { axiosInstance } from "../../../../services/axiosInstance";
import { ICategoryView } from "../../../left-side/header/Setting/category/CategoryController";


export const fetchCategoriesReport = async (
    setCategoryList: TReactSetState<ICategoryView[]>,
    setLoading: TReactSetState<boolean>
) => {
    const getUUID = await localStorage.getItem("UUID");

    try {
        setLoading(true);

        // Pehle categories fetch karo
        const catRequest = {
            table: "categories",
            columns: "id, category_name, color, group_id",
            where: ["isDelete=0"],
            request_flag: 0,
            order: `{"id":"DESC"}`,
            a_application_login_id: getUUID
        };

        const catRes = await axiosInstance.post("commonGet", catRequest);

        if (catRes.status !== 200 || catRes.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
            setCategoryList([]);
            return;
        }

        // Yahan type define kar do
        const categories: Array<{
            id: number;
            category_name: string;
            color: string | null | undefined;
            group_id: number | null;
        }> = catRes.data.data || [];

        if (categories.length === 0) {
            setCategoryList([]);
            return;
        }

        // Ab unique group_ids collect karo
        const groupIds = [...new Set(
            categories
                .filter(
                    (c): c is {
                        id: number;
                        category_name: string;
                        color: string | null | undefined;
                        group_id: number;
                    } => c.group_id != null && c.group_id !== 0
                )
                .map((c) => c.group_id)
        )];

        let groupMap: Record<number, string> = {};

        if (groupIds.length > 0) {
            const groupRequest = {
                table: "product_groups",
                columns: "id, group_name",
                where: [`id IN (${groupIds.join(",")})`, "isDelete=0"],
                request_flag: 0,
            };

            const groupRes = await axiosInstance.post("commonGet", groupRequest);

            if (groupRes.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
                // Yahan bhi type safe banao
                const groups: Array<{ id: number; group_name: string }> = groupRes.data.data || [];

                groupMap = groups.reduce<Record<number, string>>((acc, g) => {
                    acc[g.id] = g.group_name;
                    return acc;
                }, {});
            }
        }

        // Final list banao with group_name
        const enriched: ICategoryView[] = categories.map((cat) => ({
            ...cat,
            group_name: cat.group_id ? groupMap[cat.group_id] || "Unknown" : undefined,
            // baaki fields jo ICategoryView mein hain, agar zaroori ho to default daal sakte ho
            id: cat.id,
            category_name: cat.category_name,
            color: cat.color,
            // group_id already hai to rehne do
        }));

        setCategoryList(enriched);

    } catch (error: any) {
        toast.error(error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        setCategoryList([]);
    } finally {
        setTimeout(() => setLoading(false), 800);
    }
};

export const handleDeleteCategory = async (
    categoryId: number, // Changed to accept an array of IDs
    setIsDeleteConfirmation: TReactSetState<boolean>,
    setLoading: TReactSetState<boolean>
) => {
    const getUUID = await localStorage.getItem("UUID");
    const token = await localStorage.getItem("token");
    const requestData = {
        category_id: categoryId, // Comma-separated IDs
        a_application_login_id: getUUID,
    };

    try {
        setLoading(true);
        const data = await axiosInstance.post("categoryDelete", requestData);
        if (data.data.code === 200 && data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
            setIsDeleteConfirmation(false);
            toast.success("Category Deleted Successfully");
        } else {
            toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
    } catch (error: any) {
        toast.error(error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
        setLoading(false);
    }
};