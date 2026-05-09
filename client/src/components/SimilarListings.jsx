import React, { useEffect, useState } from 'react'
import api from '../configs/axios'
import ListingCard from './ListingCard'
import { Loader2Icon } from 'lucide-react'
import Title from './Title'

const SimilarListings = ({ listingId }) => {
  const [similarListings, setSimilarListings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSimilar = async () => {
      try {
        setLoading(true)
        const { data } = await api.get(`/api/recommendations/similar/${listingId}`)
        setSimilarListings(data.similarListings || [])
      } catch (error) {
        console.error("Error fetching similar listings:", error)
      } finally {
        setLoading(false)
      }
    }

    if (listingId) {
      fetchSimilar()
    }
  }, [listingId])

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2Icon className="size-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (similarListings.length === 0) {
    return null
  }

  return (
    <div className="mt-16">
      <Title text1={'SIMILAR'} text2={'LISTINGS'} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {similarListings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  )
}

export default SimilarListings
