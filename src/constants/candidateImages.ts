export const CANDIDATE_IMAGES: Record<string, string> = {
    // Uganda 2026 Candidates
    "Yoweri Museveni": "https://upload.wikimedia.org/wikipedia/commons/2/2f/Yoweri_K._Museveni_%28portrait%2C_2018%29.jpg",
    "Bobi Wine": "https://pbs.twimg.com/media/EmS0d8yXMAA4z6e?format=jpg&name=large", // NUP Campaign Poster from Twitter
    "Mugisha Muntu": "https://upload.wikimedia.org/wikipedia/commons/f/f3/Gen-mugisha-muntu.jpg",
    "Others": "https://images.unsplash.com/photo-1541873676947-d31229153026?auto=format&fit=crop&q=80&w=800",

    // Future placeholders
    "William Ruto": "https://upload.wikimedia.org/wikipedia/commons/a/ae/William_Ruto_at_Chatham_House_2019_%28cropped%29.jpg",
    "Paul Kagame": "https://upload.wikimedia.org/wikipedia/commons/3/30/Paul_Kagame_2019.jpg"
};

export const getCandidateImage = (name: string) => {
    return CANDIDATE_IMAGES[name] || null;
};
