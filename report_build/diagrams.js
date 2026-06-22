// Build report diagrams (Figures 1-9) and render to PNG via headless Chrome
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const L = require('./diagram_lib');
const { C, svgOpen, svgClose, lines, roundRect, extEntity, proc, store, erEntity, arrow, elbow, card, title } = L;

const OUT = path.join(__dirname, "assets");
fs.mkdirSync(OUT, { recursive: true });
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

// ---------- helper: labelled box row ----------
function miniBox(x, y, w, h, label, opts = {}) {
  const arr = Array.isArray(label) ? label : [label];
  return roundRect(x, y, w, h, { fill: opts.fill || "#fff", stroke: opts.stroke || C.brand, r: 8 }) +
    lines(x + w / 2, y + h / 2 - (arr.length - 1) * 8 + 5, arr, { size: opts.size || 12.5, color: opts.color || C.text, weight: opts.weight || "bold", lh: 15 });
}

// =================================================================
// FIGURE 1 — Three-tier architecture
// =================================================================
function fig1() {
  const W = 1080, H = 960;
  let s = svgOpen(W, H);
  s += title(W / 2, 40, "Three-Tier Architecture — Hopsontai Clinic Management System");

  // Browser / user
  s += roundRect(440, 64, 200, 44, { fill: "#E9EEF3", stroke: C.extBorder, r: 8 });
  s += lines(540, 91, ["Web Browser (Client device)"], { size: 13, color: C.extText, weight: "bold" });

  // Tier 1 — Presentation
  s += roundRect(60, 140, 960, 180, { fill: C.tierFill, stroke: C.tierBorder, r: 12 });
  s += lines(540, 168, ["PRESENTATION TIER — Client  ·  React 18 + Vite (Single-Page Application)"], { size: 15, color: C.brandDark, weight: "bold" });
  const portals = ["Public\nWebsite", "Patient\nPortal", "Doctor\nPortal", "Staff & Accountant\nPortals", "Admin\nPortal"];
  portals.forEach((p, i) => { s += miniBox(92 + i * 184, 196, 160, 90, p.split("\n"), { fill: C.entFill, size: 13 }); });
  s += lines(540, 305, ["React Router  ·  Axios HTTP client  ·  SweetAlert2  ·  Role-based layouts"], { size: 12, color: C.sub });

  // arrow Tier1 -> Tier2
  s += arrow(540, 330, 540, 392, { sw: 2, double: true, label: ["HTTP / REST  ·  JSON  ·  JWT in Authorization header"], labelColor: C.brandDark });

  // Tier 2 — Application
  s += roundRect(60, 400, 960, 250, { fill: C.tierFill, stroke: C.tierBorder, r: 12 });
  s += lines(540, 428, ["APPLICATION TIER — Server  ·  Node.js + Express (RESTful API)"], { size: 15, color: C.brandDark, weight: "bold" });
  const mods = ["auth", "profiles", "scheduling", "booking", "clinical", "billing", "cms"];
  mods.forEach((m, i) => { s += miniBox(80 + i * 134, 456, 120, 56, [m], { fill: C.procFill, stroke: C.procBorder, size: 13 }); });
  s += roundRect(80, 536, 904, 46, { fill: "#FBEFD8", stroke: C.storeBorder, r: 8 });
  s += lines(540, 564, ["Middleware:  JWT Authentication  ·  Role-Based Access Control (RBAC)  ·  Request Validation"], { size: 12.5, color: C.storeText, weight: "bold" });
  s += lines(540, 612, ["Domain-driven modules — controllers, routes & business logic"], { size: 12, color: C.sub });
  s += lines(540, 634, ["Mongoose ODM (schemas & models)"], { size: 12, color: C.sub });

  // arrow Tier2 -> Tier3
  s += arrow(540, 660, 540, 722, { sw: 2, double: true, label: ["Mongoose ODM  ·  CRUD queries (TCP 27017)"], labelColor: C.brandDark });

  // Tier 3 — Data
  s += roundRect(60, 730, 960, 200, { fill: C.tierFill, stroke: C.tierBorder, r: 12 });
  s += lines(540, 758, ["DATA TIER — MongoDB database (document store)"], { size: 15, color: C.brandDark, weight: "bold" });
  s += store(96, 784, 250, 56, "DB", ["eproject_clinic database"]);
  const cols = ["Role · User", "Patient · Doctor · Staff", "Department · Doctor_Schedule", "Appointment · QuickBooking", "Medical_Record · Prescription", "Medicine", "Invoice · Invoice_Detail", "Post · Contact_Inquiry"];
  cols.forEach((c, i) => {
    const cx = 100 + (i % 4) * 230, cy = 858 + Math.floor(i / 4) * 40;
    s += `<rect x="${cx}" y="${cy}" width="214" height="32" rx="6" fill="#fff" stroke="${C.entBorder}" stroke-width="1.2"/>`;
    s += lines(cx + 107, cy + 21, [c], { size: 11.5, color: C.text, weight: "bold" });
  });
  s += lines(880, 812, ["16 collections"], { size: 12.5, color: C.sub, weight: "bold" });

  s += svgClose();
  return { name: "fig01_architecture.png", svg: s, W, H };
}

