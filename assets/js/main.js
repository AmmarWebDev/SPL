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