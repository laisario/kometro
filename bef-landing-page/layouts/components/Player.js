import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";

const Player = forwardRef(({ videoSrc, autoplay = false, onPlay, onPause, ...others }, ref) => {
  const videoEl = useRef(null);
  
  useImperativeHandle(ref, () => ({
    play: () => {
      if (videoEl.current) {
        videoEl.current.play();
      }
    },
    pause: () => {
      if (videoEl.current) {
        videoEl.current.pause();
      }
    }
  }));

  const attemptPlay = () => {
    videoEl &&
      videoEl.current &&
      videoEl.current.play().catch(error => {
        console.error("Erro ao tentar reproduzir!", error);
      });
  };

  const handlePlay = () => {
    if (onPlay) onPlay();
  };

  const handlePause = () => {
    if (onPause) onPause();
  };

  useEffect(() => {
    if (autoplay) {
      attemptPlay();
    }
  }, [autoplay]);

  return (
      <video
        style={{ maxWidth: "100%", width: "1000px", margin: "0 auto", borderRadius: "8px" }}
        playsInline
        loop
        muted
        controls
        src={videoSrc} 
        alt="All the devices"
        ref={videoEl}
        onPlay={handlePlay}
        onPause={handlePause}
      >
        <source src={videoSrc}  />

      </video>
  )
});

export default Player;
