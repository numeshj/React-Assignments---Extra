import BackToHome from "../component/BackToHome";
import "../assignments/ASG_29.css";
import { useState, useEffect } from "react";
import * as faceapi from "face-api.js";

export default function ASG_29() {
  const [image, setImage] = useState(null);
  const [videoActive, setVideoActive] = useState(false);
  const [stream, setStream] = useState(null);
  const [boxes, setBoxes] = useState([]);
  const [detectionResults, setDetectionResults] = useState([]);
  const [videoDetectionResults, setVideoDetectionResults] = useState([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [error, setError] = useState(null);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!modelsLoaded) {
      setError("Models are still loading. Please wait...");
      return;
    }

    // Reset previous results
    setDetectionResults([]);
    setBoxes([]);
    setError(null);
    
    const imageURL = URL.createObjectURL(file);
    setImage(imageURL);
    console.log("Image uploaded, starting detection...");
    detectImageFaces(imageURL);
  };

  const drawLandmarks = (canvas, landmarks, scaleX, scaleY) => {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.strokeStyle = "#ff0000";
    ctx.fillStyle = "#ff0000";
    ctx.lineWidth = 2;

    // Draw individual landmark points
    landmarks.positions.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x * scaleX, point.y * scaleY, 2, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw facial feature outlines
    try {
      const jaw = landmarks.getJawOutline();
      const nose = landmarks.getNose();
      const mouth = landmarks.getMouth();
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
      const leftEyebrow = landmarks.getLeftEyeBrow();
      const rightEyebrow = landmarks.getRightEyeBrow();

      const drawPath = (points, closePath = false) => {
        if (points && points.length > 0) {
          ctx.beginPath();
          ctx.moveTo(points[0].x * scaleX, points[0].y * scaleY);
          points.forEach((point) => {
            ctx.lineTo(point.x * scaleX, point.y * scaleY);
          });
          if (closePath) ctx.closePath();
          ctx.stroke();
        }
      };
      
      drawPath(jaw);
      drawPath(nose);
      drawPath(mouth, true);
      drawPath(leftEye, true);
      drawPath(rightEye, true);
      drawPath(leftEyebrow);
      drawPath(rightEyebrow);
    } catch (error) {
      console.warn("Error drawing facial feature outlines:", error);
    }
  };

  const detectImageFaces = async (imageURL) => {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageURL;

      img.onload = async () => {
        const canvas = document.getElementById("face-canvas");
        const landmarkCanvas = document.getElementById("landmark-canvas");

        if (!canvas || !landmarkCanvas) {
          console.error("Canvas elements not found");
          return;
        }

        // Set canvas dimensions to match image
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);

        console.log("Running face detection...");
        const detections = await faceapi
          .detectAllFaces(canvas, new faceapi.TinyFaceDetectorOptions({
            inputSize: 416,
            scoreThreshold: 0.5
          }))
          .withFaceLandmarks()
          .withFaceExpressions();

        console.log(`Found ${detections.length} faces`);

        // Use setTimeout to ensure DOM has updated
        setTimeout(() => {
          const displayedWidth = canvas.offsetWidth;
          const displayedHeight = canvas.offsetHeight;

          if (displayedWidth === 0 || displayedHeight === 0) {
            console.warn("Canvas not properly displayed yet");
            return;
          }

          landmarkCanvas.width = displayedWidth;
          landmarkCanvas.height = displayedHeight;
          landmarkCanvas.style.width = displayedWidth + "px";
          landmarkCanvas.style.height = displayedHeight + "px";

          const scaleX = displayedWidth / img.width;
          const scaleY = displayedHeight / img.height;

          const landmarkCtx = landmarkCanvas.getContext("2d");
          landmarkCtx.clearRect(0, 0, landmarkCanvas.width, landmarkCanvas.height);

          const results = detections.map((detection, index) => {
            const box = detection.detection.box;

            drawLandmarks(landmarkCanvas, detection.landmarks, scaleX, scaleY);

            return {
              id: index,
              box: {
                x: box.x * scaleX,
                y: box.y * scaleY,
                width: box.width * scaleX,
                height: box.height * scaleY,
              },
              landmarks: detection.landmarks,
              expressions: detection.expressions,
            };
          });

          setBoxes(results.map(r => r.box));
          setDetectionResults(results);
        }, 100);
      };

      img.onerror = () => {
        setError("Failed to load image");
      };
    } catch (error) {
      console.error("Error detecting faces:", error);
      setError("Failed to detect faces in image: " + error.message);
    }
  };

  const startVideo = async () => {
    if (!modelsLoaded) {
      setError("Models are still loading. Please wait...");
      return;
    }

    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      setStream(videoStream);
      setVideoActive(true);
      setError(null);
    } catch (error) {
      console.error("Error accessing webcam:", error);
      setError("Could not access webcam. Please check permissions.");
    }
  };

  const detectVideoFaces = async () => {
    if (!videoActive || !modelsLoaded) return;
    
    const video = document.getElementById("video");
    const landmarkCanvas = document.getElementById("video-landmark-canvas");

    if (video && video.readyState === 4 && landmarkCanvas && video.videoWidth > 0) {
      try {
        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({
            inputSize: 416,
            scoreThreshold: 0.5
          }))
          .withFaceLandmarks()
          .withFaceExpressions();

        const videoRect = video.getBoundingClientRect();
        const scaleX = videoRect.width / video.videoWidth;
        const scaleY = videoRect.height / video.videoHeight;

        landmarkCanvas.width = videoRect.width;
        landmarkCanvas.height = videoRect.height;
        landmarkCanvas.style.width = videoRect.width + "px";
        landmarkCanvas.style.height = videoRect.height + "px";

        const landmarkCtx = landmarkCanvas.getContext("2d", {
          willReadFrequently: true,
        });
        landmarkCtx.clearRect(0, 0, landmarkCanvas.width, landmarkCanvas.height);

        const results = detections.map((detection, index) => {
          const box = detection.detection.box;

          drawLandmarks(landmarkCanvas, detection.landmarks, scaleX, scaleY);

          return {
            id: index,
            box: {
              x: box.x * scaleX,
              y: box.y * scaleY,
              width: box.width * scaleX,
              height: box.height * scaleY,
            },
            landmarks: detection.landmarks,
            expressions: detection.expressions,
          };
        });

        setBoxes(results.map(r => r.box));
        setVideoDetectionResults(results);
      } catch (error) {
        console.error("Error in video detection:", error);
      }
    }

    if (videoActive) {
      requestAnimationFrame(detectVideoFaces);
    }
  };

  const handleReset = () => {
    setBoxes([]);
    setDetectionResults([]);
    setVideoDetectionResults([]);
    setImage(null);
    setVideoActive(false);
    setError(null);
    
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
  };

  useEffect(() => {
    const loadModels = async () => {
      try {
        setError("Loading face detection models...");
        console.log("Starting to load models...");
        
        // Load models from the public folder
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"), 
          faceapi.nets.faceExpressionNet.loadFromUri("/models")
        ]);
        
        console.log("All models loaded successfully");
        setModelsLoaded(true);
        setError(null);
      } catch (error) {
        console.error("Error loading models:", error);
        setError("Failed to load face detection models. Please check if models are in /public/models folder.");
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    if (videoActive && stream) {
      const video = document.getElementById("video");
      if (video) {
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          video.play().then(() => {
            console.log("Video started, beginning face detection");
            // Small delay to ensure video is fully loaded
            setTimeout(() => {
              detectVideoFaces();
            }, 500);
          }).catch(error => {
            console.error("Error playing video:", error);
            setError("Error starting video playback");
          });
        };
      }
    }
  }, [videoActive, stream]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  return (
    <>
      <BackToHome />
      <h1 className="assignment-title">Assignment-29</h1>
      <hr />
      <div className="asg29-container">
        {error && (
          <div className="error-message" style={{ color: '#ff4444', marginBottom: '10px' }}>
            {error}
          </div>
        )}
        
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleUpload} 
          disabled={!modelsLoaded}
        />
        <button 
          onClick={startVideo} 
          disabled={!modelsLoaded || videoActive}
        >
          {modelsLoaded ? 'Start Webcam' : 'Loading Models...'}
        </button>
        {(image || videoActive) && (
          <button onClick={handleReset}>Reset</button>
        )}

        {(image || videoActive) && (
          <>
            {image && (
              <div className="face-container">
                <canvas id="face-canvas" className="canvas-image" />
                <canvas id="landmark-canvas" className="landmark-overlay" />
                {boxes.map((box, index) => (
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

            {videoActive && (
              <div className="face-container">
                <video
                  id="video"
                  autoPlay
                  className="canvas-image"
                  style={{ width: "100%" }}
                />
                <canvas
                  id="video-landmark-canvas"
                  className="landmark-overlay"
                />
                {boxes.map((box, index) => (
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
          </>
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

        {videoActive && videoDetectionResults.length > 0 && (
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