import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import {toast} from 'react-hot-toast'
import {Loader2Icon, Upload, X, Eye, EyeOff} from 'lucide-react'
import { useAuth } from '@clerk/clerk-react'
import api from '../configs/axios'
import { getAllPublicListing, getAllUserListing } from '../app/features/listingSlice'

const ManageListing = () => {
  const {id} = useParams()
  const navigate = useNavigate()
  const {userListings} = useSelector((state)=>state.listing)
  const location = useLocation()

  const {getToken} = useAuth()
  const dispatch = useDispatch()

  const [loadingListing, setLoadingListing] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    platform: '',
    username: '',
    followers_count: '',
    engagement_rate: '',
    monthly_views: '',
    niche: '',
    price: '',
    description: '',
    verified: false,
    monetized: false,
    country: '',
    age_range: '',
    images: [],
    credentials: [
      { name: 'Email', value: '' },
      { name: 'Password', value: '' }
    ],
  })
  
  const [newFieldName, setNewFieldName] = useState("")
  const [showPasswords, setShowPasswords] = useState({})

  const platforms = ['youtube', 'instagram', 'tiktok', 'facebook', 'twitter',
    'linkedin', 'pinterest', 'snapchat', 'twitch', 'discord'];

    const niches = ['lifestyle' , 'fitness', 'food', 'travel', 'tech', 'gaming',
      'fashion', 'beauty', 'business', 'education', 'entertainment', 'music', 'art',
      'sports', 'health', 'finance', 'other'];

    const ageRanges = ['13-17 years','18-24 years', '25-34 years', '35-44 years',
      '45-54 years', '55+ years', 'Mixed ages'];

    const handleInputChange = (field, value)=>{
     setFormData((prev) => ({...prev, [field]: value}));
    }

    const handleImageUpload = async (event) =>{
      const files = Array.from(event.target.files);
      if(!files.length) return;
      if(files.length + formData.images.length > 5) return toast.error("you can add up to 5 images")

      setFormData((prev)=>({...prev, images: [...prev.images, ...files] }))
    }
    
    const removeImage = (indexToRemove) =>{
      setFormData((prev)=>({
      ...prev, images: prev.images.filter((_, i) => i != indexToRemove)
      }))
    }

    const handleCredentialChange = (index, value) => {
      setFormData(prev => ({
        ...prev,
        credentials: prev.credentials.map((c, i) => i === index ? { ...c, value } : c)
      }))
    }

    const addCredentialField = () => {
      const name = newFieldName.trim();
      if (!name) return toast.error("Please enter a field name");
      setFormData(prev => ({
        ...prev,
        credentials: [...prev.credentials, { name, value: '' }]
      }))
      setNewFieldName("")
    }

    const removeCredentialField = (index) => {
      setFormData(prev => ({
        ...prev,
        credentials: prev.credentials.filter((_, i) => i !== index)
      }))
    }
    useEffect(() => {
       if(!id) return;
       setIsEditing(true)
       setLoadingListing(true)
       
       // Try to get from location state (provided by admin dashboard)
       if (location.state?.listing) {
        setFormData(location.state.listing);
        setLoadingListing(false);
       } else {
        // Fallback to userListings (regular user flow)
        const listing = userListings.find((listing)=> listing.id === id)    
        if(listing){
         setFormData(listing)
         setLoadingListing(false)
        }else{
         toast.error("Listing not Found")
         navigate("/my-listings")
        }
       }
    }, [id, location.state])

    const handleSubmit = async (e) =>{
      e.preventDefault();

      // Email validation for credentials
      for (const cred of formData.credentials) {
        if (cred.name.toLowerCase().includes('email')) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(cred.value)) {
            return toast.error(`Please enter a valid email address for ${cred.name}`);
          }
        }
      }

      toast.loading('Saving...')
      const { images, ...dataCopy } = formData;
      try {
        if(isEditing){
          dataCopy.images = formData.images.filter((image)=>typeof image === "string")
          
          const formDataInstance = new FormData() 
          formDataInstance.append('accountDetails', JSON.stringify(dataCopy))

          formData.images.filter((image) => typeof image !== 'string').forEach((image) =>
          {formDataInstance.append('images',image)})

          const token = await getToken()

          const {data} =await api.put('/api/listing',formDataInstance, {headers: { Authorization: `Bearer ${token}` }})
          toast.dismissAll()
          toast.success(data.message)
          dispatch(getAllUserListing({getToken}))
          dispatch(getAllPublicListing())
          navigate('/my-listings')
        }else{
          delete dataCopy.images;
          
          const formDataInstance = new FormData();
          formDataInstance.append('accountDetails', JSON.stringify(dataCopy))
          formData.images.forEach((image)=>{
            formDataInstance.append('images',image)
          })

          const token = await getToken()
          const {data} =await api.post('/api/listing',formDataInstance, {headers: { Authorization: `Bearer ${token}` }})
          toast.dismissAll();
          toast.success(data.message)
          dispatch(getAllUserListing({getToken}))
          dispatch(getAllPublicListing())
          navigate('/my-listings')

        }
      } catch (error) {
        toast.dismissAll();
        toast.error(error?.response?.data?.message || error.message);
      }
    };

    if(loadingListing){
      return (
        <div className='h-screen flex items-center justify-center'>
          <Loader2Icon className = 'size-7 animate-spin text-indigo-600' />
        </div>
      )
    }
    

  return (
    <div className='min-h-screen py-8'>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-800'>
          {isEditing ? "Edit Listing" : "List Your Account"}
        </h1>
        <p className='text-gray-600 mt-2'>
          {isEditing ? "Update your existing account listing": 
          "Create a mock listing to display your account info"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className='space-y-8'>
        {/* BASIC INFO */}
          <Section title='Basic Information'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
               <InputField label='Listing Title *' value={formData.title} 
               placeholder='e.g., Premium Travel Instagram Account' onChange={(v)=>
                 handleInputChange('title', v)} required={true}/>

                 <SelectField label='Platform *' options={platforms} value={formData.platform}
                 onChange={(v)=> handleInputChange('platform', v)} required={true} />

                 <InputField label='Username/Handle *' value={formData.username} 
               placeholder='@username' onChange={(v)=>
                 handleInputChange('username', v)} required={true}/>

                 <SelectField label='Niche/Category *' options={niches} value={formData.niche}
                 onChange={(v)=> handleInputChange('niche', v)} required={true} />

            </div>
          </Section>

          {/* METRICS */}
          <Section title='Account Metrics'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>

                 <InputField label='Followers Count *' type='number'
                 min={0} value={formData.followers_count} 
               placeholder='10000' onChange={(v)=>
                 handleInputChange('followers_count', v)} required={true}/>

                   <InputField label='Engagement Rate (%)' type='number'
                 min={0} max={100} value={formData.engagement_rate} 
               placeholder='4' onChange={(v)=>
                 handleInputChange('engagement_rate', v)} />

                  <InputField label='Monthly Views/Impressions' type='number'
                 min={0} value={formData.monthly_views} 
               placeholder='100000' onChange={(v)=>
                 handleInputChange('monthly_views', v)} />

            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>

                <InputField label='Primary Audience Country' 
                  value={formData.country} 
               placeholder='United States' onChange={(v)=>
                 handleInputChange('country', v)} />

                   <SelectField label='Primary Audience Age Range' options={ageRanges} value={formData.age_range}
                 onChange={(v)=> handleInputChange('age_range', v)}/>

            </div>
            <div className='space-y-3'>
               <CheckboxField label='Account is verified on the platform' checked={formData.verified}
               onChange={(v) => handleInputChange('verified',v)}/>

               <CheckboxField label='Account is monetized' checked={formData.monetized}
               onChange={(v) => handleInputChange('monetized',v)}/>
            </div>
          </Section>
          {/* PRICING */}
          <Section title='Pricing & Description'>
             <InputField label='Asking Price (Rs) *' type='number' min={0}
                  value={formData.price} 
               placeholder='2500.00' onChange={(v)=>
                 handleInputChange('price', v)} required={true} />

                 <TextareaField label='Description *' value={formData.description}
                 onChange={(v)=> handleInputChange('description', v)} required={true} />
          </Section>
          {/* IMAGES */}
          <Section title='Screenshots & Proof' >
             <div className='border-2 border-dashed border-gray-300 rounded-lg p-6
             text-center'>
              <input type='file' id='images' multiple accept='image/*' onChange={handleImageUpload}
              className='hidden' />
              <Upload  className='w-12 h-12 text-gray-400 mx-auto mb-4'/>
              <label htmlFor="images" className='px-4 py-2 border border-gray-300
              rounded-lg hover:bg-gray-50 cursor-pointer'>Choose Files</label>
              <p className='text-sm text-gray-500 mt-2'>Upload screenshots or proof of account analytics</p>
             </div>
             {formData.images.length > 0 && (
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mt-4'>
                {formData.images.map((img, index)=> (
                  <div key={index} className='relative'>
                    <img src={typeof img === 'string' ? img : URL.createObjectURL(img)}
                     alt={`image ${index + 1}`}  className='w-full h-24 object-cover rounded-lg'/>
                     <button type='button' onClick={() => removeImage(index)} className='absolute -top-2 -right-2
                     size-6 bg-red-600 text-white rounded-full hover:bg-red-700'>
                      x
                     </button>
                  </div>
                ))}
              </div>
             )}
          </Section>
          {/* CREDENTIALS */}
          {!isEditing && (
            <Section title='Account Credentials'>
              <p className='text-sm text-gray-500 -mt-2 mb-4'>Provide the login details for the account. These will be verified by our team before the listing goes live.</p>
              <div className='space-y-4'>
                {formData.credentials.map((cred, index) => (
                  <div key={index} className='flex items-end gap-4'>
                    <div className='flex-1'>
                       <label className='block text-xs font-medium text-gray-500 mb-1'>{cred.name}</label>
                       <div className='relative'>
                         <input 
                          type={cred.name.toLowerCase() === 'password' ? (showPasswords[index] ? 'text' : 'password') : 'text'}
                          value={cred.value}
                          onChange={(e) => handleCredentialChange(index, e.target.value)}
                          placeholder={`Enter ${cred.name}`}
                          className='w-full px-3 py-1.5 text-gray-600 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 border-gray-300 pr-10'
                          required
                         />
                         {cred.name.toLowerCase() === 'password' && (
                           <button
                             type='button'
                             onClick={() => setShowPasswords(prev => ({...prev, [index]: !prev[index]}))}
                             className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
                           >
                             {showPasswords[index] ? <EyeOff size={16} /> : <Eye size={16} />}
                           </button>
                         )}
                       </div>
                    </div>
                    {index > 1 && (
                      <button type='button' onClick={() => removeCredentialField(index)} className='p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors'>
                        <X className='size-5' />
                       </button>
                    )}
                  </div>
                ))}
                <div className='flex items-center gap-2 pt-2'>
                  <input 
                    type='text' 
                    value={newFieldName} 
                    onChange={(e) => setNewFieldName(e.target.value)}
                    placeholder='Add custom field (e.g. 2FA Recovery)'
                    className='flex-1 text-sm outline-none border-b border-gray-200 py-1'
                  />
                  <button type='button' onClick={addCredentialField} className='text-sm text-indigo-600 font-medium hover:text-indigo-700'>
                    + Add Field
                  </button>
                </div>
              </div>
            </Section>
          )}
          <div className='flex justify-end gap-3 text-sm'>
            <button onClick={() => navigate(-1)} type='button' className='px-6 py-2 border border-gray-300
            rounded-lg hover:bg-gray-50 transition-colors'>
              Cancel
            </button>
            <button type='submit' className='px-6 py-2 bg-indigo-600 text-white rounded-lg
            hover:bg-indigo-700 transition-colors'>
               {isEditing ? 'Update Listing' : 'Create Listing'}
            </button>
          </div>
      </form>
      </div>
    </div>
  )
}

