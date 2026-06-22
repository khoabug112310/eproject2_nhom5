const path = require('path');
const puppeteer = require('puppeteer-core');
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const FRONTEND = process.env.FRONTEND_URL || "http://localhost:5175";
const API = "http://localhost:4000/api";
const OUT = path.join(__dirname, "assets");
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function apiLogin(u,p){ const r=await fetch(`${API}/auth/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:u,password:p})}); return (await r.json()).data; }
(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless:"new",
    defaultViewport:{width:1440,height:912,deviceScaleFactor:2}, args:["--no-sandbox","--hide-scrollbars","--force-device-scale-factor=2"] });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(60000);
  const d = await apiLogin("0914444444","patient123");
  await page.goto(FRONTEND + "/", { waitUntil:"domcontentloaded" });
  await page.evaluate((d)=>{ localStorage.setItem("token",d.token); localStorage.setItem("userRole",d.role||""); localStorage.setItem("userName",d.username||""); localStorage.setItem("userDisplayName",d.displayName||d.username||""); }, d);
  await page.goto(FRONTEND + "/patient/dashboard", { waitUntil:"networkidle2" });
  await sleep(2500);
  await page.evaluate(()=> window.dispatchEvent(new Event('toggleBooking')));
  await sleep(3000);
  // fill department (first non-placeholder) + symptoms
  await page.evaluate(()=>{
    const sel = document.querySelector('select');
    if (sel && sel.options.length > 1){ sel.selectedIndex = 1; sel.dispatchEvent(new Event('change',{bubbles:true})); }
    const ta = document.querySelector('textarea');
    if (ta){ const set=Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,'value').set; set.call(ta,'Recurring headaches and mild fever for the past two days; would like a general check-up.'); ta.dispatchEvent(new Event('input',{bubbles:true})); }
  });
  await sleep(1500);
  await page.evaluate(()=>{ const el=[...document.querySelectorAll('*')].find(e=>/Request a new appointment/i.test(e.textContent||'')&&e.children.length<6); if(el) el.scrollIntoView({block:'center'}); });
  await sleep(800);
  await page.screenshot({ path: path.join(OUT,"fig12_patient.png"), type:"png" });
  console.log("saved fig12_patient.png");
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
