// main.tsx — mounts the catalog app.
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

// Note: no <StrictMode> — the networked room panels open PeerJS peers with
// fixed IDs, and StrictMode's dev double-mount would collide on those IDs.
createRoot(document.getElementById("root")!).render(<App />);
