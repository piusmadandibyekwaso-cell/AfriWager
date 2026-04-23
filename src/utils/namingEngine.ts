
const ADJECTIVES = [
    'Sovereign', 'Imperial', 'Strategic', 'Quantitative', 'Absolute', 
    'Elite', 'Noble', 'Royal', 'Prime', 'Stellar', 
    'Apex', 'Zenith', 'Vanguard', 'Institutional', 'Global', 
    'Infinite', 'Master', 'Supreme', 'Radiant', 'Ethereal',
    'Alpha', 'Sigma', 'Prime', 'Grand', 'Majestic'
];

const ELEMENTS = [
    'Obsidian', 'Platinum', 'Gold', 'Silver', 'Titanium', 
    'Diamond', 'Emerald', 'Sapphire', 'Ruby', 'Onyx', 
    'Cobalt', 'Amber', 'Jade', 'Pearl', 'Quartz', 
    'Mercury', 'Silicon', 'Carbon', 'Neon', 'Argon'
];

const NOUNS = [
    'Capital', 'Markets', 'Assets', 'Equity', 'Wealth', 
    'Reserve', 'Treasury', 'Ledger', 'Index', 'Portfolio', 
    'Matrix', 'Network', 'Trust', 'Partners', 'Core', 
    'Vault', 'Bridge', 'Protocol', 'Alliance', 'Venture',
    'Fund', 'Guild', 'Institute', 'Nexus', 'Horizon'
];

/**
 * Sovereign Naming Engine (Bit 4)
 * Generates elite, high-finance identities without numbers.
 */
export const namingEngine = {
    /**
     * Randomly selects a structure and generates a name
     */
    generateSovereignName(): string {
        const structures = [
            'ADJ_NOUN',
            'ELEM_NOUN',
            'ADJ_ELEM',
            'NOUN_ELEM'
        ];
        
        const structure = structures[Math.floor(Math.random() * structures.length)];
        
        const getRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
        
        let pair: [string, string];
        
        switch (structure) {
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
        
        // Return Space Separated (User Preference)
        return pair.join(' ');
    },

    /**
     * Generates a unique name by checking against a provided availability function
     */
    async generateUniqueSovereignName(checkAvailability: (name: string) => Promise<boolean>): Promise<string> {
        let name = this.generateSovereignName();
        let isAvailable = await checkAvailability(name);
        
        let attempts = 0;
        const maxAttempts = 50; // Safety break
        
        while (!isAvailable && attempts < maxAttempts) {
            name = this.generateSovereignName();
            isAvailable = await checkAvailability(name);
            attempts++;
        }
        
        return name;
    }
};
