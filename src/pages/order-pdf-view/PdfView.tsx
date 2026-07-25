import React, { useEffect, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import OrderPdfViewV1 from "./OrderPdfViewV1";
import smallOfficeLog from "../../assets/images/smalll_office_log1.png";
import { useParams } from "react-router-dom";
import {
  fetchOrderByForPdfIdApi,
  IOrderItemPdf,
  ItemDetails,
  orderTypesListPdf,
} from "./OrderPdfController";
import { formatNumber } from "../../common/SharedFunction";
import { numberToWordsCurrency } from "../../utils/numberToWordsCurrency";
declare module "jspdf" {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
  }
}
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: Record<string, any>) => void;
  }
}
const PdfView: React.FC = () => {
  const { id } = useParams();
  const [orderPdfViewById, setOrderPdfViewById] = useState<ItemDetails>();
  const invoiceRef = useRef<HTMLDivElement | null>(null);
  const hasDownloaded = useRef(false);
  useEffect(() => {
    if (!hasDownloaded.current && orderPdfViewById) {
      handleDownloadPdf();
    }
  }, [
    orderPdfViewById?.cart,
    orderPdfViewById?.items,
    orderPdfViewById?.companyDetail,
    orderPdfViewById?.loginDetail,
  ]);
  useEffect(() => {
    fetchOrderByForPdfIdApi(Number(id), setOrderPdfViewById);
  }, [id]);

  const grandTotalInWords = numberToWordsCurrency(
    orderPdfViewById?.cart?.grand_total ?? 0,
    "INR",
  );

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    const data = Array.from({ length: 15 }, (_, index) => {
      const srno = index + 1;
      let description = `Material Number: FRP PIPE NB25 PN10 ${index}`;
      return {
        srno,
        materialNumber: `3917400${index}`,
        description,
        rate: index + 10,
        Discount: index + 10 / 100,
        GST: `${index}GST`,
        quantity: `${(index % 5) + 1} Meter`, // Random quantity for demo
        unitPrice: (index + 1) * 27.62, // Random price for demo
        totalPrice: (index + 1) * 27.62 * 10, // Random total price for demo
      };
    });

    // Table headers
    const tableHeaders = [
      "No",
      "Product Description",
      "HSN Code",
      "Rate",
      "Dis(%)",
      "GST(%)",
      "Net Price",
      "Qty/Unit",
      "Total Price",
    ];
    const tableRows =
      orderPdfViewById &&
      orderPdfViewById?.items.map((item, index) => [
        index + 1,
        item.item_product_name + `\n${item.item_product_description}`,
        "39174000",
        item.item_rate ? formatNumber(item.item_rate, 2) : "",
        item.item_discount_pct ? formatNumber(item.item_discount_pct, 2) : "",
        item.item_gst ? formatNumber(item.item_gst, 2) : "",
        item.item_net_rate ? formatNumber(item.item_net_rate, 2) : "",
        item.item_qty + ` \n${item.item_unit_name}`,
        item.item_total ? formatNumber(item.item_total) : "",
      ]);
    const headerImageUrl = orderPdfViewById?.companyDetail.header_img
      ? orderPdfViewById?.companyDetail.header_img
      : smallOfficeLog; // Replace with your header image URL
    const footerImageUrl = orderPdfViewById?.companyDetail.footer_img
      ? orderPdfViewById?.companyDetail.footer_img
      : smallOfficeLog;
    const signImageUrl = orderPdfViewById?.companyDetail.company_sign
      ? orderPdfViewById?.companyDetail.company_sign
      : smallOfficeLog;

    const pageWidth = doc.internal.pageSize.width; // Full page width
    const margin = 10; // Same margin as the table
    const tableWidth = pageWidth - margin * 2; // Calculate the table width

    const addHeader = () => {
      const headerWidth = pageWidth - margin * 2; // Match the header width to the table
      doc.addImage(
        headerImageUrl,
        "PNG",
        margin, // Align with the left margin
        5, // Vertical position
        headerWidth, // Set dynamic header width
        20, // Fixed height for the header
      );
    };

    // Add footer with image and page number
    const addFooter = (data: any) => {
      const pageCount = doc.internal.pages.length - 1; // Subtract 1 because the `pages` array includes an empty element at index 0
      const pageNumber = doc.internal.pages.length - 1; // Current page is the last one adde
      // Position for the footer image
      const footerY = doc.internal.pageSize.height - 25; // Adjust Y-coordinate of the footer

      // Add footer image first
      doc.addImage(
        footerImageUrl,
        "PNG",
        10,
        footerY,
        doc.internal.pageSize.width - 20,
        15,
      );

      // Now add the page number below the footer image
      const pageTextY = footerY + 20; // Position for the page number below the footer image

      // Set font size for page number
      doc.setFontSize(10);
      doc.text(
        `Page ${pageNumber} of ${pageCount}`,
        doc.internal.pageSize.width - 50, // Adjust position
        pageTextY,
      );
    };
    doc.autoTable({
      startY: 30, // Start after the Bank Info

      body: [["", ""]],
      theme: "grid",
      columnStyles: {
        0: { halign: "left" },
        1: { halign: "left" },
      },

      styles: {
        font: "Poppins",
        fontSize: 10,
      },
      margin: { left: margin, right: margin }, // Table margins

      didDrawCell: function (data: {
        row?: any;
        column?: any;
        doc?: any;
        cell?: any;
      }) {
        const { doc, cell } = data;
        if (data.column.index === 0) {
          const x = cell.x + 2; // Add padding
          let y = cell.y + 5; // Start below the top edge
          const maxWidth = cell.width - 4; // Adjust for padding

          const fromData = "TECHMECH COMPOSITES PRIVATE LIMITED";
          const AddresData =
            "Plot 18, R K Industrial Estate, Near Bamanbor GIDC, Hirasar, Rajkot 360023, Gujarat | India";
          const lines = [{ text: "Type", fontStyle: "bold" }];

          lines.forEach((line) => {
            doc.setFont("Poppins", line.fontStyle);
            const wrappedText = doc.splitTextToSize(line.text, maxWidth);

            wrappedText.forEach((textLine: any) => {
              doc.text(textLine, x, y);
              y += 5; // Adjust line spacing
            });
          });
          cell.text = "";
        }
        if (data.column.index === 1) {
          const x = cell.x + 2; // Add padding
          let y = cell.y + 5; // Start below the top edge
          const maxWidth = cell.width - 4; // Adjust for padding

          const fromData = "TECHMECH COMPOSITES PRIVATE LIMITED";
          const AddresData =
            "Plot 18, R K Industrial Estate, Near Bamanbor GIDC, Hirasar, Rajkot 360023, Gujarat | India";
          const lines = [
            {
              text: `${
                orderTypesListPdf?.find(
                  (option) => Number(option.id) === orderPdfViewById?.cart.type,
                )?.type || ""
              }`,
              fontStyle: "normal",
            },
          ];

          lines.forEach((line) => {
            doc.setFont("Poppins", line.fontStyle);
            const wrappedText = doc.splitTextToSize(line.text, maxWidth);

            wrappedText.forEach((textLine: any) => {
              doc.text(textLine, x, y);
              y += 5; // Adjust line spacing
            });
          });
          cell.text = "";
        }
      },
    });
    doc.autoTable({
      startY: doc.lastAutoTable.finalY, // Start after the Bank Info

      body: [
        [
          "",
          "",
          "",
          //  [],
          //  [],
          //  [],
          //  []
        ],
      ],
      theme: "grid",
      columnStyles: {
        0: { halign: "left", cellWidth: 65, minCellHeight: 100 },
        1: { halign: "left", cellWidth: 65 },
        2: { halign: "left", cellWidth: 60 },
      },

      styles: {
        font: "Poppins",
        fontSize: 10,
      },
      margin: { left: margin, right: margin }, // Table margins

      didDrawCell: function (data: {
        row?: any;
        column?: any;
        doc?: any;
        cell?: any;
      }) {
        const { doc, cell } = data;
        if (data.column.index === 1) {
          const x = cell.x + 2; // Add padding
          let y = cell.y + 5; // Start below the top edge
          const maxWidth = cell.width - 4; // Adjust for padding

          const fromData = "TECHMECH COMPOSITES PRIVATE LIMITED";
          const AddresData =
            "Plot 18, R K Industrial Estate, Near Bamanbor GIDC, Hirasar, Rajkot 360023, Gujarat | India";
          const lines = [
            { text: "TO,", fontStyle: "bold" },
            {
              text: orderPdfViewById?.cart.to_customer_name,
              fontStyle: "normal",
            },
            { text: "Billing Address:", fontStyle: "bold" },
            {
              text: orderPdfViewById?.cart.Address,
              fontStyle: "normal",
            },
            { text: "Shipping Address:", fontStyle: "bold" },
            {
              text: orderPdfViewById?.cart.shipping_address,
              fontStyle: "normal",
            },
            { text: "State of Supply:", fontStyle: "bold" },
            {
              text: ``,
              fontStyle: "normal",
            },
            { text: "GSTIN No.:", fontStyle: "bold" },
            {
              text: orderPdfViewById?.cart.to_customer_gst_number,
              fontStyle: "normal",
            },
          ];

          lines.forEach((line) => {
            doc.setFont("Poppins", line.fontStyle);
            const wrappedText = doc.splitTextToSize(line.text, maxWidth);

            wrappedText.forEach((textLine: any) => {
              doc.text(textLine, x, y);
              y += 5; // Adjust line spacing
            });
          });
          cell.text = "";
        }

        if (data.column.index === 0) {
          const x = cell.x + 2; // Add padding
          let y = cell.y + 5; // Start below the top edge
          const maxWidth = cell.width - 4; // Adjust for padding

          const fromData = "TECHMECH COMPOSITES PRIVATE LIMITED";
          const AddresData =
            "Plot 18, R K Industrial Estate, Near Bamanbor GIDC, Hirasar, Rajkot 360023, Gujarat | India";
          const lines = [
            { text: "FROM,", fontStyle: "bold" },
            {
              text: `${orderPdfViewById?.companyDetail.company_name}`,
              fontStyle: "normal",
            },
            { text: "company contact No.", fontStyle: "bold" },
            {
              text: `${orderPdfViewById?.companyDetail.company_contact}`,
              fontStyle: "normal",
            },
            { text: "Address:", fontStyle: "bold" },
            {
              text: `${orderPdfViewById?.companyDetail.address}`,
              fontStyle: "normal",
            },
            { text: "GSTIN No.:", fontStyle: "bold" },
            {
              text: `${orderPdfViewById?.companyDetail.gst_number}`,
              fontStyle: "normal",
            },
          ];

          lines.forEach((line) => {
            doc.setFont("Poppins", line.fontStyle);
            const wrappedText = doc.splitTextToSize(line.text, maxWidth);

            wrappedText.forEach((textLine: any) => {
              doc.text(textLine, x, y);
              y += 5;
            });
          });
          cell.text = "";
        }

        if (data.column.index === 2) {
          const x = cell.x + 2; // Add padding
          let y = cell.y + 5; // Start below the top edge
          const maxWidth = cell.width - 4; // Adjust for padding

          const fromData = "TECHMECH COMPOSITES PRIVATE LIMITED";
          const AddresData =
            "Plot 18, R K Industrial Estate, Near Bamanbor GIDC, Hirasar, Rajkot 360023, Gujarat | India";
          const lines = [
            {
              text: `Order No. ${orderPdfViewById?.cart.cart_number}`,
              fontStyle: "bold",
            },
            {
              text: `Order Date : ${orderPdfViewById?.cart.cart_date}`,
              fontStyle: "normal",
            },
            { text: "Transport Detail :", fontStyle: "bold" },
            {
              text: `Contact Person : ${orderPdfViewById?.loginDetail.username}`,
              fontStyle: "normal",
            },
            { text: "Category", fontStyle: "bold" },
            // { text: "24AAJCT3569K1ZV", fontStyle: "normal" },
          ];

          lines.forEach((line) => {
            doc.setFont("Poppins", line.fontStyle);

            const wrappedText = doc.splitTextToSize(line.text, maxWidth);

            wrappedText.forEach((textLine: any) => {
              doc.text(textLine, x, y);
              y += 5;
            });
          });

          cell.text = "";
        }
      },
    });
    // Generate the table with autoTable
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY, // Start position below the header
      head: [tableHeaders], // Table headers
      body: tableRows, // Existing table rows

      theme: "grid", // Theme (use 'plain', 'grid', or 'striped')
      margin: { top: 30, left: margin, right: margin, bottom: 50 }, // Table margins

      didDrawPage: (data) => {
        const pageWidth = doc.internal.pageSize.width; // Get the full page width
        const marginLeft = data.settings.margin.left; // Left margin from autoTable
        const marginRight = data.settings.margin.right; // Right margin from autoTable
        const tableWidth = pageWidth - marginLeft - marginRight; // Calculate table width

        addHeader();

        addFooter(data);
      },
      columnStyles: {
        0: { halign: "left" },
        1: { halign: "left", cellWidth: 50 },
        2: { halign: "left" },
        3: { halign: "right" },
        4: { halign: "right" },
        5: { halign: "right" },
        6: { halign: "right" },
        7: { halign: "right" },
        8: { halign: "right" },
      },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY,
      body: [
        [
          {
            content: "Total Quantity",
            colSpan: 0,
            styles: { halign: "left", fontStyle: "bold", cellWidth: 128 },
          },
          {
            content: orderPdfViewById?.cart.total_qty,
            colSpan: 0,
            styles: { halign: "right" },
          },
          "",
        ],
        [
          {
            content: "",
            colSpan: 0,
            styles: { halign: "left", fontStyle: "bold" },
          },
          "Sub Total",
          {
            content: orderPdfViewById?.cart.total_amt
              ? formatNumber(orderPdfViewById?.cart.total_amt)
              : "",
            colSpan: 0,
            styles: { halign: "right" },
          },
        ],
        [
          {
            content: `${orderPdfViewById?.companyDetail.bank_detail.replace(/<br\s*\/?>/g, "\n")}\n \nTerms and condition: \n ${orderPdfViewById?.cart.cart_terms_and_condition.replace(/<br\s*\/?>/g, "\n") || "N/A"} \n \nContact Sales Person : ${orderPdfViewById?.loginDetail.username} ${orderPdfViewById?.loginDetail.recovery_mobile}`,

            colSpan: 0,
            styles: { halign: "left", fontStyle: "bold" },
            rowSpan: 8,
          },
          { content: "Discount (%)", rowSpan: 0 },
          {
            content: orderPdfViewById?.cart.discount_pct
              ? formatNumber(orderPdfViewById?.cart.discount_pct)
              : "",
            rowSpan: 0,
            styles: { halign: "right" },
          },
        ],
        [
          { content: "Packing Forwarding charge	", rowSpan: 0 },
          {
            content: orderPdfViewById?.cart.packing_forwarding_charge
              ? formatNumber(orderPdfViewById?.cart.packing_forwarding_charge)
              : "",
            styles: { halign: "right" },
          },
        ],
        [
          { content: "Transport charge	", rowSpan: 0 },
          {
            content: orderPdfViewById?.cart.transport_charge
              ? formatNumber(orderPdfViewById?.cart.transport_charge)
              : "",
            styles: { halign: "right" },
          },
        ],
        [
          { content: "Taxable Amount	", rowSpan: 0 },
          {
            content: orderPdfViewById?.cart.taxable_amt
              ? formatNumber(orderPdfViewById?.cart.taxable_amt, 2)
              : "",
            styles: { halign: "right" },
          },
        ],
        [
          { content: "GST", rowSpan: 0 },
          {
            content: orderPdfViewById?.cart.gst_amt
              ? formatNumber(orderPdfViewById?.cart.gst_amt)
              : "",
            styles: { halign: "right" },
          },
        ],
        [
          { content: "TCS", rowSpan: 0 },
          {
            content: orderPdfViewById?.cart.tcs_amt
              ? formatNumber(orderPdfViewById?.cart.tcs_amt)
              : "",
            styles: { halign: "right" },
          },
        ],
        [],
        [],

        [
          {
            content: `Grand Total In Words : ${grandTotalInWords}`,
            colSpan: 0,
            styles: { halign: "left", fontStyle: "bold" },
          },
          "Round Off ",
          {
            content: orderPdfViewById?.cart.round_off
              ? formatNumber(orderPdfViewById?.cart.round_off)
              : " ",
            styles: { halign: "right" },
          },
        ],
        [
          {
            content: "Note : KINDLY RELEASE PAYMENT FOR DISPATCH CLEARANCE",
            colSpan: 0,
            styles: { halign: "left", fontStyle: "bold" },
          },
          { content: "Grand Total", styles: { fillColor: "#808080" } },
          {
            content: orderPdfViewById?.cart.grand_total
              ? formatNumber(orderPdfViewById?.cart.grand_total)
              : "",
            styles: { fillColor: "#808080", halign: "right" },
          },
        ],
      ],
      theme: "grid",
      margin: { top: 30, left: margin, right: margin, bottom: 30 }, // Table margins

      didDrawPage: (data) => {
        const pageWidth = doc.internal.pageSize.width;
        const marginLeft = data.settings.margin.left;
        const marginRight = data.settings.margin.right;
        const tableWidth = pageWidth - marginLeft - marginRight;
        addHeader();

        addFooter(data);
      },
    });
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY,
      body: [
        [
          "HSN/SAC",
          { content: "Taxable Value ", colSpan: 0 },
          "IGST% Rate",
          "IGST Amount",
          "CGST% Rate",
          "CGST Amount",
          "SGST% Rate",
          "SGST Amount",
        ],
        ["39174000", "2,825,634.34", "18%", "508,614.19", "", "", "", ""],
        ["Total", "2,825,634.34", "", "508,614.19", "", "0.00", "", "0.00"],
      ],
      theme: "grid",
      margin: { top: 30, left: margin, right: margin, bottom: 50 },
      didDrawPage: (data) => {
        const pageWidth = doc.internal.pageSize.width; // Get the full page width
        const marginLeft = data.settings.margin.left; // Left margin from autoTable
        const marginRight = data.settings.margin.right; // Right margin from autoTable
        const tableWidth = pageWidth - marginLeft - marginRight; // Calculate table width
        addHeader();

        addFooter(data);
      },
    });

    // Save the PDF
    doc.save("table_with_images.pdf");
  };

  return (
    <div>
      {/* <h1>Invoice Example</h1> */}

      {/* Pass generatePDF function and invoiceRef to the child component */}
      {/* <OrderPdfViewV1 generatePDF={generatePDF} invoiceRef={invoiceRef} /> */}
      {/* {id} */}
      {/* <button
        onClick={handleDownloadPdf}
        style={{
          padding: "10px 20px",
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Download Table with Header & Footer Images
      </button> */}
    </div>
  );
};

export default PdfView;
