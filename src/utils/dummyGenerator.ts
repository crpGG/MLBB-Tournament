import { MLBBHeroRole, Player, Team } from '../types/tournament';

const TEAM_PREFIXES = [
  'Garuda',
  'Valkyrie',
  'Astra',
  'Draco',
  'Phoenix',
  'Titan',
  'Eclipse',
  'Orion',
  'Tempest',
  'Vanguard',
  'Nova',
  'Apex',
  'Shadow',
  'Radiant',
  'Crimson',
  'Aegis',
  'blitz',
  'Zenith',
  'Omega',
  'Kronos',
  'Celestial',
  'Phantom',
  'overeign',
  'Inferno',
  'Glacier',
];

const TEAM_SUFFIXES = [
  'Esports',
  'Prodigy',
  'Academy',
  'Reborn',
  'Force',
  'United',
  'X',
  'Prime',
  'Legion',
  'Knights',
];

const CITIES = [
  'Manado',
  'Jakarta',
  'Surabaya',
  'Bandung',
  'Medan',
  'Makassar',
  'Denpasar',
  'Yogyakarta',
  'Semarang',
  'Balikpapan',
  'Palembang',
  'Pontianak',
  'Samarinda',
  'Malang',
  'Bitung',
  'Tomohon',
  'Pekanbaru',
  'Banjarmasin',
  'Ambon',
  'Jayapura',
];

const FIRST_NAMES = [
  'Rizky',
  'Dimas',
  'Fajar',
  'Bagas',
  'Kevin',
  'Aldi',
  'Rangga',
  'Naufal',
  'Ilham',
  'Bayu',
  'Satria',
  'Daffa',
  'Gilang',
  'Rian',
  'Wahyu',
  'Yoga',
  'Reza',
  'Farhan',
  'Arif',
  'Hendra',
  'Rafael',
  'Steven',
  'Christian',
  'Gilbert',
  'Marcel',
];

const LAST_NAMES = [
  'Pratama',
  'Saputra',
  'Wijaya',
  'Nugroho',
  'Santoso',
  'Hidayat',
  'Kusuma',
  'Ramadhan',
  'Setiawan',
  'Permana',
  'Gunawan',
  'Mahendra',
  'Pangestu',
  'Firmansyah',
  'Siregar',
  'Wicaksono',
  'Putra',
  'Syahputra',
  'Lasut',
  'Mandagi',
];

const NICK_STEMS = [
  'Kairi',
  'Sanz',
  'Kiboy',
  'CW',
  'Lutpiii',
  'Skylar',
  'Alberttt',
  'Vyn',
  'Lemon',
  'R7',
  'Tazz',
  'Branz',
  'Dreams',
  'hijumee',
  'Nino',
  'Celiboy',
  'Pai',
  'Udil',
  'Yawi',
  'Aeron',
  'Moreno',
  'SuperKenn',
  'Kyy',
  'Xinnn',
  'Ferxiic',
  'Baloyskie',
  'Aboy',
  'Luke',
  'Caderaa',
  'Veldora',
];

const ROLE_ORDER: MLBBHeroRole[] = [
  'Jungler',
  'Gold Lane',
  'Mid Lane',
  'EXP Lane',
  'Roamer',
];

const HEROES_BY_ROLE: Record<MLBBHeroRole, string[]> = {
  Jungler: ['Fanny', 'Ling', 'Hayabusa', 'Nolan', 'Joy', 'Suyou', 'Fredrinn'],
  'Gold Lane': ['Claude', 'Beatrix', 'Harith', 'Moskov', 'Karrie', 'Roger', 'Brody'],
  'Mid Lane': ['Valentina', 'Yve', 'Pharsa', 'Faramis', 'Luo Yi', 'Novaria', 'Vexana'],
  'EXP Lane': ['Arlott', 'Terizla', 'Yu Zhong', 'Paquito', 'Edith', 'Cici', 'Ruby'],
  Roamer: ['Chou', 'Tigreal', 'Minotaur', 'Mathilda', 'Khufra', 'Kaja', 'Chip'],
};

const TIERS: Player['tierRank'][] = [
  'Mythical Immortal',
  'Mythical Glory',
  'Mythical Honor',
  'Mythic',
];

let dummyBatchSeq = 0;

export const isDummyTeam = (team: Team): boolean => team.id.startsWith('tm-dummy-');
export const isDummyPlayer = (player: Player): boolean => player.id.startsWith('pl-dummy-');

