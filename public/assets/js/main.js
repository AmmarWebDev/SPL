"use strict";

//! SETUP FIREBASE FOR WEB HOSTING //
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDtOrRArWN8iQ_EuxCFeFY51nobit_tV3o",
  authDomain: "spl-league.firebaseapp.com",
  projectId: "spl-league",
  storageBucket: "spl-league.firebasestorage.app",
  messagingSenderId: "608837132898",
  appId: "1:608837132898:web:20aadea03ff556379aa73b",
  measurementId: "G-DLD33E023P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);


//! NAVBAR TOGGLER //
const toggler = document.querySelector('.navbar-toggler');

if (toggler) {
  toggler.addEventListener('click', () => {
    toggler.classList.toggle('open');
  });
}


//! LANDING WALLPAPERS SWITCH //
const images = [
  'assets/images/landing-wallpaper1.png',
  'assets/images/landing-wallpaper2.png',
  'assets/images/landing-wallpaper3.png',
  'assets/images/landing-wallpaper4.png'
];

const [img1, img2] = document.querySelectorAll('.wallpaper-img');
let current = 0;
let showingFirst = true;

function changeWallpaper() {
  const next = (current + 1) % images.length;
  const [fadeOutImg, fadeInImg] = showingFirst ? [img1, img2] : [img2, img1];

  fadeInImg.src = images[next];
  fadeInImg.classList.add('active');
  fadeOutImg.classList.remove('active');

  current = next;
  showingFirst = !showingFirst;
}

if (img1 && img2) {
  setInterval(changeWallpaper, 5000);
}

//! WALLPAPER PARALLAX EFFECT //
const wallpapers = document.querySelectorAll('.wallpaper-img');

let targetX = 0;
let targetY = 0;
let currentX = 0;
let currentY = 0;
const depth = 0.025; // You already had 0.05 / 2

document.addEventListener('mousemove', (e) => {
  // Calculate desired position based on cursor location
  targetX = (window.innerWidth / 2 - e.clientX) * depth;
  targetY = (window.innerHeight / 2 - e.clientY) * depth;
});

function animate() {
  // Smoothly interpolate towards the target
  currentX += (targetX - currentX) * 0.1;
  currentY += (targetY - currentY) * 0.1;

  wallpapers.forEach(wallpaper => {
    wallpaper.style.transform = `scale(1.1) translate(${currentX}px, ${currentY}px)`;
  });

  requestAnimationFrame(animate);
}

if (wallpapers) {
  animate(); // Start the animation loop
}
