import dotenv from 'dotenv';

dotenv.config();

export const config = {
  discordToken: process.env.DISCORD_TOKEN || '',
  apiUrl: process.env.API_URL || 'http://localhost:3001',
  adminChannelId: process.env.ADMIN_CHANNEL_ID || '',
};

if (!config.discordToken) {
  throw new Error('DISCORD_TOKEN no está definido en .env');
}
