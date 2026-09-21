const BetaFeatureNotice = () => (
  <div
    className="alert alert-warning d-flex align-items-start gap-2 py-2 px-3 mb-3"
    role="alert"
    style={{ fontSize: "14px" }}
  >
    <i className="pi pi-info-circle" style={{ marginTop: "3px" }} />
    <span>
      <strong>Beta:</strong> This feature is currently in beta. If you face any
      issue, please raise a ticket. Support will be limited and the data shown
      may be incorrect.
    </span>
  </div>
);

export default BetaFeatureNotice;
