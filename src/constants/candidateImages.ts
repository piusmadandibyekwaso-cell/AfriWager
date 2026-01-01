export const CANDIDATE_IMAGES: Record<string, string> = {
    // Uganda 2026 Candidates
    "Yoweri Museveni": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/President_Museveni_2015.jpg/800px-President_Museveni_2015.jpg",
    "Bobi Wine": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Kyagulanyi_Ssentamu_Robert_%28Bobi_Wine%29.jpg/640px-Kyagulanyi_Ssentamu_Robert_%28Bobi_Wine%29.jpg",
    "Mugisha Muntu": "https://upload.wikimedia.org/wikipedia/commons/2/23/Mugisha_Muntu.jpg",
    "Others": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Solid_grey.svg/1024px-Solid_grey.svg.png",

    // Future placeholders (Pre-emptive)
    "William Ruto": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/William_Ruto_at_Chatham_House_2019_%28cropped%29.jpg/640px-William_Ruto_at_Chatham_House_2019_%28cropped%29.jpg",
    "Paul Kagame": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Paul_Kagame_2019.jpg/640px-Paul_Kagame_2019.jpg"
};

export const getCandidateImage = (name: string) => {
    return CANDIDATE_IMAGES[name] || null;
};
