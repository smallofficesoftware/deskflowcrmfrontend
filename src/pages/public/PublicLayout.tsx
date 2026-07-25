import { Outlet } from "react-router-dom";
// import DraggableWidget from "./DraggableWidget"; // adjust path

interface PublicLayoutProps {
  children?: React.ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = () => {
  return (
    <div className="body">
      <div className="media">
        <div className="pt-4">
          <img
            width={400}
            src={require("../../assets/images/deshFlow_log.png")}
            alt=""
          />
          <h1 className="logo-main-text-small">&nbsp;</h1>
        </div>

        <h1 className="pt-2">
          For a better experience, install our app on your mobile!
        </h1>

        <div className="pt-3">
          <a href="https://apps.apple.com/in/app/deskflow-crm/id6757629548" target="_blank" rel="noreferrer">
            <img
              className="w-50"
              alt="ios"
              src={require("../../assets/images/appleIos.png")}
            />
          </a>
          <a href="https://play.google.com/store/apps/details?id=com.smalloffice" target="_blank" rel="noreferrer">
            <img
              className="w-50"
              alt="android"
              src={require("../../assets/images/android.png")}
            />
          </a>
        </div>
      </div>

      {/* 🔥 Page content */}
      <div className="container main">
        <Outlet />
      </div>

      {/* 🔥 Floating chat widget (global) */}
      {/* <DndContext>
        <DraggableWidget />
      </DndContext> */}
    </div>
  );
};

export default PublicLayout;
