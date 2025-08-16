const {
  Client,
  GatewayIntentBits,
  Partials,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
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

    const players = await parsePlayerStats(fetchedMessage);

    // Build request payload
    const requestPayload = players.map((p) => ({
      userId: p.userId,
      goals: p.goals,
      assists: p.assists,
      cleansheets: p.cleansheets,
      teamId: p.teamId,
    }));

    // Log JSON to console before sending
    console.log("📦 Request payload:", JSON.stringify(requestPayload, null, 2));

    // Build no-ping preview
    let previewText = requestPayload
      .map(
        (p, i) =>
          `${i + 1}. <@${p.userId}>\nGoals: ${p.goals}, Assists: ${
            p.assists
          }, Clean Sheets: ${p.cleansheets}`
      )
      .join("\n\n");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("confirm")
        .setLabel("✅ Confirm")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("cancel")
        .setLabel("❌ Cancel")
        .setStyle(ButtonStyle.Danger)
    );

    const previewMsg = await message.reply({
      content:
        "📝 **Here’s a preview of the stats that will be sent.**\nClick ✅ to confirm or ❌ to cancel.\n\n" +
        previewText,
      allowedMentions: { parse: [] },
      components: [row],
    });

    const filter = (interaction) =>
      ["confirm", "cancel"].includes(interaction.customId) &&
      interaction.user.id === message.author.id;

    const collector = previewMsg.createMessageComponentCollector({
      filter,
      time: 60000,
    });

    collector.on("collect", async (interaction) => {
      if (interaction.customId === "confirm") {
        let successCount = 0;

        for (const p of requestPayload) {
          try {
            console.log("📤 Sending to API:", p);

            const res = await axios.post(
              `https://spl-production.up.railway.app/${targetEndpoint}`,
              p
            );

            console.log("📥 API Response:", res.data);
            successCount++;
          } catch (err) {
            console.error(`❌ Failed to post for ${p.userId}:`, err.message);
          }
        }

        await interaction.update({
          content: `✅ Successfully recorded stats for ${successCount} player${
            successCount !== 1 ? "s" : ""
          }.`,
          components: [],
        });
      } else if (interaction.customId === "cancel") {
        await interaction.update({
          content: "❌ Stats recording cancelled.",
          components: [],
        });
      }
    });

    collector.on("end", async (collected) => {
      if (collected.size === 0) {
        await previewMsg.edit({
          content: "⌛ Timed out. Stats recording cancelled.",
          components: [],
        });
      }
    });
  } catch (err) {
    console.error("Error processing message:", err);
    message.reply("❌ Failed to fetch or parse the message.");
  }
});

const parsePlayerStats = async (msg) => {
  const lines = msg.content.split("\n");

  const goals = {};
  const assists = {};
  const cleanSheets = new Set();
  const teamRoles = [];

  const teamMentionRegex = /<@&(\d+)>/g;
  for (const match of msg.content.matchAll(teamMentionRegex)) {
    teamRoles.push(match[1]);
  }

  for (const line of lines) {
    const goalMatch = line.match(/<@!?(\d+)>/);
    if (goalMatch) {
      const userId = goalMatch[1];
      const goalCount =
        (line.match(/⚽/g) || []).length +
        (line.match(/<:Goal:\d+>/g) || []).length;
      if (goalCount > 0) {
        goals[userId] = (goals[userId] || 0) + goalCount;
      }
    }
  }

  for (const line of lines) {
    const assistMatch = line.match(/<@!?(\d+)>/);
    if (assistMatch) {
      const userId = assistMatch[1];
      const assistCount =
        (line.match(/👟/g) || []).length +
        (line.match(/<:Assist:\d+>/g) || []).length;
      if (assistCount > 0) {
        assists[userId] = (assists[userId] || 0) + assistCount;
      }
    }
  }

  const cleanSheetRegex = /<:.*?:(\d+)> ✅/g;
  let match;
  while ((match = cleanSheetRegex.exec(msg.content)) !== null) {
    cleanSheets.add(match[1]);
  }

  const allUserIds = new Set([...Object.keys(goals), ...Object.keys(assists)]);
  const players = [];

  for (const userId of allUserIds) {
    const member = await msg.guild.members.fetch(userId);
    const matchingRoles = member.roles.cache.filter((role) =>
      teamRoles.includes(role.id)
    );
    const teamRole = matchingRoles.first();

    players.push({
      userId,
      goals: goals[userId] || 0,
      assists: assists[userId] || 0,
      cleansheets: teamRole && cleanSheets.has(teamRole.id) ? 1 : 0,
      teamId: teamRole?.id || null,
    });
  }

  return players;
};

// Alive check
client.on("messageCreate", (message) => {
  if (message.author.bot) return;
  if (message.content.toLowerCase() === "are you alive my boy") {
    message.channel.send("yessir!");
  }
});

client.login(process.env.DISCORD_TOKEN);
