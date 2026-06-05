export interface POAP {
  id: string
  name: string
  image_url: string
  event_date: string
}

export interface TalentCredential {
  id: string
  name: string
  category: string
  value: string
  last_calculated_at: string
}

export type FriendshipStatus = "pending" | "accepted" | "rejected"

export interface Friendship {
  id: string
  requester_id: string
  receiver_id: string
  status: FriendshipStatus
  created_at: string
}

export interface FriendshipWithUser extends Friendship {
  other_user: {
    id: string
    handle: string | null
    archetype: string | null
    avatar_url: string | null
  }
  direction: "sent" | "received"
}

export interface FriendshipStatusResponse {
  friendship_id: string | null
  status: FriendshipStatus | null
  direction: "sent" | "received" | null
}

export type NotificationType =
  | "friend_request"
  | "friend_accepted"
  | "hack_space_application"
  | "hack_space_accepted"
  | "hacker_house_application"
  | "hacker_house_accepted"
  | "event_request"

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string
  link: string | null
  read: boolean
  created_at: string
}

export interface UserProfile {
  id: string
  privy_id: string
  handle: string | null
  bio: string | null
  archetype: string | null
  skills: string[] | null
  wallet_address: string | null
  email: string | null
  onboarding_step: string | null
  avatar_url: string | null
  languages: string[] | null
  timezone: string | null
  region: string | null
  country: string | null
  city: string | null
  github_url: string | null
  twitter_url: string | null
  farcaster_url: string | null
  website_url: string | null
  is_verified: boolean
  is_admin: boolean
  talent_protocol_score: number | null
  talent_tags: string[]
  talent_credentials: TalentCredential[]
  poaps: POAP[]
  onchain_since: string | null
  created_at: string
  updated_at: string
}

export type HackSpaceStatus = "open" | "full" | "in_progress" | "finished"
export type HackSpaceTrack =
  | "DeFi"
  | "DAO tools"
  | "AI"
  | "Social"
  | "Gaming"
  | "NFTs"
  | "Infrastructure"
  | "Other"
export type ProjectStage = "idea" | "prototype" | "in_development"
export type ApplicationType = "open" | "invite_only" | "curated"
export type ExperienceLevel = "beginner" | "intermediate" | "advanced"

export interface HackSpaceParticipant {
  id: string
  handle: string | null
  archetype: string | null
  avatar_url: string | null
}

export interface HackSpace {
  id: string
  title: string
  description: string
  track: HackSpaceTrack
  stage: ProjectStage
  repo_url: string | null
  status: HackSpaceStatus
  looking_for: string[]
  skills_needed: string[]
  max_team_size: number
  experience_level: ExperienceLevel
  language: string[]
  region: string | null
  country: string | null
  city: string | null
  image_url: string | null
  application_type: ApplicationType
  application_deadline: string | null
  // Event (optional)
  event_name: string | null
  event_url: string | null
  event_start_date: string | null
  event_end_date: string | null
  event_timing: string[] | null
  lat: number | null
  lng: number | null
  created_at: string
  creator: {
    id: string
    handle: string | null
    archetype: string | null
    avatar_url: string | null
  }
  member_count?: number
  participants?: HackSpaceParticipant[]
}

export interface HackSpaceListParams {
  track?: HackSpaceTrack
  status?: HackSpaceStatus
  looking_for?: string
  q?: string
  event_name?: string
  limit?: number
  offset?: number
}

export interface HackSpaceListResponse {
  hack_spaces: HackSpace[]
  total: number
  offset: number
  limit: number
}

export interface Application {
  id: string
  hack_space_id: string | null
  hacker_house_id: string | null
  target_type: "hack_space" | "hacker_house"
  applicant_id: string
  message: string | null
  status: "pending" | "accepted" | "rejected"
  created_at: string
}

export interface ApplicationWithApplicant extends Application {
  applicant: {
    id: string
    handle: string | null
    archetype: string | null
    skills: string[] | null
    avatar_url: string | null
  }
}

// Hacker Houses
export type HouseModality = "free" | "paid" | "staking"
export type HouseStatus = "open" | "full" | "active" | "finished"
export type HouseContractType = "multisig" | "admin_wallet"

export interface HackerHouseParticipant {
  id: string
  handle: string | null
  archetype: string | null
  avatar_url: string | null
}

