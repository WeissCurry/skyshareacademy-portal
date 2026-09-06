<script setup lang="ts">
interface Props {
  variant?: "mentor" | "talent" | "success" | "warning" | "danger" | "neutral";
  size?: "sm" | "md";
}

const props = withDefaults(defineProps<Props>(), {
  variant: "neutral",
  size: "md",
});

const variantStyles: Record<string, { badge: string; led: string }> = {
  mentor: {
    badge: "bg-[#ebf2fb] text-[#1E5FAD] border-blue-300/60 shadow-[2px_2px_5px_#b5c2d3,-2px_-2px_5px_#ffffff]",
    led: "bg-[#1E5FAD] shadow-[0_0_8px_#1E5FAD]",
  },
  talent: {
    badge: "bg-[#e0f2fe] text-[#0284C7] border-sky-300/60 shadow-[2px_2px_5px_#b5c2d3,-2px_-2px_5px_#ffffff]",
    led: "bg-[#0284C7] shadow-[0_0_8px_#0284C7]",
  },
  success: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-300/60 shadow-[2px_2px_5px_#b5c2d3,-2px_-2px_5px_#ffffff]",
    led: "bg-emerald-500 shadow-[0_0_8px_#10b981]",
  },
  warning: {
    badge: "bg-amber-50 text-amber-700 border-amber-300/60 shadow-[2px_2px_5px_#b5c2d3,-2px_-2px_5px_#ffffff]",
    led: "bg-amber-500 shadow-[0_0_8px_#f59e0b]",
  },
  danger: {
    badge: "bg-rose-50 text-rose-700 border-rose-300/60 shadow-[2px_2px_5px_#b5c2d3,-2px_-2px_5px_#ffffff]",
    led: "bg-rose-500 shadow-[0_0_8px_#f43f5e]",
  },
  neutral: {
    badge: "bg-[#e2e8f0] text-slate-700 border-slate-300/60 shadow-[2px_2px_5px_#b5c2d3,-2px_-2px_5px_#ffffff]",
    led: "bg-slate-500 shadow-[0_0_6px_#64748b]",
  },
};

const sizeStyles: Record<string, string> = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-1 text-xs",
};
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 font-mono font-bold tracking-wider rounded-lg border uppercase select-none',
      variantStyles[props.variant].badge,
      sizeStyles[props.size],
    ]"
  >
    <span
      :class="[
        'size-1.5 rounded-full animate-pulse shrink-0',
        variantStyles[props.variant].led,
      ]"
    />
    <slot />
  </span>
</template>
