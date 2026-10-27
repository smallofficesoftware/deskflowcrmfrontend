import { useContext } from "react";
import { AppContext } from "../common/AppContext";

// pageId can drift between databases (a_application_pages ids are plain
// AUTO_INCREMENT and the table is also written to independently by the admin
// panel's own platform-page migrations - e.g. Attribute Master landed on 196
// on one database and 200 on another). Pass a page_slug string instead of a
// hardcoded numeric PAGE_ID for any page added after 27-10-2026 to stay
// correct regardless of which id it happens to get on a given server.
const useCheckUserPermission = (pageId: number | string, permissionType: string) => {
  const { permissions } = useContext(AppContext)!;

  // Find the permission object for the given pageId (or page_slug, if a string was passed)
  const pagePermission = permissions?.find((perm: any) =>
    typeof pageId === "string" ? perm.page_slug === pageId : perm.page_id === pageId,
  );



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
