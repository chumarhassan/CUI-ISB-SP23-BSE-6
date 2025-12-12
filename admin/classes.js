//hammad anwar Sp23-bse-014
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// --- SCHEMAS (Based on assignment requirements) ---
// 1. User Schema (needed to find the teacher's name)
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    role: String
});
const User = mongoose.models.User || mongoose.model('User', userSchema);

// 2. Class Schema
const classSchema = new mongoose.Schema({
    classname: String,
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: Date
});
const Class = mongoose.models.Class || mongoose.model('Class', classSchema);


// --- YOUR ROUTE ---
// GET /admin/classes
// Fetches list of all classes, returns class name, assigned teacher, total students.
router.get('/classes', async (req, res) => {
    try {
        // Find all classes and populate the teacher field to get the name
        const classes = await Class.find().populate('teacher', 'name');

        const formattedClasses = classes.map(cls => {
            return {
                _id: cls._id,
                classname: cls.classname,
                // If teacher is assigned, show name. If not, show "Unassigned"
                teacher: cls.teacher ? cls.teacher.name : 'Unassigned',
                // Count the number of students in the array
                totalStudents: cls.students ? cls.students.length : 0
            };
        });

        res.json(formattedClasses);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});

module.exports = router;