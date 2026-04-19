const fs = require("fs");
const path = require("path");

const apiUrl = process.env.MILK_API_URL || "";
const configPath = path.join(__dirname, "config.js");

fs.writeFileSync(
    configPath,
    `window.MILK_API_URL = ${JSON.stringify(apiUrl)};\n`,
    "utf8"
);

console.log(`Wrote config.js with ${apiUrl || "same-host API fallback"}`);