// =================================================================
// FIGURE 3 — Context DFD (Level 0)
// =================================================================
function fig3() {
  const W = 1080, H = 860;
  let s = svgOpen(W, H);
  s += title(W / 2, 40, "Context Diagram (DFD Level 0) — Hopsontai Clinic Management System");

  const cx = 540, cy = 430, R = 132;
  // five external entities
  const ents = {
    Patient: [70, 150], Administrator: [445, 70], Staff: [840, 150],
    Doctor: [110, 660], Accountant: [800, 660],
  };
  s += extEntity(ents.Patient[0], ents.Patient[1], 180, 84, ["Patient"]);
  s += extEntity(ents.Administrator[0], ents.Administrator[1], 190, 80, ["Administrator"]);
  s += extEntity(ents.Staff[0], ents.Staff[1], 170, 84, ["Customer-Care", "Staff"]);
  s += extEntity(ents.Doctor[0], ents.Doctor[1], 170, 84, ["Doctor"]);
  s += extEntity(ents.Accountant[0], ents.Accountant[1], 180, 84, ["Accountant"]);

  // central process
  s += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${C.procFill}" stroke="${C.procBorder}" stroke-width="2.4"/>`;
  s += lines(cx, cy - 30, ["0"], { size: 22, color: C.brandDark, weight: "bold" });
  s += lines(cx, cy + 6, ["Hopsontai Clinic", "Management", "System"], { size: 16, color: C.text, weight: "bold", lh: 22 });

  // double arrows entity<->system with labels
  const pairs = [
    [ents.Patient[0] + 180, ents.Patient[1] + 60, cx - R + 18, cy - 70, ["bookings, profile,", "inquiries / records,", "appointments"]],
    [ents.Administrator[0] + 95, ents.Administrator[1] + 80, cx, cy - R - 2, ["management commands /", "dashboards, statistics"]],
    [ents.Staff[0], ents.Staff[1] + 60, cx + R - 18, cy - 70, ["confirmations,", "inquiry handling /", "appointment queue"]],
    [ents.Doctor[0] + 150, ents.Doctor[1], cx - R + 26, cy + 64, ["records, prescriptions /", "schedule, patient list"]],
    [ents.Accountant[0] + 20, ents.Accountant[1], cx + R - 26, cy + 64, ["invoices, payments /", "invoice list, revenue"]],
  ];
  pairs.forEach(([x1, y1, x2, y2, lab]) => {
    s += arrow(x1, y1, x2, y2, { double: true, sw: 1.6, label: lab, labelColor: C.sub });
  });

  s += svgClose();
  return { name: "fig03_context.png", svg: s, W, H };
}

// =================================================================
// Generic DFD Level-1 builder
// spec: { titleTxt, W, H, entities:[{x,y,w,h,lines}], procs:[{x,y,w,h,id,lines}],
//         stores:[{x,y,w,h,id,name}], flows:[{from:[x,y],to:[x,y],label,dashed,double}] }
// =================================================================
function buildDFD(spec) {
  let s = svgOpen(spec.W, spec.H);
  s += title(spec.W / 2, 38, spec.titleTxt);
  (spec.flows || []).forEach(f => {
    s += arrow(f.from[0], f.from[1], f.to[0], f.to[1], { label: f.label, dashed: f.dashed, double: f.double, sw: f.sw || 1.5, labelColor: C.sub, lx: f.lx, ly: f.ly });
  });
  (spec.entities || []).forEach(e => { s += extEntity(e.x, e.y, e.w, e.h, e.lines); });
  (spec.procs || []).forEach(p => { s += proc(p.x, p.y, p.w, p.h, p.id, p.lines); });
  (spec.stores || []).forEach(d => { s += store(d.x, d.y, d.w, d.h, d.id, d.name); });
  s += svgClose();
  return { name: spec.name, svg: s, W: spec.W, H: spec.H };
}

