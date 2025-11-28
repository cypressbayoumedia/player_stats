import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GraphicOptions } from '../../models/player-stats.model';

@Component({
  selector: 'app-controls',
  templateUrl: './controls.component.html',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlsComponent {
  options = input.required<GraphicOptions>();
  optionsChange = output<GraphicOptions>();
  comparisonMode = input.required<boolean>();
  comparisonModeChange = output<boolean>();
  favoritePlayers = input.required<string[]>();
  favoriteSelect = output<{ playerName: string, playerIndex: 1 | 2 }>();


  onComparisonToggle(event: Event) {
    this.comparisonModeChange.emit((event.target as HTMLInputElement).checked);
  }

  onTemplateChange(event: Event) {
    const newTemplate = (event.target as HTMLSelectElement).value as GraphicOptions['template'];
    this.optionsChange.emit({ ...this.options(), template: newTemplate });
  }

  onColorChange(event: Event, property: keyof GraphicOptions) {
    const newColor = (event.target as HTMLInputElement).value;
    this.optionsChange.emit({ ...this.options(), [property]: newColor });
  }

  onFavoriteSelect(playerName: string, playerIndex: 1 | 2) {
    this.favoriteSelect.emit({ playerName, playerIndex });
  }
}
