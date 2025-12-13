import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import StatCard from '../../components/StatCard'
import DataTable from '../../components/DataTable'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { FiUsers, FiBook, FiUserCheck, FiActivity, FiTrendingUp, FiCalendar, FiAward, FiBookOpen } from 'react-icons/fi'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [recentUsers, setRecentUsers] = useState([])
  const [recentClasses, setRecentClasses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/admin/dashboard')
      const data = response.data.data || response.data
      setStats(data.statistics || data.stats)
      setRecentUsers(data.recentUsers || [])
      setRecentClasses(data.recentClasses || [])
    } catch (error) {
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  // Chart Data
  const userDistribution = [
    { name: 'Students', value: stats?.totalStudents || 43, color: '#10b981' },
    { name: 'Teachers', value: stats?.totalTeachers || 5, color: '#6366f1' },
    { name: 'Heads', value: 1, color: '#f59e0b' },
    { name: 'Admins', value: 1, color: '#ec4899' },
  ]

  const monthlyActivity = [
    { month: 'Jan', users: 35, classes: 5 },
    { month: 'Feb', users: 38, classes: 6 },
    { month: 'Mar', users: 42, classes: 7 },
    { month: 'Apr', users: 45, classes: 7 },
    { month: 'May', users: 48, classes: 8 },
    { month: 'Dec', users: 50, classes: 8 },
  ]

  const columns = [
    { 
      key: 'name', 
      label: 'Name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-500 flex items-center justify-center text-white font-semibold text-sm">
            {row.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-white">{row.name}</p>
            <p className="text-xs text-slate-500">{row.email}</p>
          </div>
        </div>
      )
    },
    { 
      key: 'role', 
      label: 'Role',
      render: (row) => (
        <span className={`badge ${
          row.role === 'admin' ? 'badge-purple' :
          row.role === 'teacher' ? 'badge-info' :
          row.role === 'head' ? 'badge-warning' : 'badge-success'
        }`}>
          {row.role?.charAt(0).toUpperCase() + row.role?.slice(1)}
        </span>
      )
    },
    { 
      key: 'createdAt', 
      label: 'Joined',
      render: (row) => (
        <div className="flex items-center gap-2 text-slate-400">
          <FiCalendar className="w-4 h-4" />
          <span>{new Date(row.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
      )
    }
  ]

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-3 border-sky-500/30 border-t-sky-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="animate-fade-in space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-white">Admin Dashboard</h1>
            <p className="text-slate-500 text-sm mt-0.5">Overview of the entire LMS system</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 bg-[#12121a] px-4 py-2 rounded-lg border border-[#1e1e2e]">
            <FiCalendar className="w-4 h-4" />
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="dashboard-grid">
          <StatCard 
            title="Total Teachers" 
            value={stats?.totalTeachers || 5} 
            icon={FiUsers} 
            color="blue"
            change={12}
            subtitle="Faculty members"
          />
          <StatCard 
            title="Total Students" 
            value={stats?.totalStudents || 43} 
            icon={FiUserCheck} 
            color="green"
            change={8}
            subtitle="Enrolled students"
          />
          <StatCard 
            title="Active Classes" 
            value={stats?.totalClasses || 8} 
            icon={FiBook} 
            color="purple"
            change={15}
            subtitle="SE Courses"
          />
          <StatCard 
            title="Total Quizzes" 
            value={stats?.totalQuizzes || 5} 
            icon={FiAward} 
            color="orange"
            change={25}
            subtitle="Assessments created"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Distribution Chart */}
          <div className="bg-[#12121a] rounded-xl p-5 border border-[#1e1e2e]">
            <h3 className="text-base font-medium text-white mb-5 flex items-center gap-2">
              <FiUsers className="w-4 h-4 text-sky-400" />
              User Distribution
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {userDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1a24', 
                      border: '1px solid #2a2a3a',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {userDistribution.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-slate-500">{item.name}</span>
                  <span className="text-sm font-medium text-white ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Chart */}
          <div className="bg-[#12121a] rounded-xl p-5 border border-[#1e1e2e]">
            <h3 className="text-base font-medium text-white mb-5 flex items-center gap-2">
              <FiTrendingUp className="w-4 h-4 text-emerald-400" />
              Growth Trends
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyActivity}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorClasses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                  <XAxis dataKey="month" stroke="#404050" fontSize={12} />
                  <YAxis stroke="#404050" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1a24', 
                      border: '1px solid #2a2a3a',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Area type="monotone" dataKey="users" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={2} />
                  <Area type="monotone" dataKey="classes" stroke="#10b981" fillOpacity={1} fill="url(#colorClasses)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                <span className="text-sm text-slate-500">Users</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-sm text-slate-500">Classes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#12121a] rounded-xl p-4 border border-[#1e1e2e] text-center">
            <FiBookOpen className="w-7 h-7 text-sky-400 mx-auto mb-2" />
            <p className="text-xl font-bold text-white">{stats?.totalMaterials || 8}</p>
            <p className="text-xs text-slate-500">Learning Materials</p>
          </div>
          <div className="bg-[#12121a] rounded-xl p-4 border border-[#1e1e2e] text-center">
            <FiActivity className="w-7 h-7 text-emerald-400 mx-auto mb-2" />
            <p className="text-xl font-bold text-white">{stats?.totalAssignments || 6}</p>
            <p className="text-xs text-slate-500">Assignments</p>
          </div>
          <div className="bg-[#12121a] rounded-xl p-4 border border-[#1e1e2e] text-center">
            <FiAward className="w-7 h-7 text-amber-400 mx-auto mb-2" />
            <p className="text-xl font-bold text-white">{stats?.totalMarks || 40}</p>
            <p className="text-xs text-slate-500">Grades Recorded</p>
          </div>
          <div className="bg-[#12121a] rounded-xl p-4 border border-[#1e1e2e] text-center">
            <FiUsers className="w-7 h-7 text-violet-400 mx-auto mb-2" />
            <p className="text-xl font-bold text-white">{stats?.totalUsers || 50}</p>
            <p className="text-xs text-slate-500">Total Users</p>
          </div>
        </div>

        {/* Recent Users Table */}
        <div className="bg-[#12121a] rounded-xl border border-[#1e1e2e] overflow-hidden">
          <div className="p-5 border-b border-[#1e1e2e]">
            <h2 className="text-base font-medium text-white flex items-center gap-2">
              <FiUsers className="w-4 h-4 text-sky-400" />
              Recent Users
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">Latest registered users in the system</p>
          </div>
          <DataTable 
            columns={columns} 
            data={recentUsers}
            emptyMessage="No recent users found"
          />
        </div>
      </div>
    </Layout>
  )
}
