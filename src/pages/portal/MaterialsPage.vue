<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import axios from "axios";
import { useAccessStore } from "@/stores/access";
import { apiClient } from "@/api/client";
import { useAlert } from "@/composables/useAlert";
import AppButton from "@/components/common/AppButton.vue";
import AppBadge from "@/components/common/AppBadge.vue";
import AppAlert from "@/components/common/AppAlert.vue";
import AppSkeleton from "@/components/common/AppSkeleton.vue";
import AppSelect from "@/components/common/AppSelect.vue";
import AppPage from "@/components/common/AppPage.vue";
import type { ProgramMaterial, ExclusiveArticle } from "@/types";
import { animatePageEntrance } from "@/utils/animations";
import { resolveAssetUrl } from "@/utils/url";

const accessStore = useAccessStore();
const toast = useAlert();

const containerRef = ref<HTMLElement | null>(null);
const activeTab = ref<"modules" | "articles">("modules");
const selectedProgramId = ref<number | null>(null);

let entranceCtx: { revert: () => void } | null = null;
let abortController: AbortController | null = null;
let lastLoadedProgramId: number | null = null;

const materials = ref<ProgramMaterial[]>([]);
const articles = ref<ExclusiveArticle[]>([]);
const isLoading = ref(true);
const errorMessage = ref<string | null>(null);
const downloadingId = ref<number | null>(null);

// Selected article modal
const selectedArticle = ref<ExclusiveArticle | null>(null);
const modalRef = ref<HTMLElement | null>(null);
const closeButtonRef = ref<HTMLButtonElement | null>(null);
let lastFocusedElement: HTMLElement | null = null;

const openArticle = async (art: ExclusiveArticle, evt?: MouseEvent) => {
  lastFocusedElement =
    (evt?.currentTarget as HTMLElement) ||
    (document.activeElement as HTMLElement) ||
    null;
  selectedArticle.value = art;
  await nextTick();
  closeButtonRef.value?.focus();
};

const closeArticleModal = () => {
  selectedArticle.value = null;
  lastFocusedElement?.focus();
  lastFocusedElement = null;
};

const handleModalKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape") {
    e.preventDefault();
    closeArticleModal();
    return;
  }

  if (e.key === "Tab" && modalRef.value) {
    const focusable = modalRef.value.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
};

// Body scroll lock on modal open (P2-2)
watch(selectedArticle, (val) => {
  if (val) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "";
  }
});

// Active program selector options
const programs = computed(() => accessStore.activePrograms);

// Load materials and articles for the selected program
const loadProgramContent = async (programId: number, force = false) => {
  // C7: Avoid duplicate fetch on mount if already loaded the same program
  if (!force && lastLoadedProgramId === programId && !errorMessage.value && materials.value.length > 0) {
    return;
  }

  // C9: Abort previous in-flight fetch
  if (abortController) {
    abortController.abort();
  }
  abortController = new AbortController();
  const signal = abortController.signal;

  isLoading.value = true;
  errorMessage.value = null;

  try {
    // 1. Fetch materials for program
    const matRes = await apiClient.get<{
      status: string;
      data: ProgramMaterial[];
    }>(`/portal/programs/${programId}/materials`, { signal });

    materials.value = matRes.data?.data || [];

    // 2. Fetch exclusive articles for program (P2-5: direct endpoint, surface failures)
    const artRes = await apiClient.get<{
      status: string;
      data: ExclusiveArticle[];
    }>(`/portal/programs/${programId}/articles`, { signal });

    articles.value = artRes.data?.data || [];
    lastLoadedProgramId = programId;
  } catch (err: any) {
    if (axios.isCancel(err) || err.name === "CanceledError") {
      return;
    }
    errorMessage.value =
      err.response?.data?.message || err.message || "Gagal memuat materi program.";
  } finally {
    if (!signal.aborted) {
      isLoading.value = false;
    }
  }
};