// Common Elements
const Section = ({title, children})=>(
  <div className='bg-white rounded-lg border border-gray-200 p-6 space-y-6'>
       <h2 className='text-lg font-semibold text-gray-800'>{title}</h2>
       {children}
  </div>
)

const InputField = ({label, value, onChange, placeholder, type = 'text', required = false,
  min = null , max = null})=>(
  <div>
    <label className='block text-sm font-medium text-gray-700 mb-2'>{label}</label>
    <input type={type} min={min} max={max} placeholder={placeholder} value={value}
    onChange={(e)=>onChange(e.target.value)} className='w-full px-3 py-1.5 text-gray-600
    border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 border-gray-300' 
    required={required} />
  </div>
)

const SelectField = ({label, options, value, onChange, required = false}) => (
  <div>
    <label className='block text-sm font-medium text-gray-700 mb-2'>{label}</label>
    <select value={value} onChange={(e)=> onChange(e.target.value)}
      className='w-full px-3 py-1.5 text-gray-600 border rounded-md
      focus:outline-none focus:ring-2 focus:ring-indigo-500 border-gray-300'
      required={required}>
       <option value=''>Select...</option>
       {options.map((opt)=>(
        <option key={opt} value={opt}>{opt}</option>
       ))}
    </select>
  </div>
)

const CheckboxField = ({label, checked, onChange, required = false}) =>(
  <label className='flex items-center space-x-2 cursor-pointer'>
     <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
     className='size-4' required={required} />
     <span className='text-sm text-gray-700'>{label}</span>
  </label>
)

const TextareaField = ({label, value, onChange, required = false}) =>(
  <div>
    <label className='block text-sm font-medium text-gray-700 mb-2'>{label}</label>
    <textarea rows={5} value={value} onChange={(e)=>onChange(e.target.value)}
      className='w-full px-3 py-1.5 text-gray-600 border rounded-md focus:outline-none
      focus:ring-2 focus:ring-indigo-500 border-gray-300' required={required}/>
  </div>
)

export default ManageListing
