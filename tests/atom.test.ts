import assert from 'node:assert/strict';
import { makeParticles, ISOTOPES, SHELLS } from '../src/atom.ts';
for(const isotope of ISOTOPES) {
  const particles=makeParticles(isotope);
  assert.equal(particles.filter(p=>p.kind==='Proton').length,14);
  assert.equal(particles.filter(p=>p.kind==='Neutron').length,isotope-14);
  assert.equal(particles.filter(p=>p.kind==='Electron').length,14);
  assert.equal(new Set(particles.map(p=>p.id)).size,particles.length);
  for(let shell=1;shell<=3;shell++)assert.equal(particles.filter(p=>p.shell===shell).length,SHELLS[shell-1]);
  assert.ok(particles.every(p=>p.position.every(Number.isFinite)));
}
assert.deepEqual(makeParticles(28).filter(p=>p.kind!=='Electron'),makeParticles(30).filter(p=>p.kind!=='Electron').slice(0,28));
console.log('PASS: all isotope counts, shells, IDs, coordinates and stable nucleus positions.');
