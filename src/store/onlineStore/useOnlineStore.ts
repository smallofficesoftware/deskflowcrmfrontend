import { create } from 'zustand';
import { clearSessionCookie, loadSessionCookie, saveSessionCookie, updateSessionCookie } from "./cookieSession";

export interface PriceList {
    id: number;
    pricelist_masters_id: number;
    company_masters_id: number;
    a_application_login_id: number;
    product_id: number;
    rate: string | number;
    discount: string | number;
    net_rate: string | number;
    created_date_time: string;
    last_updated_date_time: string;
    last_updated_by: number;
    isDelete: number;
    isActive: number;
}

export interface Product {
    id: number;
    company_masters_id: number;
    a_application_login_id: number;
    product_name: string;
    product_alias: string;
    product_code: string;
    product_description: string;
    created_date_time: string; // ISO date string
    s_timestemp: string;       // ISO date string
    category_id: number;
    unit: string;
    weight_or_size: number;
    min_stock_quantity: number;
    max_stock_quantity: number;
    rate: number;
    GST: number;
    net_rate: number;
    product_img: string;
    product_types: number;
    product_barcode_number: string;
    isDelete: number;
    hsn_code: string;
    isActive: number;
    is_point_value_allow: number | string;
    products_column_number_1: number;
    products_column_number_2: number;
    products_column_number_3: number;
    products_column_number_4: number;
    products_column_number_5: number;
    products_column_text_1: string;
    products_column_text_2: string;
    products_column_text_3: string;
    products_column_text_4: string;
    products_column_text_5: string;
    products_column_text_area_1: string;
    products_column_text_area_2: string;
    products_column_text_area_3: string;
    products_column_text_area_4: string;
    products_column_text_area_5: string;
    products_column_date_1: string; // date string
    products_column_date_2: string;
    products_column_date_3: string;
    products_column_date_4: string;
    products_column_date_5: string;
    products_column_date_and_time_1: string | null; // datetime or null
    products_column_date_and_time_2: string | null;
    products_column_date_and_time_3: string | null;
    products_column_date_and_time_4: string | null;
    products_column_date_and_time_5: string | null;
    products_column_time_1: string;
    products_column_time_2: string;
    products_column_time_3: string;
    products_column_time_4: string;
    products_column_time_5: string;
    products_column_switch_1: number;
    products_column_switch_2: number;
    products_column_switch_3: number;
    products_column_switch_4: number;
    products_column_switch_5: number;
    products_column_decimal_1: number;
    products_column_decimal_2: number;
    products_column_decimal_3: number;
    products_column_decimal_4: number;
    products_column_decimal_5: number;
    products_column_dropdown_1: string;
    products_column_dropdown_2: string;
    products_column_dropdown_3: string;
    products_column_dropdown_4: string;
    products_column_dropdown_5: string;
    products_column_radio_1: string;
    products_column_radio_2: string;
    products_column_radio_3: string;
    products_column_radio_4: string;
    products_column_radio_5: string;
    // 🔹 Backend se aane wala price list object (ho bhi sakta hai, nahi bhi)
    price_list?: PriceList | null;
    closing_qty: number
}

export interface ProductCategory {
    id: number;
    category_name: string;
    color: string;
}

// CartItem = Product + quantity
export interface CartItem extends Product {
    quantity: number;

}

interface OnlineStoreState {
    products: Product[];
    categories: ProductCategory[];
    cart: CartItem[];
    searchTerm: string;
    selectedCategory: string | number;
    companyData: any;
    customerData: any;
    currencyData: any;
    formSubmitted: boolean;
    customerName: string;
    customerMobile: string;
    checkoutSuccess: boolean;

    setCheckoutSuccess: (value: boolean) => void;
    setProducts: (products: Product[]) => void;
    setCategories: (categories: ProductCategory[]) => void;
    setSearchTerm: (term: string) => void;
    setSelectedCategory: (category: string | number) => void;
    setCompanyData: (data: any) => void;
    setCustomerData: (data: any) => void;
    setCurrencyData: (data: any) => void;

    addToCart: (product: Product) => void;
    removeFromCart: (id: number) => void;
    updateCartQuantity: (id: number, quantity: number) => void;
    clearCart: () => void;

    setFormSubmitted: (submitted: boolean) => void;
    setCustomerName: (name: string) => void;
    setCustomerMobile: (mobile: string) => void;

    initializeSession: () => void;
    saveSessionState: () => void;
    logout: () => void;
}

export const useOnlineStore = create<OnlineStoreState>((set, get) => ({
    products: [],
    categories: [],
    cart: [],
    searchTerm: "",
    selectedCategory: "",
    companyData: {},
    currencyData: {},
    customerData: {},
    formSubmitted: false,
    customerName: "",
    customerMobile: "",
    checkoutSuccess: false,

    setCheckoutSuccess: (value) => set({ checkoutSuccess: value }),
    setProducts: (products) => set({ products }),
    setCategories: (categories) => set({ categories }),
    setSearchTerm: (term) => set({ searchTerm: term }),
    setSelectedCategory: (category) => set({ selectedCategory: category }),

    setCompanyData: (data) => {
        set({ companyData: data });
        updateSessionCookie({ companyData: data });
    },
    setCustomerData: (data) => {
        set({ customerData: data });
        updateSessionCookie({ customerData: data });
    },
    setCurrencyData: (data) => {
        set({ currencyData: data });
        updateSessionCookie({ currencyData: data });
    },

    addToCart: (product) => {
        const cart = get().cart;
        const existing = cart.find((c) => c.id === product.id);

        if (existing) {
            set({
                cart: cart.map((item) =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                ),
            });
        } else {
            // 🔹 yahan product ka jitna data aaya hai (including price_list), sab carry kar rahe hain
            set({
                cart: [
                    ...cart,
                    {
                        ...product,
                        quantity: 1,
                    },
                ],
            });
        }
    },

    removeFromCart: (id) =>
        set({ cart: get().cart.filter((item) => item.id !== id) }),

    updateCartQuantity: (id, quantity) => {
        if (quantity <= 0) return get().removeFromCart(id);
        set({
            cart: get().cart.map((item) =>
                item.id === id ? { ...item, quantity } : item
            ),
        });
    },

    clearCart: () => set({ cart: [] }),

    setFormSubmitted: (submitted) => {
        set({ formSubmitted: submitted });
        updateSessionCookie({ formSubmitted: submitted });
    },
    setCustomerName: (name) => {
        set({ customerName: name });
        updateSessionCookie({ customerName: name });
    },
    setCustomerMobile: (mobile) => {
        set({ customerMobile: mobile });
        updateSessionCookie({ customerMobile: mobile });
    },

    initializeSession: () => {
        const stored = loadSessionCookie();
        if (stored) {
            set(stored);
        }
    },

    saveSessionState: () => {
        const state = get();
        const dataToSave = {
            companyData: state.companyData,
            customerData: state.customerData,
            currencyData: state.currencyData,
            formSubmitted: state.formSubmitted,
            customerName: state.customerName,
            customerMobile: state.customerMobile,
        };
        saveSessionCookie(dataToSave);
    },

    logout: () => {
        clearSessionCookie();
        set({
            products: [],
            categories: [],
            cart: [],
            searchTerm: "",
            selectedCategory: "",
            companyData: {},
            customerData: {},
            currencyData: {},
            formSubmitted: false,
            customerName: "",
            customerMobile: "",
        });
    },
}));
