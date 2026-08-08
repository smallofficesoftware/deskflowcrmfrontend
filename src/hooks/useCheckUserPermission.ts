import { useContext } from "react";
import { AppContext } from "../common/AppContext";

const useCheckUserPermission = (pageId: number, permissionType: string) => {
  const { permissions } = useContext(AppContext)!;
 
 // Find the permission object for the given pageId
  const pagePermission = permissions?.find((perm: any) => perm.page_id === pageId);



  if (!pagePermission) {
    return false; // If no permissions exist for the page, return false
  }

  try {
    let rights = pagePermission.a_page_id_rights_jason;
    if (typeof rights === "string") {
      rights = JSON.parse(rights);
      if (typeof rights === "string") {
        rights = JSON.parse(rights);
      }
    }
    return rights?.[permissionType] === 1; // Return true if permissionType exists and is set to 1
  } catch (error) {
    console.error("Error parsing permissions JSON:", error);
    return false;
  }
};

export default useCheckUserPermission;
