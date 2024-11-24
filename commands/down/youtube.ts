/**
 * This environment is to overcome Content-Type deprecation
 * See: https://github.com/yagop/node-telegram-bot-api/issues/350
 */
process.env["NTBA_FIX_350"] = "1"; // For TypeScript Asssertion

import { CommandHelpers } from '../../types/Command';
import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

async function downloadFile(url: string, type: 'audio' | 'video'): Promise<string> {
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream'
    });

    const extension = type === 'audio' ? 'mp3' : 'mp4';
    const fileName = `${uuidv4()}.${extension}`;
    const filePath = path.join('../../tmp', fileName);

    if (!fs.existsSync('../../tmp')) {
      fs.mkdirSync('../../tmp', { recursive: true });
    }

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(filePath));
      writer.on('error', reject);
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Download failed: ${error.message}`);
    }
    throw error;
  }
}

export = {
  command: ["yt", "youtube"],
  description: "Fetch music and videos from YouTube",
  categories: ["downloader"],
  example: ["%cmd link YouTube"],
  run: async(msg: TelegramBot.Message, { bot, text, command, isCallback, callbackQuery }: CommandHelpers) => {
    
    let contentData: any = null;
    let audioData: any = null;
    let videoData: any = null;
    
    global.handler.registerCallbackHandler('youtube-api', async (query) => {
      try {
        await bot.answerCallbackQuery(query.id!);
        
        const [action, ...params] = query.data!.split('|');
        
        if (!contentData) {
          await bot.sendMessage(query.message!.chat.id, "Data is not available. Please try the command again.");
          return;
        }

        const statusMessage = await bot.sendMessage(query.message!.chat.id, 'Downloading... Please wait.');

        try {
          switch(params[0]) {
            case 'audio': {
              const filePath = await downloadFile(audioData.result.download_url, 'audio');
              await bot.sendAudio(query.message!.chat.id, fs.createReadStream(filePath), {
                title: contentData.data.video.title,
                performer: 'YouTube Download',
                caption: contentData.data.video.title,
              });
              
              fs.unlink(filePath, (err) => {
                if (err) console.error('Error deleting audio file:', err);
              });
              break;
            }
            case 'video': {
              const filePath = await downloadFile(videoData.result.download_url, 'video');
              await bot.sendVideo(query.message!.chat.id, fs.createReadStream(filePath), {
                caption: contentData.data.video.title
              });
              
              fs.unlink(filePath, (err) => {
                if (err) console.error('Error deleting video file:', err);
              });
              break;
            }
          }
        } finally {
        }
      } catch (error) {
        console.error('Error in callback handler:', error);
        await bot.sendMessage(query.message!.chat.id, 
          `Failed to process the request: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    });

    try {
      if (!text) {
        return bot.sendMessage(msg.chat.id, `/${command} link YouTube`);
      }
      
      const loadingMessage = await bot.sendMessage(msg.chat.id, 'Please Wait...');
      
      try {
        const response = await axios(`https://itzpire.com/download/youtube?url=${text}`);
        const audioResponse = await axios(`https://endpoint.web.id/downloader/yt-audio?key=${process.env.KEY_API}&url=${text}`);
        const videoResponse = await axios(`https://endpoint.web.id/downloader/yt-video?key=${process.env.KEY_API}&url=${text}`);
        
        contentData = response.data;
        audioData = audioResponse.data;
        videoData = videoResponse.data;
        
        const button = [
          [
            { text: "🎦 Video", callback_data: `youtube-api|video` },
            { text: "🎵 Music/Audio", callback_data: `youtube-api|audio` },           
          ]
        ];

        const caption = `
Title: \`${contentData.data.video.title}\`

What would you like to choose?
`;

        await bot.sendPhoto(msg.chat.id, contentData.data.video.thumb, {
          caption: caption,
          parse_mode: 'Markdown',
          reply_to_message_id: msg.message_id,
          reply_markup: {
            inline_keyboard: button
          }
        });
      } finally {
      }
    } catch (error) {
      console.error('Error in main command:', error);
      bot.sendMessage(msg.chat.id, 
        `Failed to fetch video: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
};