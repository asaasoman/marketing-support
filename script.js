/* =========================================================================
   CONFIG — REQUIRED SETUP
   This site stores requests in Firebase Firestore and uses Firebase
   Authentication to protect the admin dashboard (status tracking).

   1. Create a free Firebase project at https://console.firebase.google.com
   2. Add a "Web app" (Project settings → General → Your apps → </> )
      and copy the firebaseConfig object it gives you into FIREBASE_CONFIG
      below.
   3. Enable Firestore (Build → Firestore Database → Create database).
   4. Enable Authentication → Sign-in method → Email/Password.
   5. Create one admin user manually: Authentication → Users → Add user
      (this is the email/password used to open the admin dashboard below).
   6. Paste the exact Firestore security rules from README.md into
      Firestore Database → Rules, then Publish.
   See README.md for the full step-by-step walkthrough.
   ========================================================================= */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyC2H-mstLwUyLLJqfpIUgqXQYcUF-9-YWk",
  authDomain: "marketing-support-a6bfa.firebaseapp.com",
  projectId: "marketing-support-a6bfa",
  storageBucket: "marketing-support-a6bfa.firebasestorage.app",
  messagingSenderId: "571953621058",
  appId: "1:571953621058:web:b5f7f688e945fe089d25db",
};

function isFirebaseConfigured(){
  return Object.values(FIREBASE_CONFIG).every(v => v && !String(v).includes("REPLACE_ME"));
}

let app, db, auth;
let firestoreApi = null; // populated once the Firestore module is loaded
let authApi = null;      // populated once the Auth module is loaded

async function initFirebase(){
  if(!isFirebaseConfigured() || app) return;
  const { initializeApp } = await import("https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js");
  firestoreApi = await import("https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js");
  authApi = await import("https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js");
  app = initializeApp(FIREBASE_CONFIG);
  db = firestoreApi.getFirestore(app);
  auth = authApi.getAuth(app);
}

const STATUS_OPTIONS = ["جديد", "قيد التنفيذ", "مكتمل", "مرفوض / يحتاج تعديل"];
const STATUS_CLASS = {
  "جديد": "s-new",
  "قيد التنفيذ": "s-progress",
  "مكتمل": "s-done",
  "مرفوض / يحتاج تعديل": "s-rejected",
};

const ICONS = {
  business_card: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="6" width="19" height="13" rx="2"/><circle cx="8" cy="11" r="1.6"/><path d="M5.2 16c.5-1.6 1.8-2.4 2.8-2.4s2.3.8 2.8 2.4"/><path d="M14 10h5M14 13.5h5"/></svg>',
  access_card: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2.4"/><circle cx="12" cy="9.4" r="2.2"/><path d="M8.3 15.4c.5-1.6 1.9-2.4 3.7-2.4s3.2.8 3.7 2.4"/><path d="M9 21v-1.4M15 21v-1.4"/></svg>',
  email_signature: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="5" width="19" height="13" rx="2"/><path d="M3.5 6.5 12 13l8.5-6.5"/><path d="M4 19.5c2.4-1.6 4-2.2 5.4-2.2"/></svg>',
  other: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="18" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="9.2"/></svg>',
};

