// ============================================================
// ArtsFiske: Specimen Hunter - Game Data
// Fish species, locations, baits, and configuration
// ============================================================

const LOCATIONS = [
    {
        id: 'lake',
        name: 'Fjellvatnet',
        nameEn: 'Mountain Lake',
        description: 'A serene alpine lake surrounded by birch forest. Home to perch, pike, and trout.',
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
        nameEn: 'Salmon River',
        description: 'A rushing river famous for its salmon runs. Fly fishing paradise.',
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
        nameEn: 'The Fjord',
        description: 'Deep Norwegian fjord waters with steep mountain walls. Rich marine life.',
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
        nameEn: 'Deep Ocean',
        description: 'The open North Sea. Massive fish lurk in the deep, but conditions are tough.',
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
        nameEn: 'Worm',
        icon: '🪱',
        description: 'Versatile freshwater bait. Attracts most species.',
        cost: 0,
        unlocked: true,
        effectiveness: { fw: 0.8, sw: 0.3 },
        attracts: ['perch', 'trout', 'roach', 'bream', 'eel', 'char', 'whitefish', 'grayling', 'rudd', 'crucian']
    },
    {
        id: 'spinner',
        name: 'Sluk',
        nameEn: 'Spinner',
        icon: '🔩',
        description: 'Metal lure for predatory fish. Great for pike and big perch.',
        cost: 0,
        unlocked: true,
        effectiveness: { fw: 0.7, sw: 0.5 },
        attracts: ['pike', 'perch', 'trout', 'salmon', 'zander', 'seatrout', 'pollack', 'mackerel', 'seabass']
    },
    {
        id: 'fly',
        name: 'Flue',
        nameEn: 'Fly',
        icon: '🪶',
        description: 'Delicate artificial fly. The weapon of choice in rivers.',
        cost: 50,
        unlocked: false,
        effectiveness: { fw: 0.9, sw: 0.1 },
        attracts: ['salmon', 'trout', 'seatrout', 'grayling', 'char']
    },
    {
        id: 'shrimp',
        name: 'Reke',
        nameEn: 'Shrimp',
        icon: '🦐',
        description: 'Fresh shrimp. Irresistible to many saltwater species.',
        cost: 50,
        unlocked: false,
        effectiveness: { fw: 0.2, sw: 0.9 },
        attracts: ['cod', 'pollack', 'wrasse', 'flounder', 'wolffish', 'haddock', 'whiting', 'plaice', 'seabream']
    },
    {
        id: 'jig',
        name: 'Pilk',
        nameEn: 'Jig',
        icon: '🎣',
        description: 'Heavy metal jig for deep water. Reaches the big ones.',
        cost: 100,
        unlocked: false,
        effectiveness: { fw: 0.1, sw: 0.8 },
        attracts: ['cod', 'ling', 'tusk', 'halibut', 'wolffish', 'monkfish', 'coalfish']
    },
    {
        id: 'mackerel',
        name: 'Makrell',
        nameEn: 'Mackerel Strip',
        icon: '🐟',
        description: 'Cut mackerel bait. Attracts the ocean\'s biggest predators.',
        cost: 150,
        unlocked: false,
        effectiveness: { fw: 0.0, sw: 1.0 },
        attracts: ['halibut', 'ling', 'tusk', 'monkfish', 'blueshark', 'porbeagle', 'skate', 'conger']
    }
];

const TIME_OF_DAY = [
    { id: 'dawn', name: 'Daggry', nameEn: 'Dawn', icon: '🌅', multiplier: 1.3, description: 'Fish are active and hungry at dawn.' },
    { id: 'day', name: 'Dag', nameEn: 'Day', icon: '☀️', multiplier: 1.0, description: 'Standard fishing conditions.' },
    { id: 'dusk', name: 'Skumring', nameEn: 'Dusk', icon: '🌇', multiplier: 1.4, description: 'Peak feeding time. Best bite rates.' },
    { id: 'night', name: 'Natt', nameEn: 'Night', icon: '🌙', multiplier: 1.1, description: 'Quieter, but some species are nocturnal.' }
];

