import { Bot, Context, InlineKeyboard, webhookCallback } from "grammy";
import { chunk } from "lodash";
import express from "express";
import axios from "axios";

// Create a bot using the Telegram token
const bot = new Bot(process.env.TELEGRAM_TOKEN || "");

// Suggest commands in the menu
bot.api.setMyCommands([
  { command: "startreq", description: "Start sending request to URL" },
  {
    command: "stopreq",
    description: "Stop sending request to URL",
  },
]);

// Store the URL and interval ID
let urlToRequest: any;
let requestInterval: any;

// Start command handler
bot.command("start", (ctx) => {
  ctx.reply("Use /startreq to start.\n\nUse /stoprequest to stop.");
});

bot.command("startreq", (ctx) => {
  clearInterval(requestInterval);
  ctx.reply(
    "Send me a URL and I will send requests to it every 10 minutes. Use /stoprequest to stop."
  );
});

bot.command("stopreq", (ctx) => {
  clearInterval(requestInterval);
  ctx.reply("Request stopped.");
});

// URL handler
bot.on("message:text", async (ctx) => {
  clearInterval(requestInterval);
  const startTime = new Date().getTime();
  const messageText = ctx.message?.text;
  urlToRequest = messageText;
  ctx.reply("Sending requests every 10 minutes...");
  try {
    const response = await axios.get(urlToRequest);
    const endTime = new Date().getTime();
    ctx.reply(`Time spent: ${Math.ceil((endTime - startTime) / 1000)}s`);
    ctx.reply(`Status: ${response.status == 200 ? "✅" : "❌"}`);
    sendRequestEveryTime(ctx);
  } catch (error) {
    ctx.reply("Status: ❌");
  }
});

// Function to send the request every 10 minutes
const sendRequestEveryTime = async (ctx: Context) => {
  requestInterval = setInterval(async () => {
    try {
      const response = await axios.get(urlToRequest);
      ctx.reply(`Status: ${response.status == 200 ? "✅" : "❌"}`);
    } catch (error) {
      clearInterval(requestInterval);
      ctx.reply("Status: ❌");
    }
  }, 10 * 60 * 1); // 10 minutes interval
};

// Start the server
if (process.env.NODE_ENV === "production") {
  // Use Webhooks for the production server
  const app = express();
  app.use(express.json());
  app.use(webhookCallback(bot, "express"));

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Bot listening on port ${PORT}`);
  });
} else {
  // Use Long Polling for development
  bot.start();
}
