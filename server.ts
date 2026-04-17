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

      // We need to write this to Firestore. 
      // We will handle this lazily once Firebase is initialized in server space.
      // Easiest is to import the db instance from a shared module, but since we are server side
      // and want to maintain simplicity, we'll do an authenticated write inside this route handler.
      // Wait, we can import our firebase admin/client logic here.
      const { addSignalFromServer } = await import("./src/lib/firebase-server-helper.ts");
      await addSignalFromServer({ pair, signal, entry, takeProfit, stopLoss });
      
      res.json({ success: true, message: "Signal received and processed" });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ error: "Internal Server Error" });
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