// Fish species - based on real Norwegian species from artsfiske.com
// Points are calculated as: (caughtWeight / recordWeight) * 100
const FISH_SPECIES = [
    // === FRESHWATER - LAKE ===
    {
        id: 'perch', name: 'Abbor', nameEn: 'Perch',
        type: 'fw', locations: ['lake', 'river'],
        minWeight: 0.1, maxWeight: 2.5, recordWeight: 2.81,
        minLength: 15, maxLength: 50,
        rarity: 0.35, difficulty: 2,
        color: '#5D8A3C', stripeColor: '#2D4A1C',
        bodyShape: 'perch', hasStripes: true
    },
    {
        id: 'pike', name: 'Gjedde', nameEn: 'Pike',
        type: 'fw', locations: ['lake'],
        minWeight: 0.5, maxWeight: 15.0, recordWeight: 19.18,
        minLength: 40, maxLength: 120,
        rarity: 0.2, difficulty: 7,
        color: '#4A6B3A', stripeColor: '#8BAF6A',
        bodyShape: 'pike', aggressive: true
    },
    {
        id: 'trout', name: 'Ørret', nameEn: 'Brown Trout',
        type: 'fw', locations: ['lake', 'river'],
        minWeight: 0.2, maxWeight: 8.0, recordWeight: 15.3,
        minLength: 20, maxLength: 80,
        rarity: 0.25, difficulty: 5,
        color: '#B8860B', stripeColor: '#CD5C5C',
        bodyShape: 'salmonid', hasSpots: true
    },
    {
        id: 'char', name: 'Røye', nameEn: 'Arctic Char',
        type: 'fw', locations: ['lake'],
        minWeight: 0.1, maxWeight: 4.0, recordWeight: 9.44,
        minLength: 15, maxLength: 65,
        rarity: 0.2, difficulty: 4,
        color: '#C76B4A', stripeColor: '#FF6347',
        bodyShape: 'salmonid', hasSpots: true
    },
    {
        id: 'whitefish', name: 'Sik', nameEn: 'Whitefish',
        type: 'fw', locations: ['lake'],
        minWeight: 0.2, maxWeight: 3.0, recordWeight: 3.6,
        minLength: 20, maxLength: 55,
        rarity: 0.2, difficulty: 3,
        color: '#C0C0C0', stripeColor: '#A0A0A0',
        bodyShape: 'salmonid'
    },
    {
        id: 'roach', name: 'Mort', nameEn: 'Roach',
        type: 'fw', locations: ['lake'],
        minWeight: 0.05, maxWeight: 1.0, recordWeight: 1.31,
        minLength: 10, maxLength: 35,
        rarity: 0.35, difficulty: 1,
        color: '#A0A0A0', stripeColor: '#CD5C5C',
        bodyShape: 'round'
    },
    {
        id: 'bream', name: 'Brasme', nameEn: 'Bream',
        type: 'fw', locations: ['lake'],
        minWeight: 0.3, maxWeight: 4.0, recordWeight: 5.72,
        minLength: 25, maxLength: 60,
        rarity: 0.15, difficulty: 3,
        color: '#8B7355', stripeColor: '#6B5335',
        bodyShape: 'deep'
    },
    {
        id: 'rudd', name: 'Sørv', nameEn: 'Rudd',
        type: 'fw', locations: ['lake'],
        minWeight: 0.05, maxWeight: 0.8, recordWeight: 1.19,
        minLength: 10, maxLength: 30,
        rarity: 0.15, difficulty: 1,
        color: '#DAA520', stripeColor: '#FF4500',
        bodyShape: 'round'
    },
    {
        id: 'crucian', name: 'Karuss', nameEn: 'Crucian Carp',
        type: 'fw', locations: ['lake'],
        minWeight: 0.1, maxWeight: 1.5, recordWeight: 2.06,
        minLength: 12, maxLength: 35,
        rarity: 0.1, difficulty: 2,
        color: '#DAA520', stripeColor: '#B8860B',
        bodyShape: 'deep'
    },
    {
        id: 'eel', name: 'Ål', nameEn: 'Eel',
        type: 'fw', locations: ['lake', 'river'],
        minWeight: 0.2, maxWeight: 3.0, recordWeight: 5.05,
        minLength: 30, maxLength: 100,
        rarity: 0.08, difficulty: 5,
        color: '#3B3B3B', stripeColor: '#5B5B3B',
        bodyShape: 'eel', nightBonus: 2.0
    },

    // === FRESHWATER - RIVER ===
    {
        id: 'salmon', name: 'Laks', nameEn: 'Atlantic Salmon',
        type: 'fw', locations: ['river'],
        minWeight: 1.0, maxWeight: 20.0, recordWeight: 36.4,
        minLength: 50, maxLength: 130,
        rarity: 0.12, difficulty: 9,
        color: '#A8A8A8', stripeColor: '#C0C0C0',
        bodyShape: 'salmonid', legendary: true
    },
    {
        id: 'seatrout', name: 'Sjøørret', nameEn: 'Sea Trout',
        type: 'fw', locations: ['river', 'fjord'],
        minWeight: 0.5, maxWeight: 8.0, recordWeight: 12.6,
        minLength: 30, maxLength: 90,
        rarity: 0.15, difficulty: 7,
        color: '#B0B0B0', stripeColor: '#808080',
        bodyShape: 'salmonid', hasSpots: true
    },
    {
        id: 'grayling', name: 'Harr', nameEn: 'Grayling',
        type: 'fw', locations: ['river'],
        minWeight: 0.1, maxWeight: 2.0, recordWeight: 2.48,
        minLength: 15, maxLength: 50,
        rarity: 0.2, difficulty: 4,
        color: '#708090', stripeColor: '#9370DB',
        bodyShape: 'salmonid', hasFin: true
    },
    {
        id: 'zander', name: 'Gjørs', nameEn: 'Zander',
        type: 'fw', locations: ['lake', 'river'],
        minWeight: 0.5, maxWeight: 8.0, recordWeight: 11.53,
        minLength: 30, maxLength: 90,
        rarity: 0.08, difficulty: 6,
        color: '#6B7B5B', stripeColor: '#4B5B3B',
        bodyShape: 'perch', nightBonus: 1.8
    },

    // === SALTWATER - FJORD ===
    {
        id: 'cod', name: 'Torsk', nameEn: 'Cod',
        type: 'sw', locations: ['fjord', 'ocean'],
        minWeight: 0.5, maxWeight: 20.0, recordWeight: 36.2,
        minLength: 30, maxLength: 120,
        rarity: 0.3, difficulty: 5,
        color: '#8B7355', stripeColor: '#6B5335',
        bodyShape: 'cod', hasBarbell: true
    },
    {
        id: 'pollack', name: 'Lyr', nameEn: 'Pollack',
        type: 'sw', locations: ['fjord'],
        minWeight: 0.3, maxWeight: 8.0, recordWeight: 11.88,
        minLength: 25, maxLength: 90,
        rarity: 0.25, difficulty: 5,
        color: '#4A6B4A', stripeColor: '#6B8B6B',
        bodyShape: 'cod'
    },
    {
        id: 'coalfish', name: 'Sei', nameEn: 'Coalfish',
        type: 'sw', locations: ['fjord', 'ocean'],
        minWeight: 0.5, maxWeight: 15.0, recordWeight: 22.7,
        minLength: 30, maxLength: 110,
        rarity: 0.2, difficulty: 6,
        color: '#2F4F4F', stripeColor: '#4A6B4A',
        bodyShape: 'cod'
    },
    {
        id: 'mackerel', name: 'Makrell', nameEn: 'Mackerel',
        type: 'sw', locations: ['fjord'],
        minWeight: 0.2, maxWeight: 1.5, recordWeight: 2.07,
        minLength: 20, maxLength: 45,
        rarity: 0.35, difficulty: 2,
        color: '#1B4F72', stripeColor: '#00CED1',
        bodyShape: 'sleek', hasStripes: true
    },
    {
        id: 'wrasse', name: 'Bergnebb', nameEn: 'Ballan Wrasse',
        type: 'sw', locations: ['fjord'],
        minWeight: 0.1, maxWeight: 3.0, recordWeight: 4.41,
        minLength: 10, maxLength: 50,
        rarity: 0.2, difficulty: 3,
        color: '#2E8B57', stripeColor: '#FF6347',
        bodyShape: 'round'
    },
    {
        id: 'flounder', name: 'Skrubbe', nameEn: 'Flounder',
        type: 'sw', locations: ['fjord'],
        minWeight: 0.2, maxWeight: 2.0, recordWeight: 3.0,
        minLength: 15, maxLength: 45,
        rarity: 0.15, difficulty: 2,
        color: '#8B7355', stripeColor: '#6B5335',
        bodyShape: 'flat'
    },
    {
        id: 'plaice', name: 'Rødspette', nameEn: 'Plaice',
        type: 'sw', locations: ['fjord'],
        minWeight: 0.3, maxWeight: 3.0, recordWeight: 3.8,
        minLength: 20, maxLength: 55,
        rarity: 0.12, difficulty: 2,
        color: '#8B6B3A', stripeColor: '#FF6347',
        bodyShape: 'flat', hasSpots: true
    },
    {
        id: 'haddock', name: 'Hyse', nameEn: 'Haddock',
        type: 'sw', locations: ['fjord', 'ocean'],
        minWeight: 0.3, maxWeight: 5.0, recordWeight: 7.8,
        minLength: 25, maxLength: 70,
        rarity: 0.15, difficulty: 3,
        color: '#696969', stripeColor: '#2F2F2F',
        bodyShape: 'cod'
    },
    {
        id: 'whiting', name: 'Hvitting', nameEn: 'Whiting',
        type: 'sw', locations: ['fjord'],
        minWeight: 0.1, maxWeight: 2.0, recordWeight: 3.0,
        minLength: 15, maxLength: 45,
        rarity: 0.2, difficulty: 2,
        color: '#B0B0B0', stripeColor: '#808080',
        bodyShape: 'cod'
    },
    {
        id: 'seabream', name: 'Havkaruss', nameEn: 'Sea Bream',
        type: 'sw', locations: ['fjord'],
        minWeight: 0.2, maxWeight: 2.5, recordWeight: 3.5,
        minLength: 15, maxLength: 40,
        rarity: 0.1, difficulty: 3,
        color: '#C0C0C0', stripeColor: '#FFD700',
        bodyShape: 'deep'
    },
    {
        id: 'seabass', name: 'Havabbor', nameEn: 'Sea Bass',
        type: 'sw', locations: ['fjord'],
        minWeight: 0.5, maxWeight: 6.0, recordWeight: 8.5,
        minLength: 25, maxLength: 75,
        rarity: 0.08, difficulty: 6,
        color: '#A8A8A8', stripeColor: '#808080',
        bodyShape: 'perch'
    },

    // === SALTWATER - DEEP OCEAN ===
    {
        id: 'halibut', name: 'Kveite', nameEn: 'Atlantic Halibut',
        type: 'sw', locations: ['ocean'],
        minWeight: 5.0, maxWeight: 100.0, recordWeight: 234.0,
        minLength: 60, maxLength: 250,
        rarity: 0.06, difficulty: 10,
        color: '#5B4A3A', stripeColor: '#8B7355',
        bodyShape: 'flat', legendary: true
    },
    {
        id: 'ling', name: 'Lange', nameEn: 'Ling',
        type: 'sw', locations: ['ocean', 'fjord'],
        minWeight: 1.0, maxWeight: 20.0, recordWeight: 35.5,
        minLength: 50, maxLength: 150,
        rarity: 0.1, difficulty: 7,
        color: '#6B5B4B', stripeColor: '#8B7B6B',
        bodyShape: 'eel'
    },
    {
        id: 'tusk', name: 'Brosme', nameEn: 'Tusk',
        type: 'sw', locations: ['ocean'],
        minWeight: 1.0, maxWeight: 10.0, recordWeight: 14.0,
        minLength: 40, maxLength: 90,
        rarity: 0.12, difficulty: 5,
        color: '#5B4B3B', stripeColor: '#7B6B5B',
        bodyShape: 'cod', hasBarbell: true
    },
    {
        id: 'wolffish', name: 'Steinbit', nameEn: 'Wolffish',
        type: 'sw', locations: ['ocean', 'fjord'],
        minWeight: 1.0, maxWeight: 15.0, recordWeight: 23.5,
        minLength: 40, maxLength: 120,
        rarity: 0.08, difficulty: 7,
        color: '#4A5A6A', stripeColor: '#2A3A4A',
        bodyShape: 'eel', hasStripes: true
    },
    {
        id: 'monkfish', name: 'Breiflabb', nameEn: 'Monkfish',
        type: 'sw', locations: ['ocean'],
        minWeight: 2.0, maxWeight: 30.0, recordWeight: 57.0,
        minLength: 40, maxLength: 150,
        rarity: 0.05, difficulty: 8,
        color: '#5B4B3B', stripeColor: '#3B2B1B',
        bodyShape: 'round'
    },
    {
        id: 'blueshark', name: 'Blåhai', nameEn: 'Blue Shark',
        type: 'sw', locations: ['ocean'],
        minWeight: 10.0, maxWeight: 80.0, recordWeight: 120.0,
        minLength: 100, maxLength: 300,
        rarity: 0.03, difficulty: 10,
        color: '#4169E1', stripeColor: '#1E3A5F',
        bodyShape: 'shark', legendary: true
    },
    {
        id: 'porbeagle', name: 'Håbrann', nameEn: 'Porbeagle Shark',
        type: 'sw', locations: ['ocean'],
        minWeight: 15.0, maxWeight: 100.0, recordWeight: 161.0,
        minLength: 100, maxLength: 280,
        rarity: 0.02, difficulty: 10,
        color: '#5F6B7A', stripeColor: '#D3D3D3',
        bodyShape: 'shark', legendary: true
    },
    {
        id: 'skate', name: 'Storskate', nameEn: 'Common Skate',
        type: 'sw', locations: ['ocean'],
        minWeight: 5.0, maxWeight: 60.0, recordWeight: 104.0,
        minLength: 80, maxLength: 200,
        rarity: 0.04, difficulty: 8,
        color: '#5B5B4B', stripeColor: '#7B7B6B',
        bodyShape: 'flat'
    },
    {
        id: 'conger', name: 'Havål', nameEn: 'Conger Eel',
        type: 'sw', locations: ['ocean'],
        minWeight: 2.0, maxWeight: 30.0, recordWeight: 46.0,
        minLength: 80, maxLength: 250,
        rarity: 0.05, difficulty: 8,
        color: '#2F2F2F', stripeColor: '#1F1F1F',
        bodyShape: 'eel'
    }
];

// Rod upgrades
const RODS = [
    { id: 'basic', name: 'Begynnerstang', nameEn: 'Starter Rod', cost: 0, castBonus: 0, fightBonus: 0, lineStrength: 1.0 },
    { id: 'medium', name: 'Sportsstang', nameEn: 'Sport Rod', cost: 300, castBonus: 0.1, fightBonus: 0.15, lineStrength: 1.3 },
    { id: 'pro', name: 'Proffstang', nameEn: 'Pro Rod', cost: 800, castBonus: 0.2, fightBonus: 0.3, lineStrength: 1.6 },
    { id: 'master', name: 'Mesterstang', nameEn: 'Master Rod', cost: 2000, castBonus: 0.3, fightBonus: 0.45, lineStrength: 2.0 }
];

// Medals thresholds (specimen points)
const MEDALS = {
    gold: 75,
    silver: 50,
    bronze: 30
};

// Default save data
const DEFAULT_SAVE = {
    coins: 0,
    totalCoins: 0,
    caughtSpecies: {},  // id -> { bestWeight, bestLength, bestPoints, count, firstCaught }
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
