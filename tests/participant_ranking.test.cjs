'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Run this test inside STRAVA_PESERTA_QA_CLEAN; never calls API or reads credentials.
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets', 'js', 'app.js'), 'utf8');
const start = source.indexOf('function renderParticipants() {');
const end = source.indexOf('// Summary values are rendered', start);
assert.ok(start !== -1 && end > start, 'Cannot isolate renderParticipants from current app.js');
const implementation = source.slice(start, end);

class Element {
  constructor(tag = 'div') { this.tag = tag; this.children = []; this.textContent = ''; this.className = ''; this.attributes = {}; }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = [...children]; }
  setAttribute(key, value) { this.attributes[key] = value; }
}
function fixture(directory, leaderboard) {
  const elements = {
    'participants-summary': new Element(),
    'participants-groups': new Element()
  };
  const context = vm.createContext({
    participantDirectory: directory,
    dashboardSummary: leaderboard === null ? null : { leaderboard },
    session: null,
    document: { createElement: tag => new Element(tag) },
    el: id => elements[id],
    node(tag, klass, text) { const e = new Element(tag); e.className = klass; if (text !== undefined) e.textContent = text; return e; },
    Intl
  });
  vm.runInContext(implementation + '\nrenderParticipants();', context);
  function group(index) {
    const section = elements['participants-groups'].children[index];
    const list = section.children.find(child => child.tag === 'ul');
    return list ? list.children.map(item => ({
      name: item.children[0]?.textContent,
      km: item.children[1]?.children[0]?.textContent,
      activities: item.children[1]?.children[1]?.textContent,
      item
    })) : [];
  }
  return { elements, group };
}
const directory = [
  { kod_peserta: 'KEV901', nama: 'MERAH A', rumah_sukan: 'MERAH' },
  { kod_peserta: 'KEV902', nama: 'MERAH B', rumah_sukan: 'MERAH' },
  { kod_peserta: 'KEV903', nama: 'MERAH C', rumah_sukan: 'MERAH' },
  { kod_peserta: 'KEV904', nama: 'BIRU A', rumah_sukan: 'BIRU' },
  { kod_peserta: 'KEV905', nama: 'BIRU B', rumah_sukan: 'BIRU' },
  { kod_peserta: 'KEV906', nama: 'BELUM RUMAH', rumah_sukan: '' }
];
function score(code, km, count) { return { kod_peserta: code, total_km: km, activity_count: count }; }

test('ranking is descending by approved KM within each house; houses remain separate', () => {
  const { group } = fixture(directory, [score('KEV901', 75.6, 12), score('KEV902', 125.5, 20), score('KEV903', 0, 0), score('KEV904', 11, 2), score('KEV905', 44, 5), score('KEV906', 0, 0)]);
  assert.deepEqual(group(0).map(x => x.name), ['MERAH B', 'MERAH A', 'MERAH C']);
  assert.deepEqual(group(1).map(x => x.name), ['BIRU B', 'BIRU A']);
  assert.deepEqual(group(4).map(x => x.name), ['BELUM RUMAH']);
});

test('renders two-decimal KM, activity count and zero activity correctly', () => {
  const { group } = fixture(directory, [score('KEV901', 125.5, 20), score('KEV902', 75.6, 12), score('KEV903', 0, 0)]);
  assert.deepEqual([group(0)[0].km, group(0)[0].activities], ['125.50 km', '20 aktiviti']);
  assert.deepEqual([group(0)[2].km, group(0)[2].activities], ['0.00 km', '0 aktiviti']);
});

test('matches scores by normalized participant code, not a duplicated name', () => {
  const people = [
    { kod_peserta: ' kev901 ', nama: 'NAMA SAMA', rumah_sukan: 'MERAH' },
    { kod_peserta: 'KEV902', nama: 'NAMA SAMA', rumah_sukan: 'MERAH' }
  ];
  const { group } = fixture(people, [score('KEV902', 5, 1), score('KEV901', 25, 3)]);
  assert.deepEqual(group(0).map(x => x.km), ['25.00 km', '5.00 km']);
});

test('unmatched directory entries stay visible and appear after matched entries', () => {
  const { group, elements } = fixture(directory, [score('KEV902', 9, 1)]);
  assert.equal(group(0).length, 3);
  assert.equal(group(0)[0].name, 'MERAH B');
  assert.equal(group(0)[1].km, undefined);
  assert.equal(group(0)[2].km, undefined);
  assert.deepEqual(elements['participants-summary'].children.map(e => e.children[1].textContent), [3, 2, 0, 0, 1]);
});

test('summary API unavailable: directory remains alphabetical with no unverified scores', () => {
  const shuffled = [directory[1], directory[2], directory[0], ...directory.slice(3)];
  const { group } = fixture(shuffled, null);
  assert.deepEqual(group(0).map(x => x.name), ['MERAH A', 'MERAH B', 'MERAH C']);
  assert.ok(group(0).every(x => x.km === undefined && x.activities === undefined));
});

test('equal KM uses alphabetical name as deterministic tie-break', () => {
  const { group } = fixture([directory[1], directory[0]], [score('KEV901', 10, 1), score('KEV902', 10, 2)]);
  assert.deepEqual(group(0).map(x => x.name), ['MERAH A', 'MERAH B']);
});
