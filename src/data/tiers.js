export const DIFFICULTY_TIERS = Object.freeze([
  { id: 'very-easy', name: 'Very Easy', firstLevel: 1, lastLevel: 10, size: 3 },
  { id: 'easy', name: 'Easy', firstLevel: 11, lastLevel: 20, size: 4 },
  { id: 'medium', name: 'Medium', firstLevel: 21, lastLevel: 40, size: 5 },
  { id: 'hard', name: 'Hard', firstLevel: 41, lastLevel: 60, size: 6 },
  { id: 'very-hard', name: 'Very Hard', firstLevel: 61, lastLevel: 80, size: 7 },
  { id: 'expert', name: 'Expert', firstLevel: 81, lastLevel: 100, size: 8 },
]);

export function getTierForLevel(levelId) {
  return (
    DIFFICULTY_TIERS.find((tier) => levelId >= tier.firstLevel && levelId <= tier.lastLevel) ??
    DIFFICULTY_TIERS[DIFFICULTY_TIERS.length - 1]
  );
}
