import React, { useEffect, useState } from 'react'
import { dummyOrders, platformIcons } from '../assets/assets'
import toast from 'react-hot-toast'
import { CheckCircle2, ChevronDown, ChevronUp, Copy, Loader2Icon, Eye, EyeOff } from 'lucide-react'
import { useAuth, useUser } from '@clerk/clerk-react'
import { format } from 'date-fns'
import api from '../configs/axios'

const MyOrders = () => {

  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()
  const currency = import.meta.env.VITE_CURRENCY || "Rs"
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [showPasswords, setShowPasswords] = useState({})

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const token = await getToken();
      const { data } = await api.get('/api/listing/user-orders', { headers: { Authorization: `Bearer ${token}` } })
      setOrders(data.orders)
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message)
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user && isLoaded) {
      fetchOrders()
    }
  }, [isLoaded, user])

  const mask = (val, type, isVisible) => {
    if (!val && val != 0) return "-"
    if (type.toLowerCase() === "password" && !isVisible) return "•".repeat(8)
    return String(val)
  }

  const togglePassword = (orderId, index) => {
    setShowPasswords(prev => ({
      ...prev,
      [`${orderId}-${index}`]: !prev[`${orderId}-${index}`]
    }))
  }

  const copy = async (txt) => {
    try {
      await navigator.clipboard.writeText(txt)
      toast.success("Copied to clipboard")
    } catch (error) {
      toast.error("Copy failed")
    }
  }

  if (loading) {
    return (
      <div className='h-[80vh] flex items-center justify-center'>
        <Loader2Icon className='size-7 animate-spin text-indigo-600' />
      </div>
    )
  }

  if (!orders.length) {
    return (
      <div className='px-4 md:px-16 lg:px-24 xl:px-32'>
        <div className='max-w-2xl mx-auto mt-14 bg-white rounded-xl border
        border-gray-200 p-8 text-center'>
          <h3 className='text-lg font-semibold'>No orders yet</h3>
          <p className='text-sm text-gray-500 mt-2'>
            You haven't purchased any listings yet.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='px-4 md:px-16 lg:px-24 xl:px-32 py-6'>
      <h2 className='text-2xl font-semibold mb-6'>My Orders</h2>

      <div className='space-y-4'>
        {orders.map((order) => {
          const id = order.id
          const listing = order.listing
          const credential = order.credential
          const isExpanded = expandedId === id

          return (
            <div
              key={id}
              className='bg-white rounded-lg border border-gray-200 p-5 flex
              flex-col max-w-4xl'
            >
              <div className='flex items-start gap-4 flex-1'>
                <div className='p-2 rounded-lg bg-gray-50 max-sm:hidden'>
                  {platformIcons[listing.platform]}
                </div>

                <div className='flex-1'>
                  {/* ✅ ONLY CHANGE IS HERE */}
                  <div>
                    <h3 className='text-lg font-semibold'>
                      {listing.title}
                    </h3>

                    <p className='text-sm text-gray-500 mt-1'>
                      @{listing.username} •{" "}
                      <span className='capitalize'>
                        {listing.platform}
                      </span>
                    </p>

                    <div className='flex gap-2 mt-2'>
                      {listing.verified && (
                        <span
                          className='flex items-center text-xs bg-indigo-50
                          text-indigo-600 px-2 py-1 rounded-md'
                        >
                          <CheckCircle2 className='w-3 h-3 mr-1' />
                          Verified
                        </span>
                      )}

                      {listing.monetized && (
                        <span
                          className='flex items-center text-xs bg-green-50
                          text-green-600 px-2 py-1 rounded-md'
                        >
                          <span className='text-xs font-medium mr-1'>{currency}</span>
                          Monetized
                        </span>
                      )}
                    </div>
                  </div>

                  <div className='text-right'>
                    <p className='text-2xl font-bold'>
                      {currency}
                      {Number(order.amount).toLocaleString('en-IN')}
                    </p>
                    </div>
                </div>
              </div>

              <div className='flex flex-col gap-2 items-end'>
                <button onClick={() => setExpandedId((p) => (p === id ? null : id))}
                  className='flex items-center gap-2 bg-white border border-gray-200
                  px-3 py-2 rounded hover:shadow text-sm'
                  aria-expanded={isExpanded}>
                  {isExpanded ? (
                    <>
                      <ChevronUp className='size-4' /> Hide Credentials
                    </>
                  ) : (
                    <>
                      <ChevronDown className='size-4' /> View Credentials
                    </>
                  )}
                </button>

                <div className='text-xs text-gray-500 mt-2 text-right'>
                  <div>
                    Credential Purchased: {format(new Date(order.createdAt), "MMM d, yyyy")}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className='mt-6 pt-6 border-t border-gray-100'>
                  <h4 className='text-sm font-semibold text-gray-800 mb-4'>Account Credentials</h4>
                  {!credential || (!credential.updatedCredential?.length && !credential.originalCredential?.length) ? (
                    <div className='bg-amber-50 border border-amber-100 rounded-lg p-4'>
                      <p className='text-amber-700 text-sm font-medium italic'>
                        Secure credentials are being generated. Please check back shortly.
                      </p>
                    </div>
                  ) : (
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                      {(credential.updatedCredential?.length > 0 ? credential.updatedCredential : credential.originalCredential).map((cred, index) => (
                        <div key={index} className='flex items-center justify-between gap-3 bg-gray-50 rounded-lg p-3 border border-gray-100 hover:border-indigo-100 transition-colors'>
                          <div className='min-w-0 flex-1'>
                            <p className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>{cred.name}</p>
                             <code className='text-sm font-mono text-gray-800 break-all'>
                               {mask(cred.value, cred.name, showPasswords[`${id}-${index}`])}
                             </code>
                           </div>
 
                           <div className='flex items-center gap-1'>
                             {cred.name.toLowerCase() === 'password' && (
                               <button
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   togglePassword(id, index);
                                 }}
                                 className='p-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 hover:border-indigo-300 transition-all shadow-sm'
                                 title={showPasswords[`${id}-${index}`] ? 'Hide password' : 'Show password'}
                               >
                                 {showPasswords[`${id}-${index}`] ? <EyeOff className='size-4 text-gray-600' /> : <Eye className='size-4 text-gray-600' />}
                               </button>
                             )}
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 copy(cred.value);
                               }}
                               className='p-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 hover:border-indigo-300 transition-all shadow-sm'
                               title='Copy to clipboard'
                             >
                               <Copy className='size-4 text-gray-600' />
                             </button>
                           </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className='text-[10px] text-gray-400 mt-4 italic'>
                    * Please change these credentials immediately after taking control for security.
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MyOrders
