export const CANDIDATE_IMAGES: Record<string, string> = {
    // Uganda 2026 Candidates
    "Yoweri Museveni": "https://upload.wikimedia.org/wikipedia/commons/7/75/Yoweri_Museveni.jpg",
    "Bobi Wine": "https://upload.wikimedia.org/wikipedia/commons/7/7b/Bobi_Wine_2024.png",
    "Mugisha Muntu": "https://upload.wikimedia.org/wikipedia/commons/a/a8/Mugisha_Muntu_2020.jpg",
    "Others": "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&q=80&w=800", // Stable group/debate image

    // Future placeholders
    "William Ruto": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/William_Ruto_at_Chatham_House_2019_%28cropped%29.jpg/800px-William_Ruto_at_Chatham_House_2019_%28cropped%29.jpg",
    "Paul Kagame": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Paul_Kagame_2019.jpg/800px-Paul_Kagame_2019.jpg"
};

export const getCandidateImage = (name: string) => {
    return CANDIDATE_IMAGES[name] || null;
};
