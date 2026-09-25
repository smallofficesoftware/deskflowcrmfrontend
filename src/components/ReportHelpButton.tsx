import { OverlayTrigger, Popover } from "react-bootstrap";
import { REPORT_HELP } from "../helpers/reportHelp";

interface IReportHelpButtonProps {
  reportKey?: string;
}

// Renders nothing for reports that have no entry in REPORT_HELP yet.
const ReportHelpButton = ({ reportKey }: IReportHelpButtonProps) => {
  const help = reportKey ? REPORT_HELP[reportKey] : undefined;
  if (!help) return null;

  const popover = (
    // Above .modal1 (z-index 99999) so it also works inside the filter popup.
    <Popover style={{ maxWidth: "420px", zIndex: 100001 }}>
      <Popover.Header as="h3">How this report works</Popover.Header>
      <Popover.Body style={{ fontSize: "13px" }}>
        <p className="mb-2">{help.summary}</p>
        <p className="mb-2">
          <strong>Date range: </strong>
          {help.dateRange}
        </p>
        <ul className="mb-0 ps-3">
          {help.filters.map((f) => (
            <li key={f.name} className="mb-1">
              <strong>{f.name}: </strong>
              {f.description}
            </li>
          ))}
        </ul>
      </Popover.Body>
    </Popover>
  );

  return (
    <OverlayTrigger trigger="click" placement="bottom" overlay={popover} rootClose>
      <span
        role="button"
        title="How this report works"
        className="text-primary ms-2"
        style={{ cursor: "pointer", fontSize: "18px", verticalAlign: "middle" }}
      >
        <i className="pi pi-info-circle" />
      </span>
    </OverlayTrigger>
  );
};

export default ReportHelpButton;
