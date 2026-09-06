<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter, RouterLink } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import AppBadge from "@/components/common/AppBadge.vue";
import AppButton from "@/components/common/AppButton.vue";
import AppEmptyState from "@/components/common/AppEmptyState.vue";
import { animatePageEntrance, animateMascotFloat, animateCounter } from "@/utils/animations";

const authStore = useAuthStore();
const router = useRouter();

const containerRef = ref<HTMLElement | null>(null);
const mascotBannerRef = ref<HTMLElement | null>(null);

// State simulasi: apakah user sudah mendaftar/mengikuti event
const hasEnrolledEvents = ref(true);

const isMentor = computed(() => authStore.userRole === "mentor");

// Mock Data Event Aktif
const activeEvent = ref({
  id: 1,
  title: "AI & Fullstack Engineering Bootcamp 2026",
  batch: "BATCH 04",
  period: "10 SEP - 25 OKT 2026",
  category: "INTENSIVE PROGRAM",
  progress: 35,
  displayProgress: 0,
  nextSession: "Sabtu, 13 September 2026 • 19:30 WIB",
  taskDeadline: "Minggu, 14 September 2026",
  taskStatus: "pending", // 'pending' | 'submitted' | 'reviewed'
});

// Mock Submission count for Mentor
const mentorStats = ref({
  totalStudents: 42,
  submittedTasks: 28,
  pendingReview: 14,
  reviewedTasks: 14,
});

const displayStats = ref({
  totalStudents: 0,
  submittedTasks: 0,
  pendingReview: 0,
  reviewedTasks: 0,
});

// Mock Log Aktivitas
const activityLogs = ref([
  {
    id: "1",
    title: "Akun Berhasil Diverifikasi",
    desc: "Kamu telah menyelesaikan verifikasi OTP nomor telepon.",
    time: "Hari ini, 08:30 WIB",
    code: "AUTH // 200_OK",
  },
  {
    id: "2",
    title: "Login Melalui Perangkat Baru",
    desc: "Sesi web browser di macOS (Safari).",
    time: "Hari ini, 08:32 WIB",
    code: "SESS // NEW_DEV",
  },
  {
    id: "3",
    title: "Mengakses Silabus Bootcamp",
    desc: "Membaca silabus dan timeline kegiatan SkyShare Academy.",
    time: "Kemarin, 15:40 WIB",
    code: "DOCS // SYLLABUS",
  },
]);

onMounted(() => {
  if (containerRef.value) {
    animatePageEntrance(containerRef.value, ".dashboard-module");
  }

  if (mascotBannerRef.value) {
    animateMascotFloat(mascotBannerRef.value);
  }

  // Ticker animation for progress bar
  animateCounter(
    { value: 0 },
    activeEvent.value.progress,
    function (this: any) {
      activeEvent.value.displayProgress = Math.round(this.targets()[0].value);
    },
    1.2
  );

  // Ticker animation for mentor stats
  const statTargets = [
    { key: "totalStudents", target: mentorStats.value.totalStudents },
    { key: "submittedTasks", target: mentorStats.value.submittedTasks },
    { key: "pendingReview", target: mentorStats.value.pendingReview },
    { key: "reviewedTasks", target: mentorStats.value.reviewedTasks },
  ];

  statTargets.forEach(({ key, target }) => {
    animateCounter(
      { value: 0 },
      target,
      function (this: any) {
        (displayStats.value as any)[key] = Math.round(this.targets()[0].value);
      },
      1.4
    );
  });
});
</script>

