/**
 * scripts/generate-avatars.ts
 *
 * Generates professional SVG avatars for every role in src/data/roles/.
 * Each avatar is a 256x256 circle with:
 *   - Category-based color scheme
 *   - Professional icon silhouette unique to the role's domain
 *   - Subtle gradient overlay
 *   - Saved to public/avatars/roles/[slug].svg
 *
 * Run: npx tsx scripts/generate-avatars.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// Category color schemes
// ---------------------------------------------------------------------------

interface ColorScheme {
  primary: string;
  light: string;
  dark: string;
  gradientStop: string;
}

const CATEGORY_COLORS: Record<string, ColorScheme> = {
  education: { primary: '#1E6FFF', light: '#4A8FFF', dark: '#0A4FCC', gradientStop: '#1452B8' },
  'health-wellness': { primary: '#00AA78', light: '#2ECFA0', dark: '#007A55', gradientStop: '#008860' },
  enterprise: { primary: '#0A1628', light: '#1A3050', dark: '#050D18', gradientStop: '#0D1E38' },
  childrens: { primary: '#FF8C42', light: '#FFB070', dark: '#CC6A20', gradientStop: '#E07530' },
  'elderly-care': { primary: '#D4A843', light: '#E8C870', dark: '#A88530', gradientStop: '#C09838' },
  'legal-financial': { primary: '#1A3A6B', light: '#2A5090', dark: '#0E2548', gradientStop: '#1A3060' },
  'creative-professional': { primary: '#CC3399', light: '#E060B8', dark: '#992270', gradientStop: '#B02880' },
  creative: { primary: '#CC3399', light: '#E060B8', dark: '#992270', gradientStop: '#B02880' },
  'food-lifestyle': { primary: '#CC4444', light: '#E06060', dark: '#993030', gradientStop: '#B83838' },
  productivity: { primary: '#6B7B8D', light: '#8A9AAD', dark: '#4A5A6B', gradientStop: '#5A6A7A' },
  entertainment: { primary: '#7B61FF', light: '#9A85FF', dark: '#5840CC', gradientStop: '#6850E0' },
  'life-navigation': { primary: '#30B0C7', light: '#50D0E0', dark: '#208898', gradientStop: '#2898A8' },
};

function getColorScheme(category: string): ColorScheme {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.education;
}

// ---------------------------------------------------------------------------
// Icon silhouettes - SVG path data for professional icons
// Each returns an SVG group that fits within a ~120x120 area centered at 128,128
// ---------------------------------------------------------------------------

// Generic person bust (head + shoulders)
function personBust(): string {
  return `
    <circle cx="128" cy="95" r="32" fill="currentColor" opacity="0.95"/>
    <ellipse cx="128" cy="185" rx="55" ry="38" fill="currentColor" opacity="0.9"/>
  `;
}

// Book icon for education
function bookIcon(): string {
  return `
    <path d="M80 80 L80 180 Q128 165 128 165 Q128 165 176 180 L176 80 Q128 95 128 95 Q128 95 80 80Z" fill="currentColor" opacity="0.9" stroke="none"/>
    <line x1="128" y1="95" x2="128" y2="165" stroke="currentColor" opacity="0.6" stroke-width="2"/>
    <path d="M75 76 Q128 92 128 92 Q128 92 181 76" fill="none" stroke="currentColor" opacity="0.7" stroke-width="3" stroke-linecap="round"/>
  `;
}

// Graduation cap
function gradCapIcon(): string {
  return `
    <path d="M128 75 L65 105 L128 135 L191 105 Z" fill="currentColor" opacity="0.9"/>
    <path d="M90 115 L90 155 Q128 175 166 155 L166 115" fill="none" stroke="currentColor" opacity="0.8" stroke-width="4"/>
    <line x1="185" y1="105" x2="185" y2="160" stroke="currentColor" opacity="0.7" stroke-width="3"/>
    <circle cx="185" cy="163" r="4" fill="currentColor" opacity="0.7"/>
  `;
}

// Globe icon for languages
function globeIcon(): string {
  return `
    <circle cx="128" cy="128" r="48" fill="none" stroke="currentColor" opacity="0.85" stroke-width="3.5"/>
    <ellipse cx="128" cy="128" rx="24" ry="48" fill="none" stroke="currentColor" opacity="0.6" stroke-width="2.5"/>
    <line x1="80" y1="110" x2="176" y2="110" stroke="currentColor" opacity="0.5" stroke-width="2"/>
    <line x1="80" y1="146" x2="176" y2="146" stroke="currentColor" opacity="0.5" stroke-width="2"/>
    <line x1="128" y1="80" x2="128" y2="176" stroke="currentColor" opacity="0.4" stroke-width="2"/>
  `;
}

// Briefcase for enterprise/business
function briefcaseIcon(): string {
  return `
    <rect x="78" y="100" width="100" height="70" rx="8" fill="currentColor" opacity="0.9"/>
    <path d="M105 100 L105 88 Q105 80 113 80 L143 80 Q151 80 151 88 L151 100" fill="none" stroke="currentColor" opacity="0.7" stroke-width="3.5"/>
    <line x1="78" y1="128" x2="178" y2="128" stroke="currentColor" opacity="0.4" stroke-width="2.5"/>
    <rect x="120" y="120" width="16" height="16" rx="3" fill="currentColor" opacity="0.5"/>
  `;
}

// Shield for safety/legal
function shieldIcon(): string {
  return `
    <path d="M128 72 L80 95 L80 140 Q80 175 128 195 Q176 175 176 140 L176 95 Z" fill="currentColor" opacity="0.9"/>
    <path d="M110 132 L122 145 L150 115" fill="none" stroke="white" opacity="0.4" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  `;
}

// Heart for health/wellness
function heartIcon(): string {
  return `
    <path d="M128 165 Q80 130 80 105 Q80 80 105 80 Q120 80 128 95 Q136 80 151 80 Q176 80 176 105 Q176 130 128 165Z" fill="currentColor" opacity="0.9"/>
  `;
}

// Stethoscope
function stethoscopeIcon(): string {
  return `
    <path d="M100 85 L100 130 Q100 160 128 160 Q156 160 156 130 L156 85" fill="none" stroke="currentColor" opacity="0.85" stroke-width="5" stroke-linecap="round"/>
    <circle cx="100" cy="82" r="8" fill="currentColor" opacity="0.9"/>
    <circle cx="156" cy="82" r="8" fill="currentColor" opacity="0.9"/>
    <circle cx="156" cy="165" r="12" fill="currentColor" opacity="0.7"/>
    <circle cx="156" cy="165" r="6" fill="currentColor" opacity="0.3"/>
  `;
}

// Star for children
function starIcon(): string {
  return `
    <path d="M128 70 L140 110 L180 112 L148 138 L158 178 L128 155 L98 178 L108 138 L76 112 L116 110 Z" fill="currentColor" opacity="0.9"/>
  `;
}

// Sun for elderly/warmth
function sunIcon(): string {
  return `
    <circle cx="128" cy="128" r="30" fill="currentColor" opacity="0.9"/>
    ${[0, 45, 90, 135, 180, 225, 270, 315].map(angle => {
      const rad = (angle * Math.PI) / 180;
      const x1 = 128 + 42 * Math.cos(rad);
      const y1 = 128 + 42 * Math.sin(rad);
      const x2 = 128 + 56 * Math.cos(rad);
      const y2 = 128 + 56 * Math.sin(rad);
      return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="currentColor" opacity="0.7" stroke-width="4" stroke-linecap="round"/>`;
    }).join('\n    ')}
  `;
}

// Palette for creative
function paletteIcon(): string {
  return `
    <path d="M128 75 Q75 75 75 128 Q75 180 128 180 Q145 180 145 165 Q145 155 155 155 L165 155 Q180 155 180 140 Q180 75 128 75Z" fill="currentColor" opacity="0.85"/>
    <circle cx="105" cy="110" r="8" fill="white" opacity="0.25"/>
    <circle cx="130" cy="100" r="7" fill="white" opacity="0.2"/>
    <circle cx="155" cy="115" r="6" fill="white" opacity="0.18"/>
    <circle cx="100" cy="145" r="7" fill="white" opacity="0.22"/>
  `;
}

// Music notes
function musicIcon(): string {
  return `
    <ellipse cx="108" cy="160" rx="15" ry="12" fill="currentColor" opacity="0.9" transform="rotate(-20 108 160)"/>
    <ellipse cx="158" cy="145" rx="15" ry="12" fill="currentColor" opacity="0.9" transform="rotate(-20 158 145)"/>
    <line x1="122" y1="155" x2="122" y2="82" stroke="currentColor" opacity="0.85" stroke-width="4"/>
    <line x1="172" y1="140" x2="172" y2="72" stroke="currentColor" opacity="0.85" stroke-width="4"/>
    <path d="M122 82 Q147 70 172 72" fill="none" stroke="currentColor" opacity="0.8" stroke-width="6"/>
  `;
}

// Chef hat for food
function chefHatIcon(): string {
  return `
    <path d="M95 130 Q80 130 80 110 Q80 85 100 80 Q105 70 128 70 Q151 70 156 80 Q176 85 176 110 Q176 130 161 130Z" fill="currentColor" opacity="0.9"/>
    <rect x="95" y="130" width="66" height="38" rx="4" fill="currentColor" opacity="0.8"/>
    <line x1="105" y1="138" x2="105" y2="160" stroke="white" opacity="0.15" stroke-width="2"/>
    <line x1="120" y1="138" x2="120" y2="160" stroke="white" opacity="0.15" stroke-width="2"/>
    <line x1="135" y1="138" x2="135" y2="160" stroke="white" opacity="0.15" stroke-width="2"/>
    <line x1="150" y1="138" x2="150" y2="160" stroke="white" opacity="0.15" stroke-width="2"/>
  `;
}

// Wrench for trades
function wrenchIcon(): string {
  return `
    <path d="M155 80 Q175 80 180 100 L180 108 L170 108 L165 100 Q160 92 150 96 L96 150 Q88 158 96 166 Q104 174 112 166 L166 112 Q170 108 170 100" fill="currentColor" opacity="0.85"/>
    <circle cx="100" cy="162" r="18" fill="none" stroke="currentColor" opacity="0.6" stroke-width="3"/>
  `;
}

// Dumbbell for fitness
function dumbbellIcon(): string {
  return `
    <rect x="88" y="115" width="80" height="26" rx="13" fill="currentColor" opacity="0.9"/>
    <rect x="72" y="105" width="22" height="46" rx="5" fill="currentColor" opacity="0.85"/>
    <rect x="162" y="105" width="22" height="46" rx="5" fill="currentColor" opacity="0.85"/>
    <rect x="65" y="112" width="12" height="32" rx="4" fill="currentColor" opacity="0.7"/>
    <rect x="179" y="112" width="12" height="32" rx="4" fill="currentColor" opacity="0.7"/>
  `;
}

// Brain icon for mental health/neurodivergent
function brainIcon(): string {
  return `
    <path d="M128 80 Q100 80 95 100 Q85 100 82 115 Q80 130 88 140 Q85 152 92 162 Q100 175 115 175 L128 175" fill="currentColor" opacity="0.85"/>
    <path d="M128 80 Q156 80 161 100 Q171 100 174 115 Q176 130 168 140 Q171 152 164 162 Q156 175 141 175 L128 175" fill="currentColor" opacity="0.75"/>
    <line x1="128" y1="85" x2="128" y2="172" stroke="white" opacity="0.15" stroke-width="2"/>
  `;
}

// Laptop for coding/digital
function laptopIcon(): string {
  return `
    <rect x="85" y="85" width="86" height="60" rx="5" fill="currentColor" opacity="0.9"/>
    <rect x="91" y="91" width="74" height="48" rx="2" fill="currentColor" opacity="0.5"/>
    <path d="M72 148 L184 148 L176 162 L80 162 Z" fill="currentColor" opacity="0.8"/>
    <line x1="105" y1="108" x2="125" y2="108" stroke="white" opacity="0.2" stroke-width="2"/>
    <line x1="105" y1="116" x2="145" y2="116" stroke="white" opacity="0.15" stroke-width="2"/>
    <line x1="105" y1="124" x2="135" y2="124" stroke="white" opacity="0.15" stroke-width="2"/>
  `;
}

// Compass for navigation/travel
function compassIcon(): string {
  return `
    <circle cx="128" cy="128" r="48" fill="none" stroke="currentColor" opacity="0.85" stroke-width="3.5"/>
    <circle cx="128" cy="128" r="42" fill="none" stroke="currentColor" opacity="0.3" stroke-width="1"/>
    <path d="M128 90 L138 118 L128 128 L118 118 Z" fill="currentColor" opacity="0.9"/>
    <path d="M128 166 L138 138 L128 128 L118 138 Z" fill="currentColor" opacity="0.5"/>
    <path d="M90 128 L118 118 L128 128 L118 138 Z" fill="currentColor" opacity="0.5"/>
    <path d="M166 128 L138 138 L128 128 L138 118 Z" fill="currentColor" opacity="0.9"/>
    <circle cx="128" cy="128" r="4" fill="currentColor" opacity="0.6"/>
  `;
}

// Paw for pets
function pawIcon(): string {
  return `
    <ellipse cx="128" cy="148" rx="28" ry="22" fill="currentColor" opacity="0.9"/>
    <circle cx="105" cy="115" r="12" fill="currentColor" opacity="0.85"/>
    <circle cx="151" cy="115" r="12" fill="currentColor" opacity="0.85"/>
    <circle cx="88" cy="135" r="10" fill="currentColor" opacity="0.8"/>
    <circle cx="168" cy="135" r="10" fill="currentColor" opacity="0.8"/>
  `;
}

// Wine glass
function wineGlassIcon(): string {
  return `
    <path d="M108 85 L105 125 Q105 148 128 148 Q151 148 151 125 L148 85 Z" fill="currentColor" opacity="0.85"/>
    <line x1="128" y1="148" x2="128" y2="178" stroke="currentColor" opacity="0.8" stroke-width="4"/>
    <line x1="108" y1="178" x2="148" y2="178" stroke="currentColor" opacity="0.7" stroke-width="4" stroke-linecap="round"/>
    <path d="M108 105 Q128 115 148 105" fill="currentColor" opacity="0.3"/>
  `;
}

// House for property/DIY
function houseIcon(): string {
  return `
    <path d="M128 75 L75 120 L85 120 L85 175 L171 175 L171 120 L181 120 Z" fill="currentColor" opacity="0.9"/>
    <rect x="115" y="140" width="26" height="35" rx="2" fill="currentColor" opacity="0.4"/>
    <rect x="97" y="130" width="18" height="16" rx="2" fill="currentColor" opacity="0.3"/>
    <rect x="141" y="130" width="18" height="16" rx="2" fill="currentColor" opacity="0.3"/>
  `;
}

// Pen/quill for writing
function quillIcon(): string {
  return `
    <path d="M160 72 Q175 72 178 85 L118 165 L105 175 L108 160 L160 90 Q160 85 155 82 Z" fill="currentColor" opacity="0.9"/>
    <line x1="145" y1="95" x2="125" y2="155" stroke="white" opacity="0.15" stroke-width="2"/>
    <path d="M105 175 L95 180 L100 170 Z" fill="currentColor" opacity="0.7"/>
  `;
}

// Scales for legal
function scalesIcon(): string {
  return `
    <line x1="128" y1="75" x2="128" y2="178" stroke="currentColor" opacity="0.85" stroke-width="4"/>
    <line x1="80" y1="105" x2="176" y2="105" stroke="currentColor" opacity="0.85" stroke-width="4" stroke-linecap="round"/>
    <path d="M70 140 L80 105 L90 140 Q80 155 70 140Z" fill="currentColor" opacity="0.7"/>
    <path d="M166 130 L176 105 L186 130 Q176 145 166 130Z" fill="currentColor" opacity="0.7"/>
    <line x1="108" y1="178" x2="148" y2="178" stroke="currentColor" opacity="0.7" stroke-width="4" stroke-linecap="round"/>
    <circle cx="128" cy="78" r="6" fill="currentColor" opacity="0.8"/>
  `;
}

// Microphone for speaking/singing
function microphoneIcon(): string {
  return `
    <rect x="115" y="78" width="26" height="52" rx="13" fill="currentColor" opacity="0.9"/>
    <path d="M95 115 Q95 150 128 150 Q161 150 161 115" fill="none" stroke="currentColor" opacity="0.7" stroke-width="4"/>
    <line x1="128" y1="150" x2="128" y2="175" stroke="currentColor" opacity="0.7" stroke-width="4"/>
    <line x1="108" y1="175" x2="148" y2="175" stroke="currentColor" opacity="0.6" stroke-width="4" stroke-linecap="round"/>
  `;
}

// Camera for photography
function cameraIcon(): string {
  return `
    <rect x="78" y="100" width="100" height="68" rx="8" fill="currentColor" opacity="0.9"/>
    <path d="M105 100 L112 85 L144 85 L151 100" fill="currentColor" opacity="0.8"/>
    <circle cx="128" cy="134" r="22" fill="currentColor" opacity="0.5"/>
    <circle cx="128" cy="134" r="15" fill="currentColor" opacity="0.3"/>
    <circle cx="128" cy="134" r="6" fill="white" opacity="0.1"/>
    <circle cx="162" cy="108" r="5" fill="currentColor" opacity="0.5"/>
  `;
}

// Flower for gardening
function flowerIcon(): string {
  return `
    <circle cx="128" cy="115" r="15" fill="currentColor" opacity="0.9"/>
    ${[0, 60, 120, 180, 240, 300].map(angle => {
      const rad = (angle * Math.PI) / 180;
      const cx = 128 + 22 * Math.cos(rad);
      const cy = 115 + 22 * Math.sin(rad);
      return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="13" fill="currentColor" opacity="0.65"/>`;
    }).join('\n    ')}
    <line x1="128" y1="130" x2="128" y2="180" stroke="currentColor" opacity="0.7" stroke-width="4"/>
    <path d="M128 155 Q140 145 148 150" fill="none" stroke="currentColor" opacity="0.5" stroke-width="3"/>
  `;
}

// Baby rattle for toddlers
function rattleIcon(): string {
  return `
    <circle cx="128" cy="100" r="32" fill="currentColor" opacity="0.9"/>
    <circle cx="115" cy="92" r="6" fill="white" opacity="0.15"/>
    <circle cx="140" cy="95" r="5" fill="white" opacity="0.12"/>
    <circle cx="125" cy="110" r="4" fill="white" opacity="0.1"/>
    <line x1="128" y1="132" x2="128" y2="180" stroke="currentColor" opacity="0.8" stroke-width="6" stroke-linecap="round"/>
  `;
}

// Pill for medication
function pillIcon(): string {
  return `
    <rect x="100" y="85" width="56" height="86" rx="28" fill="currentColor" opacity="0.9" transform="rotate(-30 128 128)"/>
    <line x1="100" y1="128" x2="156" y2="128" stroke="white" opacity="0.15" stroke-width="2" transform="rotate(-30 128 128)"/>
  `;
}

// Chart for data/analytics
function chartIcon(): string {
  return `
    <line x1="80" y1="175" x2="180" y2="175" stroke="currentColor" opacity="0.7" stroke-width="3"/>
    <line x1="80" y1="80" x2="80" y2="175" stroke="currentColor" opacity="0.7" stroke-width="3"/>
    <rect x="92" y="130" width="18" height="45" rx="3" fill="currentColor" opacity="0.7"/>
    <rect x="116" y="100" width="18" height="75" rx="3" fill="currentColor" opacity="0.85"/>
    <rect x="140" y="115" width="18" height="60" rx="3" fill="currentColor" opacity="0.75"/>
    <rect x="164" y="90" width="18" height="85" rx="3" fill="currentColor" opacity="0.9"/>
  `;
}

// Gamepad for entertainment
function gamepadIcon(): string {
  return `
    <path d="M80 115 Q80 95 100 95 L156 95 Q176 95 176 115 L176 140 Q176 165 156 165 L145 165 L135 180 L120 180 L110 165 L100 165 Q80 165 80 140 Z" fill="currentColor" opacity="0.9"/>
    <line x1="105" y1="120" x2="105" y2="140" stroke="white" opacity="0.2" stroke-width="3"/>
    <line x1="95" y1="130" x2="115" y2="130" stroke="white" opacity="0.2" stroke-width="3"/>
    <circle cx="148" cy="122" r="5" fill="white" opacity="0.2"/>
    <circle cx="158" cy="132" r="5" fill="white" opacity="0.2"/>
  `;
}

// Lotus for meditation/yoga
function lotusIcon(): string {
  return `
    <path d="M128 170 Q100 150 95 120 Q90 90 128 80 Q166 90 161 120 Q156 150 128 170Z" fill="currentColor" opacity="0.6"/>
    <path d="M128 170 Q80 145 75 115 Q72 95 100 90" fill="none" stroke="currentColor" opacity="0.85" stroke-width="3"/>
    <path d="M128 170 Q176 145 181 115 Q184 95 156 90" fill="none" stroke="currentColor" opacity="0.85" stroke-width="3"/>
    <path d="M128 170 Q60 155 60 125" fill="none" stroke="currentColor" opacity="0.5" stroke-width="2.5"/>
    <path d="M128 170 Q196 155 196 125" fill="none" stroke="currentColor" opacity="0.5" stroke-width="2.5"/>
  `;
}

// Running figure for fitness
function runnerIcon(): string {
  return `
    <circle cx="142" cy="82" r="14" fill="currentColor" opacity="0.9"/>
    <path d="M135 96 L125 130 L105 155" fill="none" stroke="currentColor" opacity="0.85" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M125 130 L150 160" fill="none" stroke="currentColor" opacity="0.85" stroke-width="5" stroke-linecap="round"/>
    <path d="M135 96 L155 110 L175 105" fill="none" stroke="currentColor" opacity="0.85" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M135 96 L110 115" fill="none" stroke="currentColor" opacity="0.85" stroke-width="5" stroke-linecap="round"/>
  `;
}

// Car/steering wheel for driving
function steeringWheelIcon(): string {
  return `
    <circle cx="128" cy="128" r="48" fill="none" stroke="currentColor" opacity="0.85" stroke-width="5"/>
    <circle cx="128" cy="128" r="12" fill="currentColor" opacity="0.8"/>
    <line x1="128" y1="116" x2="128" y2="85" stroke="currentColor" opacity="0.7" stroke-width="4" stroke-linecap="round"/>
    <line x1="118" y1="138" x2="92" y2="158" stroke="currentColor" opacity="0.7" stroke-width="4" stroke-linecap="round"/>
    <line x1="138" y1="138" x2="164" y2="158" stroke="currentColor" opacity="0.7" stroke-width="4" stroke-linecap="round"/>
  `;
}

// Handshake for B2B/partnership roles
function handshakeIcon(): string {
  return `
    <path d="M75 120 L95 100 L120 100 L128 108 L136 100 L161 100 L181 120 L161 140 L128 140 L95 140 Z" fill="currentColor" opacity="0.85"/>
    <path d="M120 118 L140 118" stroke="white" opacity="0.2" stroke-width="3" stroke-linecap="round"/>
    <path d="M108 128 L148 128" stroke="white" opacity="0.15" stroke-width="2" stroke-linecap="round"/>
  `;
}

// Pregnancy/baby bump
function pregnancyIcon(): string {
  return `
    <circle cx="128" cy="90" r="18" fill="currentColor" opacity="0.9"/>
    <path d="M115 108 Q110 135 115 160 Q120 175 140 175 Q155 175 152 155 Q148 130 142 108" fill="currentColor" opacity="0.8"/>
    <path d="M115 135 Q125 145 142 138" fill="none" stroke="white" opacity="0.12" stroke-width="2"/>
  `;
}

// Clipboard/checklist
function clipboardIcon(): string {
  return `
    <rect x="92" y="85" width="72" height="95" rx="6" fill="currentColor" opacity="0.9"/>
    <rect x="112" y="78" width="32" height="14" rx="4" fill="currentColor" opacity="0.6"/>
    <line x1="108" y1="112" x2="148" y2="112" stroke="white" opacity="0.18" stroke-width="2.5"/>
    <line x1="108" y1="126" x2="142" y2="126" stroke="white" opacity="0.15" stroke-width="2.5"/>
    <line x1="108" y1="140" x2="148" y2="140" stroke="white" opacity="0.18" stroke-width="2.5"/>
    <line x1="108" y1="154" x2="135" y2="154" stroke="white" opacity="0.15" stroke-width="2.5"/>
  `;
}

// ---------------------------------------------------------------------------
// Role -> Icon mapping
// Maps role slugs (or patterns) to appropriate icon functions
// ---------------------------------------------------------------------------

function getIconForRole(slug: string, category: string, subcategory?: string): string {
  // Language tutors -> globe
  if (slug.includes('-language-tutor') || slug === 'sign-language-tutor') return globeIcon();

  // Specific role matches (most specific first)
  const iconMap: Record<string, () => string> = {
    // Education - specific subjects
    'a-level-biology-tutor': () => stethoscopeIcon(),
    'a-level-chemistry-tutor': () => bookIcon(),
    'a-level-computer-science-tutor': () => laptopIcon(),
    'a-level-economics-tutor': () => chartIcon(),
    'a-level-english-literature-tutor': () => quillIcon(),
    'a-level-further-maths-tutor': () => gradCapIcon(),
    'a-level-history-tutor': () => bookIcon(),
    'a-level-maths-tutor': () => gradCapIcon(),
    'a-level-physics-tutor': () => compassIcon(),
    'a-level-psychology-tutor': () => brainIcon(),
    'academic-writing-coach': () => quillIcon(),
    'acca-study-companion': () => chartIcon(),
    'art-tutor': () => paletteIcon(),
    'coding-tutor-beginner': () => laptopIcon(),
    'construction-management': () => houseIcon(),
    'chartered-surveyor-rics': () => houseIcon(),
    'cfa-study-companion': () => chartIcon(),
    'digital-literacy-coach': () => laptopIcon(),
    'dissertation-advisor': () => bookIcon(),
    'driving-theory-coach': () => steeringWheelIcon(),
    'electrician-theory': () => wrenchIcon(),
    'eleven-plus-coach': () => gradCapIcon(),
    'essay-writing-tutor': () => quillIcon(),
    'excel-tutor': () => chartIcon(),
    'gcse-computing-tutor': () => laptopIcon(),
    'gcse-design-technology-tutor': () => wrenchIcon(),
    'gcse-english-tutor': () => bookIcon(),
    'gcse-geography-tutor': () => globeIcon(),
    'gcse-history-tutor': () => bookIcon(),
    'gcse-maths-tutor': () => gradCapIcon(),
    'gcse-science-tutor': () => bookIcon(),
    'it-support-apprenticeship': () => laptopIcon(),
    'mba-corporate-finance-mentor': () => chartIcon(),
    'mba-marketing-mentor': () => chartIcon(),
    'mba-strategy-mentor': () => briefcaseIcon(),
    'music-theory-tutor': () => musicIcon(),
    'nursing-student-companion': () => stethoscopeIcon(),
    'open-university-assignment-coach': () => bookIcon(),
    'open-university-study-mentor': () => gradCapIcon(),
    'paramedic-science-companion': () => stethoscopeIcon(),
    'plumbing-theory': () => wrenchIcon(),
    'primary-homework-helper': () => bookIcon(),
    'primary-reading-coach': () => bookIcon(),
    'sqe-companion': () => scalesIcon(),
    'study-skills-coach': () => gradCapIcon(),
    'university-personal-statement-coach': () => quillIcon(),

    // Health & Wellness
    'accessibility-companion': () => heartIcon(),
    'adhd-coach': () => brainIcon(),
    'autism-support-companion': () => brainIcon(),
    'between-visit-health-companion': () => stethoscopeIcon(),
    'dog-training-advisor': () => pawIcon(),
    'fitness-nutrition-coach': () => dumbbellIcon(),
    'grief-bereavement-companion': () => heartIcon(),
    'grief-counsellor': () => heartIcon(),
    'martial-arts-coach': () => runnerIcon(),
    'menopause-midlife-companion': () => heartIcon(),
    'mental-wellness-companion': () => brainIcon(),
    'neurodivergent-life-coach': () => brainIcon(),
    'personal-trainer': () => dumbbellIcon(),
    'pet-health-advisor': () => pawIcon(),
    'physio-recovery-guide': () => runnerIcon(),
    'registered-dietitian': () => heartIcon(),
    'rehabilitation-companion': () => heartIcon(),
    'running-coach': () => runnerIcon(),
    'sleep-coach': () => lotusIcon(),
    'stress-management-coach': () => lotusIcon(),
    'swimming-coach': () => runnerIcon(),
    'womens-health-specialist': () => heartIcon(),
    'yoga-instructor': () => lotusIcon(),
    'meditation-guide': () => lotusIcon(),
    'pregnancy-companion': () => pregnancyIcon(),

    // Enterprise
    'b2b-ceo': () => briefcaseIcon(),
    'b2b-cfo': () => chartIcon(),
    'b2b-chro': () => personBust(),
    'b2b-cmo': () => chartIcon(),
    'b2b-code-reviewer': () => laptopIcon(),
    'b2b-compliance-officer': () => shieldIcon(),
    'b2b-content-strategist': () => quillIcon(),
    'b2b-coo': () => clipboardIcon(),
    'b2b-cto': () => laptopIcon(),
    'b2b-customer-success-manager': () => handshakeIcon(),
    'b2b-data-analyst': () => chartIcon(),
    'b2b-devops-engineer': () => laptopIcon(),
    'b2b-email-assistant': () => clipboardIcon(),
    'b2b-engineering-manager': () => wrenchIcon(),
    'b2b-finance-manager': () => chartIcon(),
    'b2b-growth-hacker': () => chartIcon(),
    'b2b-hr-manager': () => personBust(),
    'b2b-legal-counsel': () => scalesIcon(),
    'b2b-marketing-manager': () => chartIcon(),
    'b2b-meeting-assistant': () => clipboardIcon(),
    'b2b-product-manager': () => clipboardIcon(),
    'b2b-project-manager': () => clipboardIcon(),
    'b2b-qa-lead': () => shieldIcon(),
    'b2b-report-generator': () => chartIcon(),
    'b2b-research-analyst': () => chartIcon(),
    'b2b-sales-director': () => handshakeIcon(),
    'b2b-security-analyst': () => shieldIcon(),
    'b2b-solutions-architect': () => laptopIcon(),
    'b2b-technical-writer': () => quillIcon(),
    'b2b-ux-researcher': () => personBust(),
    'b2b-business-analyst': () => chartIcon(),

    // Children's
    'bedtime-story-companion': () => starIcon(),
    'creative-play-partner': () => paletteIcon(),
    'curiosity-companion': () => starIcon(),
    'science-explorer': () => compassIcon(),
    'teen-mentor': () => personBust(),
    'toddler-learning-companion': () => rattleIcon(),
    'interactive-quiz-companion': () => gamepadIcon(),

    // Elderly Care
    'daily-companion': () => sunIcon(),
    'family-connection-helper': () => heartIcon(),
    'medication-reminder': () => pillIcon(),
    'memory-support-companion': () => brainIcon(),

    // Legal & Financial
    'crypto-basics-advisor': () => chartIcon(),
    'mortgage-advisor': () => houseIcon(),
    'personal-finance-coach': () => chartIcon(),
    'small-business-advisor': () => briefcaseIcon(),
    'tax-advisor': () => scalesIcon(),
    'tenant-rights-advisor': () => shieldIcon(),
    'uk-employment-rights-advisor': () => scalesIcon(),
    'separation-divorce-navigator': () => scalesIcon(),

    // Creative & Professional
    'career-counsellor': () => compassIcon(),
    'creative-writing-mentor': () => quillIcon(),
    'cv-interview-coach': () => clipboardIcon(),
    'diy-advisor': () => wrenchIcon(),
    'gardening-advisor': () => flowerIcon(),
    'guitar-teacher': () => musicIcon(),
    'interior-design-advisor': () => houseIcon(),
    'parenting-advisor': () => heartIcon(),
    'photography-mentor': () => cameraIcon(),
    'piano-teacher': () => musicIcon(),
    'public-speaking-coach': () => microphoneIcon(),
    'singing-coach': () => microphoneIcon(),

    // Food & Lifestyle
    'home-chef-mentor': () => chefHatIcon(),
    'restaurant-advisor': () => chefHatIcon(),
    'travel-planner': () => compassIcon(),
    'wine-sommelier': () => wineGlassIcon(),

    // Productivity
    'executive-personal-assistant': () => clipboardIcon(),
    'family-personal-assistant': () => clipboardIcon(),
  };

  if (iconMap[slug]) return iconMap[slug]();

  // Category-based fallbacks
  switch (category) {
    case 'education': return bookIcon();
    case 'health-wellness': return heartIcon();
    case 'enterprise': return briefcaseIcon();
    case 'childrens': return starIcon();
    case 'elderly-care': return sunIcon();
    case 'legal-financial': return scalesIcon();
    case 'creative-professional':
    case 'creative': return paletteIcon();
    case 'food-lifestyle': return chefHatIcon();
    case 'productivity': return clipboardIcon();
    case 'entertainment': return gamepadIcon();
    case 'life-navigation': return compassIcon();
    default: return personBust();
  }
}

// ---------------------------------------------------------------------------
// SVG Generator
// ---------------------------------------------------------------------------

function generateAvatarSvg(
  slug: string,
  name: string,
  category: string,
  subcategory?: string,
): string {
  const colors = getColorScheme(category);
  const icon = getIconForRole(slug, category, subcategory);
  const initials = name
    .split(' ')
    .map((w) => w.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();

  // Generate a deterministic rotation angle from the slug for variety
  const hashVal = slug.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const gradientAngle = (hashVal % 60) + 130; // 130-190 range

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <linearGradient id="bg-${slug}" x1="0%" y1="0%" x2="100%" y2="100%" gradientTransform="rotate(${gradientAngle} 128 128)">
      <stop offset="0%" stop-color="${colors.primary}"/>
      <stop offset="100%" stop-color="${colors.gradientStop}"/>
    </linearGradient>
    <linearGradient id="shine-${slug}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="white" stop-opacity="0.12"/>
      <stop offset="50%" stop-color="white" stop-opacity="0.03"/>
      <stop offset="100%" stop-color="black" stop-opacity="0.08"/>
    </linearGradient>
    <clipPath id="circle-${slug}">
      <circle cx="128" cy="128" r="128"/>
    </clipPath>
  </defs>

  <!-- Background circle -->
  <circle cx="128" cy="128" r="128" fill="url(#bg-${slug})"/>

  <!-- Subtle pattern ring -->
  <circle cx="128" cy="128" r="120" fill="none" stroke="white" stroke-opacity="0.06" stroke-width="1"/>
  <circle cx="128" cy="128" r="110" fill="none" stroke="white" stroke-opacity="0.03" stroke-width="0.5"/>

  <!-- Icon silhouette -->
  <g clip-path="url(#circle-${slug})" color="white">
    ${icon}
  </g>

  <!-- Gradient shine overlay -->
  <circle cx="128" cy="128" r="128" fill="url(#shine-${slug})"/>

  <!-- Subtle border -->
  <circle cx="128" cy="128" r="126" fill="none" stroke="white" stroke-opacity="0.1" stroke-width="1.5"/>
</svg>`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

interface RoleJson {
  slug: string;
  name: string;
  category: string;
  subcategory?: string;
}

async function main() {
  const rolesDir = path.resolve(__dirname, '..', 'src', 'data', 'roles');
  const outputDir = path.resolve(__dirname, '..', 'public', 'avatars', 'roles');

  // Ensure output directory exists
  fs.mkdirSync(outputDir, { recursive: true });

  // Read all role JSON files
  const roleFiles = fs
    .readdirSync(rolesDir)
    .filter((f) => f.endsWith('.json') && !f.startsWith('_'))
    .sort();

  let generated = 0;
  let skipped = 0;

  for (const file of roleFiles) {
    const raw = fs.readFileSync(path.join(rolesDir, file), 'utf8');
    const role: RoleJson = JSON.parse(raw);

    const svg = generateAvatarSvg(role.slug, role.name, role.category, role.subcategory);
    const outputPath = path.join(outputDir, `${role.slug}.svg`);

    fs.writeFileSync(outputPath, svg, 'utf8');
    generated++;
    console.log(`  [OK] ${role.slug}.svg (${role.category})`);
  }

  console.log(`\nGenerated ${generated} avatars, skipped ${skipped}.`);
  console.log(`Output: ${outputDir}`);
}

main().catch((err) => {
  console.error('Failed to generate avatars:', err);
  process.exit(1);
});
