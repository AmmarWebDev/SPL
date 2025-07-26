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
const addNewResultBtn = document.getElementById("add-result-btn");

addNewResultBtn.onclick = function () {};

//! GET TOP PLAYERS //
const csvFiles = [
  "database/spl-cwc-records.csv",
  "database/spl-euros-records.csv",
];

Promise.all(csvFiles.map((file) => axios.get(file)))
  .then((responses) => {
    responses.forEach((response, index) => {
      const parsed = Papa.parse(response.data, {
        header: true,
        skipEmptyLines: true,
      }).data;

      const leagueNameMatch = csvFiles[index].match(/spl-(.*?)-records/i);
      const leagueName = leagueNameMatch
        ? leagueNameMatch[1].toUpperCase()
        : "Unknown League";

      // 1) TITLE
      const h1 = document.createElement("h1");
      h1.className = "text-center mt-5";
      h1.innerHTML = `
        <img src="assets/images/${leagueName.toLowerCase()}-logo.png" width="40" />
        <span>SPL ${leagueName}</span>
        <img src="assets/images/${leagueName.toLowerCase()}-logo.png" width="40" />
      `;
      topPlayersSection.appendChild(h1);

      // 2) FLATTENED PLAYERS FOR TABLES
      const flatPlayers = parsed.map((p) => ({
        Username: p.Username,
        Goals: parseInt(p.Goals, 10) || 0,
        Assists: parseInt(p.Assists, 10) || 0,
      }));

      // Top 10 by Goals (tie-break by Assists)
      const tableTopGoals = [...flatPlayers]
        .sort((a, b) => b.Goals - a.Goals || b.Assists - a.Assists)
        .slice(0, 10);

      // Top 10 by Assists (tie-break by Goals)
      const tableTopAssists = [...flatPlayers]
        .sort((a, b) => b.Assists - a.Assists || b.Goals - a.Goals)
        .slice(0, 10);

      // 3) RENDER TABLES
      const goalsTableHTML = `
        <h2 class="text-light text-center responsive-text">
          🏆 Top 10 ${leagueName} Goalscorers 🏆
        </h2>
        <table class="table table-striped table-bordered table-hover text-center w-100 my-3 mx-auto" style="max-width: 500px">
          <thead><tr><th>Username</th><th>Goals</th></tr></thead>
          <tbody>
            ${tableTopGoals
              .map(
                (p) => `
              <tr>
                <td>${p.Username}</td>
                <td>${p.Goals}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      `;

      const assistsTableHTML = `
        <h2 class="text-light text-center responsive-text">
          🏆 Top 10 ${leagueName} Assisters 🏆
        </h2>
        <table class="table table-striped table-bordered table-hover text-center w-100 my-3 mx-auto" style="max-width: 500px">
          <thead><tr><th>Username</th><th>Assists</th></tr></thead>
          <tbody>
            ${tableTopAssists
              .map(
                (p) => `
              <tr>
                <td>${p.Username}</td>
                <td>${p.Assists}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      `;

      topPlayersSection.insertAdjacentHTML(
        "beforeend",
        `
        <div class="row">
          <div class="col-12 col-lg-6">${goalsTableHTML}</div>
          <div class="col-12 col-lg-6">${assistsTableHTML}</div>
        </div>
      `
      );

      // 4) GROUPED PLAYERS FOR COPY SUMMARY
      const grouped = {};
      parsed.forEach((p) => {
        const id = p["User ID"]?.trim()
          ? `<@${p["User ID"].trim()}>`
          : `@${p.Username}`;
        const emoji = p["Team Emoji"] || "";
        const key = id + "||" + emoji;
        if (!grouped[key]) grouped[key] = { id, emoji, Goals: 0, Assists: 0 };
        grouped[key].Goals += parseInt(p.Goals, 10) || 0;
        grouped[key].Assists += parseInt(p.Assists, 10) || 0;
      });
      const groupedList = Object.values(grouped);

      const summaryTopGoals = [...groupedList]
        .sort((a, b) => b.Goals - a.Goals || b.Assists - a.Assists)
        .slice(0, 10);

      const summaryTopAssists = [...groupedList]
        .sort((a, b) => b.Assists - a.Assists || b.Goals - a.Goals)
        .slice(0, 10);

      // 5) BUILD SUMMARY TEXT
      const summaryLines = [];
      summaryLines.push(`# SPL ${leagueName} Top 10 Scorers Till Now:`);
      summaryTopGoals.forEach((p, i) => {
        if (p.Goals > 0) {
          const label = p.Goals === 1 ? "goal" : "goals";
          summaryLines.push(
            `### ${i + 1}. ${p.id} ${p.emoji}: ${p.Goals} ${label}`
          );
        }
      });

      summaryLines.push(`\n# SPL ${leagueName} Top 10 Assistors Till Now:`);
      summaryTopAssists.forEach((p, i) => {
        if (p.Assists > 0) {
          const label = p.Assists === 1 ? "assist" : "assists";
          summaryLines.push(
            `### ${i + 1}. ${p.id} ${p.emoji}: ${p.Assists} ${label}`
          );
        }
      });

      // 6) COPY BUTTON
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

      // 7) HR AFTER EACH LEAGUE (except last)
      if (index < responses.length - 1) {
        topPlayersSection.insertAdjacentHTML(
          "beforeend",
          `<hr class="border-white border-2 opacity-100" style="margin:70px 0;" />`
        );
      }
    });
  })
  .catch((err) => console.error("Error loading CSVs:", err));
