from flask import Flask, render_template, request, jsonify, send_file
import firebase_admin
from firebase_admin import credentials, db
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
import os, uuid, datetime

# ----------------------------------
# BASIC APP SETUP
# ----------------------------------
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

app = Flask(
    __name__,
    template_folder=os.path.join(BASE_DIR, "templates"),
    static_folder=os.path.join(BASE_DIR, "static")
)

# ----------------------------------
# FIREBASE INIT
# ----------------------------------
cred = credentials.Certificate(os.path.join(BASE_DIR, "firebase_key.json"))
firebase_admin.initialize_app(cred, {
    "databaseURL": "https://safechat-e5a84-default-rtdb.firebaseio.com/"
})
chat_ref = db.reference("chats")

# ----------------------------------
# FOLDERS
# ----------------------------------
EVIDENCE_DIR = os.path.join(BASE_DIR, "evidence")
FIR_DIR = os.path.join(EVIDENCE_DIR, "fir")
os.makedirs(FIR_DIR, exist_ok=True)

# ----------------------------------
# HARASSMENT DETECTION
# ----------------------------------
def detect_harassment(message):
    msg = message.lower()
    abuse_words = ["stupid", "idiot", "fool", "dumb", "moron", "ugly", "loser","sex","nude","bitch","fuck"]
    threat_words = ["kill", "die", "murder", "destroy", "attack", "hurt", "poison", "shoot", "beat", "harm"]

    # Check threats first
    for word in threat_words:
        if word in msg:
            return True, "Threat", [
                {"section": "IPC 506", "description": "Criminal intimidation"},
                {"section": "IPC 507", "description": "Anonymous threats"}
            ]

    # Check abuse
    for word in abuse_words:
        if word in msg:
            return True, "Verbal Abuse", [
                {"section": "IPC 294", "description": "Obscene acts and songs"}
            ]

    return False, None, []

# ----------------------------------
# FIR GENERATOR (TEXT + PDF)
# ----------------------------------

def generate_fir_text(message, category, ipc_list):

    if not message:
        message = "Not provided"

    if not category:
        category = "Harassment (Unspecified)"

    if not ipc_list:
        ipc_list = [{"section": "IPC 509", "description": "Insulting modesty"}]

    ipc_text = ""
    for ipc in ipc_list:
        ipc_text += f"{ipc['section']} - {ipc['description']}\n"

    fir = f"""
CYBER CRIME POLICE STATION
---------------------------------------

Date: {datetime.datetime.now().strftime('%d-%m-%Y %H:%M:%S')}

SUBJECT:
Complaint regarding online harassment

MESSAGE CONTENT:
"{message}"

CATEGORY OF OFFENCE:
{category}

APPLICABLE IPC / IT ACT SECTIONS:
{ipc_text}

STATEMENT:
The above act constitutes a cognizable offence under the Indian Penal Code
and Information Technology Act. The accused intentionally caused mental
harassment and fear using electronic communication.

I kindly request the concerned authority to register this complaint and
initiate legal action.

Place: Erode
Complainant Name: Ayesha Samra
Signature: _____ayesha________
"""
    return fir

def generate_fir_pdf(fir_text):
    filename = f"FIR_{uuid.uuid4().hex}.pdf"
    pdf_path = os.path.join(FIR_DIR, filename)

    c = canvas.Canvas(pdf_path, pagesize=A4)
    width, height = A4

    y = height - 40
    for line in fir_text.split("\n"):
        c.drawString(40, y, line)
        y -= 15
        if y < 40:
            c.showPage()
            y = height - 40

    c.save()
    return pdf_path
  

# ----------------------------------
# ROUTES
# ----------------------------------
@app.route("/")
def home():
    return "✅ SafeChat Backend Running"

@app.route("/sender")
def sender():
    return render_template("sender.html")

@app.route("/admin")
def admin():
    return render_template("admin.html")

# ----------------------------------
# SEND MESSAGE
# ----------------------------------
@app.route("/send", methods=["POST"])
def send():
    data = request.json
    print("🔥 DATA RECEIVED:", data)

    message = data.get("message")
    from_user = data.get("from")
    to_user = data.get("to")

    print("🔥 MESSAGE:", message)

    harassment, category, ipc = detect_harassment(message)

    print("🔥 HARASSMENT:", harassment, category, ipc)

    chat_ref.push({
        "from": from_user,
        "to": to_user,
        "message": message,
        "harassment": harassment,
        "category": category,
        "ipc": ipc,
        "time": str(datetime.datetime.now())
    })

    return jsonify({"status": "ok", "harassment": harassment})

# ----------------------------------
# ANALYZE ONLY
# ----------------------------------
@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.json
    message = data.get("message", "")

    harassment, category, ipc = detect_harassment(message)

    return jsonify({
        "harassment": harassment,
        "category": category,
        "ipc": ipc
    })

# ----------------------------------
# FIR GENERATION
# ----------------------------------
@app.route("/fir", methods=["POST"])
def fir():
    data = request.json
    message = data.get("message")
    category = data.get("category")
    ipc = data.get("ipc", [])

    fir_text = generate_fir_text(message, category, ipc)
    pdf_path = generate_fir_pdf(fir_text)

    return send_file(pdf_path, as_attachment=True)

# ----------------------------------
# GET ALL MESSAGES
# ----------------------------------
@app.route("/messages")
def messages():
    return jsonify(chat_ref.get())

# ----------------------------------
if __name__ == "__main__":
    app.run(debug=True)