/* ============== FORM DEFINITIONS ============== */
const FORMS = {
  business_card: {
    titleAr: "بطاقة عمل",
    titleEn: "Business Card",
    desc: "تُستخدم هذه البيانات لطباعة بطاقة العمل وفق هوية أساس المؤسسية (الاسم والمسمى الوظيفي يظهران باللغتين).",
    fields: [
      {id:"name_en", label:"الاسم الكامل", labelSub:"English", required:true, dir:"ltr", placeholder:"Ali Sulaiman Al Khalili"},
      {id:"name_ar", label:"الاسم الكامل", labelSub:"بالعربية", required:true, dir:"rtl", placeholder:"علي بن سليمان الخليلي"},
      {id:"title_en", label:"المسمى الوظيفي", labelSub:"English", required:true, dir:"ltr", placeholder:"Corporate Communication and Marketing Manager"},
      {id:"title_ar", label:"المسمى الوظيفي", labelSub:"بالعربية", required:true, dir:"rtl", placeholder:"مدير التواصل المؤسسي والتسويق"},
      {id:"department", label:"القسم / الإدارة", required:false, dir:"rtl"},
      {id:"phone", label:"الهاتف المكتبي", required:false, dir:"ltr", placeholder:"+968 2 439 9800", hint:"اتركه فارغاً لاستخدام الرقم العام"},
      {id:"mobile", label:"الهاتف المحمول", required:true, dir:"ltr", placeholder:"+968 9X XXX XXX"},
      {id:"email", label:"البريد الإلكتروني", required:true, dir:"ltr", type:"email", placeholder:"name@asaas.om"},
      {id:"quantity", label:"الكمية المطلوبة (علبة = 100 بطاقة)", required:false, dir:"ltr", type:"number", value:"1"},
      {id:"notes", label:"ملاحظات إضافية", required:false, dir:"rtl", textarea:true, full:true, placeholder:"أي تفاصيل أخرى يحتاجها فريق الطباعة"},
    ],
    info: "الموقع الإلكتروني سيظهر تلقائياً كما هو: www.asaas.om",
  },
  access_card: {
    titleAr: "بطاقة الدخول",
    titleEn: "Access Card",
    desc: "لطلب بطاقة دخول جديدة، أو بدل فاقد، أو بطاقة تالفة.",
    fields: [
      {id:"name_en", label:"الاسم الكامل", labelSub:"English", required:true, dir:"ltr"},
      {id:"name_ar", label:"الاسم الكامل", labelSub:"بالعربية", required:true, dir:"rtl"},
      {id:"title_en", label:"المسمى الوظيفي", labelSub:"English", required:true, dir:"ltr"},
      {id:"title_ar", label:"المسمى الوظيفي", labelSub:"بالعربية", required:true, dir:"rtl"},
      {id:"department", label:"القسم / الإدارة", required:true, dir:"rtl"},
      {id:"employee_id", label:"الرقم الوظيفي", required:false, dir:"ltr"},
      {id:"request_type", label:"نوع الطلب", required:true, dir:"rtl", select:true, options:[
        "بطاقة جديدة (موظف جديد)","بدل بطاقة مفقودة","بطاقة تالفة","تحديث بيانات البطاقة","أخرى"
      ]},
      {id:"mobile", label:"الهاتف المحمول", required:true, dir:"ltr"},
      {id:"email", label:"البريد الإلكتروني", required:true, dir:"ltr", type:"email"},
      {id:"notes", label:"ملاحظات إضافية", required:false, dir:"rtl", textarea:true, full:true},
    ],
  },
  email_signature: {
    titleAr: "توقيع البريد الإلكتروني",
    titleEn: "Email Signature",
    desc: "لإنشاء توقيع بريد إلكتروني رسمي وفق هوية أساس المؤسسية.",
    fields: [
      {id:"name_en", label:"الاسم الكامل", labelSub:"English", required:true, dir:"ltr"},
      {id:"name_ar", label:"الاسم الكامل", labelSub:"بالعربية", required:true, dir:"rtl"},
      {id:"title_en", label:"المسمى الوظيفي", labelSub:"English", required:true, dir:"ltr"},
      {id:"title_ar", label:"المسمى الوظيفي", labelSub:"بالعربية", required:true, dir:"rtl"},
      {id:"department", label:"القسم / الإدارة", required:false, dir:"rtl"},
      {id:"phone", label:"الهاتف المكتبي / التحويلة", required:false, dir:"ltr"},
      {id:"mobile", label:"الهاتف المحمول", required:true, dir:"ltr"},
      {id:"email", label:"البريد الإلكتروني", required:true, dir:"ltr", type:"email"},
      {id:"notes", label:"ملاحظات إضافية", required:false, dir:"rtl", textarea:true, full:true, placeholder:"مثال: إضافة شعار حملة، أو رابط معين"},
    ],
  },
  other: {
    titleAr: "طلب آخر",
    titleEn: "Other Request",
    desc: "لأي طلب آخر متعلق بالهوية المؤسسية لا يندرج تحت الأقسام السابقة.",
    fields: [
      {id:"name", label:"الاسم الكامل", required:true, dir:"rtl"},
      {id:"department", label:"القسم / الإدارة", required:false, dir:"rtl"},
      {id:"mobile", label:"الهاتف المحمول", required:false, dir:"ltr"},
      {id:"email", label:"البريد الإلكتروني", required:true, dir:"ltr", type:"email"},
      {id:"subject", label:"موضوع الطلب", required:true, dir:"rtl", placeholder:"مثال: تصميم رول أب، طلب ملف الشعار، إلخ"},
      {id:"details", label:"تفاصيل الطلب", required:true, dir:"rtl", textarea:true, full:true},
    ],
  },
};

