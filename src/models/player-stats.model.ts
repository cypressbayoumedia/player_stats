export interface Stat {
  key: string;
  value: string | number;
  selected: boolean;
  isHighlighted?: boolean;
}

export interface PlayerStats {
  name: string;
  position: string;
  team: string;
  teamLogoUrl: string;
  playerImageUrl?: string; // Made optional
  stats: Stat[];
  season: string;
  statType: 'weekly' | 'season';
  // Weekly-specific stats
  opponent?: string;
  gameWeek?: number;
  didStart?: boolean;
}

export interface GraphicOptions {
  template: 'modern' | 'classic' | 'vintage' | 'spotlight' | 'newspaper' | 'team-first';
  backgroundColor: string;
  primaryTextColor: string;
  secondaryTextColor: string;
  accentColor: string;
}