import { createQueuedLoad } from "./useQueuedLoad";

describe("createQueuedLoad", () => {
  it("runs nothing when nothing was deferred", () => {
    const q = createQueuedLoad<[number, number]>();
    const run = jest.fn();
    q.setRunner(run);
    q.runQueued();
    expect(run).not.toHaveBeenCalled();
  });

  it("runs the deferred request once, with its arguments", () => {
    const q = createQueuedLoad<[number, number]>();
    const run = jest.fn();
    q.setRunner(run);
    q.defer(0, 50);
    q.runQueued();
    q.runQueued(); // already consumed
    expect(run).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledWith(0, 50);
  });

  it("keeps only the newest request when several arrive during one load", () => {
    const q = createQueuedLoad<[number, number]>();
    const run = jest.fn();
    q.setRunner(run);
    q.defer(0, 10);
    q.defer(50, 50);
    q.defer(100, 25);
    q.runQueued();
    expect(run).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledWith(100, 25);
  });

  it("uses the runner registered last (the newest render's loader)", () => {
    const q = createQueuedLoad<[number]>();
    const stale = jest.fn();
    const fresh = jest.fn();
    q.setRunner(stale);
    q.defer(1);
    q.setRunner(fresh);
    q.runQueued();
    expect(stale).not.toHaveBeenCalled();
    expect(fresh).toHaveBeenCalledWith(1);
  });

  it("works for loaders without arguments and with optional ones", () => {
    const none = createQueuedLoad<[]>();
    const runNone = jest.fn();
    none.setRunner(runNone);
    none.defer();
    none.runQueued();
    expect(runNone).toHaveBeenCalledTimes(1);

    const optional = createQueuedLoad<[number, number?, string?]>();
    const runOptional = jest.fn();
    optional.setRunner(runOptional);
    optional.defer(2, 20, "abc");
    optional.runQueued();
    expect(runOptional).toHaveBeenCalledWith(2, 20, "abc");
  });

  it("a load that queues another while running ends with the queued one exactly once", async () => {
    const q = createQueuedLoad<[string]>();
    const order: string[] = [];
    let running = false;
    const load = async (label: string): Promise<void> => {
      if (running) {
        q.defer(label);
        return;
      }
      running = true;
      try {
        order.push(`start ${label}`);
        await Promise.resolve();
        order.push(`end ${label}`);
      } finally {
        running = false;
        q.runQueued();
      }
    };
    q.setRunner(load);

    const first = load("unfiltered");
    load("filtered"); // arrives while the first is running
    await first;
    await Promise.resolve();
    await Promise.resolve();

    expect(order).toEqual(["start unfiltered", "end unfiltered", "start filtered", "end filtered"]);
  });
});
