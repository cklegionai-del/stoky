#!/usr/bin/env python3
import sqlite3
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def init_db():
    conn = sqlite3.connect('health.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        age INTEGER,
        conditions TEXT,
        notes TEXT
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS medications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        profile_id INTEGER,
        name TEXT,
        dosage TEXT,
        frequency TEXT,
        time_of_day TEXT,
        notes TEXT,
        active BOOLEAN DEFAULT 1,
        FOREIGN KEY(profile_id) REFERENCES profiles(id)
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS symptoms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        profile_id INTEGER,
        description TEXT,
        severity INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(profile_id) REFERENCES profiles(id)
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        profile_id INTEGER,
        role TEXT,
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(profile_id) REFERENCES profiles(id)
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        profile_id INTEGER,
        medication_id INTEGER,
        time TEXT,
        enabled BOOLEAN DEFAULT 1,
        FOREIGN KEY(profile_id) REFERENCES profiles(id)
    )''')
    conn.commit()
    conn.close()

init_db()

class Profile(BaseModel):
    name: str
    age: Optional[int] = None
    conditions: Optional[str] = None
    notes: Optional[str] = None

class Medication(BaseModel):
    name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    time_of_day: Optional[str] = None
    notes: Optional[str] = None

class Symptom(BaseModel):
    description: str
    severity: int

class ChatMessage(BaseModel):
    message: str

@app.get("/health")
def health():
    return {"status": "healthy", "service": "ElderCare Health Tracker API"}

@app.get("/profiles")
def get_profiles():
    conn = sqlite3.connect('health.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT id, name, age, conditions, notes FROM profiles")
    rows = c.fetchall()
    result = []
    for row in rows:
        d = dict(row)
        c2 = conn.cursor()
        c2.execute("SELECT COUNT(*) FROM medications WHERE profile_id=?", (row["id"],))
        d["medication_count"] = c2.fetchone()[0]
        c2.execute("SELECT COUNT(*) FROM symptoms WHERE profile_id=?", (row["id"],))
        d["symptom_count"] = c2.fetchone()[0]
        result.append(d)
    conn.close()
    return result

@app.post("/profiles")
def create_profile(profile: Profile):
    conn = sqlite3.connect('health.db')
    c = conn.cursor()
    c.execute("INSERT INTO profiles (name, age, conditions, notes) VALUES (?,?,?,?)",
              (profile.name, profile.age, profile.conditions, profile.notes))
    conn.commit()
    new_id = c.lastrowid
    conn.close()
    return {"id": new_id, **profile.dict()}

@app.get("/profiles/{profile_id}")
def get_profile(profile_id: int):
    conn = sqlite3.connect('health.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM profiles WHERE id=?", (profile_id,))
    row = c.fetchone()
    if not row:
        raise HTTPException(404)
    result = dict(row)
    conn.close()
    return result

@app.put("/profiles/{profile_id}")
def update_profile(profile_id: int, profile: Profile):
    conn = sqlite3.connect('health.db')
    c = conn.cursor()
    c.execute("UPDATE profiles SET name=?, age=?, conditions=?, notes=? WHERE id=?",
              (profile.name, profile.age, profile.conditions, profile.notes, profile_id))
    conn.commit()
    conn.close()
    return {"id": profile_id, **profile.dict()}

@app.delete("/profiles/{profile_id}")
def delete_profile(profile_id: int):
    conn = sqlite3.connect('health.db')
    c = conn.cursor()
    c.execute("DELETE FROM profiles WHERE id=?", (profile_id,))
    c.execute("DELETE FROM medications WHERE profile_id=?", (profile_id,))
    c.execute("DELETE FROM symptoms WHERE profile_id=?", (profile_id,))
    c.execute("DELETE FROM chat_messages WHERE profile_id=?", (profile_id,))
    conn.commit()
    conn.close()
    return {"deleted": profile_id}

@app.get("/profiles/{profile_id}/medications")
def get_medications(profile_id: int):
    conn = sqlite3.connect('health.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM medications WHERE profile_id=?", (profile_id,))
    rows = c.fetchall()
    result = [dict(row) for row in rows]
    conn.close()
    return result

@app.post("/profiles/{profile_id}/medications")
def add_medication(profile_id: int, med: Medication):
    conn = sqlite3.connect('health.db')
    c = conn.cursor()
    c.execute("""INSERT INTO medications 
        (profile_id, name, dosage, frequency, time_of_day, notes)
        VALUES (?,?,?,?,?,?)""",
        (profile_id, med.name, med.dosage, med.frequency, med.time_of_day, med.notes))
    conn.commit()
    new_id = c.lastrowid
    conn.close()
    return {"id": new_id, **med.dict()}

@app.put("/medications/{med_id}")
def update_medication(med_id: int, med: Medication):
    conn = sqlite3.connect('health.db')
    c = conn.cursor()
    c.execute("""UPDATE medications SET name=?, dosage=?, frequency=?, time_of_day=?, notes=?
                 WHERE id=?""",
              (med.name, med.dosage, med.frequency, med.time_of_day, med.notes, med_id))
    conn.commit()
    conn.close()
    return {"id": med_id, **med.dict()}

@app.delete("/medications/{med_id}")
def delete_medication(med_id: int):
    conn = sqlite3.connect('health.db')
    c = conn.cursor()
    c.execute("DELETE FROM medications WHERE id=?", (med_id,))
    conn.commit()
    conn.close()
    return {"deleted": med_id}

@app.get("/profiles/{profile_id}/symptoms")
def get_symptoms(profile_id: int):
    conn = sqlite3.connect('health.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM symptoms WHERE profile_id=? ORDER BY created_at DESC", (profile_id,))
    rows = c.fetchall()
    result = [dict(row) for row in rows]
    conn.close()
    return result

@app.post("/profiles/{profile_id}/symptoms")
def add_symptom(profile_id: int, symptom: Symptom):
    conn = sqlite3.connect('health.db')
    c = conn.cursor()
    c.execute("INSERT INTO symptoms (profile_id, description, severity) VALUES (?,?,?)",
              (profile_id, symptom.description, symptom.severity))
    conn.commit()
    new_id = c.lastrowid
    conn.close()
    return {"id": new_id, **symptom.dict()}

@app.get("/profiles/{profile_id}/chat")
def get_chat(profile_id: int):
    conn = sqlite3.connect('health.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM chat_messages WHERE profile_id=? ORDER BY created_at ASC", (profile_id,))
    rows = c.fetchall()
    result = [dict(row) for row in rows]
    conn.close()
    return result

@app.post("/profiles/{profile_id}/chat")
def send_chat_message(profile_id: int, msg: ChatMessage):
    # Store user message
    conn = sqlite3.connect('health.db')
    c = conn.cursor()
    c.execute("INSERT INTO chat_messages (profile_id, role, content) VALUES (?,?,?)",
              (profile_id, "user", msg.message))
    # For now, echo a simple response (in real app, call Ollama)
    bot_reply = f"Thank you for your question about: {msg.message}. I'm a demo AI. Connect to Ollama for real answers."
    c.execute("INSERT INTO chat_messages (profile_id, role, content) VALUES (?,?,?)",
              (profile_id, "bot", bot_reply))
    conn.commit()
    conn.close()
    return {"response": bot_reply}

@app.get("/export")
def export_all():
    conn = sqlite3.connect('health.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM profiles")
    profiles = [dict(row) for row in c.fetchall()]
    c.execute("SELECT * FROM medications")
    meds = [dict(row) for row in c.fetchall()]
    c.execute("SELECT * FROM symptoms")
    syms = [dict(row) for row in c.fetchall()]
    c.execute("SELECT * FROM chat_messages")
    chats = [dict(row) for row in c.fetchall()]
    conn.close()
    return {"profiles": profiles, "medications": meds, "symptoms": syms, "chat_messages": chats}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=9003)
