
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
  import { TickProvider } from "./contexts/TickContext.tsx";

  createRoot(document.getElementById("root")!).render(
    <TickProvider>
      <App />
    </TickProvider>
  );
  