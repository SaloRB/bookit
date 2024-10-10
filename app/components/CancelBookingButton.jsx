'use client'

import { cancelBooking } from '@/app/actions/booking.actions'
import { toast } from 'react-toastify'

const CancelBookingButton = ({ bookingId }) => {
  const handleCancel = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to cancel this booking?'
    )

    if (confirmed) {
      try {
        const result = await cancelBooking(bookingId)
        if (result.success) {
          toast.success('Booking cancelled successfully')
        }
      } catch (error) {
        console.log('Failed to cancel booking', error)
        toast.error('Failed to cancel booking')
      }
    }
  }

  return (
    <button
      onClick={handleCancel}
      className="bg-red-500 text-white px-4 py-2 rounded w-full sm:w-auto text-center hover:bg-red-700"
    >
      Cancel Booking
    </button>
  )
}
export default CancelBookingButton
