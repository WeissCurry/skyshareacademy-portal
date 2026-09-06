<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import AppBadge from "@/components/common/AppBadge.vue";
import AppButton from "@/components/common/AppButton.vue";

const route = useRoute();
const router = useRouter();

const materialId = route.params.id;
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Navigation Back -->
    <div class="flex items-center gap-2 text-xs font-semibold text-slate-500">
      <button
        class="hover:text-[#1E5FAD] flex items-center gap-1 cursor-pointer"
        @click="router.back()"
      >
        <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        <span>Kembali ke Katalog Materi</span>
      </button>
      <span>/</span>
      <span class="text-slate-800">Modul #{{ materialId }}</span>
    </div>

    <!-- Article Reader Card -->
    <article class="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 space-y-8 shadow-xs">
      <!-- Article Header -->
      <div class="space-y-4 border-b border-slate-100 pb-6">
        <div class="flex flex-wrap items-center gap-2">
          <AppBadge variant="mentor">Tech & Cloud</AppBadge>
          <span class="text-xs text-slate-400">•</span>
          <span class="text-xs text-slate-500 font-medium">12 menit waktu baca</span>
          <span class="text-xs text-slate-400">•</span>
          <span class="text-xs font-semibold text-emerald-600">Terverifikasi Member SkyShare</span>
        </div>

        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
          Panduan Komprehensif Arsitektur Cloud & Scalability 2026
        </h1>

        <div class="flex items-center gap-3 pt-2">
          <div class="size-10 rounded-full bg-blue-100 text-[#1E5FAD] font-bold text-sm flex items-center justify-center">
            SS
          </div>
          <div>
            <p class="text-xs font-bold text-slate-800">Tim Kurikulum SkyShare Academy</p>
            <p class="text-[11px] text-slate-400">Diperbarui pada 5 September 2026</p>
          </div>
        </div>
      </div>

      <!-- Article Content Body -->
      <div class="prose prose-slate max-w-none text-sm text-slate-700 leading-relaxed space-y-5">
        <p class="text-base text-slate-600 font-medium leading-relaxed">
          Dalam lanskap rekayasa perangkat lunak modern, membangun aplikasi yang siap melayani ribuan hingga jutaan pengguna aktif secara simultan membutuhkan pemahaman mendalam tentang prinsip-prinsip <em>decoupling</em> dan <em>horizontal scalability</em>.
        </p>

        <h2 class="text-lg font-bold text-slate-800 pt-3">
          1. Mengapa Stateless Architecture Menjadi Standar Emas?
        </h2>
        <p>
          Aplikasi yang bersifat <em>stateful</em> menyimpan sesi pengguna pada memori server lokal. Ketika beban request meningkat tajam, load balancer tidak dapat mengalihkan trafik secara fleksibel ke node server lain tanpa memutuskan koneksi pengguna. Sebaliknya, dengan pendekatan <em>stateless</em> (misalnya menggunakan JWT token dengan httpOnly cookie), setiap instance server dapat melayani permintaan dari pengguna mana pun secara adil.
        </p>

        <div class="p-4 rounded-xl bg-blue-50/60 border-l-4 border-[#1E5FAD] text-xs text-slate-700 leading-relaxed">
          <strong>Insight Arsitektur:</strong> Pada SkyShare Portal, sesi autentikasi dikelola secara stateless melalui JSON Web Tokens yang ditandatangani dan diverifikasi oleh server, memungkinkan skalabilitas tinggi untuk melayani lebih dari 5.000 user aktif secara bersamaan tanpa beban memori server berlebih.
        </div>

        <h2 class="text-lg font-bold text-slate-800 pt-3">
          2. Manajemen Penyimpanan & CDN
        </h2>
        <p>
          File statis seperti gambar booklet, video rekaman mentoring, dan berkas tugas yang diunggah oleh peserta tidak boleh disimpan langsung pada filesystem container server. Menggunakan layanan object storage terdistribusi seperti Cloudinary atau S3 bucket memastikan integritas data dan kecepatan unduh yang optimal dari berbagai lokasi geografis di Indonesia.
        </p>

        <h2 class="text-lg font-bold text-slate-800 pt-3">
          3. Ringkasan & Checklist Implementasi
        </h2>
        <ul class="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
          <li>Pastikan seluruh endpoint autentikasi menggunakan token expiration dan refresh token yang aman.</li>
          <li>Gunakan database connection pooling untuk mencegah connection exhaustion saat lonjakan trafik.</li>
          <li>Terapkan indexing pada kolom pencarian utama seperti <code>email</code> dan <code>target_role</code>.</li>
        </ul>
      </div>

      <!-- Action Bottom -->
      <div class="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
        <div class="text-xs text-slate-500">
          Kamu menyukai materi ini? Bagikan feedback ke mentor.
        </div>
        <div class="flex items-center gap-2">
          <AppButton variant="outline-primary" class-name="h-10 px-4 text-xs" @click="router.push('/events')">
            Ikuti Event Terkait
          </AppButton>
          <AppButton variant="primary" class-name="h-10 px-4 text-xs" @click="router.push('/materials')">
            Materi Selanjutnya
          </AppButton>
        </div>
      </div>
    </article>
  </div>
</template>
