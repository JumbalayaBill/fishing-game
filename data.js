// ============================================================
// ArtsFisker - Spilldata
// Arter, steder, agn og konfigurasjon
// Alle artsdata hentet fra dev-api.artsfiske.com/getallfish
// Medalje-grenser i gram, vekter i gram
// ============================================================

const LOCATIONS = [
    {
        id: 'lake',
        name: 'Fjellvatnet',
        description: 'Et stille fjellvann omgitt av bjørkeskog. Hjem for abbor, gjedde og ørret.',
        icon: '🏔️',
        type: 'fw',
        unlocked: true,
        castCount: 12,
        skyColor: '#87CEEB',
        waterColor: '#2E6B8A',
        waterDeepColor: '#1A4A63',
        treeLine: true
    },
    {
        id: 'river',
        name: 'Lakseelva',
        description: 'En stri elv kjent for laksefiske. Fluefiskerens paradis.',
        icon: '🌊',
        type: 'fw',
        unlocked: true,
        castCount: 10,
        skyColor: '#9BC4E2',
        waterColor: '#3A7CA5',
        waterDeepColor: '#1E5578',
        treeLine: true,
        hasCurrents: true
    },
    {
        id: 'fjord',
        name: 'Vestfjorden',
        description: 'Dype fjordvann med bratte fjellsider. Rikt marint liv.',
        icon: '⛰️',
        type: 'sw',
        unlocked: false,
        unlockCost: 200,
        unlockSpecies: 8,
        castCount: 10,
        skyColor: '#8BA4B8',
        waterColor: '#1B4F72',
        waterDeepColor: '#0E3352',
        mountains: true
    },
    {
        id: 'ocean',
        name: 'Nordsjøen',
        description: 'Det åpne havet. Store fisker lurer i dypet, men forholdene er tøffe.',
        icon: '🌊',
        type: 'sw',
        unlocked: false,
        unlockCost: 500,
        unlockSpecies: 15,
        castCount: 8,
        skyColor: '#6B8BA4',
        waterColor: '#0D3B66',
        waterDeepColor: '#071E33',
        openSea: true
    }
];

const BAITS = [
    {
        id: 'worm',
        name: 'Mark',
        icon: '🪱',
        description: 'Allsidig ferskvannsagn. Lokker de fleste arter.',
        cost: 0,
        unlocked: true,
        effectiveness: { fw: 0.8, sw: 0.3 },
        attracts: ['abbor', 'oerret', 'mort', 'brasme', 'roye', 'sik', 'soerv', 'karuss', 'lake', 'harr', 'bekkeroeye']
    },
    {
        id: 'spinner',
        name: 'Sluk',
        icon: '🔩',
        description: 'Metallsluk for rovfisk. Perfekt for gjedde og stor abbor.',
        cost: 0,
        unlocked: true,
        effectiveness: { fw: 0.7, sw: 0.5 },
        attracts: ['gjedde', 'abbor', 'oerret', 'laks', 'gjoers', 'lyr', 'sei', 'makrell', 'havabbor']
    },
    {
        id: 'fly',
        name: 'Flue',
        icon: '🪶',
        description: 'Kunstig flue. Våpenet i elva.',
        cost: 50,
        unlocked: false,
        effectiveness: { fw: 0.9, sw: 0.1 },
        attracts: ['laks', 'oerret', 'harr', 'roye', 'bekkeroeye']
    },
    {
        id: 'shrimp',
        name: 'Reke',
        icon: '🦐',
        description: 'Ferske reker. Uimotståelig for mange saltvannsarter.',
        cost: 50,
        unlocked: false,
        effectiveness: { fw: 0.2, sw: 0.9 },
        attracts: ['torsk', 'lyr', 'berggylte', 'skrubbe', 'hyse', 'roedspette', 'havabbor', 'lysing', 'piggvar']
    },
    {
        id: 'jig',
        name: 'Pilk',
        icon: '🎣',
        description: 'Tung metallpilk for dypt vann. Når de store.',
        cost: 100,
        unlocked: false,
        effectiveness: { fw: 0.1, sw: 0.8 },
        attracts: ['torsk', 'sei', 'lange', 'brosme', 'kveite', 'graasteinbit', 'lysing']
    },
    {
        id: 'mackerel',
        name: 'Makrellagn',
        icon: '🐟',
        description: 'Makrellfilét. Lokker havets største rovdyr.',
        cost: 150,
        unlocked: false,
        effectiveness: { fw: 0.0, sw: 1.0 },
        attracts: ['kveite', 'lange', 'brosme', 'breiflabb', 'haval', 'pigghaa', 'piggskate', 'haakjerring']
    }
];

