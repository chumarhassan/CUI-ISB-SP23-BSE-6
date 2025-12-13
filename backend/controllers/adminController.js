const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User, Class, Quiz, Assignment, Material, Marks } = require('../models');
const { successResponse, errorResponse, getPagination, getPaginationMeta } = require('../utils/helpers');

/**
 * @desc    Get admin dashboard statistics
 * @route   GET /api/admin/dashboard
 * @access  Private/Admin
 */
const getDashboard = async (req, res) => {
  try {
    const [
      totalUsers,
      totalTeachers,
      totalStudents,
      totalClasses,
      totalQuizzes,
      totalAssignments,
      totalMaterials
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'teacher' }),
      User.countDocuments({ role: 'student' }),
      Class.countDocuments(),
      Quiz.countDocuments(),
      Assignment.countDocuments(),
      Material.countDocuments()
    ]);

    // Recent activities
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role createdAt');

    const recentClasses = await Class.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('teacher', 'name')
      .select('classname teacher studentCount createdAt');

    return successResponse(res, 'Dashboard data retrieved', {
      statistics: {
        totalUsers,
        totalTeachers,
        totalStudents,
        totalClasses,
        totalQuizzes,
        totalAssignments,
        totalMaterials
      },
      recentUsers,
      recentClasses
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    return errorResponse(res, 'Server error', 500);
  }
};

/**
 * @desc    Add new teacher
 * @route   POST /api/admin/addteacher
 * @access  Private/Admin
 */
const addTeacher = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password) {
      return errorResponse(res, 'Name, email, and password are required', 400);
    }

    // Check if email exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return errorResponse(res, 'Email already exists', 400);
    }

    // Create teacher
    const teacher = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'teacher',
      phone: phone || null,
      address: address || null
    });

    return successResponse(res, 'Teacher added successfully', { 
      teacher: {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        role: teacher.role
      }
    }, 201);

  } catch (error) {
    console.error('Add teacher error:', error);
    return errorResponse(res, error.message || 'Server error', 500);
  }
};

/**
 * @desc    Add new student
 * @route   POST /api/admin/addstudent
 * @access  Private/Admin
 */
const addStudent = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password) {
      return errorResponse(res, 'Name, email, and password are required', 400);
    }

    // Check if email exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return errorResponse(res, 'Email already exists', 400);
    }

    // Create student
    const student = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'student',
      phone: phone || null,
      address: address || null
    });

    return successResponse(res, 'Student added successfully', { 
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        role: student.role
      }
    }, 201);

  } catch (error) {
    console.error('Add student error:', error);
    return errorResponse(res, error.message || 'Server error', 500);
  }
};

/**
 * @desc    Add new class
 * @route   POST /api/admin/addclass
 * @access  Private/Admin
 */
const addClass = async (req, res) => {
  try {
    const { classname, description, maxStudents, semester, academicYear } = req.body;

    if (!classname) {
      return errorResponse(res, 'Class name is required', 400);
    }

    const newClass = await Class.create({
      classname,
      description: description || '',
      maxStudents: maxStudents || 50,
      semester: semester || null,
      academicYear: academicYear || new Date().getFullYear().toString()
    });

    return successResponse(res, 'Class created successfully', { class: newClass }, 201);

  } catch (error) {
    console.error('Add class error:', error);
    return errorResponse(res, error.message || 'Server error', 500);
  }
};

/**
 * @desc    Delete teacher
 * @route   DELETE /api/admin/teacher/:id
 * @access  Private/Admin
 */
const deleteTeacher = async (req, res) => {
  try {
    const teacherId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      return errorResponse(res, 'Invalid teacher ID', 400);
    }

    const teacher = await User.findOne({ _id: teacherId, role: 'teacher' });

    if (!teacher) {
      return errorResponse(res, 'Teacher not found', 404);
    }

    // Remove teacher from all classes
    await Class.updateMany(
      { teacher: teacherId },
      { $unset: { teacher: '' } }
    );

    // Delete teacher
    await User.findByIdAndDelete(teacherId);

    return successResponse(res, 'Teacher deleted successfully');

  } catch (error) {
    console.error('Delete teacher error:', error);
    return errorResponse(res, 'Server error', 500);
  }
};

/**
 * @desc    Delete student
 * @route   DELETE /api/admin/student/:id
 * @access  Private/Admin
 */
const deleteStudent = async (req, res) => {
  try {
    const studentId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return errorResponse(res, 'Invalid student ID', 400);
    }

    const student = await User.findOne({ _id: studentId, role: 'student' });

    if (!student) {
      return errorResponse(res, 'Student not found', 404);
    }

    // Remove student from all classes
    await Class.updateMany(
      { students: studentId },
      { $pull: { students: studentId } }
    );

    // Delete student
    await User.findByIdAndDelete(studentId);

    return successResponse(res, 'Student deleted successfully');

  } catch (error) {
    console.error('Delete student error:', error);
    return errorResponse(res, 'Server error', 500);
  }
};

