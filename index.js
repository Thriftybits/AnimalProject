const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const HTTP_PORT = 8000;
const dbSource = 'animals.db';

const app = express();

app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(express.static(__dirname));

app.listen(HTTP_PORT, () => {
    console.log(`[Server] Running on port ${HTTP_PORT}`);
});

const db = new sqlite3.Database(dbSource, (err) => {
    if (err) {
        console.error('[Server] DB Connection Error:', err.message);
    } else {
        console.log('[Server] Connected to SQLite database.');
        createTables();
    }
});

function createTables() {
    const animalTableSql = `
        CREATE TABLE IF NOT EXISTS tblAnimals (
            id TEXT PRIMARY KEY,
            type TEXT, name TEXT, breed TEXT, sex TEXT, 
            birthdate TEXT, birthdateUnknown TEXT, 
            weight TEXT, size TEXT,
            animalId TEXT, location TEXT, description TEXT, notes TEXT, vetName TEXT,
            visitType TEXT, visitNotes TEXT, feedingTime TEXT, feedingAmount TEXT, feedingWhat TEXT,
            photo TEXT
        )`;
    db.run(animalTableSql, (err) => {
        if (err) console.error("[Server] Table Error:", err.message);
    });
}

app.get('/animals', (req, res) => {
    console.log("[Server] GET Request received.");
    db.all("SELECT * FROM tblAnimals", [], (err, rows) => {
        if (err) return res.status(400).json({ "error": err.message });
        res.status(200).json({ "message": "success", "data": rows });
    });
});

app.post('/animals', (req, res) => {
    console.log("[Server] POST Request (Saving animal)...");
    const newId = uuidv4();
    const data = req.body;
    
    const isUnknown = data.birthdateUnknown ? "true" : "false";

    const params = [
        newId, data.type, data.name, data.breed, data.sex, 
        data.birthdate, isUnknown,
        data.weight, data.size, 
        data.animalId, data.location, data.description, data.notes, data.vetName, 
        data.visitType, data.visitNotes, data.feedingTime, data.feedingAmount, data.feedingWhat, data.photo
    ];

    const sql = `INSERT INTO tblAnimals (id, type, name, breed, sex, birthdate, birthdateUnknown, weight, size, animalId, location, description, notes, vetName, visitType, visitNotes, feedingTime, feedingAmount, feedingWhat, photo) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

    db.run(sql, params, function (err) {
        if (err) {
            console.error("[Server] Save Failed:", err.message);
            res.status(400).json({ "error": err.message });
            return;
        }
        console.log(`[Server] Saved successfully. ID: ${newId}`);
        res.status(201).json({ "message": "success", "id": newId });
    });
});

app.put('/animals', (req, res) => {
    console.log("[Server] PUT Request (Updating)...");
    const data = req.body;
    
    const isUnknown = data.birthdateUnknown ? "true" : "false";

    const params = [
        data.type, data.name, data.breed, data.sex, 
        data.birthdate, isUnknown,
        data.weight, data.size, 
        data.animalId, data.location, data.description, data.notes, data.vetName, 
        data.visitType, data.visitNotes, data.feedingTime, data.feedingAmount, data.feedingWhat, data.photo,
        data.id
    ];
    
    const sql = `UPDATE tblAnimals SET type=?, name=?, breed=?, sex=?, birthdate=?, birthdateUnknown=?, weight=?, size=?, animalId=?, location=?, description=?, notes=?, vetName=?, visitType=?, visitNotes=?, feedingTime=?, feedingAmount=?, feedingWhat=?, photo=? WHERE id=?`;

    db.run(sql, params, function (err) {
        if (err) return res.status(400).json({ "error": err.message });
        res.status(200).json({ "message": "success", "changes": this.changes });
    });
});

app.delete('/animals', (req, res) => {
    console.log("[Server] DELETE Request...");
    const id = req.body.id;
    db.run("DELETE FROM tblAnimals WHERE id = ?", id, function (err) {
        if (err) return res.status(400).json({ "error": err.message });
        res.status(200).json({ "message": "deleted", "changes": this.changes });
    });
});