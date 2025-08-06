const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { Client, GatewayIntentBits, Partials } = require("discord.js");
const Euro = require("./models/euros.model");
const Cwc = require("./models/cwc.model");
const axios = require("axios");

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

mongoose
  .connect(process.env.MONGO_URI, { dbName: "stats" })
  .then(() => console.log("✅ Connected to MongoDB 'stats'"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

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
  console.log(`🤖 Discord bot logged in as ${client.user.tag}`);
});

let cachedRoles = null;

const cleanTeamName = (rawName) =>
  rawName?.replace(/^《SPL》( *\| *)?/i, "").trim() || null;

const enrichTopPlayers = async (players) => {
  const guild = await client.guilds.fetch(process.env.DISCORD_GUILD_ID);
  await guild.members.fetch();

  if (!cachedRoles) {
    await guild.roles.fetch();
    cachedRoles = guild.roles.cache;
  }

  const enriched = await Promise.all(
    players.map(async (player) => {
      try {
        const member = guild.members.cache.get(player.userId);
        const user = member?.user;
        const teamRole = cachedRoles.get(player.teamId);

        return {
          userId: player.userId,
          goals: player.goals || 0,
          assists: player.assists || 0,
          cleansheets: player.cleansheets || 0,
          username: user?.username || null,
          nickname: member?.nickname || user?.username || null,
          avatar: user?.displayAvatarURL({ dynamic: true, size: 256 }) || null,
          teamName: cleanTeamName(teamRole?.name),
          teamIcon: teamRole?.icon
            ? `https://cdn.discordapp.com/role-icons/${teamRole.id}/${teamRole.icon}.png`
            : null,
        };
      } catch (err) {
        console.warn(
          `⚠️ Discord fetch failed for ${player.userId}: ${err.message}`
        );
        return {
          userId: player.userId,
          goals: player.goals || 0,
          assists: player.assists || 0,
          cleansheets: player.cleansheets || 0,
          username: null,
          nickname: null,
          avatar: null,
          teamName: null,
          teamIcon: null,
        };
      }
    })
  );

  return enriched;
};

const getTop10 = (players) =>
  [...players]
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists)
    .slice(0, 10);

// GET endpoints
app.get("/euros", async (req, res) => {
  try {
    const players = await Euro.find({});
    const enriched = await enrichTopPlayers(players);
    res.json(enriched);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch Euros data", error: err.message });
  }
});

app.get("/cwc", async (req, res) => {
  try {
    const players = await Cwc.find({});
    const enriched = await enrichTopPlayers(players);
    res.json(enriched);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch CWC data", error: err.message });
  }
});

app.get("/euros/top-10", async (req, res) => {
  try {
    const players = await Euro.find({});
    const topPlayers = getTop10(players);
    const enriched = await enrichTopPlayers(topPlayers);
    res.json(enriched);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch top 10 Euros", error: err.message });
  }
});

app.get("/cwc/top-10", async (req, res) => {
  try {
    const players = await Cwc.find({});
    const topPlayers = getTop10(players);
    const enriched = await enrichTopPlayers(topPlayers);
    res.json(enriched);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch top 10 CWC", error: err.message });
  }
});

app.get("/player/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const [euroData, cwcData] = await Promise.all([
      Euro.findOne({ userId }),
      Cwc.findOne({ userId }),
    ]);

    if (!euroData && !cwcData) {
      return res
        .status(404)
        .json({ message: "Player not found in any database" });
    }

    const combinedPlayer = {
      userId,
      goals: (euroData?.goals || 0) + (cwcData?.goals || 0),
      assists: (euroData?.assists || 0) + (cwcData?.assists || 0),
      cleansheets: (euroData?.cleansheets || 0) + (cwcData?.cleansheets || 0),
      teamId: euroData?.teamId || cwcData?.teamId || null,
    };

    const [enriched] = await enrichTopPlayers([combinedPlayer]);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch and combine player data",
      error: err.message,
    });
  }
});

// Dynamic POST endpoint
app.post("/:competition", async (req, res) => {
  const { competition } = req.params;
  const { userId, goals = 0, assists = 0, cleansheets = 0, teamId } = req.body;

  const models = {
    euros: Euro,
    cwc: Cwc,
    // Add more competitions as needed
  };

  const Model = models[competition.toLowerCase()];
  if (!Model) {
    return res
      .status(404)
      .json({ message: `Unknown competition: ${competition}` });
  }

  try {
    let player = await Model.findOne({ userId });

    if (!player) {
      player = new Model({ userId, goals, assists, cleansheets, teamId });
    } else {
      player.goals += goals;
      player.assists += assists;
      player.cleansheets += cleansheets;
      if (teamId) player.teamId = teamId;
    }

    await player.save();
    res
      .status(200)
      .json({ message: `Player stats saved (${competition})`, player });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: `Failed to save stats for ${competition}`,
      error: err.message,
    });
  }
});

// Health check
app.get("/health", (_, res) => {
  res.send("✅ API is up");
});

// Bot command handler
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
    console.error("Error fetching or processing message:", err);
    message.reply("❌ Failed to fetch or parse the message.");
  }
});

// Stat parser
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
      await axios.post(`http://localhost:${PORT}/${endpoint}`, playerData);
      console.log(`✅ Posted stats for ${userId}`);
      successCount++;
    } catch (err) {
      console.error(`❌ Failed to post for ${userId}:`, err.message);
    }
  }

  return successCount;
};

// To keep the bot awake in Replit
app.get("/", (_, res) => res.send("Bot is alive"));

// Check if the bot is awake
client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  if (message.content.toLowerCase() === "are you alive my boy") {
    message.channel.send("yessir!");
  }
});

// Start bot and server
client.login(process.env.DISCORD_TOKEN).then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
});
