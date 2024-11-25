import TelegramBot from 'node-telegram-bot-api';
import { TelegramConfig } from '../myconfig';

export interface CommandHelpers {
  bot: TelegramBot;
  text: string;
  command: string;
  args: string[];
  isCallback?: boolean;
  callbackQuery?: TelegramBot.CallbackQuery;
}

export interface CommandType {
  command: string[];
  description: string;
  example?: string[];
  noPrefix?: boolean;
  categories?: string[];
  config?: TelegramConfig.CommandConfig;
  run: (msg: TelegramBot.Message, helpers: CommandHelpers) => Promise<void>;
  handleCallback?: (pattern: string, callback: (query: TelegramBot.CallbackQuery) => Promise<void>) => void;
}