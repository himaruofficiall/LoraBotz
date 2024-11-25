export declare namespace TelegramConfig {
  interface BotConfig {
    ownerIds: number[];
    moderatorIds: number[];
  }

  interface CommandConfig {
    requireOwner?: boolean;
    requireModerator?: boolean;
    requireAdmin?: boolean;
  }
}