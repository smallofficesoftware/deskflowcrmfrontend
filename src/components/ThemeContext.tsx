// ThemeContext.js
import React, { createContext, useContext, useState } from "react";
import { THEME_COLOUR } from "../helpers/AppConstants";

interface IThemeContextProps {
  darkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<IThemeContextProps>({
  darkMode: false,
  toggleTheme: () => { },
});

export const useTheme = () => useContext(ThemeContext);
interface IThemeProviderProps {
  children: React.ReactNode;
}
export const ThemeProvider = ({ children }: IThemeProviderProps) => {
  const [darkMode, setDarkMode] = useState(false);

  const darkTheme = {
    "--appBackground": "#0a1014",
    "--side": "#111b21",
    "--right-side": "#111b21",
    "--rightSide-opacity": "0.06",
    "--secondary": "#202c33",
    "--border-right": "rgba(233, 237, 239, 0.12)",
    "--icons": "#aebac1",
    "--tick-icons": "#53bdeb",
    "--primary": "#8696a0",
    "--block": "#2a3942",
    "--block-footer": "#2a3942",
    "--h4": "#e9edef",
    "--unread": "#00a884",
    "--dropdown": "#233138",
    "--listItem": "#d1d7db",
    "--chat-date-bg": "#1e2a30",
    "--chat-date": "rgba(241, 241, 242, 0.92)",
    "--chat-encrption-bg": "#1e2a30",
    "--chat-encryption": "#ffd279",
    "--shadow-rgb": "11, 20, 26",
    "--listItemHover": "#182229;",
    "--chat": "#005c4b",
    "--icon-focus": "hsla(0, 0%, 100%, 0.1)",
    "--scrollBar": "#445561",
    "--head-title": "#d9dee0",
    "--header-bg": "#202c33",
    "--new-g": "#DFE5E7",
    "--settings-icon": "#8696a0",
    "--profile-bg": "#182229",
    "--profile-BGG": "#111b21",
    "--yur-name-abt": "#008069",
    "--border-not": "rgba(134, 150, 160, 0.15)",
    "--checked-border": "#008069",
    "--checked-bg": "#008069",
    "--uncheck": "rgb(209, 215, 219)",
    "--uncheck-circle": "#8696a0",
    "--last-seen-title": "#54656f",
    "--learn-more": "#53bdeb",
    "--b-con": "#667781",
    "--ul": "#667781",
    "--modal-bg": "rgba(11, 20, 26, 0.368)",
    "--modal-content-bg": "#ffffff",
    "--modal-text": "#d1d7db",
    "--modal-btn": "rgba(134, 150, 160, 0.15)",
    "--modal-btn2": "#f58634",
    "--modal-btn-text": "#111b21",
    "--modal-btn-hover": "#f58634",
    "--modal-shadow": "11, 20, 26",
    "--hover-wallpaper": "#3b4a54",
    "--border-active": "#667781",
    "--contact-info-h2": "#d9dee0",
    "--danger": "#f15c6d",
    "--status-text": "#8696a0",
    "--status-right-text": "#9494a1",
    "--intro-bg": "#222e35",
    "--intro-border": "#008069",
    "--intro-svg1": "#364147",
    "--intro-svg2": "#f1f1f2",
    "--intro-opacity": ".38",
    "--intro-svg3": "#EEFAF6",
    "--intro-svg4": "#DFF3ED",
    "--intro-svg5": "#DFF3ED",
    "--intro-text": "rgba(233, 237, 239, 0.88)",
    "--intro-sub-text": "#8696a0",
    "--emoji-active-after": "#00af9c",
    "--emoji-tab-active": "rgba(241, 241, 242, 0.63)",
    "--emoji-tab": "rgba(241, 241, 242, 0.32)",
    "--emoji-label": "rgba(241, 241, 242, 0.45)",
  };
  const lightTheme = {
    // "--appBackground":
    //   "linear-gradient(#f58634 0%, #f58634 130px, #d9dbd5 130px, #d9dbd5 100%)",
    "--appBackground":
      `${THEME_COLOUR}`,
    // "linear-gradient(#182efcff 0%, #182efcff 130px, #d9dbd5 130px, #d9dbd5 100%)",
    "--side": "#fff",
    "--right-side": "#efeae2",
    "--rightSide-opacity": "0.488",
    "--secondary": "#f0f2f5",
    "--border-right": "#38353c55",
    "--icons": "#54656f",
    "--tick-icons": "#53bdeb",
    "--primary": "#54656f",
    "--block": "#e2e6ec",
    "--block-footer": "#fff",
    "--h4": "#111b21",
    "--unread": "#25d366",
    "--dropdown": "#fff",
    "--shadow-rgb": "11, 20, 26",
    "--listItem": "#3b4a54",
    "--listItemHover": "#54656f;",
    "--chat": "#d9fdd3",
    "--chat-date-bg": "#fff",
    "--chat-date": "#1e2a30",
    "--chat-encrption-bg": "#ffeecd",
    "--chat-encryption": "#54656f",
    "--icon-focus": "rgba(11, 20, 26, 0.1)",
    "--scrollBar": "#c0c6ce",
    "--head-title": "#fff",
    "--header-bg": "#4C4C4C",

    "--new-g": "#111b21",
    "--settings-icon": "#8696a0",
    "--profile-bg": "#fff",
    "--profile-BGG": "#f0f2f5",
    "--yur-name-abt": "#008069",
    "--border-not": "#e9edef",
    "--checked-border": "#008069",
    "--checked-bg": "#008069",
    "--uncheck": "rgba(59, 74, 84)",
    "--uncheck-circle": "#667781",
    "--last-seen-title": "#54656f",
    "--learn-more": "#027eb5",
    "--b-con": "#8696a0",
    "--ul": "#667781",
    "--modal-bg": "hsla(0, 0%, 100%, 0.85)",
    "--modal-content-bg": "#fff",
    "--modal-text": "#3b4a54",
    "--modal-btn": "rgba(134, 150, 160, 0.15)",
    "--modal-btn2": "#f58634",
    "--modal-btn-text": "#111b21",
    "--modal-btn-hover": "#f58634",
    "--modal-shadow": "11, 20, 26",
    "--hover-wallpaper": "#fff",
    "--border-active": "#009de2",
    "--contact-info-h2": "#1e2a30",
    "--danger": "#ea0038",
    "--status-text": "gainsboro",
    "--status-right-text": "#9494a1",
    "--intro-bg": "#f0f2f5",
    "--intro-border": "#f58634",
    "--intro-svg1": "#DAF7F3",
    "--intro-svg2": "#fff",
    "--intro-opacity": "none",
    "--intro-svg3": "#fff",
    "--intro-svg4": "#eefefa",
    "--intro-svg5": "#eefaf6",
    "--intro-text": "#41525d",
    "--intro-sub-text": "#667781",
    "--emoji-active-after": "#009688",
    "--emoji-tab-active": "rgba(0, 0, 0, 0.6)",
    "--emoji-label": "rgba(0, 0, 0, 0.45)",
    "--emoji-tab": "rgba(0, 0, 0, 0.32)",
  };
  const toggleTheme = () => {
    setDarkMode((prevMode) => !prevMode);
  };

  const theme = darkMode ? darkTheme : lightTheme;
  const themeStyles = theme as any;

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      <div className={darkMode ? "light-theme" : "dark-theme"} style={themeStyles}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};
