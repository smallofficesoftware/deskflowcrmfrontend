import { useEffect } from "react";

const AutoTabRefresh = () => {
    useEffect(() => {
        let refreshed = false;

        const handleVisibilityChange = () => {
            if (!document.hidden && !refreshed) {
                window.location.reload();
                refreshed = true;
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);
};

export default AutoTabRefresh;