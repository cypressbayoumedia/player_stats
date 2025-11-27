import { Injectable, inject } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PlayerStats } from '../models/player-stats.model';
import { GeminiService } from './gemini.service';
import { TeamLogoService } from './team-logo.service';

@Injectable({
  providedIn: 'root',
})
export class NflDataService {
  private geminiService = inject(GeminiService);
  private teamLogoService = inject(TeamLogoService);

  getPlayerStats(name: string): Observable<PlayerStats | null> {
    if (!name.trim()) {
      return of(null);
    }
    // Convert promise from GeminiService to an observable
    return from(this.geminiService.getPlayerStats(name)).pipe(
      map(player => {
        if (player) {
          player.teamLogoUrl = this.teamLogoService.getLogoUrl(player.team);
        }
        return player;
      }),
      catchError(error => {
        console.error('Failed to get player stats:', error);
        return of(null); // Return null on error to be handled by the component
      })
    );
  }
}
