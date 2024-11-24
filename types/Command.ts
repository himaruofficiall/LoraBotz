import TelegramBot from 'node-telegram-bot-api';

export interface CommandHelpers {
  bot: TelegramBot;
  text: string;      
  command: string;
  args: string[];
}

export interface CommandType {
  command: string[];
  description: string;
  categories: string[];
  example: string[];
  run: (msg: TelegramBot.Message, helpers: CommandHelpers) => Promise<void>;
}