export function generate50DummyTeamsAndPlayers(
  existingTeams: Team[],
  existingPlayers: Player[]
): { newTeams: Team[]; newPlayers: Player[] } {
  dummyBatchSeq += 1;
  const stamp = `${Date.now()}-${dummyBatchSeq}-${Math.random().toString(36).slice(2, 6)}`;
  const usedTeamIds = new Set(existingTeams.map((t) => t.id));
  const usedPlayerIds = new Set(existingPlayers.map((p) => p.id));
  const usedTags = new Set(existingTeams.map((t) => t.tag.toUpperCase()));
  const usedMlbbKeys = new Set(
    existingPlayers.map((p) => `${p.mlbbId.trim()}:${p.serverId.trim()}`)
  );

  const newTeams: Team[] = [];
  const newPlayers: Player[] = [];
  const todayIso = new Date().toISOString().slice(0, 10);

  let playerCounter = 1;
  const numericSeed = Date.now() % 100000;

  for (let i = 0; i < 50; i++) {
    const prefixRaw = TEAM_PREFIXES[i % TEAM_PREFIXES.length];
    const prefix = prefixRaw.charAt(0).toUpperCase() + prefixRaw.slice(1);
    const suffix = TEAM_SUFFIXES[Math.floor(i / TEAM_PREFIXES.length) % TEAM_SUFFIXES.length];
    const city = CITIES[i % CITIES.length];
    const teamNumber = i + 1;

    const teamName = `${prefix} ${city} ${suffix} #${teamNumber}`;

    // Build unique 3-5 char tag
    const baseTag = `${prefix.slice(0, 2)}${city.slice(0, 1)}${teamNumber}`.toUpperCase();
    let tag = baseTag.slice(0, 5);
    let suffixIdx = 1;
    while (usedTags.has(tag)) {
      tag = `${prefix.slice(0, 2)}${teamNumber}${suffixIdx}`.slice(0, 5).toUpperCase();
      suffixIdx++;
    }
    usedTags.add(tag);

    let teamId = `tm-dummy-${stamp}-${teamNumber}`;
    let teamCollisionIdx = 1;
    while (usedTeamIds.has(teamId)) {
      teamId = `tm-dummy-${stamp}-${teamNumber}-${teamCollisionIdx}`;
      teamCollisionIdx++;
    }
    usedTeamIds.add(teamId);

    const subCount = i % 2 === 0 ? 2 : 1; // 5 core + 1 or 2 subs = 6 or 7 players per team
    const totalPlayersForTeam = 5 + subCount;
    const memberPlayerIds: string[] = [];

    let captainName = '';

    for (let pIdx = 0; pIdx < totalPlayersForTeam; pIdx++) {
      const role: MLBBHeroRole =
        pIdx < 5 ? ROLE_ORDER[pIdx] : ROLE_ORDER[(i + pIdx) % ROLE_ORDER.length];
      const stem = NICK_STEMS[(i * 7 + pIdx) % NICK_STEMS.length];
      const fn = FIRST_NAMES[(i * 3 + pIdx) % FIRST_NAMES.length];
      const ln = LAST_NAMES[(i * 5 + pIdx * 2) % LAST_NAMES.length];
      const fullName = `${fn} ${ln}`;

      if (pIdx === 0) {
        captainName = fullName;
      }

      const nickname = `${tag}.${stem}${pIdx >= 5 ? 'Sub' : ''}`;

      // Generate unique 9-digit mlbbId & 4-digit serverId
      let mlbbId = String(210000000 + (numericSeed * 1000 + playerCounter));
      const serverId = String(2000 + ((i * 13 + pIdx * 7) % 7900));
      while (usedMlbbKeys.has(`${mlbbId}:${serverId}`)) {
        playerCounter++;
        mlbbId = String(210000000 + (numericSeed * 1000 + playerCounter));
      }
      usedMlbbKeys.add(`${mlbbId}:${serverId}`);
      playerCounter++;

      const roleHeroes = HEROES_BY_ROLE[role];
      const hero1 = roleHeroes[(i + pIdx) % roleHeroes.length];
      const hero2 = roleHeroes[(i + pIdx + 2) % roleHeroes.length];

      let playerId = `pl-dummy-${stamp}-${teamNumber}-${pIdx + 1}`;
      let playerCollisionIdx = 1;
      while (usedPlayerIds.has(playerId)) {
        playerId = `pl-dummy-${stamp}-${teamNumber}-${pIdx + 1}-${playerCollisionIdx}`;
        playerCollisionIdx++;
      }
      usedPlayerIds.add(playerId);
      memberPlayerIds.push(playerId);

      newPlayers.push({
        id: playerId,
        nickname,
        fullName,
        mlbbId,
        serverId,
        primaryRole: role,
        tierRank: TIERS[(i + pIdx) % TIERS.length],
        teamId,
        signatureHeroes: [hero1, hero2],
      });
    }

    const waNumber = `0812${String(30000000 + i * 12345).slice(0, 8)}`;

    newTeams.push({
      id: teamId,
      name: teamName,
      tag,
      captainName,
      whatsapp: waNumber,
      city,
      memberPlayerIds,
      createdAt: todayIso,
    });
  }

  return { newTeams, newPlayers };
}
