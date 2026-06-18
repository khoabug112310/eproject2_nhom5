const path = require('path');
const puppeteer = require('puppeteer-core');
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const FRONTEND = process.env.FRONTEND_URL || "http://localhost:5175";
const API = "http://localhost:4000/api";
const OUT = path.join(__dirname, "assets");
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function apiLogin(u, p) {
  const res = await fetch(`${API}/auth/login`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({username:u,password:p}) });
  return (await res.json()).data;
}
(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless:"new",
    defaultViewport:{width:1440,height:912,deviceScaleFactor:2}, args:["--no-sandbox","--hide-scrollbars","--force-device-scale-factor=2"] });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(60000);

  // A) patient dashboard booking panel
  const d = await apiLogin("0914444444","patient123");
  await page.goto(FRONTEND + "/", { waitUntil:"domcontentloaded" });
  await page.evaluate((d)=>{ localStorage.setItem("token",d.token); localStorage.setItem("userRole",d.role||""); localStorage.setItem("userName",d.username||""); localStorage.setItem("userDisplayName",d.displayName||d.username||""); }, d);
  await page.goto(FRONTEND + "/patient/dashboard", { waitUntil:"networkidle2" });
  await sleep(2500);
  await page.evaluate(()=> window.dispatchEvent(new Event('toggleBooking')));
  await sleep(3500);
  // scroll to booking form if present
  await page.evaluate(()=>{ const el=[...document.querySelectorAll('*')].find(e=>/select.*department|choose.*department|book an appointment/i.test(e.textContent||'')&&e.children.length<5); if(el) el.scrollIntoView({block:'center'}); });
  await sleep(800);
  await page.screenshot({ path: path.join(OUT,"cand_patient_booking.png"), type:"png" });
  console.log("saved cand_patient_booking.png");

  // B) public quick-booking modal
  await page.evaluate(()=> localStorage.clear());
  await page.goto(FRONTEND + "/", { waitUntil:"networkidle2" });
  await sleep(1500);
  await page.evaluate(()=> window.dispatchEvent(new Event('open-booking-modal')));
  await sleep(2500);
  await page.screenshot({ path: path.join(OUT,"cand_quickbooking.png"), type:"png" });
  console.log("saved cand_quickbooking.png");

  await browser.close();
  console.log("DONE");
})().catch(e=>{console.error(e);process.exit(1);});
