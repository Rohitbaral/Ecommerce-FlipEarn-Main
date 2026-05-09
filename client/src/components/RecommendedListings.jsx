import React, { useEffect, useState } from 'react'
import api from '../configs/axios'
import ListingCard from './ListingCard'
import { Loader2Icon, Sparkles } from 'lucide-react'
import Title from './Title'
import { useAuth, useUser } from '@clerk/clerk-react'

const RecommendedListings = () => {
  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        if (!user) {
          setLoading(false)
          return
        }
        setLoading(true)
        const token = await getToken()
        const { data } = await api.get(`/api/recommendations/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setRecommendations(data.recommendations || [])
      } catch (error) {
        console.error("Error fetching recommendations:", error)
      } finally {
        setLoading(false)
      }
    }

    if (isLoaded) {
      fetchRecommendations()
    }
  }, [user, isLoaded, getToken])

  if (!isLoaded || loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2Icon className="size-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (!user || recommendations.length === 0) {
    return null
  }

  return (
    <div className="my-20 px-6 md:px-16 lg:px-24 xl:px-32">
      <div className="flex items-center gap-2 mb-8">
        <Sparkles className="text-indigo-600 size-6" />
        <Title text1={'RECOMMENDED'} text2={'FOR YOU'} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {recommendations.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  )
}

export default RecommendedListings
