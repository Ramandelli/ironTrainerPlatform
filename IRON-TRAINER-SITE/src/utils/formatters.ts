/**
 * Formata peso com 3 casas decimais
 * @param weight - Peso em kg
 * @returns String formatada como "X,XXX kg"
 */
export const formatWeight = (weight: number | undefined): string => {
  if (weight === undefined || weight === null) return '0,000';
  return weight.toFixed(3).replace('.', ',');
};

/**
 * Formata peso para exibição compacta (remove zeros à direita desnecessários)
 * @param weight - Peso em kg
 * @returns String formatada
 */
export const formatWeightCompact = (weight: number | undefined): string => {
  if (weight === undefined || weight === null) return '0';
  // Se for inteiro, mostra sem decimais
  if (Number.isInteger(weight)) return weight.toString();
  // Caso contrário, mostra até 3 decimais sem zeros à direita
  return parseFloat(weight.toFixed(3)).toString().replace('.', ',');
};
