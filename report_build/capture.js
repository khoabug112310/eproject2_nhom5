// Capture UI screenshots for the report (Figures 10-16)
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const FRONTEND = process.env.FRONTEND_URL || "http://localhost:5175";
const API = "http://localhost:4000/api";
const OUT = path.join(__dirname, "assets");
fs.mkdirSync(OUT, { recursive: true });

const ACCOUNTS = {
  patient:    { u: "0914444444", p: "patient123",    route: "/patient/dashboard" },
  doctor:     { u: "0911111111", p: "doctor123",     route: "/doctor/schedule" },
  staff:      { u: "0913333333", p: "staff123",      route: "/staff/dashboard" },
  accountant: { u: "0915555555", p: "accountant123", route: "/accountant/dashboard" },
  admin:      { u: "0901234567", p: "admin123",      route: "/admin/dashboard" },
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function apiLogin(u, p) {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: u, password: p }),
  });
  const json = await res.json();
  if (!json?.data?.token) throw new Error("login failed for " + u + ": " + JSON.stringify(json));
  return json.data; // { token, role, username, displayName }
}

async function shoot(page, file) {
  await page.screenshot({ path: path.join(OUT, file), type: "png" });
  console.log("  saved", file);
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    defaultViewport: { width: 1440, height: 912, deviceScaleFactor: 2 },
    args: ["--no-sandbox", "--hide-scrollbars", "--force-device-scale-factor=2"],
  });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(60000);

  // ---- Fig 10: Public home page ----
  console.log("Fig 10: home");
  await page.goto(FRONTEND + "/", { waitUntil: "networkidle2" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle2" });
  await sleep(2500);
  await shoot(page, "fig10_home.png");

  // ---- Fig 11: Login modal ----
  console.log("Fig 11: login");
  await page.goto(FRONTEND + "/", { waitUntil: "networkidle2" });
  await sleep(1200);
  // click the Login button in the header
  const clicked = await page.evaluate(() => {
    const els = [...document.querySelectorAll("button, a")];
    const btn = els.find(e => /log\s*in/i.test(e.textContent || "") && !/register|sign\s*up/i.test(e.textContent || ""));
    if (btn) { btn.click(); return true; }
    return false;
  });
  await sleep(1200);
  // ensure modal present
  await page.waitForSelector('input[type="password"]', { timeout: 8000 }).catch(() => {});
  // pre-fill for a realistic look
  await page.evaluate(() => {
    const tel = document.querySelector('input[type="text"]');
    const pw = document.querySelector('input[type="password"]');
    function setVal(el, v){ if(!el) return; const set=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set; set.call(el,v); el.dispatchEvent(new Event('input',{bubbles:true})); }
    setVal(tel, '0901234567');
    setVal(pw, 'admin123');
  });
  await sleep(600);
  await shoot(page, "fig11_login.png");

  // ---- Fig 12-16: role dashboards ----
  const roleFig = {
    patient: "fig12_patient.png",
    doctor: "fig13_doctor.png",
    staff: "fig14_staff.png",
    accountant: "fig15_accountant.png",
    admin: "fig16_admin.png",
  };
  for (const [role, acc] of Object.entries(ACCOUNTS)) {
    console.log("Fig:", role);
    const data = await apiLogin(acc.u, acc.p);
    // set auth on frontend origin
    await page.goto(FRONTEND + "/", { waitUntil: "domcontentloaded" });
    await page.evaluate((d) => {
      localStorage.setItem("token", d.token);
      localStorage.setItem("userRole", d.role || "");
      localStorage.setItem("userName", d.username || "");
      localStorage.setItem("userDisplayName", d.displayName || d.username || "");
    }, data);
    await page.goto(FRONTEND + acc.route, { waitUntil: "networkidle2" });
    await sleep(3500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(500);
    await shoot(page, roleFig[role]);
  }

  await browser.close();
  console.log("DONE");
})().catch(e => { console.error("CAPTURE ERROR:", e); process.exit(1); });
