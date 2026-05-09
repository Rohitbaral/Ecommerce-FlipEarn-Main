
import { Route, Routes, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Marketplace from './pages/Marketplace'
import MyListings from './pages/MyListings'
import ListingDetails from './pages/ListingDetails'
import ManageListing from './pages/ManageListing'
import Messages from './pages/Messages'
import MyOrders from './pages/MyOrders'
import Loading from './pages/Loading'
import PaymentSuccess from './pages/PaymentSuccess'
import Navbar from './components/Navbar'
import ChatBox from './components/ChatBox'
import {Toaster} from 'react-hot-toast'
import Layout from './pages/admin/Layout'
import Dashboard from './pages/admin/Dashboard'
import AllListings from './pages/admin/AllListings'
import CredentialChange from './pages/admin/CredentialChange'
import CredentialVerify from './pages/admin/CredentialVerify'
import Transactions from './pages/admin/Transactions'
import Withdrawal from './pages/admin/Withdrawal'
import { SignedIn, SignedOut, RedirectToSignIn, useAuth, useUser } from '@clerk/clerk-react'
import { useDispatch } from 'react-redux'
import { useEffect } from 'react'
import { getAllPublicListing, getAllUserListing } from './app/features/listingSlice'

const App = () => {

  const{pathname} = useLocation();
  const {getToken} = useAuth();
  const {user, isLoaded } = useUser();

  const dispatch = useDispatch();
 
  useEffect(() => {
   dispatch(getAllPublicListing())
  }, [])

  useEffect(() => {
    if(isLoaded){
       if (user) {
         dispatch(getAllUserListing({getToken}))
         dispatch(getAllPublicListing({getToken}))
       } else {
         dispatch(getAllPublicListing())
       }
    }
  }, [isLoaded, user])
  
  



  return (
    <div>
      <Toaster />
     {!pathname.includes('/admin') && <Navbar />}
  <Routes>
    <Route path='/' element={<Home />}/>
    <Route path='/marketplace' element={<>
      <SignedIn>
        <Marketplace />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>}/>
    <Route path='/my-listings' element={<MyListings />}/>
    <Route path='/listing/:listingId' element={<ListingDetails />}/>
    <Route path='/create-listing' element={<ManageListing />}/>
    <Route path='/edit-listing/:id' element={<ManageListing />}/>
    <Route path='/messages' element={<Messages />}/>
    <Route path='/my-orders' element={< MyOrders />}/>
    <Route path='/loading/:nextUrl' element={<Loading />}/>
    <Route path='/payment-success' element={<PaymentSuccess />}/>
    <Route path='/admin' element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path='verify-credentials' element={<CredentialVerify />} />
        <Route path='change-credentials' element={<CredentialChange />} />
        <Route path='list-listings' element={<AllListings />} />
        <Route path='transactions' element={<Transactions />} />
        <Route path='withdrawal' element={<Withdrawal />} />
    </Route>
  </Routes>
  <ChatBox />
    </div>
  )
}

export default App
