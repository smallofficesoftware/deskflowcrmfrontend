import { toast } from 'react-toastify';
import { MESSAGE_UNKNOWN_ERROR_OCCURRED } from '../../../../helpers/AppConstants';
import { axiosInstance } from '../../../../services/axiosInstance';

export interface IVisitItem {
  id: number;
  visit_type_id: number;
  company_masters_id: number;
  a_application_login_id: number;
  remark: string;
  visit_image: string;
  reference_table: string;
  reference_id: number;
  start_date: string;
  end_date: string | null;
  contact_id: number;
  person_name: string;
  created_date_time: string;
  s_timestemp: string;
  isDelete: number;
  isActive: number;
  visit_column_number_1: number;
  visit_column_number_2: number;
  visit_column_number_3: number;
  visit_column_number_4: number;
  visit_column_number_5: number;
  visit_column_text_1: string;
  visit_column_text_2: string;
  visit_column_text_3: string;
  visit_column_text_4: string;
  visit_column_text_5: string;
  visit_column_text_area_1: string;
  visit_column_text_area_2: string;
  visit_column_text_area_3: string;
  visit_column_text_area_4: string;
  visit_column_text_area_5: string;
  visit_column_date_1: string;
  visit_column_date_2: string;
  visit_column_date_3: string;
  visit_column_date_4: string;
  visit_column_date_5: string;
  visit_column_date_and_time_1: string | null;
  visit_column_date_and_time_2: string | null;
  visit_column_date_and_time_3: string | null;
  visit_column_date_and_time_4: string | null;
  visit_column_date_and_time_5: string | null;
  visit_column_time_1: string;
  visit_column_time_2: string;
  visit_column_time_3: string;
  visit_column_time_4: string;
  visit_column_time_5: string;
  visit_column_switch_1: number;
  visit_column_switch_2: number;
  visit_column_switch_3: number;
  visit_column_switch_4: number;
  visit_column_switch_5: number;
  visit_column_decimal_1: number;
  visit_column_decimal_2: number;
  visit_column_decimal_3: number;
  visit_column_decimal_4: number;
  visit_column_decimal_5: number;
  visit_column_dropdown_1: string;
  visit_column_dropdown_2: string;
  visit_column_dropdown_3: string;
  visit_column_dropdown_4: string;
  visit_column_dropdown_5: string;
  visit_column_radio_1: string;
  visit_column_radio_2: string;
  visit_column_radio_3: string;
  visit_column_radio_4: string;
  visit_column_radio_5: string;
  contactNumber: string;
  customForm?: any[];
  [key: string]: any;

}

export interface IVisitData {
  user: {
    username: string;
    recovery_mobile: string;
  };
  visits: IVisitItem[];
}




export const fetchVisitReport = async (
  selectedDates?: Date[],
  selectedTeamMembers?: string[] | null,
  MobileToken?: string,
  getID?: string,
  MobileFlag?: string,
  selectedStageStatus?: string[] | null,
  ul: number = 0,
  ll: number = 50,
  globalSearch?: string,
  selectedContactId?: string | null,
  referenceWiseContact?: number
): Promise<IVisitData[]> => {

  const token = MobileToken || localStorage.getItem("token");
  const getUUID = getID || localStorage.getItem("UUID");

  if (!token || !getUUID) {
    toast.error("Authentication details are missing");
    return [];
  }

  const requestedData = {
    selectedDates: selectedDates?.map(d =>
      d instanceof Date ? d.toLocaleDateString('sv-SE') : d
    ),
    a_application_login_id: getUUID,
    selectedTeamMembers,
    selectedStageStatus,
    selectedContactId,
    ul,
    ll,
    globalSearch,
    referenceWiseContact: referenceWiseContact
  };

  try {
    const response = await axiosInstance.post("getVisitReport", requestedData);

    if (response.data?.ack !== 1) return [];
    return response.data.data || [];
  } catch (error: any) {
    toast.error(error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    return [];
  }
};


export const exportAllVisitData = async <T>(
  paramiters: (offset: number, limit: number) => Promise<T[]>,
  limit = 500
): Promise<T[]> => {
  let offset = 0;
  let allData: T[] = [];

  while (true) {
    const FatchAllData = await paramiters(offset, limit);

    if (!FatchAllData || FatchAllData.length === 0) break;

    allData = allData.concat(FatchAllData);
    offset += FatchAllData.length;

    if (FatchAllData.length < limit) break;
  }

  return allData;
};

// Function to open visit report in new tab (if needed)
export const openVisitPrint = (id: number) => {
  const baseURL = window.location.origin;
  const token = localStorage.getItem('token');

  if (!token) {
    toast.error('Authentication token is missing');
    return;
  }

  window.open(`${baseURL}/VisitPrintView/${id}`, '_blank');
};

export const handleVisitDownload = async (id: number, handleHide: () => void) => {
  try {
    const token = localStorage.getItem('token');
    const getUUID = localStorage.getItem('UUID');

    if (!token || !getUUID) {
      toast.error('Authentication details are missing');
      return;
    }

    const response = await axiosInstance.post(
      '/visit-pdf', // Adjust endpoint as needed
      { visit_id: id }
    );

    if (response.data.ack === 1) {
      const fileUrl = response.data.data;

      if (!fileUrl) {
        toast.error('File URL not provided');
        return;
      }

      const pdfResponse = await axiosInstance.get(fileUrl, {
        responseType: 'blob',
      });

      const contentDisposition = pdfResponse.headers['content-disposition'];
      let fileName = 'VisitReport.pdf';
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch?.[1]) {
          fileName = fileNameMatch[1];
        }
      }

      const blob = new Blob([pdfResponse.data], {
        type: pdfResponse.headers['content-type'] || 'application/pdf',
      });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      handleHide();
    } else {
      toast.error(response.data.ack_msg || 'Failed to generate PDF');
    }
  } catch (error: any) {
    toast.error(
      error?.response?.data?.message ||
      error?.message ||
      MESSAGE_UNKNOWN_ERROR_OCCURRED
    );
    console.error('Error downloading visit PDF:', error);
  }
};