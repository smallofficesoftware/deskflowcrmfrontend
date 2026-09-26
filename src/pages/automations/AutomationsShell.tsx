import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import UpperView from "../side-view/UpperView";
import AutomationSidebarView, { AutomationView } from "./AutomationSidebarView";
import AutomationListView from "./AutomationListView";
import FlowBuilder from "./builder/FlowBuilder";
import ExecutionListView from "./ExecutionListView";
import WebhookListView from "./WebhookListView";
import AutomationSettingsView from "./AutomationSettingsView";
import TemplateGalleryView from "./TemplateGalleryView";

// Own page, same shape as /SideView?view=reports (plan section 8.1): the
// existing top bar (UpperView, unchanged) + a new sidebar + a main area
// switched by the :view route param. Route: /Automations/:view?/:id?
const VALID_VIEWS: AutomationView[] = ["flows", "templates", "executions", "webhooks", "settings"];

const AutomationsShell = () => {
  const navigate = useNavigate();
  const { view, id } = useParams<{ view?: string; id?: string }>();
  const active: AutomationView = (VALID_VIEWS as string[]).includes(view || "") ? (view as AutomationView) : "flows";

  useEffect(() => {
    if (!localStorage.getItem("UUID")) navigate("/", { replace: true });
  }, [navigate]);

  const goTo = (v: AutomationView) => navigate(`/Automations/${v}`);

  const renderBody = () => {
    if (view === "flows" && id === "new") return <FlowBuilder key="new" />;
    if (view === "flows" && id) return <FlowBuilder key={id} flowId={Number(id)} />;
    switch (active) {
      case "templates":
        return <TemplateGalleryView />;
      case "executions":
        return <ExecutionListView />;
      case "webhooks":
        return <WebhookListView />;
      case "settings":
        return <AutomationSettingsView />;
      default:
        return <AutomationListView />;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <UpperView />
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <AutomationSidebarView active={active} onNavigate={goTo} />
        <div style={{ flex: 1, minWidth: 0, overflow: "auto", background: "#f7f8fa" }}>{renderBody()}</div>
      </div>
    </div>
  );
};

export default AutomationsShell;
