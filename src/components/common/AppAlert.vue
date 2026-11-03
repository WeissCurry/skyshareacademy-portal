<script setup lang="ts">
import { computed } from "vue";

interface Props {
  variant?: "success" | "error" | "warning" | "info";
  title?: string;
  message?: string;
  dismissible?: boolean;
  code?: string;
  className?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: "info",
  title: "",
  message: "",
  dismissible: false,
  code: undefined,
  className: "",
});

const emit = defineEmits<{
  (e: "close"): void;
}>();

const variantConfig = computed(() => {
  switch (props.variant) {
    case "success":
      return {
        card: "bg-[#edf8f1] border-emerald-300 text-emerald-950 shadow-[4px_4px_12px_#b3d9bd,-3px_-3px_8px_#ffffff]",
        iconPad: "bg-[#d4f3df] text-emerald-600 shadow-[inset_1.5px_1.5px_3px_#a4e3b7,inset_-1.5px_-1.5px_3px_#ffffff]",
        led: "bg-emerald-500 shadow-[0_0_8px_#10b981]",
        codeBadge: "bg-emerald-100/90 text-emerald-800 border-emerald-300",
        defaultCode: "SYS // 200_SUCCESS",
        defaultTitle: "Operasi Berhasil",
      };
    case "error":
      return {
        card: "bg-[#fef2f2] border-rose-300 text-rose-950 shadow-[4px_4px_12px_#fecdd3,-3px_-3px_8px_#ffffff]",
        iconPad: "bg-[#fee2e2] text-rose-600 shadow-[inset_1.5px_1.5px_3px_#fca5a5,inset_-1.5px_-1.5px_3px_#ffffff]",
        led: "bg-rose-500 shadow-[0_0_8px_#f43f5e]",
        codeBadge: "bg-rose-100/90 text-rose-800 border-rose-300",
        defaultCode: "ERR // 400_FAILED",
        defaultTitle: "Terjadi Kesalahan",
      };
    case "warning":
      return {
        card: "bg-[#fffbeb] border-amber-300 text-amber-950 shadow-[4px_4px_12px_#fde68a,-3px_-3px_8px_#ffffff]",
        iconPad: "bg-[#fef3c7] text-amber-600 shadow-[inset_1.5px_1.5px_3px_#fcd34d,inset_-1.5px_-1.5px_3px_#ffffff]",
        led: "bg-amber-500 shadow-[0_0_8px_#f59e0b]",
        codeBadge: "bg-amber-100/90 text-amber-800 border-amber-300",
        defaultCode: "WARN // 100_NOTICE",
        defaultTitle: "Perhatian",
      };
    case "info":
    default:
      return {
        card: "bg-[#f0f6fc] border-sky-300 text-slate-900 shadow-[4px_4px_12px_#b8d5f3,-3px_-3px_8px_#ffffff]",
        iconPad: "bg-[#dbeafe] text-[#1E5FAD] shadow-[inset_1.5px_1.5px_3px_#bfdbfe,inset_-1.5px_-1.5px_3px_#ffffff]",
        led: "bg-[#0284C7] shadow-[0_0_8px_#38BDF8]",
        codeBadge: "bg-sky-100/90 text-[#174F96] border-sky-300",
        defaultCode: "INFO // 001_NOTICE",
        defaultTitle: "Informasi Sistem",
      };
  }
});
</script>

<template>
  <div
    :class="[
      'relative overflow-hidden rounded-2xl border p-4 transition-all duration-300',
      variantConfig.card,
      props.className,
    ]"
    role="alert"
  >
    <!-- Hardware Accent Bar on Left -->
    <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-current opacity-30" />

    <div class="flex items-start gap-3.5">
      <!-- Tactile Icon Pad -->
      <div
        :class="[
          'relative size-10 rounded-xl flex items-center justify-center shrink-0 border border-white/60',
          variantConfig.iconPad,
        ]"
      >
        <!-- Corner pulsing LED indicator -->
        <span
          :class="[
            'absolute -top-1 -right-1 size-2 rounded-full animate-pulse ring-2 ring-white',
            variantConfig.led,
          ]"
        />

        <!-- Success Icon -->
        <svg
          v-if="props.variant === 'success'"
          class="size-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>

        <!-- Error Icon -->
        <svg
          v-else-if="props.variant === 'error'"
          class="size-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>

        <!-- Warning Icon -->
        <svg
          v-else-if="props.variant === 'warning'"
          class="size-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>

        <!-- Info Icon -->
        <svg
          v-else
          class="size-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </div>

      <!-- Main Body -->
      <div class="flex-1 min-w-0 pr-1">
        <div class="flex items-center gap-2 flex-wrap mb-0.5">
          <h4 class="text-sm font-bold tracking-tight">
            {{ props.title || variantConfig.defaultTitle }}
          </h4>
          <span
            :class="[
              'inline-flex items-center px-1.5 py-0.5 rounded font-mono text-[9px] font-bold border tracking-wider',
              variantConfig.codeBadge,
            ]"
          >
            {{ props.code || variantConfig.defaultCode }}
          </span>
        </div>

        <p v-if="props.message" class="text-xs leading-relaxed opacity-90 font-medium mt-0.5">
          {{ props.message }}
        </p>

        <!-- Default slot for custom content or action buttons -->
        <div v-if="$slots.default" class="mt-2">
          <slot />
        </div>
      </div>

      <!-- Dismiss Button -->
      <button
        v-if="props.dismissible"
        type="button"
        aria-label="Tutup alert"
        class="size-7 rounded-lg bg-white/70 hover:bg-white shadow-[1px_1px_2px_rgba(0,0,0,0.1),-1px_-1px_2px_#ffffff] text-slate-500 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-90"
        @click="emit('close')"
      >
        <svg
          class="size-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  </div>
</template>
