import { describe, expect, it } from "vitest";
import { createStateChangeNotifier } from "../../src/core/notification";

describe("state change notification", () => {
  it("notifies subscribed listeners", () => {
    const notifier = createStateChangeNotifier();
    let notifications = 0;

    notifier.subscribe(() => {
      notifications += 1;
    });

    notifier.notify();

    expect(notifications).toBe(1);
  });

  it("supports multiple notifications", () => {
    const notifier = createStateChangeNotifier();
    let notifications = 0;

    notifier.subscribe(() => {
      notifications += 1;
    });

    notifier.notify();
    notifier.notify();

    expect(notifications).toBe(2);
  });

  it("stops notifying after unsubscribe", () => {
    const notifier = createStateChangeNotifier();
    let notifications = 0;

    const unsubscribe = notifier.subscribe(() => {
      notifications += 1;
    });

    notifier.notify();
    unsubscribe();
    notifier.notify();

    expect(notifications).toBe(1);
  });
});