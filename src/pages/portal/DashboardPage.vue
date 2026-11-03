<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { RouterLink } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useAccessStore } from "@/stores/access";
import AppBadge from "@/components/common/AppBadge.vue";
import AppButton from "@/components/common/AppButton.vue";
import AppAlert from "@/components/common/AppAlert.vue";
import AppSkeleton from "@/components/common/AppSkeleton.vue";
import AppPage from "@/components/common/AppPage.vue";
import {
  animatePageEntrance,
  animateMascotFloat,
  animateCounter,
  animateLedPulse,
} from "@/utils/animations";

const authStore = useAuthStore();
const accessStore = useAccessStore();

const containerRef = ref<HTMLElement | null>(null);
const mascotBannerRef = ref<HTMLElement | null>(null);
const kycLedRef = ref<HTMLElement | null>(null);

const loadError = ref<string | null>(null);
const isRetrying = ref(false);
const isLoading = computed(() => !accessStore.isLoaded && !loadError.value);

// Animated counter values
const displayActivePrograms = ref(0);
const displayPendingOrders = ref(0);

// GSAP cleanup holders
let entranceCtx: { revert: () => void } | null = null;
let floatTween: any = null;
let ledTween: any = null;
let counterTweens: any[] = [];

const kycStatus = computed(() => accessStore.kyc?.status || "REGISTERED");
const isApprovedKyc = computed(() => accessStore.isApprovedKyc);
const activePrograms = computed(() => accessStore.activePrograms);
const pendingOrders = computed(() => accessStore.pendingOrders);

const runEntranceAndCounters = async () => {
  await nextTick();

  if (containerRef.value) {
    entranceCtx?.revert();
    entranceCtx = animatePageEntrance(containerRef.value, ".dashboard-module");
  }

  if (mascotBannerRef.value) {
    floatTween?.kill();
    floatTween = animateMascotFloat(mascotBannerRef.value);
  }

  // Tactile LED pulse for pending KYC states
  if (kycLedRef.value && !isApprovedKyc.value) {
    ledTween?.kill();
    ledTween = animateLedPulse(kycLedRef.value);
  }

  // Clear previous counter tweens
  counterTweens.forEach((t) => t?.kill());
  counterTweens = [];

  // Ticker animation for active programs
  const progTarget = { value: displayActivePrograms.value };
  const progTween = animateCounter(
    progTarget,
    activePrograms.value.length,
    () => {
      displayActivePrograms.value = Math.round(progTarget.value);
    },
    1.2
  );
  if (progTween) counterTweens.push(progTween);

  // Ticker animation for pending orders
  const orderTarget = { value: displayPendingOrders.value };
  const orderTween = animateCounter(
    orderTarget,
    pendingOrders.value.length,
    () => {
      displayPendingOrders.value = Math.round(orderTarget.value);
    },
    1.2
  );
  if (orderTween) counterTweens.push(orderTween);
};

const retryFetchAccess = async () => {
  isRetrying.value = true;
  loadError.value = null;
  try {
    await accessStore.fetchAccess();
    await runEntranceAndCounters();
  } catch (err: any) {
    loadError.value =
      err.response?.data?.message ||
      err.message ||
      "Gagal memuat status akses dari server.";
  } finally {
    isRetrying.value = false;
  }
};

onMounted(async () => {
  if (!accessStore.isLoaded) {
    try {
      await accessStore.fetchAccess();
    } catch (err: any) {
      loadError.value =
        err.response?.data?.message ||
        err.message ||
        "Gagal memuat status akses dari server.";
    }
  }

  await runEntranceAndCounters();
});

onUnmounted(() => {
  entranceCtx?.revert();
  floatTween?.kill();
  ledTween?.kill();
  counterTweens.forEach((t) => t?.kill());
  counterTweens = [];
});
</script>

