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

//! GET TOP PLAYERS //
const leagues = ["cwc", "euros"];
const statTypes = ["goals", "assists"];

leagues.forEach((leagueSlug, index) => {
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

  // Fetch goals and assists concurrently
  Promise.all(
    statTypes.map((type) =>
      axios.get(
        `https://spl-production.up.railway.app/${leagueSlug}/top-${type}`
      )
    )
  )
    .then(([goalsRes, assistsRes]) => {
      const formatPlayer = (p) => ({
        id: `<@${p.userId}>`,
        username: p.username,
        nickname: p.nickname,
        avatar: p.avatar,
        teamName:
          p.teamName?.replace(/^《SPL》( *\| *)?/i, "").trim() || "Unknown",
        teamIcon: p.teamIcon,
        goals: parseInt(p.goals) || 0,
        assists: parseInt(p.assists) || 0,
      });

      const topGoals = goalsRes.data
        .filter((p) => p.username)
        .map(formatPlayer)
        .slice(0, 10);
      const topAssists = assistsRes.data
        .filter((p) => p.username)
        .map(formatPlayer)
        .slice(0, 10);

      const generateTableHTML = (title, data, type) => {
        const label = type === "goals" ? "Goals" : "Assists";
        return `
          <h2 class="text-light text-center responsive-text">🏆 Top 10 ${leagueName} ${label} 🏆</h2>
          <table class="table table-striped table-bordered table-hover text-center w-100 my-3 mx-auto" style="max-width: 600px">
            <thead>
              <tr>
                <th>#</th>
                <th>Player</th>
                <th>Team</th>
                <th>${label}</th>
              </tr>
            </thead>
            <tbody>
              ${data
                .map(
                  (p, i) => `
                <tr>
                  <td class="align-middle">${i + 1}.</td>
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

      if (index !== leagues.length - 1) {
        topPlayersSection.insertAdjacentHTML(
          "beforeend",
          `<hr class="border-white border-2 opacity-100" style="margin:70px 0;" />`
        );
      }
    })
    .catch((err) => console.error("Error fetching API:", err));
});
