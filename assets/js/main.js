"use strict";

// LANDING WALLPAPERS SWITCH //
const images = [
  '../static/images/landing-wallpaper1.png',
  '../static/images/landing-wallpaper2.png',
  '../static/images/landing-wallpaper3.png',
  '../static/images/landing-wallpaper4.png'
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

setInterval(changeWallpaper, 5000);
