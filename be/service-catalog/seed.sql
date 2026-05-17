-- Seeder for commodities (using ON CONFLICT (name) DO NOTHING because name is UNIQUE)
INSERT INTO commodities (name, unit) VALUES
('Beras Kualitas Bawah I', 'kg'),
('Beras Kualitas Bawah II', 'kg'),
('Beras Kualitas Medium I', 'kg'),
('Beras Kualitas Medium II', 'kg'),
('Beras Kualitas Super I', 'kg'),
('Beras Kualitas Super II', 'kg'),
('Daging Ayam Ras Segar', 'kg'),
('Daging Sapi Kualitas 1', 'kg'),
('Daging Sapi Kualitas 2', 'kg'),
('Telur Ayam Ras Segar', 'kg'),
('Bawang Merah Ukuran Sedang', 'kg'),
('Bawang Putih Ukuran Sedang', 'kg'),
('Cabai Merah Besar', 'kg'),
('Cabai Merah Keriting', 'kg'),
('Cabai Rawit Hijau', 'kg'),
('Cabai Rawit Merah', 'kg'),
('Minyak Goreng Curah', 'liter'),
('Minyak Goreng Kemasan Bermerk 1', 'liter'),
('Minyak Goreng Kemasan Bermerk 2', 'liter'),
('Gula Pasir Kualitas Premium', 'kg'),
('Gula Pasir Lokal', 'kg')
ON CONFLICT (name) DO NOTHING;

-- Seeder for regions (inserting 15 Lampung regencies statically to ensure they exist)
INSERT INTO regions (name, type) VALUES
('Provinsi Lampung', 'PROVINCE'),
('Kabupaten Lampung Barat', 'REGENCY'),
('Kabupaten Tanggamus', 'REGENCY'),
('Kabupaten Lampung Selatan', 'REGENCY'),
('Kabupaten Lampung Timur', 'REGENCY'),
('Kabupaten Lampung Tengah', 'REGENCY'),
('Kabupaten Lampung Utara', 'REGENCY'),
('Kabupaten Way Kanan', 'REGENCY'),
('Kabupaten Tulang Bawang', 'REGENCY'),
('Kabupaten Pesawaran', 'REGENCY'),
('Kabupaten Pringsewu', 'REGENCY'),
('Kabupaten Mesuji', 'REGENCY'),
('Kabupaten Tulang Bawang Barat', 'REGENCY'),
('Kabupaten Pesisir Barat', 'REGENCY'),
('Kota Bandar Lampung', 'CITY'),
('Kota Metro', 'CITY');