/**
 * @desc    Delete class
 * @route   DELETE /api/admin/class/:id
 * @access  Private/Admin
 */
const deleteClass = async (req, res) => {
  try {
    const classId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return errorResponse(res, 'Invalid class ID', 400);
    }

    const classDoc = await Class.findById(classId);

    if (!classDoc) {
      return errorResponse(res, 'Class not found', 404);
    }

    // Remove class reference from teacher
    if (classDoc.teacher) {
      await User.updateOne(
        { _id: classDoc.teacher },
        { $pull: { assignedClasses: classId } }
      );
    }

    // Remove class reference from students
    if (classDoc.students && classDoc.students.length > 0) {
      await User.updateMany(
        { _id: { $in: classDoc.students } },
        { $pull: { assignedClasses: classId } }
      );
    }

    // Delete related content
    await Promise.all([
      Quiz.deleteMany({ classId }),
      Assignment.deleteMany({ classId }),
      Material.deleteMany({ classId }),
      Marks.deleteMany({ classId })
    ]);

    // Delete class
    await Class.findByIdAndDelete(classId);

    return successResponse(res, 'Class deleted successfully');

  } catch (error) {
    console.error('Delete class error:', error);
    return errorResponse(res, 'Server error', 500);
  }
};

/**
 * @desc    Update class
 * @route   PUT /api/admin/class/:id
 * @access  Private/Admin
 */
const updateClass = async (req, res) => {
  try {
    const classId = req.params.id;
    const { classname, description, teacher, students, maxStudents, semester, academicYear, isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return errorResponse(res, 'Invalid class ID', 400);
    }

    const existingClass = await Class.findById(classId);

    if (!existingClass) {
      return errorResponse(res, 'Class not found', 404);
    }

    // Build update object
    const updateData = {};
    if (classname !== undefined) updateData.classname = classname;
    if (description !== undefined) updateData.description = description;
    if (teacher !== undefined) updateData.teacher = teacher;
    if (students !== undefined) updateData.students = students;
    if (maxStudents !== undefined) updateData.maxStudents = maxStudents;
    if (semester !== undefined) updateData.semester = semester;
    if (academicYear !== undefined) updateData.academicYear = academicYear;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedClass = await Class.findByIdAndUpdate(
      classId,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('teacher', 'name email')
    .populate('students', 'name email');

    return successResponse(res, 'Class updated successfully', { class: updatedClass });

  } catch (error) {
    console.error('Update class error:', error);
    return errorResponse(res, error.message || 'Server error', 500);
  }
};

/**
 * @desc    Assign teacher to class
 * @route   PUT /api/admin/assignteacher/:id
 * @access  Private/Admin
 */
const assignTeacher = async (req, res) => {
  try {
    const classId = req.params.id;
    const { teacherId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(classId) || !mongoose.Types.ObjectId.isValid(teacherId)) {
      return errorResponse(res, 'Invalid class or teacher ID', 400);
    }

    const [classDoc, teacher] = await Promise.all([
      Class.findById(classId),
      User.findOne({ _id: teacherId, role: 'teacher' })
    ]);

    if (!classDoc) {
      return errorResponse(res, 'Class not found', 404);
    }

    if (!teacher) {
      return errorResponse(res, 'Teacher not found', 404);
    }

    // Remove class from previous teacher if exists
    if (classDoc.teacher) {
      await User.updateOne(
        { _id: classDoc.teacher },
        { $pull: { assignedClasses: classId } }
      );
    }

    // Assign new teacher
    classDoc.teacher = teacherId;
    await classDoc.save();

    // Add class to teacher's assigned classes
    await User.updateOne(
      { _id: teacherId },
      { $addToSet: { assignedClasses: classId } }
    );

    const updatedClass = await Class.findById(classId)
      .populate('teacher', 'name email')
      .populate('students', 'name email');

    return successResponse(res, 'Teacher assigned successfully', { class: updatedClass });

  } catch (error) {
    console.error('Assign teacher error:', error);
    return errorResponse(res, 'Server error', 500);
  }
};

/**
 * @desc    Assign students to class
 * @route   PUT /api/admin/assignstudent/:id
 * @access  Private/Admin
 */
const assignStudents = async (req, res) => {
  try {
    const classId = req.params.id;
    let { studentId, studentIds } = req.body;

    // Normalize to array
    let studentsToAssign = [];
    if (Array.isArray(studentIds) && studentIds.length > 0) {
      studentsToAssign = studentIds;
    } else if (studentId) {
      studentsToAssign = [studentId];
    } else {
      return errorResponse(res, 'Provide studentId or studentIds', 400);
    }

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return errorResponse(res, 'Invalid class ID', 400);
    }

    // Validate student IDs
    const invalidId = studentsToAssign.some(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidId) {
      return errorResponse(res, 'One or more invalid student IDs', 400);
    }

    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return errorResponse(res, 'Class not found', 404);
    }

    // Find valid students
    const validStudents = await User.find({
      _id: { $in: studentsToAssign },
      role: 'student'
    }).select('_id');

    if (!validStudents.length) {
      return errorResponse(res, 'No valid students found', 404);
    }

    const validIds = validStudents.map(s => s._id);

    // Add students to class
    await Class.updateOne(
      { _id: classId },
      { $addToSet: { students: { $each: validIds } } }
    );

    // Add class to students' assigned classes
    await User.updateMany(
      { _id: { $in: validIds } },
      { $addToSet: { assignedClasses: classId } }
    );

    const updatedClass = await Class.findById(classId)
      .populate('students', 'name email')
      .populate('teacher', 'name email');

    return successResponse(res, 'Students assigned successfully', {
      class: updatedClass,
      studentsAssigned: validIds.length
    });

  } catch (error) {
    console.error('Assign students error:', error);
    return errorResponse(res, 'Server error', 500);
  }
};

