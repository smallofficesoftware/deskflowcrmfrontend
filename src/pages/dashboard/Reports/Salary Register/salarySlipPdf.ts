import { jsPDF } from "jspdf";

const PAGE_MARGIN_MM = 10;

// Marks one employee's slip in SalaryRegisterMonthlySlip.tsx.
export const SALARY_SLIP_SELECTOR = "[data-salary-slip]";

// Turns every slip on the page into one PDF, one slip per A4 page, drawn from
// the same markup the browser prints - so the download looks exactly like Print.
// Returns false when there is no slip on the page.
export async function downloadSalarySlipsPdf(fileName: string): Promise<boolean> {
  const slips = Array.from(
    document.querySelectorAll<HTMLElement>(SALARY_SLIP_SELECTOR),
  );
  if (slips.length === 0) return false;

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const contentWidth = doc.internal.pageSize.getWidth() - PAGE_MARGIN_MM * 2;

  for (let i = 0; i < slips.length; i++) {
    if (i > 0) doc.addPage();
    await doc.html(slips[i], {
      x: PAGE_MARGIN_MM,
      y: PAGE_MARGIN_MM,
      width: contentWidth,
      windowWidth: slips[i].scrollWidth,
      autoPaging: false,
      html2canvas: { scale: 2, useCORS: true },
    });
  }

  doc.save(fileName);
  return true;
}
