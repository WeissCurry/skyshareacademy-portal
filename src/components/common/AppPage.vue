<script setup lang="ts">
import { computed } from "vue";
import AppBadge from "./AppBadge.vue";

export type PageWidth = "content" | "form" | "narrow" | "full";
export type StatusLedColor = "success" | "warning" | "danger" | "info" | "primary" | "none";

interface Props {
  width?: PageWidth;
  title?: string;
  subtitle?: string;
  code?: string;
  statusLed?: StatusLedColor;
  badge?: string;
  badgeVariant?: "neutral" | "success" | "warning" | "danger" | "mentor";
  containerClass?: string;
}

const props = withDefaults(defineProps<Props>(), {
  width: "content",
  title: "",
  subtitle: "",
  code: "",
  statusLed: "none",
  badge: "",
  badgeVariant: "neutral",
  containerClass: "",
});

const widthClasses: Record<PageWidth, string> = {
  content: "max-w-6xl",
  form: "max-w-2xl",
  narrow: "max-w-md",
  full: "max-w-full",
};

const ledColorClasses: Record<StatusLedColor, string> = {
  success: "bg-emerald-500 shadow-[0_0_8px_#10b981]",
  warning: "bg-amber-500 shadow-[0_0_8px_#f59e0b] animate-pulse",
  danger: "bg-rose-500 shadow-[0_0_8px_#f43f5e]",
  info: "bg-cyan-500 shadow-[0_0_8px_#06b6d4] animate-pulse",
  primary: "bg-[#1E5FAD] shadow-[0_0_8px_#1E5FAD] animate-pulse",
  none: "",
};

const hasHeader = computed(() => Boolean(props.title || props.subtitle || props.badge));
</script>

<template>
  <div
    :class="[
      'w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8 min-w-0 max-w-full overflow-x-hidden',
      widthClasses[props.width],
      props.containerClass,
    ]"
  >
    <!-- Standardized Page Header (Title + Subtitle + Optional Actions/Badge) -->
    <header v-if="hasHeader || $slots.header" class="space-y-3 min-w-0">
      <slot name="header">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-2 border-b border-slate-300/80">
          <div class="space-y-1 min-w-0 flex-1">
            <div class="flex items-center gap-2.5 flex-wrap">
              <span
                v-if="props.statusLed !== 'none'"
                :class="['size-2.5 rounded-full shrink-0', ledColorClasses[props.statusLed]]"
              />
              <h1 class="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-800 tracking-tight break-words">
                {{ props.title }}
              </h1>
              <span
                v-if="props.code"
                class="font-mono text-[10px] text-slate-500 bg-slate-200/90 px-2 py-0.5 rounded border border-white/50 shrink-0"
              >
                {{ props.code }}
              </span>
            </div>

            <p v-if="props.subtitle" class="font-mono text-[10px] sm:text-[11px] text-slate-500 tracking-wider uppercase break-words">
              {{ props.subtitle }}
            </p>
          </div>

          <!-- Header Actions / Badges Slot -->
          <div class="flex items-center gap-2 shrink-0 flex-wrap w-full sm:w-auto">
            <AppBadge
              v-if="props.badge"
              :variant="props.badgeVariant"
              size="sm"
            >
              {{ props.badge }}
            </AppBadge>
            <slot name="actions" />
          </div>
        </div>
      </slot>
    </header>

    <!-- Top Alerts / Notifications Slot -->
    <div v-if="$slots.alerts" class="space-y-3 min-w-0">
      <slot name="alerts" />
    </div>

    <!-- Main Content Slot -->
    <div class="space-y-6 min-w-0">
      <slot />
    </div>
  </div>
</template>
