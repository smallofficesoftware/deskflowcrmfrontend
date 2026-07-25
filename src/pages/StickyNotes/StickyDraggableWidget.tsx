// =============================
// StickyDraggableWidget.tsx
// =============================

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import React from "react";

type Props = {
    children: React.ReactNode;
    position: { x: number; y: number };
};

export const StickyDraggableWidget = ({
    children,
    position,
}: Props) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: "sticky-widget",
    });

    const style: React.CSSProperties = {
        position: "fixed",
        bottom: `${position.y}px`,
        right: `${position.x}px`,
        transform: CSS.Translate.toString(transform),
        zIndex: 999999,
        touchAction: "none",
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
        >
            {children}
        </div>
    );
};