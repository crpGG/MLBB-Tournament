import {
  Match,
  Player,
  StandingRow,
  Tournament,
  TournamentRegistration,
} from '../types/tournament';

export const MLBB_HEROES = [
  'Fanny', 'Ling', 'Hayabusa', 'Joy', 'Nolan', 'Suyou', 'Fredrinn', 'Baxia',
  'Arlott', 'Yu Zhong', 'Terizla', 'Edith', 'Paquito', 'Phoveus', 'Chou', 'Ruby',
  'Valentina', 'Yve', 'Pharsa', 'Novaria', 'Faramis', 'Lylia', 'Zhuxin', 'Aurora',
  'Claude', 'Karrie', 'Beatrix', 'Harith', 'Roger', 'Moskov', 'Brody', 'Wanwan',
  'Mathilda', 'Minotaur', 'Tigreal', 'Khufra', 'Angela', 'Chip', 'Hylos', 'Gatotkaca',
];

export function formatIndonesianDate(isoDate: string): string {
  if (!isoDate) return '-';
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(monthIdx) || monthIdx < 0 || monthIdx > 11) return isoDate;
  return `${day} ${months[monthIdx]} ${year}`;
}

export function getDisplayTeamName(
  reg: TournamentRegistration | undefined,
  allRegsForTournament?: TournamentRegistration[]
): string {
  if (!reg) return 'TBD';
  if (!allRegsForTournament) {
    return reg.slotIndex > 1 ? `${reg.teamName} #${reg.slotIndex}` : reg.teamName;
  }
  const sameTeamCount = allRegsForTournament.filter(
    (r) => r.teamId === reg.teamId && r.status === 'approved'
  ).length;
  if (sameTeamCount > 1 || reg.slotIndex > 1) {
    return `${reg.teamName} #${reg.slotIndex}`;
  }
  return reg.teamName;
}

/**
 * Generates matches for Single Elimination, Double Elimination,
 * Single Round-Robin, or Double Round-Robin.
 */
export function generateTournamentMatches(
  tournament: Tournament,
  approvedRegistrations: TournamentRegistration[]
): Match[] {
  const regs = [...approvedRegistrations];
  if (regs.length < 2) return [];

  const format = tournament.bracketFormat;
  if (format === 'single_elimination') {
    return generateSingleElimination(tournament, regs);
  }
  if (format === 'double_elimination') {
    return generateDoubleElimination(tournament, regs);
  }
  if (format === 'single_round_robin') {
    return generateRoundRobin(tournament, regs, false);
  }
  return generateRoundRobin(tournament, regs, true);
}

/** Maksimal tim per format. DE masih bracket 4 tim tetap (lihat generateDoubleElimination). */
export function bracketCapacity(format: Tournament['bracketFormat']): number {
  if (format === 'single_elimination') return 32;
  if (format === 'double_elimination') return 4;
  return 64;
}

// Urutan seed standar: seed 1 vs terakhir, dst. Slot kosong (bye) jatuh ke seed teratas.
function seedOrder(size: number): number[] {
  let s = [0];
  while (s.length < size) {
    const m = s.length * 2;
    s = s.flatMap((x) => [x, m - 1 - x]);
  }
  return s;
}

