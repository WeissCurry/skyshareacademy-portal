<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import AppBadge from "@/components/common/AppBadge.vue";
import { animatePageEntrance } from "@/utils/animations";

const router = useRouter();
const containerRef = ref<HTMLElement | null>(null);

const selectedCategory = ref("Semua");

const categories = ["Semua", "Tech & Cloud", "AI & Data", "Product Design", "Career Guide"];

const materials = ref([
  {
    id: 1,
    title: "Panduan Komprehensif Arsitektur Cloud & Scalability 2026",
    category: "TECH & CLOUD",
    readTime: "12 MIN READ",
    publishedAt: "5 SEP 2026",
    summary: "Membedah cara menyusun infrastruktur web modern dengan pendekatan stateless backend, caching layer, dan asynchronous worker.",
    isExclusive: true,
  },
  {
    id: 2,
    title: "Implementasi Design System Berbasis Token untuk Frontend Developer",
    category: "PRODUCT DESIGN",
    readTime: "15 MIN READ",
    publishedAt: "2 SEP 2026",
    summary: "Pelajari bagaimana menyelaraskan komponen UI di Figma dengan CSS Variables dan Tailwind v4 agar delivery cepat dan konsisten.",
    isExclusive: true,
  },
  {
    id: 3,
    title: "Membangun Autonomous AI Agents dengan Node.js & LLM Frameworks",
    category: "AI & DATA",
    readTime: "18 MIN READ",
    publishedAt: "28 AGU 2026",
    summary: "Konsep dasar multi-agent architecture, tool calling, context memory management, serta strategi mitigasi hallucination.",
    isExclusive: true,
  },
  {
    id: 4,
    title: "Strategi Portofolio & Tips Interview Masuk Perusahaan Tech Global",
    category: "CAREER GUIDE",
    readTime: "10 MIN READ",
    publishedAt: "20 AGU 2026",
    summary: "Langkah konkret menyusun studi kasus portofolio yang disukai tech recruiter dan engineering manager.",
    isExclusive: true,
  },
]);

const filteredMaterials = computed(() => {
  if (selectedCategory.value === "Semua") return materials.value;
  return materials.value.filter((m) => m.category.toLowerCase() === selectedCategory.value.toLowerCase());
});

const selectCategory = async (cat: string) => {
  selectedCategory.value = cat;
  await nextTick();
  if (containerRef.value) {
    animatePageEntrance(containerRef.value, ".material-card");
  }
};

onMounted(() => {
  if (containerRef.value) {
    animatePageEntrance(containerRef.value, ".material-card");
  }
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header Banner Bolted Module -->
    <div class="bg-[#ebf0f7] rounded-3xl shadow-[6px_6px_14px_#b5c2d3,-6px_-6px_14px_#ffffff] border border-white/80 corner-screws p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 mb-2">
          <AppBadge variant="mentor">MEMBER EXCLUSIVE</AppBadge>
          <span class="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-emerald-600 bg-emerald-100/70 px-2 py-0.5 rounded-md">
            <span class="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981] animate-pulse"></span>
            FULL_ACCESS
          </span>
        </div>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
          Modul & Artikel Eksklusif SkyShare
        </h2>
        <p class="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl font-sans leading-relaxed">
          Artikel teknis, modul pembelajaran, dan dokumentasi kurikulum resmi yang hanya dapat diakses oleh member terdaftar SkyShare Academy.
        </p>
      </div>

      <div class="p-4 bg-[#d7e0ec] rounded-2xl shadow-[inset_3px_3px_6px_#b5c2d3,inset_-3px_-3px_6px_#ffffff] border border-white/40 shrink-0 font-mono text-xs text-[#1E5FAD]">
        <span class="font-bold block text-[11px] tracking-wider">STATUS_AKSES //</span>
        <span class="text-slate-700 text-xs font-bold">VERIFIED_MEMBER_OK</span>
      </div>
    </div>

    <!-- Category Rocker Filters with Smooth Horizontal Scroll -->
    <div class="flex items-center gap-2 overflow-x-auto pb-1 max-w-full p-1.5 bg-[#d7e0ec] rounded-2xl shadow-[inset_2px_2px_4px_#b5c2d3,inset_-2px_-2px_4px_#ffffff] border border-white/40">
      <button
        v-for="cat in categories"
        :key="cat"
        :class="[
          'px-4 py-2 rounded-xl font-mono text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer',
          selectedCategory === cat
            ? 'bg-[#1E5FAD] text-white shadow-[inset_2px_2px_4px_#0f3d7a,inset_-2px_-2px_4px_#2e6fbd] translate-y-[1px]'
            : 'bg-[#ebf0f7] text-slate-700 shadow-[2px_2px_5px_#b5c2d3,-2px_-2px_5px_#ffffff] hover:text-[#1E5FAD] active:translate-y-[1px]'
        ]"
        @click="selectCategory(cat)"
      >
        {{ cat }}
      </button>
    </div>

    <!-- Materials Grid -->
    <div ref="containerRef" class="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div
        v-for="mat in filteredMaterials"
        :key="mat.id"
        class="material-card bg-[#ebf0f7] rounded-3xl shadow-[6px_6px_14px_#b5c2d3,-6px_-6px_14px_#ffffff] border border-white/80 corner-screws p-6 flex flex-col justify-between hover:-translate-y-1 hover:shadow-[8px_8px_18px_#b5c2d3,-8px_-8px_18px_#ffffff] transition-all cursor-pointer group"
        @click="router.push(`/materials/${mat.id}`)"
      >
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="px-2.5 py-1 rounded-md font-mono text-[10px] font-bold bg-[#d7e0ec] shadow-[inset_1px_1px_2px_#b5c2d3] text-[#1E5FAD]">
              {{ mat.category }}
            </span>
            <span class="font-mono text-[10px] text-slate-400 font-bold">{{ mat.readTime }}</span>
          </div>

          <h3 class="text-base font-bold text-slate-800 leading-snug group-hover:text-[#1E5FAD] transition-colors">
            {{ mat.title }}
          </h3>

          <p class="text-xs text-slate-500 line-clamp-3 leading-relaxed font-sans">
            {{ mat.summary }}
          </p>
        </div>

        <div class="pt-4 border-t border-slate-300/80 mt-4 flex items-center justify-between text-xs">
          <span class="font-mono text-[10px] text-slate-400">PUB // {{ mat.publishedAt }}</span>
          <span class="font-mono text-[11px] font-bold text-[#1E5FAD] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            <span>BACA MODUL</span>
            <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
