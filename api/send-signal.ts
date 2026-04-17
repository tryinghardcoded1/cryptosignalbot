import { Request, Response } from 'express';

export async function sendTelegramSignal(req: Request, res: Response) {
  try {
    const { pair, signal, entry, takeProfit, stopLoss } = req.body;

    let botToken = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
    let chatId = (process.env.TELEGRAM_CHAT_ID || "").trim();

    // 1. Remove accidental quotes if the user pasted them (e.g. "12345:ABC" instead of 12345:ABC)
    botToken = botToken.replace(/^["']|["']$/g, '');
    chatId = chatId.replace(/^["']|["']$/g, '');

    // 2. If the user pasted "bot12345:ABC" remove the "bot" prefix because the API URL already includes it
    if (botToken.toLowerCase().startsWith('bot')) {
      botToken = botToken.substring(3);
    }

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
    
    console.log(`Sending Telegram message to chat: ${chatId} using sanitized bot token (length: ${botToken.length}, starts with: ${botToken.substring(0, 3)}...)`);
    
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
      console.error(`Telegram API Error (Status ${response.status}):`, errorData);
      return res.status(500).json({ error: `Failed to send to Telegram. Target API returned: ${errorData}` });
    }

    res.json({ success: true, message: "Signal sent to Telegram" });
  } catch (error) {
    console.error("Failed to send telegram signal:", error);
    res.status(500).json({ error: "Internal server error." });
  }
}
