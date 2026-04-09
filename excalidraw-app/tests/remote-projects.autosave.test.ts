import { describe, expect, it, vi } from "vitest";

import { createRemoteAutoSaveController } from "../remote-projects/autosave";

describe("remote projects autosave", () => {
  it("does not save when the scene signature has not changed", async () => {
    vi.useFakeTimers();

    const save = vi.fn().mockResolvedValue(undefined);
    const controller = createRemoteAutoSaveController<string>({
      intervalMs: 10000,
      save,
      getSignature: (value) => value,
    });

    controller.queue("initial");
    controller.queue("initial");

    await vi.runAllTimersAsync();

    expect(save).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it("saves at most once per 10 seconds and flushes the latest queued scene", async () => {
    vi.useFakeTimers();

    const save = vi.fn().mockResolvedValue(undefined);
    const controller = createRemoteAutoSaveController<string>({
      intervalMs: 10000,
      save,
      getSignature: (value) => value,
    });

    controller.queue("initial");
    controller.queue("v1");

    await vi.runAllTimersAsync();
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenLastCalledWith("v1");

    controller.queue("v2");
    controller.queue("v3");

    await vi.advanceTimersByTimeAsync(9000);
    expect(save).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1000);
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith("v3");

    vi.useRealTimers();
  });

  it("flushes immediately when explicitly requested for a changed scene", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const controller = createRemoteAutoSaveController<string>({
      intervalMs: 10000,
      save,
      getSignature: (value) => value,
    });

    controller.queue("initial");

    await controller.flushNow("changed");

    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenLastCalledWith("changed");
  });
});