let currentType = "business_card";
const typeSelector = document.getElementById("typeSelector");
const cardArea = document.getElementById("cardArea");

/* ---------- render type selector ---------- */
function renderTypeSelector(){
  typeSelector.innerHTML = "";
  Object.keys(FORMS).forEach(key=>{
    const def = FORMS[key];
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "type-card" + (key===currentType ? " active":"");
    btn.dataset.type = key;
    btn.innerHTML = ICONS[key] + `<span class="t-ar">${def.titleAr}</span><span class="t-en en">${def.titleEn}</span>`;
    btn.addEventListener("click", ()=>{
      currentType = key;
      renderTypeSelector();
      renderForm();
    });
    typeSelector.appendChild(btn);
  });
}

/* ---------- render form ---------- */
function renderForm(){
  const def = FORMS[currentType];
  let fieldsHtml = "";
  def.fields.forEach(f=>{
    const reqStar = f.required ? '<span class="req">*</span>' : "";
    const subLabel = f.labelSub ? ` <span class="en" style="font-size:11px;color:#7c8a98;">(${f.labelSub})</span>` : "";
    const hint = f.hint ? `<div class="hint">${f.hint}</div>` : "";
    let control = "";
    if(f.select){
      const opts = f.options.map(o=>`<option value="${o}">${o}</option>`).join("");
      control = `<select id="${f.id}" ${f.required ? "required":""}><option value="" disabled selected>اختر...</option>${opts}</select>`;
    } else if(f.textarea){
      control = `<textarea id="${f.id}" dir="${f.dir}" placeholder="${f.placeholder||""}" ${f.required ? "required":""}></textarea>`;
    } else {
      control = `<input id="${f.id}" type="${f.type||"text"}" dir="${f.dir}" placeholder="${f.placeholder||""}" value="${f.value||""}" ${f.required ? "required":""}>`;
    }
    fieldsHtml += `<div class="field ${f.full ? "full":""}">
      <label for="${f.id}">${f.label}${subLabel}${reqStar}</label>
      ${control}
      ${hint}
    </div>`;
  });

  const infoHtml = def.info ? `<div class="info-strip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9.5"/><path d="M12 8v.01M12 11v5" stroke-linecap="round"/></svg><span>${def.info}</span></div>` : "";

  cardArea.innerHTML = `
    <h2>طلب ${def.titleAr} <span class="en" style="font-size:12px;color:#7c8a98;">(${def.titleEn})</span></h2>
    <p class="desc">${def.desc}</p>
    <form id="requestForm" novalidate>
      <div class="field-grid">${fieldsHtml}</div>
      ${infoHtml}
      <p class="error-msg" id="formError">يرجى تعبئة جميع الحقول المطلوبة قبل الإرسال.</p>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">إرسال الطلب</button>
      </div>
    </form>
  `;
  document.getElementById("requestForm").addEventListener("submit", onSubmit);
}

/* ---------- reference number (for the requester to quote in follow-ups) ---------- */
function genReference(){
  const d = new Date();
  const stamp = String(d.getFullYear()).slice(2) + String(d.getMonth()+1).padStart(2,"0") + String(d.getDate()).padStart(2,"0");
  const rand = Math.floor(1000 + Math.random()*9000);
  return "AS-" + stamp + "-" + rand;
}

function showToast(msg){
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"), 2600);
}

