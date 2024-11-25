import { CommandHelpers } from '../types/Command';
import TelegramBot from 'node-telegram-bot-api';
import util from 'util';
import { exec as execCallback } from 'child_process';

const exec = util.promisify(execCallback);

const createConsoleProxy = () => {
  let logs: string[] = [];
  
  const proxy = {
    log: (...args: any[]) => {
      logs.push(args.map(arg => util.format(arg)).join(' '));
    },
    getLogs: () => logs.join('\n'),
    clear: () => { logs = []; }
  };
  
  return proxy;
};

export = {
  command: ["=>", ">", "&"],
  description: "Evaluate JavaScript code or execute shell commands",
  noPrefix: true,
  config: {
    requireOwner: true
  },
  run: async(msg: TelegramBot.Message, { bot, command, text }: CommandHelpers) => {
    const initialMsg = await bot.sendMessage(msg.chat.id, 'Executing...', {
      reply_to_message_id: msg.message_id
    });

    try {
      let result: any;
      const msgId = initialMsg.message_id;
      const consoleProxy = createConsoleProxy();
      
      const originalConsole = global.console;
      (global as any).console = consoleProxy;

      switch (command) {
        case "=>":
          const returnCode = text.includes('\n') 
            ? `(async () => {\n${text}\n})()`
            : `(async () => { return ${text} })()`;
          result = await eval(returnCode);
          break;

        case ">":
          const execCode = `(async () => {\n${text}\n})()`;
          result = await eval(execCode);
          break;

        case "&":
          if (!text) throw new Error('Command cannot be empty');
          try {
            const { stdout, stderr } = await exec(text, {
              timeout: 30000,
              maxBuffer: 1024 * 1024 
            });
            result = stdout || stderr;
          } catch (execError: any) {
            result = execError.message + (execError.stderr ? `\n${execError.stderr}` : '');
          }
          break;
      }
      
      (global as any).console = originalConsole;
      const consoleOutput = consoleProxy.getLogs();
      const finalResult = consoleOutput
        ? `${consoleOutput}\n\n${util.format(result)}`
        : util.format(result);

      await editOrSendResult(bot, msg.chat.id, finalResult, msgId);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await editOrSendResult(bot, msg.chat.id, `Error: ${errorMessage}`, initialMsg.message_id);
    }
  }
}

async function editOrSendResult(
  bot: TelegramBot, 
  chatId: number, 
  result: any, 
  messageId: number
) {
  const formattedResult = util.format(result);
  const messageText = `<pre>${escapeHTML(formattedResult)}</pre>`;

  try {
    await bot.editMessageText(messageText, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'HTML'
    });
  } catch (error) {
    if (formattedResult.length > 4096) {
      const buffer = Buffer.from(formattedResult);
      await bot.sendDocument(chatId, buffer, {
        caption: 'Result was too long. Sent as file.',
      }, {
        filename: 'eval_result.txt',
        contentType: 'text/plain'
      });
    } else {
      await bot.sendMessage(chatId, messageText, {
        parse_mode: 'HTML'
      });
    }
  }
}

function escapeHTML(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}