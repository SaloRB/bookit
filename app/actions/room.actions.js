'use server'

import { checkAuth } from '@/app/actions/auth.actions'
import { createAdminClient } from '@/config/appwrite'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { ID } from 'node-appwrite'

const {
  NEXT_PUBLIC_APPWRITE_DATABASE_ID: DATABASE_ID,
  NEXT_PUBLIC_APPWRITE_ROOMS_COLLECTION_ID: COLLECTION_ID,
  NEXT_PUBLIC_APPWRITE_ROOMS_STORAGE_BUCKET: STORAGE_BUCKET,
} = process.env

export async function getAllRooms() {
  try {
    const { databases } = await createAdminClient()

    // Fetch rooms
    const { documents: rooms } = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID
    )

    // Revalidate the cache for this path
    revalidatePath('/', 'layout')

    return rooms
  } catch (error) {
    console.log('Failed to get rooms', error)
    redirect('/error')
  }
}

export async function getSingleRoom(id) {
  try {
    const { databases } = await createAdminClient()

    // Fetch rooms
    const room = await databases.getDocument(DATABASE_ID, COLLECTION_ID, id)

    // Revalidate the cache for this path
    revalidatePath('/', 'layout')

    return room
  } catch (error) {
    console.log('Failed to get room', error)
    redirect('/error')
  }
}

export async function createRoom(previousState, formData) {
  // Get databases instance
  const { databases, storage } = await createAdminClient()

  try {
    const { user } = await checkAuth()

    if (!user) {
      return { error: 'You must be logged in to create a room' }
    }

    // Uploading image
    let imageId

    const image = formData.get('image')

    if (image && image.size > 0 && image.name !== 'undefined') {
      try {
        // Upload
        const response = await storage.createFile(
          STORAGE_BUCKET,
          ID.unique(),
          image
        )
        imageId = response.$id
      } catch (error) {
        console.log('Failed to upload image', error)
        return { error: 'Failed to upload image' }
      }
    } else {
      console.log('No image provided or invalid')
    }

    // Create room
    const newRoom = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      ID.unique(),
      {
        user_id: user.id,
        name: formData.get('name'),
        description: formData.get('description'),
        sqft: formData.get('sqft'),
        capacity: formData.get('capacity'),
        price_per_hour: formData.get('price_per_hour'),
        address: formData.get('address'),
        location: formData.get('location'),
        availability: formData.get('availability'),
        amenities: formData.get('amenities'),
        image: imageId,
      }
    )

    revalidatePath('/', 'layout')

    return { success: true }
  } catch (error) {
    console.log('Failed to create room', error)
    const errorMessage = error.response.message || 'Failed to create room'
    return { error: errorMessage }
  }
}
