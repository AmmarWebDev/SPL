"use strict";

//! LANDING WALLPAPERS SWITCH //
const images = [
  "assets/images/landing-wallpaper1.png",
  "assets/images/landing-wallpaper2.png",
  "assets/images/landing-wallpaper3.png",
  "assets/images/landing-wallpaper4.png",
];

const [img1, img2] = document.querySelectorAll(".wallpaper-img");
let current = 0;
let showingFirst = true;

function changeWallpaper() {
  const next = (current + 1) % images.length;
  const [fadeOutImg, fadeInImg] = showingFirst ? [img1, img2] : [img2, img1];

  fadeInImg.src = images[next];
  fadeInImg.classList.add("active");
  fadeOutImg.classList.remove("active");

  current = next;
  showingFirst = !showingFirst;
}

if (img1 && img2) {
  setInterval(changeWallpaper, 5000);
}

//! WALLPAPER PARALLAX EFFECT //
const wallpapers = document.querySelectorAll(".wallpaper-img");

let targetX = 0;
let targetY = 0;
let currentX = 0;
let currentY = 0;
const depth = 0.025; // You already had 0.05 / 2

document.addEventListener("mousemove", (e) => {
  // Calculate desired position based on cursor location
  targetX = (window.innerWidth / 2 - e.clientX) * depth;
  targetY = (window.innerHeight / 2 - e.clientY) * depth;
});

function animate() {
  // Smoothly interpolate towards the target
  currentX += (targetX - currentX) * 0.1;
  currentY += (targetY - currentY) * 0.1;

  wallpapers.forEach((wallpaper) => {
    wallpaper.style.transform = `scale(1.1) translate(${currentX}px, ${currentY}px)`;
  });

  requestAnimationFrame(animate);
}

animate(); // Start the animation loop
