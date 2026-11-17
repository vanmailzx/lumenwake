export function burst(particles, x, y, color, count, rng, speed = 150) {
  for (let i = 0; i < count; i++) {
    const angle = rng.next() * Math.PI * 2;
    const velocity = speed * (0.25 + rng.next() * 0.9);
    particles.push({ x, y, vx: Math.cos(angle) * velocity, vy: Math.sin(angle) * velocity, life: 0.35 + rng.next() * 0.65, max: 0.35 + rng.next() * 0.65, size: 1.5 + rng.next() * 4, color });
  }
}

export function stepParticles(particles, dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const particle = particles[i];
    particle.life -= dt;
    particle.x += particle.vx * dt; particle.y += particle.vy * dt;
    particle.vx *= 0.985; particle.vy *= 0.985;
    if (particle.life <= 0) particles.splice(i, 1);
  }
}
