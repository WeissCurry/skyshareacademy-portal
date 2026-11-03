<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { apiClient } from "@/api/client";
import AppBadge from "@/components/common/AppBadge.vue";
import AppButton from "@/components/common/AppButton.vue";
import AppAlert from "@/components/common/AppAlert.vue";
import AppSkeleton from "@/components/common/AppSkeleton.vue";
import AppPage from "@/components/common/AppPage.vue";
import type { ExclusiveArticle } from "@/types";
import { animatePageEntrance } from "@/utils/animations";

const route = useRoute();
const router = useRouter();

const containerRef = ref<HTMLElement | null>(null);
const article = ref<ExclusiveArticle | null>(null);
const isLoading = ref(true);
const errorMessage = ref<string | null>(null);

let entranceCtx: { revert: () => void } | null = null;

const runEntrance = async () => {
  await nextTick();
  if (containerRef.value) {
    entranceCtx?.revert();
    entranceCtx = animatePageEntrance(containerRef.value, ".article-detail-module");
  }
};

const loadArticle = async (id: number) => {
  if (!id || isNaN(id)) {
    errorMessage.value = "ID artikel tidak valid.";
    isLoading.value = false;
    article.value = null;
    return;
  }

  isLoading.value = true;
  errorMessage.value = null;

  try {
    const res = await apiClient.get<{
      status: string;
      data: ExclusiveArticle;
    }>(`/portal/articles/${id}`);

    article.value = res.data?.data || null;
  } catch (err: any) {
    errorMessage.value =
      err.response?.data?.message ||
      err.message ||
      "Gagal memuat artikel atau Anda belum terdaftar aktif pada program ini.";
    article.value = null;
  } finally {
    isLoading.value = false;
  }
};

watch(
  () => route.params.id,
  async (newId) => {
    const id = Number(newId);
    await loadArticle(id);
    await runEntrance();
  }
);

onMounted(async () => {
  const initialId = Number(route.params.id);
  await loadArticle(initialId);
  await runEntrance();
});

onUnmounted(() => {
  entranceCtx?.revert();
});
</script>

<template>
  <AppPage
    width="content"
    title="Baca Artikel Eksklusif"
    :subtitle="`EXAMINE // ARTICLE_ID #${route.params.id || '-'}`"
    status-led="info"
  >
    <!-- Navigation Back -->
    <template #actions>
      <button
        type="button"
        class="hover:text-[#1E5FAD] flex items-center gap-1.5 cursor-pointer font-mono text-xs font-bold text-slate-600 min-h-[44px] px-2"
        @click="router.push('/materials')"
      >
        <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        <span>&larr; Kembali ke Katalog Materi</span>
      </button>
    </template>

    <template #alerts>
      <!-- Error Banner -->
      <div v-if="errorMessage">
        <AppAlert
          variant="error"
          title="Artikel Terproteksi"
          :message="errorMessage"
        >
          <div class="mt-3">
            <AppButton variant="secondary" size="sm" @click="router.push('/materials')">
              &larr; Kembali ke Daftar Materi
            </AppButton>
          </div>
        </AppAlert>
      </div>
    </template>

    <!-- Main Container Ref -->
    <div ref="containerRef">
      <!-- Structured Loading Skeleton (Mirrors Article Reader Card) -->
      <div v-if="isLoading" class="chassis-panel rounded-3xl p-6 sm:p-10 space-y-8 corner-screws">
        <!-- Article Header Skeleton -->
        <div class="space-y-4 border-b border-slate-300/80 pb-6">
          <div class="flex items-center gap-2">
            <AppSkeleton variant="line" class="w-32 h-6 rounded-md" />
            <AppSkeleton variant="line" class="w-20 h-4" />
          </div>
          <AppSkeleton variant="line" class="w-4/5 h-9" />
          <div class="flex items-center gap-3 pt-2">
            <AppSkeleton variant="circle" class="size-10" />
            <div class="space-y-1.5">
              <AppSkeleton variant="line" class="w-40 h-4" />
              <AppSkeleton variant="line" class="w-32 h-3" />
            </div>
          </div>
        </div>

        <!-- Article Content Body Skeleton -->
        <div class="space-y-4">
          <AppSkeleton variant="line" class="w-full h-4" />
          <AppSkeleton variant="line" class="w-11/12 h-4" />
          <AppSkeleton variant="line" class="w-4/5 h-4" />
          <div class="py-2" />
          <AppSkeleton variant="line" class="w-full h-4" />
          <AppSkeleton variant="line" class="w-full h-4" />
          <AppSkeleton variant="line" class="w-3/4 h-4" />
          <div class="py-2" />
          <AppSkeleton variant="line" class="w-11/12 h-4" />
          <AppSkeleton variant="line" class="w-2/3 h-4" />
        </div>

        <!-- Action Bottom Skeleton -->
        <div class="pt-6 border-t border-slate-300/80 flex flex-wrap items-center justify-between gap-4">
          <AppSkeleton variant="line" class="w-48 h-3" />
          <AppSkeleton variant="block" class="w-32 h-9 rounded-xl" />
        </div>
      </div>

      <!-- Article Reader Card -->
      <article
        v-else-if="article"
        class="article-detail-module chassis-panel rounded-3xl p-6 sm:p-10 space-y-8 corner-screws"
      >
        <!-- Article Header -->
        <div class="space-y-4 border-b border-slate-300/80 pb-6">
          <div class="flex flex-wrap items-center gap-2">
            <AppBadge variant="mentor">
              {{ article.category_name || "Materi Eksklusif Program" }}
            </AppBadge>
            <span class="text-xs text-slate-400">•</span>
            <span class="text-xs text-slate-500 font-mono font-bold">
              {{ article.read_time_minutes || 10 }} MIN BACA
            </span>
            <span v-if="article.program_id" class="text-xs text-slate-400">•</span>
            <span v-if="article.program_id" class="text-xs font-mono font-bold text-emerald-600">
              PROGRAM_ID // #{{ article.program_id }}
            </span>
          </div>

          <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
            {{ article.title }}
          </h2>

          <div class="flex items-center gap-3 pt-2">
            <div class="size-10 rounded-xl bg-linear-to-b from-[#2a7bd9] to-[#1E5FAD] text-white font-mono font-bold text-sm flex items-center justify-center shadow-sm">
              SS
            </div>
            <div>
              <p class="text-xs font-bold text-slate-800">
                {{ article.author_name || article.admin_name || "Tim Kurikulum SkyShare Academy" }}
              </p>
              <p class="text-[11px] text-slate-400 font-mono">
                STATUS // VERIFIED_LEARNING_MATERIAL
              </p>
            </div>
          </div>
        </div>

        <!-- Article Content Body -->
        <div class="prose prose-slate max-w-none text-sm text-slate-700 leading-relaxed space-y-5 font-sans whitespace-pre-line">
          {{ article.content || article.excerpt }}
        </div>

        <!-- Action Bottom -->
        <div class="pt-6 border-t border-slate-300/80 flex flex-wrap items-center justify-between gap-4">
          <div class="text-xs text-slate-500 font-mono">
            DOC // EXCLUSIVE_PROGRAM_ACCESS_OK
          </div>
          <div class="flex items-center gap-2">
            <AppButton variant="secondary" size="sm" @click="router.push('/materials')">
              Daftar Modul &rarr;
            </AppButton>
          </div>
        </div>
      </article>
    </div>
  </AppPage>
</template>
