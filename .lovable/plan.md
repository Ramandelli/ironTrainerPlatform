# Biblioteca de Exercícios (exercício como entidade única)

## Diagnóstico atual
- Não existe cadastro de exercício. Cada treino guarda cópias soltas (`id` aleatório por treino).
- Histórico, estatísticas, recomendação de carga e platô agrupam **pelo nome** (texto). "REMADA ALTA CROSS" e "REMADA ALTA CROSS-OVER" viram dois exercícios.
- Excluir treino não apaga histórico, mas o exercício "some" das opções de reuso.

## O que muda para o usuário
- Ao adicionar exercício (criação de treino, Funcional, Abdominal e durante o treino): campo **Buscar exercício existente** com lista da biblioteca + botão **Criar novo exercício**.
- Ao digitar um nome parecido com um já existente (maiúsculas, espaços, acentos, hífen, pequenas diferenças), aparece "Você quis dizer: REMADA ALTA CROSS?" — o usuário escolhe usar o existente ou criar mesmo assim. Nada é renomeado sem confirmação.
- **Editar exercício durante o treino** passa a permitir trocar o exercício pelo seletor:
  - Existente: carrega última carga, histórico e recomendação dele.
  - Novo: sem recomendação, histórico começa do zero.
  - Ao finalizar, a execução fica registrada no exercício realmente feito.
- Biblioteca mantém exercícios mesmo após excluir o treino (inclusive os que só existem no histórico).
- Nova tela simples em Gerenciar: **Biblioteca de exercícios** (ver lista, renomear, mesclar duplicados antigos).

## Migração segura (automática, uma vez)
- Na abertura do app, varre treinos + histórico, agrupa por nome normalizado e cria a biblioteca.
- Cada exercício de treino e de sessão antiga recebe o `exerciseId` correspondente. Nada é apagado; nomes originais ficam preservados.
- Backup automático dos dados antes da migração.

## Detalhes técnicos
- `types/workout.ts`: `Exercise.exerciseId?: string`; novo tipo `LibraryExercise { id, name, category: 'main'|'abdominal'|'functional', isTimeBased?, isBilateral?, createdAt }`.
- Novo `utils/exerciseLibrary.ts` (Preferences): `getAll`, `findOrCreate`, `findSimilar` (normalização + distância de Levenshtein/ tokens), `rename`, `merge(idA,idB)`, `migrate()` com flag `exercise_library_v1_migrated`, evento `exercise_library_updated`.
- Novo componente `ExercisePicker.tsx` (busca + sugestões similares + criar novo), usado em `ExerciseForm`, `AbdominalForm`, `FunctionalForm`, `AddExerciseDuringWorkout` e novo diálogo de troca no `ExerciseCard`/timers.
- `useWorkoutSession`: ação `replaceExercise(index, libraryExercise)` que reseta `setData` e troca `exerciseId`/nome; `applyPermanentChanges` casa por `exerciseId` (fallback nome).
- Agrupar por `exerciseId ?? nome normalizado` em: `Statistics.tsx` (evolução, PRs, frequência), `exerciseSuggestions.ts`, `plateauDetector.ts`, `workoutHelpers.ts`, `achievements.ts`. Nome exibido vem da biblioteca.
- `customWorkouts.ts` / IA: exercícios gerados passam por `findOrCreate`.
- Exclusão de treino não toca na biblioteca. Reset total de dados limpa a biblioteca também.
- Mantém regras: nomes em MAIÚSCULAS, peso com 3 casas, datas locais.
