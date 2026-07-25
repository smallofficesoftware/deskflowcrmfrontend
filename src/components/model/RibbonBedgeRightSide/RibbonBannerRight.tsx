import React from "react";
import "./RibbonBannerRight.css";

interface RibbonBannerProps {
    children?: React.ReactNode;
    classNameName?: string;
    color?: string;
    style?: React.CSSProperties;
}

const RibbonBannerRight: React.FC<RibbonBannerProps> = ({
    children = " ",
    classNameName = "",
    color = "#cfba9aff",
    style,
}) => {
    const customStyle = {
        "--ribbon-color": color,
    } as React.CSSProperties;

    return (
        <div
            className="bagde-flag-wrap-right"
            style={{ ...customStyle, ...style }}
        >
            <span
                className={`bagde-flag-right ribbon-color-custom-right ${classNameName}`}
                style={{ backgroundColor: color }}
            >
                {children}
            </span>
        </div>
    );
};

export default RibbonBannerRight;