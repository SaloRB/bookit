import { getMyRooms } from '@/app/actions/room.actions'
import Heading from '@/app/components/Heading'
import MyRoomCard from '@/app/components/MyRoomCard'

const MyRoomsPage = async () => {
  const rooms = await getMyRooms()

  return (
    <>
      <Heading title="My Room Listings" />
      {rooms.length > 0 ? (
        rooms.map((room) => <MyRoomCard key={room.$id} room={room} />)
      ) : (
        <p>You have no room listings</p>
      )}
    </>
  )
}
export default MyRoomsPage
