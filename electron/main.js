import { app, BrowserWindow } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 👇 change 8080 if your Vite dev server uses another port
const DEV_URL = "http://localhost:8080";
const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (isDev) {
    // DEV: use Vite dev server
    win.loadURL(DEV_URL);
    // win.webContents.openDevTools(); // optional in dev
  } else {
    // PROD: load built index.html from dist
    const indexHtmlPath = path.join(__dirname, "..", "dist", "index.html");
    win.loadFile(indexHtmlPath);
    // open devtools in prod so we can see errors if any
   // win.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
