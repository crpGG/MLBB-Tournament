export type UserRole = 'admin' | 'panitia' | 'pengunjung';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  active: boolean;
  createdAt: string;
}

export type MLBBHeroRole = 'EXP Lane' | 'Jungler' | 'Mid Lane' | 'Gold Lane' | 'Roamer';

export interface Player {
  id: string;
  nickname: string;
  mlbbId: string;
  serverId: string;
  primaryRole: MLBBHeroRole;
  tierRank: 'Warrior - Elite' | 'Master - Grandmaster' | 'Epic' | 'Legend' | 'Mythic' | 'Mythical Honor' | 'Mythical Glory' | 'Mythical Immortal';
  teamId?: string;
  signatureHeroes: string[];
}

export interface Team {
  id: string;
  name: string;
  tag: string;
  captainName: string;
  whatsapp: string;
  city: string;
  memberPlayerIds: string[];
  createdAt: string;
}

export type BracketFormat =
  | 'single_elimination'
  | 'double_elimination'
  | 'single_round_robin'
  | 'double_round_robin';

export type FeeType = 'free' | 'conditional_free' | 'paid';

export interface PaymentMethodConfig {
  id: string;
  type: 'bank' | 'ewallet' | 'qris';
  providerName: string; // e.g. "BCA", "Mandiri", "DANA", "GoPay", "OVO", "QRIS Panitia"
  accountNumber?: string;
  accountHolder: string;
  qrisImageUrl?: string;
  instructions?: string;
}

export interface ConditionalRequirement {
  id: string;
  label: string; // e.g. "Follow Instagram Resmi Turnamen"
  category: 'social_follow' | 'social_share' | 'identity' | 'custom';
  externalUrl?: string; // Clickable link for participants
  mandatory: boolean;
  description?: string;
}

export interface Tournament {
  id: string;
  name: string;
  organizer: string;
  description: string;
  status: 'registration' | 'ongoing' | 'completed';
  // Dates with preset choices (14 Oktober 2026) or custom
  matchDayDate: string; // YYYY-MM-DD
  registrationCloseDate: string; // YYYY-MM-DD
  technicalMeetingDate: string; // YYYY-MM-DD
  technicalMeetingTime: string;
  // Registration Fee & Verification
  feeType: FeeType;
  feeAmount: number;
  paymentMethods: PaymentMethodConfig[];
  conditionalRequirements: ConditionalRequirement[];
  // MLBB Specific Rules & Options
  venueType: 'Online' | 'Offline' | 'Hybrid';
  venueDetail: string;
  multiSlot: 'Multi Slot On' | 'Multi Slot Off';
  maxSlotPerTeam: number;
  skinRule: 'Skin Bebas' | 'Skin On' | 'Skin Off (No Skin)';
  tierRule: 'All Tier/Rank' | 'Mythic+ Only' | 'Legend - Mythic' | 'Maksimal Legend';
  gameMode: 'Custom Draft Pick Mode' | 'Tournament Mode (10 Ban)' | 'Custom Classic' | 'Brawl Mode';
  seriesSystem: string; // e.g., "Sistem Liga BO1 | Total 5 Babak"
  defaultBestOf: 1 | 3 | 5 | 7;
  totalRounds: number;
  bracketFormat: BracketFormat;
  maxTeams: number;
  prizePool: string;
  createdAt: string;
}

export interface RequirementSubmission {
  requirementId: string;
  proofImageUrl: string;
  note?: string;
}

export interface TournamentRegistration {
  id: string;
  tournamentId: string;
  teamId: string;
  teamName: string;
  teamTag: string;
  slotIndex: number; // 1, 2 (for Multi Slot)
  captainName: string;
  whatsapp: string;
  corePlayerIds: string[]; // Strictly 5 players
  subPlayerIds: string[]; // 0 - 2 optional players
  feeTypeSnapshot: FeeType;
  selectedPaymentMethodId?: string;
  paymentSenderName?: string;
  paymentProofImageUrl?: string;
  paymentUniqueCode?: string;
  requirementSubmissions: RequirementSubmission[];
  status: 'pending' | 'approved' | 'rejected';
  committeeNote?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  registeredAt: string;
}

export interface PlayerMatchStat {
  playerId: string;
  playerNickname: string;
  teamRegistrationId: string;
  teamTag: string;
  heroName: string;
  role: MLBBHeroRole;
  kills: number;
  deaths: number;
  assists: number;
  gold: number;
  rating: number; // e.g. 8.6
  isMvp: boolean;
}

export interface Match {
  id: string;
  tournamentId: string;
  stage: 'upper' | 'lower' | 'grand_final' | 'round_robin';
  roundNumber: number;
  roundName: string;
  matchOrder: number;
  teamARegistrationId: string | null;
  teamBRegistrationId: string | null;
  scoreA: number;
  scoreB: number;
  bestOf: 1 | 3 | 5 | 7;
  scheduledDate: string;
  scheduledTime: string;
  roomName?: string;
  status: 'scheduled' | 'live' | 'completed';
  winnerRegistrationId: string | null;
  nextWinnerMatchId?: string;
  nextWinnerSlot?: 'A' | 'B';
  nextLoserMatchId?: string;
  nextLoserSlot?: 'A' | 'B';
  playerStats: PlayerMatchStat[];
}

export interface StandingRow {
  registrationId: string;
  teamName: string;
  teamTag: string;
  slotIndex: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gameWins: number;
  gameLosses: number;
  gameDiff: number;
  points: number;
}
