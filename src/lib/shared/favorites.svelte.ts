import type { Operator } from "./types";

export interface FavoriteStop {
  operator: Extract<Operator, "metro" | "bizkaibus" | "renfe">;
  code: string;
  name: string;
  meta?: string;
}

const STORAGE_KEY = "bizkaitrans:favorites";

function load(): FavoriteStop[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FavoriteStop[]) : [];
  } catch {
    return [];
  }
}

function sameStop(a: FavoriteStop, b: Pick<FavoriteStop, "operator" | "code">): boolean {
  return a.operator === b.operator && a.code === b.code;
}

class FavoritesStore {
  items = $state<FavoriteStop[]>(load());

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
    } catch {
      // localStorage unavailable (private mode, etc.) - favorites just won't persist across reloads.
    }
  }

  isFavorite(operator: FavoriteStop["operator"], code: string): boolean {
    return this.items.some((f) => sameStop(f, { operator, code }));
  }

  toggle(fav: FavoriteStop) {
    const idx = this.items.findIndex((f) => sameStop(f, fav));
    if (idx >= 0) {
      this.items.splice(idx, 1);
    } else {
      this.items.push(fav);
    }
    this.persist();
  }
}

export const favorites = new FavoritesStore();
