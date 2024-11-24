import axios from 'axios';
import { CommandHelpers } from '../../types/Command';
import TelegramBot from 'node-telegram-bot-api';

export = {
  command: ["gpt", "ai"],
  categories: ["ai"],
  example: ["%cmd Question"],
  description: "Ask Question with AI GPT",
  run: async(msg: TelegramBot.Message, { bot, text, command }: CommandHelpers) => {
    if (!text) {
      return bot.sendMessage(msg.chat.id, `/${command} Question`);
    }
    
    try {
      const response = await axios(`https://api.paxsenix.biz.id/ai/gpt4?text=${text}`);
      const data = response.data;
      bot.sendMessage(msg.chat.id, `${data.message}`, {
        parse_mode: 'Markdown',
      });
    } catch (e) {
      console.log(`Errror: ${e}`);
      bot.sendMessage(msg.chat.id, 'Error');
    }
  }
}