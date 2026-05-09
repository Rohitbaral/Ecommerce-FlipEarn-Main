import { useEffect, useState } from 'react';
import { Download, Loader2Icon } from 'lucide-react';
import AdminTitle from '../../components/admin/AdminTitle';
import WithdrawalDetail from '../../components/admin/WithdrawalDetail';
import { dummyWithdrawalRequests } from '../../assets/assets';
import { useAuth } from '@clerk/clerk-react';
import api from '../../configs/axios';
import toast from 'react-hot-toast';

const Withdrawal = () => {
    const currency = import.meta.env.VITE_CURRENCY || 'Rs';

    const {getToken} = useAuth()

    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [exportingPDF, setExportingPDF] = useState(false);
    const [exportingExcel, setExportingExcel] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);

    const getRequests = async () => {
      try {
        const token = await getToken();
        const {data} = await api.get('/api/admin/withdraw-requests',{headers: {Authorization: `Bearer ${token}`}})
        setRequests(data.requests)
        setIsLoading(false)
      } catch (error) {
          toast.error(error?.response?.data?.message || error.message);
         console.log(error);
      }
    };

    const downloadPDF = async () => {
        try {
            setExportingPDF(true);
            const token = await getToken();
            const response = await api.get('/api/admin/export/withdrawals/pdf', {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'withdrawals_report.pdf');
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
            const response = await api.get('/api/admin/export/withdrawals/excel', {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'withdrawals_report.xlsx');
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
        getRequests();
    }, []);

    if (isLoading) {
        return (
            <div className='flex items-center justify-center h-full'>
                <Loader2Icon className='size-7 text-indigo-500 animate-spin' />
            </div>
        );
    }

    return (
        <div className='p-6'>
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                <AdminTitle text1='All' text2='Withdrawals' />
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
            <div className='mt-10 overflow-x-auto bg-white border border-gray-200 w-full max-w-6xl rounded-xl'>
                <table className='w-full text-sm text-left text-gray-700'>
                    <thead className='text-xs uppercase border-b border-gray-200 bg-gray-50'>
                        <tr>
                            <th className='pl-4 py-3'>#</th>
                            <th className='px-4 py-3'>User</th>
                            <th className='px-4 py-3'>Email</th>
                            <th className='px-4 py-3'>Amount</th>
                            <th className='px-4 py-3'>Status</th>
                            <th className='px-4 py-3 text-center'>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.length === 0 ? (
                            <tr>
                                <td colSpan='8' className='text-center py-6 text-gray-500'>
                                    No withdrawal requests found.
                                </td>
                            </tr>
                        ) : (
                            requests.map((req, index) => (
                                <tr key={req.id} className='border-t border-gray-200 hover:bg-indigo-50/50'>
                                    <td className='pl-4 py-3'>{index + 1}.</td>
                                    <td className='px-4 py-3 flex items-center gap-2'>
                                        <img src={req.user?.image} alt={req.user?.name} className='w-8 h-8 rounded-full' />
                                        {req.user?.name}
                                    </td>
                                    <td className='px-4 py-3'>{req.user?.email}</td>
                                    <td className='px-4 py-3 font-medium'>{currency}{req.amount.toLocaleString()}</td>
                                    <td className='px-4 py-3'>{req.isWithdrawn ? <span className='text-green-600 font-medium'>Paid</span> : <span className='text-gray-500 font-medium'>Pending</span>}</td>
                                    <td className='px-4 py-3 text-center'>
                                        <button onClick={() => setSelectedRequest(req)} className='text-indigo-600 font-medium hover:underline'>
                                            Manage
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {selectedRequest && (
                    <WithdrawalDetail
                        data={selectedRequest}
                        onClose={() => {
                            getRequests();
                            setSelectedRequest(null);
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default Withdrawal;
