import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Pencil, GitMerge, Check, X } from 'lucide-react';
import { exerciseLibrary, LibraryExercise } from '../utils/exerciseLibrary';
import { useToast } from '../hooks/use-toast';

const CAT_LABEL = { main: 'Principal', abdominal: 'Abdominal', functional: 'Funcional' } as const;

export const ExerciseLibraryDialog: React.FC<{ open: boolean; onOpenChange: (o: boolean) => void }> = ({ open, onOpenChange }) => {
  const [items, setItems] = useState<LibraryExercise[]>([]);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [merging, setMerging] = useState<string | null>(null);
  const { toast } = useToast();

  const refresh = async () => { await exerciseLibrary.load(); setItems(exerciseLibrary.getAll()); };
  useEffect(() => { if (open) refresh(); }, [open]);

  const list = query ? exerciseLibrary.search(query) : items;

  const saveRename = async (id: string) => {
    const name = editName.trim();
    if (!name) return;
    const clash = exerciseLibrary.findExact(name);
    if (clash && clash.id !== id) {
      toast({ title: 'Já existe', description: `Use "Mesclar" para unir com ${clash.name}.`, variant: 'destructive' });
      return;
    }
    await exerciseLibrary.rename(id, name);
    setEditing(null);
    refresh();
  };

  const doMerge = async (sourceId: string, targetId: string) => {
    await exerciseLibrary.merge(sourceId, targetId);
    setMerging(null);
    toast({ title: 'Exercícios mesclados', description: 'Histórico unificado.' });
    refresh();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>BIBLIOTECA DE EXERCÍCIOS</DialogTitle></DialogHeader>
        <Input placeholder="Buscar exercício" value={query} onChange={(e) => setQuery(e.target.value)} />
        <p className="text-xs text-muted-foreground">{items.length} exercícios. Excluir um treino não remove exercícios daqui.</p>
        <div className="space-y-2">
          {list.map((e) => (
            <div key={e.id} className="rounded-md border border-border p-2">
              {editing === e.id ? (
                <div className="flex gap-2">
                  <Input value={editName} onChange={(ev) => setEditName(ev.target.value.toUpperCase())} />
                  <Button size="sm" onClick={() => saveRename(e.id)}><Check className="w-4 h-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(null)}><X className="w-4 h-4" /></Button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium">{e.name}</div>
                    <div className="text-[11px] text-muted-foreground">{CAT_LABEL[e.category]}</div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(e.id); setEditName(e.name); }}><Pencil className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => setMerging(merging === e.id ? null : e.id)}><GitMerge className="w-4 h-4" /></Button>
                  </div>
                </div>
              )}
              {merging === e.id && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-muted-foreground">Mesclar "{e.name}" em (o histórico vai junto):</p>
                  {items.filter((o) => o.id !== e.id && o.category === e.category).map((o) => (
                    <Button key={o.id} size="sm" variant="outline" className="w-full justify-start" onClick={() => doMerge(e.id, o.id)}>{o.name}</Button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