// Handle PDF download via signed URL (fresh on click, 5 min TTL)
const handleDownloadPdf = async (material: ProgramMaterial) => {
  downloadingId.value = material.id;
  try {
    const res = await apiClient.get<{
      status: string;
      data: { download_url: string };
    }>(`/portal/materials/${material.id}/download`);

    const downloadUrl = res.data?.data?.download_url;
    if (!downloadUrl) {
      throw new Error("URL unduhan tidak ditemukan dalam respons server.");
    }

    const targetUrl = resolveAssetUrl(downloadUrl);
    window.open(targetUrl, "_blank", "noopener,noreferrer");
    toast.success("Tautan unduhan PDF berhasil digenerate (berlaku 5 menit).", "Unduhan Dimulai");
  } catch (err: any) {
    const msg = err.response?.data?.message || err.message || "Gagal mendapatkan tautan unduhan PDF.";
    toast.error(msg, "Gagal Mengunduh");
  } finally {
    downloadingId.value = null;
  }
};

const runMaterialEntrance = async () => {
  await nextTick();
  if (containerRef.value) {
    entranceCtx?.revert();
    entranceCtx = animatePageEntrance(containerRef.value, ".material-card");
  }
};

watch(activeTab, async () => {
  await runMaterialEntrance();
});

const handleProgramChange = async (id: number) => {
  selectedProgramId.value = id;
  await loadProgramContent(id, true);
  await runMaterialEntrance();
};

onMounted(async () => {
  // Ensure access state is ready
  if (!accessStore.isLoaded) {
    await accessStore.fetchAccess().catch(() => {});
  }

  if (programs.value.length > 0) {
    const initialId = programs.value[0].program_id;
    selectedProgramId.value = initialId;
    await loadProgramContent(initialId);
    await runMaterialEntrance();
  } else {
    isLoading.value = false;
  }
});

