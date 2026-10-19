import React from "react";
import { Modal, Table } from "react-bootstrap";

interface ISalaryCalculationModalProps {
  show: boolean;
  onHide: () => void;
  // One row of the Salary Register (get-salary-registration).
  row: any | null;
}

const n = (value: any) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
const money = (value: any) => n(value).toFixed(2);
// Days can be 27.5; show up to 2 decimals without trailing zeros.
const days = (value: any) => String(Math.round(n(value) * 100) / 100);

interface IStep {
  title: string;
  explain: string;
  lines: { label: string; value: string; strong?: boolean }[];
}

/**
 * Plain-words breakdown of one employee's salary for HR to explain to the
 * employee. Every figure comes from the saved salary row (what the Salary
 * Process stored), so it always matches the register and the slip.
 */
const SalaryCalculationModal = ({
  show,
  onHide,
  row,
}: ISalaryCalculationModalProps) => {
  if (!row) return null;

  const monthDays = n(row.calculate_days);
  const payableDays = n(row.total_day);
  const ratio = monthDays > 0 ? payableDays / monthDays : 0;
  const ratioText = monthDays > 0 ? `${days(payableDays)} ÷ ${days(monthDays)}` : "";

  const unroundedNet = n(row.total_earning) - n(row.total_deduction);
  const roundedNet = Math.round(n(row.net_bank_pay));

  // Day-wise / hour-wise staff have no monthly Basic + DA structure; they are
  // paid from their rate for the days or hours worked, not pro-rated.
  const isRateBased = n(row.fxs_total_earning) === 0 && n(row.dws_total_earning) > 0;

  const steps: IStep[] = [
    {
      title: "1. Days used",
      explain:
        "Payable days = present days + half days × 0.5 + holidays + week-offs + paid leave. Unpaid leave and absent days earn nothing. With the 'working days only' setting, week-offs are left out of both sides.",
      lines: [
        {
          label: "Days in the month used for the salary",
          value: monthDays > 0 ? days(monthDays) : "Process the salary again to see this",
        },
        { label: "Present days", value: days(row.total_present_day) },
        { label: "Half days (count 0.5 each)", value: days(row.half_day) },
        { label: "Holidays", value: days(row.holiday) },
        { label: "Week-offs", value: days(row.total_week_off) },
        { label: "Paid leave", value: days(row.total_paid_leave) },
        { label: "Unpaid leave", value: days(row.total_unpaid_leave) },
        { label: "Absent", value: days(row.total_absent) },
        { label: "Payable days", value: days(payableDays), strong: true },
      ],
    },
    {
      title: "2. Fixed monthly salary",
      explain:
        "These are the monthly amounts set in the employee's payroll. The per-day rate is the fixed total divided by the days in the month.",
      lines: [
        { label: "Basic + DA", value: money(row.fxs_basic) },
        { label: "HRA", value: money(row.fxs_hra) },
        { label: "Conveyance + medical + special allowance", value: money(row.fxs_other) },
        { label: "Fixed total", value: money(row.fxs_total_earning), strong: true },
        { label: "Per-day rate (for information)", value: money(row.per_day_salary) },
      ],
    },
    {
      title: "3. Salary for the days worked",
      explain: isRateBased
        ? "This employee has no monthly Basic + DA set, so the salary is paid from the day or hour rate for the days or hours worked, not pro-rated from a monthly amount."
        : `Each fixed amount is multiplied by payable days ÷ days in the month${
            ratioText ? ` (${ratioText} = ${ratio.toFixed(4)})` : ""
          }. This is why Basic and HRA can carry paise.`,
      lines: isRateBased
        ? [
            { label: "Paid from the day / hour rate", value: money(row.dws_basic) },
            { label: "Salary for the days worked", value: money(row.dws_total_earning), strong: true },
          ]
        : [
        {
          label: `Basic + DA  ${money(row.fxs_basic)}${ratioText ? ` × ${ratioText}` : ""}`,
          value: money(row.dws_basic),
        },
        {
          label: `HRA  ${money(row.fxs_hra)}${ratioText ? ` × ${ratioText}` : ""}`,
          value: money(row.dws_hra),
        },
        {
          label: `Allowances  ${money(row.fxs_other)}${ratioText ? ` × ${ratioText}` : ""}`,
          value: money(row.dws_other),
        },
        { label: "Salary for the days worked", value: money(row.dws_total_earning), strong: true },
      ],
    },
    {
      title: "4. Overtime",
      explain:
        "Overtime hours × the hourly rate. By formula the rate is the fixed Basic + DA ÷ (days in the month × daily working hours). If the employee has a flat overtime rate set, that rate is used instead. Regular and extra overtime are worked out separately.",
      lines: [
        { label: `Regular overtime (${row.regular_ot_hours ?? "00:00:00"} hours)`, value: money(row.regular_ot_payable_amt) },
        { label: `Extra overtime (${row.extra_ot_hours ?? "00:00:00"} hours)`, value: money(row.extra_ot_payable_amt) },
        { label: "Overtime total", value: money(row.earn_ot_payable_amt), strong: true },
      ],
    },
    {
      title: "5. Other earnings",
      explain:
        "Bonus = Basic for the days worked × bonus %. The three extra earning heads are added as entered in the payroll.",
      lines: [
        { label: "Bonus", value: money(row.bonus_amount) },
        { label: "Earning head 1", value: money(row.earn_head_first) },
        { label: "Earning head 2", value: money(row.earn_head_second) },
        { label: "Earning head 3", value: money(row.earn_head_third) },
        { label: "Overtime + bonus + extra heads", value: money(row.earn_sub_total), strong: true },
      ],
    },
    {
      title: "6. Total earning (gross)",
      explain: "Salary for the days worked + overtime, bonus and extra heads.",
      lines: [
        { label: `${money(row.dws_total_earning)} + ${money(row.earn_sub_total)}`, value: money(row.total_earning), strong: true },
      ],
    },
    {
      title: "7. Deductions",
      explain:
        "PF is a fixed 1,800 when the earning is 15,000 or more, otherwise earning × PF %. ESI applies only below 21,001 on the salary for the days worked. PT is a fixed 200 from 12,000 of earning, otherwise the PT amount set for the employee. Insurance and the extra heads are taken as entered.",
      lines: [
        { label: "PF", value: money(row.ded_emp_pf) },
        { label: "PM PF", value: money(row.ded_pradhan_mantri_pf) },
        { label: "ESI (employee)", value: money(row.ded_esi_employee) },
        { label: "PT", value: money(row.ded_pt) },
        { label: "Insurance", value: money(row.ded_insurance) },
        { label: "Deduction heads 1 + 2 + 3", value: money(n(row.ded_first) + n(row.ded_second) + n(row.ded_third)) },
        { label: "Total deduction", value: money(row.total_deduction), strong: true },
      ],
    },
    {
      title: "8. Net pay",
      explain:
        "Net = total earning − total deduction. Only this final amount is rounded, to the nearest whole rupee. The parts above keep their paise.",
      lines: [
        { label: `${money(row.total_earning)} − ${money(row.total_deduction)}`, value: money(unroundedNet) },
        { label: "Net pay (rounded to the rupee)", value: String(roundedNet), strong: true },
      ],
    },
  ];

  return (
    <Modal show={show} onHide={onHide} centered size="lg" scrollable>
      <Modal.Header closeButton>
        <Modal.Title className="fw-bold font-size-20">
          How the salary is calculated
          {row.employee_name ? ` - ${row.employee_name}` : ""}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {steps.map((step) => (
          <div key={step.title} className="mb-4 text-start">
            <h6 className="fw-bold mb-1">{step.title}</h6>
            <p className="text-muted mb-2" style={{ fontSize: "13px" }}>
              {step.explain}
            </p>
            <Table bordered size="sm" className="mb-0">
              <tbody>
                {step.lines.map((line) => (
                  <tr key={line.label}>
                    <td style={{ fontWeight: line.strong ? 700 : 400 }}>
                      {line.label}
                    </td>
                    <td
                      className="text-end"
                      style={{ width: "30%", fontWeight: line.strong ? 700 : 400 }}
                    >
                      {line.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        ))}
      </Modal.Body>
    </Modal>
  );
};

export default SalaryCalculationModal;
