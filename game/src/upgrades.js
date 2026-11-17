export const UPGRADES = [
  { id: 'rapid', name: 'Rapid Bloom', text: 'Fire 28% faster', icon: '✦', color: '#ffcf79' },
  { id: 'split', name: 'Split Prism', text: 'Twin side projectiles', icon: '⑂', color: '#74f4df' },
  { id: 'drone', name: 'Echo Drone', text: 'Orbiting ally fires', icon: '◉', color: '#b59cff' },
  { id: 'lure', name: 'Lure Light', text: 'Pull nearby motes', icon: '⌘', color: '#ff9fd8' },
  { id: 'dash', name: 'Dash Veil', text: 'Dash releases a shockwave', icon: '〰', color: '#8d77ff' },
  { id: 'pierce', name: 'Piercing Rays', text: 'Shots pass through foes', icon: '↠', color: '#75e8ff' },
  { id: 'vitality', name: 'Vitality Bloom', text: '+1 maximum heart, heal 1', icon: '♥', color: '#ff758e' },
  { id: 'overflow', name: 'Overflow Cascade', text: 'Larger, stronger blasts', icon: '✺', color: '#ffd28a' },
];

export function offerUpgrades(world) {
  const available = UPGRADES.filter(item => !world.upgrades[item.id] || ['rapid', 'split', 'pierce', 'overflow'].includes(item.id));
  const pool = [...available];
  world.upgradeChoices = [];
  while (world.upgradeChoices.length < 3 && pool.length) world.upgradeChoices.push(pool.splice(Math.floor(world.rng.next() * pool.length), 1)[0]);
  world.status = 'upgrade';
}

export function applyUpgrade(world, id) {
  const upgrade = UPGRADES.find(item => item.id === id);
  if (!upgrade) return;
  world.upgrades[id] = (world.upgrades[id] || 0) + 1;
  if (id === 'vitality') { world.player.maxHp++; world.player.hp = Math.min(world.player.maxHp, world.player.hp + 1); }
}
