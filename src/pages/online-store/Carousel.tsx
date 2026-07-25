import React, { useState, useEffect, useCallback, useRef } from "react";
import { useOnlineStore } from "../../store/onlineStore/useOnlineStore";
import { BACKEND_OF_SMALL_OFFICE_CRM_END_POINT } from "../../helpers/AppConstants";



const Carousel = () => {
    const { customerData, companyData } = useOnlineStore();
    const [active, setActive] = useState(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);
    const slides: any = [
        {
            type: "content",
            bg: "gray",
            title: `Welcome ${customerData?.person_name} to Our Store`,
            subtitle: "Discover amazing products at great prices"
        }
    ];
    if (companyData?.banner_img_one) slides.push({ type: "image", src: `${BACKEND_OF_SMALL_OFFICE_CRM_END_POINT}/companyImg/${companyData?.banner_img_one}` });
    if (companyData?.banner_img_two) slides.push({ type: "image", src: `${BACKEND_OF_SMALL_OFFICE_CRM_END_POINT}/companyImg/${companyData?.banner_img_two}` });
    const next = useCallback(() => {
        setActive((prev) => (prev + 1) % slides.length);
    }, []);
    const prev = useCallback(() => {
        setActive((prev) => (prev - 1 + slides.length) % slides.length);
    }, []);
    const startAutoPlay = useCallback(() => {
        timeoutRef.current = setTimeout(next, 3000);
    }, [next]);
    useEffect(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        startAutoPlay();
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [active, startAutoPlay]);
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.changedTouches[0].clientX;
    };
    const handleTouchEnd = (e: React.TouchEvent) => {
        touchEndX.current = e.changedTouches[0].clientX;
        if (touchStartX.current - touchEndX.current > 50) next();
        if (touchEndX.current - touchStartX.current > 50) prev();
    };
    return (
        <div
            className="position-relative w-100 overflow-hidden premium-carousel container-fluid container-xl"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <div className="carousel-track" style={{ transform: `translateX(-${active * 100}%)` }}>
                {slides.map((slide: any, index: number) => (
                    <div key={index} className="carousel-slide">
                        {slide.type === "image" ? (
                            <img src={slide.src} alt="" className="carousel-img" style={{ objectFit: "cover" }} />
                        ) : (
                            <div className="carousel-content" style={{ background: slide.bg }}>
                                <h1 className="text-white fw-bold">{slide.title}</h1>
                                <p className="text-white">{slide.subtitle}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <button className="carousel-btn prev" onClick={prev}>
                <i className="bi bi-chevron-left"></i>
            </button>
            <button className="carousel-btn next" onClick={next}>
                <i className="bi bi-chevron-right"></i>
            </button>
            <style>{`
                .premium-carousel {
                    height: 400px;
                }
                .carousel-track {
                    display: flex;
                    width: 100%;
                    height: 100%;
                    transition: transform 0.6s ease;
                }
                .carousel-slide {
                    flex: 0 0 100%;
                    height: 100%;
                    position: relative;
                }
                .carousel-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .carousel-content {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    padding: 20px;
                }
                .carousel-btn {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    background: rgba(0,0,0,0.35);
                    border: none;
                    color: white;
                    padding: 10px 14px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.4rem;
                    cursor: pointer;
                    transition: background 0.3s ease;
                    z-index: 5;
                }
                .carousel-btn:hover {
                    background: rgba(0,0,0,0.55);
                }
                .carousel-btn.prev {
                    left: 10px;
                }
                .carousel-btn.next {
                    right: 10px;
                }
                .carousel-indicators {
                    position: absolute;
                    bottom: 15px;
                    width: 100%;
                    display: flex;
                    justify-content: center;
                    gap: 8px;
                    z-index: 10;
                }
                .dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.5);
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .dot.active {
                    background: white;
                    transform: scale(1.2);
                }
                @media (max-width: 768px) {
                    .premium-carousel {
                        height: 260px;
                    }
                }
            `}</style>
        </div>
    );
};

export default Carousel;
