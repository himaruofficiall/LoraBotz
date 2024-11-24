// CommandHandlers.ts
import TelegramBot from 'node-telegram-bot-api';
import { CommandType, CommandHelpers } from '../types/Command';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

export class CommandHandler {
  private bot: TelegramBot;
  private commands: Map<string, CommandType>;

  constructor(bot: TelegramBot) {
    this.bot = bot;
    this.commands = new Map();
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

  private parseCommand(messageText: string): { command: string; text: string; args: string[] } {
    const parts = messageText.slice(1).split(/\s+(.*)/);
    const command = parts[0];
    const text = parts[1] || '';
    const args = text.split(/\s+/);
    
    return { command, text, args };
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
           
            this.bot.onText(new RegExp(`^/${cmd}(?:\\s+(.+))?$`), async (message, match) => {
              this.logMessage(message);
              
              if (!message.text) return;
              
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
                this.bot.sendMessage(message.chat.id, "Terjadi kesalahan saat menjalankan perintah.")
                  .catch(console.error);
              }
            });
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

  public getCommands(): Map<string, CommandType> {
    return this.commands;
  }
}
