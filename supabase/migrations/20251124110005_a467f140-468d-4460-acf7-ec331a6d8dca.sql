-- Add 'archived' status to hotel_status enum
ALTER TYPE hotel_status ADD VALUE IF NOT EXISTS 'archived';