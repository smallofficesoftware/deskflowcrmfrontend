import { fetchColumnPreference, saveColumnPreference } from "../../../services/columnPreferenceService";

// "Open first": which screen a user lands on after logging in on the web. Saved on the server per user (the same
// saved-choice service the column and Quick actions choices use), so it follows the user to any computer.
//
//   welcome       - the main panel (the page at "/"), as before. The default.
//   quick_actions - the Side view, on Quick actions.

export type TOpenFirst = "welcome" | "quick_actions";

export const OPEN_FIRST_LABEL: Record<TOpenFirst, string> = {
  welcome: "Welcome page (main panel)",
  quick_actions: "Quick actions (Side view)",
};

const OPEN_FIRST_KEY = "web_open_first";

export const getOpenFirst = async (): Promise<TOpenFirst> => {
  const saved = await fetchColumnPreference(OPEN_FIRST_KEY);
  // Anything else (never saved, or a value this list no longer offers) opens the welcome page.
  return saved?.column_order?.[0] === "quick_actions" ? "quick_actions" : "welcome";
};

export const setOpenFirst = (mode: TOpenFirst) => saveColumnPreference(OPEN_FIRST_KEY, [mode], []);

/** Where to go for a choice; null = stay on the welcome page. */
export const openFirstPath = (mode: TOpenFirst): string | null => (mode === "quick_actions" ? "/SideView?view=quick-actions" : null);
