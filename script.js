// 1. إعدادات Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBqkRkKoeop9hxocYCePhdyGsEG3M_JE0w",
    authDomain: "x-gym-system.firebaseapp.com",
    projectId: "x-gym-system",
    storageBucket: "x-gym-system.firebasestorage.app",
    messagingSenderId: "944120435098",
    appId: "1:944120435098:web:4a7a49ebfc212707782a23"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 2. المتغيرات العامة
let allMembers = [];
let html5QrcodeScanner;

// 3. تسجيل الدخول
function checkLogin() {
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value.trim();
    if(u === "x gym" && p === "112233") {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-content').style.display = 'block';
        loadMembers();
    } else { alert("بيانات خاطئة! جرب تاني يا بطل."); }
}

// 4. التنقل بين الأقسام
function showSection(id, event) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active-section'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(id).classList.add('active-section');
    
    if(event) event.currentTarget.classList.add('active');

    if (id === 'scan-section') {
        setTimeout(() => { startScanner(); }, 300); // تأخير لضمان فتح الكاميرا بمساحة صحيحة
    } else {
        stopScanner();
    }
}

// 5. جلب البيانات من Firebase
function loadMembers() {
    db.collection("members").orderBy("timestamp", "desc").onSnapshot(snap => {
        allMembers = snap.docs.map(doc => ({id: doc.id, ...doc.data()}));
        renderList(allMembers);
        updateDash();
    });
}

