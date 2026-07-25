import { DateObject } from "react-multi-date-picker";
import { toast } from "react-toastify";
import { MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../helpers/AppType";
import { axiosInstance } from "../../../../services/axiosInstance";

export interface ICategorySalesData {
    item_category_id: number;
    item_category_name: string;
    quotation?: string;
    salesorder?: string;
    salesinvoice?: string;
    purchaseinvoice?: string;
    purchaseorder?: string;
    pending_sales?: string;
    pending_purchase?: string;
}

const pivotData = (data: {
    quotation: any[];
    salesOrder: any[];
    salesInvoice: any[];
    purchaseInvoice: any[];
    purchaseOrder: any[];
}): ICategorySalesData[] => {
    const groupedByProduct: { [key: string]: ICategorySalesData } = {};

    const processItems = (items: any[], cartType: number) => {
        items.forEach((item) => {
            const key = `${item.item_category_id}_${item.item_category_name}`;
            if (!groupedByProduct[key]) {
                groupedByProduct[key] = {
                    item_category_id: item.item_category_id,
                    item_category_name: item.item_category_name,
                };
            }

            const value = `${item.total_quantity}(${item.total_amount})`;
            switch (cartType) {
                case 1:
                    groupedByProduct[key].quotation = value;
                    break;
                case 2:
                    groupedByProduct[key].salesorder = value;
                    break;
                case 3:
                    groupedByProduct[key].salesinvoice = value;
                    break;
                case 4:
                    groupedByProduct[key].purchaseinvoice = value;
                    break;
                case 5:
                    groupedByProduct[key].purchaseorder = value;
                    break;
            }
        });
    };

    processItems(data.quotation || [], 1);
    processItems(data.salesOrder || [], 2);
    processItems(data.salesInvoice || [], 3);
    processItems(data.purchaseInvoice || [], 4);
    processItems(data.purchaseOrder || [], 5);

    const result = Object.values(groupedByProduct);
    return result;
};

// export const fetchCategoryReport = async (
//     setCategoryData: TReactSetState<ICategorySalesData[]>,
//     selectedDates: DateObject[] | any | undefined,
//     setError?: TReactSetState<string | null>,
//     MobileToken?: string,
//     getID?: string,
//     MobileFlag?: string,
//     selectedProduct?: string | null,
//     selectedCategory?: string | null,
//     ul?:number,
//     ll?:number,
//     globalSearch?:string

// ): Promise<void> => {
//     const token = MobileToken || localStorage.getItem("token");
//     const getUUID = getID || localStorage.getItem("UUID");

//     if (!token || !getUUID) {
//         const errorMessage = "Authentication details are missing";
//         toast.error(errorMessage);
//         setError?.(errorMessage);
//         setCategoryData([]);
//         return;
//     }

//     const requestedData = {
//         selectedDates: selectedDates
//             ? selectedDates.map((date: DateObject | any) =>
//                 date instanceof DateObject ? date?.format("YYYY-MM-DD") : date
//             )
//             : undefined,
//         a_application_login_id: getUUID,
//         selectedProduct: selectedProduct,
//         selectedCategory: selectedCategory,
//         ul:ul||0,
//         ll:ll||50,
//         globalSearch

//     };

//     try {
//         const response = await axiosInstance.post("getCategorySales&Purchase", requestedData);

//         const data = response.data.data || {
//             quotation: [],
//             salesOrder: [],
//             salesInvoice: [],
//             purchaseInvoice: [],
//             purchaseOrder: [],
//         };


//         const pivotedData = pivotData(data);
//         setCategoryData(pivotedData);

//         if (response.data.ack == 3) {
//             toast.error(response.data.ack_msg)
//         }
//         setError?.(null);
//     } catch (error: any) {
//         const errorMessage = error?.response?.data?.message || error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED;
//         toast.error(errorMessage);
//         setError?.(errorMessage);
//         setCategoryData([]);
//     }
// };


export const fetchCategoryReport = async (
    selectedDates: DateObject[] | any | undefined,
    setError?: TReactSetState<string | null>,
    MobileToken?: string,
    getID?: string,
    MobileFlag?: string,
    selectedProduct?: string | null,
    selectedCategory?: string | null,
    globalSearch?: string,
    selectedContactId?: string | null,
    offset?: number,
    limit?: number,
    referenceWiseContact?: number
): Promise<any[]> => {

    const token = MobileToken || localStorage.getItem("token");
    const getUUID = getID || localStorage.getItem("UUID");

    if (!token || !getUUID) {
        const errorMessage = "Authentication details are missing";
        toast.error(errorMessage);
        setError?.(errorMessage);
        return [];
    }

    const requestedData = {
        selectedDates: selectedDates
            ? selectedDates.map((date: DateObject | any) =>
                date instanceof DateObject ? date?.format("YYYY-MM-DD") : date
            )
            : undefined,
        a_application_login_id: getUUID,
        selectedProduct: selectedProduct,
        selectedCategory: selectedCategory,
        selectedContactId: selectedContactId,
        ul: offset || 0,
        ll: limit || 50,
        globalSearch,
        referenceWiseContact: referenceWiseContact
    };

    try {
        const response = await axiosInstance.post(
            "getCategorySales&Purchase",
            requestedData
        );

        if (response.data.ack === 3) {
            toast.error(response.data.ack_msg);
            return [];
        }

        const data = response.data.data || {
            quotation: [],
            salesOrder: [],
            salesInvoice: [],
            purchaseInvoice: [],
            purchaseOrder: [],
        };

        const pivotedData = pivotData(data);
        const items = Array.isArray(pivotedData) ? pivotedData : [];

        setError?.(null);
        return items;

    } catch (error: any) {
        const errorMessage =
            error?.response?.data?.message ||
            error?.message ||
            MESSAGE_UNKNOWN_ERROR_OCCURRED;

        toast.error(errorMessage);
        setError?.(errorMessage);
        return [];
    }
};



export const fetchCategoryWisePendingForExport = async (
    selectedDates: DateObject[] | any | undefined,
    setError?: TReactSetState<string | null>,
    MobileToken?: string,
    getID?: string,
    MobileFlag?: string,
    selectedProduct?: string | null,
    selectedCategory?: string | null,
    globalSearch?: string,
    selectedContactId?: string | null,
    offset?: number,
    limit?: number,
): Promise<ICategorySalesData[]> => {
    const getUUID = getID || localStorage.getItem("UUID");

    const requestedData = {
        selectedDates: selectedDates
            ? selectedDates.map((date: DateObject | any) =>
                date instanceof DateObject ? date?.format("YYYY-MM-DD") : date
            )
            : undefined,
        a_application_login_id: getUUID,
        selectedProduct: selectedProduct,
        selectedCategory: selectedCategory,
        selectedContactId: selectedContactId,
        ul: offset || 0,
        ll: limit || 500,
        globalSearch,
    };

    const response = await axiosInstance.post(
        "getCategorySales&Purchase",
        requestedData
    );

    if (response?.data?.ack === 3) {
        toast.error(response.data.ack_msg);
        return [];
    }

    const apiData = response?.data?.data;

    if (!apiData) return [];

    // 🔥 MAIN FIX — object → array
    return pivotData({
        quotation: apiData.quotation || [],
        salesOrder: apiData.salesOrder || [],
        salesInvoice: apiData.salesInvoice || [],
        purchaseInvoice: apiData.purchaseInvoice || [],
        purchaseOrder: apiData.purchaseOrder || [],
    });
};

export const exportAllCategoryPendingData = async (
    fetchFn: (offset: number, limit: number) => Promise<ICategorySalesData[]>,
    limit = 500
): Promise<ICategorySalesData[]> => {
    let offset = 0;
    let allData: ICategorySalesData[] = [];

    while (true) {
        const chunk = await fetchFn(offset, limit);

        if (!chunk.length) break;

        allData = allData.concat(chunk);
        offset += chunk.length;

        if (chunk.length < limit) break;
    }

    return allData;
};