function generateSingleElimination(
  tournament: Tournament,
  regs: TournamentRegistration[]
): Match[] {
  const cap = bracketCapacity('single_elimination');
  const list = regs.slice(0, cap);
  const size = Math.max(4, 2 ** Math.ceil(Math.log2(list.length)));
  const slots = seedOrder(size).map((i) => list[i] ?? null);
  const rounds = Math.log2(size);
  const prefix = `m-${tournament.id}`;
  const idOf = (r: number, i: number) => (r === rounds ? `${prefix}-gf` : `${prefix}-r${r}m${i + 1}`);
  const nameOf = (r: number, i: number) =>
    r === rounds
      ? 'Grand Final'
      : r === rounds - 1
      ? `Semifinal ${i + 1}`
      : r === rounds - 2
      ? `Perempat Final ${i + 1}`
      : `Babak ${size / 2 ** (r - 1)} Besar ${i + 1}`;
  const bestOf = (r: number): Match['bestOf'] =>
    r === rounds ? 5 : r === rounds - 1 && tournament.defaultBestOf === 1 ? 3 : tournament.defaultBestOf;

  const matches: Match[] = [];
  let order = 1;
  for (let r = 1; r <= rounds; r++) {
    const count = size / 2 ** r;
    for (let i = 0; i < count; i++) {
      const first = r === 1;
      matches.push({
        id: idOf(r, i),
        tournamentId: tournament.id,
        stage: r === rounds ? 'grand_final' : 'upper',
        roundNumber: r,
        roundName: nameOf(r, i),
        matchOrder: order,
        teamARegistrationId: first ? slots[i * 2]?.id ?? null : null,
        teamBRegistrationId: first ? slots[i * 2 + 1]?.id ?? null : null,
        scoreA: 0,
        scoreB: 0,
        bestOf: bestOf(r),
        scheduledDate: tournament.matchDayDate,
        scheduledTime: `${String(12 + ((order - 1) % 10)).padStart(2, '0')}:00 WIB`,
        roomName: r === rounds ? 'Main Stage Stream' : `Room Custom #${order}`,
        status: 'scheduled',
        winnerRegistrationId: null,
        ...(r < rounds ? { nextWinnerMatchId: idOf(r + 1, Math.floor(i / 2)), nextWinnerSlot: (i % 2 === 0 ? 'A' : 'B') as 'A' | 'B' } : {}),
        playerStats: [],
      });
      order++;
    }
  }
  return autoAdvanceByes(matches);
}

function generateDoubleElimination(
  tournament: Tournament,
  regs: TournamentRegistration[]
): Match[] {
  // shortcut: bracket DE hanya 4 tim; upgrade ke generator generik bila butuh 8+ tim.
  if (regs.length < 4) return [];
  const padded: (TournamentRegistration | null)[] = [...regs.slice(0, 4)];
  while (padded.length < 4) padded.push(null);

  const prefix = `m-${tournament.id}`;
  const ub1Id = `${prefix}-ub1`;
  const ub2Id = `${prefix}-ub2`;
  const ubfId = `${prefix}-ubf`;
  const lb1Id = `${prefix}-lb1`;
  const lbfId = `${prefix}-lbf`;
  const gfId = `${prefix}-gf`;

  const matches: Match[] = [
    {
      id: ub1Id,
      tournamentId: tournament.id,
      stage: 'upper',
      roundNumber: 1,
      roundName: 'Upper Semifinal 1',
      matchOrder: 1,
      teamARegistrationId: padded[0]?.id ?? null,
      teamBRegistrationId: padded[3]?.id ?? null,
      scoreA: 0,
      scoreB: 0,
      bestOf: tournament.defaultBestOf,
      scheduledDate: tournament.matchDayDate,
      scheduledTime: '13:00 WIB',
      roomName: 'Upper Room #1',
      status: 'scheduled',
      winnerRegistrationId: null,
      nextWinnerMatchId: ubfId,
      nextWinnerSlot: 'A',
      nextLoserMatchId: lb1Id,
      nextLoserSlot: 'A',
      playerStats: [],
    },
    {
      id: ub2Id,
      tournamentId: tournament.id,
      stage: 'upper',
      roundNumber: 1,
      roundName: 'Upper Semifinal 2',
      matchOrder: 2,
      teamARegistrationId: padded[1]?.id ?? null,
      teamBRegistrationId: padded[2]?.id ?? null,
      scoreA: 0,
      scoreB: 0,
      bestOf: tournament.defaultBestOf,
      scheduledDate: tournament.matchDayDate,
      scheduledTime: '14:15 WIB',
      roomName: 'Upper Room #2',
      status: 'scheduled',
      winnerRegistrationId: null,
      nextWinnerMatchId: ubfId,
      nextWinnerSlot: 'B',
      nextLoserMatchId: lb1Id,
      nextLoserSlot: 'B',
      playerStats: [],
    },
    {
      id: lb1Id,
      tournamentId: tournament.id,
      stage: 'lower',
      roundNumber: 1,
      roundName: 'Lower Bracket R1',
      matchOrder: 3,
      teamARegistrationId: null,
      teamBRegistrationId: null,
      scoreA: 0,
      scoreB: 0,
      bestOf: tournament.defaultBestOf,
      scheduledDate: tournament.matchDayDate,
      scheduledTime: '15:30 WIB',
      roomName: 'Lower Room #1',
      status: 'scheduled',
      winnerRegistrationId: null,
      nextWinnerMatchId: lbfId,
      nextWinnerSlot: 'B',
      playerStats: [],
    },
    {
      id: ubfId,
      tournamentId: tournament.id,
      stage: 'upper',
      roundNumber: 2,
      roundName: 'Upper Bracket Final',
      matchOrder: 4,
      teamARegistrationId: null,
      teamBRegistrationId: null,
      scoreA: 0,
      scoreB: 0,
      bestOf: 3,
      scheduledDate: tournament.matchDayDate,
      scheduledTime: '17:00 WIB',
      roomName: 'Main Stage UB',
      status: 'scheduled',
      winnerRegistrationId: null,
      nextWinnerMatchId: gfId,
      nextWinnerSlot: 'A',
      nextLoserMatchId: lbfId,
      nextLoserSlot: 'A',
      playerStats: [],
    },
    {
      id: lbfId,
      tournamentId: tournament.id,
      stage: 'lower',
      roundNumber: 2,
      roundName: 'Lower Bracket Final',
      matchOrder: 5,
      teamARegistrationId: null,
      teamBRegistrationId: null,
      scoreA: 0,
      scoreB: 0,
      bestOf: 3,
      scheduledDate: tournament.matchDayDate,
      scheduledTime: '18:30 WIB',
      roomName: 'Main Stage LB',
      status: 'scheduled',
      winnerRegistrationId: null,
      nextWinnerMatchId: gfId,
      nextWinnerSlot: 'B',
      playerStats: [],
    },
    {
      id: gfId,
      tournamentId: tournament.id,
      stage: 'grand_final',
      roundNumber: 3,
      roundName: 'Grand Final',
      matchOrder: 6,
      teamARegistrationId: null,
      teamBRegistrationId: null,
      scoreA: 0,
      scoreB: 0,
      bestOf: 5,
      scheduledDate: tournament.matchDayDate,
      scheduledTime: '20:30 WIB',
      roomName: 'Grand Final Arena',
      status: 'scheduled',
      winnerRegistrationId: null,
      playerStats: [],
    },
  ];

  return autoAdvanceByes(matches);
}

