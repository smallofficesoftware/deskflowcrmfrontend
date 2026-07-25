import React, { Dispatch, SetStateAction, useCallback, useEffect, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import Cropper, { Area } from "react-easy-crop";
import { toast } from "react-toastify";
import { useTheme } from "../ThemeContext";

const ImageCropperToolModel = ({
    show,
    onHide,
    onSubmit,
    title,
    btn1 = "Submit",
    btn2 = "Close",
    height = 240,
    width = 240,
    initialImage,
    setCroppedImageUrl
}: {
    show?: boolean;
    onHide?: () => void;
    onSubmit?: (blob: Blob | null, url: string | null) => void;
    setCroppedImageUrl?: Dispatch<SetStateAction<string | undefined>>
    title?: string;
    btn1?: string;
    btn2?: string;
    height?: number;
    width?: number;
    initialImage?: string | null | undefined;
}) => {
    const { darkMode } = useTheme();
    const modalThemeClass = darkMode ? "modal-light-1" : "modal-light-1";
    const modalThemeClass1 = darkMode ? "modal-dark" : "modal-light-1";
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [croppedImageBlob, setCroppedImageBlob] = useState<Blob | null>(null);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [isDragging, setIsDragging] = useState(false);
    const onDelete = async () => {
        try {
            setIsDeleting(true);
            if (imageSrc?.startsWith("blob:")) {
                URL.revokeObjectURL(imageSrc);
            }
            resetCropper();
            toast.success("Image deleted successfully.");
            onSubmit?.(null, null);
            onHide?.();
        } catch (error) {
            console.error("Delete failed:", error);
            toast.error("Failed to delete the image.");
        } finally {
            setIsDeleting(false);
        }

    }
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith("image/")) {
            const url = URL.createObjectURL(file);
            setImageSrc(url);
        } else {
            toast.error("Please drop a valid image file (PNG, JPG, JPEG).");
        }
    };

    useEffect(() => {
        if (show && initialImage) {
            setImageSrc(initialImage);
        } else if (!show) {
            resetCropper();
        }
    }, [show, initialImage]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setImageSrc(url);
        }
    };

    const onCropComplete = useCallback((_croppedArea: Area, croppedPixels: Area) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const cropImage = async () => {
        if (!imageSrc || !croppedAreaPixels) return;
        try {
            const { blob, url } = await getCroppedImg(imageSrc, croppedAreaPixels, width, height);
            setCroppedImageUrl?.(url);
            setCroppedImageBlob(blob);
            return { blob, url };
        } catch (e) {
            console.error("Cropping failed", e);
            return null;
        }
    };

    const resetCropper = () => {
        if (imageSrc?.startsWith("blob:")) {
            URL.revokeObjectURL(imageSrc);
        }
        setImageSrc(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
        setCroppedImageUrl?.(undefined);
        setCroppedImageBlob(null);
    };
    const handleSubmit = async () => {
        const result = await cropImage();
        if (result) {
            onSubmit?.(result.blob, result.url);
        } else {
            onSubmit?.(null, null);
        }
        onHide?.();
    };

    function createImage(url: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = (err) => reject(err);
            img.src = url;
        });
    }

    async function getCroppedImg(
        imageSrc: string,
        pixelCrop: { x: number; y: number; width: number; height: number },
        width: number,
        height: number
    ): Promise<{ blob: Blob; url: string }> {
        const image = await createImage(imageSrc);
        const canvas = document.createElement("canvas");
        const scale = window.devicePixelRatio || 1;
        canvas.width = width * scale;
        canvas.height = height * scale;

        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas context not available");
        ctx.setTransform(scale, 0, 0, scale, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            width,
            height
        );

        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error("Blob creation failed"));
                    return;
                }
                const url = URL.createObjectURL(blob);
                resolve({ blob, url });
            }, "image/jpeg", 0.95);
        });
    }

    return (
        <React.Fragment>
            <Modal show={show} onHide={onHide} centered className={modalThemeClass1}>
                <div className={`p-10 m-title ${modalThemeClass}`}>{title}</div>
                <Modal.Body className={`${modalThemeClass}`}>
                    <div>

                        <div className="col-12">
                            <div
                                className="px-2 chat-attach text-center"
                                onClick={() => document.getElementById("input-files-company-log")?.click()}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                style={{
                                    border: `2px dashed ${isDragging ? "#f58634" : "#ccc"}`,
                                    borderRadius: "8px",
                                    padding: "30px",
                                    backgroundColor: isDragging ? "#fdf6ee" : "#fafafa",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                }}
                            >
                                <div className="text-muted">
                                    {isDragging ? (
                                        <span style={{ color: "#f58634", fontWeight: "500" }}>
                                            Drop your image here!
                                        </span>
                                    ) : (
                                        <>
                                            <div>Drag & drop an image here</div>
                                            <div className="mt-2">or click to browse</div>
                                        </>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    id="input-files-company-log"
                                    style={{ display: "none" }}
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>
                        </div>

                        {/* <div>
                            <div className="text-center">
                                <span
                                    style={{ color: "rgb(153, 153, 153)" }}
                                >
                                    Please select file
                                </span>

                            </div>
                            <input id="file-upload-company-catalog" type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
                        </div> */}
                        {imageSrc && (
                            <div className="crop-wrapper">
                                <div className="crop-container">
                                    <Cropper
                                        image={imageSrc}
                                        crop={crop}
                                        zoom={zoom}
                                        aspect={width / height}
                                        onCropChange={setCrop}
                                        onZoomChange={setZoom}
                                        onCropComplete={onCropComplete}
                                    />
                                    {/* <div className="crop-actions">
                                        <button className="action-btn" onClick={resetCropper}>
                                            ✖
                                        </button>
                                        <button className="action-btn" onClick={cropImage}>
                                            ✓
                                        </button>
                                    </div> */}
                                </div>
                            </div>
                        )}

                        {/* {croppedImageURL && (
                            <div>
                                <h3>Preview:</h3>
                                <img src={croppedImageURL} alt="Cropped" width={width} height={height} />
                            </div>
                        )} */}
                    </div>
                    <div className="d-flex justify-content-end modal-buttons mt-3">
                        {
                            initialImage && (
                                <Button className="modal-button1 text-danger me-2" disabled={isDeleting} onClick={onDelete}>
                                    <svg width="25" height="25" viewBox="0 0 24 24" fill={isDeleting ? "currentColor" : "red"}>
                                        <path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12z"></path>
                                    </svg>
                                </Button>
                            )
                        }
                        <Button className="modal-button1" onClick={onHide}>
                            {btn2}
                        </Button>
                        <Button className="modal-button2" onClick={handleSubmit}>
                            {btn1}
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>
        </React.Fragment>
    );
};

export default ImageCropperToolModel;