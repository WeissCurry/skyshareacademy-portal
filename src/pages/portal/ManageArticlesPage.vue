<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import { useRouter } from "vue-router";
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
import type { ContributorArticle } from "@/types";
import { animatePageEntrance } from "@/utils/animations";

const router = useRouter();
const accessStore = useAccessStore();
const toast = useAlert();

const containerRef = ref<HTMLElement | null>(null);
const articles = ref<ContributorArticle[]>([]);
const isLoading = ref(true);
const errorMessage = ref<string | null>(null);

let abortController: AbortController | null = null;

// Form / Editor state
const showEditor = ref(false);
const editingArticleId = ref<number | null>(null);
const formTitle = ref("");
const formContent = ref("");
const formImageHeading = ref("");
const formCategoryId = ref<number>(1);
const formError = ref<string | null>(null);
const isSaving = ref(false);
const isSubmitting = ref(false);

let entranceCtx: { revert: () => void } | null = null;

const categoryOptions = [
  { value: 1, label: "Umum & Industri" },
  { value: 2, label: "Metodologi Mentoring" },
  { value: 3, label: "Pengembangan Talenta" },
  { value: 4, label: "Parenting & Edukasi" },
];

const formatIndonesianDate = (dateStr?: string | null): string => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
};

const runEntrance = async () => {
  await nextTick();
  if (containerRef.value) {
    entranceCtx?.revert();
    entranceCtx = animatePageEntrance(containerRef.value, ".article-card");
  }
};

const loadArticles = async () => {
  if (abortController) {
    abortController.abort();
  }
  abortController = new AbortController();
  const signal = abortController.signal;

  isLoading.value = true;
  errorMessage.value = null;

  try {
    const res = await apiClient.get<{
      status: string;
      data: ContributorArticle[];
    }>("/portal/my-articles", { signal });

    articles.value = res.data?.data || [];
  } catch (err: any) {
    if (axios.isCancel(err) || err.name === "CanceledError") return;
    const status = err.response?.status;
    if (status === 403) {
      errorMessage.value = "Akun Anda belum memiliki hak akses sebagai Kontributor Artikel.";
    } else {
      errorMessage.value =
        err.response?.data?.message || err.message || "Gagal memuat artikel kontributor.";
    }
  } finally {
    if (!signal.aborted) {
      isLoading.value = false;
    }
  }
};

const openCreateForm = () => {
  editingArticleId.value = null;
  formTitle.value = "";
  formContent.value = "";
  formImageHeading.value = "";
  formCategoryId.value = 1;
  formError.value = null;
  showEditor.value = true;
};

const openEditForm = (article: ContributorArticle) => {
  editingArticleId.value = article.id;
  formTitle.value = article.title;
  formContent.value = article.content;
  formImageHeading.value = article.image_heading || "";
  formCategoryId.value = article.category_id || 1;
  formError.value = null;
  showEditor.value = true;
};

const closeEditor = () => {
  showEditor.value = false;
  editingArticleId.value = null;
  formError.value = null;
};

const validateForm = (): boolean => {
  if (!formTitle.value.trim()) {
    formError.value = "Judul artikel wajib diisi.";
    return false;
  }
  if (!formContent.value.trim()) {
    formError.value = "Konten artikel wajib diisi.";
    return false;
  }
  formError.value = null;
  return true;
};

const handleSaveDraft = async () => {
  if (!validateForm()) return;

  isSaving.value = true;
  formError.value = null;

  const payload = {
    title: formTitle.value.trim(),
    content: formContent.value.trim(),
    image_heading: formImageHeading.value.trim() || undefined,
    category_id: formCategoryId.value,
  };

  try {
    if (editingArticleId.value) {
      await apiClient.put(`/portal/articles/${editingArticleId.value}`, payload);
      toast.success("Draf artikel berhasil diperbarui.", "Draf Tersimpan");
    } else {
      const res = await apiClient.post<{ data: { id: number } }>("/portal/articles", payload);
      editingArticleId.value = res.data?.data?.id || null;
      toast.success("Draf artikel baru berhasil dibuat.", "Draf Disimpan");
    }

    await loadArticles();
    closeEditor();
    await runEntrance();
  } catch (err: any) {
    formError.value =
      err.response?.data?.message || err.message || "Gagal menyimpan draf artikel.";
    toast.error(formError.value || "Gagal menyimpan draf.", "Penyimpanan Gagal");
  } finally {
    isSaving.value = false;
  }
};

