export interface Stat {
  key: string;
  value: string | number;
  selected: boolean;
}

export interface PlayerStats {
  name: string;
  position: string;
  team: string;
  teamLogoUrl: string;
  playerImageUrl: string;
  stats: Stat[];
  opponent: string;
}

export interface GraphicOptions {
  template: 'modern' | 'classic' | 'vintage';
  backgroundColor: string;
  primaryTextColor: string;
  secondaryTextColor: string;
  accentColor: string;
}