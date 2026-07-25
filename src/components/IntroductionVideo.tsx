import { useEffect, useState } from "react";

const IntroductionVideo = () => {
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    const hasSeenVideo = localStorage.getItem("hasSeenIntroVideo");

    if (!hasSeenVideo) {
      setShowVideo(true);
    }
  }, []);

  const closeVideo = () => {
    setShowVideo(false);
    localStorage.setItem("hasSeenIntroVideo", "true");
  };

  return (
    <>
      {showVideo && (
        <div
          className="video-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            className="video-modal"
            style={{
              position: "relative",
              width: "70%",
              maxWidth: "960px",
              background: "#fff",
              borderRadius: "8px",
              padding: "20px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
              overflow: "hidden",
            }}
          >
            <button
              onClick={closeVideo}
              style={{
                position: "absolute",
                top: "10px",
                right: "15px",
                background: "transparent",
                border: "none",
                fontSize: "24px",
                color: "#000",
                cursor: "pointer",
              }}
            >
              &times;
            </button>

            <h2 style={{ textAlign: "center" }}>
              Best Way To Use All Features
            </h2>

            <p className="text-center" style={{ color: "rgb(153,153,153)" }}>
              Please Watch This Video
            </p>

            <div
              style={{
                height: "70vh",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <iframe
                width="100%"
                src="https://www.youtube.com/embed/tl3bxVQv7VI"
                title="Introduction Video"
                allowFullScreen
                style={{
                  border: "none",
                  borderRadius: "8px",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default IntroductionVideo;