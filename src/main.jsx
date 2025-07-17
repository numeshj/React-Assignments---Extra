import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Routes, Route, HashRouter } from "react-router-dom"; // <-- Add Routes and Route
import "./index.css";
import App from "./App.jsx";
import ASG_1 from "./assignments/ASG_1.jsx";
import ASG_2 from "./assignments/ASG_2.jsx";
import ASG_3 from "./assignments/ASG_3.jsx";
import ASG_9 from "./assignments/ASG_9.jsx";
import ASG_29 from "./assignments/ASG_29.jsx";
import ASG_30 from "./assignments/ASG_30.jsx";
import ASG_31 from "./assignments/ASG_31.jsx";
import ASG_32 from "./assignments/ASG_32.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/asg-1" element={<ASG_1 />} />
        <Route path="/asg-2" element={<ASG_2 />} />
        <Route path="/asg-3" element={<ASG_3 />} />
        <Route path="/asg-9" element={<ASG_9 />} />
        <Route path="/asg-29" element={<ASG_29 />} />
        <Route path="/asg-30" element={<ASG_30 />} />
        <Route path="/asg-31" element={<ASG_31 />} />
        <Route path="/asg-32" element={<ASG_32 />} />
      </Routes>
    </HashRouter>
  </StrictMode>
);
