// Report generator for Hopsontai Clinic Management System
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, LevelFormat, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak, Header, Footer,
  TableOfContents, TabStopType, TabStopPosition, ImageRun
} = require('docx');

const ASSETS = path.join(__dirname, "assets");

// ---------- Constants ----------
const CONTENT_W = 9360;            // US Letter, 1" margins
const BRAND = "2E6B8F";            // teal-blue brand
const BRAND_DARK = "1B4965";
const HEAD_FILL = "D5E8F0";        // table header fill
const ZEBRA = "F2F8FB";
const PROJECT_TITLE = "HOPSONTAI CLINIC MANAGEMENT SYSTEM";
const RUNNING = "Project Semester 2 – Hopsontai Clinic Management System";

// ---------- helpers ----------
const border = { style: BorderStyle.SINGLE, size: 1, color: "BBBBBB" };
const cellBorders = { top: border, bottom: border, left: border, right: border };

function P(text, opts = {}) {
  const runs = Array.isArray(text)
    ? text
    : [new TextRun({ text: text || "", bold: opts.bold, italics: opts.italics, color: opts.color, size: opts.size })];
  return new Paragraph({
    children: runs,
    alignment: opts.align,
    spacing: { after: opts.after != null ? opts.after : 120, before: opts.before || 0, line: opts.line || 276 },
    indent: opts.indent,
    pageBreakBefore: opts.pageBreakBefore || false,
  });
}

function H1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text })],
    pageBreakBefore: true,
  });
}
function H2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text })] });
}
function H3(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text })] });
}

// Centered front-matter heading (not page-breaking, no TOC numbering style needed but we want it in TOC)
function FrontH(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text })],
    pageBreakBefore: true,
  });
}

function bullet(text, level = 0) {
  const runs = Array.isArray(text) ? text : [new TextRun({ text })];
  return new Paragraph({ numbering: { reference: "bullets", level }, children: runs, spacing: { after: 60, line: 276 } });
}
function numItem(text, ref = "nums") {
  const runs = Array.isArray(text) ? text : [new TextRun({ text })];
  return new Paragraph({ numbering: { reference: ref, level: 0 }, children: runs, spacing: { after: 60, line: 276 } });
}

// Placeholder box for figures / screenshots
function figurePlaceholder(caption) {
  const box = new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [CONTENT_W],
    rows: [new TableRow({
      children: [new TableCell({
        borders: {
          top: { style: BorderStyle.DASHED, size: 1, color: "9AB8CC" },
          bottom: { style: BorderStyle.DASHED, size: 1, color: "9AB8CC" },
          left: { style: BorderStyle.DASHED, size: 1, color: "9AB8CC" },
          right: { style: BorderStyle.DASHED, size: 1, color: "9AB8CC" },
        },
        width: { size: CONTENT_W, type: WidthType.DXA },
        shading: { fill: "F7FBFD", type: ShadingType.CLEAR },
        margins: { top: 360, bottom: 360, left: 120, right: 120 },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "[ Insert screenshot / diagram here ]", italics: true, color: "7B98AB" })],
        })],
      })],
    })],
  });
  return [box, caption];
}

// Read PNG pixel dimensions from the IHDR chunk
function pngSize(file) {
  const b = fs.readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

// Embed an image (scaled to fit the page) followed by its caption.
// Falls back to a placeholder box if the asset file is missing.
function figureImage(fileName, caption, opts = {}) {
  const file = path.join(ASSETS, fileName);
  if (!fs.existsSync(file)) return figurePlaceholder(caption);
  const maxW = opts.maxW || 600;   // px (96 px = 1 inch); page text width = 6.5"
  const maxH = opts.maxH || 720;   // keep image + caption on one page
  const { w, h } = pngSize(file);
  let dw = maxW, dh = Math.round((maxW * h) / w);
  if (dh > maxH) { dh = maxH; dw = Math.round((maxH * w) / h); }
  const img = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 80, after: 40 },
    children: [new ImageRun({
      type: "png",
      data: fs.readFileSync(file),
      transformation: { width: dw, height: dh },
      altText: { title: opts.title || fileName, description: opts.desc || fileName, name: opts.title || fileName },
    })],
  });
  return [img, caption];
}

function figCaption(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 80, after: 200 },
    children: [new TextRun({ text, italics: true, bold: true, size: 19, color: "555555" })],
  });
}
function tblCaption(text) {
  return new Paragraph({
    spacing: { before: 160, after: 80 },
    children: [new TextRun({ text, bold: true, size: 20, color: BRAND_DARK })],
  });
}

// ---------- Data-structure table builder ----------
// columns: Field name | Data Type | Null | Key | Describe | Notes
const DS_COLS = [2050, 1150, 760, 760, 2520, 2120]; // sums to 9360
function dsHeaderCell(t) {
  return new TableCell({
    borders: cellBorders,
    width: { size: 0, type: WidthType.DXA },
    shading: { fill: HEAD_FILL, type: ShadingType.CLEAR },
    margins: { top: 60, bottom: 60, left: 90, right: 90 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 18, color: BRAND_DARK })] })],
  });
}
function dsCell(t, w, idx, zebra) {
  return new TableCell({
    borders: cellBorders,
    width: { size: w, type: WidthType.DXA },
    shading: { fill: zebra ? ZEBRA : "FFFFFF", type: ShadingType.CLEAR },
    margins: { top: 50, bottom: 50, left: 90, right: 90 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ children: [new TextRun({ text: t == null ? "" : String(t), size: 18, bold: idx === 0 })] })],
  });
}
function dataStructureTable(rows) {
  const headers = ["Field name", "Data Type", "Null", "Key", "Describe", "Notes"];
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => {
      const c = dsHeaderCell(h);
      c.options.width = { size: DS_COLS[i], type: WidthType.DXA };
      return c;
    }),
  });
  const bodyRows = rows.map((r, ri) =>
    new TableRow({ children: r.map((val, ci) => dsCell(val, DS_COLS[ci], ci, ri % 2 === 1)) })
  );
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: DS_COLS,
    rows: [headerRow, ...bodyRows],
  });
}

// Generic table (for task sheets, relationships)
function genTable(colWidths, headerCells, dataRows) {
  const hr = new TableRow({
    tableHeader: true,
    children: headerCells.map((h, i) => new TableCell({
      borders: cellBorders,
      width: { size: colWidths[i], type: WidthType.DXA },
      shading: { fill: HEAD_FILL, type: ShadingType.CLEAR },
      margins: { top: 60, bottom: 60, left: 90, right: 90 },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 18, color: BRAND_DARK })] })],
    })),
  });
  const rows = dataRows.map((r, ri) => new TableRow({
    children: r.map((val, ci) => new TableCell({
      borders: cellBorders,
      width: { size: colWidths[ci], type: WidthType.DXA },
      shading: { fill: ri % 2 === 1 ? ZEBRA : "FFFFFF", type: ShadingType.CLEAR },
      margins: { top: 50, bottom: 50, left: 90, right: 90 },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({ children: [new TextRun({ text: val == null ? "" : String(val), size: 18 })] })],
    })),
  }));
  return new Table({ width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: colWidths, rows: [hr, ...rows] });
}

// ============================================================
//  DOCUMENT CONTENT
// ============================================================
const children = [];

