import { render } from "preact";
import { autoUpdater } from "./utils/updater";
import App from "./App";

window.addEventListener("focus", () => {
  autoUpdater();
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    autoUpdater();
  }
});

autoUpdater();
render(<App />, document.getElementById("app")!);
