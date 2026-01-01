export const CANDIDATE_IMAGES: Record<string, string> = {
    // Uganda 2026 Candidates
    "Yoweri Museveni": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Yoweri_Museveni.jpg/800px-Yoweri_Museveni.jpg",
    "Bobi Wine": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Kyagulanyi_Ssentamu_Robert_%28Bobi_Wine%29.jpg/800px-Kyagulanyi_Ssentamu_Robert_%28Bobi_Wine%29.jpg",
    "Mugisha Muntu": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Mugisha_Muntu.jpg/800px-Mugisha_Muntu.jpg",
    "Others": "https://images.unsplash.com/photo-1541873676947-d31229153026?auto=format&fit=crop&q=80&w=800",

    // Future placeholders
    "William Ruto": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/William_Ruto_at_Chatham_House_2019_%28cropped%29.jpg/800px-William_Ruto_at_Chatham_House_2019_%28cropped%29.jpg",
    "Paul Kagame": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Paul_Kagame_2019.jpg/800px-Paul_Kagame_2019.jpg"
};

export const getCandidateImage = (name: string) => {
    return CANDIDATE_IMAGES[name] || null;
};
