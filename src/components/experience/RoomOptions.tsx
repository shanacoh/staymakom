/**
 * RoomOptions V1 — used by BookingPanel V1 (Experience old route)
 * Minimal stub preserved to maintain backward compatibility
 */
interface RoomOptionsProps {
  hotelId: string;
  checkin: string | Date;
  checkout: string | Date;
  guests: number;
  selectedRoom: any;
  onSelectRoom: (room: any) => void;
}

const RoomOptions = (_props: RoomOptionsProps) => {
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Room selection (V1)</p>
    </div>
  );
};

export default RoomOptions;
