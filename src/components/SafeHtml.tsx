// SafeHtml.tsx
import DOMPurify from "dompurify";
import React from "react";

interface ISafeHtmlProps {
  htmlContent: string;
}

const SafeHtml: React.FC<ISafeHtmlProps> = ({ htmlContent }) => {
  // 1️⃣ Allow target & rel attributes in <a>
  DOMPurify.addHook("uponSanitizeAttribute", (node: any) => {
    if (node.tagName === "A" && node.getAttribute("href")) {
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noopener noreferrer");
    }
  });

  // 2️⃣ Optional: add <p> style
  const withParagraphStyle = htmlContent.replace(/<p>/g, '<p style="margin:0px;">');

  // 3️⃣ sanitize final HTML
  const sanitizedHtml = DOMPurify.sanitize(withParagraphStyle, {
    ADD_TAGS: ["a", "p"],
    ADD_ATTR: ["target", "rel"],
  });

  return (
    <span
      style={{ wordWrap: "break-word", width: "100%", margin: "0px" }}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};

export default SafeHtml;
