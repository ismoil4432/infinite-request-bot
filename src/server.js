import { Telegraf } from "telegraf";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// Telegram bot token
const botToken = process.env.HTTP_API;

// Create a new instance of Telegraf bot
const bot = new Telegraf(botToken);

// Store the URL and interval ID
let urlToRequest;
let requestInterval;

// Start command handler
bot.command("start", (ctx) => {
  ctx.reply(
    "Send me a URL and I will send requests to it every 10 minutes. Use /stoprequest to stop."
  );
});

// URL handler
bot.on("text", (ctx) => {
  const messageText = ctx.message.text;
  if (messageText === "/stoprequest") {
    clearInterval(requestInterval);
    ctx.reply("Request stopped.");
  } else {
    urlToRequest = messageText;
    ctx.reply("Sending requests every 10 minutes...");
    sendRequestEvery30Seconds(ctx);
  }
});

// Function to send the request every 10 minutes
const sendRequestEvery30Seconds = async (ctx) => {
  try {
    const response = await axios.get(urlToRequest);
    ctx.reply(`Request successful. Response status: ${response.status}`);
  } catch (error) {
    ctx.reply("An error occurred while sending the request.");
  }

  requestInterval = setInterval(async () => {
    try {
      const response = await axios.get(urlToRequest);
      ctx.reply(`Request successful. Response status: ${response.status}`);
    } catch (error) {
      ctx.reply("An error occurred while sending the request.");
    }
  }, 10 * 60 * 1000); // 10 minutes interval
};

// Start the bot
bot.startPolling();
