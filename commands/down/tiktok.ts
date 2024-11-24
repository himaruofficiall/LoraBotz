import axios from 'axios';
import { CommandHelpers } from '../../types/Command';
import TelegramBot from 'node-telegram-bot-api';

export = {
  command: ["tiktok", "tt", "ttmedia"],
  example: ["%cmd link of TikTok"],
  description: "Fetch media TikTok",
  categories: ["downloader"],
  run: async(msg: TelegramBot.Message, { bot, text, command }:CommandHelpers) => {
    if (!text) {
      return bot.sendMessage(msg.chat.id, `/${command} Link Of TikTok`);
    }
    bot.sendMessage(msg.chat.id, 'Please Wait...');
    
    try {
      const response = await axios(`https://api.paxsenix.biz.id/dl/tiktok?url=${text}`);
      const data = response.data;
      bot.sendVideo(msg.chat.id, data.downloadsUrl.video);
      bot.sendAudio(msg.chat.id, data.downloadsUrl.music);
    } catch (e) {
      console.log(`${e}`)
      bot.sendMessage(msg.chat.id, `${e}`)
    }
  }
}