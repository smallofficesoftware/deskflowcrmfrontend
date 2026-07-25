import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { axiosInstance } from "../../../../../services/axiosInstance";
import { ICustomInquiryFromList } from "./CustomInquiryFromController";

const CustomInquiryAddDataSource = ({
  show,
  onHide,
  passDataInAddItem,
}: {
  show: boolean;
  onHide: () => void;
  passDataInAddItem: ICustomInquiryFromList | undefined;
}) => {
  const getUUID = localStorage.getItem("UUID");
  const token = localStorage.getItem("token");

  const [dataSource, setDataSource] = useState<string>("");
  const [sources, setSources] = useState<{ id: number; data_sorce: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: any) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleAddSource();
      }
    };

    if (show) {
      document.addEventListener("keydown", handleKeyDown);
    } else {
      document.removeEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [show, dataSource]);

  // Fetch data sources from server
  const getDatavalues = async () => {
    if (!passDataInAddItem?.id) return;

    const requestData = {
      a_application_login_id: getUUID,
      custom_field_master_id: passDataInAddItem?.id,
      isDelete: 0,
    };

    try {
      setLoading(true);
      const response = await axiosInstance.post("getCustomFieldDatavalues", requestData);

      let newSources: { id: number; data_sorce: string }[] = [];

      if (response.data && Array.isArray(response.data)) {
        newSources = response.data
          .map((item: any) => ({
            id: item.id,
            data_sorce: item.data_sorce?.trim() || "",
          }))
          .filter((item: { id: number; data_sorce: string }) => item.data_sorce !== "");
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        newSources = response.data.data
          .map((item: any) => ({
            id: item.id,
            data_sorce: item.data_sorce?.trim() || "",
          }))
          .filter((item: { id: number; data_sorce: string }) => item.data_sorce !== "");
      }

      setSources(newSources);
    } catch (error) {
      console.error("Error fetching sources:", error);
      toast.error("Failed to load sources");
    } finally {
      setLoading(false);
    }
  };

  // Load sources when modal opens or ID changes
  useEffect(() => {
    if (show && passDataInAddItem?.id) {
      getDatavalues();
    } else {
      setSources([]);
      setEditIndex(null);
      setDataSource("");
    }
  }, [show, passDataInAddItem?.id]);

  // Unified server mutation function
  const mutateServer = async (
    operation: "add" | "edit" | "delete",
    payload?: any
  ): Promise<boolean> => {
    if (!passDataInAddItem?.id) return false;

    let requestData: any = {
      a_application_login_id: getUUID,
      custom_field_master_id: passDataInAddItem.id,
    };

    if (operation === "add") {
      requestData.data_source = payload?.trim();
      requestData.editValue = 0;
    } else if (operation === "edit") {
      requestData.data_source = payload?.data_sorce?.trim();
      requestData.editValue = payload?.id;
    } else if (operation === "delete") {
      requestData.deleteValue = payload;
    }

    try {
      setLoading(true);
      const response = await axiosInstance.post("createCustomFieldDatavalues", requestData);

      if (response.status === 200) {
        toast.success(
          operation === "add"
            ? "Source Added Successfully"
            : operation === "edit"
              ? "Source Updated Successfully"
              : "Source Deleted Successfully"
        );
        return true;
      } else {
        toast.error(`Failed to ${operation} source`);
        return false;
      }
    } catch (error) {
      console.error(`Error ${operation}ing source:`, error);
      toast.error(`Error ${operation}ing source`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Handle Add or Update
  const handleAddSource = async () => {
    const isImageURLType = passDataInAddItem?.data_type === 11 || passDataInAddItem?.data_type === 12;
    const finalSource = isImageURLType ? dataSource : dataSource.trim();

    if (!finalSource) return;

    // Restrict multiple entries for image URL types
    if (isImageURLType && sources.length >= 1 && editIndex === null) {
      toast.error("Cannot add more than one source when Data Type is Page_URL");
      return;
    }

    let success = false;

    if (editIndex !== null) {
      // EDIT MODE
      const itemToEdit = sources[editIndex];
      if (itemToEdit.data_sorce === finalSource) {
        setEditIndex(null);
        setDataSource("");
        return;
      }

      success = await mutateServer("edit", {
        id: itemToEdit.id,
        data_sorce: finalSource,
      });

      if (success) {
        setEditIndex(null);
        setDataSource("");
        await getDatavalues(); // REFRESH FROM SERVER
      }
    } else {
      // ADD MODE
      if (sources.some((s) => s.data_sorce === finalSource)) {
        toast.warn("Source already exists");
        return;
      }

      success = await mutateServer("add", finalSource);
      if (success) {
        setDataSource("");
        await getDatavalues(); // REFRESH FROM SERVER
      }
    }
  };

  // Handle Delete
  const handleDeleteById = async (itemId: number) => {
    if (!itemId) return;

    const success = await mutateServer("delete", itemId);
    if (success) {
      await getDatavalues(); // REFRESH FROM SERVER
    }
  };

  // Prefill input when editing
  const handleChangeInput = (itemId: number, data_sorce: string, index: number) => {
    setDataSource(data_sorce);
    setEditIndex(index);
  };

  return (
    <React.Fragment>
      {show && (
        <div className="modal1">
          <div className="modal-content1" style={{ maxHeight: "80%" }}>
            <span className="close" onClick={onHide}>
              ×
            </span>
            <h2 className="modal-title1 form_header_text">
              Add Source: {passDataInAddItem?.title}
            </h2>

            <div className="m-title-2 col-12">
              <div className="head">
                <div className="search-bar">
                  <div className="add-source-of-type-section">
                    <input
                      type="text"
                      title="Source"
                      placeholder="Source"
                      value={dataSource}
                      onChange={(e) => setDataSource(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div
                    onClick={handleAddSource}
                    style={{ cursor: loading ? "not-allowed" : "pointer" }}
                    className="px-3"
                  >
                    {loading ? (
                      "Processing..."
                    ) : editIndex !== null ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="26px"
                        viewBox="0 -960 960 960"
                        width="26px"
                        fill="#5f6368"
                      >
                        <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />
                      </svg>
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
                  </div>
                </div>

                <div
                  className="source-of-type-list-grid-block"
                  style={{ overflowX: "scroll", maxHeight: "350px" }}
                >
                  {loading && sources.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "20px" }}>
                      Loading sources...
                    </div>
                  ) : sources.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "20px", color: "#888" }}>
                      No data sources added yet.
                    </div>
                  ) : (
                    <div className="source-of-type-list-grid-main">
                      <table className="table table-hover" border={0}>
                        <thead>
                          <tr>
                            <th className="">Data Sources</th>
                            <th className="text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="text-center">
                          {sources.map((item, index) => (
                            <tr key={item.id}>
                              <td className="text-start">
                                <span>{item.data_sorce}</span>
                              </td>
                              <td className="text-center">
                                <span
                                  style={{ cursor: "pointer" }}
                                  onClick={() => handleChangeInput(item.id, item.data_sorce, index)}
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
                                    />
                                  </svg>
                                </span>
                                <span
                                  style={{ cursor: "pointer" }}
                                  onClick={() => handleDeleteById(item.id)}
                                >
                                  <svg
                                    viewBox="0 -960 960 960"
                                    width="22px"
                                    fill="currentColor"
                                  >
                                    <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
                                  </svg>
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

export default CustomInquiryAddDataSource;