function generateRoundRobin(
  tournament: Tournament,
  regs: TournamentRegistration[],
  isDouble: boolean
): Match[] {
  const list: (TournamentRegistration | null)[] = [...regs];
  if (list.length % 2 !== 0) {
    list.push(null); // dummy for bye
  }
  const numTeams = list.length;
  const baseRounds = numTeams - 1;
  const half = numTeams / 2;

  const matches: Match[] = [];
  let matchOrder = 1;

  const teamCircle = [...list];
  // Liga tunggal: jumlah babak dibatasi totalRounds, tapi tak pernah melebihi n-1 (tanpa pasangan berulang).
  const maxRoundsToGenerate = isDouble
    ? baseRounds * 2
    : Math.min(tournament.totalRounds || baseRounds, baseRounds);

  for (let r = 0; r < maxRoundsToGenerate; r++) {
    const isSecondLeg = r >= baseRounds;
    const roundNumber = r + 1;

    for (let i = 0; i < half; i++) {
      const first = teamCircle[i];
      const second = teamCircle[numTeams - 1 - i];
      if (first && second) {
        const teamA = isSecondLeg ? second : first;
        const teamB = isSecondLeg ? first : second;
        const hour = 13 + ((matchOrder - 1) % 7);
        matches.push({
          id: `m-${tournament.id}-rr-r${roundNumber}-m${i + 1}`,
          tournamentId: tournament.id,
          stage: 'round_robin',
          roundNumber,
          roundName: `Babak ${roundNumber}${isDouble ? (isSecondLeg ? ' (Leg 2)' : ' (Leg 1)') : ''}`,
          matchOrder,
          teamARegistrationId: teamA.id,
          teamBRegistrationId: teamB.id,
          scoreA: 0,
          scoreB: 0,
          bestOf: tournament.defaultBestOf,
          scheduledDate: tournament.matchDayDate,
          scheduledTime: `${hour.toString().padStart(2, '0')}:00 WIB`,
          roomName: `Lobby Liga #${(i % 3) + 1}`,
          status: 'scheduled',
          winnerRegistrationId: null,
          playerStats: [],
        });
        matchOrder++;
      }
    }

    // Rotate circle keeping index 0 fixed
    const last = teamCircle.pop()!;
    teamCircle.splice(1, 0, last);
  }

  return matches;
}

