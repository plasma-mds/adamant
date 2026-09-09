import { describe, it, expect } from 'vitest';
import { filterSchemaOptions } from '../../pages/AdamantMain';

const buildOptions = () => [
  { id: 'local:dem34.json', group: 'Default', label: 'dem34.json', source: 'local' },
  { id: 'local:other.json', group: 'Default', label: 'other.json', source: 'local' },
  { id: 'nc:demo_sch_45.json', group: 'NextCloud', label: 'demo_sch_45.json', source: 'nextcloud' },
  { id: 'action:nextcloud', group: 'NextCloud', label: 'Browse NextCloud...', source: 'action-nextcloud', isAction: true },
  { id: 'elab:demo_01.json', group: 'eLabFTW', label: 'demo_01.json', source: 'elab' },
  { id: 'action:elab', group: 'eLabFTW', label: 'Browse eLabFTW...', source: 'action-elab', isAction: true },
  { id: 'action:local', group: 'Browse', label: 'Browse local file...', source: 'action-local', isAction: true },
];

const filterState = (inputValue) => ({ inputValue, getOptionLabel: (option) => option.label });

describe('filterSchemaOptions', () => {
  it('keeps each group contiguous and in Default -> NextCloud -> eLabFTW -> Browse order', () => {
    const result = filterSchemaOptions(buildOptions(), filterState(''));
    expect(result.map((o) => o.group)).toEqual([
      'Default', 'Default', 'NextCloud', 'NextCloud', 'eLabFTW', 'eLabFTW', 'Browse',
    ]);
  });

  it('filters real entries by the typed text across all three sources simultaneously', () => {
    const result = filterSchemaOptions(buildOptions(), filterState('dem'));
    const labels = result.map((o) => o.label);
    expect(labels).toContain('dem34.json');
    expect(labels).toContain('demo_sch_45.json');
    expect(labels).toContain('demo_01.json');
    expect(labels).not.toContain('other.json');
  });

  it('keeps each group\'s "Browse..." action visible even when the typed text matches nothing real in that group', () => {
    const result = filterSchemaOptions(buildOptions(), filterState('zzz-no-match'));
    const actionLabels = result.filter((o) => o.isAction).map((o) => o.label);
    expect(actionLabels).toEqual([
      'Browse NextCloud...', 'Browse eLabFTW...', 'Browse local file...',
    ]);
    expect(result.some((o) => o.source === 'local' || o.source === 'nextcloud' || o.source === 'elab')).toBe(false);
  });
});