/* ---------- submit handler (writes to Firestore) ---------- */
async function onSubmit(e){
  e.preventDefault();
  const def = FORMS[currentType];
  const errorEl = document.getElementById("formError");
  const data = { type: currentType, typeLabel: def.titleAr };
  let valid = true;

  def.fields.forEach(f=>{
    const el = document.getElementById(f.id);
    const val = el ? el.value.trim() : "";
    if(f.required && !val) valid = false;
    data[f.id] = val;
  });

  if(!valid){
    errorEl.textContent = "يرجى تعبئة جميع الحقول المطلوبة قبل الإرسال.";
    errorEl.style.display = "block";
    return;
  }
  errorEl.style.display = "none";

  if(!isFirebaseConfigured()){
    errorEl.textContent = "لم يتم ربط هذا الموقع بـ Firebase بعد. راجع تعليمات الإعداد في README.md (ملف script.js).";
    errorEl.style.display = "block";
    return;
  }

  const reference = genReference();
  data.reference = reference;
  data.status = STATUS_OPTIONS[0];

  const submitBtn = e.target.querySelector("button[type=submit]");
  submitBtn.disabled = true;
  submitBtn.textContent = "جارٍ الإرسال...";

  try{
    await initFirebase();
    data.submittedAt = firestoreApi.serverTimestamp();
    await firestoreApi.addDoc(firestoreApi.collection(db, "requests"), data);
    showSuccess(def, reference);
  }catch(err){
    console.error("Firestore submission error:", err);
    submitBtn.disabled = false;
    submitBtn.textContent = "إرسال الطلب";
    errorEl.textContent = "حدث خطأ أثناء إرسال الطلب. تحقّق من اتصالك بالإنترنت وحاول مرة أخرى.";
    errorEl.style.display = "block";
  }
}

function showSuccess(def, reference){
  cardArea.innerHTML = `
    <div class="success">
      <div class="check">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5 9.5 18 20 6"/></svg>
      </div>
      <h2>تم إرسال طلبك بنجاح</h2>
      <p class="note">استلمت إدارة التواصل المؤسسي والتسويق طلب «${def.titleAr}». احتفظ بالرقم المرجعي للمتابعة.</p>
      <div class="ref">${reference}</div>
      <div class="form-actions" style="justify-content:center;">
        <button class="btn btn-ghost" id="backBtn">إرسال طلب جديد</button>
      </div>
    </div>
  `;
  document.getElementById("backBtn").addEventListener("click", renderForm);
}

/* ============== ADMIN DASHBOARD (Firebase Auth + Firestore) ============== */
const loginOverlay = document.getElementById("loginOverlay");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginError = document.getElementById("loginError");

document.getElementById("adminLinkBtn").addEventListener("click", async ()=>{
  if(!isFirebaseConfigured()){
    showToast("لم يتم ربط هذا الموقع بـ Firebase بعد. راجع README.md.");
    return;
  }
  await initFirebase();
  loginEmail.value = "";
  loginPassword.value = "";
  loginError.style.display = "none";
  loginOverlay.hidden = false;
  loginEmail.focus();
});
document.getElementById("loginCancel").addEventListener("click", ()=>{ loginOverlay.hidden = true; });
document.getElementById("loginSubmit").addEventListener("click", doLogin);
loginPassword.addEventListener("keydown", (e)=>{ if(e.key === "Enter") doLogin(); });

async function doLogin(){
  loginError.style.display = "none";
  try{
    await authApi.signInWithEmailAndPassword(auth, loginEmail.value.trim(), loginPassword.value);
    loginOverlay.hidden = true;
    renderDashboard();
  }catch(err){
    console.error("Auth error:", err);
    loginError.textContent = "تعذّر تسجيل الدخول. تحقّق من البريد وكلمة المرور.";
    loginError.style.display = "block";
  }
}

async function renderDashboard(){
  typeSelector.style.display = "none";
  cardArea.innerHTML = `
    <div class="dash-bar">
      <h2>لوحة الطلبات</h2>
      <div class="dash-tools">
        <button class="btn btn-ghost" id="refreshBtn">تحديث</button>
        <button class="btn btn-ghost" id="exportBtn">تصدير CSV</button>
        <button class="btn btn-ghost" id="logoutBtn">تسجيل الخروج</button>
        <button class="btn btn-primary" id="closeDashBtn">رجوع لتقديم طلب</button>
      </div>
    </div>
    <div id="dashContent"><div class="empty-state">جارٍ تحميل الطلبات...</div></div>
  `;
  document.getElementById("refreshBtn").addEventListener("click", loadAndRenderRequests);
  document.getElementById("exportBtn").addEventListener("click", exportCsv);
  document.getElementById("logoutBtn").addEventListener("click", async ()=>{
    await authApi.signOut(auth);
    backToForm();
  });
  document.getElementById("closeDashBtn").addEventListener("click", backToForm);
  await loadAndRenderRequests();
}

function backToForm(){
  typeSelector.style.display = "grid";
  renderTypeSelector();
  renderForm();
}

let lastLoadedRequests = [];

