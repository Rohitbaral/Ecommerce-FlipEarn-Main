import { ArrowLeftIcon, Filter, ArrowUpDown } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { getAllPublicListing } from '../app/features/listingSlice';
import {useNavigate, useSearchParams} from 'react-router-dom'
import ListingCard from '../components/ListingCard';
import FilterSidebar from '../components/FilterSidebar';
import { useAuth } from '@clerk/clerk-react';

const Marketplace = () => {

  const { getToken } = useAuth();

  const [searchParams] = useSearchParams();
  const search = searchParams.get("search")

  const navigate = useNavigate();
  const [showFilterPhone,setShowFilterPhone] = useState(false);

  const [filters, setFilters] = useState({
    platform: null,
    maxPrice: 100000,
    minFollowers: 0,
    niche: null,
    verified: false,
    monetized: false,
  })

  const [sortBy, setSortBy] = useState('featured');


  const {listings} = useSelector(state => state.listing)
  const dispatch = useDispatch()

  useEffect(() => {
    if (!listings || listings.length === 0) {
      dispatch(getAllPublicListing({ getToken }))
    }
  }, [dispatch, listings, getToken])

  const filteredListings = (listings || []).filter((listing)=>{

    if(filters.platform && filters.platform.length > 0){
      if(!filters.platform.includes(listing.platform)) return false
    }

     if(filters.maxPrice){
      if(listing.price > filters.maxPrice) return false
    }
    
     if(filters.minFollowers){
      if(listing.followers_count < filters.minFollowers) return false
    }
    
     if(filters.niche && filters.niche.length > 0){
      if(!filters.niche.includes(listing.niche)) return false
    }

    if(filters.verified && listing.verified !== filters.verified) return false

    if(filters.monetized && listing.monetized !== filters.monetized) return false

    if(search){
     const trimed = search.trim();
     if(
      !(listing.title?.toLowerCase() || "").includes(trimed.toLowerCase()) && 
      !(listing.username?.toLowerCase() || "").includes(trimed.toLowerCase()) && 
      !(listing.description?.toLowerCase() || "").includes(trimed.toLowerCase()) && 
      !(listing.platform?.toLowerCase() || "").includes(trimed.toLowerCase()) && 
      !(listing.niche?.toLowerCase() || "").includes(trimed.toLowerCase()) 

     )
     return false
    }

    return true;
  })

  /**
   * Sorts the listings based on the selected criteria
   * @param {Array} list - The list of listings to sort
   * @param {string} sortType - The sorting criteria ('featured', 'price-asc', 'price-desc')
   * @returns {Array} - The sorted list
   */
  const sortProducts = (list, sortType) => {
    if (!list) return [];
    return [...list].sort((a, b) => {
      // Primary Sort
      if (sortType === 'price-asc') {
        const priceA = a.price || 0;
        const priceB = b.price || 0;
        if (priceA !== priceB) return priceA - priceB;
      } else if (sortType === 'price-desc') {
        const priceA = a.price || 0;
        const priceB = b.price || 0;
        if (priceA !== priceB) return priceB - priceA;
      }
      
      // Secondary Sort (Stable sort/Featured first)
      if (a.featured !== b.featured) {
        return a.featured ? -1 : 1;
      }
      
      // Tertiary Sort (Newest first as tie-breaker if id exists)
      return (b.id || 0) - (a.id || 0);
    });
  };

  const sortedListings = sortProducts(filteredListings, sortBy);


  return (
    <div className='px-6 md:px-16 lg:px-24 xl:px-32'>

      <div className='flex items-center justify-between text-slate-500'>
        <button onClick={()=>{navigate('/'); scrollTo(0,0)}}
          className='flex items-center gap-2 py-5'>
          <ArrowLeftIcon className='size-4'/>
          Back to Home</button>

        <div className='flex items-center gap-4'>
           <div className='hidden sm:flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm'>
            <ArrowUpDown className='size-4 text-gray-400' />
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className='text-sm text-gray-600 outline-none bg-transparent cursor-pointer'
            >
              <option value="featured">Sort by: Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>

          <button onClick={()=>setShowFilterPhone(true)} className='flex sm:hidden 
          items-center gap-2 py-5'>
            <Filter className='size-4'/>
            Filters</button>
        </div>
      </div>

      {/* Mobile Sort Select */}
      <div className='flex sm:hidden items-center justify-between gap-4 mb-4'>
        <div className='flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm'>
          <ArrowUpDown className='size-4 text-gray-400' />
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className='w-full text-sm text-gray-600 outline-none bg-transparent'
          >
            <option value="featured">Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>


      <div className='relative flex items-start justify-between gap-8 pb-8'>

       <FilterSidebar setFilters={setFilters} filters={filters} setShowFilterPhone={setShowFilterPhone}
       showFilterPhone={showFilterPhone}/>

        <div className='flex-1 grid xl:grid-cols-2 gap-4'>
         {sortedListings.length > 0 ? (
           sortedListings.map((listing,index)=>(
            <ListingCard listing={listing} key={index}/>
           ))
         ) : (
           <div className='col-span-full py-20 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200'>
             <p className='text-gray-500'>No listings found matching your criteria.</p>
           </div>
         )}
        </div>
      </div>
    </div>
  )
}

export default Marketplace
