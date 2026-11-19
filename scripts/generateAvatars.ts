import fs from 'fs';
import path from 'path';
import { SEED_PROFILES } from '../src/server/db/seedData';

const avatarsDir = path.resolve(process.cwd(), 'public/avatars');
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

// 12 distinct color palettes for avatars (skin tones, hair, backgrounds, accessories)
const palettes = [
  { bg1: '#FF5F6D', bg2: '#FFC371', skin: '#F8D9C0', hair: '#2C1B18', accent: '#4A90E2', hairType: 'long-wavy' },
  { bg1: '#36D1DC', bg2: '#5B86E5', skin: '#D09B77', hair: '#1A1A1A', accent: '#FF6B6B', hairType: 'short-curly' },
  { bg1: '#834D9B', bg2: '#D04ED6', skin: '#FADBC8', hair: '#D4AF37', accent: '#1DD1A1', hairType: 'bob' },
  { bg1: '#11998E', bg2: '#38EF7D', skin: '#8D5524', hair: '#111111', accent: '#FFA502', hairType: 'fade' },
  { bg1: '#F857A6', bg2: '#FF5858', skin: '#E0AC69', hair: '#3D2314', accent: '#54A0FF', hairType: 'updo' },
  { bg1: '#4776E6', bg2: '#8E54E9', skin: '#F5C6A5', hair: '#4E3629', accent: '#FF9FF3', hairType: 'side-part' },
  { bg1: '#00B4DB', bg2: '#0083B0', skin: '#C68642', hair: '#211C1D', accent: '#FECA57', hairType: 'afro' },
  { bg1: '#F12711', bg2: '#F5AF19', skin: '#FFE0BD', hair: '#8B4513', accent: '#48DBFB', hairType: 'messy' },
  { bg1: '#654EA3', bg2: '#EAAFC8', skin: '#EEC39A', hair: '#1C1C1C', accent: '#10AC84', hairType: 'bun' },
  { bg1: '#1D976C', bg2: '#93F9B9', skin: '#A1665E', hair: '#0B0B0B', accent: '#EE5253', hairType: 'dreads' },
  { bg1: '#2C3E50', bg2: '#4CA1AF', skin: '#F9D5BB', hair: '#654321', accent: '#F368E0', hairType: 'buzz' },
  { bg1: '#FF416C', bg2: '#FF4B2B', skin: '#D89568', hair: '#2E1D10', accent: '#00D2D3', hairType: 'curls' },
];

function generateSVG(name: string, id: string, index: number): string {
  const p = palettes[index % palettes.length];
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad_${id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${p.bg1}" />
      <stop offset="100%" stop-color="${p.bg2}" />
    </linearGradient>
    <linearGradient id="overlayGrad_${id}" x1="0%" y1="60%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(0,0,0,0)" />
      <stop offset="100%" stop-color="rgba(15,17,21,0.95)" />
    </linearGradient>
    <filter id="shadow_${id}" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000" flood-opacity="0.3"/>
    </filter>
  </defs>

  <!-- Background Canvas -->
  <rect width="400" height="500" fill="url(#bgGrad_${id})" />

  <!-- Subtle geometric accent shapes in background -->
  <circle cx="340" cy="80" r="90" fill="white" opacity="0.12" />
  <circle cx="60" cy="380" r="120" fill="white" opacity="0.08" />
  <path d="M-20,150 Q100,50 250,160 T450,140" fill="none" stroke="white" stroke-width="2" opacity="0.15" />

  <!-- Portrait Silhouette Group with Shadow -->
  <g filter="url(#shadow_${id})">
    <!-- Body / Torso -->
    <path d="M90,500 C90,410 120,365 200,365 C280,365 310,410 310,500 Z" fill="${p.accent}" />
    <!-- Neck -->
    <rect x="175" y="305" width="50" height="75" rx="10" fill="${p.skin}" />
    <!-- Head Base -->
    <ellipse cx="200" cy="235" rx="65" ry="80" fill="${p.skin}" />

    <!-- Hair Silhouette (Stylized) -->
    ${
      p.hairType === 'long-wavy'
        ? `<path d="M130,240 C120,150 160,120 200,120 C240,120 280,150 270,240 C280,310 270,390 260,420 C245,420 250,340 245,280 C240,230 230,150 200,150 C170,150 160,230 155,280 C150,340 155,420 140,420 C130,390 120,310 130,240 Z" fill="${p.hair}" />`
        : p.hairType === 'afro'
        ? `<ellipse cx="200" cy="215" rx="90" ry="100" fill="${p.hair}" /><ellipse cx="200" cy="235" rx="65" ry="80" fill="${p.skin}" />`
        : p.hairType === 'bob'
        ? `<path d="M125,230 C125,130 160,120 200,120 C240,120 275,130 275,230 C280,290 260,320 250,330 C250,270 240,160 200,160 C160,160 150,270 150,330 C140,320 120,290 125,230 Z" fill="${p.hair}" />`
        : `<path d="M135,210 C140,130 170,120 200,120 C235,120 265,130 265,195 C250,175 230,165 200,165 C170,165 150,175 135,210 Z" fill="${p.hair}" />`
    }

    <!-- Eyes (Minimalist modern aesthetic) -->
    <circle cx="178" cy="232" r="5" fill="#1A1A1A" />
    <circle cx="222" cy="232" r="5" fill="#1A1A1A" />
    <!-- Cheerful Expression / Smile -->
    <path d="M188,266 Q200,278 212,266" fill="none" stroke="#222" stroke-width="3" stroke-linecap="round" />
    <!-- Blushing cheeks -->
    <circle cx="168" cy="250" r="10" fill="#FF5252" opacity="0.3" />
    <circle cx="232" cy="250" r="10" fill="#FF5252" opacity="0.3" />

    <!-- Eyebrows -->
    <path d="M170,220 Q180,214 190,219" fill="none" stroke="${p.hair}" stroke-width="2.5" stroke-linecap="round" />
    <path d="M210,219 Q220,214 230,220" fill="none" stroke="${p.hair}" stroke-width="2.5" stroke-linecap="round" />
  </g>

  <!-- Initials Badge in Top-Right -->
  <g transform="translate(325, 25)">
    <circle cx="20" cy="20" r="20" fill="rgba(0,0,0,0.3)" />
    <text x="20" y="25" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#FFF" text-anchor="middle" letter-spacing="1">${initials}</text>
  </g>

  <!-- Bottom Dark Gradient for Text Legibility -->
  <rect y="250" width="400" height="250" fill="url(#overlayGrad_${id})" />
</svg>`;
}

SEED_PROFILES.forEach((profile, index) => {
  const filename = `avatar-${index + 1}.svg`;
  const filePath = path.join(avatarsDir, filename);
  fs.writeFileSync(filePath, generateSVG(profile.name, profile.id, index), 'utf8');
});

// Also create avatar for logged-in user Alex Rivera
const userAvatarPath = path.join(avatarsDir, 'user-alex.svg');
fs.writeFileSync(userAvatarPath, generateSVG('Alex Rivera', 'user-alex', 8), 'utf8');

console.log(`Generated ${SEED_PROFILES.length + 1} SVG avatars successfully in public/avatars/`);
