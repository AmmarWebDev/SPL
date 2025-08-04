const { Client, GatewayIntentBits } = require("discord.js");

// 🔐 Replace this with your real bot token (keep it secret!)
const TOKEN = "";

// ✅ List of user IDs to look up
const userIds = [
  "759869571632332851",
  "672775139120644136",
  "1149103342732193842",
];

// ✅ Create the bot client
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// 🚀 When bot is ready
client.once("ready", async () => {
  console.log(`Bot is logged in as ${client.user.tag}\n`);

  for (const id of userIds) {
    try {
      const user = await client.users.fetch(id);

      console.log(`✅ ${user.tag}`);
      console.log(`🖼️  Avatar: ${user.displayAvatarURL({ dynamic: true, size: 512 })}\n`);
    } catch (err) {
      console.error(`❌ Failed to fetch ${id}:`, err.message);
    }
  }

  client.destroy(); // clean shutdown after fetching
});

// 🧠 Login with your token
client.login(TOKEN);
