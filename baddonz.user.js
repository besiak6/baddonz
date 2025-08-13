// ==UserScript==
// @name          Baddonz
// @version       0.9
// @description   Menadżer dodatków by besiak
// @author        besiak
// @match         https://*.margonem.pl/*
// @grant         none
// @icon          https://i.imgur.com/OAtRFEw.png
// @downloadURL   https://raw.githubusercontent.com/besiak6/baddonz/refs/heads/main/baddonz.user.js
// @updateURL     https://raw.githubusercontent.com/besiak6/baddonz/refs/heads/main/baddonz.user.js
// ==/UserScript==
(function() {
    window.CSS_URL = "https://raw.githubusercontent.com/besiak6/baddonz/refs/heads/main/besiak.css";
    const version = Date.now();
    const build = "https://addons2.margonem.pl/get/153/153736dev.js";
    const script = document.createElement("script");
    script.src = `${build}?v=${version}`;
    document.body.appendChild(script);
})();
