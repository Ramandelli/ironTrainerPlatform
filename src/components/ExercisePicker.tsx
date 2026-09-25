import React, { useEffect, useMemo, useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Search, Plus, Check, History } from 'lucide-react';
import { exerciseLibrary, LibraryCategory, LibraryExercise } from '../utils/exerciseLibrary';

export interface PickerValue {
  name: string;
  exerciseId?: string;
}

interface Props {
  value: PickerValue;
  onChange: (v: PickerValue) => void;
  category: LibraryCategory;
  placeholder?: string;
  onPickExisting?: (entry: LibraryExercise) => void;
}

export const ExercisePicker: React.FC<Props> = ({ value, onChange, category, placeholder, onPickExisting }) => {
  const [open, setOpen] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    exerciseLibrary.load().then(() => setTick((t) => t + 1));
    const h = () => setTick((t) => t + 1);
    window.addEventListener('exercise_library_updated', h);
    return () => window.removeEventListener('exercise_library_updated', h);
  }, []);

  const results = useMemo(() => exerciseLibrary.search(value.name, category).slice(0, 8), [value.name, category, open]);
  const selected = exerciseLibrary.getById(value.exerciseId);

  const pick = (e: LibraryExercise) => {
    onChange({ name: e.name, exerciseId: e.id });
    onPickExisting?.(e);
    setOpen(false);
  };

  return (
    <div className="relative">
      <Label htmlFor="name">Exercício *</Label>
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="name"
          value={value.name}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onChange={(e) => onChange({ name: e.target.value.toUpperCase(), exerciseId: undefined })}
          placeholder={placeholder || 'Buscar exercício existente ou digitar novo'}
          className="pl-9"
          autoComplete="off"
          required
        />
      </div>
      {selected && (
        <p className="text-xs text-primary mt-1 flex items-center gap-1">
          <History className="w-3 h-3" /> Exercício da biblioteca — histórico será mantido
        </p>
      )}
      {!selected && value.name.trim() && (
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          <Plus className="w-3 h-3" /> Será criado como novo exercício
        </p>
      )}
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg max-h-60 overflow-y-auto">
          <div className="px-3 py-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
            Seus exercícios
          </div>
          {results.map((e) => (
            <button
              type="button"
              key={e.id}
              onMouseDown={(ev) => ev.preventDefault()}
              onClick={() => pick(e)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center justify-between"
            >
              <span>{e.name}</span>
              {e.id === value.exerciseId && <Check className="w-4 h-4 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface ConfirmProps {
  name: string;
  matches: LibraryExercise[];
  onUse: (e: LibraryExercise) => void;
  onCreate: () => void;
}

/** Inline prompt shown on submit when a similar exercise already exists. */
export const SimilarExerciseConfirm: React.FC<ConfirmProps> = ({ name, matches, onUse, onCreate }) => (
  <div className="rounded-md border border-primary/40 bg-primary/5 p-3 space-y-2">
    <p className="text-sm font-medium">Já existe exercício parecido com "{name}". Você quis dizer:</p>
    <div className="flex flex-col gap-2">
      {matches.slice(0, 4).map((m) => (
        <Button key={m.id} type="button" variant="outline" size="sm" onClick={() => onUse(m)} className="justify-start">
          <Check className="w-4 h-4 mr-2" /> Usar {m.name}
        </Button>
      ))}
      <Button type="button" variant="ghost" size="sm" onClick={onCreate} className="justify-start">
        <Plus className="w-4 h-4 mr-2" /> Criar "{name}" como novo
      </Button>
    </div>
  </div>
);

/** Shared submit resolver for forms. Returns exerciseId or null if confirmation is needed. */
export async function resolveExercise(
  value: PickerValue,
  category: LibraryCategory,
  forceCreate: boolean,
  extra?: { isTimeBased?: boolean; isBilateral?: boolean }
): Promise<{ id: string; name: string } | { similar: LibraryExercise[] }> {
  await exerciseLibrary.load();
  if (value.exerciseId && exerciseLibrary.getById(value.exerciseId)) {
    const e = exerciseLibrary.getById(value.exerciseId)!;
    return { id: e.id, name: e.name };
  }
  const exact = exerciseLibrary.findExact(value.name);
  if (exact) return { id: exact.id, name: exact.name };
  if (!forceCreate) {
    const similar = exerciseLibrary.findSimilar(value.name, category);
    if (similar.length) return { similar };
  }
  const created = await exerciseLibrary.findOrCreate(value.name, category, extra);
  return { id: created.id, name: created.name };
}
