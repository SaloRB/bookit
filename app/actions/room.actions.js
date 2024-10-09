'use server'

import { checkAuth } from '@/app/actions/auth.actions'
import { createAdminClient, createSessionClient } from '@/config/appwrite'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ID, Query } from 'node-appwrite'

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

export async function getMyRooms() {
  const sessionCookie = cookies().get('appwrite-session')
  if (!sessionCookie) redirect('/login')

  try {
    const { account, databases } = await createSessionClient(
      sessionCookie.value
    )

    // Get user's ID
    const user = await account.get()
    const userId = user.$id

    // Fetch rooms
    const { documents: rooms } = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [Query.equal('user_id', userId)]
    )

    return rooms
  } catch (error) {
    console.log('Failed to get user rooms', error)
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

export async function deleteRoom(id) {
  const sessionCookie = cookies().get('appwrite-session')
  if (!sessionCookie) redirect('/login')

  try {
    const { account, databases } = await createSessionClient(
      sessionCookie.value
    )

    // Get user's ID
    const user = await account.get()
    const userId = user.$id
    // Fetch user's rooms
    const { documents: rooms } = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [Query.equal('user_id', userId)]
    )

    // Find the room to delete
    const roomToDelete = rooms.find((room) => room.$id === id)

    // Delete the room
    if (roomToDelete) {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTION_ID,
        roomToDelete.$id
      )

      // Revalidate my rooms and all rooms
      revalidatePath('/rooms/my-rooms', 'layout')
      revalidatePath('/', 'layout')

      return { success: true }
    } else {
      return { error: 'Room not found' }
    }
  } catch (error) {
    console.log('Failed to delete room:', error)
    return { error: 'Failed to delete room' }
  }
}
