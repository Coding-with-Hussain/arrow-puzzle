#!/usr/bin/env node
import { levels } from '../src/data/levels.js';
import { DIFFICULTY_TIERS } from '../src/data/tiers.js';
import { analyzeLevel } from '../src/game/solver.js';
import { validateLevels } from '../src/game/validator.js';

const { valid, invalidLevels } = validateLevels(levels);

for (const { id, errors } of invalidLevels) {
  console.error(`✗ Level ${id}`);
  errors.forEach((error) => console.error(`    ${error}`));
}

for (const tier of DIFFICULTY_TIERS) {
  const tierLevels = levels.slice(tier.firstLevel - 1, tier.lastLevel);
  const wrongSize = tierLevels.filter((level) => level.size !== tier.size).map((level) => level.id);
  if (wrongSize.length > 0) {
    console.error(`✗ ${tier.name} levels ${wrongSize.join(', ')} are not ${tier.size}×${tier.size}`);
  }
  const metrics = tierLevels.map(analyzeLevel);
  const range = (key) => `${Math.min(...metrics.map((m) => m[key]))}–${Math.max(...metrics.map((m) => m[key]))}`;
  console.log(
    `${tier.name.padEnd(10)} ${tier.size}×${tier.size}  levels ${tier.firstLevel}–${tier.lastLevel}  ` +
      `arrows ${range('arrowCount')}  depth ${range('depth')}`,
  );
}

if (!valid) {
  console.error(`\n${invalidLevels.length} invalid level(s).`);
  process.exit(1);
}
console.log(`\n✓ All ${levels.length} levels are valid and solvable.`);
