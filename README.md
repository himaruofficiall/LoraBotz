# LoraBotz - Open Source Project

![Lora Icon](assets/lora.png)

[![GoLearn Repository Stats](https://img.shields.io/github/stars/DitzDev/LoraBotz?style=social)]([[https://github.com/DitzDev/LoraBotz])
[![GoLearn Forks](https://img.shields.io/github/forks/DitzDev/LoraBotz?style=social)](https://github.com/DitzDev/LoraBotz)

`LoraBotz` is an open source project, based on TypeScript.

## Instalation
- First, If you are using Android to run this script, then the recommended application is [Termux](https://github.com/termux/termux-app/releases/tag/) & [Node.js](https://nodejs.org/en). Click on the text on the left to download
- Second, if you have installed everything you need, type the command, Clone this Repository:
```sh
git clone https://github.com/DitzDev/LoraBotz.git
```
- Third, Install the required Dependencies and Run, Type command:
```sh
npm install
# to run
npm start
```

## Documentation
Here, I will explain about the usage and function of this code.
1. First, the command structure, this can be found in the `/commands/*` directory.
   This is an example of the code structure:
```typescript
import { CommandsHelpers } from '../../types/Command'; // Adjust according to where the types folder and command folder are located.
import TelegramBot from 'node-telegram-bot-api'; // This is Mandatory

/**
 * You can add any function here
 */
export = {
  command: ["your-command"],
  categories: ["your-categories"], // This category is a separation of functions between commands and is displayed in the menu.
  description: "Your Description Of Command Here",
  noPrefix: //boolean,
  config: {
    requireOwner: //boolean,
    requireModerator: //boolean
  },
  example: ["%cmd your example here"],
  run: async(msg: TelegramBot.Message, { bot, text, args, command, callbackQuery, isCallback }: CommandHelpers) => {
  //... Your Code Here
  }
}
```
2. About Object function
 Include:
 - `text` - Is a function that can separate commands and text.
 - `args` - It is a command that can be limited by the developer's wishes.
 - `command` - Is the command identity
 - `bot` - It is the main socket for connecting bot interactions with users.
 - `callbackQuery` - This function is a function that can listen to callbacks from commands.
 - `isCallback` - Identify whether this is from a callback command or not.

## Donations
LoraBotz will always be an open source code, Donate a little so I can be more enthusiastic :)
- [Saweria](https://saweria.co/DitzOfc)tz - Open Source Project

![Lora Icon](assets/lora.png)

[![GoLearn Repository Stats](https://img.shields.io/github/stars/DitzDev/LoraBotz?style=social)]([[https://github.com/DitzDev/LoraBotz])
[![GoLearn Forks](https://img.shields.io/github/forks/DitzDev/LoraBotz?style=social)](https://github.com/DitzDev/LoraBotz)

`LoraBotz` is an open source project, based on TypeScript.

## Instalation
- First, If you are using Android to run this script, then the recommended application is [Termux](https://github.com/termux/termux-app/releases/tag/) & [Node.js](https://nodejs.org/en). Click on the text on the left to download
- Second, if you have installed everything you need, type the command, Clone this Repository:
```sh
git clone https://github.com/DitzDev/LoraBotz.git
```
- Third, Install the required Dependencies and Run, Type command:
```sh
npm install
# to run
npm start
```

## Documentation
Here, I will explain about the usage and function of this code.
1. First, the command structure, this can be found in the `/commands/*` directory.
   This is an example of the code structure:
```typescript
import { CommandsHelpers } from '../../types/Command'; // Adjust according to where the types folder and command folder are located.
import TelegramBot from 'node-telegram-bot-api'; // This is Mandatory

/**
 * You can add any function here
 */
export = {
  command: ["your-command"],
  categories: ["your-categories"], // This category is a separation of functions between commands and is displayed in the menu.
  description: "Your Description Of Command Here",
  noPrefix: //boolean,
  config: {
    requireOwner: /*boolean*/,
    requireModerator: //boolean
  },
  example: ["%cmd your example here"],
  run: async(msg: TelegramBot.Message, { bot, text, args, command, callbackQuery, isCallback }: CommandHelpers) => {
  //... Your Code Here
  }
}
```
2. About Object function
 Include:
 - `text` - Is a function that can separate commands and text.
 - `args` - It is a command that can be limited by the developer's wishes.
 - `command` - Is the command identity
 - `bot` - It is the main socket for connecting bot interactions with users.
 - `callbackQuery` - This function is a function that can listen to callbacks from commands.
 - `isCallback` - Identify whether this is from a callback command or not.

## Donations
LoraBotz will always be an open source code, Donate a little so I can be more enthusiastic :)
- [Saweria](https://saweria.co/DitzOfc)