// FIGURE 4 — Authentication & Account
function fig4() {
  return buildDFD({
    name: "fig04_dfd_auth.png", titleTxt: "DFD Level 1 — Authentication & Account", W: 1020, H: 560,
    entities: [{ x: 40, y: 210, w: 180, h: 140, lines: ["User", "(Patient / Staff /", "Doctor / Admin)"] }],
    procs: [
      { x: 420, y: 60, w: 210, h: 80, id: "1.1", lines: ["Register &", "Create Account"] },
      { x: 420, y: 220, w: 210, h: 80, id: "1.2", lines: ["Login &", "Authenticate (JWT)"] },
      { x: 420, y: 380, w: 210, h: 80, id: "1.3", lines: ["Authorize Request", "(RBAC)"] },
    ],
    stores: [
      { x: 800, y: 150, w: 180, h: 56, id: "D1", name: ["User"] },
      { x: 800, y: 360, w: 180, h: 56, id: "D2", name: ["Role"] },
    ],
    flows: [
      { from: [220, 250], to: [418, 110], label: ["registration"] },
      { from: [630, 100], to: [800, 165], label: ["create"] },
      { from: [220, 270], to: [418, 255], label: ["credentials"] },
      { from: [418, 285], to: [220, 305], label: ["JWT token"] },
      { from: [630, 250], to: [800, 185], label: ["verify"], dashed: true },
      { from: [630, 270], to: [800, 380], label: ["read role"], dashed: true },
      { from: [220, 320], to: [418, 415], label: ["request + token"] },
      { from: [630, 420], to: [905, 416], label: ["check role"], dashed: true },
    ],
  });
}

// FIGURE 5 — Appointment & Scheduling
function fig5() {
  return buildDFD({
    name: "fig05_dfd_scheduling.png", titleTxt: "DFD Level 1 — Appointment & Scheduling", W: 1100, H: 880,
    entities: [
      { x: 40, y: 95, w: 180, h: 84, lines: ["Administrator"] },
      { x: 40, y: 350, w: 180, h: 80, lines: ["Patient"] },
      { x: 40, y: 505, w: 180, h: 80, lines: ["Staff / Doctor"] },
      { x: 40, y: 660, w: 180, h: 80, lines: ["Visitor", "(Quick booking)"] },
    ],
    procs: [
      { x: 450, y: 70, w: 210, h: 72, id: "2.1", lines: ["Manage", "Departments"] },
      { x: 450, y: 192, w: 210, h: 72, id: "2.2", lines: ["Manage Doctor", "Schedules"] },
      { x: 450, y: 350, w: 210, h: 78, id: "2.3", lines: ["Book", "Appointment"] },
      { x: 450, y: 500, w: 210, h: 78, id: "2.4", lines: ["Confirm / Update", "Appointment"] },
      { x: 450, y: 655, w: 210, h: 78, id: "2.5", lines: ["Quick-Booking", "Request"] },
    ],
    stores: [
      { x: 850, y: 84, w: 210, h: 52, id: "D3", name: ["Department"] },
      { x: 850, y: 205, w: 210, h: 52, id: "D4", name: ["Doctor_Schedule"] },
      { x: 850, y: 380, w: 210, h: 52, id: "D5", name: ["Appointment"] },
      { x: 850, y: 665, w: 210, h: 52, id: "D6", name: ["QuickBooking"] },
    ],
    flows: [
      { from: [220, 120], to: [448, 100], label: ["dept data"] },
      { from: [220, 150], to: [448, 222], label: ["schedule data"] },
      { from: [660, 100], to: [850, 108], label: ["save"], dashed: true },
      { from: [660, 222], to: [850, 230], label: ["save"], dashed: true },
      { from: [220, 385], to: [448, 380], label: ["booking request"] },
      { from: [660, 372], to: [850, 392], label: ["create"] },
      { from: [662, 400], to: [852, 252], label: ["read slot"], dashed: true, lx: 770, ly: 360 },
      { from: [220, 540], to: [448, 530], label: ["confirm / cancel"] },
      { from: [660, 520], to: [850, 404], label: ["update status"], dashed: true, lx: 775, ly: 470 },
      { from: [660, 552], to: [852, 258], label: ["update capacity"], dashed: true, lx: 800, ly: 430 },
      { from: [220, 695], to: [448, 690], label: ["name & phone"] },
      { from: [660, 690], to: [850, 690], label: ["store request"] },
    ],
  });
}