onUnmounted(() => {
  document.body.style.overflow = "";
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
    title="Katalog Materi & Modul Kurikulum"
    subtitle="RESOURCES // PDF MODULES, SLIDES & EXCLUSIVE ARTICLES"
    status-led="info"
  >
    <!-- Program Selector Dropdown -->
    <template v-if="programs.length > 1" #actions>
      <AppSelect
        :model-value="selectedProgramId"
        label="Filter Program"
        @change="(e) => handleProgramChange(Number((e.target as HTMLSelectElement).value))"
      >
        <option :value="null" disabled :selected="!selectedProgramId">Pilih Program...</option>
        <option v-for="p in programs" :key="p.program_id" :value="p.program_id">
          {{ p.title }}
        </option>
      </AppSelect>
    </template>

    <!-- Error Banner -->
    <template #alerts>
      <div v-if="errorMessage">
        <AppAlert
          variant="error"
          title="Gagal Memuat Materi"
          :message="errorMessage"
          dismissible
          @close="errorMessage = null"
        />
      </div>
    </template>

    <!-- Empty Enrollment State -->
    <div
      v-if="programs.length === 0 && !isLoading"
      class="chassis-panel rounded-3xl p-6 sm:p-12 text-center corner-screws space-y-4 max-w-xl mx-auto"
    >
      <div class="size-14 rounded-2xl bg-[#d7e0ec] text-[#1E5FAD] shadow-[2px_2px_5px_#b5c2d3,-2px_-2px_5px_#ffffff] mx-auto flex items-center justify-center">
        <svg class="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
      </div>
      <div>
        <h2 class="text-base font-bold text-slate-800">Belum Ada Program Aktif</h2>
        <p class="text-xs text-slate-500 mt-1 leading-relaxed">
          Materi kurikulum hanya dapat diakses setelah Anda terdaftar aktif pada salah satu cohort program belajar.
        </p>
      </div>
      <RouterLink to="/programs" class="inline-block">
        <AppButton variant="primary" size="sm">
          Pilih & Daftar Program &rarr;
        </AppButton>
      </RouterLink>
    </div>

    <!-- Active Content Area -->
    <div v-else ref="containerRef" class="space-y-6">
      <!-- Tabs Console Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-300/80 pb-3 gap-3">
        <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            :class="[
              'px-3 sm:px-4 py-2 rounded-xl font-mono text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-2 min-h-[44px]',
              activeTab === 'modules'
                ? 'bg-[#1E5FAD] text-white shadow-[inset_1px_1px_2px_rgba(255,255,255,0.4),2px_2px_5px_#b5c2d3]'
                : 'bg-[#d7e0ec] text-slate-600 hover:text-slate-900 shadow-[2px_2px_4px_#b5c2d3,-2px_-2px_4px_#ffffff]'
            ]"
            @click="activeTab = 'modules'"
          >
            <span>MODUL KURIKULUM & SLIDE</span>
            <span class="bg-white/20 text-white px-1.5 py-0.2 rounded text-[10px]">
              {{ materials.length }}
            </span>
          </button>

          <button
            type="button"
            :class="[
              'px-3 sm:px-4 py-2 rounded-xl font-mono text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-2 min-h-[44px]',
              activeTab === 'articles'
                ? 'bg-[#1E5FAD] text-white shadow-[inset_1px_1px_2px_rgba(255,255,255,0.4),2px_2px_5px_#b5c2d3]'
                : 'bg-[#d7e0ec] text-slate-600 hover:text-slate-900 shadow-[2px_2px_4px_#b5c2d3,-2px_-2px_4px_#ffffff]'
            ]"
            @click="activeTab = 'articles'"
          >
            <span>ARTIKEL EKSKLUSIF</span>
            <span class="bg-white/20 text-white px-1.5 py-0.2 rounded text-[10px]">
              {{ articles.length }}
            </span>
          </button>
        </div>

        <span class="font-mono text-[10px] text-slate-400 hidden sm:inline">
          SECURE_DELIVERY // SIGNED_URL_TTL=300S
        </span>
      </div>

      <!-- Loading State Skeleton -->
      <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        <div v-for="i in 4" :key="i" class="chassis-panel rounded-3xl p-5 sm:p-6 corner-screws space-y-4 flex flex-col justify-between">
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <AppSkeleton variant="line" class="w-24 h-5 rounded-md" />
              <AppSkeleton variant="line" class="w-16 h-3" />
            </div>
            <AppSkeleton variant="line" class="w-3/4 h-5" />
            <div class="space-y-1.5">
              <AppSkeleton variant="line" class="w-full h-3.5" />
              <AppSkeleton variant="line" class="w-5/6 h-3.5" />
            </div>
          </div>
          <div class="pt-3 border-t border-slate-300/60">
            <AppSkeleton variant="block" class="w-full h-10 rounded-xl" />
          </div>
        </div>
      </div>

      <!-- TAB 1: MODUL & DOKUMEN MATERI -->
      <div v-else-if="activeTab === 'modules'" class="space-y-4">
        <div v-if="materials.length === 0" class="chassis-panel rounded-3xl p-8 text-center">
          <p class="text-sm font-bold text-slate-700">Belum ada modul yang diunggah untuk program ini.</p>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <article
            v-for="mat in materials"
            :key="mat.id"
            class="material-card chassis-panel rounded-3xl p-5 sm:p-6 corner-screws space-y-4 flex flex-col justify-between"
          >
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <AppBadge :variant="mat.type === 'pdf' ? 'mentor' : 'neutral'">
                  {{ mat.type === 'pdf' ? 'MODUL PDF' : 'TAUTAN EKSTERNAL' }}
                </AppBadge>
                <span class="font-mono text-[10px] text-slate-400">
                  URUTAN #{{ mat.order_index }}
                </span>
              </div>

              <h2 class="text-base font-bold text-slate-900 tracking-tight leading-snug">
                {{ mat.title }}
              </h2>

              <p v-if="mat.description" class="text-xs text-slate-600 font-sans leading-relaxed line-clamp-3">
                {{ mat.description }}
              </p>
            </div>

            <!-- Action Section -->
            <div class="pt-4 border-t border-slate-300/80">
              <!-- If PDF: Fresh Signed URL Download Button -->
              <div v-if="mat.type === 'pdf'" class="flex items-center justify-between gap-2 flex-wrap">
                <span class="font-mono text-[10px] text-slate-500">
                  BERLAKU 5 MENIT
                </span>
                <AppButton
                  variant="primary"
                  size="sm"
                  :loading="downloadingId === mat.id"
                  @click="handleDownloadPdf(mat)"
                >
                  <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  <span>Buka / Unduh PDF</span>
                </AppButton>
              </div>

              <!-- If External Link: Open new tab -->
              <div v-else-if="mat.external_url" class="flex items-center justify-between gap-2 flex-wrap">
                <span class="font-mono text-[10px] text-slate-500">
                  LINK EKSTERNAL
                </span>
                <a
                  :href="mat.external_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-block"
                >
                  <AppButton variant="secondary" size="sm">
                    <span>Buka Tautan Materi &rarr;</span>
                  </AppButton>
                </a>
              </div>
            </div>
          </article>
        </div>
      </div>

      <!-- TAB 2: ARTIKEL EKSKLUSIF -->
      <div v-else-if="activeTab === 'articles'" class="space-y-4">
        <div v-if="articles.length === 0" class="chassis-panel rounded-3xl p-8 text-center">
          <p class="text-sm font-bold text-slate-700">Belum ada artikel eksklusif yang dirilis untuk program ini.</p>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <article
            v-for="art in articles"
            :key="art.id"
            class="material-card chassis-panel rounded-3xl p-5 sm:p-6 corner-screws space-y-4 flex flex-col justify-between"
          >
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <AppBadge variant="mentor">
                  EKSKLUSIF
                </AppBadge>
                <span class="font-mono text-[10px] text-slate-500 font-bold">
                  {{ art.read_time_minutes || 5 }} MIN BACA
                </span>
              </div>

              <h2 class="text-base font-bold text-slate-900 tracking-tight leading-snug">
                {{ art.title }}
              </h2>

              <p v-if="art.excerpt" class="text-xs text-slate-600 font-sans leading-relaxed line-clamp-3">
                {{ art.excerpt }}
              </p>
            </div>

            <div class="pt-4 border-t border-slate-300/80">
              <AppButton
                variant="secondary"
                size="sm"
                class-name="w-full justify-between"
                @click="openArticle(art, $event)"
              >
                <span>Baca Artikel Lengkap</span>
                <span>&rarr;</span>
              </AppButton>
            </div>
          </article>
        </div>
      </div>
    </div>

    <!-- Article Reader Modal Dialog (P2-2: Full a11y, dialog role, modal, labelledby, Escape handler, focus trap) -->
    <div
      v-if="selectedArticle"
      ref="modalRef"
      role="dialog"
      aria-modal="true"
      aria-labelledby="article-modal-title"
      tabindex="-1"
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 outline-none"
      @keydown="handleModalKeydown"
      @click.self="closeArticleModal"
    >
      <div class="chassis-panel rounded-3xl max-w-2xl w-full max-h-[92vh] sm:max-h-[85vh] flex flex-col overflow-hidden corner-screws shadow-2xl">
        <!-- Modal Header -->
        <div class="p-4 sm:p-6 border-b border-slate-300/80 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <AppBadge variant="mentor" size="sm">ARTIKEL EKSKLUSIF</AppBadge>
            <span class="font-mono text-xs text-slate-500">ID #{{ selectedArticle.id }}</span>
          </div>

          <button
            ref="closeButtonRef"
            type="button"
            aria-label="Tutup dialog artikel"
            class="size-8 rounded-xl bg-[#ebf0f7] text-slate-500 shadow-[2px_2px_4px_#b5c2d3,-2px_-2px_4px_#ffffff] flex items-center justify-center cursor-pointer hover:text-slate-900 min-h-[32px] min-w-[32px]"
            @click="closeArticleModal"
          >
            ✕
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-4 sm:p-6 sm:p-8 overflow-y-auto space-y-4">
          <h2 id="article-modal-title" class="text-xl font-bold text-slate-900 leading-tight">
            {{ selectedArticle.title }}
          </h2>

          <div class="text-xs text-slate-500 font-mono flex items-center gap-3 pb-3 border-b border-slate-200">
            <span>PENULIS: {{ selectedArticle.author_name || 'Tim SkyShare Academy' }}</span>
            <span>•</span>
            <span>WAKTU: {{ selectedArticle.read_time_minutes || 5 }} MIN BACA</span>
          </div>

          <div class="prose prose-slate max-w-none text-xs sm:text-sm text-slate-700 leading-relaxed space-y-4 font-sans whitespace-pre-line">
            {{ selectedArticle.content || selectedArticle.excerpt || 'Isi artikel pembelajaran khusus mentor.' }}
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="p-4 border-t border-slate-300/80 flex items-center justify-between gap-2 flex-wrap">
          <RouterLink
            :to="`/articles/${selectedArticle.id}`"
            class="inline-block"
            @click="closeArticleModal"
          >
            <AppButton variant="secondary" size="sm">
              Buka Halaman Penuh &rarr;
            </AppButton>
          </RouterLink>

          <AppButton variant="primary" size="sm" @click="closeArticleModal">
            Tutup Pembaca
          </AppButton>
        </div>
      </div>
    </div>
  </AppPage>
</template>