// 6. إضافة مشترك جديد
function addMember(e) {
    e.preventDefault();
    
    // سطر للتأكد في الـ Console إن الزرار شغال
    console.log("محاولة حفظ البيانات بدأت...");

    try {
        const data = {
            // علامة الـ (?) بتخلي الكود ميفصلش لو الـ ID مش موجود
            name: document.getElementById('name')?.value || "",
            phone: document.getElementById('phone')?.value || "",
            type: document.getElementById('sub-type')?.value || "شهر",
            coach: document.getElementById('coach')?.value || "بدون مدرب",
            height: document.getElementById('height')?.value || "0",
            weight: document.getElementById('weight')?.value || "0",
            debt: parseFloat(document.getElementById('debt-input')?.value) || 0,
            startDate: document.getElementById('start-date')?.value || "",
            endDate: document.getElementById('end-date')?.value || "",
            sessions: 0,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        // لو التاريخين ناقصين، نبه المستخدم
        if (!data.startDate || !data.endDate) {
            alert("⚠️ برجاء اختيار تاريخ البداية وتاريخ الانتهاء");
            return;
        }

        db.collection("members").add(data).then(() => {
            alert("تم حفظ المشترك بنجاح ⚡");
            document.getElementById('add-form').reset();
            showSection('members-section');
        }).catch(err => {
            console.error("Firebase Error:", err);
            alert("خطأ في قاعدة البيانات: " + err.message);
        });

    } catch (error) {
        console.error("General Error:", error);
        alert("حدث خطأ في تجميع البيانات، تأكد من وجود كل الخانات.");
    }
}
    db.collection("members").add(data).then(() => {
        alert("تم حفظ المشترك بنجاح ⚡");
        document.getElementById('add-form').reset();
        showSection('members-section');
    }).catch(err => alert("خطأ: " + err));

// 7. عرض قائمة الأعضاء (الكود الأصلي كامل بدون قص)
function renderList(list) {
    const box = document.getElementById('members-list');
    box.innerHTML = '';
    const today = new Date().setHours(0,0,0,0);

    list.forEach((m) => {
        const isAct = new Date(m.endDate) >= today;
        const hasDebt = (parseFloat(m.debt) || 0) > 0;

        box.innerHTML += `
            <div class="member-card" style="border-right: 4px solid ${isAct ? 'var(--success)' : 'var(--danger)'};">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <h4 style="color:#fff; font-size:1.2rem; display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-bolt" style="color: #00f2fe; filter: drop-shadow(0 0 5px #00f2fe); font-size: 1.1rem;"></i> 
                        ${m.name}
                    </h4>
                    <span style="font-size:0.75rem; padding:2px 8px; border-radius:10px; background:rgba(255,255,255,0.05); color:var(--text-dim); border:1px solid #333;">${m.type}</span>
                </div>

                <div class="info-grid">
                    <div><i class="fas fa-calendar-alt"></i> ينتهي: ${m.endDate}</div>
                    <div><i class="fas fa-user-tie"></i> الكوتش: ${m.coach}</div>
                    <div><i class="fas fa-arrows-alt-v"></i> الطول: ${m.height || '--'} سم</div>
                    <div><i class="fas fa-weight"></i> الوزن: ${m.weight || '--'} كجم</div>
                    
                    <div style="grid-column: span 2; color: ${hasDebt ? '#ff4d4d' : 'var(--success)'}; font-weight: bold; margin: 5px 0;">
                        <i class="fas fa-money-bill-wave"></i> المبلغ المتبقي: ${m.debt || 0} ج.م
                    </div>

                    <div style="grid-column: span 2; background: rgba(255,255,255,0.03); backdrop-filter: blur(5px); padding: 12px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; margin-top: 10px; border: 1px solid rgba(255,255,255,0.05);">
                        <span><i class="fas fa-check-circle" style="color:var(--success)"></i> الحصص: <b style="color: var(--accent); font-size:1.2rem;">${m.sessions || 0}</b></span>
                        <button onclick="markAttendance('${m.id}', ${m.sessions || 0})" class="btn-s" style="background: var(--primary); font-size:0.75rem; padding:5px 12px;">+ تسجيل حضور</button>
                    </div>

                    <div style="grid-column: span 2; margin-top:8px; font-size:0.8rem; display:flex; justify-content:space-between;">
                        <span>الحالة: <b style="color:${isAct?'var(--success)':'var(--danger)'}">${isAct?'نشط ✅':'منتهي ❌'}</b></span>
                        <span style="color:var(--text-dim)">رقم: ${m.phone}</span>
                    </div>
                </div>

                <div class="action-area" style="margin-top:10px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.05);">
                    <div class="contact-btns">
                        <a href="https://wa.me/2${m.phone}" target="_blank" style="color:#25d366;"><i class="fab fa-whatsapp"></i></a>
                        <a href="tel:${m.phone}"><i class="fas fa-phone-alt"></i></a>
                    </div>
                    <div class="control-btns" style="display: flex; gap: 8px;">
                        <button class="btn-s" onclick="showQR('${m.id}')" style="background: #252b39; border: 1px solid #3d4455; color: #fff;">
                            <i class="fas fa-qrcode"></i>
                        </button>
                        
                        <button class="btn-s" onclick="openEditModal('${m.id}')" style="background: #252b39; border: 1px solid #3d4455; color: #00f2fe;">
                            <i class="fas fa-edit"></i>
                        </button>
                        
                        <button class="btn-s" onclick="deleteMember('${m.id}')" style="background: #252b39; border: 1px solid #3d4455; color: #ff4d4d;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>`;
    });
}

// 8. تسجيل الحضور
function markAttendance(id, currentSessions) {
    db.collection("members").doc(id).update({ sessions: currentSessions + 1 });
}

// 9. نظام ماسح الـ QR والبروفايل الكامل
async function startScanner() {
    if (!html5QrcodeScanner) {
        html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
        html5QrcodeScanner.render(onScanSuccess);
    }
}

function stopScanner() {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().then(() => { html5QrcodeScanner = null; });
    }
}

