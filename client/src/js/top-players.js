"use strict";

//! CONSTANTS //
const topPlayersSection = document.getElementById("top-players");

//! NAVBAR HIGHLIGHT //
document
  .querySelector('.navbar-collapse a[href="index.html"]')
  .classList.toggle("active");
document
  .querySelector('.navbar-collapse a[href="top-players.html"]')
  .classList.toggle("active");

//! SEND TOP PLAYERS //
function openConfirmResultModal() {
  const addModalEl = document.getElementById("add-result-modal");
  const confirmModalEl = document.getElementById("confirm-result-modal");

  const addModalInstance = bootstrap.Modal.getInstance(addModalEl);
  const confirmModalInstance = new bootstrap.Modal(confirmModalEl);

  const chosenLeague = document.getElementById("league-name").value;
  const matchResult = document.getElementById("match-result").value.trim();

  try {
    const lines = matchResult
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const result = {
      scorers: [],
      cards: [],
      goalkeepers: [],
    };

    const emojiPattern = /(?::[\w]+:|<:[\w]+:\d+>)/;
    const optionalEmoji = `(?:${emojiPattern.source})?\\s*`;

    // 1. Header line
    if (!lines[0].startsWith("# ")) throw new Error("Missing header");
    const headerLine = lines[0].replace(/^# /, "").trim();
    const lastSpaceIndex = headerLine.lastIndexOf(" ");
    if (lastSpaceIndex === -1) throw new Error("Invalid header format");

    result.competition = headerLine.slice(0, lastSpaceIndex).trim();
    result.stage = headerLine
      .slice(lastSpaceIndex + 1)
      .toLowerCase()
      .replace(/\s+/g, "-");

    // 2. Match line
    const matchLine = lines[1];
    const matchRegex = new RegExp(
      `^#\\s*${optionalEmoji}<@&(\\d+)>\\s+(\\d+)\\s*-\\s*(\\d+)\\s+<@&(\\d+)>\\s*${optionalEmoji}$`
    );
    const matchMatch = matchLine.match(matchRegex);
    if (!matchMatch) throw new Error("Invalid match line");

    result.teamA = {
      roleId: matchMatch[1],
      score: parseInt(matchMatch[2]),
    };
    result.teamB = {
      roleId: matchMatch[4],
      score: parseInt(matchMatch[3]),
    };

    // 3. Referee (optional)
    let currentIndex = 2;
    if (lines[currentIndex] && lines[currentIndex].startsWith("# REF:")) {
      const refMatch = lines[currentIndex].match(/^# REF:\s*<@(\d+)>/);
      if (refMatch) {
        result.referee = refMatch[1];
      }
      currentIndex++;
    }

    // 4. Stats block
    if (!lines[currentIndex] || !lines[currentIndex].startsWith("# STATS:")) {
      throw new Error("Missing # STATS:");
    }
    currentIndex++;

    while (
      currentIndex < lines.length &&
      !lines[currentIndex].startsWith("#")
    ) {
      const statLine = lines[currentIndex];
      const statMatch = statLine.match(
        new RegExp(
          `^${optionalEmoji}<@&(\\d+)>\\s+<@(\\d+)>:\\s*(\\d+) goal[s]?[,\\s]*(\\d+)? assist[s]?$`
        )
      );
      if (statMatch) {
        result.scorers.push({
          teamRoleId: statMatch[1],
          userId: statMatch[2],
          goals: parseInt(statMatch[3]),
          assists: statMatch[4] ? parseInt(statMatch[4]) : 0,
        });
      }
      currentIndex++;
    }

    // 5. Cards (optional)
    if (lines[currentIndex] && lines[currentIndex].startsWith("# Cards:")) {
      currentIndex++;
      while (
        currentIndex < lines.length &&
        !lines[currentIndex].startsWith("#")
      ) {
        const cardLine = lines[currentIndex];
        const cardMatch = cardLine.match(
          new RegExp(`^${optionalEmoji}<@&(\\d+)>\\s+<@(\\d+)>\\s+(🟨|🟥)$`)
        );
        if (cardMatch) {
          result.cards.push({
            teamRoleId: cardMatch[1],
            userId: cardMatch[2],
            card: cardMatch[3],
          });
        }
        currentIndex++;
      }
    }

    // 6. Goalkeepers
    if (
      !lines[currentIndex] ||
      !lines[currentIndex].startsWith("# Goalkeepers:")
    ) {
      throw new Error("Missing # Goalkeepers:");
    }
    currentIndex++;

    while (
      currentIndex < lines.length &&
      !lines[currentIndex].startsWith("#")
    ) {
      const gkLine = lines[currentIndex];
      const gkMatch = gkLine.match(
        new RegExp(`^${optionalEmoji}<@&(\\d+)>\\s+<@(\\d+)>$`)
      );
      if (gkMatch) {
        result.goalkeepers.push({
          teamRoleId: gkMatch[1],
          userId: gkMatch[2],
        });
      }
      currentIndex++;
    }

    // 7. MOTM
    if (!lines[currentIndex] || !lines[currentIndex].startsWith("# MOTM:")) {
      throw new Error("Missing # MOTM:");
    }
    const motmMatch = lines[currentIndex].match(/^# MOTM:\s*<@(\d+)>/);
    if (!motmMatch) throw new Error("Invalid MOTM format");
    result.motm = motmMatch[1];

    // ✅ All parsed successfully!
    console.log(result);

    // Show confirm modal
    document.getElementById(
      "confirm-result-modal-body"
    ).innerHTML = `You are going to post a new result to ${chosenLeague}`;
    if (addModalInstance) {
      addModalEl.addEventListener(
        "hidden.bs.modal",
        () => {
          confirmModalInstance.show();
        },
        { once: true }
      );
      addModalInstance.hide();
    } else {
      confirmModalInstance.show();
    }
  } catch (err) {
    console.log("invalid template:", err.message);
  }
}

//! GET TOP PLAYERS //
const apiUrls = [
  "http://localhost:3000/euros/top-10",
  "http://localhost:3000/cwc/top-10",
];

apiUrls.forEach((url) => {
  axios
    .get(url)
    .then((res) => {
      const players = res.data;
      // Extract league slug from API URL
      const parts = url.split("/");
      const leagueSlug = parts[parts.length - 2]; // "euros" or "cwc"
      const leagueName = leagueSlug === "cwc" ? "CWC" : "Euros";

      // Add league title
      const h1 = document.createElement("h1");
      h1.className = "text-center mt-5";
      h1.innerHTML = `
        <img src="assets/images/${leagueSlug}-logo.png" width="40" />
        <span>SPL ${leagueName}</span>
        <img src="assets/images/${leagueSlug}-logo.png" width="40" />
      `;
      topPlayersSection.appendChild(h1);

      const flatPlayers = players
        .filter((p) => p.username)
        .map((p) => ({
          id: `<@${p.userId}>`,
          username: p.username,
          nickname: p.nickname,
          avatar: p.avatar,
          teamName:
            p.teamName?.replace(/^《SPL》( *\| *)?/i, "").trim() || "Unknown",
          teamIcon: p.teamIcon,
          goals: parseInt(p.goals) || 0,
          assists: parseInt(p.assists) || 0,
        }));

      const topGoals = [...flatPlayers]
        .sort((a, b) => b.goals - a.goals || b.assists - a.assists)
        .slice(0, 10);

      const topAssists = [...flatPlayers]
        .sort((a, b) => b.assists - a.assists || b.goals - a.goals)
        .slice(0, 10);

      const generateTableHTML = (title, data, type) => {
        const label = type === "goals" ? "Goals" : "Assists";
        return `
          <h2 class="text-light text-center responsive-text">🏆 Top 10 ${leagueName} ${label} 🏆</h2>
          <table class="table table-striped table-bordered table-hover text-center w-100 my-3 mx-auto" style="max-width: 600px">
            <thead>
              <tr>
                <th>Player</th>
                <th>Team</th>
                <th>${label}</th>
              </tr>
            </thead>
            <tbody>
              ${data
                .map(
                  (p) => `
                <tr>
                  <td class="align-middle text-center">
                    <div class="d-flex align-items-center justify-between gap-2">
                      <img src="${
                        p.avatar
                      }" width="32" height="32" style="border-radius: 50%" />
                      <span class="w-100">${p.username}</span>
                    </div>
                  </td>
                  <td class="align-middle text-center">
                    <div class="d-flex align-items-center justify-content-center gap-2">
                      <span>${p.teamName}</span>
                      ${
                        p.teamIcon
                          ? `<img src="${p.teamIcon}" width="20" height="20" />`
                          : ""
                      }
                    </div>
                  </td>
                  <td class="align-middle text-center">${p[type]}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        `;
      };

      const goalsTableHTML = generateTableHTML("Goals", topGoals, "goals");
      const assistsTableHTML = generateTableHTML(
        "Assists",
        topAssists,
        "assists"
      );

      topPlayersSection.insertAdjacentHTML(
        "beforeend",
        `
        <div class="row">
          <div class="col-12 col-lg-6">${goalsTableHTML}</div>
          <div class="col-12 col-lg-6">${assistsTableHTML}</div>
        </div>
      `
      );

      const summaryLines = [];
      summaryLines.push(`# SPL ${leagueName} Top 10 Scorers Till Now:`);
      topGoals.forEach((p, i) => {
        if (p.goals > 0) {
          const label = p.goals === 1 ? "goal" : "goals";
          summaryLines.push(
            `### ${i + 1}. ${p.id} (${p.teamName}): ${p.goals} ${label}`
          );
        }
      });

      summaryLines.push(`\n# SPL ${leagueName} Top 10 Assistors Till Now:`);
      topAssists.forEach((p, i) => {
        if (p.assists > 0) {
          const label = p.assists === 1 ? "assist" : "assists";
          summaryLines.push(
            `### ${i + 1}. ${p.id} (${p.teamName}): ${p.assists} ${label}`
          );
        }
      });

      const copyBtn = document.createElement("button");
      copyBtn.className = "btn btn-primary my-4 d-block mx-auto";
      copyBtn.textContent = `📋 Copy SPL ${leagueName} Summary`;
      copyBtn.addEventListener("click", () => {
        navigator.clipboard
          .writeText(summaryLines.join("\n"))
          .then(() => {
            copyBtn.textContent = "✅ Copied!";
            setTimeout(() => {
              copyBtn.textContent = `📋 Copy SPL ${leagueName} Summary`;
            }, 2000);
          })
          .catch((err) => {
            console.error("Copy failed", err);
            copyBtn.textContent = "❌ Failed to Copy";
          });
      });

      topPlayersSection.appendChild(copyBtn);

      if (url !== apiUrls[apiUrls.length - 1]) {
        topPlayersSection.insertAdjacentHTML(
          "beforeend",
          `<hr class="border-white border-2 opacity-100" style="margin:70px 0;" />`
        );
      }
    })
    .catch((err) => console.error("Error fetching API:", err));
});