async function loadAndRenderRequests(){
  const dashContent = document.getElementById("dashContent");
  dashContent.innerHTML = `<div class="empty-state">جارٍ تحميل الطلبات...</div>`;
  try{
    const q = firestoreApi.query(firestoreApi.collection(db, "requests"), firestoreApi.orderBy("submittedAt", "desc"));
    const snap = await firestoreApi.getDocs(q);
    const records = [];
    snap.forEach(docSnap=>{
      const rec = docSnap.data();
      rec.__id = docSnap.id;
      records.push(rec);
    });
    lastLoadedRequests = records;
    renderRequestsTable(records);
  }catch(err){
    console.error("Firestore read error:", err);
    dashContent.innerHTML = `<div class="empty-state">تعذّر تحميل الطلبات. تأكد من تسجيل الدخول وقواعد Firestore، ثم حاول مرة أخرى.</div>`;
  }
}

function fieldSummary(rec){
  const def = FORMS[rec.type];
  if(!def) return "";
  return def.fields.map(f=>{
    const v = rec[f.id];
    if(!v) return "";
    return `<div><strong>${f.label}${f.labelSub ? " ("+f.labelSub+")" : ""}:</strong> ${escapeHtml(v)}</div>`;
  }).join("");
}

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

function formatTimestamp(ts){
  if(!ts) return "—";
  if(typeof ts.toDate === "function") return ts.toDate().toLocaleString("ar-OM");
  return String(ts);
}

function renderRequestsTable(records){
  const dashContent = document.getElementById("dashContent");
  if(records.length === 0){
    dashContent.innerHTML = `<div class="empty-state">لا توجد طلبات بعد.</div>`;
    return;
  }
  const rows = records.map((rec, i)=>{
    const displayName = rec.name_ar || rec.name_en || rec.name || "—";
    const contact = rec.email || rec.mobile || "—";
    const date = formatTimestamp(rec.submittedAt);
    const statusOpts = STATUS_OPTIONS.map(s=>`<option value="${s}" ${s===rec.status ? "selected":""}>${s}</option>`).join("");
    const statusClass = STATUS_CLASS[rec.status] || "s-new";
    return `
      <tr>
        <td><span class="ref-chip">${rec.reference || "—"}</span></td>
        <td>${rec.typeLabel || rec.type}</td>
        <td>${escapeHtml(displayName)}</td>
        <td class="en" dir="ltr" style="text-align:left;">${escapeHtml(contact)}</td>
        <td>${date}</td>
        <td><select class="status-select ${statusClass}" data-id="${rec.__id}" data-idx="${i}">${statusOpts}</select></td>
        <td><button class="detail-btn" data-idx="${i}">عرض التفاصيل</button></td>
      </tr>
      <tr class="detail-row" id="detail-${i}"><td colspan="7">${fieldSummary(rec)}</td></tr>
    `;
  }).join("");

  dashContent.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th>المرجع</th><th>النوع</th><th>الاسم</th><th>التواصل</th><th>التاريخ</th><th>الحالة</th><th></th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;

  dashContent.querySelectorAll(".detail-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      document.getElementById("detail-" + btn.dataset.idx).classList.toggle("open");
    });
  });

  dashContent.querySelectorAll(".status-select").forEach(sel=>{
    sel.addEventListener("change", async ()=>{
      const idx = Number(sel.dataset.idx);
      const rec = lastLoadedRequests[idx];
      const newStatus = sel.value;
      try{
        await firestoreApi.updateDoc(firestoreApi.doc(db, "requests", sel.dataset.id), { status: newStatus });
        rec.status = newStatus;
        sel.className = "status-select " + (STATUS_CLASS[newStatus] || "s-new");
        showToast("تم تحديث حالة الطلب " + (rec.reference || ""));
      }catch(err){
        console.error("Firestore update error:", err);
        showToast("تعذّر حفظ التحديث، حاول مرة أخرى.");
      }
    });
  });
}

function exportCsv(){
  if(!lastLoadedRequests.length){
    showToast("لا توجد بيانات للتصدير.");
    return;
  }
  const cols = ["reference","typeLabel","name_en","name_ar","name","title_en","title_ar","department","mobile","email","status"];
  const header = cols.join(",");
  const rows = lastLoadedRequests.map(rec=>
    cols.map(c=>{
      const v = rec[c] !== undefined ? String(rec[c]).replace(/"/g,'""') : "";
      return `"${v}"`;
    }).join(",")
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], {type:"text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "asaas-requests.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ---------- init ---------- */
renderTypeSelector();
renderForm();
