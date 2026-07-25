import { Dispatch, SetStateAction, useEffect, useState } from "react";
import JsBarcode from "jsbarcode";
import { jsPDF } from "jspdf";
import { fetchCurrencyIDOfCompany } from "./ProductController";

interface PrintBarcodeProps {
  setIsOpenBarcodeModal: Dispatch<SetStateAction<boolean>>;
  productBarcode: string;
  productName?: string;
  productPrice?: string;
  productCode?: string;
}

interface GenerateBarcodePDFOptions {
  barcodeValue: string; // e.g. "1752568623579"
  quantity: number; // number of copies
  showName?: boolean;
  showPrice?: boolean;
  showPeoductCode?: boolean;
  productName?: string; // e.g. "Sample Product"
  productPrice?: string; // e.g. "199.00"
  productCode?: string; // e.g. "tools4"
  currency: string;
}

export const generateBarcodePDF = async ({
  barcodeValue,
  quantity,
  showName = true,
  showPrice = true,
  showPeoductCode = true,
  productName = "",
  productPrice = "",
  productCode = "",
  currency = "INR",
}: GenerateBarcodePDFOptions) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const margin = 10;
  const cols = 4;
  const pageWidth = 297 - 2 * margin;
  const colWidth = pageWidth / cols;
  const barcodeHeight = 30;
  const rowHeight = 60;
  const bottomPadding = 6;
  let rowIndex = 0;

  const drawBarcodeCell = (i: number) => {
    const colIndex = i % cols;
    const x = margin + colIndex * colWidth;
    const y = margin + rowIndex * rowHeight;
    const textY = y + 6;
    const barcodeY = y + 12;
    const bottomY = barcodeY + barcodeHeight + 6;

    // border with bottom padding removed
    doc.setDrawColor(0);
    doc.setLineWidth(0.2);
    doc.rect(x, y, colWidth, rowHeight - bottomPadding);

    // name + code, truncated to fit
    doc.setFontSize(11);
    const namePart = showName && productName ? productName : "";
    const codePart = showPeoductCode && productCode ? ` (${productCode})` : "";
    let truncatedName = namePart;
    const maxWidth = colWidth - 6;
    if (doc.getTextWidth(truncatedName + codePart) > maxWidth) {
      while (
        truncatedName.length &&
        doc.getTextWidth(truncatedName + "…" + codePart) > maxWidth
      ) {
        truncatedName = truncatedName.slice(0, -1);
      }
      truncatedName = truncatedName.trimEnd() + "…";
    }
    doc.text(`${truncatedName}${codePart}`, x + colWidth / 2, textY, {
      align: "center",
    });

    // barcode image
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, barcodeValue, {
      format: "CODE128",
      width: 1.2,
      height: barcodeHeight,
      displayValue: false,
      margin: 0,
    });
    const imgData = canvas.toDataURL("image/png");
    doc.addImage(imgData, "PNG", x + 5, barcodeY, colWidth - 10, barcodeHeight);

    // bottom row: code + optional price
    if (showPrice && productPrice) {
      doc.text(String(barcodeValue), x + 4, bottomY);
      doc.text(`${productPrice} ${currency}`, x + colWidth - 4, bottomY, {
        align: "right",
      });
    } else {
      doc.text(String(barcodeValue), x + colWidth / 2, bottomY, {
        align: "center",
      });
    }

    // advance row/page
    if ((i + 1) % cols === 0) {
      rowIndex++;
      if (margin + (rowIndex + 1) * rowHeight > 210) {
        doc.addPage();
        rowIndex = 0;
      }
    }
  };

  for (let i = 0; i < quantity; i++) {
    drawBarcodeCell(i);
  }
  doc.autoPrint();
  const blobUrl = URL.createObjectURL(doc.output("blob"));
  window.open(blobUrl, "_blank");
};

const PrintBarcode = ({
  setIsOpenBarcodeModal,
  productName,
  productPrice,
  productCode,
  productBarcode,
}: PrintBarcodeProps) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [barcodes, setBarcodes] = useState<string[]>([]);
  const [showName, setShowName] = useState<boolean>(false);
  const [showPrice, setShowPrice] = useState<boolean>(false);
  const [showCode, setShowCode] = useState<boolean>(false);
  const [currency, setCurrency] = useState<any>("");
  const getCurrency = async () => {
    setCurrency(await fetchCurrencyIDOfCompany());
  };
  useEffect(() => {
    getCurrency();
  }, [setIsOpenBarcodeModal]);
  const generateBarcodes = () => {
    if (!productBarcode.trim()) return;
    const generated = Array.from({ length: quantity }, () =>
      productBarcode.trim()
    );
    setBarcodes(generated);
  };
  useEffect(() => {
    generateBarcodes();
  }, [productBarcode, quantity]);
  return (
    <div className="modal1">
      <div className="modal-content1 container-fluid">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="col-8">
            <h2 className="modal-title1 form_header_text ">Print Barcode</h2>
          </div>
          <div className="col-4">
            <span
               className="close ms-3 pb-3"
                  style={{ cursor: "pointer" }}
              onClick={() => setIsOpenBarcodeModal(false)}
            >
              &times;
            </span>
          </div>
        </div>
        <div className="row mb-3 d-flex">
          <div className="col-md-4 col-sm-6 mb-3">
            <label className="form-label fw-semibold">Barcode Print Qty</label>
            <input
              type="number"
              className="form-control px-3 py-2 rounded-1"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            />
          </div>
          <div className="col-md-8 col-sm-6">
            <label className="form-label fw-semibold">
              Information To Print
            </label>
            <div className="d-flex flex-wrap gap-3 align-items-center">
              <div className="form-check">
                <input
                  className="custom-checkbox"
                  type="checkbox"
                  id="toggleName"
                  checked={showName}
                  onChange={() => setShowName(!showName)}
                />
                <label className="form-check-label ms-2" htmlFor="toggleName">
                  Product Name
                </label>
              </div>
              <div className="form-check">
                <input
                  className="custom-checkbox"
                  type="checkbox"
                  id="togglePrice"
                  checked={showPrice}
                  onChange={() => setShowPrice(!showPrice)}
                />
                <label className="form-check-label ms-2" htmlFor="togglePrice">
                  Product Price
                </label>
              </div>
              <div className="form-check">
                <input
                  className="custom-checkbox"
                  type="checkbox"
                  id="toggleCode"
                  checked={showCode}
                  onChange={() => setShowCode(!showCode)}
                />
                <label className="form-check-label ms-2" htmlFor="toggleCode">
                  Product Code
                </label>
              </div>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-12 text-end">
            <button
              type="submit"
              className="btn btn-primary px-4 py-2 text-light rounded-1"
              style={{ backgroundColor: "#f58634" }}
              onClick={() => {
                generateBarcodePDF({
                  barcodeValue: productBarcode,
                  quantity,
                  showName,
                  showPrice,
                  showPeoductCode: showCode,
                  productName,
                  productPrice,
                  productCode,
                  currency,
                });
              }}
            >
              Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintBarcode;