const handleSubmitForReview = async (articleId?: number) => {
  const targetId = articleId || editingArticleId.value;

  // If in editor and no id yet, save first
  if (!targetId) {
    if (!validateForm()) return;
    await handleSaveDraft();
    if (!editingArticleId.value) return;
  }

  const idToSubmit = targetId || editingArticleId.value;
  if (!idToSubmit) return;

  isSubmitting.value = true;
  try {
    await apiClient.post(`/portal/articles/${idToSubmit}/submit`);
    toast.success(
      "Artikel berhasil dikirim untuk proses review oleh tim kurikulum.",
      "Artikel Terkirim"
    );

    if (showEditor.value) {
      closeEditor();
    }
    await loadArticles();
    await runEntrance();
  } catch (err: any) {
    const msg =
      err.response?.data?.message || err.message || "Gagal mengirim artikel untuk review.";
    toast.error(msg, "Pengiriman Gagal");
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(async () => {
  if (!accessStore.isContributor) {
    toast.warning("Halaman ini hanya dapat diakses oleh kontributor terdaftar.", "Akses Terbatas");
    router.push(accessStore.isVisitorOnly ? "/programs" : "/dashboard");
    return;
  }

  await loadArticles();
  await runEntrance();
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
    title="Ruang Kontributor Artikel"
    subtitle="CONTRIBUTOR // WRITE, SUBMIT & PUBLISH EDUCATIONAL ARTICLES"
    status-led="primary"
  >
    <template #actions>
      <AppButton
        v-if="!showEditor"
        variant="primary"
        size="md"
        @click="openCreateForm"
      >
        <span>+ Tulis Artikel Baru</span>
      </AppButton>
      <AppButton
        v-else
        variant="secondary"
        size="md"
        @click="closeEditor"
      >
        <span>&larr; Kembali ke Daftar Artikel</span>
      </AppButton>
    </template>

    <template #alerts>
      <div v-if="errorMessage">
        <AppAlert
          variant="error"
          title="Akses Ditolak"
          :message="errorMessage"
        />
      </div>
    </template>

    <div ref="containerRef" class="space-y-6">
      <!-- EDITOR PANEL (When showEditor is true) -->
      <section
        v-if="showEditor"
        class="chassis-panel rounded-3xl p-6 sm:p-8 corner-screws space-y-6 relative overflow-hidden"
      >
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-300/80">
          <div class="flex items-center gap-2">
            <span class="size-2 rounded-full bg-[#1E5FAD] animate-pulse"></span>
            <span class="font-mono text-xs font-bold text-[#1E5FAD] uppercase tracking-wider">
              EDITOR DRAF // {{ editingArticleId ? `ARTIKEL #${editingArticleId}` : 'ARTIKEL BARU' }}
            </span>
          </div>

          <div class="flex items-center gap-2">
            <AppButton
              variant="secondary"
              size="sm"
              :disabled="isSaving || isSubmitting"
              @click="closeEditor"
            >
              Batal
            </AppButton>
            <AppButton
              variant="primary"
              size="sm"
              :loading="isSaving"
              :disabled="isSubmitting"
              @click="handleSaveDraft"
            >
              Simpan Draf
            </AppButton>
            <AppButton
              variant="primary"
              size="sm"
              :loading="isSubmitting"
              :disabled="isSaving"
              @click="() => handleSubmitForReview()"
            >
              Kirim Review &rarr;
            </AppButton>
          </div>
        </div>

        <div v-if="formError">
          <AppAlert
            variant="error"
            title="Validasi Form"
            :message="formError"
            dismissible
            @close="formError = null"
          />
        </div>

        <form class="space-y-5" @submit.prevent="handleSaveDraft">
          <!-- Title Input -->
          <div class="space-y-1.5">
            <label class="font-mono text-xs font-bold text-slate-700 block uppercase">
              Judul Artikel <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="formTitle"
              type="text"
              placeholder="Masukkan judul artikel yang menarik dan edukatif..."
              class="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-sm font-bold text-slate-900 shadow-[inset_1px_1px_3px_rgba(0,0,0,0.1)] focus:outline-none focus:border-[#1E5FAD]"
              maxlength="200"
              required
            />
          </div>

          <!-- Category Selector & Cover Image URL -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="font-mono text-xs font-bold text-slate-700 block uppercase">
                Kategori Artikel <span class="text-rose-500">*</span>
              </label>
              <AppSelect
                v-model="formCategoryId"
                :options="categoryOptions"
                class="w-full"
              />
            </div>

            <div class="space-y-1.5">
              <label class="font-mono text-xs font-bold text-slate-700 block uppercase">
                URL Gambar Sampul (Opsional)
              </label>
              <input
                v-model="formImageHeading"
                type="url"
                placeholder="https://images.unsplash.com/..."
                class="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-mono text-slate-700 shadow-[inset_1px_1px_3px_rgba(0,0,0,0.1)] focus:outline-none focus:border-[#1E5FAD]"
              />
            </div>
          </div>

          <!-- Content Textarea -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="font-mono text-xs font-bold text-slate-700 block uppercase">
                Isi & Konten Artikel <span class="text-rose-500">*</span>
              </label>
              <span class="font-mono text-[10px] text-slate-400">Dukungan teks & paragraf terstruktur</span>
            </div>
            <textarea
              v-model="formContent"
              rows="12"
              placeholder="Tuliskan materi, wawasan, tips atau studi kasus mentoring Anda di sini..."
              class="w-full px-4 py-3 rounded-2xl bg-white border border-slate-300 text-sm font-sans text-slate-800 leading-relaxed shadow-[inset_1px_1px_3px_rgba(0,0,0,0.1)] focus:outline-none focus:border-[#1E5FAD]"
              required
            />
          </div>

          <!-- Footer Actions -->
          <div class="pt-4 border-t border-slate-300/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <p class="font-mono text-[10px] text-slate-500">
              STATUS DRAF // SETELAH DIKIRIM KE REVIEW, DRAF AKAN DIKUNCI HINGGA DISETUJUI ADMIN.
            </p>

            <div class="flex items-center gap-3">
              <AppButton
                variant="primary"
                type="button"
                :loading="isSaving"
                :disabled="isSubmitting"
                @click="handleSaveDraft"
              >
                Simpan Draf
              </AppButton>
              <AppButton
                variant="primary"
                type="button"
                :loading="isSubmitting"
                :disabled="isSaving"
                @click="() => handleSubmitForReview()"
              >
                Kirim untuk Review &rarr;
              </AppButton>
            </div>
          </div>
        </form>
      </section>

      <!-- ARTICLES LIST PANEL -->
      <section v-else class="space-y-6">
        <!-- Skeleton Loading -->
        <div v-if="isLoading" class="space-y-4">
          <div v-for="i in 3" :key="i" class="chassis-panel rounded-3xl p-6 corner-screws space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-300">
              <AppSkeleton variant="line" class="w-32 h-4" />
              <AppSkeleton variant="line" class="w-24 h-5 rounded-full" />
            </div>
            <AppSkeleton variant="line" class="w-3/4 h-6" />
            <AppSkeleton variant="line" class="w-full h-4" />
            <AppSkeleton variant="line" class="w-1/2 h-4" />
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="articles.length === 0" class="chassis-panel rounded-3xl p-10 sm:p-12 text-center space-y-4">
          <div class="size-16 rounded-2xl bg-[#d7e0ec] shadow-[inset_2px_2px_4px_#b5c2d3,inset_-2px_-2px_4px_#ffffff] mx-auto flex items-center justify-center text-2xl">
            ✍️
          </div>
          <div class="space-y-1">
            <h3 class="text-base sm:text-lg font-bold text-slate-800">Belum Ada Artikel yang Ditulis</h3>
            <p class="text-xs text-slate-500 font-sans max-w-md mx-auto leading-relaxed">
              Sebagai kontributor terdaftar, Anda dapat berbagi wawasan, artikel mentoring, dan tips industri kepada seluruh komunitas SkyShare.
            </p>
          </div>
          <div class="pt-2">
            <AppButton variant="primary" size="md" @click="openCreateForm">
              + Buat Draf Artikel Pertama
            </AppButton>
          </div>
        </div>

        <!-- Articles Cards List -->
        <div v-else class="space-y-4">
          <article
            v-for="item in articles"
            :key="item.id"
            class="article-card chassis-panel rounded-3xl p-5 sm:p-7 corner-screws space-y-4 relative overflow-hidden"
          >
            <!-- Card Header -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-300/80">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-mono text-xs font-bold text-[#1E5FAD] uppercase">
                  DRAF // #{{ item.id }}
                </span>
                <span v-if="item.category_name" class="font-mono text-[10px] text-slate-500 bg-white/60 px-2 py-0.5 rounded-md border border-slate-300">
                  {{ item.category_name }}
                </span>
                <span class="font-mono text-[10px] text-slate-400">
                  Dibuat: {{ formatIndonesianDate(item.createdAt) }}
                </span>
              </div>

              <!-- Status Badge -->
              <div>
                <AppBadge
                  v-if="item.status === 'PUBLISHED'"
                  variant="success"
                  size="sm"
                >
                  ✓ TERBIT // PUBLISHED
                </AppBadge>
                <AppBadge
                  v-else-if="item.status === 'SUBMITTED'"
                  variant="warning"
                  size="sm"
                >
                  <span class="size-1.5 rounded-full bg-amber-500 animate-pulse mr-1 inline-block"></span>
                  MENUNGGU REVIEW ADMIN
                </AppBadge>
                <AppBadge
                  v-else-if="item.status === 'REJECTED'"
                  variant="danger"
                  size="sm"
                >
                  DITOLAK DENGAN CATATAN
                </AppBadge>
                <AppBadge
                  v-else
                  variant="neutral"
                  size="sm"
                >
                  DRAF TERSIMPAN
                </AppBadge>
              </div>
            </div>

            <!-- Title & Snippet -->
            <div class="space-y-1.5">
              <h3 class="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {{ item.title }}
              </h3>
              <p class="text-xs sm:text-sm text-slate-600 line-clamp-2 font-sans leading-relaxed">
                {{ item.content }}
              </p>
            </div>

            <!-- Rejection Notice if rejected -->
            <div
              v-if="item.status === 'REJECTED' && item.reject_reason"
              class="p-3.5 rounded-xl bg-rose-50 border border-rose-300 space-y-1"
            >
              <div class="flex items-center gap-1.5 font-mono text-xs font-bold text-rose-800">
                <span>⚠️ Catatan Penolakan Admin:</span>
              </div>
              <p class="text-xs text-rose-700 font-sans leading-relaxed">
                {{ item.reject_reason }}
              </p>
            </div>

            <!-- Actions Bar -->
            <div class="pt-3 border-t border-slate-300/80 flex flex-wrap items-center justify-between gap-3">
              <span class="font-mono text-[10px] text-slate-500">
                STATUS: {{ item.status }}
              </span>

              <div class="flex items-center gap-2">
                <AppButton
                  v-if="item.status === 'DRAFT' || item.status === 'REJECTED'"
                  variant="secondary"
                  size="sm"
                  @click="openEditForm(item)"
                >
                  ✏️ Edit Draf
                </AppButton>

                <AppButton
                  v-if="item.status === 'DRAFT' || item.status === 'REJECTED'"
                  variant="primary"
                  size="sm"
                  :loading="isSubmitting"
                  @click="handleSubmitForReview(item.id)"
                >
                  Kirim Review &rarr;
                </AppButton>

                <span v-else-if="item.status === 'SUBMITTED'" class="text-xs font-mono text-amber-700 font-bold">
                  [Sedang ditinjau oleh admin]
                </span>

                <span v-else-if="item.status === 'PUBLISHED'" class="text-xs font-mono text-emerald-700 font-bold">
                  [Telah terbit secara publik]
                </span>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  </AppPage>
</template>