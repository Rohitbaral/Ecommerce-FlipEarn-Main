import React, { useState } from 'react'
import {platformIcons} from '../assets/assets';
import { BadgeCheck, DollarSign, LineChart, Loader2Icon, MapPin, ShoppingBagIcon, User } from 'lucide-react';
import {useLocation, useNavigate} from 'react-router-dom';
import { useAuth, useClerk, useUser } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import api from '../configs/axios';

const ListingCard = ({listing}) => {

    const currency = import.meta.env.VITE_CURRENCY || 'Rs';
    const navigate = useNavigate();
    const { pathname } = useLocation();

    const {user} = useUser()
    const {openSignIn} = useClerk();
    const {getToken} = useAuth();
    const [isProcessing, setIsProcessing] = useState(false)

    const purchaseAccount = async () => {
        try {
          if (!user) {
            return openSignIn();
          }
          setIsProcessing(true);
          toast.loading("Initiating payment...");
          const token = await getToken();
    
          // 1. Create Transaction/Order
          const { data: orderData } = await api.get(
            `/api/listing/purchase-account/${listing.id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
    
          const orderId = orderData.orderId;
          sessionStorage.setItem("currentOrderId", orderId);
    
          // 2. Initiate Khalti Payment
          const { data: khaltiData } = await api.post(
            "/api/payment/khalti-initiate",
            { orderId },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
    
          toast.dismissAll();
    
          if (khaltiData.paymentUrl) {
            window.location.href = khaltiData.paymentUrl;
          } else {
            setIsProcessing(false);
            toast.error("Failed to get payment link");
          }
        } catch (error) {
          setIsProcessing(false);
          toast.dismissAll();
          toast.error(error?.response?.data?.message || error.message);
          console.log(error);
        }
      };
    
  return (
    <div className='relative bg-white rounded-2xl shadow-sm border 
    border-gray-100 overflow-hidden hover:shadow-md transition'>
      {/* Features Banner */}
        {listing.featured && (
            <>
            <p className='py-1'/>
            <div className='absolute top-0 left-0 w-full bg-gradient-to-r
            from-pink-500 to-purple-500 text-white text-center text-xs
            font-semibold py-1 tracking-wide uppercase'>Featured</div>
            </>
        )}
      
      <div className='p-5 pt-8'>
        {/* Header */}
        <div className='flex items-center gap-3 mb-3'>
          {platformIcons[listing.platform]}

          <div className='flex flex-col'>
             <h2>{listing.title}</h2>
             <p>@{listing.username} - <span className='capitalize'>{listing.platform}</span> </p>
          </div>
            <div className='flex items-center gap-1.5 ml-auto'>
                {listing.monetized && (
                    <div title="Monetized" className='flex items-center justify-center w-5 h-5 bg-yellow-100 rounded-full border border-yellow-200 shadow-sm'>
                        <DollarSign className='text-yellow-600 w-3 h-3 stroke-[3px]' />
                    </div>
                )}
                {listing.verified && <BadgeCheck className='text-green-500 w-5 h-5' />}
            </div>
        </div>
         {/* Stats */}
         <div className='flex flex-wrap justify-between max-w-lg items-center gap-3 my-5'>
            <div className='flex items-center text-sm text-gray-600'>
              <User className='size-6 mr-1 text-gray-400' />
              <span className='text-lg font-medium text-slate-800 mr-1.5'>{listing.followers_count.toLocaleString()} </span> followers
            </div>
            {
              listing.engagement_rate && (
                <div className='flex items-center text-sm text-gray-600'>
                  <LineChart className='size-6 mr-1 text-gray-400' />
                  <span className='text-lg font-medium text-slate-800 mr-1.5'>{listing.engagement_rate}</span> % engagement
                </div>
              )
            }
         </div>
           {/* Tags & location */}
           <div className='flex items-center gap-3 mb-3'>
            <span className='text-xs font-medium bg-pink-100 text-pink-600 px-3 py-1
            rounded-full capitalize'>{listing.niche}</span>
            {listing.country && (
              <div className='flex items-center text-gray-500 text-sm'>
                <MapPin className='size-6 mr-1 text-gray-400'/>
                {listing.country}
              </div>
            )}
           </div>
           {/* Description */}
           <p className='text-sm text-gray-600 mb-4 line-clamp-2'>{listing.description}</p>
           <hr className='my-5 border-gray-200'/>

           {/* Footer */}
           <div className='flex items-center justify-between'>
              <div className='flex items-baseline'>
                <span className='text-2xl font-medium text-slate-800'>
                  {currency}
                  {listing.price.toLocaleString('en-IN')}
                </span>
              </div>
               <div className='flex items-center gap-2'>
                <button onClick={()=>{user ? (navigate(`/listing/${listing.id}`), scrollTo
                (0,0)) : openSignIn()}} className={`${pathname === '/' ? 'px-7 py-3 w-full bg-indigo-600 text-white hover:bg-indigo-700' : 'px-4 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200'} text-sm
                rounded-lg transition font-medium`}>
                  {pathname === '/' ? 'More Details' : 'Details'}
                </button>
                {pathname !== '/' && (
                  <button 
                    disabled={isProcessing}
                    onClick={purchaseAccount}
                    className='px-4 py-2.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 font-medium'
                  >
                    {isProcessing ? <Loader2Icon className='size-4 animate-spin'/> : <ShoppingBagIcon className='size-4'/>}
                    {isProcessing ? "..." : "Purchase"}
                  </button>
                )}
               </div>
           </div>
      </div>
    </div>
  )
}

export default ListingCard
