# SkyShare Academy — Member Portal (v0.1)

Portal terpadu untuk anggota ekosistem **SkyShare Academy** (khusus Mentor dan Talent/Peserta), dibangun dengan performa tinggi, antarmuka responsif modern, serta estetika visual **Industrial Skeuomorphism (Industrial Realism)**.

---

## 🚀 Gambaran Umum

SkyShare Academy Portal dirancang untuk memfasilitasi kebutuhan operasional dan pembelajaran anggota:
- **Autentikasi Aman & Cepat**: Login dan Registrasi berbasis OTP (Email atau WhatsApp).
- **Dashboard Dual-Role**: Mode antarmuka spesifik untuk **Mentor** dan **Talent** dengan switch instan.
- **Event & Bootcamp Tracker**: Akses jadwal intensif bootcamp, kuota tersisa, dan formulir pengumpulan berkas tugas.
- **Modul & Materi Pembelajaran**: Katalog materi eksklusif dengan filter kategori interaktif.
- **Log Aktivitas**: Jejak rekam aktivitas pengguna dan audit operasional sistem.
- **Profil Anggota & Notifikasi Realtime**: Pengaturan profil terintegrasi dengan komponen alert skeuomorphic dan sistem toast melayang (*floating notifications*).

---

## 🎨 Karakteristik Desain: Industrial Skeuomorphism

Portal ini mengimplementasikan bahasa desain **Industrial Realism**:
1. **Pencahayaan Konsisten**: Aksen *diffuse highlight* bersudut 45° dari kiri atas.
2. **Dual Neumorphic Shadows**: Bayangan ganda kontras (soft highlight atas-kiri `#ffffff` dan depth bayangan bawah-kanan `#b5c2d3`).
3. **Hardware Details**: Aksen sekrup sudut (*corner screws*), slot ventilasi pendingin, serta efek CRT scanline halus pada modul konsol banner.
4. **Indikator LED Status Aktif**: Lampu status berdenyut (*pulsing LEDs*) dengan efek pendar cahaya (*glow ring*).
5. **Telemetri Monospace**: Label teknis sistematis (contoh: `PORTAL // V0.1`, `SYS // 200_SUCCESS`, `GATE // 01-AUTH`).
6. **Palet Warna Resmi**:
   - **Primary Navy/Sky**: `#1E5FAD`, `#0284C7`, `#38BDF8`
   - **Chassis Surface**: `#ebf0f7`, `#dce3ec`
   - **Dark Chassis / Header**: `#0F172A`, `#174F96`

---

## 📱 Responsivitas & Animasi

- **GSAP Animation Engine**: Transisi masuk bertingkat (*staggered entrance*), fisika pegas mekanikal (*mechanical spring dampening* `back.out(1.5)`), animasi pendar maskot mengambang (*sine wave float*), dan counter digital stat dinamis.
- **Mobile & Tablet Optimized**:
  - **Animated Hamburger**: Tuts 3D pada navbar yang bertransformasi halus menjadi tombol silang (X).
  - **Slide-out Console Drawer**: Menu navigasi lengkap, switcher role, dan info profil untuk layar sentuh.
  - **Bottom Dock Taskbar**: Taskbar hardware mengambang di bawah layar mobile/tablet untuk akses cepat menu utama.

---

## 🛠️ Tech Stack

