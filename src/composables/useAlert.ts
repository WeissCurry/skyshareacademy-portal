import { ref } from "vue";

export interface AlertItem {
  id: string;
  variant: "success" | "error" | "warning" | "info";
  title?: string;
  message: string;
  code?: string;
  timeout?: number;
}

const activeAlerts = ref<AlertItem[]>([]);

export function useAlert() {
  const dismiss = (id: string) => {
    activeAlerts.value = activeAlerts.value.filter((a) => a.id !== id);
  };

  const show = (options: Omit<AlertItem, "id">): string => {
    const id = `alert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const alert: AlertItem = {
      id,
      timeout: 4500,
      ...options,
    };

    activeAlerts.value.push(alert);

    if (alert.timeout && alert.timeout > 0) {
      setTimeout(() => {
        dismiss(id);
      }, alert.timeout);
    }

    return id;
  };

  const success = (message: string, title: string = "Berhasil Disimpan", code?: string) => {
    return show({ variant: "success", title, message, code: code || "SYS // 200_OK" });
  };

  const error = (message: string, title: string = "Terjadi Kesalahan", code?: string) => {
    return show({ variant: "error", title, message, code: code || "ERR // 400_FAIL" });
  };

  const warning = (message: string, title: string = "Perhatian", code?: string) => {
    return show({ variant: "warning", title, message, code: code || "WARN // 100_ATTN" });
  };

  const info = (message: string, title: string = "Informasi", code?: string) => {
    return show({ variant: "info", title, message, code: code || "INFO // 001_SYS" });
  };

  return {
    activeAlerts,
    show,
    dismiss,
    success,
    error,
    warning,
    info,
  };
}
