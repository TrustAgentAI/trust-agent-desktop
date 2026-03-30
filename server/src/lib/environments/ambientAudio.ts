/**
 * Ambient Audio Configuration - Phase 4: Session Experience
 *
 * Maps environment slugs to S3 audio file keys.
 * Each environment has a specific ambient audio track that plays
 * during sessions to create atmosphere and presence.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EnvironmentAudioConfig {
  s3Key: string;
  name: string;
  defaultVolume: number; // 0-100
  fadeInMs: number;
  fadeOutMs: number;
  loopable: boolean;
}

// ---------------------------------------------------------------------------
// Environment audio map - all 38 environments
// ---------------------------------------------------------------------------

export const ENVIRONMENT_AUDIO: Record<string, EnvironmentAudioConfig> = {
  // Study environments
  'study-room': {
    s3Key: 'audio/ambient/study-room.mp3',
    name: 'Quiet Study Room',
    defaultVolume: 8,
    fadeInMs: 2000,
    fadeOutMs: 1500,
    loopable: true,
  },
  library: {
    s3Key: 'audio/ambient/library.mp3',
    name: 'Library',
    defaultVolume: 6,
    fadeInMs: 2000,
    fadeOutMs: 1500,
    loopable: true,
  },
  'coffee-shop': {
    s3Key: 'audio/ambient/coffee-shop.mp3',
    name: 'Coffee Shop',
    defaultVolume: 15,
    fadeInMs: 2000,
    fadeOutMs: 1500,
    loopable: true,
  },
  classroom: {
    s3Key: 'audio/ambient/classroom.mp3',
    name: 'Classroom',
    defaultVolume: 5,
    fadeInMs: 2000,
    fadeOutMs: 1500,
    loopable: true,
  },

  // Therapy / health environments
  'therapy-room': {
    s3Key: 'audio/ambient/therapy-room.mp3',
    name: 'Therapy Room',
    defaultVolume: 20,
    fadeInMs: 3000,
    fadeOutMs: 2000,
    loopable: true,
  },
  'zen-garden': {
    s3Key: 'audio/ambient/zen-garden.mp3',
    name: 'Zen Garden',
    defaultVolume: 18,
    fadeInMs: 3000,
    fadeOutMs: 2000,
    loopable: true,
  },
  'meditation-space': {
    s3Key: 'audio/ambient/meditation-space.mp3',
    name: 'Meditation Space',
    defaultVolume: 15,
    fadeInMs: 3000,
    fadeOutMs: 2500,
    loopable: true,
  },
  spa: {
    s3Key: 'audio/ambient/spa.mp3',
    name: 'Spa',
    defaultVolume: 18,
    fadeInMs: 3000,
    fadeOutMs: 2000,
    loopable: true,
  },

  // Professional environments
  office: {
    s3Key: 'audio/ambient/office.mp3',
    name: 'Modern Office',
    defaultVolume: 10,
    fadeInMs: 2000,
    fadeOutMs: 1500,
    loopable: true,
  },
  boardroom: {
    s3Key: 'audio/ambient/boardroom.mp3',
    name: 'Boardroom',
    defaultVolume: 5,
    fadeInMs: 2000,
    fadeOutMs: 1500,
    loopable: true,
  },
  'co-working': {
    s3Key: 'audio/ambient/co-working.mp3',
    name: 'Co-Working Space',
    defaultVolume: 12,
    fadeInMs: 2000,
    fadeOutMs: 1500,
    loopable: true,
  },

  // Nature environments
  forest: {
    s3Key: 'audio/ambient/forest.mp3',
    name: 'Forest',
    defaultVolume: 20,
    fadeInMs: 3000,
    fadeOutMs: 2000,
    loopable: true,
  },
  beach: {
    s3Key: 'audio/ambient/beach.mp3',
    name: 'Beach',
    defaultVolume: 22,
    fadeInMs: 3000,
    fadeOutMs: 2000,
    loopable: true,
  },
  rain: {
    s3Key: 'audio/ambient/rain.mp3',
    name: 'Rainy Day',
    defaultVolume: 25,
    fadeInMs: 2000,
    fadeOutMs: 1500,
    loopable: true,
  },
  'mountain-cabin': {
    s3Key: 'audio/ambient/mountain-cabin.mp3',
    name: 'Mountain Cabin',
    defaultVolume: 15,
    fadeInMs: 3000,
    fadeOutMs: 2000,
    loopable: true,
  },
  garden: {
    s3Key: 'audio/ambient/garden.mp3',
    name: 'Garden',
    defaultVolume: 18,
    fadeInMs: 3000,
    fadeOutMs: 2000,
    loopable: true,
  },
  riverside: {
    s3Key: 'audio/ambient/riverside.mp3',
    name: 'Riverside',
    defaultVolume: 20,
    fadeInMs: 3000,
    fadeOutMs: 2000,
    loopable: true,
  },

  // Cosy / personal
  'living-room': {
    s3Key: 'audio/ambient/living-room.mp3',
    name: 'Living Room',
    defaultVolume: 10,
    fadeInMs: 2000,
    fadeOutMs: 1500,
    loopable: true,
  },
  fireside: {
    s3Key: 'audio/ambient/fireside.mp3',
    name: 'Fireside',
    defaultVolume: 22,
    fadeInMs: 3000,
    fadeOutMs: 2000,
    loopable: true,
  },
  kitchen: {
    s3Key: 'audio/ambient/kitchen.mp3',
    name: 'Kitchen',
    defaultVolume: 12,
    fadeInMs: 2000,
    fadeOutMs: 1500,
    loopable: true,
  },
  'reading-nook': {
    s3Key: 'audio/ambient/reading-nook.mp3',
    name: 'Reading Nook',
    defaultVolume: 8,
    fadeInMs: 2000,
    fadeOutMs: 1500,
    loopable: true,
  },

  // Creative environments
  'art-studio': {
    s3Key: 'audio/ambient/art-studio.mp3',
    name: 'Art Studio',
    defaultVolume: 12,
    fadeInMs: 2000,
    fadeOutMs: 1500,
    loopable: true,
  },
  'music-room': {
    s3Key: 'audio/ambient/music-room.mp3',
    name: 'Music Room',
    defaultVolume: 10,
    fadeInMs: 2000,
    fadeOutMs: 1500,
    loopable: true,
  },
  workshop: {
    s3Key: 'audio/ambient/workshop.mp3',
    name: 'Workshop',
    defaultVolume: 10,
    fadeInMs: 2000,
    fadeOutMs: 1500,
    loopable: true,
  },

  // Language learning
  'paris-cafe': {
    s3Key: 'audio/ambient/paris-cafe.mp3',
    name: 'Paris Cafe',
    defaultVolume: 15,
    fadeInMs: 2000,
    fadeOutMs: 1500,
    loopable: true,
  },
  'tokyo-street': {
    s3Key: 'audio/ambient/tokyo-street.mp3',
    name: 'Tokyo Street',
    defaultVolume: 15,
    fadeInMs: 2000,
    fadeOutMs: 1500,
    loopable: true,
  },
  'spanish-plaza': {
    s3Key: 'audio/ambient/spanish-plaza.mp3',
    name: 'Spanish Plaza',
    defaultVolume: 15,
    fadeInMs: 2000,
    fadeOutMs: 1500,
    loopable: true,
  },

  // Wellness / mindfulness
  sunrise: {
    s3Key: 'audio/ambient/sunrise.mp3',
    name: 'Sunrise',
    defaultVolume: 15,
    fadeInMs: 4000,
    fadeOutMs: 3000,
    loopable: true,
  },
  'night-sky': {
    s3Key: 'audio/ambient/night-sky.mp3',
    name: 'Night Sky',
    defaultVolume: 12,
    fadeInMs: 4000,
    fadeOutMs: 3000,
    loopable: true,
  },
  'warm-bath': {
    s3Key: 'audio/ambient/warm-bath.mp3',
    name: 'Warm Bath',
    defaultVolume: 15,
    fadeInMs: 3000,
    fadeOutMs: 2000,
    loopable: true,
  },

  // Elderly-specific
  'afternoon-tea': {
    s3Key: 'audio/ambient/afternoon-tea.mp3',
    name: 'Afternoon Tea',
    defaultVolume: 12,
    fadeInMs: 3000,
    fadeOutMs: 2000,
    loopable: true,
  },
  conservatory: {
    s3Key: 'audio/ambient/conservatory.mp3',
    name: 'Conservatory',
    defaultVolume: 12,
    fadeInMs: 3000,
    fadeOutMs: 2000,
    loopable: true,
  },
  'park-bench': {
    s3Key: 'audio/ambient/park-bench.mp3',
    name: 'Park Bench',
    defaultVolume: 18,
    fadeInMs: 3000,
    fadeOutMs: 2000,
    loopable: true,
  },

  // Tech / modern
  'space-station': {
    s3Key: 'audio/ambient/space-station.mp3',
    name: 'Space Station',
    defaultVolume: 10,
    fadeInMs: 2000,
    fadeOutMs: 1500,
    loopable: true,
  },
  'neon-city': {
    s3Key: 'audio/ambient/neon-city.mp3',
    name: 'Neon City',
    defaultVolume: 12,
    fadeInMs: 2000,
    fadeOutMs: 1500,
    loopable: true,
  },
  'rooftop-terrace': {
    s3Key: 'audio/ambient/rooftop-terrace.mp3',
    name: 'Rooftop Terrace',
    defaultVolume: 15,
    fadeInMs: 2000,
    fadeOutMs: 1500,
    loopable: true,
  },

  // Misc
  treehouse: {
    s3Key: 'audio/ambient/treehouse.mp3',
    name: 'Treehouse',
    defaultVolume: 18,
    fadeInMs: 3000,
    fadeOutMs: 2000,
    loopable: true,
  },
  greenhouse: {
    s3Key: 'audio/ambient/greenhouse.mp3',
    name: 'Greenhouse',
    defaultVolume: 15,
    fadeInMs: 3000,
    fadeOutMs: 2000,
    loopable: true,
  },

  // Default fallback
  default: {
    s3Key: 'audio/ambient/default.mp3',
    name: 'Calm Ambient',
    defaultVolume: 10,
    fadeInMs: 2000,
    fadeOutMs: 1500,
    loopable: true,
  },
};

// ---------------------------------------------------------------------------
// Lookup function
// ---------------------------------------------------------------------------

export function getAudioForEnvironment(
  environmentSlug: string,
): EnvironmentAudioConfig | null {
  return ENVIRONMENT_AUDIO[environmentSlug] ?? ENVIRONMENT_AUDIO['default'] ?? null;
}