// استقبال الـ QR وعرض البروفايل الكامل (بدون قص) مع معالجة المشترك الجديد
async function onScanSuccess(decodedText) {
    const scannedId = decodedText.trim();
    let member = allMembers.find(m => m.id === scannedId);
    
    const resultBox = document.getElementById('scan-result');
    const resultText = document.getElementById('result-text');

    if (!member) {
        try {
            const doc = await db.collection("members").doc(scannedId).get();
            if (doc.exists) {
                member = { id: doc.id, ...doc.data() };
            }
        } catch (err) {
            console.error("خطأ في جلب البيانات:", err);
        }
    }

    if (member) {
        stopScanner(); 
        const newCount = (member.sessions || 0) + 1;
        db.collection("members").doc(member.id).update({ sessions: newCount }).then(() => {
            const today = new Date().setHours(0,0,0,0);
            const isAct = new Date(member.endDate) >= today;

            resultText.innerHTML = `
                <div class="member-card" style="border: 1px solid rgba(197, 48, 48, 0.4); background: var(--card); text-align: right; opacity:1; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                    <div style="text-align:center; margin-bottom:15px;">
                        <h2 style="color:#fff; display: flex; align-items: center; justify-content: center; gap: 12px;">
                           <i class="fas fa-bolt" style="color: #00f2fe; filter: drop-shadow(0 0 8px #00f2fe);"></i>
                           ${member.name}
                        </h2>
                    </div>
                    
                    <div class="info-grid" style="border-top: 1px solid #333; padding-top:10px; font-size:0.9rem;">
                        <div><i class="fas fa-user-tie"></i> الكوتش: ${member.coach}</div>
                        <div><i class="fas fa-dumbbell"></i> النوع: ${member.type}</div>
                        <div><i class="fas fa-money-bill-wave"></i> المتبقي: ${member.debt || 0} ج.م</div>
                        <div style="grid-column: span 2;"><i class="fas fa-calendar-check"></i> انتهاء الاشتراك: ${member.endDate}</div>
                    </div>

                    <div style="background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(8px); margin-top:15px; padding:20px; border-radius:15px; text-align:center; border: 1px solid rgba(255, 255, 255, 0.1);">
                        <p style="color:var(--text-dim); font-size:0.85rem; margin-bottom:5px;">إجمالي الحصص المنفذة</p>
                        <b style="font-size:3.5rem; color:var(--accent); text-shadow: 0 0 20px rgba(229, 62, 62, 0.6);">${newCount}</b>
                    </div>

                    <div style="margin-top:15px; text-align:center;">
                        <span style="padding: 5px 20px; border-radius: 20px; background: ${isAct ? 'rgba(56,161,105,0.1)' : 'rgba(197,48,48,0.1)'}; color:${isAct ? 'var(--success)' : 'var(--danger)'}; font-weight:bold; border: 1px solid ${isAct ? 'var(--success)' : 'var(--danger)'};">
                            ${isAct ? 'الاشتراك ساري ✅' : 'الاشتراك منتهي ❌'}
                        </span>
                    </div>
                </div>
            `;
            resultBox.style.display = 'block';
        });
    } else {
        resultText.innerHTML = `<div class="member-card" style="border:2px solid var(--danger); text-align:center;"><h2>❌ غير مسجل أو محذوف!</h2></div>`;
        resultBox.style.display = 'block';
    }
}

function resetScanner() {
    document.getElementById('scan-result').style.display = 'none';
    startScanner();
}

// 10. البحث والفلترة 
function filterByStatus() {
    const status = document.getElementById('status-filter').value;
    const today = new Date().setHours(0,0,0,0);
    let filtered = allMembers;
    if (status === 'active') filtered = allMembers.filter(m => new Date(m.endDate) >= today);
    else if (status === 'expired') filtered = allMembers.filter(m => new Date(m.endDate) < today);
    else if (status === 'debts') filtered = allMembers.filter(m => (parseFloat(m.debt) || 0) > 0);
    renderList(filtered);
}

// البحث بالاسم أو برقم الهاتف
function searchMembers() {
    const q = document.getElementById('search-input').value.toLowerCase().trim();
    
    const filtered = allMembers.filter(m => {
        const nameMatch = m.name.toLowerCase().includes(q);
        const phoneMatch = m.phone.includes(q); // البحث برقم الهاتف
        return nameMatch || phoneMatch;
    });

    renderList(filtered);
}


// 11. وظائف إضافية - النسخة المحسنة لتوليد الـ QR
function showQR(id) {
    const qrContainer = document.getElementById('qrcode-display');
    
    // 1. مسح المحتوى القديم تماماً
    qrContainer.innerHTML = ''; 
    
    // 2. التأكد إن الـ ID موجود
    if (!id || id === "undefined" || id.trim() === "") {
        alert("خطأ: معرف المشترك غير مكتمل لتوليد الكود!");
        return;
    }

    // 3. إظهار المودال
    document.getElementById('qr-modal').style.display = 'block';

    // 4. الانتظار لحظة لضمان استقرار الـ DOM
    setTimeout(() => {
        try {
            new QRCode(qrContainer, {
                text: id.trim(), // الاعتماد على الـ ID الفريد
                width: 200,
                height: 200,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.M 
            });
        } catch (error) {
            console.error("QR Generation Error:", error);
            qrContainer.innerHTML = "<p style='color:red;'>عذراً، فشل توليد الكود. حاول مرة أخرى.</p>";
        }
    }, 100);
}

