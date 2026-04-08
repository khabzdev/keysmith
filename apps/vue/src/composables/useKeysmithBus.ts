import { inject, provide, ref } from "vue";
import type { KeysmithEvent } from "../types";

const BUS_KEY = Symbol("keysmith-bus");

let _eventId = 0;

interface KeysmithBus {
  events: ReturnType<typeof ref<KeysmithEvent[]>>;
  emit(type: KeysmithEvent["type"], key: readonly unknown[], label: string): void;
}

export function provideKeysmithBus() {
  const events = ref<KeysmithEvent[]>([]);

  const bus: KeysmithBus = {
    events,
    emit(type, key, label) {
      events.value = [
        { id: ++_eventId, timestamp: Date.now(), type, key, label },
        ...events.value,
      ].slice(0, 8);
    },
  };

  provide(BUS_KEY, bus);
  return bus;
}

export function useKeysmithBus(): KeysmithBus {
  const bus = inject<KeysmithBus>(BUS_KEY);
  if (!bus) throw new Error("provideKeysmithBus() not called in parent");
  return bus;
}