// ---------- COVER PAGE ----------
function coverLine(text, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: opts.after != null ? opts.after : 60 },
    children: [new TextRun({ text, bold: opts.bold, size: opts.size || 22, color: opts.color, italics: opts.italics })],
  });
}
children.push(
  coverLine("FPT INTERNATIONAL TRAINING INSTITUTE", { bold: true, size: 26, color: BRAND_DARK, after: 40 }),
  coverLine("FPT – APTECH COMPUTER EDUCATION", { bold: true, size: 24, color: BRAND, after: 40 }),
  coverLine("Center name: ACE-HCMC-2-FPT", { size: 20, after: 20 }),
  coverLine("Address: 21bis Hau Giang, Tan Binh District, Ho Chi Minh City", { size: 20, after: 320 }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: BRAND, space: 6 } }, children: [new TextRun("")] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 80 },
    children: [new TextRun({ text: "PROJECT REPORT", bold: true, size: 28, color: "888888" })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 320 },
    children: [new TextRun({ text: PROJECT_TITLE, bold: true, size: 48, color: BRAND_DARK })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 360 },
    children: [new TextRun({ text: "A Full-Stack Web Application (React · Node.js · Express · MongoDB)", italics: true, size: 22, color: "666666" })] }),
);

// Cover meta table
const coverMeta = new Table({
  width: { size: 7000, type: WidthType.DXA },
  columnWidths: [2600, 4400],
  alignment: AlignmentType.CENTER,
  rows: [
    ["Supervisor:", "Mrs. Pham Thi Lanh"],
    ["Term:", "2"],
    ["Batch No:", "T3.2502_E0"],
    ["Group No:", "[ Group Number ]"],
  ].map((r, i) => new TableRow({ children: r.map((v, c) => new TableCell({
    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
    width: { size: c === 0 ? 2600 : 4400, type: WidthType.DXA },
    margins: { top: 40, bottom: 40, left: 120, right: 120 },
    children: [new Paragraph({ alignment: c === 0 ? AlignmentType.RIGHT : AlignmentType.LEFT,
      children: [new TextRun({ text: v, bold: c === 0, size: 22 })] })],
  })) })),
});
children.push(coverMeta);

// Members table
children.push(new Paragraph({ spacing: { before: 280, after: 80 }, alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: "Team Members", bold: true, size: 22, color: BRAND_DARK })] }));
const memberRows = [
  ["1", "[ Full Name 1 ]", "[ Roll No. ]"],
  ["2", "[ Full Name 2 ]", "[ Roll No. ]"],
  ["3", "[ Full Name 3 ]", "[ Roll No. ]"],
];
const membersTable = new Table({
  width: { size: 6400, type: WidthType.DXA },
  columnWidths: [900, 3500, 2000],
  alignment: AlignmentType.CENTER,
  rows: [
    new TableRow({ tableHeader: true, children: ["Order", "Full Name", "Roll No."].map((h, i) => new TableCell({
      borders: cellBorders, width: { size: [900, 3500, 2000][i], type: WidthType.DXA },
      shading: { fill: HEAD_FILL, type: ShadingType.CLEAR }, margins: { top: 50, bottom: 50, left: 100, right: 100 },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: h, bold: true, size: 20, color: BRAND_DARK })] })],
    })) }),
    ...memberRows.map(r => new TableRow({ children: r.map((v, i) => new TableCell({
      borders: cellBorders, width: { size: [900, 3500, 2000][i], type: WidthType.DXA },
      margins: { top: 50, bottom: 50, left: 100, right: 100 },
      children: [new Paragraph({ alignment: i === 0 ? AlignmentType.CENTER : AlignmentType.LEFT, children: [new TextRun({ text: v, size: 20 })] })],
    })) })),
  ],
});
children.push(membersTable);
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 360 },
  children: [new TextRun({ text: "Month 06  –  Year 2026", bold: true, size: 24, color: BRAND_DARK })] }));

// ---------- ACKNOWLEDGEMENT ----------
children.push(FrontH("ACKNOWLEDGEMENT"));
[
  "We would like to extend our heartfelt appreciation to all those who supported us throughout the development of our Hopsontai Clinic Management System project.",
  "First and foremost, we express our sincere gratitude to our dedicated instructor, Mrs. Pham Thi Lanh. Her insightful guidance, constructive feedback, and constant encouragement not only helped us overcome technical challenges but also gave us the confidence to push through difficult moments. Without her support, this project would not have reached its current level of completeness.",
  "We are also deeply grateful to the FPT – Aptech Computer Education center and its departments for creating favorable learning conditions and for the opportunity to translate our theoretical knowledge into a practical, real-world application. The experience gained from building a full-stack clinic management platform will be invaluable for our future careers in software development.",
  "Finally, we would like to thank our fellow classmates and teammates for their open collaboration and enthusiastic support. Their willingness to share ideas, test features, and work together made this journey both productive and enjoyable.",
  "Building the Hopsontai Clinic Management System has been a true team effort, and we sincerely appreciate everyone who contributed to bringing this project to fruition.",
].forEach(t => children.push(P(t, { after: 160, line: 300 })));

// ---------- SYNOPSIS ----------
children.push(FrontH("SYNOPSIS"));
[
  "The Hopsontai Clinic Management System is a modern, full-stack web application designed to digitize and streamline the day-to-day operations of a general and traditional-medicine clinic. Built on the MERN-style stack (MongoDB, Express, React, and Node.js), the system replaces fragmented, paper-based workflows with a single, role-driven platform accessible from any web browser.",
  "The application serves five distinct user roles – Administrator, Doctor, Customer-Care Staff, Accountant, and Patient – each with a dedicated portal and permissions enforced through JSON Web Token (JWT) authentication and role-based access control (RBAC). Patients can browse specialist departments, read health articles, and book appointments online; doctors manage their schedules, record medical examinations, and issue prescriptions; staff confirm appointments and handle customer inquiries; accountants generate and settle invoices; and administrators oversee the entire system, including users, departments, doctor schedules, medicines, and published content.",
  "Beyond core management features, the platform offers patient-facing value such as a public website with department and specialist listings, a clinical blog (CMS), a quick-booking widget, a contact form, and an AI assistant for the administrator. By centralizing patient records, appointments, prescriptions, and billing into one consistent database, the system improves data accuracy, enhances service quality, and supports better, faster decision-making for clinic management.",
].forEach(t => children.push(P(t, { after: 160, line: 300 })));