// FIGURE 6 — Clinical Examination & Prescription
function fig6() {
  return buildDFD({
    name: "fig06_dfd_clinical.png", titleTxt: "DFD Level 1 — Clinical Examination & Prescription", W: 1040, H: 600,
    entities: [
      { x: 40, y: 110, w: 170, h: 80, lines: ["Doctor"] },
      { x: 40, y: 400, w: 170, h: 80, lines: ["Patient"] },
    ],
    procs: [
      { x: 400, y: 90, w: 210, h: 80, id: "3.1", lines: ["Record Medical", "Examination"] },
      { x: 400, y: 250, w: 210, h: 80, id: "3.2", lines: ["Issue", "Prescription"] },
      { x: 400, y: 410, w: 210, h: 80, id: "3.3", lines: ["Deduct Medicine", "Stock"] },
    ],
    stores: [
      { x: 780, y: 90, w: 210, h: 54, id: "D7", name: ["Medical_Record"] },
      { x: 780, y: 250, w: 210, h: 54, id: "D8", name: ["Prescription"] },
      { x: 780, y: 410, w: 210, h: 54, id: "D9", name: ["Medicine"] },
    ],
    flows: [
      { from: [210, 140], to: [398, 120], label: ["vital signs,", "diagnosis"] },
      { from: [610, 120], to: [780, 112], label: ["save record"] },
      { from: [210, 165], to: [398, 285], label: ["prescribe", "medicines"] },
      { from: [610, 285], to: [780, 272], label: ["save lines"] },
      { from: [505, 330], to: [505, 408], label: ["dispensed qty"] },
      { from: [610, 450], to: [780, 440], label: ["update stock"], dashed: true },
      { from: [780, 432], to: [612, 305], label: ["med catalog"], dashed: true, lx: 700, ly: 360 },
      { from: [400, 450], to: [212, 445], label: ["history /", "prescriptions"] },
    ],
  });
}

// FIGURE 7 — Billing & Payment
function fig7() {
  return buildDFD({
    name: "fig07_dfd_billing.png", titleTxt: "DFD Level 1 — Billing & Payment", W: 1040, H: 600,
    entities: [
      { x: 40, y: 110, w: 170, h: 80, lines: ["Accountant"] },
      { x: 40, y: 410, w: 170, h: 80, lines: ["Patient"] },
    ],
    procs: [
      { x: 400, y: 90, w: 210, h: 80, id: "4.1", lines: ["Generate", "Invoice"] },
      { x: 400, y: 250, w: 210, h: 80, id: "4.2", lines: ["Record Invoice", "Details"] },
      { x: 400, y: 410, w: 210, h: 80, id: "4.3", lines: ["Process", "Payment"] },
    ],
    stores: [
      { x: 780, y: 90, w: 210, h: 54, id: "D10", name: ["Invoice"] },
      { x: 780, y: 250, w: 210, h: 54, id: "D11", name: ["Invoice_Detail"] },
      { x: 780, y: 410, w: 210, h: 54, id: "D9", name: ["Medicine"] },
    ],
    flows: [
      { from: [210, 130], to: [398, 120], label: ["create invoice"] },
      { from: [610, 118], to: [780, 112], label: ["save"] },
      { from: [505, 170], to: [505, 248], label: ["itemize"] },
      { from: [610, 290], to: [780, 275], label: ["save details"] },
      { from: [780, 420], to: [612, 310], label: ["unit price"], dashed: true, lx: 690, ly: 392 },
      { from: [210, 435], to: [398, 435], label: ["payment"], lx: 300, ly: 420 },
      { from: [398, 470], to: [212, 470], label: ["invoice & status"], lx: 305, ly: 488 },
      { from: [612, 428], to: [782, 138], label: ["set Paid"], dashed: true, lx: 722, ly: 248 },
    ],
  });
}

