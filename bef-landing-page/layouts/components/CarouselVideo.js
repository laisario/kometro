import React, { useState, useRef, useEffect } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/effect-cards';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

import { Autoplay, Navigation } from 'swiper';
import Player from './Player';



function CarouselVideo({ videos }) {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const swiperRef = useRef(null);
  const videoRefs = useRef({});

  const handleVideoPlay = (slideIndex) => {
    setIsVideoPlaying(true);
    setCurrentSlideIndex(slideIndex);
    
    Object.keys(videoRefs.current).forEach(key => {
      if (parseInt(key) !== slideIndex && videoRefs.current[key]) {
        if (videoRefs.current[key].pause) {
          videoRefs.current[key].pause();
        }
      }
    });
  };

  const handleVideoPause = () => {
    setIsVideoPlaying(false);
  };

  const handleSlideChange = (swiper) => {
    const newIndex = swiper.activeIndex;
    setCurrentSlideIndex(newIndex);
    
    if (isVideoPlaying && videoRefs.current[currentSlideIndex]) {
      if (videoRefs.current[currentSlideIndex].pause) {
        videoRefs.current[currentSlideIndex].pause();
      }
    }
    setIsVideoPlaying(false);
  };


  return (
    <Swiper
      ref={swiperRef}
      grabCursor={!isVideoPlaying}
      navigation={true}
      spaceBetween={30}
      autoplay={{
        delay: 5000,
        disableOnInteraction: true,
        pauseOnMouseEnter: true,
      }}
      modules={[Autoplay, Navigation]}
      onSlideChange={handleSlideChange}
      style={{
        "--swiper-pagination-bullet-size": "10px",
        "--swiper-theme-color": "#FD7622",
        "borderRadius": "16px"
      }}
    >
      {videos?.map((video, i) => (
        <SwiperSlide key={`${video?.src}-${i}`}>
          {video?.tipo === 'url' ? (
            <div className="w-full max-w-4xl mx-auto">
              <iframe
                width="100%"
                height="500"
                src={video?.src.replace("watch?v=", "embed/")}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={() => {
                  if (i === currentSlideIndex) {
                    handleVideoPlay(i);
                  }
                }}
              ></iframe>
            </div>
          ) : (
            <Player 
              videoSrc={video?.src} 
              onPlay={() => handleVideoPlay(i)}
              onPause={handleVideoPause}
              ref={(el) => {
                if (el) {
                  videoRefs.current[i] = el;
                }
              }}
            />
          )}
        </SwiperSlide>
      ))}
    </Swiper>
  )
}

export default CarouselVideo