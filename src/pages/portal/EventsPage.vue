<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { useAccessStore } from "@/stores/access";
import { apiClient } from "@/api/client";
import AppBadge from "@/components/common/AppBadge.vue";
import AppButton from "@/components/common/AppButton.vue";
import AppEmptyState from "@/components/common/AppEmptyState.vue";
import AppAlert from "@/components/common/AppAlert.vue";
import AppSkeleton from "@/components/common/AppSkeleton.vue";
import AppSelect from "@/components/common/AppSelect.vue";
import AppPage from "@/components/common/AppPage.vue";
import type { PortalEvent } from "@/types";
import { animatePageEntrance } from "@/utils/animations";
import { resolveAssetUrl } from "@/utils/url";

const accessStore = useAccessStore();
const router = useRouter();
const containerRef = ref<HTMLElement | null>(null);

let entranceCtx: { revert: () => void } | null = null;
let abortController: AbortController | null = null;

const events = ref<PortalEvent[]>([]);
const isLoading = ref(true);
const errorMessage = ref<string | null>(null);
const warningMessage = ref<string | null>(null);
const selectedProgramId = ref<number | "all">("all");

// Format date into full Indonesian date-only (e.g. "Jumat, 6 November 2026")
const formatIndonesianDate = (dateStr: string): string => {
  if (!dateStr) return "-";
  try {
    // If it's a date string like "2026-11-06" or ISO
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);
  } catch {
    return dateStr;
  }
};

// Check if an event date is in the past (before today's midnight)
const isPastEvent = (dateStr: string): boolean => {
  if (!dateStr) return false;
  try {
    const eventTime = new Date(dateStr).getTime();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventTime < today.getTime();
  } catch {
    return false;
  }
};

// Filter & Sort events as a chronological timeline (upcoming first, past dimmed)
const timelineEvents = computed(() => {
  let list = [...events.value];
  if (selectedProgramId.value !== "all") {
    list = list.filter((e) => e.program_id === selectedProgramId.value);
  }

  // Sort: upcoming events first (ascending by date), then past events
  return list.sort((a, b) => {
    const isPastA = isPastEvent(a.event_date);
    const isPastB = isPastEvent(b.event_date);

    if (!isPastA && isPastB) return -1;
    if (isPastA && !isPastB) return 1;

    // Both upcoming: ascending date
    if (!isPastA && !isPastB) {
      return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
    }

    // Both past: descending date (most recent past first)
    return new Date(b.event_date).getTime() - new Date(a.event_date).getTime();
  });
});

// Load events for all active entitled programs
const loadEvents = async () => {
  if (abortController) {
    abortController.abort();
  }
  abortController = new AbortController();
  const signal = abortController.signal;

  isLoading.value = true;
  errorMessage.value = null;
  warningMessage.value = null;

  try {
    if (accessStore.activePrograms.length > 0) {
      let failedCount = 0;
      const promises = accessStore.activePrograms.map(async (p) => {
        try {
          const res = await apiClient.get<{
            status: string;
            data: PortalEvent[];
          }>(`/portal/programs/${p.program_id}/events`, { signal });
          const items = res.data?.data || [];
          return items.map((item) => ({
            ...item,
            program_id: item.program_id || p.program_id,
          }));
        } catch (subErr: any) {
          if (axios.isCancel(subErr) || subErr.name === "CanceledError") {
            return [] as PortalEvent[];
          }
          failedCount++;
          return [] as PortalEvent[];
        }
      });

      const results = await Promise.all(promises);
      if (signal.aborted) return;

      const allEvents = results.flat();

      if (failedCount > 0) {
        if (failedCount === accessStore.activePrograms.length) {
          errorMessage.value = "Gagal memuat jadwal event untuk semua program cohort aktif Anda.";
        } else {
          warningMessage.value = `Gagal memuat jadwal event untuk ${failedCount} program cohort.`;
        }
      }

      // Deduplicate by id
      const uniqueMap = new Map<number, PortalEvent>();
      for (const ev of allEvents) {
        if (ev && ev.id) {
          uniqueMap.set(ev.id, ev);
        }
      }
      events.value = Array.from(uniqueMap.values());
    } else {
      events.value = [];
    }
  } catch (err: any) {
    if (axios.isCancel(err) || err.name === "CanceledError") return;
    errorMessage.value =
      err.response?.data?.message || err.message || "Gagal memuat timeline event program.";
  } finally {
    if (!signal.aborted) {
      isLoading.value = false;
    }
  }
};

