import { useState } from "react";

const MiddleView = () => {

    const [globalSearchText, setGlobalSearchText] = useState<string>("");
    const [selectReportType, setSelectReportType] = useState("");
    const [hasData, setHasData] = useState<boolean>(false);

    return (
        <>
            <style>
                {`
          .clear-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  font-size: 18px;
  color: #9ca3af;
}

.clear-icon:hover {
  color: #111827;
}
        `}
            </style>
            <div
                style={{
                    height: "12vh",
                    background: "#ffffff",
                    // display: "flex",
                    // alignItems: "center",
                    // justifyContent: "space-between",
                    padding: "0px 11px 10px 11px",
                    flexShrink: 0,
                    marginBottom: "10px"
                }}
            >
            </div>
        </>
    );
};

export default MiddleView;