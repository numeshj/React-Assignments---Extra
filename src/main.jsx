import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, HashRouter } from "react-router-dom"; // <-- Add Routes and Route
import "./index.css";
import App from "./App.jsx";
import ASG_1 from "./pages/ASG_1.jsx";
import ASG_3 from "./pages/ASG_3.jsx";
import ASG_2 from "./pages/ASG_2.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/asg-1" element={<ASG_1 />} />
        <Route path="/asg-2" element={<ASG_2 />} />
        <Route path="/asg-3" element={<ASG_3 />} />
      </Routes>
    </HashRouter>
  </StrictMode>
);
