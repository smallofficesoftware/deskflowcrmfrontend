import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import CustomSearchDropdown from "../../../../../components/CustomSearchDropdown";
import {
  BIG_TEXT_LENGTH,
  DEFAULT_MESSAGE_ERROR_PERMISSION,
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import { TOnChangeInput, TReactSetState } from "../../../../../helpers/AppType";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import { axiosInstance } from "../../../../../services/axiosInstance";
import { createCategory, fetchProductGroupApi, ICategoryView, IGroupView, updateCategory } from "./CategoryController";

interface IPropsCreateCategory {
    show: boolean;
    onHide: () => void;
    headerName: string;
    productToEdit: ICategoryView | undefined;
    setLoading: TReactSetState<boolean>;
    handleRefreshCategory: () => void;
}

const CreateCategoryView = ({
    show,
    onHide,
    headerName,
    productToEdit,
    setLoading,
    handleRefreshCategory,
}: IPropsCreateCategory) => {

    const [categoryInput, setCategoryInputInput] = useState("");
    const [categoryHexColorInput, setCategoryHexColorInput] = useState<string | undefined>("#999999");

    const [countriesList, setCountriesList] = useState<IGroupView[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

    const [categoryError, setCategoryError] = useState("");
    const [countryError, setCountryError] = useState("");

    // Category image for the ecommerce storefront (23-10-2026) - edit-only
    // (upload needs a real category_id, and createCategory doesn't return
    // the new row's id today) - a brand-new category must be saved once,
    // then reopened for Edit, to add a photo.
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const canView = useCheckUserPermission(PAGE_ID.CATEGORY, PERMISSION_TYPE.VIEW);
    const canAdd = useCheckUserPermission(PAGE_ID.CATEGORY, PERMISSION_TYPE.ADD);
    const canEdit = useCheckUserPermission(PAGE_ID.CATEGORY, PERMISSION_TYPE.EDIT);

    useEscapeKey(onHide);

    useEffect(() => {
        if (productToEdit) {
            setCategoryInputInput(productToEdit.category_name);
            setCategoryHexColorInput(productToEdit.color || "#999999");
            setSelectedGroupId(productToEdit.group_id || null);
            fetchCategoryImage();
        }
    }, []);

    const fetchCategoryImage = async () => {
        if (!productToEdit?.id) return;
        try {
            const { data } = await axiosInstance.post("get-category-image", { category_id: productToEdit.id });
            if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
                setImagePreviewUrl(data.data?.item?.thumbnail_url || data.data?.item?.webp_url || data.data?.item?.image_url || null);
            }
        } catch {
            // Non-critical - the rest of the form still works without a preview.
        }
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !productToEdit?.id) return;
        e.target.value = "";

        const formData = new FormData();
        formData.append("category_id", String(productToEdit.id));
        formData.append("image", file);

        setUploadingImage(true);
        try {
            const { data } = await axiosInstance.post("upload-category-image", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
                setImagePreviewUrl(data.data?.item?.thumbnail_url || data.data?.item?.webp_url || null);
                toast.success("Category image uploaded");
            } else {
                toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        } finally {
            setUploadingImage(false);
        }
    };

    const handleRemoveImage = async () => {
        if (!productToEdit?.id) return;
        try {
            const { data } = await axiosInstance.post("delete-category-image", { category_id: productToEdit.id });
            if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
                setImagePreviewUrl(null);
            } else {
                toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
            }
        } catch {
            toast.error(MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
    };

    useEffect(() => {
        if (canView) {
            fetchProductGroupApi(setCountriesList, setLoading);
        }
    }, [canView]);

    const countryOptions = countriesList.map((country) => ({
        value: String(country.id),
        label: country.group_name,
    }));

    const handleCountryChange = (selectedOption: any) => {
        if (selectedOption) {
            setSelectedGroupId(Number(selectedOption.value));
            setCountryError("");
        } else {
            setSelectedGroupId(null);
            setCountryError("Group is required");
        }
    };

    const handleChange = (event: TOnChangeInput) => {
        const value = event.target.value;
        setCategoryInputInput(value);
        setCategoryError(value.trim() ? "" : "Category name is required");
    };

    const handleChangeHexColor = (event: TOnChangeInput) => {
        setCategoryHexColorInput(event.target.value);
    };

    const clearForm = () => {
        setCategoryInputInput("");
        setCategoryHexColorInput("#999999");
        setSelectedGroupId(null);
        setCategoryError("");
        setCountryError("");
    };

    const validateForm = () => {
        let hasError = false;

        if (!categoryInput.trim()) {
            setCategoryError("Category name is required");
            hasError = true;
        }

        if (!selectedGroupId) {
            setCountryError("Group is required");
            hasError = true;
        }

        return !hasError;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        const payload = {
            category_name: categoryInput.trim(),
            color: categoryHexColorInput,
            group_id: selectedGroupId!, // we already checked it's not null
        };

        if (productToEdit && productToEdit.id !== undefined) {
            if (!canEdit) {
                toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                return;
            }
            await updateCategory(payload, productToEdit.id, setLoading, clearForm);
        } else {
            if (!canAdd) {
                toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                return;
            }
            await createCategory(payload, setLoading, clearForm);
        }
        handleRefreshCategory();
        onHide();
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
                            {/* Country / Group Dropdown */}
                            <div className="col-12 mt-1">
                                <label className="form-check-label">
                                    <h6>
                                        Product Group<span className="text-danger">*</span>
                                    </h6>
                                </label>
                                <CustomSearchDropdown
                                    options={countryOptions}
                                    value={
                                        countryOptions.find(
                                            (option) => option.value === String(selectedGroupId)
                                        ) || null
                                    }
                                    onChange={handleCountryChange}
                                    className="w-100"
                                    placeholder="Select Group..."
                                />
                                {countryError && (
                                    <span className="text-danger d-block mt-1">{countryError}</span>
                                )}
                            </div>

                            {/* Category Name + Color */}
                            <label className="form-check-label mt-3" htmlFor="flexCheckDefault">
                                <h6>
                                    Enter Product Category Name <span className="text-danger">*</span>
                                </h6>
                            </label>
                            <div className="col-12 d-flex">
                                <div className="col-11">
                                    <div className="search-bar">
                                        <div className="add-source-of-type-section">
                                            <input
                                                type="text"
                                                title="Category"
                                                maxLength={BIG_TEXT_LENGTH}
                                                placeholder="Add Product category"
                                                value={categoryInput}
                                                onChange={(e) => handleChange(e)}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="col-1 d-flex justify-content-end align-items-center mx-1">
                                    <input
                                        type="color"
                                        value={categoryHexColorInput}
                                        className="mx-1"
                                        onChange={(e) => handleChangeHexColor(e)}
                                        style={{ width: "25px", height: '25px' }}
                                    />
                                </div>
                            </div>

                            <div className="col-12">
                                {categoryError && (
                                    <span className="text-danger">{categoryError}</span>
                                )}
                            </div>

                            {productToEdit && (
                                <div className="col-12 mt-3">
                                    <label className="form-check-label">
                                        <h6>Category Image</h6>
                                    </label>
                                    <div className="d-flex align-items-center">
                                        {imagePreviewUrl && (
                                            <img
                                                src={imagePreviewUrl}
                                                alt="Category"
                                                style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 4, marginRight: "10px" }}
                                            />
                                        )}
                                        <button
                                            type="button"
                                            className="modal-button1"
                                            disabled={uploadingImage}
                                            onClick={() => imageInputRef.current?.click()}
                                        >
                                            {uploadingImage ? "Uploading..." : imagePreviewUrl ? "Replace" : "Upload"}
                                        </button>
                                        {imagePreviewUrl && (
                                            <button
                                                type="button"
                                                className="modal-button1 mx-2"
                                                onClick={handleRemoveImage}
                                            >
                                                Remove
                                            </button>
                                        )}
                                        <input
                                            ref={imageInputRef}
                                            type="file"
                                            accept="image/png,image/jpeg,image/jpg"
                                            style={{ display: "none" }}
                                            onChange={handleImageChange}
                                        />
                                    </div>
                                </div>
                            )}
                            {!productToEdit && (
                                <div className="col-12 mt-3 text-muted" style={{ fontSize: "0.85em" }}>
                                    Save the category first, then edit it again to add a photo.
                                </div>
                            )}
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
                                onClick={handleSubmit}
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

export default CreateCategoryView;