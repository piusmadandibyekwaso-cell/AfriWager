export const CANDIDATE_IMAGES: Record<string, string> = {
    // Uganda 2026 Candidates
    "Yoweri Museveni": "https://upload.wikimedia.org/wikipedia/commons/4/4e/President_Museveni_2015.jpg",
    "Bobi Wine": "https://upload.wikimedia.org/wikipedia/commons/6/67/Kyagulanyi_Ssentamu_Robert_%28Bobi_Wine%29.jpg",
    "Mugisha Muntu": "https://upload.wikimedia.org/wikipedia/commons/2/23/Mugisha_Muntu.jpg",
    "Others": "https://images.unsplash.com/photo-1541873676947-d31229153026?auto=format&fit=crop&q=80&w=800",

    // Future placeholders
    "William Ruto": "https://upload.wikimedia.org/wikipedia/commons/a/ae/William_Ruto_at_Chatham_House_2019_%28cropped%29.jpg",
    "Paul Kagame": "https://upload.wikimedia.org/wikipedia/commons/3/30/Paul_Kagame_2019.jpg"
};

export const getCandidateImage = (name: string) => {
    return CANDIDATE_IMAGES[name] || null;
};