// FIGURE 8 — CMS & Contact
function fig8() {
  return buildDFD({
    name: "fig08_dfd_cms.png", titleTxt: "DFD Level 1 — CMS & Contact", W: 1040, H: 600,
    entities: [
      { x: 40, y: 90, w: 170, h: 80, lines: ["Administrator"] },
      { x: 40, y: 250, w: 170, h: 80, lines: ["Website Visitor", "/ Patient"] },
      { x: 40, y: 430, w: 170, h: 80, lines: ["Staff"] },
    ],
    procs: [
      { x: 420, y: 90, w: 210, h: 80, id: "5.1", lines: ["Manage Blog", "Posts (CMS)"] },
      { x: 420, y: 260, w: 210, h: 80, id: "5.2", lines: ["Submit Contact", "Inquiry"] },
      { x: 420, y: 430, w: 210, h: 80, id: "5.3", lines: ["Handle / Resolve", "Inquiry"] },
    ],
    stores: [
      { x: 790, y: 110, w: 200, h: 54, id: "D12", name: ["Post"] },
      { x: 790, y: 360, w: 200, h: 54, id: "D13", name: ["Contact_Inquiry"] },
    ],
    flows: [
      { from: [210, 130], to: [418, 125], label: ["create / edit /", "publish"] },
      { from: [630, 125], to: [790, 132], label: ["save post"] },
      { from: [790, 150], to: [212, 290], label: ["published articles"], dashed: true, ly: 210 },
      { from: [210, 290], to: [418, 295], label: ["name, message"] },
      { from: [630, 300], to: [790, 375], label: ["store"] },
      { from: [210, 470], to: [418, 465], label: ["review"] },
      { from: [630, 465], to: [800, 405], label: ["mark resolved"], dashed: true },
    ],
  });
}

// FIGURE 9 — Administration & Reporting
function fig9() {
  return buildDFD({
    name: "fig09_dfd_admin.png", titleTxt: "DFD Level 1 — Administration & Reporting", W: 1040, H: 600,
    entities: [{ x: 40, y: 250, w: 180, h: 100, lines: ["Administrator"] }],
    procs: [
      { x: 430, y: 70, w: 220, h: 80, id: "6.1", lines: ["Manage Users &", "Catalogs"] },
      { x: 430, y: 250, w: 220, h: 80, id: "6.2", lines: ["Generate Reports", "& Analytics"] },
      { x: 430, y: 430, w: 220, h: 80, id: "6.3", lines: ["AI Assistant", "(Clinic queries)"] },
    ],
    stores: [
      { x: 790, y: 110, w: 210, h: 56, id: "D1-13", name: ["User · Doctor · Staff", "Department · Medicine"] },
      { x: 790, y: 250, w: 210, h: 56, id: "D*", name: ["All collections", "(aggregated)"] },
      { x: 790, y: 430, w: 210, h: 56, id: "D*", name: ["Clinic data context"] },
    ],
    flows: [
      { from: [220, 278], to: [428, 110], label: ["manage commands"] },
      { from: [650, 110], to: [790, 135], label: ["CRUD"], dashed: true },
      { from: [220, 296], to: [428, 276], label: ["request report"], lx: 330, ly: 268 },
      { from: [790, 285], to: [652, 290], label: ["read data"], dashed: true },
      { from: [428, 312], to: [222, 322], label: ["dashboards, statistics"], lx: 332, ly: 348 },
      { from: [232, 332], to: [428, 462], label: ["natural-language query"], lx: 322, ly: 398 },
      { from: [790, 458], to: [652, 470], label: ["context"], dashed: true },
      { from: [428, 492], to: [228, 344], label: ["AI answer"], lx: 330, ly: 452 },
    ],
  });
}