<template>
  <AppPage width="content">
    <div ref="containerRef" class="space-y-6">
      <!-- Error State if access fetch failed (P2-5) -->
      <div v-if="loadError">
        <AppAlert
          variant="error"
          title="Gagal Memuat Status Akses Mentor"
          :message="loadError"
        >
          <div class="mt-3">
            <AppButton
              variant="secondary"
              size="sm"
              :loading="isRetrying"
              @click="retryFetchAccess"
            >
              Muat Ulang Status Akses
            </AppButton>
          </div>
        </AppAlert>
      </div>

      <!-- Skeleton Loading State (Mirrors real dashboard hardware modules) -->
      <div v-if="isLoading" class="space-y-6">
        <!-- Top Welcome Banner Skeleton -->
        <div class="chassis-panel rounded-3xl p-5 sm:p-8 corner-screws space-y-4">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div class="space-y-3 flex-1">
              <div class="flex gap-2">
                <AppSkeleton variant="line" class="w-24 h-6" />
                <AppSkeleton variant="line" class="w-32 h-6" />
              </div>
              <AppSkeleton variant="line" class="w-3/4 h-8" />
              <AppSkeleton variant="line" class="w-full h-4" />
              <AppSkeleton variant="line" class="w-2/3 h-4" />
            </div>
            <AppSkeleton variant="circle" class="size-20 sm:size-24 self-center md:self-auto" />
          </div>
        </div>

        <!-- KYC Status Panel Skeleton -->
        <div class="chassis-panel rounded-3xl p-6 sm:p-7 corner-screws space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-300">
            <AppSkeleton variant="line" class="w-48 h-4" />
            <AppSkeleton variant="line" class="w-24 h-4" />
          </div>
          <div class="space-y-2">
            <AppSkeleton variant="line" class="w-1/3 h-5" />
            <AppSkeleton variant="line" class="w-full h-4" />
          </div>
          <AppSkeleton variant="block" class="w-48 h-10 rounded-xl" />
        </div>

        <!-- Stats Grid Skeleton -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div v-for="i in 2" :key="i" class="chassis-panel rounded-3xl p-6 corner-screws space-y-4">
            <div class="flex justify-between items-center">
              <AppSkeleton variant="line" class="w-36 h-4" />
              <AppSkeleton variant="circle" class="size-6" />
            </div>
            <AppSkeleton variant="block" class="w-20 h-10 rounded-xl" />
            <AppSkeleton variant="line" class="w-4/5 h-3" />
          </div>
        </div>

        <!-- Actions Module Skeleton -->
        <div class="chassis-panel rounded-3xl p-6 corner-screws space-y-4">
          <AppSkeleton variant="line" class="w-40 h-4" />
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <AppSkeleton v-for="i in 3" :key="i" variant="block" class="w-full h-12 rounded-xl" />
          </div>
        </div>
      </div>

      <!-- Real Dashboard Modules when loaded -->
      <div v-else class="space-y-6">
        <!-- Top Welcome Banner Module -->
        <section class="dashboard-module chassis-panel rounded-3xl p-5 sm:p-8 corner-screws relative overflow-hidden">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div class="space-y-3 max-w-xl">
            <div class="flex items-center gap-2 flex-wrap">
              <AppBadge variant="mentor">PORTAL MENTOR</AppBadge>
              <span class="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#d7e0ec] border border-white/50 text-slate-700">
                <span
                  :class="[
                    'size-1.5 rounded-full',
                    isApprovedKyc
                      ? 'bg-emerald-500 shadow-[0_0_6px_#10b981] animate-pulse'
                      : 'bg-amber-500 shadow-[0_0_6px_#f59e0b]'
                  ]"
                />
                KYC // {{ kycStatus }}
              </span>
            </div>

            <h1 class="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight break-words">
              Selamat Datang, {{ authStore.user?.name || "Mentor SkyShare" }}!
            </h1>

            <p class="text-xs sm:text-sm text-slate-600 font-sans leading-relaxed">
              Konsol kerja dan pembelajaran mentor resmi SkyShare Academy. Pantau status identitas legal, akses modul silabus privat, jadwal event live, dan penilaian tugas peserta.
            </p>
          </div>

          <!-- Mascot & Quick Stat Pod -->
          <div class="flex items-center gap-4 self-center md:self-auto shrink-0">
            <div ref="mascotBannerRef" class="p-3 rounded-2xl bg-[#d7e0ec] shadow-[inset_3px_3px_6px_#b5c2d3,inset_-3px_-3px_6px_#ffffff] border border-white/40">
              <img
                src="/images/mascot-icons/pose=8.webp"
                alt="Mascot SkyShare"
                class="w-16 sm:w-20 h-auto object-contain drop-shadow-md"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- 4 Hardware Metric HUD Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <!-- HUD 1: KYC Status -->
        <RouterLink
          to="/kyc"
          class="dashboard-module p-3.5 sm:p-4 rounded-2xl bg-[#ebf0f7] border border-white/80 shadow-[3px_3px_8px_#b5c2d3,-3px_-3px_8px_#ffffff] hover:brightness-105 transition-all block min-w-0"
        >
          <span class="font-mono text-[10px] text-slate-500 uppercase block">STATUS KYC</span>
          <div class="flex items-center gap-2 mt-1">
            <span
              ref="kycLedRef"
              :class="[
                'size-2 rounded-full shrink-0',
                isApprovedKyc
                  ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]'
                  : kycStatus === 'REJECTED'
                  ? 'bg-rose-500 shadow-[0_0_6px_#f43f5e]'
                  : 'bg-amber-500 shadow-[0_0_6px_#f59e0b]'
              ]"
            />
            <span class="font-mono text-xs sm:text-base font-bold text-slate-900 truncate">
              {{ kycStatus }}
            </span>
          </div>
          <span class="font-mono text-[9px] text-[#1E5FAD] mt-1 block truncate">Buka Halaman KYC &rarr;</span>
        </RouterLink>

        <!-- HUD 2: Active Programs -->
        <RouterLink
          to="/programs"
          class="dashboard-module p-3.5 sm:p-4 rounded-2xl bg-[#ebf0f7] border border-white/80 shadow-[3px_3px_8px_#b5c2d3,-3px_-3px_8px_#ffffff] hover:brightness-105 transition-all block min-w-0"
        >
          <span class="font-mono text-[10px] text-slate-500 uppercase block">PROGRAM AKTIF</span>
          <span class="font-mono text-xl sm:text-2xl font-bold text-slate-900 block mt-0.5">
            {{ displayActivePrograms }}
          </span>
          <span class="font-mono text-[9px] text-[#1E5FAD] mt-1 block truncate">Katalog Program &rarr;</span>
        </RouterLink>

        <!-- HUD 3: Pending Orders -->
        <RouterLink
          to="/programs"
          class="dashboard-module p-3.5 sm:p-4 rounded-2xl bg-[#ebf0f7] border border-white/80 shadow-[3px_3px_8px_#b5c2d3,-3px_-3px_8px_#ffffff] hover:brightness-105 transition-all block min-w-0"
        >
          <span class="font-mono text-[10px] text-slate-500 uppercase block">PESANAN BERJALAN</span>
          <span class="font-mono text-xl sm:text-2xl font-bold text-amber-700 block mt-0.5">
            {{ displayPendingOrders }}
          </span>
          <span class="font-mono text-[9px] text-slate-500 mt-1 block truncate">Menunggu Bayar/Review</span>
        </RouterLink>

        <!-- HUD 4: Learning Access -->
        <div
          class="dashboard-module p-3.5 sm:p-4 rounded-2xl bg-[#ebf0f7] border border-white/80 shadow-[3px_3px_8px_#b5c2d3,-3px_-3px_8px_#ffffff] block min-w-0"
        >
          <span class="font-mono text-[10px] text-slate-500 uppercase block">AKSES KONTEN</span>
          <span
            :class="[
              'font-mono text-xs sm:text-sm font-bold block mt-1 truncate',
              accessStore.hasFullAccess ? 'text-emerald-700' : 'text-amber-700'
            ]"
          >
            {{ accessStore.hasFullAccess ? "PENUH (UNLOCKED)" : "TERBATAS (LOCKED)" }}
          </span>
          <span class="font-mono text-[9px] text-slate-400 mt-1 block">Server Verified</span>
        </div>
      </div>

      <!-- Active Programs List or Onboarding Roadmap -->
      <!-- Case A: User has active programs -->
      <section v-if="activePrograms.length > 0" class="dashboard-module space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span class="size-2 rounded-full bg-emerald-500"></span>
            <span>Program yang Anda Ikuti</span>
          </h2>
          <RouterLink to="/programs" class="font-mono text-xs font-bold text-[#1E5FAD] hover:underline">
            LIHAT SEMUA &rarr;
          </RouterLink>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <article
            v-for="prog in activePrograms"
            :key="prog.program_id"
            class="chassis-panel rounded-3xl p-5 sm:p-6 corner-screws space-y-4 min-w-0"
          >
            <div class="flex items-center justify-between">
              <AppBadge variant="mentor" size="sm">AKTIF ENROLLED</AppBadge>
              <span class="font-mono text-[10px] text-slate-400">ID #{{ prog.program_id }}</span>
            </div>

            <h3 class="text-base font-bold text-slate-900 break-words">
              {{ prog.title }}
            </h3>

            <p class="font-mono text-[10px] text-slate-500">
              TERDAFTAR PADA // {{ prog.enrolled_at }}
            </p>

            <div class="pt-3 border-t border-slate-300 flex items-center gap-2 flex-wrap">
              <RouterLink to="/materials">
                <AppButton variant="primary" size="sm">
                  Modul Materi
                </AppButton>
              </RouterLink>
              <RouterLink to="/events">
                <AppButton variant="secondary" size="sm">
                  Jadwal Event
                </AppButton>
              </RouterLink>
              <RouterLink to="/assignments">
                <AppButton variant="secondary" size="sm">
                  Tugas
                </AppButton>
              </RouterLink>
            </div>
          </article>
        </div>
      </section>

      <!-- Case B: User has pending orders awaiting payment -->
      <section v-else-if="pendingOrders.length > 0" class="dashboard-module p-5 sm:p-8 rounded-3xl chassis-panel corner-screws space-y-4 border-amber-300">
        <div class="flex items-center gap-2 text-amber-900 font-bold">
          <span class="size-2 rounded-full bg-amber-500 animate-pulse"></span>
          <h2 class="text-base sm:text-lg">Pesanan Program Menunggu Penyelesaian</h2>
        </div>

        <p class="text-xs sm:text-sm text-slate-600 font-sans leading-relaxed">
          Anda memiliki pesanan aktif yang belum diselesaikan. Segera lakukan transfer manual via QRIS dan unggah struk bukti transfer sebelum waktu kedaluwarsa habis.
        </p>

        <div class="pt-2">
          <RouterLink to="/programs">
            <AppButton variant="primary">
              Selesaikan Pembayaran Program &rarr;
            </AppButton>
          </RouterLink>
        </div>
      </section>

      <!-- Case C: User is not yet active (Onboarding Steps Guide) -->
      <section v-else class="dashboard-module chassis-panel rounded-3xl p-5 sm:p-8 corner-screws space-y-6">
        <div>
          <h2 class="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Alur Aktivasi Akun Mentor
          </h2>
          <p class="text-xs text-slate-500 mt-1 font-sans">
            Ikuti tahapan onboarding di bawah ini untuk membuka akses penuh ke modul dan event.
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <!-- Step 1 -->
          <div class="p-4 rounded-2xl bg-[#d7e0ec] shadow-[inset_2px_2px_4px_#b5c2d3] space-y-2 min-w-0">
            <div class="flex justify-between items-center">
              <span class="font-mono text-xs font-bold text-[#1E5FAD]">TAHAP 01</span>
              <span class="font-mono text-[9px] font-bold text-slate-500">{{ kycStatus }}</span>
            </div>
            <h3 class="text-sm font-bold text-slate-800">Lengkapi KYC</h3>
            <p class="text-xs text-slate-600 leading-relaxed">
              Isi NIK 16 digit, rekening bank, media sosial, dan unggah foto e-KTP.
            </p>
            <RouterLink to="/kyc" class="block pt-1">
              <AppButton variant="secondary" size="sm" class-name="w-full">
                Buka KYC &rarr;
              </AppButton>
            </RouterLink>
          </div>

          <!-- Step 2 -->
          <div class="p-4 rounded-2xl bg-[#d7e0ec] shadow-[inset_2px_2px_4px_#b5c2d3] space-y-2 min-w-0">
            <div class="flex justify-between items-center">
              <span class="font-mono text-xs font-bold text-[#1E5FAD]">TAHAP 02</span>
              <span class="font-mono text-[9px] font-bold text-slate-500">PROGRAM</span>
            </div>
            <h3 class="text-sm font-bold text-slate-800">Daftar Program</h3>
            <p class="text-xs text-slate-600 leading-relaxed">
              Pilih program bootcamp, transfer nominal QRIS dengan kode unik 3-digit.
            </p>
            <RouterLink to="/programs" class="block pt-1">
              <AppButton variant="secondary" size="sm" class-name="w-full">
                Katalog Program &rarr;
              </AppButton>
            </RouterLink>
          </div>

          <!-- Step 3 -->
          <div class="p-4 rounded-2xl bg-[#d7e0ec] shadow-[inset_2px_2px_4px_#b5c2d3] space-y-2 min-w-0">
            <div class="flex justify-between items-center">
              <span class="font-mono text-xs font-bold text-[#1E5FAD]">TAHAP 03</span>
              <span class="font-mono text-[9px] font-bold text-slate-500">VERIFIKASI</span>
            </div>
            <h3 class="text-sm font-bold text-slate-800">Verifikasi Admin</h3>
            <p class="text-xs text-slate-600 leading-relaxed">
              Admin CMS memverifikasi mutasi dan data KTP Anda untuk mengaktifkan akses.
            </p>
            <span class="font-mono text-[10px] text-slate-400 block pt-1">
              STATUS: MENUNGGU
            </span>
          </div>
        </div>
      </section>
      </div>
    </div>
  </AppPage>
</template>
