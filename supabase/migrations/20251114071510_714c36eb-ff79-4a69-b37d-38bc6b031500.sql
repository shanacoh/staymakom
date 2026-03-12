-- Add seed data: 3 sample hotels with experiences
INSERT INTO hotels (id, name, slug, region, city, status, hero_image, commission_rate, latitude, longitude) VALUES
('11111111-1111-1111-1111-111111111111', 'Desert Oasis Retreat', 'desert-oasis-retreat', 'Negev', 'Mitzpe Ramon', 'published', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', 18.00, 30.6103, 34.8010),
('22222222-2222-2222-2222-222222222222', 'Galilee Luxury Lodge', 'galilee-luxury-lodge', 'North', 'Rosh Pina', 'pending', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800', 18.00, 32.9686, 35.5383),
('33333333-3333-3333-3333-333333333333', 'Mediterranean Beach Villa', 'mediterranean-beach-villa', 'Center', 'Tel Aviv', 'draft', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800', 18.00, 32.0853, 34.7818)
ON CONFLICT (id) DO NOTHING;

-- Add sample experiences for each hotel
INSERT INTO experiences (hotel_id, category_id, title, slug, subtitle, base_price, currency, status, min_nights, max_nights, min_party, max_party) VALUES
-- Desert Oasis Retreat (published hotel)
('11111111-1111-1111-1111-111111111111', (SELECT id FROM categories LIMIT 1), 'Stargazing Adventure', 'desert-stargazing-adventure', 'Sleep under the stars in luxury', 450, 'USD', 'published', 2, 3, 2, 6),
('11111111-1111-1111-1111-111111111111', (SELECT id FROM categories LIMIT 1), 'Desert Hiking Experience', 'desert-hiking-experience', 'Explore ancient craters', 380, 'USD', 'published', 1, 2, 2, 8),
('11111111-1111-1111-1111-111111111111', (SELECT id FROM categories LIMIT 1), 'Yoga & Wellness Retreat', 'desert-yoga-wellness', 'Find your inner peace', 520, 'USD', 'draft', 3, 5, 2, 4),
-- Galilee Luxury Lodge (pending hotel)
('22222222-2222-2222-2222-222222222222', (SELECT id FROM categories LIMIT 1), 'Wine Tasting Tour', 'galilee-wine-tasting', 'Discover local vineyards', 290, 'USD', 'published', 1, 2, 2, 10),
('22222222-2222-2222-2222-222222222222', (SELECT id FROM categories LIMIT 1), 'Nature Photography Workshop', 'galilee-photography-workshop', 'Capture the beauty of nature', 340, 'USD', 'draft', 2, 3, 2, 6),
-- Mediterranean Beach Villa (draft hotel)
('33333333-3333-3333-3333-333333333333', (SELECT id FROM categories LIMIT 1), 'Sunset Beach Dinner', 'tel-aviv-sunset-dinner', 'Romantic dining by the sea', 280, 'USD', 'draft', 1, 1, 2, 2),
('33333333-3333-3333-3333-333333333333', (SELECT id FROM categories LIMIT 1), 'Surfing Lessons', 'tel-aviv-surfing-lessons', 'Ride the Mediterranean waves', 150, 'USD', 'draft', 1, 1, 1, 4)
ON CONFLICT (slug) DO NOTHING;