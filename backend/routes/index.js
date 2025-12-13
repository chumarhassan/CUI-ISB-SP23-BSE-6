// Export all routes
const authRoutes = require('./authRoutes');
const adminRoutes = require('./adminRoutes');
const teacherRoutes = require('./teacherRoutes');
const studentRoutes = require('./studentRoutes');
const headRoutes = require('./headRoutes');
const indexRoutes = require('./indexRoutes');

module.exports = {
  authRoutes,
  adminRoutes,
  teacherRoutes,
  studentRoutes,
  headRoutes,
  indexRoutes
};
