import BackToHome from "../component/BackToHome";
import "../assignments/ASG_31.css";
import { useState, useEffect, useRef } from "react";

export default function ASG_31() {
  const [play, setPlay] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef(null);

  const handlePlayPause = () => {
    const myVideo = videoRef.current;
    if (!myVideo) return;
    if (myVideo.paused) {
      myVideo.play();
      setPlay(true);
    } else {
      myVideo.pause();
      setPlay(false);
    }
  };

  const handleTimeUpdate = () => {
    const myVideo = videoRef.current;
    if (myVideo) {
      setCurrentTime(myVideo.currentTime);
      setDuration(myVideo.duration || 0);
    }
  };

  const handleProgressClick = (e) => {
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const myVideo = videoRef.current;

    if (myVideo && duration) {
      const newTime = (clickX / width) * duration;
      myVideo.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const seconds = Math.floor(time);
    const miniSeconds = Math.floor((time % 1) * 100);
    return `${seconds}:${miniSeconds.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const myVideo = videoRef.current;
    if (myVideo) {
      myVideo.addEventListener("timeupdate", handleTimeUpdate);
      myVideo.addEventListener("loadedmetadata", handleTimeUpdate);

      return () => {
        myVideo.removeEventListener("timeupdate", handleTimeUpdate);
        myVideo.removeEventListener("loadedmetadata", handleTimeUpdate);
      };
    }
  }, []);

  return (
    <>
      <BackToHome />
      <h1 className="assignment-title">Assignment-31</h1>
      <hr />
      <br />
      <div className="asg31-container">
        <video
          className="asg31-video"
          ref={videoRef}
          loop
          autoPlay
          muted
          id="asg31-video"
        >
          <source src="/custom-video-player.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        <div className="asg31-controls">
          <button
            className={`asg31-play-btn ${play ? "pause" : "play"}`}
            onClick={handlePlayPause}
          ></button>

          <div
            className="asg31-progress-container"
            onClick={handleProgressClick}
          >
            <div className="asg31-progress-bar">
              <div
                className="asg31-progress-fill"
                style={{
                  width: `${
                    duration ? (currentTime / duration) * 100 : 0
                  }%`,
                }}
              ></div>
            </div>
          </div>

          <div className="asg31-time-display">
            <span className="asg31-current-time">
              {formatTime(currentTime)}
            </span>
            <span>/</span>
            <span className="asg31-total-time">{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </>
  );
}
