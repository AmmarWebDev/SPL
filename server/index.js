const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { Client, GatewayIntentBits, Partials } = require("discord.js");
const Euro = require("./models/euros.model");
const Cwc = require("./models/cwc.model");

dotenv.config({ path: require("path").resolve(__dirname, "../.env") });

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, { dbName: "stats" })
  .then(() => console.log("✅ Connected to MongoDB 'stats'"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Discord Client (for enriching API responses)
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  partials: [Partials.GuildMember],
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

// Endpoints
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

// POST endpoint
app.post("/:competition", async (req, res) => {
  const { competition } = req.params;
  const { userId, goals = 0, assists = 0, cleansheets = 0, teamId } = req.body;

  const models = {
    euros: Euro,
    cwc: Cwc,
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
    res
      .status(500)
      .json({
        message: `Failed to save stats for ${competition}`,
        error: err.message,
      });
  }
});

// Health check
app.get("/health", (_, res) => {
  res.send("✅ API is up");
});

// Start the server *after* logging into Discord
client.login(process.env.DISCORD_TOKEN).then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
});