export interface HackerHouse {
  id: string
  name: string
  city: string
  country: string
  neighborhood: string | null
  start_date: string
  end_date: string
  capacity: number
  modality: HouseModality
  price_per_person: number | null
  region: string | null
  sponsor_name: string | null
  images: string[]
  includes_private_room: boolean
  includes_shared_room: boolean
  includes_meals: boolean
  includes_workspace: boolean
  includes_internet: boolean
  profile_sought: string[]
  language: string[]
  booking_url: string | null
  address: string | null
  checkin_wifi_password: string | null
  checkin_room_info: string | null
  checkin_lockbox: string | null
  checkin_notes: string | null
  house_rules: string | null
  status: HouseStatus
  application_type: ApplicationType
  application_deadline: string
  application_form_url: string | null
  contract_type: HouseContractType | null
  sponsor_community_id: string | null
  event_name: string | null
  event_url: string | null
  event_start_date: string | null
  event_end_date: string | null
  event_timing: string[] | null
  lat: number | null
  lng: number | null
  created_at: string
  creator: HackerHouseParticipant
  participants: HackerHouseParticipant[]
  participants_count: number
}

export interface HackerHouseListParams {
  status?: HouseStatus
  profile_sought?: string
  q?: string
  event_name?: string
  limit?: number
  offset?: number
}

export interface HackerHouseListResponse {
  hacker_houses: HackerHouse[]
  total: number
  offset: number
  limit: number
}

// Builder Discovery
export interface BuilderListParams {
  archetype?: string
  q?: string
  exclude_id?: string
  limit?: number
  offset?: number
}

export interface BuilderListResponse {
  builders: UserProfile[]
  total: number
  offset: number
  limit: number
}

export interface SuggestedBuilder extends UserProfile {
  match_score: number
  match_reasons: string[]
}

// Map
export type MapMarkerType = "hacker_house" | "hack_space" | "event" | "community"

export interface MapMarkerData {
  id: string
  type: MapMarkerType
  name: string
  city: string | null
  country: string | null
  lat: number
  lng: number
  status: string
  event_name: string | null
  event_start_date: string | null
  event_end_date: string | null
  capacity: number | null
  participants_count: number | null
  max_team_size: number | null
  member_count: number | null
  track: string | null
  image_url: string | null
  // event/community extras
  description?: string | null
  website_url?: string | null
  prizes?: string | null
  category?: string | null
  // location privacy
  location_revealed?: boolean
}

export interface MapMarkersResponse {
  markers: MapMarkerData[]
}

// Communities
export type CommunityCategory =
  | "DeFi"
  | "DAO tools"
  | "AI"
  | "Social"
  | "Gaming"
  | "NFTs"
  | "Infrastructure"
  | "Foundation"
  | "Other"

export interface Community {
  id: string
  name: string
  description: string
  image_url: string | null
  category: CommunityCategory
  city: string | null
  country: string | null
  creator: {
    id: string
    handle: string | null
    archetype: string | null
    avatar_url: string | null
  }
  member_count: number
  is_member?: boolean
  is_verified: boolean
  is_featured: boolean
  featured_order: number | null
  verification_requested: boolean
  featured_requested: boolean
  is_worldwide: boolean
  created_at: string
}

export interface CommunityListParams {
  category?: CommunityCategory
  q?: string
  limit?: number
  offset?: number
}

export interface CommunityListResponse {
  communities: Community[]
  total: number
  offset: number
  limit: number
}

/* ── Events ── */
export type EventType = "Hackathon" | "Buildathon" | "Conference" | "Workshop" | "Meetup" | "Summit" | "Founder House" | "Other"

export interface HHPEvent {
  id: string
  name: string
  description: string
  type: EventType
  city: string
  country: string
  venue: string | null
  address: string | null
  address_reveal_date: string | null
  start_date: string
  end_date: string
  banner_url: string | null
  website_url: string | null
  prizes: string | null
  is_featured: boolean
  is_verified: boolean
  featured_order: number | null
  lat: number | null
  lng: number | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface EventListResponse {
  events: HHPEvent[]
  total: number
}

export type EventRequestStatus = "pending" | "approved" | "rejected"

export interface EventRequest {
  id: string
  name: string
  description: string
  type: EventType
  city: string
  country: string
  start_date: string
  end_date: string
  venue: string | null
  website_url: string | null
  prizes: string | null
  notes: string | null
  status: EventRequestStatus
  submitted_by: string | null
  submitter: { id: string; handle: string | null; avatar_url: string | null } | null
  created_at: string
}

/* ── Admin ── */
export interface AdminStats {
  users: number
  events: number
  communities: number
  hack_spaces: number
  hacker_houses: number
  event_requests: number
}

export interface AdminUser {
  id: string
  handle: string | null
  archetype: string | null
  avatar_url: string | null
  is_verified: boolean
  is_admin: boolean
  privy_id: string
  created_at: string
}
