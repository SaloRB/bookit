'use server'

import { checkAuth } from '@/app/actions/auth.actions'
import { createSessionClient } from '@/config/appwrite'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ID, Query } from 'node-appwrite'

const {
  NEXT_PUBLIC_APPWRITE_DATABASE_ID: DATABASE_ID,
  NEXT_PUBLIC_APPWRITE_BOOKINGS_COLLECTION_ID: COLLECTION_ID,
} = process.env

export async function bookRoom(previousState, formData) {
  const sessionCookie = cookies().get('appwrite-session')
  if (!sessionCookie) redirect('/login')

  try {
    const { databases } = await createSessionClient(sessionCookie.value)

    // Get user's ID
    const { user } = await checkAuth()

    if (!user) {
      return { error: 'You must be logged in to book a room' }
    }

    // Extract date and time from the formData
    const checkInDate = formData.get('check_in_date')
    const checkInTime = formData.get('check_in_time')
    const checkOutDate = formData.get('check_out_date')
    const checkOutTime = formData.get('check_out_time')

    // Combine date and time to ISO 8601 format
    const checkInDateTime = `${checkInDate}T${checkInTime}`
    const checkOutDateTime = `${checkOutDate}T${checkOutTime}`

    const bookingData = {
      check_in: checkInDateTime,
      check_out: checkOutDateTime,
      user_id: user.id,
      room_id: formData.get('room_id'),
    }

    // Create booking
    const newBooking = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      ID.unique(),
      bookingData
    )

    // Revalidate cache
    revalidatePath('/bookings', 'layout')
    return { success: true }
  } catch (error) {
    console.log('Failed to book room', error)
    return { error: 'Failed to book room' }
  }
}

export async function getMyBookings() {
  const sessionCookie = cookies().get('appwrite-session')
  if (!sessionCookie) redirect('/login')

  try {
    const { databases } = await createSessionClient(sessionCookie.value)

    // Get user's ID
    const { user } = await checkAuth()

    if (!user) {
      return { error: 'You must be logged in to view bookings' }
    }

    // Fetch bookings
    const { documents: bookings } = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [Query.equal('user_id', user.id)]
    )

    return bookings
  } catch (error) {
    console.log('Failed to get user bookings', error)
    return { error: 'Failed to get user bookings' }
  }
}

export async function cancelBooking(id) {
  const sessionCookie = cookies().get('appwrite-session')
  if (!sessionCookie) redirect('/login')

  try {
    const { databases } = await createSessionClient(sessionCookie.value)

    // Get user's ID
    const { user } = await checkAuth()

    if (!user) {
      return { error: 'You must be logged in to cancel bookings' }
    }

    // Get booking to cancel
    const booking = await databases.getDocument(DATABASE_ID, COLLECTION_ID, id)

    // Check if booking belongs to current user
    if (booking.user_id !== user.id) {
      return {
        error: 'You cannot cancel a booking that does not belong to you',
      }
    }

    // Delete the booking
    await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, id)

    // Revalidate bookings
    revalidatePath('/bookings', 'layout')

    return { success: true }
  } catch (error) {
    console.log('Failed to cancel booking:', error)
    return { error: 'Failed to cancel booking' }
  }
}