// ---------- TABLE OF CONTENTS ----------
children.push(FrontH("TABLE OF CONTENTS"));
children.push(new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3" }));

// ---------- FIGURE CATEGORIES ----------
children.push(FrontH("FIGURE CATEGORIES"));
const figures = [
  "Figure 1: System architecture (three-tier) overview",
  "Figure 2: Relational / ER model of the database",
  "Figure 3: Context DFD (Level 0)",
  "Figure 4: DFD Level 1 – Authentication & Account",
  "Figure 5: DFD Level 1 – Appointment & Scheduling",
  "Figure 6: DFD Level 1 – Clinical Examination & Prescription",
  "Figure 7: DFD Level 1 – Billing & Payment",
  "Figure 8: DFD Level 1 – CMS & Contact",
  "Figure 9: DFD Level 1 – Administration",
  "Figure 10: Public home page",
  "Figure 11: Login screen",
  "Figure 12: Patient dashboard & appointment booking",
  "Figure 13: Doctor schedule & examination screen",
  "Figure 14: Staff customer-care dashboard",
  "Figure 15: Accountant billing dashboard",
  "Figure 16: Administrator dashboard",
];
figures.forEach(f => children.push(new Paragraph({ spacing: { after: 60 },
  tabStops: [{ type: TabStopType.RIGHT, position: 9360, leader: "dot" }],
  children: [new TextRun({ text: f, size: 20 }), new TextRun({ text: "\t" })] })));

// ---------- TABLE CATALOGUE ----------
children.push(FrontH("TABLE CATALOGUE"));
const tableList = [
  "Table 1: Role collection data structure",
  "Table 2: User collection data structure",
  "Table 3: Patient collection data structure",
  "Table 4: Doctor collection data structure",
  "Table 5: Staff collection data structure",
  "Table 6: Department collection data structure",
  "Table 7: Doctor_Schedule collection data structure",
  "Table 8: Appointment collection data structure",
  "Table 9: Medicine collection data structure",
  "Table 10: Medical_Record collection data structure",
  "Table 11: Prescription collection data structure",
  "Table 12: Invoice collection data structure",
  "Table 13: Invoice_Detail collection data structure",
  "Table 14: QuickBooking collection data structure",
  "Table 15: Post collection data structure",
  "Table 16: Contact_Inquiry collection data structure",
];
tableList.forEach(t => children.push(new Paragraph({ spacing: { after: 60 },
  tabStops: [{ type: TabStopType.RIGHT, position: 9360, leader: "dot" }],
  children: [new TextRun({ text: t, size: 20 }), new TextRun({ text: "\t" })] })));

// ============================================================
//  CHAPTER 1 - PROBLEM DEFINITION
// ============================================================
children.push(H1("Chapter 1.  PROBLEM DEFINITION"));
children.push(P("The development of the Hopsontai Clinic Management System is driven by the need to modernize clinic operations and overcome the limitations of manual, paper-based and disconnected management practices. Based on the project context, the core problems addressed are:"));
[
  ["Inefficient manual appointment handling: ", "Booking by phone or walk-in leads to double-booking, long waiting times, and lost records, making it hard to balance doctor workload across departments and time slots."],
  ["Fragmented and unsafe patient data: ", "Without a centralized database, patient profiles, medical histories, prescriptions, and invoices are scattered across paper files or spreadsheets, causing data inconsistency, duplication, and risk of loss."],
  ["Difficult clinical record keeping: ", "Doctors struggle to retrieve a patient’s previous diagnoses, vital signs, and prescribed medicines quickly during an examination, which affects the quality and continuity of care."],
  ["Manual and error-prone billing: ", "Calculating consultation fees and pharmacy charges by hand is slow and prone to mistakes, while tracking which invoices are paid or unpaid becomes increasingly difficult as patient volume grows."],
  ["Lack of real-time oversight and analytics: ", "Clinic managers have no consolidated view of revenue, appointment volume, or department performance, making strategic decisions difficult."],
  ["Limited online presence and patient engagement: ", "Without a public website, patients cannot easily discover specialists, read trustworthy health information, or book appointments online, reducing the clinic’s reach and convenience."],
  ["Inconsistent access control: ", "A single shared system without role separation risks exposing sensitive medical and financial data to unauthorized staff."],
].forEach(([b, t]) => children.push(bullet([new TextRun({ text: b, bold: true }), new TextRun({ text: t })])));
children.push(P("The Hopsontai Clinic Management System solves these problems by providing a centralized, secure, role-based web platform that manages the entire clinic workflow – from online appointment booking to examination, prescription, billing, and reporting – within a single, consistent application.", { before: 100 }));

// ============================================================
//  CHAPTER 2 - CRS
// ============================================================
children.push(H1("Chapter 2.  CUSTOMER’S REQUIREMENTS SPECIFICATIONS (CRS)"));

children.push(H2("2.1  Business / Project Objective"));
children.push(P("The main objective of the Hopsontai Clinic Management System project is to develop a comprehensive and efficient web application that supports the management and operation of a multi-specialty clinic. The application aims to streamline daily clinical and administrative activities, improve data accuracy, and enhance decision-making through effective information management and reporting."));
children.push(P("The specific objectives of the project are as follows:", { bold: true }));

children.push(H3("User & Access Management"));
[ "Manage user accounts for five roles: Administrator, Doctor, Staff, Accountant, and Patient.",
  "Authenticate users securely with hashed passwords (bcrypt) and JSON Web Tokens (JWT).",
  "Enforce role-based access control so each role only accesses its permitted features.",
  "Allow patients to self-register and existing staff/doctors to be provisioned by the administrator." ].forEach(t => children.push(bullet(t)));

children.push(H3("Patient & Profile Management"));
[ "Store and manage patient information including full name, date of birth, gender, identity card (CCCD/CMND), phone number, address, insurance code (BHYT), and emergency contact.",
  "Maintain doctor profiles with specialization, department, qualifications, years of experience, consultation fee, and biography.",
  "Maintain staff profiles for customer-care and accounting personnel." ].forEach(t => children.push(bullet(t)));

children.push(H3("Appointment & Scheduling Management"));
[ "Allow administrators to define departments and create doctor work schedules with date, time blocks, and maximum patient capacity.",
  "Allow patients to book appointments online by selecting a department, doctor, date, and time slot.",
  "Allow staff/doctors to confirm, complete, or cancel appointments, automatically tracking booked capacity per schedule.",
  "Provide a public quick-booking widget for fast appointment requests by name and phone." ].forEach(t => children.push(bullet(t)));

children.push(H3("Clinical Examination & Prescription Management"));
[ "Allow doctors to record medical records with vital signs (height, weight, blood pressure, heart rate, temperature), diagnosis, and clinical notes.",
  "Allow doctors to issue prescriptions linking medicines with dosage, frequency, duration, and special instructions.",
  "Maintain a medicine catalog with code, name, active ingredient, usage route, unit, price, and stock quantity, automatically deducting stock when dispensed." ].forEach(t => children.push(bullet(t)));

children.push(H3("Billing & Payment Management"));
[ "Generate consultation and pharmacy invoices linked to appointments and patients.",
  "Track invoice status (Unpaid, Paid, Refunded) and record the staff member who processed each payment.",
  "Store invoice details for dispensed medicines, including quantity, unit price, and subtotal." ].forEach(t => children.push(bullet(t)));

children.push(H3("Content Management & Communication"));
[ "Publish clinical blog posts (CMS) with title, slug, thumbnail, rich-text content, and publication status.",
  "Receive and manage contact inquiries submitted from the public website.",
  "Provide an AI assistant in the admin dashboard to answer clinic-related queries." ].forEach(t => children.push(bullet(t)));

children.push(H3("Reporting & Analytics"));
[ "Provide an administrator dashboard with statistics on users, appointments, revenue, and department activity.",
  "Expose public statistics (e.g., number of doctors, departments) for the website.",
  "Support data-driven decision-making through consolidated reporting." ].forEach(t => children.push(bullet(t)));

children.push(H3("Input to the System"));
children.push(P("Users need to provide:", { bold: true, after: 60 }));
[ "Account information: username (phone number), password, email, role.",
  "Patient information: full name, date of birth, gender, identity card, phone number, address, insurance code, emergency contact.",
  "Doctor information: full name, specialization, department, qualifications, experience, consultation fee, biography.",
  "Appointment information: patient, department, doctor, requested date/time, symptoms.",
  "Clinical information: vital signs, diagnosis, clinical notes, prescribed medicines.",
  "Medicine information: code, name, active ingredient, usage route, unit, price, stock quantity.",
  "Content information: post title, content, thumbnail, status; contact inquiries." ].forEach(t => children.push(bullet(t)));

children.push(H3("Output from the System"));
[ "Patient portal: profile, upcoming and past appointments, medical history, prescriptions, and invoices.",
  "Doctor portal: daily schedule, patient list, examination forms, and prescription records.",
  "Staff portal: appointment confirmation queue and contact-inquiry management.",
  "Accountant portal: invoice list, payment processing, and revenue figures.",
  "Administrator portal: full management of users, departments, schedules, medicines, posts, and analytics dashboards.",
  "Public website: home page, department and specialist listings, service packages, blog posts, and contact page." ].forEach(t => children.push(bullet(t)));

children.push(H3("List of Deliverables"));
[ "Project Report (Word Document)", "User Guide", "Source Code (Frontend + Backend)", "Database seed script with sample data" ].forEach(t => children.push(bullet(t)));

children.push(H2("2.2  Hardware / Software Requirements"));
children.push(P("Hardware", { bold: true, after: 60 }));
[ "A computer capable of running a modern web browser and Node.js (Intel Core i3 / equivalent or better recommended).",
  "Minimum 4 GB of RAM (8 GB recommended for running the database, backend, and frontend simultaneously).",
  "At least 2 GB of free disk space for the source code, dependencies, and database." ].forEach(t => children.push(bullet(t)));
children.push(P("Software", { bold: true, before: 100, after: 60 }));
[ "Operating System: Windows 10/11, macOS, or Linux.",
  "Runtime: Node.js (v18 or higher) and npm.",
  "Database: MongoDB (local installation or MongoDB Atlas cloud).",
  "Frontend: React 18 with Vite, React Router, Axios, SweetAlert2.",
  "Backend: Express 4, Mongoose 7, jsonwebtoken, bcryptjs, cors, dotenv.",
  "Tools: Visual Studio Code, Git, MongoDB Compass, a modern web browser (Chrome / Edge / Firefox)." ].forEach(t => children.push(bullet(t)));

children.push(H2("2.3  Architecture and Design of the Project"));
children.push(P("The application follows a client-server, three-tier web architecture, separating presentation, application logic, and data storage:"));
[ ["Presentation tier (Client): ", "A Single-Page Application (SPA) built with React and Vite. It renders role-specific layouts (Public, Patient, Doctor, Admin) and communicates with the backend exclusively through RESTful JSON APIs using Axios."],
  ["Application tier (Server): ", "A RESTful API built with Node.js and Express, organized into domain-driven modules (auth, profiles, scheduling, booking, clinical, billing, cms). It handles business logic, authentication (JWT), authorization (RBAC middleware), and validation."],
  ["Data tier (Database): ", "A MongoDB database accessed through Mongoose ODM. Sixteen collections store all clinic data, with references (ObjectId) modeling relationships between entities."],
].forEach(([b, t]) => children.push(bullet([new TextRun({ text: b, bold: true }), new TextRun({ text: t })])));
children.push(...figureImage("fig01_architecture.png", figCaption("Figure 1: System architecture (three-tier) overview"), { title: "Three-tier architecture", maxH: 560 }));
children.push(P("Communication between tiers is stateless: each authenticated request carries a JWT in the Authorization header, which the backend verifies before granting access to protected resources. This design promotes scalability, maintainability, and a clear separation of concerns.", { before: 80 }));

// ============================================================
//  CHAPTER 3 - SCOPE OF THE WORK
// ============================================================
children.push(H1("Chapter 3.  SCOPE OF THE WORK (IN BRIEF)"));
children.push(P("The scope of work for the Hopsontai Clinic Management System project is defined as follows."));

const scope = [
  ["3.1  User Interface & Public Website", "The system provides a responsive, user-friendly interface built with React. The public website includes a home page, department listing, specialist (doctor) listing, service packages, a clinical blog, an about page, and a contact page, allowing visitors to learn about the clinic and book appointments without logging in."],
  ["3.2  Authentication & Role-Based Access", "The system supports secure login and registration. Five roles – Admin, Doctor, Staff, Accountant, and Patient – are authenticated via JWT, with middleware enforcing role-based access to every protected route. An admin impersonation feature supports troubleshooting."],
  ["3.3  Patient & Profile Management", "The system manages patient profiles (identity card, insurance, contact, emergency contact) and professional profiles for doctors and staff. Patients can update their own profiles; administrators manage all accounts."],
  ["3.4  Appointment & Scheduling", "Administrators define departments and doctor schedules (date, time block, capacity). Patients book appointments online; staff and doctors confirm, complete, or cancel them. The system tracks booked capacity to prevent overbooking, and offers a public quick-booking widget."],
  ["3.5  Clinical Examination & Prescriptions", "Doctors record medical examinations (vital signs, diagnosis, clinical notes) tied to each appointment and issue prescriptions from the medicine catalog, with automatic stock deduction. Patients can review their medical history and prescriptions."],
  ["3.6  Billing & Payment", "Accountants generate consultation and pharmacy invoices, process payments, and track invoice status. Invoice details record each dispensed medicine with quantity, unit price, and subtotal."],
  ["3.7  Content Management & Communication", "Administrators publish and manage clinical blog posts (CMS) and review contact inquiries submitted from the website. Staff can also handle inquiries. An AI assistant supports the admin with clinic queries."],
  ["3.8  Reporting, Integration & Extensibility", "The administrator dashboard consolidates statistics on users, appointments, and revenue. The modular backend architecture (domain modules + REST APIs) allows future enhancements such as payment-gateway integration, SMS/email notifications, or a mobile client."],
];
scope.forEach(([h, t]) => { children.push(H2(h)); children.push(P(t)); });

// ============================================================
//  TASK SHEET REVIEW 1
// ============================================================
children.push(H1("TASK SHEET REVIEW 1"));
children.push(P([new TextRun({ text: "Project Title: ", bold: true }), new TextRun("Hopsontai Clinic Management System")], { after: 40 }));
children.push(P([new TextRun({ text: "Date of Preparation of Activity Plan: ", bold: true }), new TextRun("06-Jun-2026")], { after: 160 }));
children.push(genTable([700, 3500, 1100, 1700, 2360],
  ["Sr. No.", "Task", "Actual Days", "Teammate", "Status"],
  [
    ["1", "Acknowledgement & Synopsis", "1", "[ Member 1 ]", "Completed"],
    ["2", "Problem Definition", "1", "[ Member 1 ]", "Completed"],
    ["3", "Customer Requirement Specification (CRS)", "1", "[ Member 2 ]", "Completed"],
    ["4", "Scope of Work", "1", "[ Member 2 ]", "Completed"],
    ["5", "Hardware / Software Requirements", "1", "[ Member 3 ]", "Completed"],
    ["6", "Architecture & Design of the Project", "1", "[ Member 3 ]", "Completed"],
    ["7", "Task Sheet", "1", "[ Member 1 ]", "Completed"],
  ]));
children.push(P("", { after: 200 }));
children.push(new Paragraph({ spacing: { before: 200 },
  tabStops: [{ type: TabStopType.RIGHT, position: 9360 }],
  children: [new TextRun({ text: "Signature of Instructor:", bold: true }), new TextRun({ text: "\tSignature of Team Leader:", bold: true })] }));
children.push(new Paragraph({ spacing: { before: 240 },
  tabStops: [{ type: TabStopType.RIGHT, position: 9360 }],
  children: [new TextRun("Mrs. Pham Thi Lanh"), new TextRun({ text: "\t[ Team Leader Name ]" })] }));

// ============================================================
//  CHAPTER 4 - DATABASE DESIGN
// ============================================================
children.push(H1("Chapter 4.  DATABASE DESIGN"));
children.push(H2("4.1  Relational Model of the Database"));
children.push(P("The Hopsontai Clinic Management System uses a MongoDB (document) database accessed through Mongoose. Although MongoDB is non-relational, the schema is designed in a normalized, relational style: each entity is stored in its own collection and relationships are modeled using ObjectId references. The database consists of sixteen collections, summarized in the relationship overview below."));
children.push(...figureImage("fig02_er.png", figCaption("Figure 2: Relational / ER model of the database"), { title: "ER model", maxW: 640, maxH: 720 }));
children.push(tblCaption("Key relationships between collections"));
children.push(genTable([2600, 1400, 5360],
  ["Relationship", "Type", "Description"],
  [
    ["User → Role", "N : 1", "Each user is assigned exactly one role."],
    ["Patient/Doctor/Staff → User", "1 : 1", "Each profile is linked to one user account."],
    ["Doctor → Department", "N : 1", "Each doctor belongs to one department."],
    ["Doctor_Schedule → Doctor", "N : 1", "A doctor has many work schedules."],
    ["Appointment → Patient / Doctor / Department / Schedule", "N : 1", "An appointment references the patient, doctor, department, and schedule."],
    ["Medical_Record → Appointment / Patient / Doctor", "1 : 1 / N : 1", "One medical record per appointment."],
    ["Prescription → Medical_Record / Medicine", "N : 1", "A record may have many prescription lines."],
    ["Invoice → Appointment / Patient", "N : 1", "Consultation and pharmacy invoices per appointment."],
    ["Invoice_Detail → Invoice / Medicine", "N : 1", "Line items for pharmacy invoices."],
    ["Contact_Inquiry → Staff", "N : 1", "Inquiry handled by a staff member."],
  ]));

children.push(H2("4.2  Data Description of Tables"));
children.push(P("Each collection is described below. The implicit Mongoose timestamp fields (createdAt, updatedAt) and the auto-generated primary key (_id) are included where relevant. “Key” denotes PK (primary key) or FK (foreign-key reference)."));

// helper rows: [field, type, null, key, describe, notes]
const N = "Not null", Y = "Null";

children.push(tblCaption("Table 1: Role collection data structure"));
children.push(dataStructureTable([
  ["_id", "ObjectId", N, "PK", "Role identifier", "Auto-generated"],
  ["roleName", "String", N, "", "Role name", "enum: admin, doctor, staff, accountant, patient · unique"],
  ["description", "String", Y, "", "Role description", ""],
  ["createdAt / updatedAt", "Date", N, "", "Record timestamps", "Auto (timestamps)"],
]));

children.push(tblCaption("Table 2: User collection data structure"));
children.push(dataStructureTable([
  ["_id", "ObjectId", N, "PK", "User identifier", "Auto-generated"],
  ["username", "String", N, "", "Login username", "Phone number · unique"],
  ["passwordHash", "String", N, "", "Hashed password", "bcrypt (auto-hashed)"],
  ["roleId", "ObjectId", N, "FK", "Role reference", "→ Role"],
  ["email", "String", Y, "", "Email address", "unique (sparse)"],
  ["phone", "String", Y, "", "Phone number", "unique (sparse)"],
  ["isActive", "Boolean", Y, "", "Account active", "default: true"],
  ["isRegistered", "Boolean", Y, "", "Self-registered flag", "default: false"],
  ["lastLoginAt", "Date", Y, "", "Last login time", ""],
  ["createdAt / updatedAt", "Date", N, "", "Record timestamps", "Auto"],
]));

children.push(tblCaption("Table 3: Patient collection data structure"));
children.push(dataStructureTable([
  ["_id", "ObjectId", N, "PK", "Patient identifier", "Auto-generated"],
  ["userId", "ObjectId", N, "FK", "User reference", "→ User · unique"],
  ["fullName", "String", N, "", "Patient full name", ""],
  ["avatarURL", "String", Y, "", "Profile photo URL", ""],
  ["dateOfBirth", "Date", N, "", "Date of birth", ""],
  ["gender", "String", N, "", "Gender", "enum: Nam, Nữ, Khác"],
  ["identityCard", "String", N, "", "Citizen ID (CCCD/CMND)", "unique"],
  ["phoneNumber", "String", N, "", "Phone number", "unique"],
  ["address", "String", Y, "", "Home address", ""],
  ["insuranceCode", "String", Y, "", "Health insurance code (BHYT)", "unique (sparse)"],
  ["emergencyContact", "String", Y, "", "Emergency contact", ""],
  ["createdAt / updatedAt", "Date", N, "", "Record timestamps", "Auto"],
]));

children.push(tblCaption("Table 4: Doctor collection data structure"));
children.push(dataStructureTable([
  ["_id", "ObjectId", N, "PK", "Doctor identifier", "Auto-generated"],
  ["userId", "ObjectId", N, "FK", "User reference", "→ User · unique"],
  ["fullName", "String", N, "", "Doctor full name", ""],
  ["avatarURL", "String", Y, "", "Profile photo URL", ""],
  ["specialization", "String", N, "", "Specialization", ""],
  ["departmentId", "ObjectId", N, "FK", "Department reference", "→ Department"],
  ["qualifications", "String", Y, "", "Degrees / qualifications", ""],
  ["experienceYears", "Number", Y, "", "Years of experience", "default: 0"],
  ["baseFee", "Number", Y, "", "Consultation fee", ""],
  ["bio", "String", Y, "", "Biography", ""],
  ["isActive", "Boolean", Y, "", "Active status", "default: true"],
  ["createdAt / updatedAt", "Date", N, "", "Record timestamps", "Auto"],
]));

children.push(tblCaption("Table 5: Staff collection data structure"));
children.push(dataStructureTable([
  ["_id", "ObjectId", N, "PK", "Staff identifier", "Auto-generated"],
  ["userId", "ObjectId", N, "FK", "User reference", "→ User · unique"],
  ["fullName", "String", N, "", "Staff full name", ""],
  ["avatarURL", "String", Y, "", "Profile photo URL", ""],
  ["phoneNumber", "String", Y, "", "Phone number", ""],
  ["position", "String", Y, "", "Job position", "e.g. Customer Care, Accountant"],
  ["createdAt / updatedAt", "Date", N, "", "Record timestamps", "Auto"],
]));

children.push(tblCaption("Table 6: Department collection data structure"));
children.push(dataStructureTable([
  ["_id", "ObjectId", N, "PK", "Department identifier", "Auto-generated"],
  ["departmentName", "String", N, "", "Department / specialty name", "unique"],
  ["description", "String", Y, "", "Department description", ""],
  ["createdAt / updatedAt", "Date", N, "", "Record timestamps", "Auto"],
]));

children.push(tblCaption("Table 7: Doctor_Schedule collection data structure"));
children.push(dataStructureTable([
  ["_id", "ObjectId", N, "PK", "Schedule identifier", "Auto-generated"],
  ["doctorId", "ObjectId", N, "FK", "Doctor reference", "→ Doctor"],
  ["workDate", "Date", N, "", "Working date", ""],
  ["startTime", "String", N, "", "Start time", "Format HH:mm (e.g. 08:00)"],
  ["endTime", "String", N, "", "End time", "Format HH:mm (e.g. 12:00)"],
  ["maxPatients", "Number", N, "", "Maximum patients", ""],
  ["currentBooked", "Number", Y, "", "Currently booked count", "default: 0"],
  ["status", "String", Y, "", "Schedule status", "enum: Available, Full, Canceled"],
  ["createdAt / updatedAt", "Date", N, "", "Record timestamps", "Auto"],
]));

children.push(tblCaption("Table 8: Appointment collection data structure"));
children.push(dataStructureTable([
  ["_id", "ObjectId", N, "PK", "Appointment identifier", "Auto-generated"],
  ["patientId", "ObjectId", N, "FK", "Patient reference", "→ Patient"],
  ["requestedDate", "Date", N, "", "Requested date", ""],
  ["requestedTime", "String", Y, "", "Requested time", ""],
  ["symptoms", "String", Y, "", "Reason / symptoms", ""],
  ["departmentId", "ObjectId", Y, "FK", "Department reference", "→ Department"],
  ["doctorId", "ObjectId", Y, "FK", "Doctor reference", "→ Doctor"],
  ["scheduleId", "ObjectId", Y, "FK", "Schedule reference", "→ Doctor_Schedule"],
  ["status", "String", Y, "", "Appointment status", "enum: Pending, Confirmed, Completed, Canceled"],
  ["confirmedBy", "ObjectId", Y, "FK", "Confirming user", "→ User"],
  ["createdAt / updatedAt", "Date", N, "", "Record timestamps", "Auto"],
]));

children.push(tblCaption("Table 9: Medicine collection data structure"));
children.push(dataStructureTable([
  ["_id", "ObjectId", N, "PK", "Medicine identifier", "Auto-generated"],
  ["medicineCode", "String", N, "", "Medicine code", "unique"],
  ["medicineName", "String", N, "", "Medicine name", ""],
  ["activeIngredient", "String", Y, "", "Active ingredient", ""],
  ["usageRoute", "String", Y, "", "Route of administration", "enum: Uống, Bôi, Tiêm"],
  ["unit", "String", N, "", "Unit", "e.g. tablet"],
  ["unitPrice", "Number", N, "", "Unit price (VND)", ""],
  ["stockQuantity", "Number", Y, "", "Stock quantity", "default: 0"],
  ["isActive", "Boolean", Y, "", "Active status", "default: true"],
  ["createdAt / updatedAt", "Date", N, "", "Record timestamps", "Auto"],
]));

children.push(tblCaption("Table 10: Medical_Record collection data structure"));
children.push(dataStructureTable([
  ["_id", "ObjectId", N, "PK", "Record identifier", "Auto-generated"],
  ["appointmentId", "ObjectId", N, "FK", "Appointment reference", "→ Appointment · unique"],
  ["patientId", "ObjectId", N, "FK", "Patient reference", "→ Patient"],
  ["doctorId", "ObjectId", N, "FK", "Doctor reference", "→ Doctor"],
  ["height", "Number", Y, "", "Height (cm)", ""],
  ["weight", "Number", Y, "", "Weight (kg)", ""],
  ["bloodPressure", "String", Y, "", "Blood pressure", "e.g. 120/80"],
  ["heartRate", "Number", Y, "", "Heart rate (bpm)", ""],
  ["temperature", "Number", Y, "", "Body temperature (°C)", ""],
  ["diagnosis", "String", N, "", "Diagnosis", ""],
  ["clinicalNotes", "String", Y, "", "Clinical notes / advice", ""],
  ["createdAt / updatedAt", "Date", N, "", "Record timestamps", "Auto"],
]));

children.push(tblCaption("Table 11: Prescription collection data structure"));
children.push(dataStructureTable([
  ["_id", "ObjectId", N, "PK", "Prescription identifier", "Auto-generated"],
  ["recordId", "ObjectId", N, "FK", "Medical record reference", "→ Medical_Record"],
  ["medicineId", "ObjectId", N, "FK", "Medicine reference", "→ Medicine"],
  ["quantity", "Number", N, "", "Quantity prescribed", ""],
  ["dosage", "String", N, "", "Dosage", "e.g. 500mg"],
  ["frequency", "String", N, "", "Frequency", "e.g. 2 times/day"],
  ["durationDays", "Number", N, "", "Duration (days)", ""],
  ["specialInstructions", "String", Y, "", "Special instructions", ""],
  ["createdAt / updatedAt", "Date", N, "", "Record timestamps", "Auto"],
]));

children.push(tblCaption("Table 12: Invoice collection data structure"));
children.push(dataStructureTable([
  ["_id", "ObjectId", N, "PK", "Invoice identifier", "Auto-generated"],
  ["appointmentId", "ObjectId", N, "FK", "Appointment reference", "→ Appointment"],
  ["patientId", "ObjectId", N, "FK", "Patient reference", "→ Patient"],
  ["invoiceType", "String", N, "", "Invoice type", "enum: Consultation, Pharmacy"],
  ["totalAmount", "Number", N, "", "Total amount (VND)", ""],
  ["status", "String", Y, "", "Payment status", "enum: Unpaid, Paid, Refunded"],
  ["issuedAt", "Date", Y, "", "Issue date", "default: now"],
  ["paidAt", "Date", Y, "", "Payment date", ""],
  ["processedBy", "ObjectId", Y, "FK", "Processing user (cashier)", "→ User"],
  ["createdAt / updatedAt", "Date", N, "", "Record timestamps", "Auto"],
]));

children.push(tblCaption("Table 13: Invoice_Detail collection data structure"));
children.push(dataStructureTable([
  ["_id", "ObjectId", N, "PK", "Detail identifier", "Auto-generated"],
  ["invoiceId", "ObjectId", N, "FK", "Invoice reference", "→ Invoice"],
  ["medicineId", "ObjectId", N, "FK", "Medicine reference", "→ Medicine"],
  ["quantity", "Number", N, "", "Quantity", ""],
  ["unitPrice", "Number", N, "", "Unit price (VND)", ""],
  ["subTotal", "Number", N, "", "Line subtotal (VND)", ""],
  ["createdAt / updatedAt", "Date", N, "", "Record timestamps", "Auto"],
]));

children.push(tblCaption("Table 14: QuickBooking collection data structure"));
children.push(dataStructureTable([
  ["_id", "ObjectId", N, "PK", "Quick-booking identifier", "Auto-generated"],
  ["name", "String", N, "", "Customer name", ""],
  ["phone", "String", N, "", "Customer phone", ""],
  ["department", "String", Y, "", "Requested department", ""],
  ["doctor", "String", Y, "", "Requested doctor", ""],
  ["bookingDate", "String", N, "", "Booking date", "Format YYYY-MM-DD"],
  ["time", "String", Y, "", "Booking time", "e.g. 09:00"],
  ["createdAt / updatedAt", "Date", N, "", "Record timestamps", "Auto"],
]));

children.push(tblCaption("Table 15: Post collection data structure"));
children.push(dataStructureTable([
  ["_id", "ObjectId", N, "PK", "Post identifier", "Auto-generated"],
  ["title", "String", N, "", "Post title", ""],
  ["slug", "String", N, "", "URL slug", "unique"],
  ["thumbnailURL", "String", Y, "", "Cover image URL", ""],
  ["content", "String", N, "", "Rich-text content (HTML)", ""],
  ["status", "String", Y, "", "Publication status", "enum: Draft, Published, Archived"],
  ["publishedAt", "Date", Y, "", "Publication date", ""],
  ["createdAt / updatedAt", "Date", N, "", "Record timestamps", "Auto"],
]));

children.push(tblCaption("Table 16: Contact_Inquiry collection data structure"));
children.push(dataStructureTable([
  ["_id", "ObjectId", N, "PK", "Inquiry identifier", "Auto-generated"],
  ["senderName", "String", N, "", "Sender name", ""],
  ["senderPhone", "String", N, "", "Sender phone", ""],
  ["senderEmail", "String", Y, "", "Sender email", "lowercase"],
  ["message", "String", N, "", "Inquiry message", ""],
  ["isResolved", "Boolean", Y, "", "Resolved flag", "default: false"],
  ["handledBy", "ObjectId", Y, "FK", "Handling staff", "→ Staff"],
  ["submittedAt", "Date", Y, "", "Submission date", "default: now"],
  ["createdAt / updatedAt", "Date", N, "", "Record timestamps", "Auto"],
]));

// ============================================================
//  CHAPTER 5 - DFD DIAGRAMS
// ============================================================
children.push(H1("Chapter 5.  DFD DIAGRAMS"));
children.push(P("Data Flow Diagrams (DFD) illustrate how data moves through the Hopsontai Clinic Management System between external entities, processes, and data stores. The Context Diagram (Level 0) presents the system as a single process interacting with its external entities, while Level 1 diagrams decompose the system into its major functional modules."));

children.push(H2("5.1  Context DFD (Level 0)"));
children.push(P("The context diagram shows the Hopsontai Clinic Management System as a central process interacting with five external entities: Patient, Doctor, Staff, Accountant, and Administrator. Each entity sends inputs to and receives outputs from the system."));
children.push(...figureImage("fig03_context.png", figCaption("Figure 3: Context DFD (Level 0)"), { title: "Context DFD", maxH: 620 }));
children.push(tblCaption("External entities and primary data flows"));
children.push(genTable([2000, 3680, 3680],
  ["External Entity", "Input to System", "Output from System"],
  [
    ["Patient", "Registration, login, appointment booking, profile update, contact inquiry", "Profile, appointments, medical history, prescriptions, invoices"],
    ["Doctor", "Login, medical record, prescription, appointment update", "Daily schedule, patient list, examination & prescription data"],
    ["Staff", "Login, appointment confirmation, inquiry handling", "Appointment queue, contact inquiries"],
    ["Accountant", "Login, invoice creation, payment processing", "Invoice list, payment status, revenue figures"],
    ["Administrator", "Login, manage users / departments / schedules / medicines / posts", "Dashboards, statistics, full management data"],
  ]));

children.push(H2("5.2  DFD Level 1 – Functional Modules"));
children.push(P("The system is decomposed into the following major processes, each backed by one or more data stores (MongoDB collections)."));

const dfdModules = [
  ["5.2.1  Authentication & Account", "Handles registration, login, JWT issuance, and role-based authorization. Data stores: User, Role.",
    "Figure 4: DFD Level 1 – Authentication & Account", "fig04_dfd_auth.png"],
  ["5.2.2  Appointment & Scheduling", "Manages departments, doctor schedules, appointment booking, confirmation, and capacity tracking. Data stores: Department, Doctor_Schedule, Appointment, QuickBooking.",
    "Figure 5: DFD Level 1 – Appointment & Scheduling", "fig05_dfd_scheduling.png"],
  ["5.2.3  Clinical Examination & Prescription", "Records medical examinations and prescriptions, and updates medicine stock. Data stores: Medical_Record, Prescription, Medicine.",
    "Figure 6: DFD Level 1 – Clinical Examination & Prescription", "fig06_dfd_clinical.png"],
  ["5.2.4  Billing & Payment", "Generates consultation and pharmacy invoices, records details, and processes payments. Data stores: Invoice, Invoice_Detail.",
    "Figure 7: DFD Level 1 – Billing & Payment", "fig07_dfd_billing.png"],
  ["5.2.5  CMS & Contact", "Manages blog posts and contact inquiries from the website. Data stores: Post, Contact_Inquiry.",
    "Figure 8: DFD Level 1 – CMS & Contact", "fig08_dfd_cms.png"],
  ["5.2.6  Administration & Reporting", "Provides user/catalog management and analytics dashboards across all collections. Data stores: all collections.",
    "Figure 9: DFD Level 1 – Administration", "fig09_dfd_admin.png"],
];
dfdModules.forEach(([h, t, cap, img]) => {
  children.push(H3(h));
  children.push(P(t));
  children.push(...figureImage(img, figCaption(cap), { title: cap, maxH: 470 }));
});

// ============================================================
//  CHAPTER 6 - INTERFACE OF APPLICATION
// ============================================================
children.push(H1("Chapter 6.  INTERFACE OF APPLICATION"));
children.push(P("This chapter presents the main user interfaces of the Hopsontai Clinic Management System. Screenshots should be inserted in the placeholders below. The interface is organized by area: the public website and the four authenticated role portals."));

const screens = [
  ["6.1  Public Home Page", "The landing page introduces the clinic with a hero banner, quick-booking widget, featured departments, specialist doctors, service packages, and the latest health articles. Visitors can navigate to Departments, Specialists, Posts, About, and Contact pages.", "Figure 10: Public home page", "fig10_home.png"],
  ["6.2  Login Screen", "Users log in with their phone number (username) and password. On success, a JWT is stored and the user is redirected to the portal matching their role.", "Figure 11: Login screen", "fig11_login.png"],
  ["6.3  Patient Dashboard & Booking", "Patients view upcoming and past appointments, book new appointments through a step-by-step form (department → doctor → date → time slot), and review their medical history, prescriptions, and invoices.", "Figure 12: Patient dashboard & appointment booking", "fig12_patient.png"],
  ["6.4  Doctor Schedule & Examination", "Doctors see their daily schedule and patient queue, open an appointment to record vital signs, diagnosis, and clinical notes, and issue prescriptions from the medicine catalog.", "Figure 13: Doctor schedule & examination screen", "fig13_doctor.png"],
  ["6.5  Staff Customer-Care Dashboard", "Customer-care staff confirm or cancel pending appointments and respond to contact inquiries submitted from the public website.", "Figure 14: Staff customer-care dashboard", "fig14_staff.png"],
  ["6.6  Accountant Billing Dashboard", "Accountants view consultation and pharmacy invoices, process payments, and monitor paid/unpaid status and revenue.", "Figure 15: Accountant billing dashboard", "fig15_accountant.png"],
  ["6.7  Administrator Dashboard", "Administrators manage users, departments, doctor schedules, medicines, and blog posts, and view analytics on appointments and revenue. An AI assistant answers clinic-related queries.", "Figure 16: Administrator dashboard", "fig16_admin.png"],
];
screens.forEach(([h, t, cap, img]) => {
  children.push(H2(h));
  children.push(P(t));
  children.push(...figureImage(img, figCaption(cap), { title: cap, maxW: 600, maxH: 460 }));
});

// ============================================================
//  TASK SHEET REVIEW 2
// ============================================================
children.push(H1("TASK SHEET REVIEW 2"));
children.push(P([new TextRun({ text: "Project Title: ", bold: true }), new TextRun("Hopsontai Clinic Management System")], { after: 40 }));
children.push(P([new TextRun({ text: "Date of Preparation of Activity Plan: ", bold: true }), new TextRun("13-Jun-2026")], { after: 160 }));
children.push(genTable([700, 3500, 1100, 1700, 2360],
  ["Sr. No.", "Task", "Actual Days", "Teammate", "Status"],
  [
    ["1", "Database Design – Relational model & collections", "3", "[ Member 1 ]", "Completed"],
    ["2", "Database Design – Data description tables", "2", "[ Member 1 ]", "Completed"],
    ["3", "DFD Diagrams – Context & Level 1", "3", "[ Member 2 ]", "Completed"],
    ["4", "Interface of Application – Public & Patient", "2", "[ Member 2 ]", "Completed"],
    ["5", "Interface of Application – Doctor & Staff", "2", "[ Member 3 ]", "Completed"],
    ["6", "Interface of Application – Accountant & Admin", "2", "[ Member 3 ]", "Completed"],
  ]));
children.push(new Paragraph({ spacing: { before: 240 },
  tabStops: [{ type: TabStopType.RIGHT, position: 9360 }],
  children: [new TextRun({ text: "Signature of Instructor:", bold: true }), new TextRun({ text: "\tSignature of Team Leader:", bold: true })] }));
children.push(new Paragraph({ spacing: { before: 240 },
  tabStops: [{ type: TabStopType.RIGHT, position: 9360 }],
  children: [new TextRun("Mrs. Pham Thi Lanh"), new TextRun({ text: "\t[ Team Leader Name ]" })] }));

// ============================================================
//  CHAPTER 7 - USER GUIDE & INSTALLATION
// ============================================================
children.push(H1("Chapter 7.  USER GUIDE & INSTALLATION"));

children.push(H2("7.1  Installation Guide"));
children.push(P("Follow these steps to set up the Hopsontai Clinic Management System on your local machine.", { after: 60 }));
children.push(H3("a. System Requirements"));
[ "Runtime: Node.js v18 or higher, with npm.",
  "Database: MongoDB (local server or MongoDB Atlas).",
  "Recommended IDE: Visual Studio Code.",
  "Tools: Git, MongoDB Compass, and a modern web browser." ].forEach(t => children.push(bullet(t)));

children.push(H3("b. Backend Setup"));
children.push(numItem("Open a terminal and navigate to the backend folder: cd backend"));
children.push(numItem("Install dependencies: npm install"));
children.push(numItem("Create a .env file with the following variables:"));
children.push(P("NODE_ENV=development PORT=4000 MONGODB_URI=mongodb://localhost:27017/eproject_clinic JWT_SECRET=your_secret_key FRONTEND_URL=http://localhost:5173",
  { indent: { left: 720 }, after: 100 }));
children.push(numItem("Seed sample data into the database: node src/config/seed.js --force"));
children.push(numItem("Start the backend server: npm run dev  (API runs at http://localhost:4000)"));

children.push(H3("c. Frontend Setup"));
children.push(numItem("Open a second terminal and navigate to the frontend folder: cd frontend", "nums2"));
children.push(numItem("Install dependencies: npm install", "nums2"));
children.push(numItem("Start the development server: npm run dev", "nums2"));
children.push(numItem("Open the application in a browser at http://localhost:5173", "nums2"));

children.push(H3("d. Test Accounts"));
children.push(P("After seeding, the following sample accounts are available (username / password):", { after: 60 }));
children.push(genTable([2200, 2600, 4560],
  ["Role", "Username (phone)", "Password"],
  [
    ["Administrator", "0901234567", "admin123"],
    ["Doctor", "0911111111", "doctor123"],
    ["Staff (Customer Care)", "0913333333", "staff123"],
    ["Accountant", "0915555555", "accountant123"],
    ["Patient", "0914444444", "patient123"],
  ]));

children.push(H2("7.2  User Guide"));

children.push(H3("7.2.1  Patient"));
children.push(P("The Patient portal lets users manage their healthcare journey online.", { after: 60 }));
[ ["Login / Register: ", "Register with your phone number and password, or log in with an existing account."],
  ["Book an Appointment: ", "Choose a department, select a specialist doctor, pick an available date and time slot, and describe your symptoms. The appointment is created with status “Pending” until confirmed."],
  ["My Appointments: ", "View upcoming and past appointments and their status (Pending, Confirmed, Completed, Canceled)."],
  ["Medical History: ", "Review previous diagnoses, vital signs, clinical notes, and prescriptions recorded by your doctor."],
  ["Invoices: ", "View consultation and pharmacy invoices and their payment status."],
].forEach(([b, t]) => children.push(bullet([new TextRun({ text: b, bold: true }), new TextRun({ text: t })])));

children.push(H3("7.2.2  Doctor"));
children.push(P("The Doctor portal supports daily clinical work.", { after: 60 }));
[ ["Login: ", "Log in to access your schedule and patient queue."],
  ["My Schedule: ", "View work schedules (date, time block, capacity) and the list of confirmed appointments for each session."],
  ["Examination: ", "Open a patient’s appointment, record vital signs (height, weight, blood pressure, heart rate, temperature), enter the diagnosis and clinical notes, and save the medical record."],
  ["Prescription: ", "Add medicines from the catalog with dosage, frequency, duration, and special instructions. Stock is automatically deducted."],
  ["Complete Visit: ", "Mark the appointment as Completed once the examination and prescription are finished."],
].forEach(([b, t]) => children.push(bullet([new TextRun({ text: b, bold: true }), new TextRun({ text: t })])));

children.push(H3("7.2.3  Staff (Customer Care)"));
children.push(P("The Staff portal handles front-desk and customer-care tasks.", { after: 60 }));
[ ["Appointment Confirmation: ", "Review pending appointments and confirm or cancel them, assigning patients to the appropriate doctor schedule."],
  ["Contact Inquiries: ", "Read inquiries submitted from the public Contact page and mark them as resolved once handled."],
].forEach(([b, t]) => children.push(bullet([new TextRun({ text: b, bold: true }), new TextRun({ text: t })])));

children.push(H3("7.2.4  Accountant"));
children.push(P("The Accountant portal manages clinic finances.", { after: 60 }));
[ ["Invoice List: ", "View all consultation and pharmacy invoices with their status (Unpaid, Paid, Refunded)."],
  ["Create Invoice: ", "Generate invoices linked to a patient’s appointment."],
  ["Process Payment: ", "Record a payment, set the invoice to Paid, and capture the processing date and cashier."],
].forEach(([b, t]) => children.push(bullet([new TextRun({ text: b, bold: true }), new TextRun({ text: t })])));

children.push(H3("7.2.5  Administrator"));
children.push(P("The Administrator holds the highest authority and oversees the whole system.", { after: 60 }));
[ ["Dashboard & Analytics: ", "Monitor statistics on users, appointments, and revenue, with charts and an AI assistant for clinic queries."],
  ["User Management: ", "Create, edit, deactivate, and delete user accounts; provision doctors and staff; impersonate a user for troubleshooting."],
  ["Department & Schedule Management: ", "Add and edit departments and create or remove doctor work schedules."],
  ["Medicine Management: ", "Maintain the medicine catalog (code, name, ingredient, price, stock)."],
  ["Content Management (CMS): ", "Create, edit, publish, and delete clinical blog posts, including thumbnail upload."],
  ["Contact Inquiries: ", "Review and resolve contact inquiries from the public website."],
].forEach(([b, t]) => children.push(bullet([new TextRun({ text: b, bold: true }), new TextRun({ text: t })])));

children.push(H3("g. Troubleshooting & Common Scenarios"));
[ ["Cannot log in: ", "Ensure the backend is running on port 4000 and the database has been seeded. Use the exact phone-number username and password."],
  ["Empty data: ", "Run the seed script (node src/config/seed.js --force) to populate sample departments, doctors, medicines, and posts."],
  ["Booking unavailable: ", "A schedule marked “Full” has reached its maximum patient capacity; choose another time slot or date."],
  ["Access denied (403): ", "The logged-in role does not have permission for that action – log in with an account that has the required role."],
].forEach(([b, t]) => children.push(bullet([new TextRun({ text: b, bold: true }), new TextRun({ text: t })])));

// ============================================================
//  TASK SHEET REVIEW 3
// ============================================================
children.push(H1("TASK SHEET REVIEW 3"));
children.push(P([new TextRun({ text: "Project Title: ", bold: true }), new TextRun("Hopsontai Clinic Management System")], { after: 40 }));
children.push(P([new TextRun({ text: "Date of Preparation of Activity Plan: ", bold: true }), new TextRun("20-Jun-2026")], { after: 160 }));
children.push(genTable([700, 3500, 1100, 1700, 2360],
  ["Sr. No.", "Task", "Actual Days", "Teammate", "Status"],
  [
    ["1", "Installation Guide & Backend setup documentation", "2", "[ Member 1 ]", "Completed"],
    ["2", "User Guide – Patient & Doctor", "2", "[ Member 2 ]", "Completed"],
    ["3", "User Guide – Staff, Accountant & Admin", "2", "[ Member 3 ]", "Completed"],
    ["4", "Final review, formatting & report compilation", "2", "[ Member 1 ]", "Completed"],
  ]));
children.push(new Paragraph({ spacing: { before: 240 },
  tabStops: [{ type: TabStopType.RIGHT, position: 9360 }],
  children: [new TextRun({ text: "Signature of Instructor:", bold: true }), new TextRun({ text: "\tSignature of Team Leader:", bold: true })] }));
children.push(new Paragraph({ spacing: { before: 240 },
  tabStops: [{ type: TabStopType.RIGHT, position: 9360 }],
  children: [new TextRun("Mrs. Pham Thi Lanh"), new TextRun({ text: "\t[ Team Leader Name ]" })] }));

// ============================================================
//  DOCUMENT ASSEMBLY
// ============================================================
const doc = new Document({
  creator: "Hopsontai Clinic Project Team",
  title: "Hopsontai Clinic Management System – Project Report",
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 30, bold: true, color: BRAND_DARK, font: "Arial" },
        paragraph: { spacing: { before: 280, after: 200 }, outlineLevel: 0,
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BRAND, space: 4 } } } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, color: BRAND, font: "Arial" },
        paragraph: { spacing: { before: 220, after: 120 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 23, bold: true, color: "333333", font: "Arial" },
        paragraph: { spacing: { before: 160, after: 80 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [
      { reference: "bullets", levels: [
        { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        { level: 1, format: LevelFormat.BULLET, text: "◦", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
      ] },
      { reference: "nums", levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
      ] },
      { reference: "nums2", levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
      ] },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    headers: {
      default: new Header({ children: [new Paragraph({
        alignment: AlignmentType.RIGHT,
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC", space: 2 } },
        children: [new TextRun({ text: RUNNING, italics: true, size: 16, color: "888888" })],
      })] }),
    },
    footers: {
      default: new Footer({ children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Page ", size: 16, color: "888888" }),
          new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "888888" })],
      })] }),
    },
    children,
  }],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("Hopsontai_Clinic_Report.docx", buffer);
  console.log("Document written:", buffer.length, "bytes");
});