function autoAdvanceByes(matches: Match[]): Match[] {
  const copy = matches.map((m) => ({ ...m }));
  copy.forEach((m) => {
    if (m.roundNumber === 1 && m.teamARegistrationId && !m.teamBRegistrationId) {
      m.status = 'completed';
      m.scoreA = 1;
      m.scoreB = 0;
      m.winnerRegistrationId = m.teamARegistrationId;
      if (m.nextWinnerMatchId) {
        const nextM = copy.find((x) => x.id === m.nextWinnerMatchId);
        if (nextM) {
          if (m.nextWinnerSlot === 'A') nextM.teamARegistrationId = m.teamARegistrationId;
          else nextM.teamBRegistrationId = m.teamARegistrationId;
        }
      }
    }
  });
  return copy;
}

/**
 * Propagates winner and loser of an updated match to downstream Upper/Lower bracket matches.
 */
export function propagateMatchOutcome(allMatches: Match[], updatedMatch: Match): Match[] {
  const nextList = allMatches.map((m) => (m.id === updatedMatch.id ? { ...updatedMatch } : { ...m }));

  if (
    updatedMatch.status === 'completed' &&
    updatedMatch.teamARegistrationId &&
    updatedMatch.teamBRegistrationId &&
    updatedMatch.scoreA !== updatedMatch.scoreB
  ) {
    const winnerId =
      updatedMatch.scoreA > updatedMatch.scoreB
        ? updatedMatch.teamARegistrationId
        : updatedMatch.teamBRegistrationId;
    const loserId =
      updatedMatch.scoreA > updatedMatch.scoreB
        ? updatedMatch.teamBRegistrationId
        : updatedMatch.teamARegistrationId;

    const targetCurrent = nextList.find((m) => m.id === updatedMatch.id);
    if (targetCurrent) {
      targetCurrent.winnerRegistrationId = winnerId;
    }

    if (updatedMatch.nextWinnerMatchId) {
      const winnerMatch = nextList.find((m) => m.id === updatedMatch.nextWinnerMatchId);
      if (winnerMatch) {
        if (updatedMatch.nextWinnerSlot === 'A') {
          winnerMatch.teamARegistrationId = winnerId;
        } else {
          winnerMatch.teamBRegistrationId = winnerId;
        }
      }
    }

    if (updatedMatch.nextLoserMatchId) {
      const loserMatch = nextList.find((m) => m.id === updatedMatch.nextLoserMatchId);
      if (loserMatch) {
        if (updatedMatch.nextLoserSlot === 'A') {
          loserMatch.teamARegistrationId = loserId;
        } else {
          loserMatch.teamBRegistrationId = loserId;
        }
      }
    }
  }

  return nextList;
}

export function calculateStandings(
  registrations: TournamentRegistration[],
  matches: Match[]
): StandingRow[] {
  const approved = registrations.filter((r) => r.status === 'approved');
  const map = new Map<string, StandingRow>();

  approved.forEach((reg) => {
    map.set(reg.id, {
      registrationId: reg.id,
      teamName: reg.teamName,
      teamTag: reg.teamTag,
      slotIndex: reg.slotIndex,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      gameWins: 0,
      gameLosses: 0,
      gameDiff: 0,
      points: 0,
    });
  });

  matches.forEach((m) => {
    if (m.status !== 'completed' || !m.teamARegistrationId || !m.teamBRegistrationId) return;
    const rowA = map.get(m.teamARegistrationId);
    const rowB = map.get(m.teamBRegistrationId);
    if (!rowA || !rowB) return;

    rowA.played += 1;
    rowB.played += 1;
    rowA.gameWins += m.scoreA;
    rowA.gameLosses += m.scoreB;
    rowB.gameWins += m.scoreB;
    rowB.gameLosses += m.scoreA;
    rowA.gameDiff = rowA.gameWins - rowA.gameLosses;
    rowB.gameDiff = rowB.gameWins - rowB.gameLosses;

    if (m.scoreA > m.scoreB) {
      rowA.wins += 1;
      rowB.losses += 1;
      rowA.points += 3;
    } else if (m.scoreB > m.scoreA) {
      rowB.wins += 1;
      rowA.losses += 1;
      rowB.points += 3;
    } else {
      rowA.draws += 1;
      rowB.draws += 1;
      rowA.points += 1;
      rowB.points += 1;
    }
  });

  return Array.from(map.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gameDiff !== a.gameDiff) return b.gameDiff - a.gameDiff;
    return b.gameWins - a.gameWins;
  });
}

