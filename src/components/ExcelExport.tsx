
import * as XLSX from "xlsx";
import { formatDate } from "../common/SharedFunction";

interface ExcelExportProps {
  data: Array<object>;
  columns?: Array<string>; // Marking columns as optional
  fileName: string;
}

const exportToExcel = ({ data, columns = [], fileName }: ExcelExportProps) => {
  const columnHeaders =
    columns.length === 0 && data.length > 0 ? Object.keys(data[0]) : columns;

  const worksheet = XLSX.utils.json_to_sheet(data, { header: columnHeaders });
  const attacheDate = formatDate(new Date()) ? formatDate(new Date()) : "";

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  XLSX.writeFile(workbook, `${fileName + attacheDate}.xlsx`);
};

export default exportToExcel;
