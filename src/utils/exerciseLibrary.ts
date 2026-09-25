import { Exercise, WorkoutDay, WorkoutSession } from '../types/workout';
import { storage } from './storage';

export type LibraryCategory = 'main' | 'abdominal' | 'functional';

export interface LibraryExercise {
  id: string;
  name: string;
  category: LibraryCategory;
  isTimeBased?: boolean;
  isBilateral?: boolean;
  createdAt: number;
}

const LIB_KEY = 'exercise_library';
const MIGRATED_KEY = 'exercise_library_v1_migrated';
const HISTORY_KEY = 'workout_history';
const CUSTOM_KEY = 'custom_workouts';

export const normalizeName = (name: string): string =>
  (name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

const levenshtein = (a: string, b: string): number => {
  if (a === b) return 0;
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
};

/** Similarity score 0..1 between two names (after normalization). */
export const similarity = (a: string, b: string): number => {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  const ca = na.replace(/ /g, '');
  const cb = nb.replace(/ /g, '');
  if (ca === cb) return 0.98;
  // one is prefix of the other (e.g. "REMADA ALTA CROSS" vs "REMADA ALTA CROSS OVER")
  if (ca.startsWith(cb) || cb.startsWith(ca)) {
    const shorter = Math.min(ca.length, cb.length);
    if (shorter >= 6) return 0.9;
  }
  const dist = levenshtein(ca, cb);
  const lev = 1 - dist / Math.max(ca.length, cb.length);
  const ta = new Set(na.split(' '));
  const tb = new Set(nb.split(' '));
  const inter = [...ta].filter((t) => tb.has(t)).length;
  const jac = inter / new Set([...ta, ...tb]).size;
  return Math.max(lev, jac);
};

const SIMILAR_THRESHOLD = 0.8;

let cache: LibraryExercise[] = [];
let byNorm = new Map<string, LibraryExercise>();
let byId = new Map<string, LibraryExercise>();
let loaded = false;

const reindex = () => {
  byNorm = new Map(cache.map((e) => [normalizeName(e.name), e]));
  byId = new Map(cache.map((e) => [e.id, e]));
};

const persist = async () => {
  reindex();
  await storage.setItem(LIB_KEY, JSON.stringify(cache));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('exercise_library_updated'));
  }
};

