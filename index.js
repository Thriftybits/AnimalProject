const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const HTTP_PORT = 8000;
const dbSource = 'animals.db';

// ========================================================
// SERVER SETUP
// ========================================================

const app = express();

// INCREASED LIMIT: Allows large photos to be saved
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve frontend files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Start Server
app.listen(HTTP_PORT, () => {
    console.log(`Server running on port ${HTTP_PORT}`);
});

// Connect to Database
const db = new sqlite3.Database(dbSource, onDatabaseConnect);

// ========================================================
// ROUTES (The "API" that app.js talks to)
// ========================================================

// 1. GET ALL ANIMALS
app.get('/animals', (req, res) => {
    const strCommand = "SELECT * FROM tblAnimals";
    db.all(strCommand, [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.status(200).json({ "message": "success", "data": rows });
    });
});

// 2. SAVE NEW ANIMAL
app.post('/animals', (req, res) => {
    const newId = uuidv4();
    const data = req.body; // Data sent from app.js

    const strCommand = `INSERT INTO tblAnimals (
        id, type, name, breed, sex, birthdate, weight, size, animalId, location, 
        description, notes, vetName, visitType, visitNotes, feedingTime, feedingAmount, feedingWhat, photo
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

    const params = [
        newId, data.type, data.name, data.breed, data.sex, data.birthdate, data.weight, data.size, 
        data.animalId, data.location, data.description, data.notes, data.vetName, 
        data.visitType, data.visitNotes, data.feedingTime, data.feedingAmount, data.feedingWhat, data.photo
    ];

    db.run(strCommand, params, function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.status(201).json({ "message": "success", "id": newId });
    });
});

// 3. UPDATE ANIMAL
app.put('/animals', (req, res) => {
    const data = req.body;
    const id = data.id;

    const strCommand = `UPDATE tblAnimals SET 
        type = ?, name = ?, breed = ?, sex = ?, birthdate = ?, weight = ?, size = ?, animalId = ?, 
        location = ?, description = ?, notes = ?, vetName = ?, visitType = ?, 
        visitNotes = ?, feedingTime = ?, feedingAmount = ?, feedingWhat = ?, photo = ?
        WHERE id = ?`;

    const params = [
        data.type, data.name, data.breed, data.sex, data.birthdate, data.weight, data.size, 
        data.animalId, data.location, data.description, data.notes, data.vetName, 
        data.visitType, data.visitNotes, data.feedingTime, data.feedingAmount, data.feedingWhat, data.photo,
        id
    ];

    db.run(strCommand, params, function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.status(200).json({ "message": "success", "changes": this.changes });
    });
});

// 4. DELETE ANIMAL
app.delete('/animals', (req, res) => {
    const id = req.body.id;
    const strCommand = "DELETE FROM tblAnimals WHERE id = ?";
    
    db.run(strCommand, id, function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.status(200).json({ "message": "deleted", "changes": this.changes });
    });
});

// ========================================================
// DATABASE HELPERS
// ========================================================

function onDatabaseConnect(err) {
    if (err) {
        console.error("Error connecting to database: " + err.message);
    } else {
        console.log('Connected to the SQLite database.');
        createTables();
    }
}

function createTables() {
    const animalTableSql = `
        CREATE TABLE IF NOT EXISTS tblAnimals (
            id TEXT PRIMARY KEY,
            type TEXT, name TEXT, breed TEXT, sex TEXT, birthdate TEXT, weight TEXT, size TEXT,
            animalId TEXT, location TEXT, description TEXT, notes TEXT, vetName TEXT,
            visitType TEXT, visitNotes TEXT, feedingTime TEXT, feedingAmount TEXT, feedingWhat TEXT,
            photo TEXT
        )`;

    db.run(animalTableSql, (err) => {
        if (err) console.error("Error creating table: " + err.message);
        else console.log('Table tblAnimals created or already exists.');
    });
