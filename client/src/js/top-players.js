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

// Inject responsive CSS for table scrolling
(function addResponsiveStyles() {
  const css = `
    @media (max-width: 576px) {
      .table-responsive {
        overflow-x: scroll;
        -webkit-overflow-scrolling: touch;
      }
      .table-responsive table {
        width: auto;
        max-width: none;
      }
      .table-responsive td, 
      .table-responsive th {
        white-space: nowrap;
      }
      .player-info-cell {
        max-width: 180px;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  `;
  const style = document.createElement("style");
  style.appendChild(document.createTextNode(css));
  document.head.appendChild(style);
})();

leagues.forEach((leagueSlug, leagueIndex) => {
  const leagueName = leagueSlug === "cwc" ? "CWC" : "Euros";

  Promise.all(
    statTypes.map((type) =>
      axios.get(
        `https://spl-production.up.railway.app/${leagueSlug}/top-${type}`
      )
    )
  )
    .then(([goalsRes, assistsRes]) => {
      // Container for league section
      const leagueContainer = document.createElement("div");
      leagueContainer.className = "league-section";

      // League Heading
      const h1 = document.createElement("h1");
      h1.className = "text-center mt-5";
      h1.innerHTML = `
        <img src="assets/images/${leagueSlug}-logo.png" width="40" />
        <span>SPL ${leagueName}</span>
        <img src="assets/images/${leagueSlug}-logo.png" width="40" />
      `;
      leagueContainer.appendChild(h1);

      // Player formatter (with fallback)
      const formatPlayer = (p) => ({
        id: `<@${p.userId}>`,
        username: p.username || `<@${p.userId}>`,
        avatar: p.avatar,
        teamName:
          p.teamName?.replace(/^《SPL》( *\| *)?/i, "").trim() || "Unknown",
        teamIcon: p.teamIcon,
        goals: parseInt(p.goals) || 0,
        assists: parseInt(p.assists) || 0,
      });

      // Always take the top 10, no filter
      const topGoals = goalsRes.data.map(formatPlayer).slice(0, 10);
      const topAssists = assistsRes.data.map(formatPlayer).slice(0, 10);

      // Table generator
      const generateTableHTML = (label, data, key) => `
        <h2 class="text-light text-center responsive-text">🏆 Top 10 ${leagueName} ${label} 🏆</h2>
        <div class="table-responsive">
          <table class="table table-striped table-bordered table-hover text-center my-3">
            <thead>
              <tr>
                <th class="rank-col">#</th>
                <th class="player-col">Player</th>
                <th class="team-col">Team</th>
                <th class="stat-col">${label}</th>
              </tr>
            </thead>
            <tbody>
              ${data
                .map(
                  (p, i) => `
                <tr>
                  <td class="align-middle rank-col">${i + 1}.</td>
                  <td class="align-middle player-col player-info-cell">
                    <div class="d-flex align-items-center gap-2">
                      <img src="${
                        p.avatar
                      }" width="32" height="32" style="border-radius:50%" />
                      <span class="w-100">${p.username}</span>
                    </div>
                  </td>
                  <td class="align-middle team-col player-info-cell">
                    <div class="d-flex align-items-center gap-2 justify-content-center">
                      <span>${p.teamName}</span>
                      ${
                        p.teamIcon
                          ? `<img src="${p.teamIcon}" width="20" height="20" />`
                          : ""
                      }
                    </div>
                  </td>
                  <td class="align-middle stat-col">${p[key]}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `;

      // Insert goals & assists side by side
      leagueContainer.insertAdjacentHTML(
        "beforeend",
        `<div class="row">
          <div class="col-12 col-lg-6">${generateTableHTML(
            "Goals",
            topGoals,
            "goals"
          )}</div>
          <div class="col-12 col-lg-6">${generateTableHTML(
            "Assists",
            topAssists,
            "assists"
          )}</div>
        </div>`
      );

      // Build summary text
      const summaryLines = [];
      summaryLines.push(`# SPL ${leagueName} Top 10 Scorers Till Now:`);
      topGoals.forEach((p, i) => {
        const lbl = p.goals === 1 ? "goal" : "goals";
        summaryLines.push(
          `### ${i + 1}. ${p.id} (${p.teamName}): ${p.goals} ${lbl}`
        );
      });
      summaryLines.push(`\n# SPL ${leagueName} Top 10 Assistors Till Now:`);
      topAssists.forEach((p, i) => {
        const lbl = p.assists === 1 ? "assist" : "assists";
        summaryLines.push(
          `### ${i + 1}. ${p.id} (${p.teamName}): ${p.assists} ${lbl}`
        );
      });

      // Copy button
      const copyBtn = document.createElement("button");
      copyBtn.className = "btn btn-primary my-4 d-block mx-auto";
      copyBtn.textContent = `📋 Copy SPL ${leagueName} Summary`;
      copyBtn.addEventListener("click", () => {
        navigator.clipboard
          .writeText(summaryLines.join("\n"))
          .then(() => (copyBtn.textContent = "✅ Copied!"))
          .catch(() => (copyBtn.textContent = "❌ Failed to Copy"));
        setTimeout(
          () => (copyBtn.textContent = `📋 Copy SPL ${leagueName} Summary`),
          2000
        );
      });
      leagueContainer.appendChild(copyBtn);

      // Append the complete league block
      topPlayersSection.appendChild(leagueContainer);
    })
    .catch((err) => console.error("Error fetching API:", err));
});
