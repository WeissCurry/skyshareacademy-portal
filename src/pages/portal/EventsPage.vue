<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import AppButton from "@/components/common/AppButton.vue";
import { animatePageEntrance } from "@/utils/animations";

const router = useRouter();
const containerRef = ref<HTMLElement | null>(null);

const selectedCategory = ref("all");

const events = ref([
  {
    id: 1,
    title: "AI & Fullstack Engineering Intensive Bootcamp 2026",
    category: "bootcamp",
    type: "INTENSIVE PROGRAM",
    date: "10 SEP - 25 OKT 2026",
    seatsLeft: 5,
    roleTarget: "all",
    thumbnail: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80",
    description: "Pelatihan komprehensif membangun aplikasi berbasis kecerdasan buatan dari arsitektur backend hingga antarmuka modern.",
    hasTask: true,
  },
  {
    id: 2,
    title: "Masterclass: Cloud Architecture with High-Scalability",
    category: "webinar",
    type: "LIVE MASTERCLASS",
    date: "19 SEP 2026 • 19:00 WIB",
    seatsLeft: 24,
    roleTarget: "talent",
    thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80",
    description: "Kupas tuntas arsitektur cloud serverless, microservices, dan strategi optimasi database untuk jutaan transaksi.",
    hasTask: false,
  },
  {
    id: 3,
    title: "SkyShare Tech Competition: Product Innovation Hackathon",
    category: "competition",
    type: "COMPETITION",
    date: "1 - 15 OKT 2026",
    seatsLeft: 12,
    roleTarget: "all",
    thumbnail: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80",
    description: "Kompetisi inovasi produk digital tingkat nasional. Dapatkan mentoring intensif dan hadiah modal pengembangan.",
    hasTask: true,
  },
]);

const filteredEvents = computed(() => {
  if (selectedCategory.value === "all") return events.value;
  return events.value.filter((e) => e.category === selectedCategory.value);
});

const selectCategory = async (catId: string) => {
  selectedCategory.value = catId;
  await nextTick();
  if (containerRef.value) {
    animatePageEntrance(containerRef.value, ".event-card");
  }
};

onMounted(() => {
  if (containerRef.value) {
    animatePageEntrance(containerRef.value, ".event-card");
  }
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header Console -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <span class="size-2 rounded-full bg-cyan-500 shadow-[0_0_6px_#06b6d4] animate-pulse"></span>
          <h2 class="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Daftar Event & Program</h2>
        </div>
        <p class="font-mono text-[11px] text-slate-500 mt-1">
          CATALOG // BOOTCAMP, WORKSHOP & HACKATHON
        </p>
      </div>

      <!-- Filter Rocker Keys -->
      <div class="flex items-center gap-2 p-1.5 bg-[#d7e0ec] rounded-2xl shadow-[inset_2px_2px_4px_#b5c2d3,inset_-2px_-2px_4px_#ffffff] self-start sm:self-auto border border-white/40 overflow-x-auto max-w-full">
        <button
          v-for="cat in [
            { id: 'all', label: 'SEMUA' },
            { id: 'bootcamp', label: 'BOOTCAMP' },
            { id: 'webinar', label: 'WEBINAR' },
            { id: 'competition', label: 'KOMPETISI' }
          ]"
          :key="cat.id"
          :class="[
            'px-3.5 py-1.5 rounded-xl font-mono text-[10px] font-bold tracking-wider transition-all cursor-pointer whitespace-nowrap',
            selectedCategory === cat.id
              ? 'bg-[#1E5FAD] text-white shadow-[inset_2px_2px_4px_#0f3d7a,inset_-2px_-2px_4px_#2e6fbd] translate-y-[1px]'
              : 'bg-[#ebf0f7] text-slate-700 shadow-[2px_2px_5px_#b5c2d3,-2px_-2px_5px_#ffffff] hover:text-[#1E5FAD] active:translate-y-[1px]'
          ]"
          @click="selectCategory(cat.id)"
        >
          {{ cat.label }}
        </button>
      </div>
    </div>

    <!-- Event Cards Grid -->
    <div ref="containerRef" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="event in filteredEvents"
        :key="event.id"
        class="event-card bg-[#ebf0f7] rounded-3xl shadow-[6px_6px_14px_#b5c2d3,-6px_-6px_14px_#ffffff] border border-white/80 corner-screws overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-[8px_8px_18px_#b5c2d3,-8px_-8px_18px_#ffffff]"
      >
        <div>
          <!-- Thumbnail screen -->
          <div class="h-44 relative overflow-hidden bg-slate-800 m-3 rounded-2xl shadow-[inset_3px_3px_6px_rgba(0,0,0,0.5)] border border-white/40">
            <img
              :src="event.thumbnail"
              :alt="event.title"
              class="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            />
            <div class="absolute inset-0 crt-screen pointer-events-none opacity-25" />
            <div class="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0F172A]/80 backdrop-blur-xs text-cyan-300 font-mono text-[10px] font-bold border border-cyan-500/30">
              <span class="size-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              {{ event.type }}
            </div>
          </div>

          <!-- Content Body -->
          <div class="p-5 pt-2 space-y-3">
            <h3 class="text-base font-bold text-slate-800 line-clamp-2 hover:text-[#1E5FAD] transition-colors">
              {{ event.title }}
            </h3>

            <p class="text-xs text-slate-500 line-clamp-2 leading-relaxed font-sans">
              {{ event.description }}
            </p>

            <div class="p-3 rounded-xl bg-[#d7e0ec] shadow-[inset_2px_2px_4px_#b5c2d3,inset_-2px_-2px_4px_#ffffff] space-y-1.5 font-mono text-[11px] border border-white/40">
              <div class="flex items-center justify-between text-slate-600">
                <span>WAKTU //</span>
                <span class="font-bold text-slate-800">{{ event.date }}</span>
              </div>
              <div class="flex items-center justify-between text-slate-600">
                <span>KUOTA //</span>
                <span class="font-bold text-emerald-700">SISA {{ event.seatsLeft }} KURSI</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="p-5 pt-0">
          <AppButton
            variant="primary"
            class-name="w-full"
            @click="router.push(`/events/${event.id}`)"
          >
            Detail Event & Pendaftaran
          </AppButton>
        </div>
      </div>
    </div>
  </div>
</template>
