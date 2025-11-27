import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TeamLogoService {
  private teamLogos: Map<string, string> = new Map([
    // AFC East
    ['Buffalo Bills', 'https://a.espncdn.com/i/teamlogos/nfl/500/buf.png'],
    ['Miami Dolphins', 'https://a.espncdn.com/i/teamlogos/nfl/500/mia.png'],
    ['New England Patriots', 'https://a.espncdn.com/i/teamlogos/nfl/500/ne.png'],
    ['New York Jets', 'https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png'],
    // AFC North
    ['Baltimore Ravens', 'https://a.espncdn.com/i/teamlogos/nfl/500/bal.png'],
    ['Cincinnati Bengals', 'https://a.espncdn.com/i/teamlogos/nfl/500/cin.png'],
    ['Cleveland Browns', 'https://a.espncdn.com/i/teamlogos/nfl/500/cle.png'],
    ['Pittsburgh Steelers', 'https://a.espncdn.com/i/teamlogos/nfl/500/pit.png'],
    // AFC South
    ['Houston Texans', 'https://a.espncdn.com/i/teamlogos/nfl/500/hou.png'],
    ['Indianapolis Colts', 'https://a.espncdn.com/i/teamlogos/nfl/500/ind.png'],
    ['Jacksonville Jaguars', 'https://a.espncdn.com/i/teamlogos/nfl/500/jax.png'],
    ['Tennessee Titans', 'https://a.espncdn.com/i/teamlogos/nfl/500/ten.png'],
    // AFC West
    ['Denver Broncos', 'https://a.espncdn.com/i/teamlogos/nfl/500/den.png'],
    ['Kansas City Chiefs', 'https://a.espncdn.com/i/teamlogos/nfl/500/kc.png'],
    ['Las Vegas Raiders', 'https://a.espncdn.com/i/teamlogos/nfl/500/lv.png'],
    ['Los Angeles Chargers', 'https://a.espncdn.com/i/teamlogos/nfl/500/lac.png'],
    // NFC East
    ['Dallas Cowboys', 'https://a.espncdn.com/i/teamlogos/nfl/500/dal.png'],
    ['New York Giants', 'https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png'],
    ['Philadelphia Eagles', 'https://a.espncdn.com/i/teamlogos/nfl/500/phi.png'],
    ['Washington Commanders', 'https://a.espncdn.com/i/teamlogos/nfl/500/wsh.png'],
    // NFC North
    ['Chicago Bears', 'https://a.espncdn.com/i/teamlogos/nfl/500/chi.png'],
    ['Detroit Lions', 'https://a.espncdn.com/i/teamlogos/nfl/500/det.png'],
    ['Green Bay Packers', 'https://a.espncdn.com/i/teamlogos/nfl/500/gb.png'],
    ['Minnesota Vikings', 'https://a.espncdn.com/i/teamlogos/nfl/500/min.png'],
    // NFC South
    ['Atlanta Falcons', 'https://a.espncdn.com/i/teamlogos/nfl/500/atl.png'],
    ['Carolina Panthers', 'https://a.espncdn.com/i/teamlogos/nfl/500/car.png'],
    ['New Orleans Saints', 'https://a.espncdn.com/i/teamlogos/nfl/500/no.png'],
    ['Tampa Bay Buccaneers', 'https://a.espncdn.com/i/teamlogos/nfl/500/tb.png'],
    // NFC West
    ['Arizona Cardinals', 'https://a.espncdn.com/i/teamlogos/nfl/500/ari.png'],
    ['Los Angeles Rams', 'https://a.espncdn.com/i/teamlogos/nfl/500/lar.png'],
    ['San Francisco 49ers', 'https://a.espncdn.com/i/teamlogos/nfl/500/sf.png'],
    ['Seattle Seahawks', 'https://a.espncdn.com/i/teamlogos/nfl/500/sea.png'],
  ]);

  private fallbackLogo = 'https://a.espncdn.com/i/teamlogos/nfl/500/nfl.png';

  getLogoUrl(teamName: string): string {
    // Find the key that includes the team name. Handles cases like "New Orleans Saints" vs "Saints".
    const teamKey = [...this.teamLogos.keys()].find(key => key.includes(teamName));
    return teamKey ? this.teamLogos.get(teamKey) ?? this.fallbackLogo : this.fallbackLogo;
  }
}