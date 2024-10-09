import { getAllRooms } from '@/app/actions/room.actions'
import Heading from '@/app/components/Heading'
import RoomCard from '@/app/components/RoomCard'

export default async function Home() {
  const rooms = await getAllRooms()

  return (
    <>
      <Heading title="Available Rooms" />
      {rooms.length > 0 ? (
        rooms.map((room) => <RoomCard key={room.$id} room={room} />)
      ) : (
        <p>No rooms available at the moment</p>
      )}
    </>
  )
}
