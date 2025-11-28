import { Component, ChangeDetectionStrategy, signal, inject, ElementRef, QueryList, ViewChildren, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NflDataService } from './services/nfl-data.service';
import { PlayerStats, GraphicOptions, Stat } from './models/player-stats.model';
import { StatGraphicComponent } from './components/stat-graphic/stat-graphic.component';
import { ControlsComponent } from './components/controls/controls.component';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

// This is to inform TypeScript that html2canvas is loaded globally from the script tag in index.html
declare var html2canvas: any;

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

  // Player 1 State
  searchTerm1 = signal('');
  player1 = signal<PlayerStats | null>(null);
  isLoading1 = signal(false);
  error1 = signal<string | null>(null);
  isExporting1 = signal(false);
  isUploadingImage1 = signal(false);
  isSharing1 = signal(false);

  // Player 2 State
  searchTerm2 = signal('');
  player2 = signal<PlayerStats | null>(null);
  isLoading2 = signal(false);
  error2 = signal<string | null>(null);
  isExporting2 = signal(false);
  isUploadingImage2 = signal(false);
  isSharing2 = signal(false);

  // Shared State
  comparisonMode = signal(false);
  showInstructions = signal(true);
  webShareApiSupported = signal(false);
  graphicOptions = signal<GraphicOptions>({
    template: 'modern',
    backgroundColor: '#1F2937',
    primaryTextColor: '#FFFFFF',
    secondaryTextColor: '#9CA3AF',
    accentColor: '#3B82F6',
  });
  favoritePlayers = signal<string[]>([]);

  // Computed State for Favorites
  isFavorite1 = computed(() => {
    const p1 = this.player1();
    return p1 ? this.favoritePlayers().includes(p1.name) : false;
  });
  isFavorite2 = computed(() => {
    const p2 = this.player2();
    return p2 ? this.favoritePlayers().includes(p2.name) : false;
  });

  constructor() {
    // Load instructions dismissal state
    const instructionsDismissed = localStorage.getItem('nfl-stats-instructions-dismissed');
    if (instructionsDismissed === 'true') {
      this.showInstructions.set(false);
    }

    // Load saved graphic options
    const savedOptions = localStorage.getItem('nfl-stats-graphic-options');
    if (savedOptions) {
      try {
        const parsedOptions: GraphicOptions = JSON.parse(savedOptions);
        this.graphicOptions.set(parsedOptions);
      } catch (e) {
        console.error('Failed to parse graphic options from local storage', e);
        localStorage.removeItem('nfl-stats-graphic-options');
      }
    }
    
    // Load favorite players
    const savedFavorites = localStorage.getItem('nfl-stats-favorite-players');
    if (savedFavorites) {
      try {
        this.favoritePlayers.set(JSON.parse(savedFavorites));
      } catch (e) {
        console.error('Failed to parse favorite players from local storage', e);
        localStorage.removeItem('nfl-stats-favorite-players');
      }
    }

    // Effect to save favorites to local storage whenever they change
    effect(() => {
      localStorage.setItem('nfl-stats-favorite-players', JSON.stringify(this.favoritePlayers()));
    });


    // Check for Web Share API support
    if (navigator.share) {
      this.webShareApiSupported.set(true);
    }
  }

  dismissInstructions() {
    this.showInstructions.set(false);
    localStorage.setItem('nfl-stats-instructions-dismissed', 'true');
  }

  onComparisonModeChange(enabled: boolean) {
    this.comparisonMode.set(enabled);
    if (enabled && !this.player2() && this.searchTerm2()) {
      // If comparison is turned on and player 2 has no data but has a search term, fetch it.
      this.searchPlayer(2);
    } else if (!enabled) {
      // If comparison is turned off, clear player 2 data for a clean state.
      this.player2.set(null);
      this.error2.set(null);
      this.searchTerm2.set('');
    }
  }

  searchPlayer(playerIndex: 1 | 2) {
    const searchTerm = playerIndex === 1 ? this.searchTerm1() : this.searchTerm2();
    if (!searchTerm.trim()) return;

    const isLoading = playerIndex === 1 ? this.isLoading1 : this.isLoading2;
    const player = playerIndex === 1 ? this.player1 : this.player2;
    const error = playerIndex === 1 ? this.error1 : this.error2;

    isLoading.set(true);
    player.set(null);
    error.set(null);

    this.nflDataService.getPlayerStats(searchTerm)
      .pipe(finalize(() => isLoading.set(false)))
      .subscribe({
        next: (data) => {
          if (data) {
            player.set(data);
          } else {
            error.set(`Player "${searchTerm}" not found.`);
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
      this.searchPlayer(playerIndex);
  }

  updateGraphicOptions(newOptions: GraphicOptions) {
    this.graphicOptions.set(newOptions);
    localStorage.setItem('nfl-stats-graphic-options', JSON.stringify(newOptions));
  }

  onStatsChanged(newStats: Stat[], playerIndex: 1 | 2) {
    const player = playerIndex === 1 ? this.player1 : this.player2;
    player.update(p => p ? { ...p, stats: newStats } : null);
  }
  
  onStatToggle(toggledStat: Stat, playerIndex: 1 | 2) {
    const player = playerIndex === 1 ? this.player1 : this.player2;
    const currentStats = player()?.stats;
    if (currentStats) {
      const newStats = currentStats.map(stat =>
        stat.key === toggledStat.key
          ? { ...stat, selected: !stat.selected }
          : stat
      );
      this.onStatsChanged(newStats, playerIndex);
    }
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
    this.searchPlayer(playerIndex);
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