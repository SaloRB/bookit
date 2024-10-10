'use server'

import { checkAuth } from '@/app/actions/auth.actions'
import { createSessionClient } from '@/config/appwrite'
import { dateRangesOverlap, toUTCDateTime } from '@/lib/utils'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ID, Query } from 'node-appwrite'

const {
  NEXT_PUBLIC_APPWRITE_DATABASE_ID: DATABASE_ID,
  NEXT_PUBLIC_APPWRITE_BOOKINGS_COLLECTION_ID: BOOKINGS_COLLECTION_ID,
  NEXT_PUBLIC_APPWRITE_ROOMS_COLLECTION_ID: ROOMS_COLLECTION_ID,
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

    // Get room ID
    const roomId = formData.get('room_id')

    // Combine date and time to ISO 8601 format
    const checkInDateTime = `${checkInDate}T${checkInTime}`
    const checkOutDateTime = `${checkOutDate}T${checkOutTime}`

    // Check if room is available
    const isAvailable = await checkRoomAvailability(
      roomId,
      checkInDateTime,
      checkOutDateTime
    )

    if (!isAvailable) {
      return { error: 'Room is not available for the selected dates' }
    }

    const bookingData = {
      check_in: checkInDateTime,
      check_out: checkOutDateTime,
      user_id: user.id,
      room_id: roomId,
    }

    // Create booking
    const newBooking = await databases.createDocument(
      DATABASE_ID,
      BOOKINGS_COLLECTION_ID,
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
      BOOKINGS_COLLECTION_ID,
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
    const booking = await databases.getDocument(
      DATABASE_ID,
      BOOKINGS_COLLECTION_ID,
      id
    )

    // Check if booking belongs to current user
    if (booking.user_id !== user.id) {
      return {
        error: 'You cannot cancel a booking that does not belong to you',
      }
    }

    // Delete the booking
    await databases.deleteDocument(DATABASE_ID, BOOKINGS_COLLECTION_ID, id)

    // Revalidate bookings
    revalidatePath('/bookings', 'layout')

    return { success: true }
  } catch (error) {
    console.log('Failed to cancel booking:', error)
    return { error: 'Failed to cancel booking' }
  }
}

export async function checkRoomAvailability(roomId, checkIn, checkOut) {
  const sessionCookie = cookies().get('appwrite-session')
  if (!sessionCookie) redirect('/login')

  try {
    const { databases } = await createSessionClient(sessionCookie.value)

    const checkInDateTime = toUTCDateTime(checkIn)
    const checkOutDateTime = toUTCDateTime(checkOut)

    // Fetch all bookings for a given room
    const { documents: bookings } = await databases.listDocuments(
      DATABASE_ID,
      BOOKINGS_COLLECTION_ID,
      [Query.equal('room_id', roomId)]
    )

    // Loop over bookings and check for overlaps
    for (const booking of bookings) {
      const bookingCheckInDateTime = toUTCDateTime(booking.check_in)
      const bookingCheckOutDateTime = toUTCDateTime(booking.check_out)

      if (
        dateRangesOverlap(
          checkInDateTime,
          checkOutDateTime,
          bookingCheckInDateTime,
          bookingCheckOutDateTime
        )
      ) {
        return false // Overlapping found, do not book
      }
    }

    // No overlapping found, room is available
    return true
  } catch (error) {
    console.log('Failed to check availabilty', error)
    return { error: 'Failed to check availability' }
  }
}
