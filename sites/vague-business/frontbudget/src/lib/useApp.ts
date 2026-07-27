import { useCallback, useEffect, useState } from "react";
import { loadState, resetState as doReset, saveState, uid } from "./storage";
import type { AppState, Account, Budget, Settings, Transaction } from "./types";

export function useApp() {
  const [state, setState] = useState<AppState | null>(null);

  useEffect(() => {
    setState(loadState());
  }, []);

  const update = useCallback((updater: (s: AppState) => AppState) => {
    setState((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      saveState(next);
      return next;
    });
  }, []);

  const addTransaction = useCallback((tx: Omit<Transaction, "id">) => {
    update((s) => ({ ...s, transactions: [{ ...tx, id: uid() }, ...s.transactions] }));
  }, [update]);

  const removeTransaction = useCallback((id: string) => {
    update((s) => ({ ...s, transactions: s.transactions.filter((t) => t.id !== id) }));
  }, [update]);

  const upsertBudget = useCallback((b: Omit<Budget, "id"> & { id?: string }) => {
    update((s) => {
      const existing = s.budgets.find((x) => x.category === b.category && x.month === b.month);
      if (existing) {
        return { ...s, budgets: s.budgets.map((x) => x.id === existing.id ? { ...existing, limit: b.limit } : x) };
      }
      return { ...s, budgets: [...s.budgets, { ...b, id: uid() }] };
    });
  }, [update]);

  const removeBudget = useCallback((id: string) => {
    update((s) => ({ ...s, budgets: s.budgets.filter((b) => b.id !== id) }));
  }, [update]);

  const addAccount = useCallback((a: Omit<Account, "id">) => {
    update((s) => ({ ...s, accounts: [...s.accounts, { ...a, id: uid() }] }));
  }, [update]);

  const removeAccount = useCallback((id: string) => {
    update((s) => ({ ...s, accounts: s.accounts.filter((a) => a.id !== id) }));
  }, [update]);

  const setSettings = useCallback((partial: Partial<Settings>) => {
    update((s) => ({ ...s, settings: { ...s.settings, ...partial } }));
  }, [update]);

  const reset = useCallback(() => {
    setState(doReset());
  }, []);

  return {
    state,
    addTransaction,
    removeTransaction,
    upsertBudget,
    removeBudget,
    addAccount,
    removeAccount,
    setSettings,
    reset,
  };
}
