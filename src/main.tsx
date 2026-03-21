import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider, ProfileProvider } from "@/providers";
import App from "@/App";
import "@/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <ProfileProvider>
        <App />
      </ProfileProvider>
    </AuthProvider>
  </StrictMode>,
);
