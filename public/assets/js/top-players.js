"use strict";

// CONSTANTS //
const topPlayersSection = document.getElementById('top-players');

// CHANGE THE NAVBAR UI //
document.querySelector('.navbar-collapse a[href="index.html"]')
  .classList.toggle('active');

document.querySelector('.navbar-collapse a[href="top-players.html"]')
  .classList.toggle('active');

// PARSE THE CSV FILES //
const csvFiles = ['database/SPL CWC records.csv', 'database/SPL Euros records.csv'];

Promise.all(csvFiles.map(file => axios.get(file)))
  .then(responses => {
    responses.forEach((response, index) => {
      const parsed = Papa.parse(response.data, {
        header: true,
        skipEmptyLines: true
      });

      const leagueNameMatch = csvFiles[index].match(/SPL\s(.*?)(?=\srecords)/);
      const leagueName = leagueNameMatch ? leagueNameMatch[1] : "Unknown League";


      // Create League Title
      const h1 = document.createElement('h1');
      h1.classList.add('text-light', 'text-center', 'mt-5');
      h1.innerHTML = `
        <img src="assets/images/${leagueName.toLowerCase()}-logo.png" width="40px" />
        <span>SPL ${leagueName}</span>
        <img src="assets/images/${leagueName.toLowerCase()}-logo.png" width="40px" />
      `;
      
      topPlayersSection.appendChild(h1);

      const players = parsed.data.map(player => ({
        Username: player["Username"],
        Goals: parseInt(player["Goals"]),
        Assists: parseInt(player["Assists"])
      }));

      // Top 10 Goal Scorers
      const topGoals = [...players]
        .sort((a, b) => b.Goals - a.Goals || b.Assists - a.Assists)
        .slice(0, 10);

      // Top 10 Assisters
      const topAssists = [...players]
        .sort((a, b) => b.Assists - a.Assists || b.Goals - a.Goals)
        .slice(0, 10);

      // Generate Goalscorers Table
      const goalsTableHTML = `
        <h2 class="text-light text-center">🏆 Top 10 ${leagueName} Goalscorers 🏆</h2>
        <table class="table table-dark table-striped table-bordered table-hover text-center container my-3">
          <thead>
            <tr>
              <th scope="col">Username</th>
              <th scope="col">Goals</th>
            </tr>
          </thead>
          <tbody>
            ${topGoals.map(player => `
              <tr>
                <td>${player.Username}</td>
                <td>${player.Goals}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      // Generate Assisters Table
      const assistsTableHTML = `
        <h2 class="text-light text-center">🏆 Top 10 ${leagueName} Assisters 🏆</h2>
        <table class="table table-dark table-striped table-bordered table-hover text-center container my-3">
          <thead>
            <tr>
              <th scope="col">Username</th>
              <th scope="col">Assists</th>
            </tr>
          </thead>
          <tbody>
            ${topAssists.map(player => `
              <tr>
                <td>${player.Username}</td>
                <td>${player.Assists}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      // Combine and append
      const combinedHTML = goalsTableHTML + assistsTableHTML;
      topPlayersSection.innerHTML += combinedHTML;

      // Add <hr> after each league except the last
      if (index < responses.length - 1) {
        topPlayersSection.innerHTML += '<hr class="border-white border-2 opacity-100" style="margin: 70px 0" />';
      }
    });
  })
  .catch(error => {
    console.error('Error loading CSVs:', error);
  });