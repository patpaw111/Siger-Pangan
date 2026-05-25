import 'package:flutter/material.dart';
import '../../core/constants/colors.dart';

class DashboardPage extends StatelessWidget {
  const DashboardPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50, // Latar belakang abu-abu ultra-light yang bersih
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. MODERN HEADER WITH CARD PROFILE
            _buildHeader(context),
            
            const SizedBox(height: 25),

            // 2. LAYANAN UTAMA SECTION (GRID KEKINIAN)
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 20.0),
              child: Text(
                "Layanan Utama",
                style: TextStyle(
                  fontSize: 18, 
                  fontWeight: FontWeight.bold, 
                  color: AppColors.textPrimary,
                  letterSpacing: 0.3,
                ),
              ),
            ),
            const SizedBox(height: 15),
            _buildGridMenu(context), // Memanggil fungsi grid menu

            const SizedBox(height: 30),

            // 3. RINGKASAN TREN HARGA (PROGRES INFORMASI REAL-TIME)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    "Ringkasan Tren Pangan",
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                  ),
                  TextButton(
                    onPressed: () => Navigator.pushNamed(context, '/monitor'),
                    child: Text("Lihat Semua", style: TextStyle(color: AppColors.primaryGreen, fontWeight: FontWeight.bold)),
                  )
                ],
              ),
            ),
            _buildQuickOverview(), // FIX: Memanggil langsung ringkasan tanpa _buildFilterTab pembawa error
            const SizedBox(height: 25),
          ],
        ),
      ),
    );
  }

  // --- KUMPULAN METHOD WIDGET PEMBENTUK DASHBOARD ---

  // Komponen Header Atas Modern
  Widget _buildHeader(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: AppColors.primaryGreen,
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(32),
          bottomRight: Radius.circular(32),
        ),
      ),
      padding: const EdgeInsets.fromLTRB(24, 60, 24, 30),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(2),
                    decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                    child: const CircleAvatar(
                      radius: 26,
                      backgroundColor: Colors.white,
                      backgroundImage: AssetImage('assets/images/logo DKPTPh Prov Lampung.jpeg'),
                    ),
                  ),
                  const SizedBox(width: 15),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "Selamat Datang,",
                        style: TextStyle(fontSize: 14, color: Colors.white.withOpacity(0.8)),
                      ),
                      const Text(
                        "Pegawai DKPTPH",
                        style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    ],
                  ),
                ],
              ),
              IconButton(
                icon: const Icon(Icons.logout_rounded, color: Colors.white, size: 26),
                onPressed: () => Navigator.pushReplacementNamed(context, '/login'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // Komponen Grid Menu Utama Kekinian
  Widget _buildGridMenu(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20.0),
      child: GridView.count(
        crossAxisCount: 2,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
        childAspectRatio: 1.15,
        children: [
          _buildMenuCard(
            context,
            title: "Pantauan Harga",
            desc: "Info harga komoditas",
            icon: Icons.analytics_outlined,
            color: Colors.orange.shade50,
            iconColor: Colors.orange.shade700,
            route: '/monitor',
          ),
          _buildMenuCard(
            context,
            title: "Asisten AI",
            desc: "Tanya Gemini Flash",
            icon: Icons.auto_awesome_outlined,
            color: Colors.blue.shade50,
            iconColor: Colors.blue.shade700,
            route: '/chatbot', 
          ),
        ],
      ),
    );
  }

  Widget _buildMenuCard(
    BuildContext context, {
    required String title,
    required String desc,
    required IconData icon,
    required Color color,
    required Color iconColor,
    required String route,
  }) {
    return InkWell(
      onTap: () => Navigator.pushNamed(context, route),
      borderRadius: BorderRadius.circular(24),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: Colors.grey.shade100, width: 1.5),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.02),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(color: color, shape: BoxShape.circle),
              child: Icon(icon, color: iconColor, size: 26),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                ),
                const SizedBox(height: 4),
                Text(
                  desc,
                  style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // Komponen Ringkasan Cepat Dashboard
  Widget _buildQuickOverview() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20.0),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.grey.shade100),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _buildMiniTrendItem("🌾 Beras Med.", "Rp 13.500", true),
            Container(height: 30, width: 1, color: Colors.grey.shade200),
            _buildMiniTrendItem("🌶️ Cabai Merah", "Rp 45.000", false),
          ],
        ),
      ),
    );
  }

  Widget _buildMiniTrendItem(String name, String price, bool isUp) {
    return Column(
      children: [
        Text(name, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: AppColors.textSecondary)),
        const SizedBox(height: 4),
        Row(
          children: [
            Text(price, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
            const SizedBox(width: 4),
            Icon(
              isUp ? Icons.arrow_upward_rounded : Icons.arrow_downward_rounded,
              color: isUp ? Colors.red : Colors.green,
              size: 14,
            ),
          ],
        ),
      ],
    );
  }
}