| Kategori | Teknologi | Deskripsi |
| :--- | :--- | :--- |
| **Framework** | [Vue 3](https://vuejs.org/) | Composition API dengan `<script setup>` |
| **Build Tool** | [Vite 8](https://vite.dev/) | Bundler generasi baru yang ultra-cepat |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Static typing & type safety penuh |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Styling berbasis token modern dengan `@theme` |
| **Motion** | [GSAP 3](https://greensock.com/gsap/) | GreenSock Animation Platform untuk animasi fisika |
| **State** | [Pinia](https://pinia.vuejs.org/) | State management modular & reaktif |
| **Routing** | [Vue Router 5](https://router.vuejs.org/) | Navigasi SPA & route guards autentikasi |

---

## 📂 Struktur Direktori

```text
skyshareacademy-portal/
├── public/
│   ├── favicon.ico
│   └── images/
│       ├── logo placeholder.webp       # Logo resmi SkyShare
│       ├── Mentor-logo.webp            # Badge logo Mentor
│       ├── Talent-logo.webp            # Badge logo Talent
│       └── mascot-icons/               # Koleksi maskot SkyShare (pose 1 - 10, dll)
├── src/
│   ├── assets/                         # Aset visual & grafis
│   ├── components/
│   │   └── common/
│   │       ├── AppAlert.vue            # Alert hardware (success, error, warning, info)
│   │       ├── AppBadge.vue            # Label badge metalik dengan LED
│   │       ├── AppButton.vue           # Tuts tombol mekanikal 3D
│   │       ├── AppEmptyState.vue       # Bezel frame dengan podium maskot
│   │       ├── AppInput.vue            # Slot input data dengan recessed inner shadow
│   │       └── AppToastContainer.vue   # Container floating notification melayang
│   ├── composables/
│   │   └── useAlert.ts                 # Reaktif helper pemanggil alert & toast
│   ├── layouts/
│   │   ├── AuthLayout.vue              # Layout gerbang autentikasi
│   │   └── PortalLayout.vue            # Layout utama portal (Navbar, Dock, Drawer)
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.vue           # Halaman login OTP
│   │   │   └── RegisterPage.vue        # Halaman onboarding multi-step
│   │   └── portal/
│   │       ├── DashboardPage.vue       # Konsol dashboard anggota (v0.1)
│   │       ├── EventsPage.vue          # Direktori event & bootcamp
│   │       ├── EventDetailPage.vue     # Detail event & upload tugas
│   │       ├── MaterialsPage.vue       # Katalog modul materi pembelajaran
│   │       ├── MaterialDetailPage.vue  # Pembaca modul materi
│   │       ├── ActivityPage.vue        # Audit trail & log aktivitas
│   │       └── ProfilePage.vue         # Pengaturan identitas akun
│   ├── router/                         # Konfigurasi Vue Router & guards
│   ├── stores/                         # Pinia store (Auth, State)
│   ├── types/                          # TypeScript interface & types
│   ├── utils/                          # GSAP helper animasi & easing
│   ├── App.vue                         # Root component
│   ├── main.ts                         # Inisialisasi aplikasi
│   └── style.css                       # Desain token & utilitas neumorphic
├── package.json                        # Versi proyek: v0.1.0
├── tsconfig.json                       # Konfigurasi TypeScript
└── vite.config.ts                      # Konfigurasi bundler Vite
```

---

## ⚡ Memulai Proyek (Getting Started)

### Prasyarat
- [Node.js](https://nodejs.org/) versi `>= 18.0.0`
- [pnpm](https://pnpm.io/) versi `>= 9.0.0` (disarankan) atau `npm`

### 1. Klon Repositori & Instal Dependensi
```bash
git clone <repository-url>
cd skyshareacademy-portal
pnpm install
```

### 2. Jalankan Mode Pengembangan (Dev Server)
```bash
pnpm run dev
```
Buka peramban di [http://localhost:5173](http://localhost:5173) (atau port yang tertera pada konsol).

### 3. Pemeriksaan Tipe & Linter
```bash
# Typecheck TypeScript
pnpm run typecheck

# Lint kode
pnpm run lint
```

### 4. Build untuk Lingkungan Produksi
```bash
pnpm run build
```
Hasil build produksi yang telah dioptimalkan akan tersedia di folder `dist/`.

### 5. Preview Hasil Build
```bash
pnpm run preview
```

---

## 📝 Catatan Rilis

### `v0.1.0` (Versi Awal)
- Arsitektur dasar Portal SkyShare Academy dengan Vue 3 & Vite.
- Implementasi desain sistem *Industrial Skeuomorphism*.
- Gerbang autentikasi OTP (Email / WhatsApp) untuk Mentor dan Talent.
- Dashboard anggota interaktif dengan counter statis dan ticker animasi GSAP.
- Direktori Event, Modul Materi Pembelajaran, dan Aktivitas.
- Komponen dedicated `AppAlert` dan sistem toast notifikasi terpadu.
- Full responsivitas layar (Desktop, Tablet, Mobile) dengan hamburger menu dan mobile taskbar dock.

---

## 📄 Lisensi
Hak Cipta &copy; 2026 **SkyShare Academy**. Hak cipta dilindungi undang-undang.
