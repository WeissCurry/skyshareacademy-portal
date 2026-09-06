<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { animatePageEntrance } from "@/utils/animations";

const authStore = useAuthStore();
const containerRef = ref<HTMLElement | null>(null);

const activities = ref([
  {
    id: 1,
    action: "Login Sesi Akun Portal",
    code: "AUTH // 200_SESSION_ACTIVE",
    detail: "Berhasil masuk melalui portal.skyshareacademy.id menggunakan otentikasi sesi aman.",
    time: "Hari ini, 08:32 WIB",
    category: "auth",
  },
  {
    id: 2,
    action: "Verifikasi Kode OTP Berhasil",
    code: "OTP // 200_VERIFIED",
    detail: `Verifikasi nomor/email ${authStore.user?.email || authStore.user?.phone || 'terdaftar'} selesai dengan status valid.`,
    time: "Hari ini, 08:30 WIB",
    category: "auth",
  },
  {
    id: 3,
    action: "Melihat Katalog Event & Bootcamp",
    code: "EVENT // VIEW_DETAIL",
    detail: "Membuka halaman detail kurikulum AI & Fullstack Engineering Bootcamp.",
    time: "Kemarin, 19:15 WIB",
    category: "event",
  },
  {
    id: 4,
    action: "Membaca Materi Modul Cloud",
    code: "MODUL // READ_ACCESS",
    detail: "Membaca artikel 'Panduan Komprehensif Arsitektur Cloud & Scalability 2026'.",
    time: "Kemarin, 15:40 WIB",
    category: "material",
  },
  {
    id: 5,
    action: "Registrasi Akun Portal SkyShare",
    code: "USER // REGISTER_OK",
    detail: `Pendaftaran akun profil dengan role awal ${authStore.userRole}.`,
    time: "5 September 2026",
    category: "auth",
  },
]);

onMounted(() => {
  if (containerRef.value) {
    animatePageEntrance(containerRef.value, ".activity-node");
  }
});
</script>

<template>
  <div class="space-y-6">
    <div>
      <div class="flex items-center gap-2">
        <span class="size-2 rounded-full bg-[#38BDF8] shadow-[0_0_6px_#38BDF8] animate-pulse"></span>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Log Aktivitas & Audit Trail</h2>
      </div>
      <p class="font-mono text-[11px] text-slate-500 mt-1">
        AUDIT_LOG // EVENT PRESENCE, MATERIAL ACCESS & SECURITY SESSIONS
      </p>
    </div>

    <!-- Bolted Console Timeline Panel -->
    <div class="bg-[#ebf0f7] rounded-3xl shadow-[6px_6px_14px_#b5c2d3,-6px_-6px_14px_#ffffff] border border-white/80 corner-screws p-6 sm:p-8 space-y-6">
      <div ref="containerRef" class="relative pl-6 border-l-2 border-[#1E5FAD]/40 space-y-6">
        <div
          v-for="item in activities"
          :key="item.id"
          class="activity-node relative group"
        >
          <!-- Timeline LED dot -->
          <div class="absolute -left-[31px] top-1 size-3.5 rounded-full bg-[#1E5FAD] shadow-[0_0_8px_rgba(30,95,173,0.7)] ring-4 ring-[#ebf0f7]" />

          <!-- Recessed slot card -->
          <div class="p-4 rounded-2xl bg-[#d7e0ec] shadow-[inset_2px_2px_4px_#b5c2d3,inset_-2px_-2px_4px_#ffffff] border border-white/40 space-y-1.5 transition-all group-hover:brightness-102">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div class="flex items-center gap-2">
                <h3 class="text-sm font-bold text-slate-800">{{ item.action }}</h3>
                <span class="font-mono text-[10px] font-bold text-[#1E5FAD] bg-blue-100/70 px-2 py-0.5 rounded-md">
                  {{ item.code }}
                </span>
              </div>
              <span class="font-mono text-[11px] font-semibold text-slate-400">{{ item.time }}</span>
            </div>
            <p class="text-xs text-slate-600 leading-relaxed max-w-2xl font-sans">
              {{ item.detail }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