export interface AggregatedPlayerStat {
  playerId: string;
  nickname: string;
  mlbbId: string;
  primaryRole: string;
  teamName: string;
  teamTag: string;
  matchesPlayed: number;
  kills: number;
  deaths: number;
  assists: number;
  kdaRatio: number;
  mvpCount: number;
  avgGold: number;
  avgRating: number;
  heroesUsed: string[];
}

export function aggregatePlayerLeaderboard(
  players: Player[],
  matches: Match[],
  registrations: TournamentRegistration[],
  tournamentIdFilter?: string
): AggregatedPlayerStat[] {
  const relevantMatches = tournamentIdFilter
    ? matches.filter((m) => m.tournamentId === tournamentIdFilter)
    : matches;

  const accum = new Map<
    string,
    {
      playerId: string;
      nickname: string;
      teamTag: string;
      matchesPlayed: number;
      kills: number;
      deaths: number;
      assists: number;
      mvpCount: number;
      totalGold: number;
      totalRating: number;
      heroes: Set<string>;
    }
  >();

  relevantMatches.forEach((m) => {
    m.playerStats.forEach((ps) => {
      const existing = accum.get(ps.playerId) || {
        playerId: ps.playerId,
        nickname: ps.playerNickname,
        teamTag: ps.teamTag,
        matchesPlayed: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
        mvpCount: 0,
        totalGold: 0,
        totalRating: 0,
        heroes: new Set<string>(),
      };

      existing.matchesPlayed += 1;
      existing.kills += ps.kills;
      existing.deaths += ps.deaths;
      existing.assists += ps.assists;
      if (ps.isMvp) existing.mvpCount += 1;
      existing.totalGold += ps.gold;
      existing.totalRating += ps.rating;
      if (ps.heroName) existing.heroes.add(ps.heroName);
      accum.set(ps.playerId, existing);
    });
  });

  const rows: AggregatedPlayerStat[] = [];
  accum.forEach((val) => {
    const pObj = players.find((p) => p.id === val.playerId);
    const regObj = registrations.find(
      (r) => r.corePlayerIds.includes(val.playerId) || r.subPlayerIds.includes(val.playerId)
    );
    const kda = (val.kills + val.assists) / Math.max(1, val.deaths);
    rows.push({
      playerId: val.playerId,
      nickname: pObj?.nickname || val.nickname,
      mlbbId: pObj ? `${pObj.mlbbId} (${pObj.serverId})` : '-',
      primaryRole: pObj?.primaryRole || 'Flex',
      teamName: regObj?.teamName || val.teamTag,
      teamTag: val.teamTag,
      matchesPlayed: val.matchesPlayed,
      kills: val.kills,
      deaths: val.deaths,
      assists: val.assists,
      kdaRatio: Number(kda.toFixed(2)),
      mvpCount: val.mvpCount,
      avgGold: Math.round(val.totalGold / Math.max(1, val.matchesPlayed)),
      avgRating: Number((val.totalRating / Math.max(1, val.matchesPlayed)).toFixed(2)),
      heroesUsed: Array.from(val.heroes),
    });
  });

  return rows.sort((a, b) => {
    if (b.mvpCount !== a.mvpCount) return b.mvpCount - a.mvpCount;
    if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
    return b.kdaRatio - a.kdaRatio;
  });
}
