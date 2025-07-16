import BackToHome from "../component/BackToHome";
import "../assignments/ASG_31.css";
import { useState, useEffect } from "react";
import * as faceapi from "face-api.js";

export default function ASG_31() {
  const [image, setImage] = useState(null);
  const [video, setVideo] = useState(null);
  const [videoActive, setVideoActive] = useState(false);
  const [stream, setStream] = useState(null);
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sunglassesImg, setSunglassesImg] = useState(null);

  // Preload sunglasses image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setSunglassesImg(img);
      console.log("Sunglasses image loaded successfully");
    };
    img.onerror = () => {
      console.error("Failed to load sunglasses image");
    };
    img.src = "/sunglasses2.png";
  }, []);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    e.target.value = null;

    const fileURL = URL.createObjectURL(file);

    if (file.type.startsWith("image/")) {
      setVideo(null);
      setImage(fileURL);
      detectImageFaces(fileURL);
      setLoading(true);
    } else if (file.type.startsWith("video/")) {
      setImage(null);
      setVideo(fileURL);
      setLoading(true);
    } else {
      alert("Unsupported file type. Please upload an image or video");
    }
  };

  // Head pose estimation functions
  const getDistance = (...points) => {
    let d = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      d += Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
    }
    return d;
  };

  const getOrientation = (positions, box) => {
    // Landmark indices for face pose estimation
    const eyesMiddle = 28;
    const eyesMiddleTop = 28;
    const eyesMiddleBottom = 30;
    const lipsBottom = 58;
    const faceBottom = 9;
    const rightEyeInner = 40;
    const rightEyeOuter = 37;
    const leftEyeInner = 43;
    const leftEyeOuter = 46;

    // Fix position calculation - box has x, y, width, height properties
    const pos_x = box.x + box.width / 2;
    const pos_y = box.y + box.height / 2;
    const pos_z = 0;

    // Check if required landmark positions exist
    if (!positions[eyesMiddleBottom] || !positions[eyesMiddleTop] || 
        !positions[lipsBottom] || !positions[faceBottom] ||
        !positions[rightEyeOuter] || !positions[rightEyeInner] ||
        !positions[leftEyeInner] || !positions[leftEyeOuter]) {
      return null;
    }

    // rotation : x
    const rot_x_a = getDistance(
      positions[eyesMiddleBottom],
      positions[eyesMiddleTop]
    );
    const rot_x_b = getDistance(positions[lipsBottom], positions[faceBottom]);
    const rot_x = rot_x_a + rot_x_b > 0 ? Math.asin((0.5 - rot_x_b / (rot_x_a + rot_x_b)) * 2) : 0;

    // rotation : y
    const rot_y_a = getDistance(
      positions[rightEyeOuter],
      positions[rightEyeInner]
    );
    const rot_y_b = getDistance(
      positions[leftEyeInner],
      positions[leftEyeOuter]
    );
    const rot_y = rot_y_a + rot_y_b > 0 ? Math.asin((0.5 - rot_y_b / (rot_y_a + rot_y_b)) * 2) * 2.5 : 0;

    // rotation : z
    const rot_z_y = positions[rightEyeOuter].y - positions[leftEyeOuter].y;
    const rot_z_d = getDistance(
      positions[rightEyeOuter],
      positions[leftEyeOuter]
    );
    const rot_z = rot_z_d > 0 ? (
      positions[rightEyeOuter].x < positions[leftEyeOuter].x
        ? Math.asin(rot_z_y / rot_z_d)
        : 1 - Math.asin(rot_z_y / rot_z_d) + Math.PI * 0.68
    ) : 0;

    // scale
    const scale = getDistance(positions[rightEyeOuter], positions[leftEyeOuter]) * 0.7;

    // limit y rotation
    if (Math.abs(rot_y) > 0.7) {
      return null;
    }

    return {
      position: { x: pos_x, y: pos_y, z: pos_z },
      rotation: { x: rot_x, y: rot_y, z: rot_z },
      scale: { x: scale, y: scale, z: scale },
    };
  };

  const drawHeadPose = (ctx, orientation, scaleX, scaleY) => {
    if (!orientation) return;

    const centerX = orientation.position.x * scaleX;
    const centerY = orientation.position.y * scaleY;
    const scale = orientation.scale.x * Math.min(scaleX, scaleY);

    // Draw coordinate axes to show head orientation
    ctx.lineWidth = 3;

    // X-axis (red) - left/right rotation
    ctx.strokeStyle = "#ff0000";
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.cos(orientation.rotation.y) * scale * 0.3,
      centerY + Math.sin(orientation.rotation.x) * scale * 0.3
    );
    ctx.stroke();

    // Y-axis (green) - up/down rotation
    ctx.strokeStyle = "#00ff00";
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.sin(orientation.rotation.y) * scale * 0.3,
      centerY - Math.cos(orientation.rotation.x) * scale * 0.3
    );
    ctx.stroke();

    // Z-axis (blue) - roll rotation
    ctx.strokeStyle = "#0000ff";
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.cos(orientation.rotation.z) * scale * 0.2,
      centerY + Math.sin(orientation.rotation.z) * scale * 0.2
    );
    ctx.stroke();

    // Draw center point
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI);
    ctx.fill();
  };

  const drawSunglasses = (canvas, landmarks, scaleX, scaleY) => {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    
    // Check if sunglasses image is loaded
    if (!sunglassesImg) return;
    
    // Get eye landmarks
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    
    if (leftEye.length === 0 || rightEye.length === 0) return;
    
    // Calculate eye centers
    const leftEyeCenter = {
      x: leftEye.reduce((sum, point) => sum + point.x, 0) / leftEye.length,
      y: leftEye.reduce((sum, point) => sum + point.y, 0) / leftEye.length
    };
    
    const rightEyeCenter = {
      x: rightEye.reduce((sum, point) => sum + point.x, 0) / rightEye.length,
      y: rightEye.reduce((sum, point) => sum + point.y, 0) / rightEye.length
    };
    
    // Calculate sunglasses dimensions and position
    const eyeDistance = Math.sqrt(
      Math.pow(rightEyeCenter.x - leftEyeCenter.x, 2) + 
      Math.pow(rightEyeCenter.y - leftEyeCenter.y, 2)
    );
    
    const centerX = ((leftEyeCenter.x + rightEyeCenter.x) / 2) * scaleX;
    const centerY = ((leftEyeCenter.y + rightEyeCenter.y) / 2) * scaleY;
    
    // Calculate rotation angle
    const angle = Math.atan2(
      (rightEyeCenter.y - leftEyeCenter.y) * scaleY,
      (rightEyeCenter.x - leftEyeCenter.x) * scaleX
    );
    
    // Draw the sunglasses image
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);
    
    // Calculate the size based on eye distance
    const sunglassesWidth = eyeDistance * 2.2 * scaleX;
    const sunglassesHeight = (sunglassesImg.height / sunglassesImg.width) * sunglassesWidth;
    
    // Draw the sunglasses image centered on the eyes
    ctx.drawImage(
      sunglassesImg,
      -sunglassesWidth / 2,
      -sunglassesHeight / 2 + eyeDistance * 0.1 * scaleY, // Slight vertical offset
      sunglassesWidth,
      sunglassesHeight
    );
    
    ctx.restore();
  };

  const detectImageFaces = async (imageURL) => {
    const img = new Image();
    img.src = imageURL;

    img.onload = async () => {
      const canvas = document.getElementById("face-canvas");
      const sunglassesCanvas = document.getElementById("sunglasses-canvas");

      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);

      const detections = await faceapi
        .detectAllFaces(canvas, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      setTimeout(() => {
        const displayedWidth = canvas.offsetWidth;
        const displayedHeight = canvas.offsetHeight;

        sunglassesCanvas.width = displayedWidth;
        sunglassesCanvas.height = displayedHeight;
        sunglassesCanvas.style.width = displayedWidth + "px";
        sunglassesCanvas.style.height = displayedHeight + "px";

        const scaleX = displayedWidth / img.width;
        const scaleY = displayedHeight / img.height;

        const sunglassesCtx = sunglassesCanvas.getContext("2d");
        sunglassesCtx.clearRect(0, 0, sunglassesCanvas.width, sunglassesCanvas.height);

        detections.forEach((detection) => {
          drawSunglasses(sunglassesCanvas, detection.landmarks, scaleX, scaleY);
        });

        setLoading(false);
      }, 100);
    };
  };

  const startVideo = async () => {
    try {
      setLoading(true);
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      setStream(videoStream);
      setVideoActive(true);
      setLoading(false);
    } catch (err) {
      console.error("Error accessing webcam:", err);
      setLoading(false);
    }
  };

  const detectVideoFaces = async () => {
    const video = document.getElementById("video");
    const sunglassesCanvas = document.getElementById("video-sunglasses-canvas");

    if (video && video.readyState === 4 && sunglassesCanvas) {
      try {
        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks();

        const videoRect = video.getBoundingClientRect();
        const scaleX = videoRect.width / video.videoWidth;
        const scaleY = videoRect.height / video.videoHeight;

        sunglassesCanvas.width = videoRect.width;
        sunglassesCanvas.height = videoRect.height;
        sunglassesCanvas.style.width = videoRect.width + "px";
        sunglassesCanvas.style.height = videoRect.height + "px";

        const sunglassesCtx = sunglassesCanvas.getContext("2d", {
          willReadFrequently: true,
        });
        sunglassesCtx.clearRect(0, 0, sunglassesCanvas.width, sunglassesCanvas.height);

        detections.forEach((detection) => {
          drawSunglasses(sunglassesCanvas, detection.landmarks, scaleX, scaleY);
        });
      } catch (error) {
        console.error("Error in video face detection:", error);
      }
    }

    if (videoActive) {
      requestAnimationFrame(detectVideoFaces);
    }
  };

  const detectVideoFileFaces = async () => {
    const videoElement = document.getElementById("uploaded-video");
    const sunglassesCanvas = document.getElementById("video-file-sunglasses-canvas");

    if (videoElement && videoElement.readyState >= 2 && sunglassesCanvas) {
      try {
        const detections = await faceapi
          .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks();

        const videoRect = videoElement.getBoundingClientRect();
        const scaleX = videoRect.width / videoElement.videoWidth;
        const scaleY = videoRect.height / videoElement.videoHeight;

        sunglassesCanvas.width = videoRect.width;
        sunglassesCanvas.height = videoRect.height;
        sunglassesCanvas.style.width = videoRect.width + "px";
        sunglassesCanvas.style.height = videoRect.height + "px";

        const sunglassesCtx = sunglassesCanvas.getContext("2d", {
          willReadFrequently: true,
        });
        sunglassesCtx.clearRect(0, 0, sunglassesCanvas.width, sunglassesCanvas.height);

        detections.forEach((detection) => {
          drawSunglasses(sunglassesCanvas, detection.landmarks, scaleX, scaleY);
        });
      } catch (error) {
        console.error("Error in video file face detection:", error);
      }
    }

    if (video && !videoElement?.paused) {
      requestAnimationFrame(detectVideoFileFaces);
    }
  };

  const handleVideoLoad = () => {
    setLoading(false);
    detectVideoFileFaces();
  };

  const handleReset = () => {
    setBoxes([]);
    setImage(null);
    setVideo(null);
    setVideoActive(false);
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
    setLoading(false);
  };

  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
        console.log(
          "TinyFaceDetector and FaceLandmark models loaded successfully"
        );
      } catch (error) {
        console.error("Error loading models:", error);
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    if (videoActive && stream) {
      const video = document.getElementById("video");
      video.srcObject = stream;
      video.onloadedmetadata = () => {
        detectVideoFaces();
      };
    }
  }, [videoActive, stream]);

  return (
    <>
      <BackToHome />
      <h1 className="assignment-title">Assignment-31</h1>
      <hr />
      <div className="asg31-container">
        <input
          type="file"
          accept="image/*, video/*"
          disabled={loading || videoActive || image || video}
          onChange={handleUpload}
        />

        <button 
          onClick={startVideo} 
          disabled={loading || videoActive || image || video}
        >
          {loading ? "Loading..." : "Start Webcam"}
        </button>

        {(image || video || videoActive) && (
          <button onClick={handleReset}>Reset</button>
        )}

        {(image || video || videoActive) && (
          <>
            {image && !videoActive && !video && (
              <div className="face-container">
                <canvas id="face-canvas" className="canvas-image" />
                <canvas id="sunglasses-canvas" className="sunglasses-overlay" />
              </div>
            )}

            {video && !videoActive && (
              <div className="face-container">
                <video
                  id="uploaded-video"
                  src={video}
                  autoPlay
                  muted
                  loop
                  controls
                  className="canvas-image"
                  style={{ width: "100%" }}
                  onLoadedData={handleVideoLoad}
                  onPlay={detectVideoFileFaces}
                />
                <canvas
                  id="video-file-sunglasses-canvas"
                  className="sunglasses-overlay"
                />
              </div>
            )}

            {videoActive && (
              <div className="face-container">
                <video
                  id="video"
                  autoPlay
                  muted
                  className="canvas-image"
                  style={{ width: "100%" }}
                />
                <canvas
                  id="video-sunglasses-canvas"
                  className="sunglasses-overlay"
                />
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
