"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { api, type Workspace } from "@/lib/workspace-api";

interface DatasetState {
  data: Workspace | null;
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
  load: (force?: boolean) => Promise<void>;
}
let generation = 0;
export const useDatasetStore = create<DatasetState>((set, get) => ({
  data: null,
  status: "idle",
  error: null,
  load: async (force = false) => {
    if (!force && ["loading", "ready"].includes(get().status)) return;
    const requestId = ++generation;
    set({ data: null, status: "loading", error: null });
    try {
      const data = await api<Workspace>("/workspace");
      if (
        !data.revision ||
        !Array.isArray(data.investigations) ||
        !Array.isArray(data.runs)
      ) {
        throw new Error("Unexpected dataset response.");
      }
      if (requestId === generation) set({ data, status: "ready" });
    } catch (error) {
      if (requestId === generation)
        set({
          status: "error",
          error:
            error instanceof Error
              ? error.message
              : "Backend unavailable. Please retry.",
        });
    }
  },
}));

export function useDataset() {
  const state = useDatasetStore();
  useEffect(() => {
    if (useDatasetStore.getState().status === "idle") void state.load();
  }, [state.load]);
  return state;
}