// =================================================================
// FIGURE 2 — ER / Relational model
// =================================================================
function fig2() {
  const W = 1500, H = 1120;
  let s = svgOpen(W, H);
  s += title(W / 2, 36, "Relational / ER Model — Hopsontai Clinic Management System (16 collections)");

  const E = {};
  E.Role = erEntity(40, 70, 200, "Role", [{ key: "PK", name: "_id" }, { name: "roleName" }, { name: "description" }]);
  E.User = erEntity(330, 150, 210, "User", [{ key: "PK", name: "_id" }, { name: "username" }, { name: "passwordHash" }, { key: "FK", name: "roleId" }, { name: "email · phone" }]);
  E.Staff = erEntity(640, 60, 210, "Staff", [{ key: "PK", name: "_id" }, { key: "FK", name: "userId" }, { name: "fullName" }, { name: "position" }]);
  E.Doctor = erEntity(640, 250, 210, "Doctor", [{ key: "PK", name: "_id" }, { key: "FK", name: "userId" }, { name: "fullName" }, { key: "FK", name: "departmentId" }, { name: "baseFee" }]);
  E.Patient = erEntity(40, 300, 210, "Patient", [{ key: "PK", name: "_id" }, { key: "FK", name: "userId" }, { name: "fullName" }, { name: "identityCard" }, { name: "insuranceCode" }]);
  E.Department = erEntity(950, 250, 210, "Department", [{ key: "PK", name: "_id" }, { name: "departmentName" }, { name: "description" }]);
  E.Doctor_Schedule = erEntity(950, 430, 220, "Doctor_Schedule", [{ key: "PK", name: "_id" }, { key: "FK", name: "doctorId" }, { name: "workDate" }, { name: "startTime · endTime" }, { name: "maxPatients" }]);
  E.Appointment = erEntity(330, 430, 230, "Appointment", [{ key: "PK", name: "_id" }, { key: "FK", name: "patientId" }, { key: "FK", name: "doctorId" }, { key: "FK", name: "departmentId" }, { key: "FK", name: "scheduleId" }, { name: "status" }]);
  E.Medical_Record = erEntity(640, 520, 220, "Medical_Record", [{ key: "PK", name: "_id" }, { key: "FK", name: "appointmentId" }, { key: "FK", name: "patientId" }, { key: "FK", name: "doctorId" }, { name: "diagnosis" }]);
  E.Medicine = erEntity(1240, 660, 210, "Medicine", [{ key: "PK", name: "_id" }, { name: "medicineCode" }, { name: "medicineName" }, { name: "unitPrice" }, { name: "stockQuantity" }]);
  E.Prescription = erEntity(640, 760, 220, "Prescription", [{ key: "PK", name: "_id" }, { key: "FK", name: "recordId" }, { key: "FK", name: "medicineId" }, { name: "dosage · frequency" }]);
  E.Invoice = erEntity(330, 720, 220, "Invoice", [{ key: "PK", name: "_id" }, { key: "FK", name: "appointmentId" }, { key: "FK", name: "patientId" }, { name: "invoiceType" }, { name: "totalAmount · status" }]);
  E.Invoice_Detail = erEntity(330, 930, 230, "Invoice_Detail", [{ key: "PK", name: "_id" }, { key: "FK", name: "invoiceId" }, { key: "FK", name: "medicineId" }, { name: "quantity · subTotal" }]);
  E.Contact_Inquiry = erEntity(950, 60, 220, "Contact_Inquiry", [{ key: "PK", name: "_id" }, { name: "senderName · phone" }, { name: "message" }, { key: "FK", name: "handledBy" }]);
  E.QuickBooking = erEntity(40, 600, 210, "QuickBooking", [{ key: "PK", name: "_id" }, { name: "name · phone" }, { name: "department · doctor" }, { name: "bookingDate" }]);
  E.Post = erEntity(40, 800, 210, "Post", [{ key: "PK", name: "_id" }, { name: "title · slug" }, { name: "content" }, { name: "status" }]);

  // connector helper: draw line between two entity boxes with cardinality
  function rel(a, b, c1, c2, opts = {}) {
    const A = E[a], B = E[b];
    // pick connection points (centers of nearest edges) - simple center-to-center clipped to box edge
    const ax = A.x + A.w / 2, ay = A.y + A.h / 2;
    const bx = B.x + B.w / 2, by = B.y + B.h / 2;
    const p1 = clip(A, bx, by), p2 = clip(B, ax, ay);
    let line = `<line x1="${p1[0]}" y1="${p1[1]}" x2="${p2[0]}" y2="${p2[1]}" stroke="${C.line}" stroke-width="1.4"/>`;
    // cardinality labels near endpoints
    const lab1 = lcard(p1, [bx, by], c1);
    const lab2 = lcard(p2, [ax, ay], c2);
    return line + lab1 + lab2;
  }
  function clip(box, tx, ty) {
    const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
    const dx = tx - cx, dy = ty - cy;
    const hw = box.w / 2, hh = box.h / 2;
    const sx = dx === 0 ? Infinity : hw / Math.abs(dx);
    const sy = dy === 0 ? Infinity : hh / Math.abs(dy);
    const t = Math.min(sx, sy);
    return [cx + dx * t, cy + dy * t];
  }
  function lcard(p, toward, txt) {
    const dx = toward[0] - p[0], dy = toward[1] - p[1];
    const len = Math.hypot(dx, dy) || 1;
    const ox = p[0] + (dx / len) * 16, oy = p[1] + (dy / len) * 16 + 4;
    return card(ox, oy, txt);
  }

  // draw relationships first (under boxes)
  let rels = "";
  rels += rel("User", "Role", "N", "1");
  rels += rel("Patient", "User", "1", "1");
  rels += rel("Doctor", "User", "1", "1");
  rels += rel("Staff", "User", "1", "1");
  rels += rel("Doctor", "Department", "N", "1");
  rels += rel("Doctor_Schedule", "Doctor", "N", "1");
  rels += rel("Appointment", "Patient", "N", "1");
  rels += rel("Appointment", "Doctor", "N", "1");
  rels += rel("Appointment", "Doctor_Schedule", "N", "1");
  rels += rel("Medical_Record", "Appointment", "1", "1");
  rels += rel("Prescription", "Medical_Record", "N", "1");
  rels += rel("Prescription", "Medicine", "N", "1");
  rels += rel("Invoice", "Appointment", "N", "1");
  rels += rel("Invoice", "Patient", "N", "1");
  rels += rel("Invoice_Detail", "Invoice", "N", "1");
  rels += rel("Invoice_Detail", "Medicine", "N", "1");
  rels += rel("Contact_Inquiry", "Staff", "N", "1");

  s += rels;
  Object.values(E).forEach(e => { s += e.svg; });

  // legend
  s += `<rect x="1180" y="930" width="280" height="150" rx="8" fill="#F7FBFD" stroke="${C.tierBorder}"/>`;
  s += lines(1320, 956, ["Legend"], { size: 14, color: C.brandDark, weight: "bold" });
  s += `<text x="1196" y="984" font-size="12.5" fill="${C.text}"><tspan font-weight="bold" fill="${C.brandDark}">PK</tspan>  Primary key (_id)</text>`;
  s += `<text x="1196" y="1008" font-size="12.5" fill="${C.text}"><tspan font-weight="bold" fill="${C.brandDark}">FK</tspan>  Foreign-key reference</text>`;
  s += `<text x="1196" y="1032" font-size="12.5" fill="${C.text}"><tspan font-weight="bold" fill="${C.brandDark}">1 : N</tspan>  one-to-many relationship</text>`;
  s += `<text x="1196" y="1056" font-size="12.5" fill="${C.text}">Lines connect FK &#8594; referenced PK</text>`;

  s += svgClose();
  return { name: "fig02_er.png", svg: s, W, H };
}

// =================================================================
// RENDER ALL
// =================================================================
async function render(items) {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--force-device-scale-factor=2"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1200, deviceScaleFactor: 2 });
  for (const it of items) {
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0}body{background:#fff}</style></head><body>${it.svg}</body></html>`;
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    await new Promise(r => setTimeout(r, 250));
    const el = await page.$("svg");
    await el.screenshot({ path: path.join(OUT, it.name), type: "png" });
    console.log("rendered", it.name);
  }
  await browser.close();
}

(async () => {
  const items = [fig1(), fig2(), fig3(), fig4(), fig5(), fig6(), fig7(), fig8(), fig9()];
  await render(items);
  console.log("ALL DIAGRAMS DONE");
})().catch(e => { console.error(e); process.exit(1); });
