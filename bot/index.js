const { Client, GatewayIntentBits, Partials } = require("discord.js");
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config({ path: require("path").resolve(__dirname, "../.env") });

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
});

client.once("ready", () => {
  console.log(`🤖 Bot is online as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (
    !message.content.startsWith("?recordStats") ||
    message.author.id !== "759869571632332851"
  )
    return;

  const args = message.content.split(" ");
  const url = args[1];

  if (!url) return message.reply("❌ Usage: `?recordStats <message URL>`");

  const match = url.match(/discord(?:app)?\.com\/channels\/\d+\/(\d+)\/(\d+)/);
  if (!match) return message.reply("❌ Invalid message URL format.");

  const [_, channelId, messageId] = match;

  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased()) {
      return message.reply(
        "❌ That channel doesn't exist or isn’t text-based."
      );
    }

    const fetchedMessage = await channel.messages.fetch(messageId);
    const channelName = fetchedMessage.channel.name.toLowerCase();

    let targetEndpoint = null;
    if (channelName.includes("cwc")) {
      targetEndpoint = "cwc";
    } else if (channelName.includes("euro")) {
      targetEndpoint = "euros";
    } else {
      return message.reply("❌ Unknown channel name format.");
    }

    const playerCount = await parseAndSendStats(fetchedMessage, targetEndpoint);
    message.reply(
      `✅ Recorded stats for ${playerCount} player${
        playerCount !== 1 ? "s" : ""
      }.`
    );
  } catch (err) {
    console.error("Error processing message:", err);
    message.reply("❌ Failed to fetch or parse the message.");
  }
});

const parseAndSendStats = async (msg, endpoint) => {
  const lines = msg.content.split("\n");

  const goalRegex = /<@(\d+)>.*?(<:Goal:)/g;
  const assistRegex = /<@(\d+)>.*?(<:Assist:)/g;
  const cleanSheetRegex = /<:.*?:(\d+)> ✅/g;
  const teamMentionRegex = /<@&(\d+)>/g;

  const goals = {};
  const assists = {};
  const cleanSheets = new Set();
  const teamRoles = [];

  for (const match of msg.content.matchAll(teamMentionRegex)) {
    teamRoles.push(match[1]);
  }

  for (const line of lines) {
    let match;
    while ((match = goalRegex.exec(line)) !== null) {
      const userId = match[1];
      goals[userId] = (goals[userId] || 0) + 1;
    }
  }

  for (const line of lines) {
    let match;
    while ((match = assistRegex.exec(line)) !== null) {
      const userId = match[1];
      assists[userId] = (assists[userId] || 0) + 1;
    }
  }

  let match;
  while ((match = cleanSheetRegex.exec(msg.content)) !== null) {
    cleanSheets.add(match[1]);
  }

  const allUserIds = new Set([...Object.keys(goals), ...Object.keys(assists)]);
  let successCount = 0;

  for (const userId of allUserIds) {
    const member = await msg.guild.members.fetch(userId);
    const matchingRoles = member.roles.cache.filter((role) =>
      teamRoles.includes(role.id)
    );

    const teamRole = matchingRoles.first();

    const playerData = {
      userId,
      goals: goals[userId] || 0,
      assists: assists[userId] || 0,
      cleansheets: teamRole && cleanSheets.has(teamRole.id) ? 1 : 0,
      teamId: teamRole?.id || null,
    };

    try {
      await axios.post(`${process.env.API_BASE_URL}/${endpoint}`, playerData);
      console.log(`✅ Posted stats for ${userId}`);
      successCount++;
    } catch (err) {
      console.error(`❌ Failed to post for ${userId}:`, err.message);
    }
  }

  return successCount;
};

// Check if the bot is awake
client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  if (message.content.toLowerCase() === "are you alive my boy") {
    message.channel.send("yessir!");
  }
});

client.login(process.env.DISCORD_TOKEN);
