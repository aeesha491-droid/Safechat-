//sender.js

// ==========================================
// 1. FIREBASE CONFIG
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyDUYEjc1F4L9Stju8l5PPbudoca4bJMi4U",
  authDomain: "safechat-e5a84.firebaseapp.com",
  databaseURL: "https://safechat-e5a84-default-rtdb.firebaseio.com",
  projectId: "safechat-e5a84",
  storageBucket: "safechat-e5a84.firebasestorage.app",
  messagingSenderId: "384738679836",
  appId: "1:384738679836:web:ce66fbad27b880978553d9",
  measurementId: "G-DTHKFW876F"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const messagesRef = db.ref("messages");

// ==========================================
// 2. UI ELEMENTS
// ==========================================
const chat = document.getElementById("chat");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const themeToggle = document.getElementById("themeToggle");
const emojiBtn = document.getElementById("emojiBtn");
const emojiPicker = document.getElementById("emojiPicker");

// ==========================================
// 3. SEND MESSAGE (SENDER → ADMIN)
// ==========================================
sendBtn.onclick = () => {
    const text = messageInput.value.trim();
    if (!text) return;

    fetch("/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            message: text,
            from: "sender",
            to: "admin"
        })
    })
    .then(res => res.json())
    .then(data => {
        console.log("Sent to backend:", data);
        messageInput.value = "";
    })
    .catch(err => console.error(err));
};

console.log("✅ Sender JS loaded");
// ==========================================
// 4. REAL-TIME MESSAGE LISTENER
// ==========================================
messagesRef.on("child_added", snap => {
    const m = snap.val();
    if (!m || m.deleted) return;

    const div = document.createElement("div");
    div.className = `msg ${m.role === "sender" ? "sender" : "receiver"}`;
    div.id = m.id;

    div.innerHTML = `<div class="text">${m.text}</div>
                     <div class="time">${new Date(m.time).toLocaleTimeString()}</div>`;

    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
    const deleteBtn = document.createElement("button");
deleteBtn.innerText = "🗑 Delete";
deleteBtn.className = "delete-btn";

deleteBtn.onclick = () => {
    messagesRef.child(m.id).update({
        deleted: true
   
    });
};
});

// ==========================================
// 5. UX FEATURES
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

console.log("✅ Sender JS loaded");
