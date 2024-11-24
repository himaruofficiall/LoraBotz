import TelegramBot from 'node-telegram-bot-api';
import { CommandType, CommandHelpers } from '../types/Command';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

/**
 * The CommandHandler class is responsible for handling commands and callback queries from users interacting with the bot.
 * It registers commands, executes them, and handles callback queries triggered by inline buttons.
 */
export class CommandHandler {
  private bot: TelegramBot;
  private commands: Map<string, CommandType>;
  private callbackHandlers: Map<string, (query: TelegramBot.CallbackQuery) => Promise<void>>;

  /**
   * Initializes the CommandHandler with the provided TelegramBot instance.
   * Sets up maps for storing commands and callback handlers, and prepares the callback query handler.
   * 
   * @param bot The instance of the TelegramBot to interact with.
   */
  constructor(bot: TelegramBot) {
    this.bot = bot; // Store the bot instance
    this.commands = new Map(); // Map to store commands loaded dynamically
    this.callbackHandlers = new Map(); // Map to store callback query handlers
    this.setupCallbackQueryHandler(); // Set up the callback query handler
  }

  /**
   * Logs detailed information about an incoming message, including sender, chat, and message content.
   * This helps in debugging and understanding the flow of messages.
   * 
   * @param message The incoming message object from Telegram API.
   */
  private logMessage(message: TelegramBot.Message) {
    console.log("\n=== Incoming Message Log ===");
    console.log("Message ID:", message.message_id); // Message ID
    console.log("From:", {
      id: message.from?.id, // Sender's ID
      firstName: message.from?.first_name, // Sender's first name
      lastName: message.from?.last_name, // Sender's last name
      username: message.from?.username, // Sender's username
    });
    console.log("Chat:", {
      id: message.chat.id, // Chat ID
      type: message.chat.type, // Type of chat (private, group, etc.)
      title: message.chat, // Chat title (for groups)
      username: message.chat.username, // Chat username (if applicable)
    });
    console.log("Text:", message.text); // Message text
    console.log("Date:", new Date(message.date * 1000).toLocaleString()); // Message sent date
    if (message.reply_to_message) {
      console.log("Replying to:", {
        messageId: message.reply_to_message.message_id, // ID of the message being replied to
        text: message.reply_to_message.text // Text of the message being replied to
      });
    }
    console.log("========================\n");
  }
  
  /**
   * Sets up the handler for callback queries, which are triggered by inline button interactions.
   * It processes callback data and executes the corresponding command or handler.
   */
  private setupCallbackQueryHandler() {
    this.bot.on('callback_query', async (query) => {
      if (!query.data) return;

      try {
        // Look for a custom handler based on the callback data prefix
        const customHandler = this.callbackHandlers.get(query.data.split('|')[0]);
        if (customHandler) {
          await customHandler(query); // Execute the custom callback handler
          return;
        }

        // Handle callback queries that contain commands (prefixed with '/')
        if (query.data.startsWith('/')) {
          const commandName = query.data.slice(1).split(' ')[0];
          const command = this.commands.get(commandName);
          
          if (command && command.run) {
            // Create a fake message object to simulate a command execution
            const fakeMessage: TelegramBot.Message = {
              ...query.message!,
              text: query.data,
              from: query.from,
            };

            // Parse the command and arguments
            const { text, args } = this.parseCommand(query.data);
            
            // Execute the command with the parsed data
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

        // Answer the callback query to acknowledge receipt
        if (query.id) {
          await this.bot.answerCallbackQuery(query.id);
        }
      } catch (error) {
        console.error('Error handling callback query:', error);
        if (query.id) {
          // Respond with an error message if something goes wrong
          await this.bot.answerCallbackQuery(query.id, {
            text: 'There was an error processing your request.',
            show_alert: true
          });
        }
      }
    });
  }
  
  /**
   * Parses a message text to extract the command name, its associated text, and arguments.
   * 
   * @param messageText The text of the message containing the command.
   * @returns An object containing the command name, text, and arguments.
   */
  private parseCommand(messageText: string): { command: string; text: string; args: string[] } {
    const parts = messageText.slice(1).split(/\s+(.*)/); // Split the command from its arguments
    const command = parts[0]; // The command name
    const text = parts[1] || ''; // The text following the command (optional)
    const args = text.split(/\s+/); // Split the text into separate arguments
    
    return { command, text, args };
  }

  /**
   * Recursively loads commands from a directory. If a directory is encountered, it loads commands from within that directory as well.
   * It registers each command and sets up the corresponding listener for it.
   * 
   * @param directoryPath The path to the directory containing command files.
   */
  private loadCommandsFromDirectory(directoryPath: string): void {
    const items = readdirSync(directoryPath); // Read the items in the directory

    for (const item of items) {
      const fullPath = join(directoryPath, item); // Get the full path of the item
      const isDirectory = statSync(fullPath).isDirectory(); // Check if the item is a directory

      if (isDirectory) {
        // If it's a directory, load commands from it recursively
        this.loadCommandsFromDirectory(fullPath);
      } else if (item.endsWith('.ts') || item.endsWith('.js')) {
        try {
          // Try to require the command file
          const command: CommandType = require(fullPath);
          
          // Register each command defined in the command file
          command.command.forEach(cmd => {
            this.commands.set(cmd, command); // Store the command in the map
           
            // Set up a listener for the command to be triggered via a message
            this.bot.onText(new RegExp(`^/${cmd}(?:\\s+(.+))?$`), async (message, match) => {
              this.logMessage(message); // Log the incoming message
              
              if (!message.text) return;
              
              // Parse the command and its arguments
              const { command: cmdName, text, args } = this.parseCommand(message.text);
              
              try {
                // Execute the command
                await command.run(message, {
                  bot: this.bot,
                  text,
                  command: cmdName,
                  args
                });
              } catch (error) {
                // Handle any errors that occur during command execution
                console.error(`Error executing command ${cmd}:`, error);
                this.bot.sendMessage(message.chat.id, "An error occurred while executing the command.")
                  .catch(console.error);
              }
            });
          });

          console.log(`Loaded command: ${fullPath}`); // Log the successful loading of the command
        } catch (error) {
          console.error(`Error loading command ${fullPath}:`, error); // Log errors when loading the command
        }
      }
    }
  }

  /**
   * Loads all commands from the 'commands' directory. This is called to initialize the available commands.
   */
  public async loadCommands(): Promise<void> {
    const commandPath = join(__dirname, "..", "commands"); // Path to the commands directory
    this.loadCommandsFromDirectory(commandPath); // Load commands from the directory
  }
  
  /**
   * Registers a callback handler for callback queries that match a specific pattern.
   * 
   * @param pattern The pattern to match in the callback data.
   * @param handler The handler function that will be executed when the callback query matches the pattern.
   */
  public registerCallbackHandler(
    pattern: string,
    handler: (query: TelegramBot.CallbackQuery) => Promise<void>
  ) {
    this.callbackHandlers.set(pattern, handler); // Store the callback handler
  }
  
  /**
   * Returns the map of commands that have been loaded into the bot.
   * 
   * @returns A map of commands, where the key is the command name and the value is the command object.
   */
  public getCommands(): Map<string, CommandType> {
    return this.commands; // Return the loaded commands
  }
}