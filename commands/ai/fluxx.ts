import axios from 'axios';
import { CommandHelpers } from '../../types/Command';
import TelegramBot from 'node-telegram-bot-api';

export = {
  command: ["fluxx"],
  description: "Hasilkan gambar ai Fluxx",
  categories: ["ai"],
  example: ["%cmd"],
  run: async(msg: TelegramBot.Message, { bot, text, command, args }: CommandHelpers) => {
    if (!text) {
      return bot.sendMessage(msg.chat.id, 'Masukan prompt untuk hasilkan gambar', {
        reply_to_message_id: msg.message_id,
      });
    }
    
    bot.sendMessage(msg.chat.id, 'Tunggu bentar...');
    
    try {
      const response = await axios(`https://api.paxsenix.biz.id/ai-image/fluxSchnell?text=${text}`);
      const data = response.data;
      const url = data.url;
      bot.sendPhoto(msg.chat.id, url);
    } catch (e) {
      console.log(`Error: ${e}`);
      bot.sendMessage(msg.chat.id, `${e}`);
    }
  }
}