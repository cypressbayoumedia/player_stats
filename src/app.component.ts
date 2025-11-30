import { Component, ChangeDetectionStrategy, signal, inject, ElementRef, QueryList, ViewChildren, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NflDataService } from './services/nfl-data.service';
import { PlayerStats, GraphicOptions, Stat } from './models/player-stats.model';
import { StatGraphicComponent } from './components/stat-graphic/stat-graphic.component';
import { ControlsComponent } from './components/controls/controls.component';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { GeminiService } from './services/gemini.service';

// This is to inform TypeScript that html2canvas is loaded globally from the script tag in index.html
declare var html2canvas: any;

// Constants for Local Storage Keys
const NFL_STATS_INSTRUCTIONS_DISMISSED = 'nfl-stats-instructions-dismissed';
const NFL_STATS_GRAPHIC_OPTIONS = 'nfl-stats-graphic-options'; // Legacy key for migration
const NFL_STATS_GRAPHIC_OPTIONS_1 = 'nfl-stats-graphic-options-1';
const NFL_STATS_GRAPHIC_OPTIONS_2 = 'nfl-stats-graphic-options-2';
const NFL_STATS_FAVORITE_PLAYERS = 'nfl-stats-favorite-players';

const EMPTY_PLAYER_STATS: PlayerStats = { name: '', position: '', team: '', teamLogoUrl: '', stats: [], season: '', statType: 'weekly' };

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, StatGraphicComponent, ControlsComponent],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  @ViewChildren('graphicContainer') graphicContainers!: QueryList<ElementRef>;
  @ViewChildren('fileInput') fileInputs!: QueryList<ElementRef<HTMLInputElement>>;

  private nflDataService = inject(NflDataService);
  private geminiService = inject(GeminiService);

  // Player 1 State
  searchTerm1 = signal('');
  player1 = signal<PlayerStats | null>(null);
  isLoading1 = signal(false);
  isSearchingRandom1 = signal(false);
  error1 = signal<string | null>(null);
  isExporting1 = signal(false);
  isUploadingImage1 = signal(false);
  isSharing1 = signal(false);
  latestWeek1 = signal<number | null>(null);
  statMode1 = signal<'weekly' | 'season'>('weekly');

  // Player 2 State
  searchTerm2 = signal('');
  player2 = signal<PlayerStats | null>(null);
  isLoading2 = signal(false);
  isSearchingRandom2 = signal(false);
  error2 = signal<string | null>(null);
  isExporting2 = signal(false);
  isUploadingImage2 = signal(false);
  isSharing2 = signal(false);
  latestWeek2 = signal<number | null>(null);
  statMode2 = signal<'weekly' | 'season'>('weekly');

  // Shared State
  comparisonMode = signal(false);
  showInstructions = signal(true);
  webShareApiSupported = signal(false);
  favoritePlayers = signal<string[]>([]);

  // Independent Graphic Options
  graphicOptions1 = signal<GraphicOptions>({
    template: 'modern',
    backgroundColor: '#1F2937',
    primaryTextColor: '#FFFFFF',
    secondaryTextColor: '#9CA3AF',
    accentColor: '#3B82F6',
  });
  graphicOptions2 = signal<GraphicOptions>({
    template: 'modern',
    backgroundColor: '#1F2937',
    primaryTextColor: '#FFFFFF',
    secondaryTextColor: '#9CA3AF',
    accentColor: '#3B82F6',
  });

  // Computed State for Favorites
  isFavorite1 = computed(() => {
    const p1 = this.player1();
    return p1 ? this.favoritePlayers().includes(p1.name) : false;
  });
  isFavorite2 = computed(() => {
    const p2 = this.player2();
    return p2 ? this.favoritePlayers().includes(p2.name) : false;
  });

  // Computed State for Displaying Unified Stats
  displayPlayer1 = computed<PlayerStats>(() => this.unifyStats(this.player1(), this.player2()));
  displayPlayer2 = computed<PlayerStats>(() => this.unifyStats(this.player2(), this.player1()));

  constructor() {
    // Load instructions dismissal state
    const instructionsDismissed = localStorage.getItem(NFL_STATS_INSTRUCTIONS_DISMISSED);
    if (instructionsDismissed === 'true') {
      this.showInstructions.set(false);
    }

    // --- Graphic Options Loading Logic ---
    const savedOptions1 = localStorage.getItem(NFL_STATS_GRAPHIC_OPTIONS_1);
    const savedOptions2 = localStorage.getItem(NFL_STATS_GRAPHIC_OPTIONS_2);
    const legacySavedOptions = localStorage.getItem(NFL_STATS_GRAPHIC_OPTIONS);

    // 1. Load from new keys if they exist
    if (savedOptions1) {
      try { this.graphicOptions1.set(JSON.parse(savedOptions1)); } catch (e) { console.error('Failed to parse options 1', e); }
    }
    if (savedOptions2) {
      try { this.graphicOptions2.set(JSON.parse(savedOptions2)); } catch (e) { console.error('Failed to parse options 2', e); }
    }

    // 2. If new keys don't exist, try migrating from legacy key
    if (!savedOptions1 && !savedOptions2 && legacySavedOptions) {
      console.log('Migrating legacy graphic options...');
      try {
        const parsedOptions: GraphicOptions = JSON.parse(legacySavedOptions);
        this.graphicOptions1.set(parsedOptions);
        this.graphicOptions2.set(parsedOptions); // Set both to the legacy value
        localStorage.removeItem(NFL_STATS_GRAPHIC_OPTIONS); // Remove old key after successful migration
      } catch (e) {
        console.error('Failed to parse legacy options', e);
        localStorage.removeItem(NFL_STATS_GRAPHIC_OPTIONS);
      }
    }
    
    // Load favorite players
    const savedFavorites = localStorage.getItem(NFL_STATS_FAVORITE_PLAYERS);
    if (savedFavorites) {
      try {
        this.favoritePlayers.set(JSON.parse(savedFavorites));
      } catch (e) {
        console.error('Failed to parse favorite players from local storage', e);
        localStorage.removeItem(NFL_STATS_FAVORITE_PLAYERS);
      }
    }

    // Effect to save favorites to local storage whenever they change
    effect(() => {
      localStorage.setItem(NFL_STATS_FAVORITE_PLAYERS, JSON.stringify(this.favoritePlayers()));
    });

    // Effect to save graphic options to local storage whenever they change
    effect(() => {
      localStorage.setItem(NFL_STATS_GRAPHIC_OPTIONS_1, JSON.stringify(this.graphicOptions1()));
      localStorage.setItem(NFL_STATS_GRAPHIC_OPTIONS_2, JSON.stringify(this.graphicOptions2()));
    });

    // Effect to handle logic when comparison mode changes
    effect(() => {
      const enabled = this.comparisonMode();
      if (!enabled) {
        this.player2.set(null);
        this.error2.set(null);
        this.searchTerm2.set('');
      }
    });


    // Check for Web Share API support
    if (navigator.share) {
      this.webShareApiSupported.set(true);
    }
  }

  private unifyStats(mainPlayer: PlayerStats | null, comparePlayer: PlayerStats | null): PlayerStats {
    if (!mainPlayer) {
      return EMPTY_PLAYER_STATS;
    }
    
    // If not in comparison mode, or players are different positions, or other player doesn't exist, return main player as is.
    if (!this.comparisonMode() || !comparePlayer || mainPlayer.position !== comparePlayer.position) {
      return mainPlayer;
    }

    // Logic to unify stats for same-position players
    const allStatKeys = new Set([...mainPlayer.stats.map(s => s.key), ...comparePlayer.stats.map(s => s.key)]);
    const mainPlayerStatMap = new Map(mainPlayer.stats.map(s => [s.key, s]));

    const unifiedStats: Stat[] = Array.from(allStatKeys).map(key => {
      const existingStat = mainPlayerStatMap.get(key);
      if (existingStat) {
        return existingStat;
      }
      // If the main player doesn't have this stat, add it with 'N/A'
      return { key, value: 'N/A', selected: true, isHighlighted: false };
    });
    
    return { ...mainPlayer, stats: unifiedStats };
  }

  dismissInstructions() {
    this.showInstructions.set(false);
    localStorage.setItem(NFL_STATS_INSTRUCTIONS_DISMISSED, 'true');
  }

  async searchRandomPlayer(playerIndex: 1 | 2) {
    const isSearchingRandom = playerIndex === 1 ? this.isSearchingRandom1 : this.isSearchingRandom2;
    const searchTerm = playerIndex === 1 ? this.searchTerm1 : this.searchTerm2;
    
    isSearchingRandom.set(true);
    try {
      const randomName = await this.geminiService.getRandomPlayerName();
      searchTerm.set(randomName);
      this.searchPlayer(playerIndex, { freshSearch: true });
    } catch (e) {
      const error = playerIndex === 1 ? this.error1 : this.error2;
      error.set('Could not fetch a random player.');
      console.error(e);
    } finally {
      isSearchingRandom.set(false);
    }
  }

  searchPlayer(playerIndex: 1 | 2, options: { freshSearch: boolean, week?: number }) {
    const { freshSearch, week } = options;
    const searchTerm = playerIndex === 1 ? this.searchTerm1() : this.searchTerm2();
    if (!searchTerm.trim()) return;

    const isLoading = playerIndex === 1 ? this.isLoading1 : this.isLoading2;
    const player = playerIndex === 1 ? this.player1 : this.player2;
    const error = playerIndex === 1 ? this.error1 : this.error2;
    const latestWeek = playerIndex === 1 ? this.latestWeek1 : this.latestWeek2;
    const statMode = playerIndex === 1 ? this.statMode1() : this.statMode2();

    if (freshSearch) {
      latestWeek.set(null);
    }

    isLoading.set(true);
    player.set(null);
    error.set(null);

    this.nflDataService.getPlayerStats(searchTerm, statMode, week)
      .pipe(finalize(() => isLoading.set(false)))
      .subscribe({
        next: (data) => {
          if (data) {
            player.set(data);
            if (data.statType === 'weekly' && data.gameWeek && freshSearch) {
              latestWeek.set(data.gameWeek);
            }
          } else {
            error.set(`Stats for "${searchTerm}" not found${statMode === 'weekly' && week ? ` for week ${week}`: ''}.`);
          }
        },
        error: (err) => {
          console.error(err);
          error.set('An error occurred while fetching data.');
        }
      });
  }

  handleSearch(event: Event, playerIndex: 1 | 2) {
      event.preventDefault();
      this.searchPlayer(playerIndex, { freshSearch: true });
  }

  changeWeek(playerIndex: 1 | 2, direction: 'prev' | 'next') {
    const player = playerIndex === 1 ? this.player1() : this.player2();
    const statMode = playerIndex === 1 ? this.statMode1() : this.statMode2();

    if (!player || statMode !== 'weekly' || player.gameWeek === undefined) return;

    const currentWeek = player.gameWeek;
    const newWeek = direction === 'prev' ? currentWeek - 1 : currentWeek + 1;

    if (newWeek > 0) {
      this.searchPlayer(playerIndex, { freshSearch: false, week: newWeek });
    }
  }

  setStatMode(playerIndex: 1 | 2, mode: 'weekly' | 'season') {
    const statModeSignal = playerIndex === 1 ? this.statMode1 : this.statMode2;
    const playerSignal = playerIndex === 1 ? this.player1 : this.player2;

    statModeSignal.set(mode);

    if (playerSignal()) {
      this.searchPlayer(playerIndex, { freshSearch: true });
    }
  }
  
  onStatToggle(toggledStat: Stat, playerIndex: 1 | 2) {
    const player = playerIndex === 1 ? this.player1 : this.player2;
    player.update(p => {
        if (!p) return null;
        const newStats = p.stats.map(stat =>
            stat.key === toggledStat.key
            ? { ...stat, selected: !stat.selected }
            : stat
        );
        return { ...p, stats: newStats };
    });
  }

  onStatHighlight(highlightedStat: Stat, playerIndex: 1 | 2) {
    const player = playerIndex === 1 ? this.player1 : this.player2;
    player.update(p => {
        if (!p) return null;
        const newStats = p.stats.map(stat =>
            stat.key === highlightedStat.key
            ? { ...stat, isHighlighted: !stat.isHighlighted }
            : stat
        );
        return { ...p, stats: newStats };
    });
  }

  toggleFavorite(playerIndex: 1 | 2) {
    const player = playerIndex === 1 ? this.player1() : this.player2();
    if (!player) return;

    const playerName = player.name;
    this.favoritePlayers.update(favorites => {
      if (favorites.includes(playerName)) {
        return favorites.filter(name => name !== playerName);
      } else {
        return [...favorites, playerName].sort();
      }
    });
  }

  selectFavorite({ playerName, playerIndex }: { playerName: string, playerIndex: 1 | 2 }) {
    if (playerIndex === 1) {
      this.searchTerm1.set(playerName);
    } else {
      this.searchTerm2.set(playerName);
    }
    this.searchPlayer(playerIndex, { freshSearch: true });
  }

  triggerFileUpload(playerIndex: 1 | 2) {
    this.fileInputs.get(playerIndex - 1)?.nativeElement.click();
  }

  onFileSelected(event: Event, playerIndex: 1 | 2) {
    const input = event.target as HTMLInputElement;
    const player = playerIndex === 1 ? this.player1 : this.player2;
    const isUploading = playerIndex === 1 ? this.isUploadingImage1 : this.isUploadingImage2;
    const error = playerIndex === 1 ? this.error1 : this.error2;

    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      
      isUploading.set(true);
      error.set(null);

      reader.onload = () => {
        player.update(p => p ? { ...p, playerImageUrl: reader.result as string } : null);
        isUploading.set(false);
      };
      reader.onerror = () => {
        error.set('Failed to read image file.');
        isUploading.set(false);
      }
      reader.readAsDataURL(file);
    }
  }

  async exportGraphic(playerIndex: 1 | 2) {
    const isExporting = playerIndex === 1 ? this.isExporting1 : this.isExporting2;
    const player = playerIndex === 1 ? this.player1() : this.player2();
    const error = playerIndex === 1 ? this.error1 : this.error2;
    const element = this.graphicContainers.get(playerIndex - 1)?.nativeElement;

    if (!element || isExporting()) return;
    
    isExporting.set(true);
    error.set(null);

    try {
      const canvas = await html2canvas(element, { 
        useCORS: true, 
        backgroundColor: null,
        scale: 2
      });
      const link = document.createElement('a');
      link.download = `${player?.name.replace(/\s+/g, '_')}_stats.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Error exporting graphic:', e);
      error.set('Could not export graphic. See console for details.');
    } finally {
      isExporting.set(false);
    }
  }

  async shareGraphic(playerIndex: 1 | 2) {
    const isSharing = playerIndex === 1 ? this.isSharing1 : this.isSharing2;
    const player = playerIndex === 1 ? this.player1() : this.player2();
    const error = playerIndex === 1 ? this.error1 : this.error2;
    const element = this.graphicContainers.get(playerIndex - 1)?.nativeElement;

    if (!element || isSharing() || !this.webShareApiSupported()) {
      if (!this.webShareApiSupported()) {
        error.set('Share API not supported on this browser.');
      }
      return;
    }
    
    isSharing.set(true);
    error.set(null);

    try {
      const canvas = await html2canvas(element, { 
        useCORS: true, 
        backgroundColor: null,
        scale: 2 
      });
      
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      
      if (blob) {
        const file = new File([blob], `${player?.name.replace(/\s+/g, '_')}_stats.png`, { type: 'image/png' });
        await navigator.share({
          title: `${player?.name} | NFL Stats Graphic`,
          text: `Check out ${player?.name}'s latest game stats!`,
          files: [file],
        });
      } else {
        throw new Error('Failed to create image blob.');
      }

    } catch (e) {
      // Don't show an error if the user cancelled the share dialog
      if (e instanceof Error && e.name !== 'AbortError') {
        console.error('Error sharing graphic:', e);
        error.set('Could not share graphic. See console for details.');
      }
    } finally {
      isSharing.set(false);
    }
  }
}