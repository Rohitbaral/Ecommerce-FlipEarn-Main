import { 
    ChartLineIcon, 
    CircleDollarSignIcon, 
    ListIcon, 
    Loader2Icon, 
    UsersIcon, 
    TrendingUpIcon, 
    AlertCircleIcon, 
    ClockIcon,
    ArrowUpRightIcon,
    Download
} from 'lucide-react';
import AdminTitle from '../../components/admin/AdminTitle';
import { useState, useEffect } from 'react';
import ListingDetailsModal from '../../components/admin/ListingDetailsModal';
import { useAuth, useUser } from '@clerk/clerk-react';
import api from '../../configs/axios';
import toast from 'react-hot-toast';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    BarChart, Bar, PieChart, Pie, Cell, Legend, AreaChart, Area 
} from 'recharts';

const Dashboard = () => {
    const { user } = useUser();
    const { getToken } = useAuth();
    const currency = import.meta.env.VITE_CURRENCY || 'Rs';

    const [loading, setLoading] = useState(true);
    const [exportingPDF, setExportingPDF] = useState(false);
    const [exportingExcel, setExportingExcel] = useState(false);
    const [dashboardData, setDashboardData] = useState({
        totalListings: 0,
        totalRevenue: 0,
        totalOrders: 0,
        totalUser: 0,
        activeListings: 0,
        pendingWithdrawals: 0,
        unverifiedListings: 0,
        recentListings: [],
    });
    const [analytics, setAnalytics] = useState({ daily: [], monthly: [] });
    const [topProducts, setTopProducts] = useState({ topPlatforms: [], alerts: {} });
    const [showModal, setShowModal] = useState(null);

    const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f97316'];

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const token = await getToken();
            const headers = { Authorization: `Bearer ${token}` };

            const [dashRes, analyticsRes, topRes] = await Promise.all([
                api.get('/api/admin/dashboard', { headers }),
                api.get('/api/admin/analytics', { headers }),
                api.get('/api/admin/top-products', { headers })
            ]);

            setDashboardData(dashRes.data.dashboardData);
            setAnalytics(analyticsRes.data);
            setTopProducts(topRes.data);
            setLoading(false);
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
            console.error(error);
            setLoading(false);
        }
    };

    const downloadPDF = async () => {
        try {
            setExportingPDF(true);
            const token = await getToken();
            const response = await api.get('/api/admin/export/transactions/pdf', {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'sales_report.pdf');
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Sales report PDF downloaded successfully');
        } catch (error) {
            toast.error('Failed to download PDF report');
            console.error(error);
        } finally {
            setExportingPDF(false);
        }
    };

    const downloadExcel = async () => {
        try {
            setExportingExcel(true);
            const token = await getToken();
            const response = await api.get('/api/admin/export/transactions/excel', {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'sales_report.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Sales report Excel downloaded successfully');
        } catch (error) {
            toast.error('Failed to download Excel report');
            console.error(error);
        } finally {
            setExportingExcel(false);
        }
    };

    useEffect(() => {
        if (user) fetchAllData();
    }, [user]);

    const cards = [
        { title: 'Total Revenue', value: `${currency}${dashboardData.totalRevenue.toLocaleString()}`, icon: CircleDollarSignIcon, color: 'bg-indigo-500', text: 'text-indigo-600' },
        { title: 'Total Orders', value: dashboardData.totalOrders, icon: TrendingUpIcon, color: 'bg-emerald-500', text: 'text-emerald-600' },
        { title: 'Active Listings', value: dashboardData.activeListings, icon: ListIcon, color: 'bg-amber-500', text: 'text-amber-600' },
        { title: 'Total Users', value: dashboardData.totalUser, icon: UsersIcon, color: 'bg-purple-500', text: 'text-purple-600' },
    ];

    if (loading) return (
        <div className='flex items-center justify-center h-screen'>
            <Loader2Icon className='animate-spin text-indigo-600 size-8' />
        </div>
    );

    return (
        <div className="pb-10">
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                <AdminTitle text1='Advanced' text2='Analytics' />
                <div className='flex items-center gap-3'>
                    <button 
                        onClick={downloadPDF} 
                        disabled={exportingPDF}
                        className='flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg border border-red-100 hover:bg-red-100 transition-colors disabled:opacity-50'
                    >
                        {exportingPDF ? <Loader2Icon className='animate-spin size-4' /> : <Download className='size-4' />}
                        <span>Export PDF</span>
                    </button>
                    <button 
                        onClick={downloadExcel} 
                        disabled={exportingExcel}
                        className='flex items-center gap-2 bg-green-50 text-green-600 px-4 py-2 rounded-lg border border-green-100 hover:bg-green-100 transition-colors disabled:opacity-50'
                    >
                        {exportingExcel ? <Loader2Icon className='animate-spin size-4' /> : <Download className='size-4' />}
                        <span>Export Excel</span>
                    </button>
                </div>
            </div>

            {/* Quick Stats Cards */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8'>
                {cards.map((card, index) => (
                    <div key={index} className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4 transition-all hover:shadow-md'>
                        <div className={`${card.color} p-3 rounded-xl text-white`}>
                            <card.icon size={24} />
                        </div>
                        <div>
                            <p className='text-sm text-gray-500 font-medium'>{card.title}</p>
                            <h3 className='text-2xl font-bold text-gray-800'>{card.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8'>
                <div className='lg:col-span-2 space-y-6'>
                    {/* Revenue Chart */}
                    <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100'>
                        <div className='flex items-center justify-between mb-6'>
                            <h3 className='font-bold text-gray-800'>Revenue Trend (Last 7 Days)</h3>
                            <div className='flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full'>
                                <TrendingUpIcon size={12} />
                                Live View
                            </div>
                        </div>
                        <div className='h-[300px] w-full'>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={analytics.daily}>
                                    <defs>
                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Orders Bar Chart */}
                    <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100'>
                        <h3 className='font-bold text-gray-800 mb-6'>Orders per Day</h3>
                        <div className='h-[250px] w-full'>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analytics.daily}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                    <Bar dataKey="orders" fill="#a855f7" radius={[4, 4, 0, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className='space-y-6'>
                    {/* Platform Distribution */}
                    <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100'>
                        <h3 className='font-bold text-gray-800 mb-6'>Revenue by Platform</h3>
                        <div className='h-[250px] w-full'>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={topProducts.topPlatforms}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="revenue"
                                    >
                                        {topProducts.topPlatforms.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36}/>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Needs Attention section */}
                    <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100'>
                        <h3 className='font-bold text-gray-800 mb-4 flex items-center gap-2'>
                            <AlertCircleIcon className='text-amber-500' size={18} />
                            Needs Attention
                        </h3>
                        <div className='space-y-4'>
                            <div className='flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100'>
                                <div className='flex items-center gap-3'>
                                    <ClockIcon className='text-red-600' size={20} />
                                    <div>
                                        <p className='text-xs font-semibold text-red-800'>Unverified Listings</p>
                                        <p className='text-xl font-bold text-red-900'>{dashboardData.unverifiedListings}</p>
                                    </div>
                                </div>
                                <ArrowUpRightIcon size={20} className='text-red-400' />
                            </div>

                            <div className='flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100'>
                                <div className='flex items-center gap-3'>
                                    <CircleDollarSignIcon className='text-amber-600' size={20} />
                                    <div>
                                        <p className='text-xs font-semibold text-amber-800'>Pending Withdrawals</p>
                                        <p className='text-xl font-bold text-amber-900'>{dashboardData.pendingWithdrawals}</p>
                                    </div>
                                </div>
                                <ArrowUpRightIcon size={20} className='text-amber-400' />
                            </div>

                            <div className='flex items-center justify-between p-3 bg-indigo-50 rounded-xl border border-indigo-100'>
                                <div className='flex items-center gap-3'>
                                    <ListIcon className='text-indigo-600' size={20} />
                                    <div>
                                        <p className='text-xs font-semibold text-indigo-800'>Stagnant Listings</p>
                                        <p className='text-xl font-bold text-indigo-900'>{topProducts.alerts.stagnantCount}</p>
                                    </div>
                                </div>
                                <ArrowUpRightIcon size={20} className='text-indigo-400' />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Listings Table */}
            <div className='bg-white rounded-2xl shadow-sm border border-gray-100 mt-8 overflow-hidden'>
                <div className='p-6 border-b border-gray-100 flex items-center justify-between'>
                    <h3 className='font-bold text-gray-800'>Recent Submissions</h3>
                </div>
                <div className='overflow-x-auto'>
                    <table className='w-full text-sm text-left text-gray-700'>
                        <thead className='bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                            <tr>
                                <th className='px-6 py-4'>Title</th>
                                <th className='px-6 py-4'>Category</th>
                                <th className='px-6 py-4'>Platform</th>
                                <th className='px-6 py-4'>Handle</th>
                                <th className='px-6 py-4'>Price</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-gray-100'>
                            {dashboardData.recentListings.map((listing, index) => (
                                <tr onClick={() => setShowModal(listing)} key={index} className='hover:bg-gray-50 cursor-pointer transition-colors'>
                                    <td className='px-6 py-4 font-medium text-gray-900'>{listing.title}</td>
                                    <td className='px-6 py-4 text-gray-600 capitalize'>{listing.niche}</td>
                                    <td className='px-6 py-4'>
                                        <span className='px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md text-xs font-bold uppercase tracking-tighter'>
                                            {listing.platform}
                                        </span>
                                    </td>
                                    <td className='px-6 py-4 text-gray-500'>@{listing.username}</td>
                                    <td className='px-6 py-4 font-bold text-indigo-600'>{currency}{listing.price.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {showModal && <ListingDetailsModal listing={showModal} onClose={() => setShowModal(null)} />}
            </div>
        </div>
    );
};

export default Dashboard;
