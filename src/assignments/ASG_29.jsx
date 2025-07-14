import BackToHome from "../component/BackToHome";
import "../assignments/ASG_29.css";
import { useState, useEffect } from "react";
import * as faceapi from "face-api.js";

export default function ASG_29() {
  const [image, setImage] = useState(null);
  const [webCamVideo, setWebCamVideo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stream, setStream] = useState(null);
  const [faceBoxes, setFaceBoxes] = useState([]);
  const [videoFaceBoxes, setVideoFaceBoxes] = useState([]);
  const [detectionResults, setDetectionResults] = useState([]);
  const [videoDetectionResults, setVideoDetectionResults] = useState([]);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const imageURL = URL.createObjectURL(file);
    setImage(imageURL);
    getFaces(imageURL);
  };

  const drawLandmarks = (canvas, landmarks, scaleX, scaleY) => {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.strokeStyle = '#ff0000';
    ctx.fillStyle = '#ff0000';
    ctx.lineWidth = 1;

    // Draw landmark points
    landmarks.positions.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x * scaleX, point.y * scaleY, 2, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw face outline
    const jaw = landmarks.getJawOutline();
    const nose = landmarks.getNose();
    const mouth = landmarks.getMouth();
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    const leftEyebrow = landmarks.getLeftEyeBrow();
    const rightEyebrow = landmarks.getRightEyeBrow();

    const drawPath = (points, closePath = false) => {
      if (points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(points[0].x * scaleX, points[0].y * scaleY);
        points.forEach(point => {
          ctx.lineTo(point.x * scaleX, point.y * scaleY);
        });
        if (closePath) ctx.closePath();
        ctx.stroke();
      }
    };

    // Draw all facial features
    drawPath(jaw);
    drawPath(nose);
    drawPath(mouth, true);
    drawPath(leftEye, true);
    drawPath(rightEye, true);
    drawPath(leftEyebrow);
    drawPath(rightEyebrow);
  };

  const getFaces = async (imageURL) => {
    const img = new Image();
    img.src = imageURL;

    img.onload = async () => {
      const canvas = document.getElementById("face-canvas");
      const landmarkCanvas = document.getElementById("landmark-canvas");
      
      // Set canvas internal dimensions to match image
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);

      // Detect faces with landmarks and expressions
      const detections = await faceapi
        .detectAllFaces(canvas)
        .withFaceLandmarks()
        .withFaceExpressions();

      // Wait for next frame to ensure canvas is rendered with correct dimensions
      setTimeout(() => {
        const displayedWidth = canvas.offsetWidth;
        const displayedHeight = canvas.offsetHeight;
        
        // Set landmark canvas dimensions to match displayed canvas
        landmarkCanvas.width = displayedWidth;
        landmarkCanvas.height = displayedHeight;
        landmarkCanvas.style.width = displayedWidth + 'px';
        landmarkCanvas.style.height = displayedHeight + 'px';
        
        // Calculate scale ratios from original image to displayed size
        const scaleX = displayedWidth / img.width;
        const scaleY = displayedHeight / img.height;

        // Clear previous landmarks
        const landmarkCtx = landmarkCanvas.getContext('2d');
        landmarkCtx.clearRect(0, 0, landmarkCanvas.width, landmarkCanvas.height);

        const results = detections.map((detection, index) => {
          const { x, y, width, height } = detection.detection.box;
          
          // Draw landmarks for this face
          drawLandmarks(landmarkCanvas, detection.landmarks, scaleX, scaleY);
          
          return {
            id: index,
            box: {
              x: x * scaleX,
              y: y * scaleY,
              width: width * scaleX,
              height: height * scaleY,
            },
            landmarks: detection.landmarks,
            expressions: detection.expressions,
          };
        });

        setFaceBoxes(results.map(r => r.box));
        setDetectionResults(results);
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
      setWebCamVideo(true);
      setLoading(false);
    } catch (err) {
      console.error("Error accessing webcam:", err);
      setLoading(false);
    }
  };

  const detectVideoFaces = async () => {
    const video = document.getElementById("video");
    const landmarkCanvas = document.getElementById("video-landmark-canvas");
    
    if (video && video.readyState === 4 && landmarkCanvas) {
      // Detect faces with landmarks and expressions for video
      const detections = await faceapi
        .detectAllFaces(video)
        .withFaceLandmarks()
        .withFaceExpressions();

      const videoRect = video.getBoundingClientRect();
      const scaleX = videoRect.width / video.videoWidth;
      const scaleY = videoRect.height / video.videoHeight;

      // Set canvas size to match video display size exactly
      landmarkCanvas.width = videoRect.width;
      landmarkCanvas.height = videoRect.height;
      landmarkCanvas.style.width = videoRect.width + 'px';
      landmarkCanvas.style.height = videoRect.height + 'px';

      // Clear previous landmarks
      const landmarkCtx = landmarkCanvas.getContext('2d', { willReadFrequently: true });
      landmarkCtx.clearRect(0, 0, landmarkCanvas.width, landmarkCanvas.height);

      const results = detections.map((detection, index) => {
        const { x, y, width, height } = detection.detection.box;
        
        // Draw landmarks for this face using the same scale as the video
        drawLandmarks(landmarkCanvas, detection.landmarks, scaleX, scaleY);
        
        return {
          id: index,
          box: {
            x: x * scaleX,
            y: y * scaleY,
            width: width * scaleX,
            height: height * scaleY,
          },
          landmarks: detection.landmarks,
          expressions: detection.expressions,
        };
      });

      setVideoFaceBoxes(results.map(r => r.box));
      setVideoDetectionResults(results);
    }

    if (webCamVideo) {
      requestAnimationFrame(detectVideoFaces);
    }
  };

  const handleReset = () => {
    setFaceBoxes([]);
    setVideoFaceBoxes([]);
    setDetectionResults([]);
    setVideoDetectionResults([]);
    setImage(null);
    setWebCamVideo(false);
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
        await faceapi.nets.ssdMobilenetv1.loadFromUri("/models");
        await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
        await faceapi.nets.faceExpressionNet.loadFromUri("/models");
        console.log("All models loaded successfully");
      } catch (error) {
        console.error("Error loading models:", error);
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    if (stream && webCamVideo) {
      const video = document.getElementById("video");
      if (video) {
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          detectVideoFaces();
        };
      }
    }
  }, [stream, webCamVideo]);

  return (
    <>
      <BackToHome />
      <h1 className="assignment-title">Assignment-29</h1>
      <hr />
      <br />
      <div className="asg29-container">
        <div className="asg29-upload">
          <input
            type="file"
            accept="image/*"
            className="asg29-button"
            onChange={handleUpload}
            disabled={loading}
          />
          <button
            className="asg29-button"
            onClick={startVideo}
            disabled={loading}
          >
            {loading ? "Loading..." : "Use Webcam"}
          </button>
        </div>

        {image && (
          <div className="face-container">
            <canvas id="face-canvas" className="canvas-image" />
            <canvas id="landmark-canvas" className="landmark-overlay" />
            {faceBoxes.map((box, index) => (
              <div
                key={index}
                className="face-box"
                style={{
                  top: `${box.y}px`,
                  left: `${box.x}px`,
                  width: `${box.width}px`,
                  height: `${box.height}px`,
                }}
              />
            ))}
          </div>
        )}

        {webCamVideo && (
          <div className="asg29-canvas">
            <div className="face-container">
              <video
                id="video"
                autoPlay
                className="canvas-image"
                style={{ width: "100%", height: "auto" }}
              />
              <canvas id="video-landmark-canvas" className="landmark-overlay" />
              {videoFaceBoxes.map((box, index) => (
                <div
                  key={index}
                  className="face-box"
                  style={{
                    top: `${box.y}px`,
                    left: `${box.x}px`,
                    width: `${box.width}px`,
                    height: `${box.height}px`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {(image || webCamVideo) && (
          <div className="asg29-reset-button">
            <button className="asg29-reset" onClick={handleReset}>
              Reset
            </button>
          </div>
        )}

        {image && detectionResults.length > 0 && (
          <div className="detection-info">
            <h3>Detection Results:</h3>
            {detectionResults.map((result, index) => (
              <div key={index} className="face-info">
                <h4>Face {index + 1}</h4>
                <div className="expressions">
                  <strong>Expressions:</strong>
                  {Object.entries(result.expressions).map(([emotion, confidence]) => (
                    <div key={emotion} className="expression-item">
                      {emotion}: {(confidence * 100).toFixed(1)}%
                    </div>
                  ))}
                </div>
                <div className="landmarks-count">
                  <strong>Landmarks detected:</strong> {result.landmarks.positions.length} points
                </div>
              </div>
            ))}
          </div>
        )}

        {webCamVideo && videoDetectionResults.length > 0 && (
          <div className="detection-info">
            <h3>Live Detection:</h3>
            {videoDetectionResults.map((result, index) => (
              <div key={index} className="face-info">
                <h4>Face {index + 1}</h4>
                <div className="expressions">
                  <strong>Top Expression:</strong>
                  {Object.entries(result.expressions)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([emotion, confidence]) => (
                      <div key={emotion} className="expression-item">
                        {emotion}: {(confidence * 100).toFixed(1)}%
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
