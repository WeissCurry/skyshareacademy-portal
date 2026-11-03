<script setup lang="ts">
import { computed } from "vue";

interface Props {
  variant?: "line" | "block" | "circle";
  width?: string;
  height?: string;
  rounded?: string;
  animated?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: "line",
  width: "",
  height: "",
  rounded: "",
  animated: true,
});

const variantClasses = computed(() => {
  const list: string[] = [];

  if (props.variant === "circle") {
    list.push("rounded-full shrink-0 aspect-square");
  } else if (props.variant === "block") {
    list.push(props.rounded || "rounded-2xl");
  } else {
    // variant === "line"
    list.push(props.rounded || "rounded-lg");
    if (!props.height && !props.height.startsWith("h-")) {
      list.push("h-3.5 sm:h-4");
    }
    if (!props.width && !props.width.startsWith("w-")) {
      list.push("w-full");
    }
  }

  if (props.width && props.width.startsWith("w-")) {
    list.push(props.width);
  }
  if (props.height && props.height.startsWith("h-")) {
    list.push(props.height);
  }

  return list.join(" ");
});

const inlineStyles = computed(() => {
  const styles: Record<string, string> = {};
  if (props.width && !props.width.startsWith("w-")) {
    styles.width = props.width;
  }
  if (props.height && !props.height.startsWith("h-")) {
    styles.height = props.height;
  }
  return styles;
});
</script>

<template>
  <div
    role="status"
    aria-busy="true"
    :class="[
      'bg-[#d2dbe7] border border-white/50 shadow-[inset_1px_1px_3px_#b5c2d3,inset_-1px_-1px_3px_#ffffff] transition-all',
      props.animated ? 'skeleton-shimmer' : '',
      variantClasses,
    ]"
    :style="inlineStyles"
  >
    <span class="sr-only">Memuat...</span>
  </div>
</template>
