import { Request, Response } from 'express';

export async function sendTelegramSignal(req: Request, res: Response) {
  try {
    const { pair, signal, entry, takeProfit, stopLoss } = req.body;

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.warn("Telegram credentials missing in server environment.");
      return res.status(500).json({ error: "Telegram credentials missing. Please set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in your workspace secrets." });
    }

    const message = `🚨 *NEW CRYPTO SIGNAL* 🚨\n\n` +
                    `*Pair:* ${pair}\n` +
                    `*Action:* ${signal}\n` +
                    `*Entry:* ${entry}\n` +
                    `*Target:* ${takeProfit}\n` +
                    `*Stop Loss:* ${stopLoss}\n\n` +
                    `_via Crypto Signal Bot_`;

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown"
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Telegram API Error:", errorData);
      return res.status(500).json({ error: "Failed to send to Telegram" });
    }

    res.json({ success: true, message: "Signal sent to Telegram" });
  } catch (error) {
    console.error("Failed to send telegram signal:", error);
    res.status(500).json({ error: "Internal server error." });
  }
}
