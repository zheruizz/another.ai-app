-- Seed initial personas for testing
INSERT INTO personas (name, role, description, traits) VALUES
('Tech-Savvy Millennial', 'Early Adopter', 'Young professional who loves trying new gadgets and apps', 
 '{"age_range": "25-35", "tech_comfort": "high", "values": ["innovation", "convenience", "sustainability"]}'::jsonb),

('Budget-Conscious Parent', 'Practical Buyer', 'Parent of 2 kids, focused on value and durability',
 '{"age_range": "35-45", "tech_comfort": "medium", "values": ["value", "durability", "family-friendly"]}'::jsonb),

('Eco-Conscious Consumer', 'Environmental Advocate', 'Prioritizes sustainability and ethical brands',
 '{"age_range": "28-40", "tech_comfort": "medium", "values": ["sustainability", "ethics", "transparency"]}'::jsonb),

('Busy Professional', 'Time-Saver', 'Executive who values efficiency and premium quality',
 '{"age_range": "30-50", "tech_comfort": "high", "values": ["time-saving", "premium", "efficiency"]}'::jsonb),

('Health & Fitness Enthusiast', 'Active Lifestyle', 'Gym-goer and outdoor sports lover',
 '{"age_range": "22-40", "tech_comfort": "high", "values": ["health", "performance", "design"]}'::jsonb),

('Skeptical Senior', 'Traditional Buyer', 'Prefers tried-and-true products, skeptical of new tech',
 '{"age_range": "55-70", "tech_comfort": "low", "values": ["reliability", "simplicity", "tradition"]}'::jsonb),

('Design-Focused Creative', 'Aesthetic Seeker', 'Designer who prioritizes aesthetics and brand',
 '{"age_range": "25-38", "tech_comfort": "high", "values": ["aesthetics", "brand", "uniqueness"]}'::jsonb),

('Student on a Budget', 'Frugal Shopper', 'College student looking for affordable options',
 '{"age_range": "18-24", "tech_comfort": "high", "values": ["affordability", "function", "trends"]}'::jsonb);
