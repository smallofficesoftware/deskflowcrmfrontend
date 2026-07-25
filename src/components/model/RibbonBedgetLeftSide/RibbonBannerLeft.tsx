import React from 'react';
import './RibbonBannerLeft.css';

interface RibbonBannerProps {
    children?: React.ReactNode;
    classNameName?: string;
    color?: string;
    style?: React.CSSProperties;
}

const RibbonBanner: React.FC<RibbonBannerProps> = ({
    children = " ",
    classNameName = "",
    color = "#F08333",
    style
}) => {
    const customStyle = {
        '--ribbon-color': color,
    } as React.CSSProperties;

    return (
        <div className="bagde-flag-wrap" style={{ ...customStyle, ...style }}>
            <span className={`bagde-flag ribbon-color-custom ${classNameName}`} style={{ backgroundColor: color }}>
                {children}
            </span>
        </div>
    );
};

export default RibbonBanner;
