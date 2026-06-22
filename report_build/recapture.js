// Re-capture patient (with reload) and staff (populated tab)
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const FRONTEND = process.env.FRONTEND_URL || "http://localhost:5175";
const API = "http://localhost:4000/api";
const OUT = path.join(__dirname, "assets");
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function apiLogin(u, p) {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: u, password: p }),
  });
  const json = await res.json();
  if (!json?.data?.token) throw new Error("login failed " + u);
  return json.data;
}
async function auth(page, data) {
  await page.goto(FRONTEND + "/", { waitUntil: "domcontentloaded" });
  await page.evaluate((d) => {
    localStorage.setItem("token", d.token);
    localStorage.setItem("userRole", d.role || "");
    localStorage.setItem("userName", d.username || "");
    localStorage.setItem("userDisplayName", d.displayName || d.username || "");
  }, data);
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: "new",
    defaultViewport: { width: 1440, height: 912, deviceScaleFactor: 2 },
    args: ["--no-sandbox", "--hide-scrollbars", "--force-device-scale-factor=2"],
  });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(60000);

  // --- Patient: reload + wait until profile loads ---
  console.log("re patient");
  await auth(page, await apiLogin("0914444444", "patient123"));
  await page.goto(FRONTEND + "/patient/dashboard", { waitUntil: "networkidle2" });
  await sleep(2500);
  await page.reload({ waitUntil: "networkidle2" });
  await sleep(4000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(500);
  await page.screenshot({ path: path.join(OUT, "fig12_patient.png"), type: "png" });
  console.log("  saved fig12_patient.png");

  // --- Staff: click a populated tab ---
  console.log("re staff");
  await auth(page, await apiLogin("0913333333", "staff123"));
  await page.goto(FRONTEND + "/staff/dashboard", { waitUntil: "networkidle2" });
  await sleep(3000);
  await page.evaluate(() => {
    const els = [...document.querySelectorAll("button, a, div, li")];
    const t = els.find(e => /all requests/i.test((e.textContent||"").trim()) && e.children.length <= 2);
    if (t) t.click();
  });
  await sleep(2500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(500);
  await page.screenshot({ path: path.join(OUT, "fig14_staff.png"), type: "png" });
  console.log("  saved fig14_staff.png");

  await browser.close();
  console.log("DONE");
})().catch(e => { console.error("ERR", e); process.exit(1); });
