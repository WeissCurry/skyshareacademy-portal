<script setup lang="ts">
import { computed } from "vue";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline-primary"
  | "outline-white"
  | "ghost-primary"
  | "ghost-muted"
  | "danger";

interface Props {
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
  size?: "sm" | "md" | "lg";
}

const props = withDefaults(defineProps<Props>(), {
  variant: "primary",
  disabled: false,
  loading: false,
  type: "button",
  className: "",
  size: "md",
});

const sizeClasses = {
  sm: "h-9 px-4 text-xs tracking-wider",
  md: "h-12 px-6 text-xs sm:text-sm tracking-wider",
  lg: "h-14 px-8 text-sm sm:text-base tracking-wider",
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-linear-to-b from-[#2573cf] to-[#1E5FAD] text-white font-bold border-t border-white/30 shadow-[4px_4px_10px_rgba(15,61,122,0.35),-2px_-2px_6px_rgba(255,255,255,0.7)] hover:brightness-105 active:translate-y-[2px] active:shadow-[inset_3px_3px_6px_#0f3d7a,inset_-3px_-3px_6px_#2e6fbd]",
  secondary:
    "bg-linear-to-b from-[#f3f7fd] to-[#dce5f1] text-[#1E5FAD] font-bold border-t border-white/80 shadow-[4px_4px_9px_#b5c2d3,-4px_-4px_9px_#ffffff] hover:text-[#174F96] hover:brightness-102 active:translate-y-[2px] active:shadow-[inset_3px_3px_6px_#b5c2d3,inset_-3px_-3px_6px_#ffffff]",
  "outline-primary":
    "bg-transparent text-[#1E5FAD] font-bold border-2 border-[#1E5FAD]/70 shadow-[2px_2px_5px_#b5c2d3,-2px_-2px_5px_#ffffff] hover:bg-[#1E5FAD]/10 active:translate-y-[2px] active:shadow-[inset_2px_2px_4px_rgba(30,95,173,0.2)]",
  "outline-white":
    "bg-transparent text-white font-bold border-2 border-white/80 shadow-[2px_2px_6px_rgba(0,0,0,0.2)] hover:bg-white/15 active:translate-y-[2px]",
  "ghost-primary":
    "bg-transparent text-[#1E5FAD] font-bold hover:bg-[#1E5FAD]/10 active:translate-y-[1px] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)]",
  "ghost-muted":
    "bg-transparent text-slate-600 font-semibold hover:bg-slate-200/50 hover:text-slate-900 active:translate-y-[1px]",
  danger:
    "bg-linear-to-b from-rose-500 to-rose-600 text-white font-bold border-t border-white/30 shadow-[4px_4px_10px_rgba(225,29,72,0.35),-2px_-2px_6px_rgba(255,255,255,0.7)] hover:brightness-105 active:translate-y-[2px] active:shadow-[inset_3px_3px_6px_#9f1239,inset_-3px_-3px_6px_#f43f5e]",
};

const computedClass = computed(() => {
  return [
    "rounded-xl inline-flex justify-center items-center gap-2.5 transition-all duration-150 select-none cursor-pointer uppercase font-sans",
    sizeClasses[props.size],
    props.disabled || props.loading
      ? "opacity-60 cursor-not-allowed pointer-events-none shadow-none"
      : "mechanical-btn",
    variantClasses[props.variant],
    props.className,
  ].join(" ");
});
</script>

<template>
  <button :type="props.type" :disabled="props.disabled || props.loading" :class="computedClass">
    <svg
      v-if="props.loading"
      class="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
    <slot name="icon-left" />
    <slot />
    <slot name="icon-right" />
  </button>
</template>
