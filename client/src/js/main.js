"use strict";

//! SETUP FIREBASE FOR WEB HOSTING //
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDtOrRArWN8iQ_EuxCFeFY51nobit_tV3o",
  authDomain: "spl-league.firebaseapp.com",
  projectId: "spl-league",
  storageBucket: "spl-league.firebasestorage.app",
  messagingSenderId: "608837132898",
  appId: "1:608837132898:web:20aadea03ff556379aa73b",
  measurementId: "G-DLD33E023P",
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

//! NAVBAR TOGGLER //
const toggler = document.querySelector(".navbar-toggler");
if (toggler) {
  toggler.addEventListener("click", () => {
    toggler.classList.toggle("open");
  });
}

//! DISCORD OAUTH //
const clientId = "1398258266475331685";
const redirectUri = window.location.origin + window.location.pathname;
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");

// Attach login/logout handlers
if (loginBtn) {
  loginBtn.onclick = () => {
    const discordAuthUrl =
      `https://discord.com/oauth2/authorize?client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=token&scope=identify`;
    window.location.href = discordAuthUrl;
  };
}

if (logoutBtn) {
  logoutBtn.onclick = () => {
    localStorage.removeItem("user");
    renderUI();
  };
}

// Handle Discord redirect after login
const hash = window.location.hash;
if (hash.includes("access_token")) {
  const params = new URLSearchParams(hash.substring(1));
  const token = params.get("access_token");

  axios
    .get("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((response) => {
      const user = {
        id: response.data.id,
        username: response.data.username,
        token: token,
      };
      localStorage.setItem("user", JSON.stringify(user));
      window.history.replaceState({}, document.title, redirectUri); // clean URL
      renderUI(); // ← Call UI update after login
    })
    .catch((error) => {
      console.error("Login failed:", error);
    });
}

// Render UI based on login state
function renderUI() {
  if (!loginBtn || !logoutBtn) {
    console.warn("Login/logout buttons not found in DOM.");
    return;
  }

  const stored = localStorage.getItem("user");
  if (stored) {
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
  } else {
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
  }
}

// Call it initially on page load
renderUI();
