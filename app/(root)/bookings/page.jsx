import { getMyBookings } from '@/app/actions/booking.actions'
import BookedRoomCard from '@/app/components/BookedRoomCard'
import Heading from '@/app/components/Heading'

const BookingsPage = async () => {
  const bookings = await getMyBookings()

  return (
    <>
      <Heading title="My Bookings" />
      {bookings.length > 0 ? (
        bookings.map((booking) => (
          <BookedRoomCard key={booking.$id} booking={booking} />
        ))
      ) : (
        <p className="text-gray-600 mt-4">You have no bookings</p>
      )}
    </>
  )
}

export default BookingsPage
