import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getDashboardStats } from '@/services/adminApi';
import { 
  Package, 
  Package2, 
  CheckCircle, 
  Clock, 
  Users, 
  TrendingUp,
  AlertCircle 
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface DashboardStats {
  users: {
    total: number;
    admins: number;
    regular: number;
  };
  items: {
    totalLost: number;
    totalFound: number;
    activeLost: number;
    activeFound: number;
    claimed: number;
  };
  claims: {
    total: number;
    pending: number;
    approved: number;
    completed: number;
    rejected: number;
  };
  recentActivity: {
    lostItems: number;
    foundItems: number;
    claims: number;
    registrations: number;
  };
  weeklyActivity?: Array<{
    date?: string;
    name?: string;
    lost: number;
    found: number;
    claims: number;
  }>;
  categoryBreakdown?: Array<{
    name: string;
    lost: number;
    found: number;
  }>;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await getDashboardStats();
        if (response.success) {
          // Map backend weeklyActivity/categoryBreakdown into chart-friendly arrays
          const data = response.data;
          setStats(data);
        } else {
          setError('Failed to fetch dashboard statistics');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  // Use real data from API if present, otherwise fallback to mock arrays
  const weeklyData = stats?.weeklyActivity && Array.isArray(stats.weeklyActivity)
    ? stats.weeklyActivity.map((d: any) => ({ name: d.name || new Date(d.date).toLocaleDateString(), lost: d.lost, found: d.found, claims: d.claims }))
    : [
        { name: 'Mon', lost: 4, found: 3, claims: 2 },
        { name: 'Tue', lost: 3, found: 5, claims: 1 },
        { name: 'Wed', lost: 2, found: 4, claims: 3 },
        { name: 'Thu', lost: 5, found: 2, claims: 2 },
        { name: 'Fri', lost: 4, found: 6, claims: 4 },
        { name: 'Sat', lost: 3, found: 3, claims: 1 },
        { name: 'Sun', lost: 2, found: 4, claims: 2 },
      ];

  const categoryData = stats?.categoryBreakdown && Array.isArray(stats.categoryBreakdown)
    ? stats.categoryBreakdown.map((c: any) => ({ name: c.name, lost: c.lost, found: c.found }))
    : [
        { name: 'Electronics', lost: 12, found: 8 },
        { name: 'Clothing', lost: 8, found: 6 },
        { name: 'Books', lost: 15, found: 12 },
        { name: 'Accessories', lost: 6, found: 4 },
        { name: 'Others', lost: 9, found: 7 },
      ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600">Welcome to the FindIt Admin Dashboard</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lost Reports</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.items.totalLost}</div>
            <p className="text-xs text-muted-foreground">
              {stats.items.activeLost} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Found Reports</CardTitle>
            <Package2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.items.totalFound}</div>
            <p className="text-xs text-muted-foreground">
              {stats.items.activeFound} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful Matches</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.claims.completed}</div>
            <p className="text-xs text-muted-foreground">
              {stats.items.claimed} items claimed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Verifications</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.claims.pending}</div>
            <p className="text-xs text-muted-foreground">
              {stats.claims.approved} approved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.users.regular} regular users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.claims.total}</div>
            <div className="flex space-x-2 mt-2">
              <Badge variant="secondary">{stats.claims.pending} Pending</Badge>
              <Badge variant="default">{stats.claims.completed} Completed</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity (7 days)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Lost Items:</span>
                <span className="font-medium">{stats.recentActivity.lostItems}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Found Items:</span>
                <span className="font-medium">{stats.recentActivity.foundItems}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>New Claims:</span>
                <span className="font-medium">{stats.recentActivity.claims}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Registrations:</span>
                <span className="font-medium">{stats.recentActivity.registrations}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
            <CardDescription>Lost items, found items, and claims over the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="lost" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="found" stroke="#22c55e" strokeWidth={2} />
                <Line type="monotone" dataKey="claims" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Items by Category</CardTitle>
            <CardDescription>Lost vs Found items by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="lost" fill="#ef4444" />
                <Bar dataKey="found" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
