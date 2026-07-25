import axios from "axios";
import React, { useEffect } from "react";

interface IImageViewerProps {
  image: any;
  onClose: () => void;
}

const ImageViewer: React.FC<IImageViewerProps> = ({ image, onClose }) => {
  useEffect(() => {
    // Enter full-screen mode
    const openFullScreen = () => {
      const elem = document.getElementById("full-screen-img");
      if (elem?.requestFullscreen) {
        elem.requestFullscreen();
      }
    };

    openFullScreen();

    // Exit full-screen when the user presses ESC
    const exitFullScreenOnEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", exitFullScreenOnEscape);
    return () =>
      document.removeEventListener("keydown", exitFullScreenOnEscape);
  }, [onClose]);
  const handleDownload = async () => {
    try {
      // Construct the URL for the file
      let fileUrl;
      if (image.visit_image) {
        fileUrl = `${image.visit_image}`;
      } else {
        fileUrl = `${image.media_url}`;
      }

      // Fetch the file using axios
      const response = await axios.get(fileUrl, { responseType: "blob" });

      // Create a Blob from the file data
      let fileName;
      if (image.visit_image) {
        fileName = image.media_name ? image.media_name : image.visit_image;
      } else {
        fileName = image.media_name ? image.media_name : image.media_url;
      }

      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      const url = URL.createObjectURL(blob);

      // Create a link and trigger download
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName); // Set the filename dynamically
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Free up memory
    } catch (error) {
      console.error("Error downloading the file", error);
    }
  };
  return (
    <div className="image-viewer-overlay">
      <div className="image-viewer-content">
        <button className="close-btn" onClick={onClose}>
          ✖
        </button>
        {image.visit_image ? (
          <img src={`${image.visit_image}`} alt="Preview" />
        ) : (<img src={`${image.media_url}`} alt="Preview" />)}

        <button className="download-btn" onClick={handleDownload}>
          ⬇ Download
        </button>
      </div>
    </div>
  );
};

export default ImageViewer;
