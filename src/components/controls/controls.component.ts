// FIX: Imported 'output' from '@angular/core'.
import { Component, ChangeDetectionStrategy, model, output } from '@angular/core';
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
  options = model.required<GraphicOptions>();
  comparisonMode = model.required<boolean>();
  favoritePlayers = model.required<string[]>();
  favoriteSelect = output<{ playerName: string, playerIndex: 1 | 2 }>();

  onTemplateChange(event: Event) {
    const newTemplate = (event.target as HTMLSelectElement).value as GraphicOptions['template'];
    this.options.update(o => ({ ...o, template: newTemplate }));
  }

  onColorChange(event: Event, property: keyof GraphicOptions) {
    const newColor = (event.target as HTMLInputElement).value;
    this.options.update(o => ({ ...o, [property]: newColor }));
  }

  onFavoriteSelect(playerName: string, playerIndex: 1 | 2) {
    this.favoriteSelect.emit({ playerName, playerIndex });
  }
}
