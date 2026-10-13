// TaySon preview: a persisted budget for benign, pre-write reloads only.
// The caller decides whether the current exploit phase permits a reload.
export function createReloadBudget(storageProvider, storageKey, requestedLimit) {
  const validLimit = /^(0|[1-9][0-9]*)$/.test(String(requestedLimit));
  const limit = validLimit ? Math.min(Number(requestedLimit), 4) : 4;
  let reserved = false;

  function count() {
    try {
      const raw = storageProvider().getItem(storageKey);
      if (raw === null) return 0;
      if (!/^(0|[1-9][0-9]*)$/.test(raw)) return null;
      const value = Number(raw);
      return Number.isSafeInteger(value) ? value : null;
    } catch (error) {
      return null;
    }
  }

  function reserve() {
    if (reserved) return { allowed: false, reason: "already-scheduled" };
    const current = count();
    if (current === null) return { allowed: false, reason: "storage-unavailable-or-invalid" };
    if (current >= limit) return { allowed: false, reason: "limit", count: current };
    try {
      storageProvider().setItem(storageKey, String(current + 1));
      if (count() !== current + 1) return { allowed: false, reason: "storage-not-persisted" };
    } catch (error) {
      return { allowed: false, reason: "storage-write-failed" };
    }
    reserved = true;
    return { allowed: true, count: current + 1 };
  }

  function clear() {
    try { storageProvider().removeItem(storageKey); } catch (error) {}
    // A scheduled reload cannot be cancelled by resetting its persistent count.
  }

  return { count, reserve, clear, limit };
}
