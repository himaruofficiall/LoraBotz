import { CommandHelpers } from "../types/Command";
import TelegramBot from 'node-telegram-bot-api';

export = {
  command: ["p"],
  description: "Gratefull Commands",
  example: ["%cmd"],
  run: async (msg: TelegramBot.Message, { bot, text, args }: CommandHelpers) => {
     await bot.sendMessage(msg.chat.id, 'A Reply', {
       reply_to_message_id: msg.message_id,
     });
  }
};