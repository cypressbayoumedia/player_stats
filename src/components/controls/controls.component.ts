// FIX: Imported 'output' from '@angular/core'.
import { Component, ChangeDetectionStrategy, model, output, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GraphicOptions } from '../../models/player-stats.model';
import { TeamColorService, TeamColors } from '../../services/team-color.service';

@Component({
  selector: 'app-controls',
  templateUrl: './controls.component.html',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlsComponent {
  private teamColorService = inject(TeamColorService);

  options1 = model.required<GraphicOptions>();
  options2 = model.required<GraphicOptions>();
  comparisonMode = model.required<boolean>();
  favoritePlayers = model.required<string[]>();
  favoriteSelect = output<{ playerName: string, playerIndex: 1 | 2 }>();

  teamName1 = input<string | undefined>();
  teamName2 = input<string | undefined>();

  onTemplateChange(event: Event) {
    const newTemplate = (event.target as HTMLSelectElement).value as GraphicOptions['template'];
    // Update both for a unified theme when manually changed
    this.options1.update(o => ({ ...o, template: newTemplate }));
    this.options2.update(o => ({ ...o, template: newTemplate }));
  }

  onColorChange(event: Event, property: keyof GraphicOptions) {
    const newColor = (event.target as HTMLInputElement).value;
    // Update both for a unified theme when manually changed
    this.options1.update(o => ({ ...o, [property]: newColor }));
    this.options2.update(o => ({ ...o, [property]: newColor }));
  }

  onFavoriteSelect(playerName: string, playerIndex: 1 | 2) {
    this.favoriteSelect.emit({ playerName, playerIndex });
  }

  applyTeamColors(teamName: string | undefined, playerIndex: 1 | 2) {
    if (!teamName) return;
    const colors = this.teamColorService.getColors(teamName);
    if (colors) {
      const textColor = (colors.secondary === '#000000' || colors.secondary === '#101820')
        ? '#FFFFFF'
        : colors.secondary;

      const newOptionsPartial = {
          accentColor: colors.primary,
          primaryTextColor: textColor,
      };

      if (playerIndex === 1) {
        this.options1.update(o => ({ ...o, ...newOptionsPartial }));
      } else {
        this.options2.update(o => ({ ...o, ...newOptionsPartial }));
      }
    }
  }

  getTeamColors(teamName: string | undefined): TeamColors | undefined {
    if (!teamName) return;
    return this.teamColorService.getColors(teamName);
  }
}