<template>
  <div ref="containerRef" class="space-y-8">
    <!-- Header Control Console Banner -->
    <div class="dashboard-module bg-linear-to-r from-[#174F96] via-[#1E5FAD] to-[#2E6FBD] rounded-3xl p-6 sm:p-8 text-white shadow-[8px_8px_18px_#b5c2d3,-8px_-8px_18px_#ffffff] border-t-2 border-l-2 border-white/40 border-b border-r border-[#0F3D7A] relative overflow-hidden">
      <!-- CRT scanline effect on banner -->
      <div class="absolute inset-0 crt-screen pointer-events-none opacity-20" />
      <div class="absolute -right-10 -bottom-10 size-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />

      <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="flex-1">
          <div class="flex flex-wrap items-center gap-2 mb-3">
            <span class="px-2.5 py-0.5 rounded-md font-mono text-[10px] font-bold bg-[#0F3D7A]/80 border border-white/20 text-cyan-300 tracking-wider">
              SYS // DASHBOARD v0.1
            </span>
            <AppBadge :variant="isMentor ? 'mentor' : 'talent'" size="sm">
              ROLE // {{ isMentor ? "MENTOR" : "TALENT" }}
            </AppBadge>
            <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-white/10 text-emerald-300">
              <span class="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse"></span>
              CORE_ACTIVE
            </span>
          </div>

          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
            Halo, {{ authStore.user?.name || "Member SkyShare" }}! 👋
          </h2>
          <p class="text-xs sm:text-sm text-blue-100 mt-1.5 max-w-xl leading-relaxed font-sans">
            <span v-if="isMentor">
              Konsol pembimbing SkyShare Academy untuk evaluasi tugas submission, pantau kemajuan talent, dan distribusikan materi.
            </span>
            <span v-else>
              Selamat datang di konsol belajarmu. Akses materi terverifikasi, kumpulkan tugas event, dan pantau metrik kelulusanmu.
            </span>
          </p>

          <!-- Simulation Rocker Switch -->
          <div class="mt-5 inline-flex items-center gap-2.5 bg-[#0F3D7A]/70 backdrop-blur-md rounded-xl p-1.5 border border-white/20 shadow-[inset_1px_1px_3px_rgba(0,0,0,0.4)]">
            <span class="font-mono text-[10px] font-bold text-blue-200 px-2 tracking-wider">SIMULASI:</span>
            <button
              type="button"
              class="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-[#ebf0f7] text-[#1E5FAD] hover:brightness-105 active:translate-y-[1px] active:shadow-[inset_2px_2px_4px_#b5c2d3] shadow-[2px_2px_5px_rgba(0,0,0,0.3)] transition-all cursor-pointer"
              @click="hasEnrolledEvents = !hasEnrolledEvents"
            >
              {{ hasEnrolledEvents ? "[TERDAFTAR EVENT]" : "[BELUM TERDAFTAR (KOSONG)]" }}
            </button>
          </div>
        </div>

        <!-- Mascot Dynamic Display with Floating Animation -->
        <div class="hidden sm:flex items-center justify-center shrink-0 pr-2">
          <div ref="mascotBannerRef" class="relative p-3 rounded-2xl bg-white/10 border border-white/20 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.2)]">
            <img
              src="/images/mascot-icons/pose=10.webp"
              alt="SkyShare Mascot"
              class="w-28 sm:w-36 md:w-40 h-auto object-contain drop-shadow-lg transition-transform duration-300 hover:scale-105"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Case 1: USER BELUM MENDAFTAR EVENT APAPUN (Empty State + Activity Log) -->
    <div v-if="!hasEnrolledEvents" class="space-y-6">
      <AppEmptyState
        title="Konsol Pembelajaran Belum Terhubung"
        description="Akun kamu belum terdaftar di program atau event SkyShare Academy manapun. Silakan pilih event aktif untuk membuka modul tugas dan materi eksklusif."
        action-text="Jelajahi Event & Bootcamp"
        @action="router.push('/events')"
      />

      <!-- Activity log section when empty -->
      <div class="bg-[#ebf0f7] rounded-3xl shadow-[6px_6px_14px_#b5c2d3,-6px_-6px_14px_#ffffff] border border-white/80 corner-screws p-6 sm:p-8">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-base font-bold text-slate-800">Log Aktivitas & Audit Trail</h3>
            <p class="font-mono text-[11px] text-slate-400">SYS // EVENT AUDIT & LOGIN SESSIONS</p>
          </div>
          <!-- Vents -->
          <div class="flex gap-1">
            <div class="h-4 w-1 rounded-full bg-[#b5c2d3] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3)]"></div>
            <div class="h-4 w-1 rounded-full bg-[#b5c2d3] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3)]"></div>
            <div class="h-4 w-1 rounded-full bg-[#b5c2d3] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3)]"></div>
          </div>
        </div>

        <div class="space-y-3">
          <div
            v-for="log in activityLogs"
            :key="log.id"
            class="p-3.5 rounded-2xl bg-[#d7e0ec] shadow-[inset_2px_2px_5px_#b5c2d3,inset_-2px_-2px_5px_#ffffff] flex items-start justify-between gap-4 border border-white/40"
          >
            <div class="flex items-start gap-3">
              <div class="size-8 rounded-xl bg-linear-to-b from-[#2a7bd9] to-[#1E5FAD] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-[2px_2px_4px_#b5c2d3]">
                <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <p class="text-sm font-bold text-slate-800">{{ log.title }}</p>
                  <span class="font-mono text-[10px] text-[#1E5FAD] font-bold">[{{ log.code }}]</span>
                </div>
                <p class="text-xs text-slate-500 mt-0.5">{{ log.desc }}</p>
              </div>
            </div>
            <span class="font-mono text-[11px] text-slate-400 shrink-0">{{ log.time }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Case 2: USER SUDAH TERDAFTAR EVENT -->
    <div v-else class="space-y-6">
      <!-- TALENT VIEW -->
      <div v-if="!isMentor" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Event Bolted Module -->
        <div class="dashboard-module lg:col-span-2 bg-[#ebf0f7] rounded-3xl shadow-[6px_6px_14px_#b5c2d3,-6px_-6px_14px_#ffffff] border border-white/80 corner-screws p-6 sm:p-8 space-y-6">
          <div class="flex items-start justify-between">
            <div>
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-1 rounded-md font-mono text-[10px] font-bold bg-[#d7e0ec] shadow-[inset_1px_1px_2px_#b5c2d3] text-[#1E5FAD]">
                  {{ activeEvent.category }} // {{ activeEvent.batch }}
                </span>
                <span class="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-600 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                  <span class="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981] animate-pulse"></span>
                  LIVE_ACTIVE
                </span>
              </div>
              <h3 class="text-lg sm:text-xl font-bold text-slate-800 mt-2.5 tracking-tight">
                {{ activeEvent.title }}
              </h3>
              <p class="font-mono text-xs text-slate-400 mt-1">
                TIMELINE // {{ activeEvent.period }}
              </p>
            </div>

            <!-- Vents -->
            <div class="flex gap-1.5">
              <div class="h-5 w-1 rounded-full bg-[#b5c2d3] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3)]"></div>
              <div class="h-5 w-1 rounded-full bg-[#b5c2d3] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3)]"></div>
              <div class="h-5 w-1 rounded-full bg-[#b5c2d3] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3)]"></div>
            </div>
          </div>

          <!-- Recessed Progress Bar Slot -->
          <div class="space-y-2 p-4 rounded-2xl bg-[#d7e0ec] shadow-[inset_3px_3px_6px_#b5c2d3,inset_-3px_-3px_6px_#ffffff] border border-white/50">
            <div class="flex justify-between items-center font-mono text-xs font-bold text-slate-700">
              <span>PROGRESS // PEMBELAJARAN</span>
              <span class="text-[#1E5FAD] text-sm">{{ activeEvent.displayProgress }}%</span>
            </div>
            <div class="w-full h-3 bg-[#c5d2e2] rounded-full overflow-hidden shadow-[inset_1px_1px_3px_rgba(0,0,0,0.3)]">
              <div
                class="h-full bg-linear-to-r from-[#1E5FAD] via-[#0284C7] to-[#38BDF8] rounded-full transition-all duration-500 shadow-[0_0_8px_#38BDF8]"
                :style="{ width: `${activeEvent.displayProgress}%` }"
              />
            </div>
          </div>

          <!-- Upcoming Info Recessed Slots -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="p-4 rounded-2xl bg-[#d7e0ec] shadow-[inset_3px_3px_6px_#b5c2d3,inset_-3px_-3px_6px_#ffffff] border border-white/40">
              <span class="font-mono text-[10px] text-slate-500 font-bold tracking-wider block">NEXT_SESSION //</span>
              <span class="text-xs sm:text-sm font-bold text-slate-800 mt-1 block">{{ activeEvent.nextSession }}</span>
            </div>
            <div class="p-4 rounded-2xl bg-[#e6dbcb] shadow-[inset_3px_3px_6px_#cbbeaa,inset_-3px_-3px_6px_#ffffff] border border-white/40">
              <span class="font-mono text-[10px] text-amber-800 font-bold tracking-wider block">DEADLINE // TUGAS 1</span>
              <span class="text-xs sm:text-sm font-bold text-amber-950 mt-1 block">{{ activeEvent.taskDeadline }}</span>
            </div>
          </div>

          <!-- Action Mechanical Buttons -->
          <div class="flex flex-wrap gap-3 pt-3 border-t border-slate-300">
            <AppButton
              variant="primary"
              @click="router.push(`/events/${activeEvent.id}`)"
            >
              Upload Tugas Event
            </AppButton>
            <AppButton
              variant="secondary"
              @click="router.push('/materials')"
            >
              Buka Materi & Modul
            </AppButton>
          </div>
        </div>

        <!-- Right Side: Task Status & Quick Materials -->
        <div class="space-y-6">
          <!-- Submission status bolted panel -->
          <div class="dashboard-module bg-[#ebf0f7] rounded-3xl shadow-[6px_6px_14px_#b5c2d3,-6px_-6px_14px_#ffffff] border border-white/80 corner-screws p-5">
            <div class="flex items-center justify-between mb-3">
              <h4 class="font-mono text-xs font-bold text-[#1E5FAD] tracking-wider uppercase">SUBMISSION // STATUS</h4>
              <span class="size-2 rounded-full bg-amber-500 shadow-[0_0_6px_#f59e0b] animate-pulse"></span>
            </div>
            <div class="p-4 rounded-2xl bg-[#d7e0ec] shadow-[inset_3px_3px_6px_#b5c2d3,inset_-3px_-3px_6px_#ffffff] space-y-2 border border-white/40">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-800">Tugas 1: Research Flow</span>
                <span class="font-mono text-[10px] font-bold text-amber-700 bg-amber-200/80 px-2 py-0.5 rounded-md">
                  WAITING_UPLOAD
                </span>
              </div>
              <p class="text-[11px] text-slate-500 leading-relaxed font-sans">
                Format PDF / ZIP. Unggah sebelum batas waktu untuk mendapatkan evaluasi mentor.
              </p>
              <RouterLink
                :to="`/events/${activeEvent.id}`"
                class="font-mono text-xs font-bold text-[#1E5FAD] hover:underline inline-block mt-1"
              >
                KUMPULKAN SEKARANG &rarr;
              </RouterLink>
            </div>
          </div>

          <!-- Quick access materials bolted panel -->
          <div class="dashboard-module bg-[#ebf0f7] rounded-3xl shadow-[6px_6px_14px_#b5c2d3,-6px_-6px_14px_#ffffff] border border-white/80 corner-screws p-5">
            <h4 class="font-mono text-xs font-bold text-[#1E5FAD] tracking-wider uppercase mb-3">MATERI // MODUL TERBARU</h4>
            <div class="space-y-2.5">
              <RouterLink
                to="/materials/1"
                class="block p-3 rounded-2xl bg-[#d7e0ec] shadow-[inset_2px_2px_4px_#b5c2d3,inset_-2px_-2px_4px_#ffffff] hover:brightness-102 transition-all border border-white/40"
              >
                <span class="text-xs font-bold text-slate-800 block line-clamp-1">
                  1. Fundamental Web Architecture & Cloud
                </span>
                <span class="font-mono text-[10px] text-[#1E5FAD] mt-0.5 block">READ // 15 MIN • MODUL 01</span>
              </RouterLink>
              <RouterLink
                to="/materials/2"
                class="block p-3 rounded-2xl bg-[#d7e0ec] shadow-[inset_2px_2px_4px_#b5c2d3,inset_-2px_-2px_4px_#ffffff] hover:brightness-102 transition-all border border-white/40"
              >
                <span class="text-xs font-bold text-slate-800 block line-clamp-1">
                  2. UI/UX Design System Guidelines
                </span>
                <span class="font-mono text-[10px] text-[#1E5FAD] mt-0.5 block">READ // 20 MIN • MODUL 02</span>
              </RouterLink>
            </div>
          </div>
        </div>
      </div>

      <!-- MENTOR VIEW -->
      <div v-else class="space-y-6">
        <!-- Mentor Stats Digital Readouts -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div class="dashboard-module bg-[#ebf0f7] p-4 sm:p-5 rounded-3xl shadow-[6px_6px_14px_#b5c2d3,-6px_-6px_14px_#ffffff] border border-white/80 corner-screws">
            <span class="font-mono text-[10px] text-slate-500 font-bold uppercase tracking-wider block">TOTAL TALENT</span>
            <p class="font-mono text-2xl sm:text-3xl font-bold text-slate-800 mt-2">{{ displayStats.totalStudents }}</p>
          </div>
          <div class="dashboard-module bg-[#ebf0f7] p-4 sm:p-5 rounded-3xl shadow-[6px_6px_14px_#b5c2d3,-6px_-6px_14px_#ffffff] border border-white/80 corner-screws">
            <span class="font-mono text-[10px] text-[#1E5FAD] font-bold uppercase tracking-wider block">TUGAS MASUK</span>
            <p class="font-mono text-2xl sm:text-3xl font-bold text-[#1E5FAD] mt-2">{{ displayStats.submittedTasks }}</p>
          </div>
          <div class="dashboard-module bg-[#ebf0f7] p-4 sm:p-5 rounded-3xl shadow-[6px_6px_14px_#b5c2d3,-6px_-6px_14px_#ffffff] border border-white/80 corner-screws">
            <span class="font-mono text-[10px] text-amber-700 font-bold uppercase tracking-wider block">PERLU REVIEW</span>
            <p class="font-mono text-2xl sm:text-3xl font-bold text-amber-600 mt-2">{{ displayStats.pendingReview }}</p>
          </div>
          <div class="dashboard-module bg-[#ebf0f7] p-4 sm:p-5 rounded-3xl shadow-[6px_6px_14px_#b5c2d3,-6px_-6px_14px_#ffffff] border border-white/80 corner-screws">
            <span class="font-mono text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">SELESAI REVIEW</span>
            <p class="font-mono text-2xl sm:text-3xl font-bold text-emerald-600 mt-2">{{ displayStats.reviewedTasks }}</p>
          </div>
        </div>

        <!-- Mentor Management Panel -->
        <div class="dashboard-module bg-[#ebf0f7] rounded-3xl shadow-[6px_6px_14px_#b5c2d3,-6px_-6px_14px_#ffffff] border border-white/80 corner-screws p-5 sm:p-8 space-y-5">
          <div class="flex items-center justify-between">
            <div>
              <div class="flex items-center gap-2">
                <span class="size-2 rounded-full bg-cyan-500 shadow-[0_0_6px_#06b6d4] animate-pulse"></span>
                <h3 class="text-base font-bold text-slate-800">Antrean Evaluasi Tugas Peserta (Talent)</h3>
              </div>
              <p class="font-mono text-[11px] text-slate-400 mt-0.5">QUEUE // READY FOR MENTOR REVIEW</p>
            </div>
            <AppButton variant="secondary" size="sm" @click="router.push('/events')">
              Kelola Event
            </AppButton>
          </div>

          <!-- Table of submissions in recessed machine grid -->
          <div class="overflow-x-auto rounded-2xl bg-[#d7e0ec] shadow-[inset_3px_3px_6px_#b5c2d3,inset_-3px_-3px_6px_#ffffff] p-2 border border-white/40">
            <table class="w-full text-left text-xs">
              <thead class="text-slate-500 font-mono text-[10px] uppercase tracking-wider font-bold border-b border-[#b5c2d3]">
                <tr>
                  <th class="p-3">NAMA TALENT</th>
                  <th class="p-3">EVENT / BATCH</th>
                  <th class="p-3">FILE TUGAS</th>
                  <th class="p-3">WAKTU SUBMIT</th>
                  <th class="p-3">STATUS</th>
                  <th class="p-3 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200/60">
                <tr class="hover:bg-white/40 transition-colors">
                  <td class="p-3 font-bold text-slate-800">Farhan Hidayat</td>
                  <td class="p-3 font-mono text-slate-600">AI Bootcamp Batch 4</td>
                  <td class="p-3 font-mono text-[#1E5FAD] font-medium underline">tugas_farhan_flow.pdf</td>
                  <td class="p-3 font-mono text-slate-400">10 min ago</td>
                  <td class="p-3">
                    <span class="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      WAIT_REVIEW
                    </span>
                  </td>
                  <td class="p-3 text-right">
                    <AppButton size="sm" variant="primary">
                      Review
                    </AppButton>
                  </td>
                </tr>
                <tr class="hover:bg-white/40 transition-colors">
                  <td class="p-3 font-bold text-slate-800">Siti Nurhaliza</td>
                  <td class="p-3 font-mono text-slate-600">AI Bootcamp Batch 4</td>
                  <td class="p-3 font-mono text-[#1E5FAD] font-medium underline">design_system_siti.zip</td>
                  <td class="p-3 font-mono text-slate-400">1 hr ago</td>
                  <td class="p-3">
                    <span class="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      GRADED
                    </span>
                  </td>
                  <td class="p-3 text-right">
                    <AppButton size="sm" variant="secondary">
                      Detail
                    </AppButton>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
