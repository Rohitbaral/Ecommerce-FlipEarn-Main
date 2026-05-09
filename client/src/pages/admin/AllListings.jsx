import AdminTitle from '../../components/admin/AdminTitle';
import { useEffect, useState } from 'react';
import { CheckCircleIcon, Download, Loader2Icon, MailCheckIcon, XIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ListingDetailsModal from '../../components/admin/ListingDetailsModal';
import DeleteConfirmationModal from '../../components/admin/DeleteConfirmationModal';
import { dummyListings } from '../../assets/assets';
import { useAuth } from '@clerk/clerk-react';
import api from '../../configs/axios';
import toast from 'react-hot-toast';

const AllListings = () => {
    const [loading, setLoading] = useState(true);
    const [listings, setListings] = useState([]);
    const [showModal, setShowModal] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [exportingPDF, setExportingPDF] = useState(false);
    const [exportingExcel, setExportingExcel] = useState(false);
    const {getToken} = useAuth();
    const navigate = useNavigate();

    const fetchAllListings = async () => {
       try {
        const token = await getToken();
        const { data } = await api.get('/api/admin/all-listings', {headers: {
            Authorization: `Bearer ${token}`
        }})
        setListings(data.listings)
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
            const response = await api.get('/api/admin/export/listings/pdf', {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'listings_report.pdf');
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
            const response = await api.get('/api/admin/export/listings/excel', {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'listings_report.xlsx');
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

    const changeListingStatus = async (status, listing) => {
        if (status === 'deleted') {
            setDeleteConfirm({ status, listing });
            return;
        }
        await executeStatusChange(status, listing);
    };

    const executeStatusChange = async (status, listing) => {
        try {
            toast.loading('changing status...')
            const token = await getToken();
            const { data } = await api.put(`/api/admin/change-status/${listing.id}`, { status }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            await fetchAllListings()
            toast.dismissAll()
            toast.success(data.message);
        } catch (error) {
            toast.dismissAll();
            toast.error(error?.response?.data?.message || error.message);
            console.log(error);
        }
    };

    const colorMapCredentials = {
        notSubmit: { bg: 'bg-red-100', text: 'text-red-600', icon: XIcon },
        submitted: { bg: 'bg-yellow-100', text: 'text-yellow-600', icon: MailCheckIcon },
        verified: { bg: 'bg-blue-100', text: 'text-blue-600', icon: CheckCircleIcon },
        changed: { bg: 'bg-green-100', text: 'text-green-600', icon: CheckCircleIcon },
    };

    useEffect(() => {
        fetchAllListings();
    }, []);

    return loading ? (
        <div className='flex items-center justify-center h-full'>
            <Loader2Icon className='animate-spin text-indigo-600 size-7' />
        </div>
    ) : (
        <div className='p-6'>
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                <AdminTitle text1='All' text2=' Listings' />
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
                            <th className='px-4 py-3'>Title</th>
                            <th className='px-4 py-3'>Niche</th>
                            <th className='px-4 py-3'>Platform</th>
                            <th className='px-4 py-3'>Username</th>
                            <th className='px-4 py-3'>Credentials</th>
                            <th className='px-4 py-3'>Status</th>
                            <th className='px-4 py-3 text-center'>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {listings.map((listing, index) => (
                            <tr onClick={() => setShowModal(listing)} key={index} className='border-t border-gray-200 hover:bg-indigo-50/50 cursor-pointer'>
                                <td className='pl-4 py-3'>{index + 1}.</td>
                                <td className='px-4 py-3'>{listing.title}</td>
                                <td className='px-4 py-3'>{listing.niche}</td>
                                <td className='px-4 py-3'>{listing.platform}</td>
                                <td className='px-4 py-3'>@{listing.username}</td>
                                <td className='px-4 py-3'>
                                    {(() => {
                                        const credentialsStatus = listing.isCredentialChanged ? 'changed' : listing.isCredentialVerified ? 'verified' : listing.isCredentialSubmitted ? 'submitted' : 'notSubmit';
                                        const color = colorMapCredentials[credentialsStatus];
                                        return (
                                            <button className={`flex items-center gap-1 px-2 text-xs py-0.5 rounded-full ${color.bg} ${color.text}`}>
                                                <color.icon size={12} /> <span className={` font-medium`}>{listing.isCredentialChanged ? 'Changed' : listing.isCredentialVerified ? 'Verified' : listing.isCredentialSubmitted ? 'Submitted' : 'Not Submit'}</span>
                                            </button>
                                        );
                                    })()}
                                </td>
                                <td className='px-4 py-3'>
                                    <div className='flex items-center justify-start'>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${
                                            listing.status === 'active' ? 'text-green-600 bg-green-50 border-green-100' :
                                            listing.status === 'deleted' ? 'text-red-600 bg-red-50 border-red-100' :
                                            listing.status === 'sold' ? 'text-indigo-600 bg-indigo-50 border-indigo-100' :
                                            listing.status === 'ban' ? 'text-orange-600 bg-orange-50 border-orange-100' :
                                            'text-gray-500 bg-gray-50 border-gray-100'
                                        }`}>
                                            {listing.status}
                                        </span>
                                    </div>
                                </td>
                                <td onClick={(e) => e.stopPropagation()} className='px-4 py-3 text-center'>
                                    <div className='flex gap-3 items-center justify-center'>
                                        {listing.status !== 'deleted' && (
                                            <select 
                                                value={listing.status} 
                                                onChange={(e) => changeListingStatus(e.target.value, listing)} 
                                                className='px-2 py-1 text-xs text-gray-500 border border-gray-300 rounded-md outline-none bg-white cursor-pointer hover:border-indigo-400 transition-colors'
                                            >
                                                <option value='active'>Active</option>
                                                <option value='inactive'>Inactive</option>
                                                <option value='ban'>Ban</option>
                                                <option value='sold'>Sold</option>
                                                <option value='deleted'>Delete</option>
                                            </select>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {showModal && <ListingDetailsModal listing={showModal} onClose={() => setShowModal(null)} />}
            {deleteConfirm && (
                <DeleteConfirmationModal 
                    title={deleteConfirm.listing.title}
                    onConfirm={() => {
                        executeStatusChange(deleteConfirm.status, deleteConfirm.listing);
                        setDeleteConfirm(null);
                    }}
                    onCancel={() => setDeleteConfirm(null)}
                />
            )}
        </div>
    );
};

export default AllListings;