const TIME_OF_DAY = [
    { id: 'dawn', name: 'Daggry', icon: '🌅', multiplier: 1.3, description: 'Fisken er aktiv og sulten ved daggry.' },
    { id: 'day', name: 'Dag', icon: '☀️', multiplier: 1.0, description: 'Normale fiskeforhold.' },
    { id: 'dusk', name: 'Skumring', icon: '🌇', multiplier: 1.4, description: 'Beste bitetid. Høyest sjanse for napp.' },
    { id: 'night', name: 'Natt', icon: '🌙', multiplier: 1.1, description: 'Roligere, men noen arter er nattaktive.' }
];

// Fiskearter - basert på ekte data fra artsfiske.com API
// Medalje-grenser og rekordvekter i gram
// Kun arter som er faktisk fanget på artsfiske.com
const FISH_SPECIES = [
    // === FERSKVANN - INNSJØ ===
    {
        id: 'abbor', name: 'Abbor',
        type: 'fw', locations: ['lake', 'river'],
        minWeight: 50, maxWeight: 3000, recordWeight: 5000,
        minLength: 12, maxLength: 50,
        bronzeLimit: 500, silverLimit: 1000, goldLimit: 1500,
        rarity: 0.35, difficulty: 2,
        color: '#5D8A3C', stripeColor: '#2D4A1C',
        bodyShape: 'perch', hasStripes: true
    },
    {
        id: 'gjedde', name: 'Gjedde',
        type: 'fw', locations: ['lake'],
        minWeight: 300, maxWeight: 12000, recordWeight: 17650,
        minLength: 35, maxLength: 129,
        bronzeLimit: 7000, silverLimit: 10000, goldLimit: 14000,
        rarity: 0.18, difficulty: 7,
        color: '#4A6B3A', stripeColor: '#8BAF6A',
        bodyShape: 'pike', aggressive: true
    },
    {
        id: 'oerret', name: 'Ørret',
        type: 'fw', locations: ['lake', 'river'],
        minWeight: 100, maxWeight: 5000, recordWeight: 9300,
        minLength: 18, maxLength: 93,
        bronzeLimit: 1500, silverLimit: 3000, goldLimit: 5000,
        rarity: 0.25, difficulty: 5,
        color: '#B8860B', stripeColor: '#CD5C5C',
        bodyShape: 'salmonid', hasSpots: true
    },
    {
        id: 'roye', name: 'Røye',
        type: 'fw', locations: ['lake'],
        minWeight: 50, maxWeight: 4000, recordWeight: 7680,
        minLength: 12, maxLength: 65,
        bronzeLimit: 1500, silverLimit: 3000, goldLimit: 5000,
        rarity: 0.18, difficulty: 4,
        color: '#C76B4A', stripeColor: '#FF6347',
        bodyShape: 'salmonid', hasSpots: true
    },
    {
        id: 'sik', name: 'Sik',
        type: 'fw', locations: ['lake'],
        minWeight: 100, maxWeight: 2000, recordWeight: 3050,
        minLength: 18, maxLength: 66,
        bronzeLimit: 1000, silverLimit: 1500, goldLimit: 2000,
        rarity: 0.18, difficulty: 3,
        color: '#C0C0C0', stripeColor: '#A0A0A0',
        bodyShape: 'salmonid'
    },
    {
        id: 'mort', name: 'Mort',
        type: 'fw', locations: ['lake'],
        minWeight: 20, maxWeight: 700, recordWeight: 1120,
        minLength: 8, maxLength: 44,
        bronzeLimit: 500, silverLimit: 600, goldLimit: 800,
        rarity: 0.35, difficulty: 1,
        color: '#A0A0A0', stripeColor: '#CD5C5C',
        bodyShape: 'round'
    },
    {
        id: 'brasme', name: 'Brasme',
        type: 'fw', locations: ['lake'],
        minWeight: 150, maxWeight: 3500, recordWeight: 4580,
        minLength: 20, maxLength: 70,
        bronzeLimit: 2000, silverLimit: 3000, goldLimit: 4000,
        rarity: 0.15, difficulty: 3,
        color: '#8B7355', stripeColor: '#6B5335',
        bodyShape: 'deep'
    },
    {
        id: 'soerv', name: 'Sørv',
        type: 'fw', locations: ['lake'],
        minWeight: 30, maxWeight: 1000, recordWeight: 1460,
        minLength: 8, maxLength: 43,
        bronzeLimit: 800, silverLimit: 1000, goldLimit: 1200,
        rarity: 0.15, difficulty: 1,
        color: '#DAA520', stripeColor: '#FF4500',
        bodyShape: 'round'
    },
    {
        id: 'karuss', name: 'Karuss',
        type: 'fw', locations: ['lake'],
        minWeight: 50, maxWeight: 1500, recordWeight: 2220,
        minLength: 10, maxLength: 45,
        bronzeLimit: 1000, silverLimit: 1500, goldLimit: 1800,
        rarity: 0.1, difficulty: 2,
        color: '#DAA520', stripeColor: '#B8860B',
        bodyShape: 'deep'
    },
    {
        id: 'lake', name: 'Lake',
        type: 'fw', locations: ['lake'],
        minWeight: 200, maxWeight: 4000, recordWeight: 7100,
        minLength: 25, maxLength: 95,
        bronzeLimit: 2000, silverLimit: 3000, goldLimit: 4000,
        rarity: 0.12, difficulty: 4,
        color: '#6B5B4B', stripeColor: '#4B3B2B',
        bodyShape: 'cod', hasBarbell: true, nightBonus: 1.8
    },

    // === FERSKVANN - ELV ===
    {
        id: 'laks', name: 'Laks',
        type: 'fw', locations: ['river'],
        minWeight: 500, maxWeight: 15000, recordWeight: 21900,
        minLength: 40, maxLength: 125,
        bronzeLimit: 5000, silverLimit: 10000, goldLimit: 15000,
        rarity: 0.12, difficulty: 9,
        color: '#A8A8A8', stripeColor: '#C0C0C0',
        bodyShape: 'salmonid', legendary: true
    },
    {
        id: 'harr', name: 'Harr',
        type: 'fw', locations: ['river'],
        minWeight: 50, maxWeight: 1200, recordWeight: 1900,
        minLength: 15, maxLength: 54,
        bronzeLimit: 800, silverLimit: 1000, goldLimit: 1400,
        rarity: 0.22, difficulty: 4,
        color: '#708090', stripeColor: '#9370DB',
        bodyShape: 'salmonid', hasFin: true
    },
    {
        id: 'gjoers', name: 'Gjørs',
        type: 'fw', locations: ['lake', 'river'],
        minWeight: 300, maxWeight: 7000, recordWeight: 11500,
        minLength: 25, maxLength: 103,
        bronzeLimit: 3000, silverLimit: 5000, goldLimit: 8000,
        rarity: 0.08, difficulty: 6,
        color: '#6B7B5B', stripeColor: '#4B5B3B',
        bodyShape: 'perch', nightBonus: 1.8
    },
    {
        id: 'bekkeroeye', name: 'Bekkerøye',
        type: 'fw', locations: ['river'],
        minWeight: 50, maxWeight: 1500, recordWeight: 2268,
        minLength: 12, maxLength: 50,
        bronzeLimit: 250, silverLimit: 500, goldLimit: 750,
        rarity: 0.15, difficulty: 3,
        color: '#4A6B4A', stripeColor: '#FF6347',
        bodyShape: 'salmonid', hasSpots: true
    },

    // === SALTVANN - FJORD ===
    {
        id: 'torsk', name: 'Torsk',
        type: 'sw', locations: ['fjord', 'ocean'],
        minWeight: 300, maxWeight: 25000, recordWeight: 41720,
        minLength: 25, maxLength: 159,
        bronzeLimit: 10000, silverLimit: 20000, goldLimit: 30000,
        rarity: 0.28, difficulty: 5,
        color: '#8B7355', stripeColor: '#6B5335',
        bodyShape: 'cod', hasBarbell: true
    },
    {
        id: 'sei', name: 'Sei',
        type: 'sw', locations: ['fjord', 'ocean'],
        minWeight: 300, maxWeight: 14000, recordWeight: 21700,
        minLength: 25, maxLength: 110,
        bronzeLimit: 8000, silverLimit: 10000, goldLimit: 15000,
        rarity: 0.25, difficulty: 6,
        color: '#2F4F4F', stripeColor: '#4A6B4A',
        bodyShape: 'cod'
    },
    {
        id: 'lyr', name: 'Lyr',
        type: 'sw', locations: ['fjord'],
        minWeight: 200, maxWeight: 7000, recordWeight: 10340,
        minLength: 20, maxLength: 120,
        bronzeLimit: 5000, silverLimit: 6000, goldLimit: 8000,
        rarity: 0.25, difficulty: 5,
        color: '#4A6B4A', stripeColor: '#6B8B6B',
        bodyShape: 'cod'
    },
    {
        id: 'makrell', name: 'Makrell',
        type: 'sw', locations: ['fjord'],
        minWeight: 100, maxWeight: 1800, recordWeight: 2540,
        minLength: 18, maxLength: 61,
        bronzeLimit: 800, silverLimit: 1000, goldLimit: 1500,
        rarity: 0.35, difficulty: 2,
        color: '#1B4F72', stripeColor: '#00CED1',
        bodyShape: 'sleek', hasStripes: true
    },
    {
        id: 'berggylte', name: 'Berggylte',
        type: 'sw', locations: ['fjord'],
        minWeight: 100, maxWeight: 3500, recordWeight: 5432,
        minLength: 10, maxLength: 52,
        bronzeLimit: 1000, silverLimit: 1500, goldLimit: 2000,
        rarity: 0.2, difficulty: 3,
        color: '#2E8B57', stripeColor: '#FF6347',
        bodyShape: 'round'
    },
    {
        id: 'hyse', name: 'Hyse',
        type: 'sw', locations: ['fjord', 'ocean'],
        minWeight: 200, maxWeight: 4500, recordWeight: 6635,
        minLength: 20, maxLength: 90,
        bronzeLimit: 3000, silverLimit: 4000, goldLimit: 5000,
        rarity: 0.18, difficulty: 3,
        color: '#696969', stripeColor: '#2F2F2F',
        bodyShape: 'cod'
    },
    {
        id: 'skrubbe', name: 'Skrubbe',
        type: 'sw', locations: ['fjord'],
        minWeight: 100, maxWeight: 1200, recordWeight: 1675,
        minLength: 15, maxLength: 64,
        bronzeLimit: 800, silverLimit: 1000, goldLimit: 1200,
        rarity: 0.18, difficulty: 2,
        color: '#8B7355', stripeColor: '#6B5335',
        bodyShape: 'flat'
    },
    {
        id: 'roedspette', name: 'Rødspette',
        type: 'sw', locations: ['fjord'],
        minWeight: 200, maxWeight: 3000, recordWeight: 4800,
        minLength: 18, maxLength: 77,
        bronzeLimit: 1000, silverLimit: 2000, goldLimit: 3000,
        rarity: 0.12, difficulty: 2,
        color: '#8B6B3A', stripeColor: '#FF6347',
        bodyShape: 'flat', hasSpots: true
    },
    {
        id: 'havabbor', name: 'Havabbor',
        type: 'sw', locations: ['fjord'],
        minWeight: 300, maxWeight: 4500, recordWeight: 6480,
        minLength: 20, maxLength: 92,
        bronzeLimit: 1000, silverLimit: 2000, goldLimit: 3000,
        rarity: 0.08, difficulty: 6,
        color: '#A8A8A8', stripeColor: '#808080',
        bodyShape: 'perch'
    },
    {
        id: 'lysing', name: 'Lysing',
        type: 'sw', locations: ['fjord', 'ocean'],
        minWeight: 500, maxWeight: 8000, recordWeight: 13400,
        minLength: 30, maxLength: 120,
        bronzeLimit: 6000, silverLimit: 8000, goldLimit: 10000,
        rarity: 0.1, difficulty: 5,
        color: '#A0A0A0', stripeColor: '#707070',
        bodyShape: 'cod'
    },
    {
        id: 'aal', name: 'Ål',
        type: 'sw', locations: ['fjord'],
        minWeight: 100, maxWeight: 2000, recordWeight: 2850,
        minLength: 30, maxLength: 150,
        bronzeLimit: 750, silverLimit: 1000, goldLimit: 1500,
        rarity: 0.08, difficulty: 5,
        color: '#3B3B3B', stripeColor: '#5B5B3B',
        bodyShape: 'eel', nightBonus: 2.0
    },
    {
        id: 'piggvar', name: 'Piggvar',
        type: 'sw', locations: ['fjord'],
        minWeight: 500, maxWeight: 6000, recordWeight: 10000,
        minLength: 25, maxLength: 80,
        bronzeLimit: 2000, silverLimit: 3000, goldLimit: 5000,
        rarity: 0.06, difficulty: 5,
        color: '#6B6B5B', stripeColor: '#4B4B3B',
        bodyShape: 'flat'
    },

    // === SALTVANN - DYPHAV ===
    {
        id: 'kveite', name: 'Kveite',
        type: 'sw', locations: ['ocean'],
        minWeight: 3000, maxWeight: 100000, recordWeight: 170000,
        minLength: 50, maxLength: 242,
        bronzeLimit: 25000, silverLimit: 50000, goldLimit: 100000,
        rarity: 0.06, difficulty: 10,
        color: '#5B4A3A', stripeColor: '#8B7355',
        bodyShape: 'flat', legendary: true
    },
    {
        id: 'lange', name: 'Lange',
        type: 'sw', locations: ['ocean', 'fjord'],
        minWeight: 500, maxWeight: 25000, recordWeight: 39500,
        minLength: 40, maxLength: 190,
        bronzeLimit: 15000, silverLimit: 20000, goldLimit: 30000,
        rarity: 0.1, difficulty: 7,
        color: '#6B5B4B', stripeColor: '#8B7B6B',
        bodyShape: 'eel'
    },
    {
        id: 'brosme', name: 'Brosme',
        type: 'sw', locations: ['ocean'],
        minWeight: 500, maxWeight: 12000, recordWeight: 17260,
        minLength: 30, maxLength: 113,
        bronzeLimit: 8000, silverLimit: 10000, goldLimit: 14000,
        rarity: 0.12, difficulty: 5,
        color: '#5B4B3B', stripeColor: '#7B6B5B',
        bodyShape: 'cod', hasBarbell: true
    },
    {
        id: 'graasteinbit', name: 'Gråsteinbit',
        type: 'sw', locations: ['ocean', 'fjord'],
        minWeight: 500, maxWeight: 12000, recordWeight: 17400,
        minLength: 30, maxLength: 120,
        bronzeLimit: 5000, silverLimit: 8000, goldLimit: 10000,
        rarity: 0.08, difficulty: 7,
        color: '#4A5A6A', stripeColor: '#2A3A4A',
        bodyShape: 'eel', hasStripes: true
    },
    {
        id: 'breiflabb', name: 'Breiflabb',
        type: 'sw', locations: ['ocean'],
        minWeight: 1000, maxWeight: 20000, recordWeight: 28620,
        minLength: 30, maxLength: 137,
        bronzeLimit: 5000, silverLimit: 10000, goldLimit: 20000,
        rarity: 0.04, difficulty: 8,
        color: '#5B4B3B', stripeColor: '#3B2B1B',
        bodyShape: 'round'
    },
    {
        id: 'haval', name: 'Havål',
        type: 'sw', locations: ['ocean'],
        minWeight: 1000, maxWeight: 25000, recordWeight: 36200,
        minLength: 60, maxLength: 220,
        bronzeLimit: 10000, silverLimit: 15000, goldLimit: 20000,
        rarity: 0.05, difficulty: 8,
        color: '#2F2F2F', stripeColor: '#1F1F1F',
        bodyShape: 'eel'
    },
    {
        id: 'pigghaa', name: 'Pigghå',
        type: 'sw', locations: ['ocean', 'fjord'],
        minWeight: 1000, maxWeight: 7000, recordWeight: 10130,
        minLength: 40, maxLength: 127,
        bronzeLimit: 5000, silverLimit: 6000, goldLimit: 8000,
        rarity: 0.08, difficulty: 7,
        color: '#5F6B7A', stripeColor: '#D3D3D3',
        bodyShape: 'shark'
    },
    {
        id: 'piggskate', name: 'Piggskate',
        type: 'sw', locations: ['ocean'],
        minWeight: 1000, maxWeight: 8000, recordWeight: 10750,
        minLength: 40, maxLength: 112,
        bronzeLimit: 5000, silverLimit: 6000, goldLimit: 7000,
        rarity: 0.06, difficulty: 8,
        color: '#5B5B4B', stripeColor: '#7B7B6B',
        bodyShape: 'flat'
    },
    {
        id: 'haakjerring', name: 'Håkjerring',
        type: 'sw', locations: ['ocean'],
        minWeight: 50000, maxWeight: 800000, recordWeight: 1099250,
        minLength: 150, maxLength: 450,
        bronzeLimit: 200000, silverLimit: 400000, goldLimit: 500000,
        rarity: 0.015, difficulty: 10,
        color: '#4A4A5A', stripeColor: '#6A6A7A',
        bodyShape: 'shark', legendary: true
    }
];

// Stangoppgraderinger
const RODS = [
    { id: 'basic', name: 'Begynnerstang', cost: 0, castBonus: 0, fightBonus: 0, lineStrength: 1.0 },
    { id: 'medium', name: 'Sportsstang', cost: 300, castBonus: 0.1, fightBonus: 0.15, lineStrength: 1.3 },
    { id: 'pro', name: 'Proffstang', cost: 800, castBonus: 0.2, fightBonus: 0.3, lineStrength: 1.6 },
    { id: 'master', name: 'Mesterstang', cost: 2000, castBonus: 0.3, fightBonus: 0.45, lineStrength: 2.0 }
];

// Standard lagring
const DEFAULT_SAVE = {
    coins: 0,
    totalCoins: 0,
    caughtSpecies: {},  // id -> { bestWeight, bestLength, bestPoints, count, firstCaught, medal }
    unlockedLocations: ['lake', 'river'],
    unlockedBaits: ['worm', 'spinner'],
    currentRod: 'basic',
    totalCatches: 0,
    totalPoints: 0,
    daysPlayed: 0,
    highscores: {
        bestDayPoints: [],
        bestDaySpecies: [],
        biggestCatch: []
    }
};
