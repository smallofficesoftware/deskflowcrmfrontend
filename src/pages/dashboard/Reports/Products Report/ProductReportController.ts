import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../helpers/AppType";
import { axiosInstance } from "../../../../services/axiosInstance";
import { IProductView } from "../../../left-side/header/Setting/product/ProductController";

export const fetchProductForReport = async (
    page: number,
    itemsPerPage: number,
    setProductList: (items: IProductView[]) => void,
    setLoading: TReactSetState<boolean>,
    term: string,
    searchCategoryId?: any,
    productId?: any,
) => {
    const token = localStorage.getItem("token");
    const getUUID = localStorage.getItem("UUID");
    const start: number = page * itemsPerPage;

    const requestData = {
        ul: start, // Upper limit based on page number
        ll: itemsPerPage, // Lower limit based on page number
        a_application_login_id: getUUID,
        searchTerm: term,
        searchCategoryId:
            typeof searchCategoryId === "object"
                ? searchCategoryId?.value
                : searchCategoryId || "",

        productId:
            typeof productId === "object"
                ? productId?.value?.toString()
                : productId?.toString() || "",
    };

    try {
        const data = await axiosInstance.post("product", requestData);
        if (data.status === 200) {
            if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
                setLoading(false);
                setProductList([]);
            }
            setLoading(true);
            setProductList(data.data.data.item);
        }
    } catch (error: any) {
        toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
        setTimeout(() => {
            setLoading(false); // Set loading to false after minimum time
        }, 1000); // 1000 milliseconds (1 seconds)
    }
};

export const handleDeleteProduct = async (
    productId: number | undefined, // Changed to accept an array of IDs
    setIsDeleteConfirmation: TReactSetState<boolean>,
    setLoading: TReactSetState<boolean>,
    options?: { checkAll?: number },
) => {
    const getUUID = localStorage.getItem("UUID");
    const token = await localStorage.getItem("token");

    try {
        setLoading(true);

        if (options?.checkAll === 1) {
            const requestData = {
                a_application_login_id: getUUID,
                checkAllProducts: 1,
            };

            const data = await axiosInstance.post("delete-product", requestData);

            if (data.data.code === 200) {
                setIsDeleteConfirmation(false);
                toast.success(data.data.ack_msg || "All Products Deleted Successfully");
            } else {
                toast.error(data.data.ack_msg || "Unknown error occurred");
            }
        } else if (productId) {
            const requestData = {
                product_id: productId, // Comma-separated IDs
                a_application_login_id: getUUID,
            };

            const data = await axiosInstance.post("delete-product", requestData);

            if (data.data.ack === 1) {
                setIsDeleteConfirmation(false);
                toast.success("Product Deleted Successfully");
            } else {
                toast.error(data.data.ack_msg || "Unknown error occurred");
            }
        } else {
            toast.error("Invalid product ID");
        }
    } catch (error: any) {
        toast.error(error?.response?.data?.ack_msg || "Unknown error occurred");
    } finally {
        setLoading(false);
    }
};