<script setup lang="ts">
import { computed, useId } from "vue";

interface Props {
  modelValue?: string | number | null;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  containerClass?: string;
  selectClass?: string;
  id?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: "",
  label: "",
  disabled: false,
  required: false,
  containerClass: "",
  selectClass: "",
  id: "",
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string | number): void;
  (e: "change", event: Event): void;
}>();

const autoId = useId();
const selectId = computed(() => props.id || autoId);

const onChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  emit("update:modelValue", target.value);
  emit("change", event);
};
</script>

<template>
  <div :class="['flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2.5 min-w-0 w-full sm:w-auto', props.containerClass]">
    <label
      v-if="props.label"
      :for="selectId"
      class="font-mono text-[11px] sm:text-xs uppercase tracking-wider font-bold text-[#1E5FAD] flex items-center gap-1.5 shrink-0"
    >
      <span class="size-1.5 rounded-full bg-[#38BDF8] inline-block shadow-[0_0_6px_#38BDF8]"></span>
      <span>{{ props.label }}</span>
      <span v-if="props.required" class="text-rose-500 font-bold">*</span>
    </label>

    <!-- Recessed Machine Slot Container -->
    <div
      class="relative w-full sm:w-auto min-w-0 sm:min-w-[200px] min-h-[44px] h-11 px-3 sm:px-3.5 py-1.5 bg-[#d6dfea] rounded-xl shadow-[inset_2px_2px_4px_#b5c2d3,inset_-2px_-2px_4px_#ffffff] transition-all duration-150 flex items-center border border-white/50 focus-within:border-[#38BDF8]/60 focus-within:shadow-[inset_2px_2px_4px_#b5c2d3,inset_-2px_-2px_4px_#ffffff,0_0_0_2px_#38BDF8]"
      :class="{
        'opacity-60 bg-slate-200 cursor-not-allowed': props.disabled,
      }"
    >
      <select
        :id="selectId"
        :value="props.modelValue ?? ''"
        :disabled="props.disabled"
        :required="props.required"
        :class="[
          'appearance-none bg-transparent font-mono text-xs sm:text-sm font-bold text-slate-800 outline-none w-full cursor-pointer pr-7 focus:ring-0 truncate',
          props.selectClass,
        ]"
        @change="onChange"
      >
        <slot />
      </select>

      <!-- Custom Tactile Mechanical Chevron -->
      <div class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#1E5FAD] flex items-center">
        <svg
          class="size-4 shrink-0 transition-transform duration-150"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </div>
  </div>
</template>

<style scoped>
select option {
  background-color: #ebf0f7;
  color: #1e293b;
  font-family: inherit;
  padding: 8px 12px;
}
</style>