/**
 * @desc    Remove student from class
 * @route   DELETE /api/admin/class/:classId/student/:studentId
 * @access  Private/Admin
 */
const removeStudentFromClass = async (req, res) => {
  try {
    const { classId, studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(classId) || !mongoose.Types.ObjectId.isValid(studentId)) {
      return errorResponse(res, 'Invalid IDs', 400);
    }

    // Remove student from class
    await Class.updateOne(
      { _id: classId },
      { $pull: { students: studentId } }
    );

    // Remove class from student's assigned classes
    await User.updateOne(
      { _id: studentId },
      { $pull: { assignedClasses: classId } }
    );

    return successResponse(res, 'Student removed from class');

  } catch (error) {
    console.error('Remove student error:', error);
    return errorResponse(res, 'Server error', 500);
  }
};

/**
 * @desc    Get all teachers
 * @route   GET /api/admin/teachers
 * @access  Private/Admin
 */
const getAllTeachers = async (req, res) => {
  try {
    const { page, limit } = getPagination(req.query.page, req.query.limit);

    const [teachers, total] = await Promise.all([
      User.find({ role: 'teacher' })
        .populate('assignedClasses', 'classname')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments({ role: 'teacher' })
    ]);

    return successResponse(res, 'Teachers retrieved', {
      teachers
    }, 200, getPaginationMeta(total, page, limit));

  } catch (error) {
    console.error('Get teachers error:', error);
    return errorResponse(res, 'Server error', 500);
  }
};

/**
 * @desc    Get all students
 * @route   GET /api/admin/students
 * @access  Private/Admin
 */
const getAllStudents = async (req, res) => {
  try {
    const { page, limit } = getPagination(req.query.page, req.query.limit);

    const [students, total] = await Promise.all([
      User.find({ role: 'student' })
        .populate('assignedClasses', 'classname')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments({ role: 'student' })
    ]);

    return successResponse(res, 'Students retrieved', {
      students
    }, 200, getPaginationMeta(total, page, limit));

  } catch (error) {
    console.error('Get students error:', error);
    return errorResponse(res, 'Server error', 500);
  }
};

/**
 * @desc    Get all classes
 * @route   GET /api/admin/classes
 * @access  Private/Admin
 */
const getAllClasses = async (req, res) => {
  try {
    const { page, limit } = getPagination(req.query.page, req.query.limit);

    const [classes, total] = await Promise.all([
      Class.find()
        .populate('teacher', 'name email')
        .populate('students', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Class.countDocuments()
    ]);

    return successResponse(res, 'Classes retrieved', {
      classes
    }, 200, getPaginationMeta(total, page, limit));

  } catch (error) {
    console.error('Get classes error:', error);
    return errorResponse(res, 'Server error', 500);
  }
};

/**
 * @desc    Get single class details
 * @route   GET /api/admin/class/:id
 * @access  Private/Admin
 */
const getClassById = async (req, res) => {
  try {
    const classId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return errorResponse(res, 'Invalid class ID', 400);
    }

    const classDoc = await Class.findById(classId)
      .populate('teacher', 'name email')
      .populate('students', 'name email');

    if (!classDoc) {
      return errorResponse(res, 'Class not found', 404);
    }

    // Get related statistics
    const [quizCount, assignmentCount, materialCount] = await Promise.all([
      Quiz.countDocuments({ classId }),
      Assignment.countDocuments({ classId }),
      Material.countDocuments({ classId })
    ]);

    return successResponse(res, 'Class retrieved', {
      class: classDoc,
      statistics: {
        quizzes: quizCount,
        assignments: assignmentCount,
        materials: materialCount,
        students: classDoc.students.length
      }
    });

  } catch (error) {
    console.error('Get class error:', error);
    return errorResponse(res, 'Server error', 500);
  }
};

module.exports = {
  getDashboard,
  addTeacher,
  addStudent,
  addClass,
  deleteTeacher,
  deleteStudent,
  deleteClass,
  updateClass,
  assignTeacher,
  assignStudents,
  removeStudentFromClass,
  getAllTeachers,
  getAllStudents,
  getAllClasses,
  getClassById
};
