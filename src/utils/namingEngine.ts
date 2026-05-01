
const ADJECTIVES = [
    'Strategic', 'Silent', 'Absolute', 'Elite', 'Sovereign', 
    'Rapid', 'Muted', 'Vanguard', 'Loyal', 'Bold',
    'Necessary', 'Urgent', 'Calm', 'Fierce', 'Radiant', 
    'Global', 'Prime', 'Alpha', 'Sigma', 'Grand',
    'Infinite', 'Golden', 'Dark', 'Bright', 'Ancient',
    'Modern', 'Stealth', 'Noble', 'Stellar', 'Deep'
];

const ELEMENTS = [
    'Emerald', 'Obsidian', 'Steel', 'Cobalt', 'Carbon', 
    'Gold', 'Amber', 'Onyx', 'Ruby', 'Silver',
    'Quartz', 'Platinum', 'Jade', 'Pearl', 'Silicon',
    'Copper', 'Bronze', 'Marble', 'Crystal', 'Diamond'
];

const NOUNS = [
    'Oracle', 'Sentry', 'Vault', 'Horizon', 'Peak', 
    'Pillar', 'Delta', 'Catalyst', 'Matrix', 'Scepter',
    'Cliff', 'Bridge', 'Ledger', 'Protocol', 'Alliance', 
    'Core', 'Nexus', 'Trust', 'Venture', 'Summit',
    'Relay', 'Signal', 'Vector', 'Orbit', 'Pulse'
];

/**
 * Sovereign Naming Engine (Bit 4)
 * Generates elite, institutional identities without numbers.
 * Inspired by Polymarket (e.g., necessary-cliff) but optimized for institutional branding.
 */
export const namingEngine = {
    /**
     * Randomly selects one of four structures and generates a name
     */
    generateSovereignName(): string {
        const paths = [
            'ADJ_NOUN',  // Path 1
            'ELEM_NOUN', // Path 2
            'ADJ_ELEM',  // Path 3
            'NOUN_ELEM'  // Path 4
        ];
        
        const path = paths[Math.floor(Math.random() * paths.length)];
        const getRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
        
        let pair: [string, string];
        
        switch (path) {
            case 'ADJ_NOUN':
                pair = [getRandom(ADJECTIVES), getRandom(NOUNS)];
                break;
            case 'ELEM_NOUN':
                pair = [getRandom(ELEMENTS), getRandom(NOUNS)];
                break;
            case 'ADJ_ELEM':
                pair = [getRandom(ADJECTIVES), getRandom(ELEMENTS)];
                break;
            case 'NOUN_ELEM':
                pair = [getRandom(NOUNS), getRandom(ELEMENTS)];
                break;
            default:
                pair = [getRandom(ADJECTIVES), getRandom(NOUNS)];
        }
        
        // Return Title Cased with a single space between words
        return pair.join(' ');
    },

    /**
     * Generates a unique name by checking against the database
     */
    async generateUniqueSovereignName(checkAvailability: (name: string) => Promise<boolean>): Promise<string> {
        let name = this.generateSovereignName();
        let isAvailable = await checkAvailability(name);
        
        // Loop instantly until a unique identity is confirmed
        while (!isAvailable) {
            name = this.generateSovereignName();
            isAvailable = await checkAvailability(name);
        }
        
        return name;
    }
};
