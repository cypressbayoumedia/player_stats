


import { Component, ChangeDetectionStrategy, input, signal, effect } from '@angular/core';
import { CommonModule, KeyValuePipe } from '@angular/common';
import { PlayerStats, GraphicOptions } from '../../models/player-stats.model';
import { SelectedStatsPipe } from '../../pipes/selected-stats.pipe';

@Component({
  selector: 'app-stat-graphic',
  templateUrl: './stat-graphic.component.html',
  standalone: true,
  imports: [CommonModule, KeyValuePipe, SelectedStatsPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatGraphicComponent {
  player = input.required<PlayerStats>();
  options = input.required<GraphicOptions>();

  playerImageError = signal(false);
  teamLogoError = signal(false);

  constructor() {
    effect(() => {
      // When the player input changes, reset the image error flags.
      this.player();
      this.playerImageError.set(false);
      this.teamLogoError.set(false);
    });
  }
}