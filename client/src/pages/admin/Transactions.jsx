import AdminTitle from '../../components/admin/AdminTitle';
import { useState } from 'react';
import { useEffect } from 'react';
import ListingDetailsModal from '../../components/admin/ListingDetailsModal';
import { Download, Loader2Icon } from 'lucide-react';
import { dummyOrders } from '../../assets/assets';
import { useAuth } from '@clerk/clerk-react';
import api from '../../configs/axios';
import toast from 'react-hot-toast';

const Transactions = () => {
    const currency = import.meta.env.VITE_CURRENCY || 'Rs';

    const {getToken} = useAuth()

    const [transactions, setTransactions] = useState([]); // initialize as empty array
    const [loading, setLoading] = useState(true);
    const [exportingPDF, setExportingPDF] = useState(false);
    const [exportingExcel, setExportingExcel] = useState(false);
    const [showModal, setShowModal] = useState(null);

    const getTransactions = async () => {
        try {
          const token = await getToken();
          const {data} = await api.get('/api/admin/transactions',{headers: {Authorization: `Bearer ${token}`}})  
          setTransactions(data.transactions || []) 
          setLoading(false)
        } catch (error) {
         toast.error(error?.response?.data?.message || error.message);
         console.log(error);
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
            toast.success('PDF report downloaded successfully');
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
            toast.success('Excel report downloaded successfully');
        } catch (error) {
            toast.error('Failed to download Excel report');
            console.error(error);
        } finally {
            setExportingExcel(false);
        }
    };
    useEffect(() => {
        getTransactions();
    }, []);

    return loading ? (
        <div className='flex items-center justify-center h-full'>
            <Loader2Icon className='animate-spin text-indigo-600 size-7' />
        </div>
    ) : (
        <div className='p-6'>
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                <AdminTitle text1='List' text2=' Transactions' />
                <div className='flex items-center gap-3'>
                    <button 
                        onClick={downloadPDF} 
                        disabled={exportingPDF}
                        className='flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg border border-red-100 hover:bg-red-100 transition-colors disabled:opacity-50'
                    >
                        {exportingPDF ? <Loader2Icon className='animate-spin size-4' /> : <Download className='size-4' />}
                        <span>PDF Report</span>
                    </button>
                    <button 
                        onClick={downloadExcel} 
                        disabled={exportingExcel}
                        className='flex items-center gap-2 bg-green-50 text-green-600 px-4 py-2 rounded-lg border border-green-100 hover:bg-green-100 transition-colors disabled:opacity-50'
                    >
                        {exportingExcel ? <Loader2Icon className='animate-spin size-4' /> : <Download className='size-4' />}
                        <span>Excel Report</span>
                    </button>
                </div>
            </div>

            <div className='mt-10 overflow-x-auto bg-white border border-gray-200 w-full max-w-5xl rounded-xl'>
                <table className='w-full text-sm text-left  text-gray-700  '>
                    <thead className='text-xs uppercase border-b border-gray-200'>
                        <tr>
                            <th className='pl-4 py-3'> # </th>
                            <th className='px-4 py-3'>Username</th>
                            <th className='px-4 py-3'>Platform</th>
                            <th className='px-4 py-3'>Amount</th>
                            <th className='px-4 py-3'>Purchase Date</th>
                            <th className='px-4 py-3'>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions?.map((t, index) => ( 
                            <tr key={index} className='border-t border-gray-200 hover:bg-indigo-50/50'>
                                <td className='pl-4 py-3'>{index + 1}.</td>
                                <td className='px-4 py-3'>@{t.listing.username}</td>
                                <td className='px-4 py-3'>{t.listing.platform}</td>
                                <td className='px-4 py-3'>
                                    {currency}
                                    {t.amount}
                                </td>
                                <td className='px-4 py-3'>{new Date(t.createdAt).toLocaleString()}</td>
                                <td className='px-4 py-3'>
                                    <button onClick={() => setShowModal(t.listing)} className='text-indigo-600 font-medium'>
                                        more details
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {showModal && (
                <ListingDetailsModal listing={showModal} onClose={() => { setShowModal(null); }} />
            )}
        </div>
    );
};

export default Transactions;