const getProgramTitle = (programId?: number | null) => {
  if (!programId) return "Kelas Program";
  const found = accessStore.activePrograms.find((p) => p.program_id === programId);
  return found?.title || `Program #${programId}`;
};

const handleProgramSelect = (event: Event) => {
  const val = (event.target as HTMLSelectElement).value;
  if (val === "all") {
    selectedProgramId.value = "all";
  } else {
    const num = Number(val);
    selectedProgramId.value = isNaN(num) ? "all" : num;
  }
};

const runTimelineEntrance = async () => {
  await nextTick();
  if (containerRef.value) {
    entranceCtx?.revert();
    entranceCtx = animatePageEntrance(containerRef.value, ".timeline-node");
  }
};

watch(selectedProgramId, async () => {
  await runTimelineEntrance();
});

onMounted(async () => {
  await loadEvents();
  await runTimelineEntrance();
});

onUnmounted(() => {
  entranceCtx?.revert();
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
});
</script>

<template>
  <AppPage
    width="content"
    title="Agenda Sesi Kelas & Timeline Program"
    subtitle="COHORT_AGENDA // SEQUENTIAL CLASS SESSIONS, TECHNICAL MEETINGS & GRADUATIONS"
    status-led="info"
  >
    <!-- Cohort / Program Filter Dropdown -->
    <template v-if="accessStore.activePrograms.length > 0" #actions>
      <AppSelect
        :model-value="selectedProgramId"
        label="Filter Program"
        @change="handleProgramSelect"
      >
        <option value="all">Semua Kelas (Cohort)</option>
        <option
          v-for="prog in accessStore.activePrograms"
          :key="prog.program_id"
          :value="prog.program_id"
        >
          {{ prog.title }}
        </option>
      </AppSelect>
    </template>

    <!-- Error & Warning states -->
    <template #alerts>
      <div v-if="errorMessage">
        <AppAlert
          variant="error"
          title="Gagal Memuat Agenda Sesi"
          :message="errorMessage"
          dismissible
          @close="errorMessage = null"
        />
      </div>

      <div v-if="warningMessage">
        <AppAlert
          variant="warning"
          title="Pemberitahuan Sinkronisasi Sesi"
          :message="warningMessage"
          dismissible
          @close="warningMessage = null"
        />
      </div>
    </template>

    <div ref="containerRef" class="space-y-6">
      <!-- Loading Skeleton (Mirrors Timeline Console & Nodes) -->
      <div v-if="isLoading" class="chassis-panel rounded-3xl p-4 sm:p-6 lg:p-8 corner-screws space-y-8 relative">
        <div class="flex items-center justify-between pb-3 border-b border-slate-300/80">
          <div class="flex items-center gap-2">
            <AppSkeleton variant="circle" class="size-2.5" />
            <AppSkeleton variant="line" class="w-64 h-4" />
          </div>
          <AppSkeleton variant="line" class="w-28 h-3" />
        </div>

        <div class="relative pl-4 sm:pl-8 border-l-2 border-[#1E5FAD]/20 space-y-8">
          <div v-for="i in 3" :key="i" class="relative">
            <!-- Node Anchor Dot Skeleton -->
            <div class="absolute -left-[23px] sm:-left-[39px] top-4 size-3.5 sm:size-4 rounded-full bg-[#d2dbe7] border border-white/50 ring-4 ring-[#ebf0f7]" />

            <!-- Card Skeleton -->
            <div class="p-4 sm:p-6 rounded-2xl bg-[#d7e0ec] shadow-[inset_2px_2px_4px_#b5c2d3,inset_-2px_-2px_4px_#ffffff] border border-white/50 space-y-4">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <AppSkeleton variant="line" class="w-16 h-5 rounded-md" />
                  <AppSkeleton variant="line" class="w-28 h-5 rounded-md" />
                  <AppSkeleton variant="line" class="w-24 h-5 rounded-md" />
                </div>
                <AppSkeleton variant="line" class="w-40 h-4" />
              </div>
              <AppSkeleton variant="line" class="w-3/4 h-6" />
              <div class="space-y-2">
                <AppSkeleton variant="line" class="w-full h-4" />
                <AppSkeleton variant="line" class="w-5/6 h-4" />
              </div>
              <div class="pt-2 flex items-center justify-between">
                <AppSkeleton variant="line" class="w-32 h-4" />
                <AppSkeleton variant="block" class="w-28 h-9 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State: No active program -->
      <div v-else-if="accessStore.activePrograms.length === 0">
        <AppEmptyState
          title="Belum Ada Program Aktif"
          description="Timeline sesi kelas dan technical meeting hanya terbuka bagi mentor yang telah terdaftar aktif pada program cohort. Silakan selesaikan pendaftaran program terlebih dahulu."
          action-text="Lihat Katalog Program &rarr;"
          @action="router.push('/programs')"
        />
      </div>

      <!-- Empty State: Active program has no events yet -->
      <div v-else-if="timelineEvents.length === 0">
        <AppEmptyState
          title="Jadwal Sesi Belum Diterbitkan"
          description="Belum ada sesi pertemuan kelas atau pengumuman yang dijadwalkan oleh admin pada cohort ini. Silakan pantau kembali secara berkala."
        />
      </div>

      <!-- Sequential Industrial Timeline Console -->
      <div v-else class="chassis-panel rounded-3xl p-4 sm:p-6 lg:p-8 corner-screws space-y-8 relative">
        <div class="flex items-center justify-between pb-3 border-b border-slate-300/80">
          <span class="font-mono text-xs font-bold text-[#1E5FAD] uppercase tracking-wider flex items-center gap-2">
            <span class="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
            URUTAN SESI KELAS // PERTEMUAN 1..N & TECHNICAL MEETING
          </span>
          <span class="font-mono text-[10px] text-slate-500">
            TOTAL // {{ timelineEvents.length }} SESI TERJADWAL
          </span>
        </div>

        <!-- Connecting Timeline Spine -->
        <div class="relative pl-4 sm:pl-8 border-l-2 border-[#1E5FAD]/40 space-y-8">
          <div
            v-for="(item, index) in timelineEvents"
            :key="item.id"
            :class="[
              'timeline-node relative transition-all duration-200',
              isPastEvent(item.event_date) ? 'opacity-65 grayscale-25' : ''
            ]"
          >
            <!-- Mechanical Node Anchor / LED Dot -->
            <div
              :class="[
                'absolute -left-[23px] sm:-left-[39px] top-4 size-3.5 sm:size-4 rounded-full ring-4 ring-[#ebf0f7] transition-all',
                isPastEvent(item.event_date)
                  ? 'bg-slate-400 shadow-none'
                  : 'bg-emerald-500 shadow-[0_0_10px_#10b981]'
              ]"
            />

            <!-- Event Chassis Card -->
            <article class="p-4 sm:p-6 rounded-2xl bg-[#d7e0ec] shadow-[inset_2px_2px_4px_#b5c2d3,inset_-2px_-2px_4px_#ffffff] border border-white/50 space-y-4">
              <!-- Top Metadata Bar -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div class="flex items-center gap-2 flex-wrap">
                  <!-- Sequence Badge -->
                  <span class="font-mono text-[10px] font-bold text-white bg-[#1E5FAD] px-2 py-0.5 rounded-md shadow-xs">
                    SESI #{{ String(index + 1).padStart(2, '0') }}
                  </span>

                  <!-- Cohort / Program Name Tag -->
                  <span class="font-mono text-[10px] font-bold text-[#1E5FAD] bg-blue-100/80 px-2 py-0.5 rounded-md border border-blue-200">
                    {{ getProgramTitle(item.program_id) }}
                  </span>

                  <!-- Past vs Upcoming Indicator -->
                  <AppBadge
                    :variant="isPastEvent(item.event_date) ? 'neutral' : 'success'"
                    size="sm"
                  >
                    {{ isPastEvent(item.event_date) ? 'SELESAI // PAST' : 'MENDATANG // UPCOMING' }}
                  </AppBadge>

                  <!-- Attendance Status Indicator -->
                  <AppBadge
                    v-if="item.has_attended || item.attended"
                    variant="success"
                    size="sm"
                  >
                    ✓ HADIR
                  </AppBadge>
                  <AppBadge
                    v-else-if="item.attendance_is_open"
                    variant="warning"
                    size="sm"
                  >
                    <span class="size-1.5 rounded-full bg-amber-500 animate-pulse mr-1 inline-block"></span>
                    ABSENSI DIBUKA
                  </AppBadge>
                </div>

                <!-- Indonesian Date-Only Formatting -->
                <div class="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-800">
                  <svg class="size-4 text-[#1E5FAD]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                  </svg>
                  <span>{{ formatIndonesianDate(item.event_date) }}</span>
                </div>
              </div>

              <!-- Title -->
              <h2 class="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug">
                {{ item.title }}
              </h2>

              <!-- Description (Handled gracefully if empty) -->
              <p
                v-if="item.description && item.description.trim() !== ''"
                class="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans"
              >
                {{ item.description }}
              </p>
              <p
                v-else
                class="text-xs text-slate-500 italic font-sans"
              >
                Sesi pendampingan kelas dan pertemuan kurikulum tatap muka cohort.
              </p>

              <!-- Documentation URLs Tray if available -->
              <div
                v-if="item.documentation_urls && item.documentation_urls.length > 0"
                class="p-3 bg-white/70 rounded-xl border border-slate-300/80 space-y-2"
              >
                <span class="font-mono text-[10px] font-bold text-[#1E5FAD] uppercase tracking-wider flex items-center gap-1.5">
                  <svg class="size-3.5 text-[#1E5FAD]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  </svg>
                  DOKUMENTASI & REKAMAN SESI:
                </span>

                <div class="flex flex-wrap gap-2">
                  <a
                    v-for="(docUrl, docIdx) in item.documentation_urls"
                    :key="docIdx"
                    :href="resolveAssetUrl(docUrl)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#ebf0f7] text-[#1E5FAD] border border-white/80 font-mono text-[10px] font-bold shadow-[2px_2px_4px_#b5c2d3] hover:brightness-105 transition-all"
                  >
                    <span>🔗 Berkas/Rekaman [{{ docIdx + 1 }}]</span>
                    <span>&rarr;</span>
                  </a>
                </div>
              </div>

              <!-- Action Buttons: Optional CTA Link + Detail Page -->
              <div class="pt-3 border-t border-slate-300/80 flex flex-wrap items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                  <!-- Optional CTA Button if cta_link is present -->
                  <a
                    v-if="item.cta_link"
                    :href="item.cta_link"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-block"
                  >
                    <AppButton variant="primary" size="sm">
                      {{ item.cta_label || "Buka Tautan Sesi Live" }} &rarr;
                    </AppButton>
                  </a>
                </div>

                <div class="flex items-center gap-2">
                  <!-- Quick Attendance OTP Action -->
                  <RouterLink
                    v-if="item.attendance_is_open && !item.has_attended && !item.attended"
                    :to="`/events/${item.id}`"
                  >
                    <AppButton variant="primary" size="sm">
                      📝 Isi Absen (OTP)
                    </AppButton>
                  </RouterLink>

                  <RouterLink :to="`/events/${item.id}`">
                    <AppButton variant="secondary" size="sm">
                      Lihat Detail Sesi &rarr;
                    </AppButton>
                  </RouterLink>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    </div>
  </AppPage>
</template>
