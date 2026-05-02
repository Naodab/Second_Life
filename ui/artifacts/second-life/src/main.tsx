import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const faviconHref = `${import.meta.env.BASE_URL}favicon.png`;
const faviconLink =
  document.querySelector<HTMLLinkElement>("link[rel='icon']") ??
  (() => {
    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/png";
    document.head.appendChild(link);
    return link;
  })();
faviconLink.href = faviconHref;

createRoot(document.getElementById("root")!).render(<App />);