const newId = () => `exlib_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const categoryOf = (list: 'exercises' | 'abdominal' | 'functional'): LibraryCategory =>
  list === 'exercises' ? 'main' : list;

export const exerciseLibrary = {
  async load(): Promise<LibraryExercise[]> {
    const raw = await storage.getItem(LIB_KEY);
    cache = raw ? JSON.parse(raw) : [];
    reindex();
    loaded = true;
    return cache;
  },

  getAll(): LibraryExercise[] {
    return [...cache].sort((a, b) => a.name.localeCompare(b.name));
  },

  getById(id?: string): LibraryExercise | undefined {
    return id ? byId.get(id) : undefined;
  },

  findExact(name: string): LibraryExercise | undefined {
    return byNorm.get(normalizeName(name));
  },

  findSimilar(name: string, category?: LibraryCategory, excludeId?: string): LibraryExercise[] {
    return cache
      .filter((e) => e.id !== excludeId && (!category || e.category === category))
      .map((e) => ({ e, s: similarity(name, e.name) }))
      .filter((x) => x.s >= SIMILAR_THRESHOLD)
      .sort((a, b) => b.s - a.s)
      .map((x) => x.e);
  },

  search(query: string, category?: LibraryCategory): LibraryExercise[] {
    const q = normalizeName(query);
    const list = this.getAll().filter((e) => !category || e.category === category);
    if (!q) return list;
    return list
      .map((e) => {
        const n = normalizeName(e.name);
        const s = n.includes(q) ? 2 : similarity(q, n);
        return { e, s };
      })
      .filter((x) => x.s >= 0.55)
      .sort((a, b) => b.s - a.s)
      .map((x) => x.e);
  },

  /** Returns exact match or creates a new entry. Never merges fuzzy matches silently. */
  async findOrCreate(
    name: string,
    category: LibraryCategory,
    extra?: Partial<Pick<LibraryExercise, 'isTimeBased' | 'isBilateral'>>
  ): Promise<LibraryExercise> {
    if (!loaded) await this.load();
    const exact = this.findExact(name);
    if (exact) return exact;
    const entry: LibraryExercise = {
      id: newId(),
      name: name.trim().toUpperCase(),
      category,
      ...extra,
      createdAt: Date.now(),
    };
    cache.push(entry);
    await persist();
    return entry;
  },

  async rename(id: string, newName: string): Promise<void> {
    const entry = byId.get(id);
    if (!entry) return;
    entry.name = newName.trim().toUpperCase();
    await persist();
    await rewriteReferences((ex) => (ex.exerciseId === id ? { ...ex, name: entry.name } : ex));
  },

  /** Merge `sourceId` into `targetId`: all references & history move to target. */
  async merge(sourceId: string, targetId: string): Promise<void> {
    const target = byId.get(targetId);
    if (!target || sourceId === targetId) return;
    cache = cache.filter((e) => e.id !== sourceId);
    await persist();
    await rewriteReferences((ex) =>
      ex.exerciseId === sourceId ? { ...ex, exerciseId: targetId, name: target.name } : ex
    );
  },

  async remove(id: string): Promise<void> {
    cache = cache.filter((e) => e.id !== id);
    await persist();
  },

  async clear(): Promise<void> {
    cache = [];
    await persist();
  },

  /** One-time migration: build library from existing workouts + history. */
  async migrate(): Promise<void> {
    await this.load();
    const done = await storage.getItem(MIGRATED_KEY);
    if (done) return;

    const rawHistory = await storage.getItem(HISTORY_KEY);
    const rawCustom = await storage.getItem(CUSTOM_KEY);
    // Safety backup
    await storage.setItem(
      'exercise_library_migration_backup',
      JSON.stringify({ history: rawHistory, custom: rawCustom, ts: Date.now() })
    );

    const history: WorkoutSession[] = rawHistory ? JSON.parse(rawHistory) : [];
    const custom: WorkoutDay[] = rawCustom ? JSON.parse(rawCustom) : [];

    const assign = (ex: Exercise, list: 'exercises' | 'abdominal' | 'functional'): Exercise => {
      if (!ex?.name) return ex;
      if (ex.exerciseId && byId.has(ex.exerciseId)) return ex;
      const norm = normalizeName(ex.name);
      let entry = byNorm.get(norm);
      if (!entry) {
        entry = {
          id: newId(),
          name: ex.name.trim().toUpperCase(),
          category: categoryOf(list),
          isTimeBased: ex.isTimeBased,
          isBilateral: ex.isBilateral,
          createdAt: Date.now(),
        };
        cache.push(entry);
        byNorm.set(norm, entry);
        byId.set(entry.id, entry);
      }
      return { ...ex, exerciseId: entry.id };
    };

    const mapContainer = <T extends { exercises: Exercise[]; abdominal?: Exercise[]; functional?: Exercise[] }>(c: T): T => ({
      ...c,
      exercises: (c.exercises || []).map((e) => assign(e, 'exercises')),
      abdominal: c.abdominal?.map((e) => assign(e, 'abdominal')),
      functional: c.functional?.map((e) => assign(e, 'functional')),
    });

    const newCustom = custom.map(mapContainer);
    const newHistory = history.map(mapContainer);

    await persist();
    if (rawCustom) await storage.setItem(CUSTOM_KEY, JSON.stringify(newCustom));
    if (rawHistory) await storage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    await storage.setItem(MIGRATED_KEY, '1');
  },
};

async function rewriteReferences(fn: (ex: Exercise) => Exercise) {
  const rawHistory = await storage.getItem(HISTORY_KEY);
  const rawCustom = await storage.getItem(CUSTOM_KEY);
  const mapC = <T extends { exercises: Exercise[]; abdominal?: Exercise[]; functional?: Exercise[] }>(c: T): T => ({
    ...c,
    exercises: (c.exercises || []).map(fn),
    abdominal: c.abdominal?.map(fn),
    functional: c.functional?.map(fn),
  });
  if (rawHistory) {
    await storage.setItem(HISTORY_KEY, JSON.stringify((JSON.parse(rawHistory) as WorkoutSession[]).map(mapC)));
  }
  if (rawCustom) {
    await storage.setItem(CUSTOM_KEY, JSON.stringify((JSON.parse(rawCustom) as WorkoutDay[]).map(mapC)));
    window.dispatchEvent(new CustomEvent('custom_workouts_updated'));
  }
}

/** Stable key for grouping stats: library id, or library match by name, or normalized name. */
export const exerciseKey = (ex: { name: string; exerciseId?: string }): string => {
  if (ex.exerciseId && byId.has(ex.exerciseId)) return ex.exerciseId;
  const byName = byNorm.get(normalizeName(ex.name));
  if (byName) return byName.id;
  return ex.exerciseId || `name:${normalizeName(ex.name)}`;
};

export const sameExercise = (
  a: { name: string; exerciseId?: string },
  b: { name: string; exerciseId?: string }
): boolean => exerciseKey(a) === exerciseKey(b);

/** Display name for a grouping key (falls back to the provided name). */
export const displayNameFor = (ex: { name: string; exerciseId?: string }): string => {
  const key = exerciseKey(ex);
  return byId.get(key)?.name || ex.name;
};
