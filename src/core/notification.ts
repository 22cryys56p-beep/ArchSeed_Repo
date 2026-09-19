export type StateChangeListener = () => void;

export type StateChangeNotifier = {
  subscribe(listener: StateChangeListener): () => void;
  notify(): void;
};

export function createStateChangeNotifier(): StateChangeNotifier {
  const listeners = new Set<StateChangeListener>();

  return {
    subscribe(listener) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },

    notify() {
      for (const listener of listeners) {
        listener();
      }
    },
  };
}