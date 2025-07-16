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
    
    // Get eye landmarks
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    const jawLine = landmarks.getJawOutline();
    
    if (leftEye.length === 0 || rightEye.length === 0 || jawLine.length === 0) return;
    
    // Calculate eye centers
    const leftEyeCenter = {
      x: leftEye.reduce((sum, point) => sum + point.x, 0) / leftEye.length,
      y: leftEye.reduce((sum, point) => sum + point.y, 0) / leftEye.length
    };
    
    const rightEyeCenter = {
      x: rightEye.reduce((sum, point) => sum + point.x, 0) / rightEye.length,
      y: rightEye.reduce((sum, point) => sum + point.y, 0) / rightEye.length
    };
    
    // Get ear positions from jaw outline (approximate ear locations)
    const leftEarApprox = jawLine[0];  // First point of jaw outline (left side)
    const rightEarApprox = jawLine[jawLine.length - 1];  // Last point of jaw outline (right side)
    
    // More accurate ear positioning based on face landmarks
    const faceWidth = Math.abs(rightEarApprox.x - leftEarApprox.x);
    const eyeLevel = (leftEyeCenter.y + rightEyeCenter.y) / 2;
    
    // Calculate ear positions relative to eye level
    const leftEar = {
      x: leftEarApprox.x - faceWidth * 0.05, // Extended further out for longer arms
      y: eyeLevel + (leftEyeCenter.y - eyeLevel) * 0.4 // Slightly more below eye level
    };
    
    const rightEar = {
      x: rightEarApprox.x + faceWidth * 0.05, // Extended further out for longer arms
      y: eyeLevel + (rightEyeCenter.y - eyeLevel) * 0.4 // Slightly more below eye level
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
    
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);
    
    // Lens dimensions - slightly smaller for more realistic look
    const lensRadius = eyeDistance * 0.32 * Math.min(scaleX, scaleY);
    const lensOffsetX = eyeDistance * 0.40 * scaleX;
    const lensOffsetY = -eyeDistance * 0.03 * scaleY;
    
    // Draw lens shadows first (for depth effect)
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Left lens
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.arc(-lensOffsetX, lensOffsetY, lensRadius, 0, 2 * Math.PI);
    ctx.fill();
    
    // Right lens  
    ctx.beginPath();
    ctx.arc(lensOffsetX, lensOffsetY, lensRadius, 0, 2 * Math.PI);
    ctx.fill();
    
    // Reset shadow for frame
    ctx.shadowColor = 'transparent';
    
    // Draw frame around lenses
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Left lens frame
    ctx.beginPath();
    ctx.arc(-lensOffsetX, lensOffsetY, lensRadius + 2, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Right lens frame
    ctx.beginPath();
    ctx.arc(lensOffsetX, lensOffsetY, lensRadius + 2, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Bridge between lenses
    const bridgeY = lensOffsetY - lensRadius * 0.25;
    const bridgeStartX = -lensOffsetX + lensRadius * 0.7;
    const bridgeEndX = lensOffsetX - lensRadius * 0.7;
    
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bridgeStartX, bridgeY);
    ctx.quadraticCurveTo(0, bridgeY - 4, bridgeEndX, bridgeY);
    ctx.stroke();
    
    // Calculate temple connection points and ear positions in rotated coordinate system
    const templeStartY = lensOffsetY;
    
    // Transform ear positions to the rotated coordinate system
    const cos_angle = Math.cos(-angle);
    const sin_angle = Math.sin(-angle);
    
    // Left ear in rotated coordinates
    const leftEarRelX = (leftEar.x * scaleX - centerX);
    const leftEarRelY = (leftEar.y * scaleY - centerY);
    const leftEarRotX = leftEarRelX * cos_angle - leftEarRelY * sin_angle;
    const leftEarRotY = leftEarRelX * sin_angle + leftEarRelY * cos_angle;
    
    // Right ear in rotated coordinates  
    const rightEarRelX = (rightEar.x * scaleX - centerX);
    const rightEarRelY = (rightEar.y * scaleY - centerY);
    const rightEarRotX = rightEarRelX * cos_angle - rightEarRelY * sin_angle;
    const rightEarRotY = rightEarRelX * sin_angle + rightEarRelY * cos_angle;
    
    // Draw realistic temple arms that curve toward the ears
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 3;
    
    // Left temple - curved path to ear
    const leftTempleStartX = -lensOffsetX - lensRadius * 0.9;
    ctx.beginPath();
    ctx.moveTo(leftTempleStartX, templeStartY);
    
    // Control points for smooth curve to ear - extended length
    const leftControlX1 = leftTempleStartX - eyeDistance * 0.5 * scaleX;
    const leftControlY1 = templeStartY - 8;
    const leftControlX2 = leftEarRotX + eyeDistance * 0.15 * scaleX;
    const leftControlY2 = leftEarRotY - 15;
    
    ctx.bezierCurveTo(leftControlX1, leftControlY1, leftControlX2, leftControlY2, leftEarRotX, leftEarRotY);
    ctx.stroke();
    
    // Right temple - curved path to ear  
    const rightTempleStartX = lensOffsetX + lensRadius * 0.9;
    ctx.beginPath();
    ctx.moveTo(rightTempleStartX, templeStartY);
    
    // Control points for smooth curve to ear - extended length
    const rightControlX1 = rightTempleStartX + eyeDistance * 0.5 * scaleX;
    const rightControlY1 = templeStartY - 8;
    const rightControlX2 = rightEarRotX - eyeDistance * 0.15 * scaleX;
    const rightControlY2 = rightEarRotY - 15;
    
    ctx.bezierCurveTo(rightControlX1, rightControlY1, rightControlX2, rightControlY2, rightEarRotX, rightEarRotY);
    ctx.stroke();
    
    // Add ear pieces (small curved ends) - extended
    ctx.lineWidth = 2.5;
    
    // Left ear piece - longer curve
    ctx.beginPath();
    ctx.arc(leftEarRotX, leftEarRotY, 4, 0, Math.PI * 1.2);
    ctx.stroke();
    
    // Right ear piece - longer curve
    ctx.beginPath();
    ctx.arc(rightEarRotX, rightEarRotY, 4, 0, Math.PI * 1.2);
    ctx.stroke();
    
    // Add realistic lens effects
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#ffffff';
    
    // Left lens highlight
    ctx.beginPath();
    ctx.ellipse(-lensOffsetX - lensRadius * 0.25, lensOffsetY - lensRadius * 0.25, 
                lensRadius * 0.35, lensRadius * 0.5, -0.4, 0, 2 * Math.PI);
    ctx.fill();
    
    // Right lens highlight
    ctx.beginPath();
    ctx.ellipse(lensOffsetX - lensRadius * 0.25, lensOffsetY - lensRadius * 0.25, 
                lensRadius * 0.35, lensRadius * 0.5, -0.4, 0, 2 * Math.PI);
    ctx.fill();
    
    // Add smaller bright reflections
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#ffffff';
    
    // Left lens small highlight
    ctx.beginPath();
    ctx.arc(-lensOffsetX - lensRadius * 0.35, lensOffsetY - lensRadius * 0.35, lensRadius * 0.12, 0, 2 * Math.PI);
    ctx.fill();
    
    // Right lens small highlight
    ctx.beginPath();
    ctx.arc(lensOffsetX - lensRadius * 0.35, lensOffsetY - lensRadius * 0.35, lensRadius * 0.12, 0, 2 * Math.PI);
    ctx.fill();
    
    // Add subtle gradient effect to lenses for depth
    ctx.globalAlpha = 0.08;
    const gradient = ctx.createRadialGradient(-lensOffsetX, lensOffsetY, 0, -lensOffsetX, lensOffsetY, lensRadius);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(-lensOffsetX, lensOffsetY, lensRadius, 0, 2 * Math.PI);
    ctx.fill();
    
    const gradient2 = ctx.createRadialGradient(lensOffsetX, lensOffsetY, 0, lensOffsetX, lensOffsetY, lensRadius);
    gradient2.addColorStop(0, '#ffffff');
    gradient2.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient2;
    ctx.beginPath();
    ctx.arc(lensOffsetX, lensOffsetY, lensRadius, 0, 2 * Math.PI);
    ctx.fill();
    
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
      <div className="asg30-container">
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