function closeModal() { document.getElementById('qr-modal').style.display = 'none'; }
function deleteMember(id) { if(confirm("حذف العضو؟")) db.collection("members").doc(id).delete(); }

function updateDash() {
    const today = new Date().setHours(0,0,0,0);
    
    // 1. حساب المشتركين النشطين
    const active = allMembers.filter(m => m.endDate && new Date(m.endDate) >= today).length;
    
    // 2. حساب المشتركين المنتهيين
    const expired = allMembers.length - active;
    
    // 3. حساب إجمالي الديون
    const totalDebt = allMembers.reduce((sum, m) => {
        return sum + (parseFloat(m.debt) || 0);
    }, 0);

    // 4. عرض كل النتائج في العدادات
    document.getElementById('total-clients').innerText = allMembers.length;
    document.getElementById('active-clients').innerText = active;
    document.getElementById('expired-clients').innerText = expired;
    document.getElementById('total-debts').innerText = totalDebt.toLocaleString() + " ج.م";
}

// 1. فتح المودال وملء البيانات القديمة للتعديل
function openEditModal(id) {
    const m = allMembers.find(member => member.id === id);
    if (!m) return;

    document.getElementById('edit-id').value = id;
    document.getElementById('edit-name').value = m.name;
    document.getElementById('edit-phone').value = m.phone;
    document.getElementById('edit-sub-type').value = m.type;
    document.getElementById('edit-coach').value = m.coach;
    document.getElementById('edit-height').value = m.height || '';
    document.getElementById('edit-weight').value = m.weight || '';
    document.getElementById('edit-debt').value = m.debt || 0;
    document.getElementById('edit-end-date').value = m.endDate;

    document.getElementById('edit-modal').style.display = 'block';
}

// 2. قفل المودال
function closeEditModal() {
    document.getElementById('edit-modal').style.display = 'none';
}

// 3. حفظ البيانات الجديدة في Firebase
function updateMemberData() {
    const id = document.getElementById('edit-id').value;
    const updatedData = {
        name: document.getElementById('edit-name').value,
        phone: document.getElementById('edit-phone').value,
        type: document.getElementById('edit-sub-type').value,
        coach: document.getElementById('edit-coach').value,
        height: document.getElementById('edit-height').value,
        weight: document.getElementById('edit-weight').value,
        debt: parseFloat(document.getElementById('edit-debt').value) || 0,
        endDate: document.getElementById('edit-end-date').value
    };

    db.collection("members").doc(id).update(updatedData)
    .then(() => {
        alert("تم تحديث بيانات البطل بنجاح! 🔥");
        closeEditModal();
    })
    .catch(err => alert("حدث خطأ أثناء التحديث: " + err));
}
function exportToExcel() {
    // تأكد إن allMembers هو اسم المصفوفة اللي فيها بيانات المشتركين عندك
    if (typeof allMembers === 'undefined' || allMembers.length === 0) {
        alert("عفواً، لا توجد بيانات لتصديرها!");
        return;
    }

    // تجهيز محتوى الملف (يدعم اللغة العربية)
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; 
    csvContent += "الاسم,رقم الهاتف,تاريخ الانتهاء,الديون\n"; // العناوين

    // إضافة بيانات كل مشترك في سطر
    allMembers.forEach(function(m) {
        let row = `${m.name || ''},${m.phone || ''},${m.expiryDate || m.endDate || ''},${m.debt || 0}`;
        csvContent += row + "\n";
    });

    // عملية التحميل
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `نسخة_بيانات_الجيم_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);

    link.click(); // ضغطة وهمية لبدء التحميل
    document.body.removeChild(link);
}
