import axios from 'axios';
import { CommandHelpers } from '../../types/Command';
import TelegramBot from 'node-telegram-bot-api';

export = {
  command: ["animagine", "anime-sxdl"],
  categories: ["ai"],
  description: "Generating Anime images from Prompts",
  example: ["%cmd prompt to image"],
  run: async(msg: TelegramBot.Message, { bot, command, text }: CommandHelpers) => {
    if (!text) return bot.sendMessage(msg.chat.id, 'What is your prompt?');
    bot.sendMessage(msg.chat.id, 'Please Wait...');
    try {
      const response = await axios(`https://endpoint.web.id/ai/sdxl-anime?key=${process.env.KEY_API}&prompt=${text}`);
      const data = response.data;
      bot.sendPhoto(msg.chat.id, data.result.image, {
        caption: "`Is Ready!`",
        parse_mode: "Markdown"
      })
    } catch (e) {
      console.log(`Error: ${e}`);
      bot.sendMessage(msg.chat.id, `${e}`)
    }
  }
}