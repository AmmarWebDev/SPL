# Frontend–Backend Integration: Match Stats Update System

Hey [name], here’s how things work on my side and what I need from the backend:

---

## 🔧 Current Setup

- I’ve been storing the player stats (goals, assists) in `.csv` files inside the `public/database/` folder.  
- I fetch those files using client-side JavaScript and display the data on a leaderboard page.
- Until now, I’ve been **manually editing the CSV files** after each match.

---

## 🚀 Goal with Your Backend

Now that you're handling the backend, I want to switch to using a **real database** so I don't have to touch CSV files anymore.

Here’s the new flow I’m aiming for:

1. A user logs in using **Discord OAuth**.
2. After login, I get their **Discord user ID**.
3. If their Discord ID is in a **whitelist**, they can submit match results.
4. I’ll send a **`POST` request** to your API containing:
   - The user’s Discord ID
   - The submitted match stats (e.g., goals, assists)

---

## 🧾 Example JSON I’ll Send

```json
{
  "userId": "1234567890",
  "matchStats": [
    { "player": "Player1", "goals": 1, "assists": 2 },
    { "player": "Player2", "goals": 0, "assists": 1 }
  ]
}
