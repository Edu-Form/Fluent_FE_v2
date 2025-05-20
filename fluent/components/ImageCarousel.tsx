"use client";

import { useState, useEffect } from "react";

// 이미지 슬라이더 컴포넌트 - 전체 크기로 표시되도록 수정
const ImageCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const images = [
    "/images/english.jpeg",
    "/images/english2.jpeg",
    "/images/english3.jpeg",
    "/images/english4.jpeg",
  ];

  // 자동 슬라이드 기능
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, 6000);

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="relative w-full overflow-hidden rounded-lg shadow-md">
      {/* 슬라이드 이미지 컨테이너  */}
      <div
        className="flex transition-transform duration-500 ease-in-out h-56"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((src, index) => (
          <div key={index} className="w-full flex-shrink-0">
            <img
              src={src}
              alt={`English slide ${index}`}
              className="w-full h-56 object-cover"
            />
          </div>
        ))}
      </div>

      {/* 이미지 위에 그라데이션 오버레이 추가 */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30"></div>
    </div>
  );
};

export default ImageCarousel;
