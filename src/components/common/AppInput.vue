<script setup lang="ts">
interface Props {
  modelValue?: string | number;
  label?: string;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  hint?: string;
  containerClass?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: "",
  label: "",
  placeholder: "",
  type: "text",
  disabled: false,
  required: false,
  error: "",
  hint: "",
  containerClass: "",
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit("update:modelValue", target.value);
};
</script>

<template>
  <div :class="['w-full flex flex-col justify-start items-start gap-1.5', props.containerClass]">
    <label v-if="props.label" class="font-mono text-[11px] uppercase tracking-wider font-bold text-[#1E5FAD] flex items-center gap-1.5">
      <span class="size-1.5 rounded-full bg-[#38BDF8] inline-block shadow-[0_0_6px_#38BDF8]"></span>
      {{ props.label }}
      <span v-if="props.required" class="text-rose-500 font-bold">*</span>
    </label>

    <!-- Recessed Machine Data Slot -->
    <div
      class="w-full h-12 px-4 py-2.5 bg-[#d6dfea] rounded-xl shadow-[inset_3px_3px_6px_#b5c2d3,inset_-3px_-3px_6px_#ffffff] transition-all duration-150 flex items-center gap-2 border border-transparent focus-within:border-[#38BDF8]/40 focus-within:shadow-[inset_3px_3px_6px_#b5c2d3,inset_-3px_-3px_6px_#ffffff,0_0_0_2px_#38BDF8]"
      :class="{
        'shadow-[inset_3px_3px_6px_#fda4af,inset_-3px_-3px_6px_#ffffff,0_0_0_2px_#f43f5e] bg-rose-50/40': props.error,
        'opacity-60 bg-slate-200 cursor-not-allowed': props.disabled,
      }"
    >
      <slot name="prefix" />
      <input
        :type="props.type"
        :value="props.modelValue"
        :placeholder="props.placeholder"
        :disabled="props.disabled"
        :required="props.required"
        class="w-full bg-transparent text-slate-800 text-sm font-mono tracking-wide placeholder:text-slate-400/80 placeholder:font-sans outline-none border-none"
        @input="onInput"
      />
      <slot name="suffix" />
    </div>

    <p v-if="props.error" class="font-mono text-[11px] text-rose-500 font-semibold flex items-center gap-1 mt-0.5">
      <span>ERR //</span>
      <span>{{ props.error }}</span>
    </p>
    <p v-else-if="props.hint" class="font-mono text-[11px] text-slate-400 mt-0.5">
      // {{ props.hint }}
    </p>
  </div>
</template>
