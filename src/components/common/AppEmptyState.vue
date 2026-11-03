<script setup lang="ts">
import AppButton from "./AppButton.vue";

interface Props {
  title?: string;
  description?: string;
  actionText?: string;
  mascotSrc?: string;
}

withDefaults(defineProps<Props>(), {
  title: "",
  description: "",
  actionText: "",
  mascotSrc: "/images/mascot-icons/pose=2.webp",
});

defineEmits<{
  (e: "action"): void;
}>();
</script>

<template>
  <div class="w-full bg-[#ebf0f7] rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center justify-center relative shadow-[6px_6px_14px_#b5c2d3,-6px_-6px_14px_#ffffff] border border-white/60 corner-screws overflow-hidden">
    <!-- Top Hardware Vents & System Label -->
    <div class="w-full flex items-center justify-between mb-6 px-2">
      <span class="font-mono text-[10px] font-bold tracking-widest text-[#1E5FAD] uppercase flex items-center gap-1.5">
        <span class="size-1.5 rounded-full bg-amber-500 animate-ping"></span>
        STATUS // STANDBY
      </span>

      <!-- Ventilation Slots -->
      <div class="flex gap-1.5 items-center">
        <div class="h-5 w-1 rounded-full bg-[#b5c2d3] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3)]"></div>
        <div class="h-5 w-1 rounded-full bg-[#b5c2d3] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3)]"></div>
        <div class="h-5 w-1 rounded-full bg-[#b5c2d3] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3)]"></div>
      </div>
    </div>

    <!-- Recessed Mascot Screen Pod -->
    <div class="mb-5 relative p-5 rounded-2xl bg-[#d7e0ec] shadow-[inset_4px_4px_8px_#b5c2d3,inset_-4px_-4px_8px_#ffffff] border border-white/40">
      <slot name="mascot">
        <img
          :src="mascotSrc"
          alt="SkyShare Mascot"
          class="size-28 sm:size-32 object-contain relative z-10 transition-transform duration-300 hover:scale-105 drop-shadow-md"
        />
      </slot>
    </div>

    <h3 class="text-lg sm:text-xl font-bold text-slate-800 mb-2">
      {{ title || "Belum Ada Data Aktif" }}
    </h3>

    <p class="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed mb-6 font-sans">
      {{ description || "Saat ini belum ada data yang dapat ditampilkan. Silakan kembali lagi nanti atau jelajahi kegiatan SkyShare Academy." }}
    </p>

    <div v-if="actionText">
      <AppButton variant="primary" @click="$emit('action')">
        {{ actionText }}
      </AppButton>
    </div>
  </div>
</template>
