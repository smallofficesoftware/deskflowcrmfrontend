import React, { forwardRef } from "react";
import "./OrderPdfView.css";
interface InvoiceProps {
  generatePDF: () => void;
  invoiceRef: React.RefObject<HTMLDivElement>;
}
const generateRows = () => {
  const rows = [];
  for (let i = 1; i <= 100; i++) {
    rows.push(
      <tr key={i}>
        <td style={{ border: "1px solid #ddd", padding: "8px" }}>{i}</td>
        <td style={{ border: "1px solid #ddd", padding: "8px" }}>
          Description {i}
        </td>
        <td style={{ border: "1px solid #ddd", padding: "8px" }}>$10.00</td>
        <td style={{ border: "1px solid #ddd", padding: "8px" }}>1</td>
        <td style={{ border: "1px solid #ddd", padding: "8px" }}>
          ${(10 * 1).toFixed(2)}
        </td>
      </tr>
    );
  }
  return rows;
};
const data = Array.from({ length: 100 }, (_, index) => {
  const srno = index + 1;
  let description = `FRP PIPE NB25 PN10 ${index}`;
  if ([19, 42, 41, 21, 46].includes(srno)) {
    description = `hello i am here where are you going\nplease don't go\nwhere are you go on\nshow that you can do 1\n1234567892\n1234567893\n123456789 4\n1234567895\n1234567896\n1234567897\n1234567898\n1234567899\n12345678910\n12345678911\n12345678912\n12345678913\n12345678914\n12345678915\n12345678916\n12345678917\n12345678918\n12345678919\n12345678920\n12345678921\n12345678922\n12345678923\n12345678924\n12345678925\n12345678926 better work\nyes i am here to work`;
  }

  return {
    srno,
    materialNumber: `L747918073401${index}`,
    description,
    quantity: `${(index % 5) + 1} Meter`, // Random quantity for demo
    unitPrice: (index + 1) * 27.62, // Random price for demo
    totalPrice: (index + 1) * 27.62 * 10, // Random total price for demo
  };
});
const OrderPdfViewV1 = forwardRef<HTMLDivElement, InvoiceProps>(
  ({ generatePDF, invoiceRef }, ref) => {
    return (
      <div>
        <div style={{ padding: "10px", border: "1px solid red" }}>
          <div className="print-table">
            <div ref={invoiceRef} className="content" style={{ width: "100%" }}>
              <table className="print-table">
                <tbody>
                  <tr>
                    <td className="main-colspan-class" colSpan={8}>
                      <p style={{ display: " inline-block" }}>
                        PROFORMA INVOICE
                      </p>
                      <p style={{ display: " inline", float: "inline-end" }}>
                        Original
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td
                      className="main-colspan-class"
                      style={{ padding: "0" }}
                      colSpan={8}
                    >
                      <table border={1} width="100%">
                        <tr>
                          <td style={{ verticalAlign: "top", width: "66mm" }}>
                            <span>
                              <b>FROM,</b>
                            </span>
                            <br />
                            <span
                              className="bolde-style"
                              style={{ textTransform: "uppercase" }}
                            >
                              <strong>Masala</strong>
                            </span>
                            <br />

                            <span className="bolde-style">Address :</span>
                            <br />
                            <span
                              style={{ wordWrap: "break-word", width: " 50px" }}
                            ></span>
                            <br />
                            <span>
                              <strong>GSTIN No. : </strong>
                            </span>
                          </td>
                          <td
                            style={{ verticalAlign: " top", width: "66mm" }}
                            className="without_price_check_customer"
                          >
                            <span>
                              <b>TO ,</b>
                            </span>
                            <br />
                            <span
                              className="bolde-style"
                              style={{ textTransform: "uppercase" }}
                            >
                              <strong>RET-3</strong>
                            </span>
                            <br></br>
                            <span className="bolde-style">
                              Billing Address:
                            </span>
                            <br />
                            <span
                              style={{ wordWrap: "break-word", width: "50px" }}
                            >
                              Rajkot
                            </span>
                            <br />
                            <span className="bolde-style">
                              <b>Shipping Address:</b>
                            </span>
                            <br />
                            <span
                              style={{ wordWrap: "break-word", width: "50px" }}
                            >
                              Rajkot
                            </span>
                            <br />
                            <span>
                              <b>State of Supply :</b> Gujarat
                            </span>
                            <br />
                            <span>
                              <strong>GSTIN No. : </strong>
                            </span>
                            <br />
                          </td>
                          <td style={{ verticalAlign: " top", width: "66mm" }}>
                            <span>
                              <b>Order No. : NM/125/24-25 </b>
                            </span>
                            <br />
                            <span>
                              <b>Order Date : 31-Dec-2024 </b>
                            </span>
                            <br />
                            <span>
                              <b>Transport Detail :</b> -
                            </span>
                            <br />
                            <span>
                              <b>Contact Person :</b>Nilesh Mayani
                            </span>
                            <br />
                            <br />
                            <span>
                              <b>PO No. : </b>
                            </span>
                            <br />
                            <span>
                              <b>PO Date : </b>31-Dec-2024
                            </span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr
                    className="text-center"
                    style={{ backgroundColor: "#808080" }}
                  >
                    <th className="text-center">No.</th>
                    <th className="text-center">Particulars</th>
                    <th className="text-center">HSN Code</th>
                    <th className="text-center">Qty/Unit</th>
                    <th className="without_price_check">Price</th>
                    <th className="without_price_check">Rate</th>
                    <th className="without_price_check">Total Amt</th>
                  </tr>
                  {data &&
                    data.map((item, index) => (
                      <tr key={index}>
                        <td className="text-center srno">
                          <strong>{item.srno}</strong>
                        </td>
                        <td
                          className="model"
                          style={{
                            position: "relative",
                            wordBreak: "break-word",
                          }}
                        >
                          Material Number: {item.materialNumber}
                          <br />
                          {item.description}
                        </td>
                        <td className="text-right">
                          {item.unitPrice.toFixed(2)}
                        </td>
                        <td className="text-right">{item.quantity}</td>
                        <td className="text-right without_price_check">
                          {item.unitPrice.toFixed(2)}
                        </td>
                        <td className="text-right without_price_check">
                          ₹{item.totalPrice.toFixed(2)}
                        </td>
                        <td className="text-right without_price_check">
                          ₹11,084.80
                        </td>
                      </tr>
                    ))}
                  <tr style={{ backgroundColor: "lightgray" }}>
                    <td></td>

                    <td></td>

                    <td>
                      <strong>Total</strong>
                    </td>
                    <td className="text-right">1</td>
                    <td className="without_price_check"></td>
                    <td className="without_price_check"></td>
                    <td className="without_price_check"></td>
                  </tr>
                  <tr className="font-size without_price_check">
                    <td
                      colSpan={3}
                      rowSpan={1}
                      style={{
                        verticalAlign: "top",
                        backgroundColor: " #000000",
                      }}
                    >
                      <strong>GSTIN NO. : </strong>
                    </td>
                    <td
                      colSpan={2}
                      className="text-left font-13"
                      style={{ backgroundColor: " #000000" }}
                    >
                      <strong>Sub Total</strong>
                    </td>
                    <td
                      colSpan={3}
                      className="text-right font-13"
                      style={{ backgroundColor: " #000000" }}
                    >
                      <strong>₹ 207.00</strong>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={8} style={{ padding: 0 }}>
                      <table style={{ padding: 0, margin: 0, width: "100%" }}>
                        <tbody>
                          <tr>
                            <td
                              className="without_price_check"
                              rowSpan={8}
                              style={{ verticalAlign: "top" }}
                            >
                              <b>
                                <p>
                                  Bank Name :<br />
                                  Bank Account No :<br />
                                  Bank IFSC Code :<br />
                                  Bank Branch :
                                </p>
                              </b>
                              <span className="font-13">
                                <b>Terms & Condition : </b>
                              </span>
                              <span className="font-13"></span>
                              <br />
                              <span className="font-13">
                                <b>Note: </b>
                              </span>
                              <span className="font-13"></span>
                              <br />
                              <span style={{ color: "red" }}>
                                Contact Sales Person : Neel Mayani 9558955610
                              </span>
                            </td>
                            <td className="text-left without_price_check"></td>
                            <td className="text-right font-13 without_price_check"></td>
                          </tr>
                          <tr>
                            <td className="text-left without_price_check"></td>
                            <td className="text-right font-13 without_price_check"></td>
                          </tr>
                          <tr>
                            <td className="text-left font-13 without_price_check"></td>
                            <td className="text-right font-13 without_price_check"></td>
                          </tr>
                          <tr>
                            <td className="text-left font-13 without_price_check"></td>
                            <td className="text-right font-13 without_price_check"></td>
                          </tr>
                          <tr>
                            <td
                              className="text-left without_price_check"
                              style={{ fontWeight: 700, fontSize: "12px" }}
                            >
                              <strong>Total Taxable Amount</strong>
                            </td>
                            <td className="text-right font-13 without_price_check">
                              <strong>₹ 207.00</strong>
                            </td>
                          </tr>
                          <tr>
                            <td className="text-left without_price_check">
                              <strong>C GST</strong>
                            </td>
                            <td className="text-right without_price_check">
                              <strong>₹ 5.18</strong>
                            </td>
                          </tr>
                          <tr>
                            <td className="text-left without_price_check">
                              <strong>S GST</strong>
                            </td>
                            <td className="text-right without_price_check">
                              <strong>₹ 5.18</strong>
                            </td>
                          </tr>
                          <tr>
                            <td className="without_price_check"></td>
                            <td className="text-right without_price_check">
                              <strong></strong>
                            </td>
                          </tr>
                          <tr className="without_price_check">
                            <td rowSpan={1}>
                              <b>Grand Total In Words</b> : Two Hundred And
                              Seventeen Dollar Only
                            </td>
                            <td>
                              <strong>Round Off</strong>
                            </td>
                            <td className="text-right">
                              <strong>₹ 0.35</strong>
                            </td>
                          </tr>
                          <tr className="without_price_check">
                            <td rowSpan={1}>
                              <b>
                                Note : KINDLY RELEASE PAYMENT FOR DISPATCH
                                CLEARANCE
                              </b>
                            </td>
                            <td
                              style={{
                                backgroundColor: "#669B49",
                                fontSize: "16px",
                              }}
                            >
                              <strong>Grand Total</strong>
                            </td>
                            <td
                              className="text-right"
                              style={{
                                backgroundColor: "#669B49",
                                fontSize: "15px",
                              }}
                            >
                              <strong>₹ 217.00</strong>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                  <tr className="without_price_check">
                    <td colSpan={8} style={{ padding: 0 }}>
                      <table style={{ padding: 0, margin: 0, width: "100%" }}>
                        <tbody>
                          <tr>
                            <th className="text-center">HSN/SAC</th>
                            <th className="text-center">Taxable Value</th>
                            <th className="text-center">Total GST Rate</th>
                            <th className="text-center">Total GST Amount</th>
                            <th className="text-center">CGST% Rate</th>
                            <th className="text-center">CGST Amount</th>
                            <th className="text-center">SGST% Rate</th>
                            <th className="text-center">SGST Amount</th>
                          </tr>
                          <tr>
                            <td
                              className="box_qty"
                              style={{ textAlign: "center" }}
                            ></td>
                            <td className="text-right rate">₹ 207.00</td>
                            <td className="text-right b_qty">5%</td>
                            <td className="text-right b_qty">₹ 10.35</td>
                            <td className="text-right b_qty">2.5%</td>
                            <td className="text-right b_qty">₹ 5.18</td>
                            <td className="text-right b_qty">2.5%</td>
                            <td className="text-right b_qty">₹ 5.18</td>
                          </tr>
                          <tr>
                            <td className="text-center">
                              <strong>Total</strong>
                            </td>
                            <td className="text-right">
                              <b>₹ 207.00</b>
                            </td>
                            <td className="text-right">
                              <b></b>
                            </td>
                            <td className="text-right">
                              <b>₹ 10.35</b>
                            </td>
                            <td className="text-right">
                              <b></b>
                            </td>
                            <td className="text-right">
                              <b>₹ 5.18</b>
                            </td>
                            <td className="text-right">
                              <b></b>
                            </td>
                            <td className="text-right">
                              <b>₹ 5.18</b>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <button onClick={generatePDF} style={{ marginTop: "20px" }}>
          Generate PDF
        </button>
      </div>
    );
  }
);

export default OrderPdfViewV1;
