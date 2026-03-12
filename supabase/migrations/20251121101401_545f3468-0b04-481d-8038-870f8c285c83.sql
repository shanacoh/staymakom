-- Create enum for booking extras status
CREATE TYPE booking_extra_status AS ENUM ('pending', 'done', 'unavailable');

-- Add new columns to booking_extras table
ALTER TABLE booking_extras
ADD COLUMN extra_name text,
ADD COLUMN extra_type text,
ADD COLUMN price numeric DEFAULT 0,
ADD COLUMN status booking_extra_status DEFAULT 'pending',
ADD COLUMN notes text,
ADD COLUMN updated_at timestamp with time zone DEFAULT now();

-- Create trigger for updated_at
CREATE TRIGGER update_booking_extras_updated_at
  BEFORE UPDATE ON booking_extras
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies for hotel admins to manage extras
CREATE POLICY "Hotel admins can update their booking extras"
  ON booking_extras
  FOR UPDATE
  USING (
    booking_id IN (
      SELECT b.id FROM bookings b
      WHERE b.hotel_id = get_user_hotel_id(auth.uid())
    )
    AND has_role(auth.uid(), 'hotel_admin'::app_role)
  );

CREATE POLICY "Admins can view all booking extras"
  ON booking_extras
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all booking extras"
  ON booking_extras
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Hotel admins can view their booking extras"
  ON booking_extras
  FOR SELECT
  USING (
    booking_id IN (
      SELECT b.id FROM bookings b
      WHERE b.hotel_id = get_user_hotel_id(auth.uid())
    )
    AND has_role(auth.uid(), 'hotel_admin'::app_role)
  );