import React, { createContext, Dispatch, ReactNode, useState } from "react";
import { TReactSetState } from "../helpers/AppType";
import { ICreateCompany } from "../pages/left-side/create-company/CreateCompanyController";
interface IAppContextType {
  isEditContact: boolean;
  setIsEditContact: TReactSetState<boolean>;
  isTaskRightSideopen: boolean;
  setIsTaskRightSideOpen: TReactSetState<boolean>;
  showRightSide: boolean;
  setShowRightSide: TReactSetState<boolean>;
  checkToken: boolean;
  setCheckToken: TReactSetState<boolean>;
  checkPlan: ICreateCompany | undefined;
  setCheckPlan: TReactSetState<ICreateCompany | undefined>;
  isCheckPlan: boolean;
  isSetCheckPlan: TReactSetState<boolean>;
  permissions: any;
  setPermissions: any;
  showAttendancePopup: boolean;
  setShowAttendancePopup: TReactSetState<boolean>;
  companyFlag: number | null;
  setCompanyFlag: TReactSetState<number | null>;
  compulsaryAttendance: any;
  setCompulsaryAttendance: any;
  companyData: any | null;
  setCompanyData: Dispatch<React.SetStateAction<any | null>>;
}
export const AppContext = createContext<IAppContextType | undefined>(undefined);

interface IAppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<IAppProviderProps> = ({ children }) => {
  const [companyData, setCompanyData] = useState<any | null>(null);
  const [isEditContact, setIsEditContact] = useState<boolean>(false);
  const [showRightSide, setShowRightSide] = useState(false);
  const [checkToken, setCheckToken] = useState(false);
  const [checkPlan, setCheckPlan] = useState<ICreateCompany | undefined>(
    undefined
  );
  const [isCheckPlan, isSetCheckPlan] = useState<boolean>(false);
  const [permissions, setPermissions] = useState<any>([]);
  const updateCheckPlan: TReactSetState<ICreateCompany | undefined> = (
    newPlan
  ) => {
    setCheckPlan(newPlan);
  };
  const [companyFlag, setCompanyFlag] = useState<number | null>(null);
  const [showAttendancePopup, setShowAttendancePopup] = useState(false);
  const [compulsaryAttendance, setCompulsaryAttendance] = useState(false);
  const [isTaskRightSideopen, setIsTaskRightSideOpen] =
    useState<boolean>(false);

  return (
    <AppContext.Provider
      value={{
        companyData,
        setCompanyData,
        isEditContact,
        setIsEditContact,
        showRightSide,
        setShowRightSide,
        checkToken,
        setCheckToken,
        checkPlan,
        setCheckPlan: updateCheckPlan,
        isCheckPlan,
        isSetCheckPlan,
        permissions,
        setPermissions,
        showAttendancePopup,
        setShowAttendancePopup,
        companyFlag,
        setCompanyFlag,
        compulsaryAttendance,
        setCompulsaryAttendance,
        isTaskRightSideopen,
        setIsTaskRightSideOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
