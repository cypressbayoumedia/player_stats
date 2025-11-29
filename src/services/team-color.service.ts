import { Injectable } from '@angular/core';

export interface TeamColors {
  primary: string;
  secondary: string;
}

@Injectable({
  providedIn: 'root',
})
export class TeamColorService {
  private teamColors: Map<string, TeamColors> = new Map([
    // AFC East
    ['Buffalo Bills', { primary: '#00338D', secondary: '#C60C30' }],
    ['Miami Dolphins', { primary: '#008E97', secondary: '#F26A24' }],
    ['New England Patriots', { primary: '#002244', secondary: '#C60C30' }],
    ['New York Jets', { primary: '#003F2D', secondary: '#FFFFFF' }],
    // AFC North
    ['Baltimore Ravens', { primary: '#241773', secondary: '#9E7C0C' }],
    ['Cincinnati Bengals', { primary: '#FB4F14', secondary: '#000000' }],
    ['Cleveland Browns', { primary: '#311D00', secondary: '#FF3C00' }],
    ['Pittsburgh Steelers', { primary: '#FFB612', secondary: '#101820' }],
    // AFC South
    ['Houston Texans', { primary: '#03202F', secondary: '#A71930' }],
    ['Indianapolis Colts', { primary: '#002C5F', secondary: '#A2AAAD' }],
    ['Jacksonville Jaguars', { primary: '#006778', secondary: '#D7A22A' }],
    ['Tennessee Titans', { primary: '#0C2340', secondary: '#4B92DB' }],
    // AFC West
    ['Denver Broncos', { primary: '#FB4F14', secondary: '#002244' }],
    ['Kansas City Chiefs', { primary: '#E31837', secondary: '#FFB81C' }],
    ['Las Vegas Raiders', { primary: '#000000', secondary: '#A5ACAF' }],
    ['Los Angeles Chargers', { primary: '#0080C6', secondary: '#FFC20E' }],
    // NFC East
    ['Dallas Cowboys', { primary: '#041E42', secondary: '#869397' }],
    ['New York Giants', { primary: '#0B2265', secondary: '#A71930' }],
    ['Philadelphia Eagles', { primary: '#004C54', secondary: '#A5ACAF' }],
    ['Washington Commanders', { primary: '#5A1414', secondary: '#FFB612' }],
    // NFC North
    ['Chicago Bears', { primary: '#0B162A', secondary: '#C83803' }],
    ['Detroit Lions', { primary: '#0076B6', secondary: '#B0B7BC' }],
    ['Green Bay Packers', { primary: '#203731', secondary: '#FFB612' }],
    ['Minnesota Vikings', { primary: '#4F2683', secondary: '#FFC62F' }],
    // NFC South
    ['Atlanta Falcons', { primary: '#A71930', secondary: '#000000' }],
    ['Carolina Panthers', { primary: '#0085CA', secondary: '#101820' }],
    ['New Orleans Saints', { primary: '#D3BC8D', secondary: '#101820' }],
    ['Tampa Bay Buccaneers', { primary: '#D50A0A', secondary: '#343434' }],
    // NFC West
    ['Arizona Cardinals', { primary: '#97233F', secondary: '#000000' }],
    ['Los Angeles Rams', { primary: '#003594', secondary: '#FFA300' }],
    ['San Francisco 49ers', { primary: '#AA0000', secondary: '#B3995D' }],
    ['Seattle Seahawks', { primary: '#002244', secondary: '#69BE28' }],
  ]);

  getColors(teamName: string): TeamColors | undefined {
    const teamKey = [...this.teamColors.keys()].find(key => key.includes(teamName));
    return teamKey ? this.teamColors.get(teamKey) : undefined;
  }
}
