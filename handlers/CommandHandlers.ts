import TelegramBot from 'node-telegram-bot-api';
import { CommandType, CommandHelpers } from '../types/Command';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { TelegramConfig } from '../myconfig';

export class CommandHandler {
  private bot: TelegramBot;
  private commands: Map<string, CommandType>;
  private callbackHandlers: Map<string, (query: TelegramBot.CallbackQuery) => Promise<void>>;
  private config: TelegramConfig.BotConfig;

  constructor(bot: TelegramBot, config: TelegramConfig.BotConfig) {
    this.bot = bot;
    this.commands = new Map();
    this.callbackHandlers = new Map();
    this.config = config;
    this.setupCallbackQueryHandler(); 
  }
  
  private async checkPermissions(
    message: TelegramBot.Message,
    command: CommandType
  ): Promise<boolean> {
    if (!command.config) return true;
    const userId = message.from?.id;
    if (!userId) return false;

    if (command.config.requireOwner && !this.config.ownerIds.includes(userId)) {
      await this.bot.sendMessage(
        message.chat.id,
        "⛔ This command can only be used by bot owners."
      );
      return false;
    }

    if (command.config.requireModerator &&
        !this.config.moderatorIds.includes(userId) &&
        !this.config.ownerIds.includes(userId)) {
      await this.bot.sendMessage(
        message.chat.id,
        "⛔ This command can only be used by moderators or owners."
      );
      return false;
    }
    
    if (command.config.requireAdmin && message.chat.type !== 'private') {
      try {
        const chatMember = await this.bot.getChatMember(message.chat.id, userId);
        if (!['creator', 'administrator'].includes(chatMember.status)) {
          await this.bot.sendMessage(
            message.chat.id,
            "⛔ This command can only be used by group administrators."
          );
          return false;
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
      }
    }

    return true;
  }
  
  private logMessage(message: TelegramBot.Message) {
    console.log("\n=== Incoming Message Log ===");
    console.log("Message ID:", message.message_id); 
    console.log("From:", {
      id: message.from?.id,
      firstName: message.from?.first_name,
      lastName: message.from?.last_name,
      username: message.from?.username,
    });
    console.log("Chat:", {
      id: message.chat.id,
      type: message.chat.type,
      title: message.chat,
      username: message.chat.username,
    });
    console.log("Text:", message.text);
    console.log("Date:", new Date(message.date * 1000).toLocaleString());
    if (message.reply_to_message) {
      console.log("Replying to:", {
        messageId: message.reply_to_message.message_id, 
        text: message.reply_to_message.text
      });
    }
    console.log("========================\n");
  }
  
  private setupCallbackQueryHandler() {
    this.bot.on('callback_query', async (query) => {
      if (!query.data) return;

      try {
        const customHandler = this.callbackHandlers.get(query.data.split('|')[0]);
        if (customHandler) {
          await customHandler(query);
          return;
        }
        if (query.data.startsWith('/')) {
          const commandName = query.data.slice(1).split(' ')[0];
          const command = this.commands.get(commandName);
          
          if (command && command.run) {
            const fakeMessage: TelegramBot.Message = {
              ...query.message!,
              text: query.data,
              from: query.from,
            };
            
            if (!(await this.checkPermissions(fakeMessage, command))) {
              return;
            }
            const { text, args } = this.parseCommand(query.data);
            
            await command.run(fakeMessage, {
              bot: this.bot,
              text,
              command: commandName,
              args,
              isCallback: true,
              callbackQuery: query
            });
          }
        }
        if (query.id) {
          await this.bot.answerCallbackQuery(query.id);
        }
      } catch (error) {
        console.error('Error handling callback query:', error);
        if (query.id) {
          await this.bot.answerCallbackQuery(query.id, {
            text: 'There was an error processing your request.',
            show_alert: true
          });
        }
      }
    });
  }
  
  private parseCommand(messageText: string): { command: string; text: string; args: string[] } {
    const cleanText = messageText.trim();
    const withoutPrefix = cleanText.slice(1);
    const match = withoutPrefix.match(/^(\S+)\s*([\s\S]*)/);
    if (!match) {
        return {
            command: withoutPrefix,
            text: '',
            args: []
        };
    }
    const [, command, text] = match;
    console.log(text)
    const cleanedText = text.replace(/\s+/g, ' ').trim();
    const args = cleanedText ? cleanedText.split(/\s+/) : [];
    return {
        command,
        text: cleanedText,
        args
    };
}

private loadCommandsFromDirectory(directoryPath: string): void {
    const items = readdirSync(directoryPath);

    for (const item of items) {
      const fullPath = join(directoryPath, item);
      const isDirectory = statSync(fullPath).isDirectory();

      if (isDirectory) {
        this.loadCommandsFromDirectory(fullPath);
      } else if (item.endsWith('.ts') || item.endsWith('.js')) {
        try {
          const command: CommandType = require(fullPath);
          
          command.command.forEach(cmd => {
            this.commands.set(cmd, command);
           
            this.bot.onText(new RegExp(`^/${cmd}(?:\\s+([\\s\\S]+))?$`), async (message, match) => {
                this.logMessage(message);
                if (!message.text) return;
                
                if (!(await this.checkPermissions(message, command))) return;
                
                const { command: cmdName, text, args } = this.parseCommand(message.text);
                
                try {
                  await command.run(message, {
                    bot: this.bot,
                    text,
                    command: cmdName,
                    args
                  });
                } catch (error) {
                  console.error(`Error executing command ${cmd}:`, error);
                  this.bot.sendMessage(message.chat.id, "An error occurred while executing the command.")
                    .catch(console.error);
                }
              });

            if (command.noPrefix) {
              this.bot.onText(new RegExp(`^${cmd}(?:\\s+([\\s\\S]+))?$`), async (message, match) => {
                this.logMessage(message);
                if (!message.text) return;
                
                if (!(await this.checkPermissions(message, command))) return;
                
                try {
                  const text = match ? match[1] : '';
                  const args = text ? text.split(/\s+/) : [];
                  
                  await command.run(message, {
                    bot: this.bot,
                    text,
                    command: cmd,
                    args
                  });
                } catch (error) {
                  console.error(`Error executing command ${cmd}:`, error);
                  this.bot.sendMessage(message.chat.id, "An error occurred while executing the command.")
                    .catch(console.error);
                }
              });
            }
          });

          console.log(`Loaded command: ${fullPath}`);
        } catch (error) {
          console.error(`Error loading command ${fullPath}:`, error);
        }
      }
    }
  }

  public async loadCommands(): Promise<void> {
    const commandPath = join(__dirname, "..", "commands");
    this.loadCommandsFromDirectory(commandPath);
  }
  
  public registerCallbackHandler(
    pattern: string,
    handler: (query: TelegramBot.CallbackQuery) => Promise<void>
  ) {
    this.callbackHandlers.set(pattern, handler);
  }
  
  public getCommands(): Map<string, CommandType> {
    return this.commands;
  }
}