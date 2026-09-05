import { RoomClient } from "./room-client";

export default async function RoomPage(props: PageProps<"/rooms/[roomId]">) {
  const { roomId } = await props.params;
  return <RoomClient roomId={roomId} />;
}
