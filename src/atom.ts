export type Isotope = 28 | 29 | 30;
export type ParticleKind = 'Proton' | 'Neutron' | 'Electron';
export type Position = [number, number, number];
export interface Particle { id: string; kind: ParticleKind; position: Position; shell?: number }
export const ISOTOPES = [28, 29, 30] as const;
export const COLORS = { Proton: '#FF7185', Neutron: '#A78BFA', Electron: '#65D9FF' } as const;
export const SHELLS = [2, 8, 4] as const;
export const RADII = [1.12, 1.85, 2.58] as const;

// Closest-packed FCC lattice: compact, deterministic and identical across isotopes.
const lattice: Position[] = [];
for (let x = -3; x <= 3; x++) for (let y = -3; y <= 3; y++) for (let z = -3; z <= 3; z++) {
  if ((x + y + z) % 2 === 0) lattice.push([x * 0.193, y * 0.193, z * 0.193]);
}
lattice.sort((a, b) => a.reduce((s, v) => s + v * v, 0) - b.reduce((s, v) => s + v * v, 0));

export function makeParticles(isotope: Isotope): Particle[] {
  const nucleus: Particle[] = lattice.slice(0, isotope).map((position, i) => ({
    id: `nucleus-${i}`, kind: i < 28 && i % 2 === 0 ? 'Proton' : 'Neutron', position,
  }));
  return [...nucleus, ...SHELLS.flatMap((count, shell) => Array.from({ length: count }, (_, i): Particle => {
    const angle = (i / count) * Math.PI * 2 + [0.7, 0.25, 0.5][shell];
    const tilt = [0.12, -0.22, 0.16][shell];
    return { id: `electron-${shell}-${i}`, kind: 'Electron', shell: shell + 1,
      position: [Math.cos(angle) * RADII[shell], Math.sin(angle) * RADII[shell] * Math.cos(tilt), Math.sin(angle) * RADII[shell] * Math.sin(tilt)] };
  }))];
}
