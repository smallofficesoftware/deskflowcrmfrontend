import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../helpers/AppType";
import { axiosInstance } from "../../../../services/axiosInstance";
import { ICountriesView } from "../../../left-side/header/Setting/countries/CountriesController";


export const fetchCountriesApi = async (
  setCountriesList: TReactSetState<ICountriesView[]>,
  setLoading: TReactSetState<boolean>,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    table: "a_countries",
    columns: "id, country_name, country_code,country_iso",
    where: ["isDelete=0"],
    request_flag: 0,
    order: `{"id":"DESC"}`,
  };
  try {
    const data = await axiosInstance.post("commonGet", requestData);
    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      setLoading(false);
      setCountriesList([]);
    }
    setLoading(true);
    setCountriesList(data.data.data);
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setTimeout(() => {
      setLoading(false); // Set loading to false after minimum time
    }, 1000); // 1000 milliseconds (1 seconds)
  }
};