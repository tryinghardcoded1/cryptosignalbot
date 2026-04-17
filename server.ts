import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route - Webhook
  app.post("/api/signal", async (req, res) => {
    try {
      const { pair, signal, entry, takeProfit, stopLoss } = req.body;
      
      if (!pair || !signal || !entry || !takeProfit || !stopLoss) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const { addSignalFromServer } = await import("./src/lib/firebase-server-helper.ts");
      await addSignalFromServer({ pair, signal, entry, takeProfit, stopLoss });
      
      res.json({ success: true, message: "Signal received and processed" });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Telegram Notifications Route
  app.post("/api/send-signal", async (req, res) => {
    try {
      const { sendTelegramSignal } = await import("./api/send-signal.ts");
      await sendTelegramSignal(req, res);
    } catch (error) {
      console.error("Error loading Telegram handler:", error);
      res.status(500).json({ error: "Failed to load route." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
