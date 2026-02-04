// admin.js
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const chatsRef = firebase.database().ref("chats");

// ==========================================
// 2. UI ELEMENTS
// ==========================================
const chat = document.getElementById("chat");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const themeToggle = document.getElementById("themeToggle");
const emojiBtn = document.getElementById("emojiBtn");
const emojiPicker = document.getElementById("emojiPicker");
const panicBtn = document.getElementById("panicBtn");
const exportBtn = document.getElementById("exportBtn");

// ==========================================
// 3. SEND MESSAGE (ADMIN → SENDER)
// ==========================================
sendBtn.onclick = () => {
    const text = messageInput.value.trim();
    if (!text) return;

    const id = messagesRef.push().key;
    messagesRef.child(id).set({
        id,
        text,
        sender: "ADMIN",
        role: "admin",
        time: Date.now(),
        deleted: false,
        analyzed: true,
        harassment: false
    });

    messageInput.value = "";
};

// ==========================================
// 4. REAL-TIME MESSAGE LISTENER
// ==========================================
chatsRef.on("child_added", snap => {
    const m = snap.val();

    const div = document.createElement("div");
    div.className = "msg receiver";

    let html = `<div class="text">${m.message}</div>`;

    if (m.harassment === true) {
        html += `
        <div class="alert-box">
            ⚠ <b>HARASSMENT DETECTED</b><br><br>

            <b>Category:</b> ${m.category}<br><br>

            <b>IPC Sections:</b><br>
            ${m.ipc.map(i => `• ${i.section} - ${i.description}`).join("<br>")}
            <br><br>

            <b>Helpline:</b>
            <a href="tel:1903">1903 Women Helpline</a><br><br>

            <b>Government / NGO:</b><br>
            <a href="https://www.ncw.nic.in" target="_blank">National Commission for Women</a><br>
            <a href="https://cybercrime.gov.in" target="_blank">Cyber Crime Portal</a><br><br>

            <button onclick='generateFIR(
                "${m.message}",
                "${m.category}",
                "${encodeURIComponent(JSON.stringify(m.ipc))}"
            )'>
                📄 Generate FIR
            </button>
        </div>`;
    }

    div.innerHTML = html;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;

    const deleteBtn = document.createElement("button");
deleteBtn.innerText = "🗑 Delete";
deleteBtn.className = "delete-btn";

deleteBtn.onclick = () => {
    messagesRef.child(m.id).update({
        deleted: true
   
})
   
};
});

// ==========================================
// 5. FIR GENERATION
// ==========================================
function generateFIR(message, category, ipc_json) {
    const ipc = JSON.parse(decodeURIComponent(ipc_json));
    fetch("/fir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, category, ipc })
    })
    .then(res => res.blob())
    .then(blob => {
        const a = document.createElement("a");
        a.href = window.URL.createObjectURL(blob);
        a.download = "FIR.pdf";
        a.click();
    });
}
document.getElementById("panicBtn").onclick = () => {
    const emergencyMsg =
      "🚨 EMERGENCY ALERT 🚨\n" +
      "I am facing online harassment.\n" +
      "Please help immediately.\n\n" +
      "Location: Erode\n" +
      "Project: SafeChat";

    const phone = "919080960536"; // change to guardian / police number

    const url =
      `https://wa.me/${phone}?text=${encodeURIComponent(emergencyMsg)}`;

    window.open(url, "_blank");
};
// ==========================================
// 6. UX FEATURES
// ==========================================

// Theme toggle
if (localStorage.getItem("theme") === "dark") document.body.classList.add("dark");
themeToggle.onclick = () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("theme",
        document.body.classList.contains("dark") ? "dark" : "light");
};

// Emoji picker
["😀","😡","😂","😍","😢","👍","👎","🙏","💔","❤️"].forEach(e => {
    const span = document.createElement("span");
    span.innerText = e;
    span.style.cursor = "pointer";
    span.onclick = () => {
        messageInput.value += e;
        emojiPicker.style.display = "none";
    };
    emojiPicker.appendChild(span);
});
emojiBtn.onclick = () =>
    emojiPicker.style.display =
        emojiPicker.style.display === "flex" ? "none" : "flex";

// Panic alert

if (panicBtn) {
    panicBtn.addEventListener("click", () => {

        const msg =
            "🚨 EMERGENCY ALERT 🚨\n" +
            "Harassment detected in SafeChat.\n" +
            "Immediate assistance required.\n" +
            "Please respond urgently.";

        // ✅ REAL WhatsApp number (must be registered on WhatsApp)
        const phone = "917200281997"; // example: 91 + 10-digit Indian number

        const whatsappURL =
            "https://wa.me/" + phone + "?text=" + encodeURIComponent(msg);

        // ✅ SAFE REDIRECT (no popup block)
        window.location.href = whatsappURL;
    });
}

console.log("✅ Admin JS loaded");
// Export chat
exportBtn.onclick = () => {
    let text = "";
    document.querySelectorAll(".msg").forEach(m => text += m.innerText + "\n");
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "chat_history.txt";
    a.click();
};

console.log("✅ Admin JS loaded");

