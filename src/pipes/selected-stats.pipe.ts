import { Pipe, PipeTransform } from '@angular/core';
import { Stat } from '../models/player-stats.model';

@Pipe({
  name: 'selectedStats',
  standalone: true,
})
export class SelectedStatsPipe implements PipeTransform {
  transform(stats: Stat[] | undefined | null): Stat[] {
    if (!stats) {
      return [];
    }
    return stats.filter(stat => stat.selected);
  }
}
