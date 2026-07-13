// Dictionary mapping root themes to semantically related words
const THEMATIC_MAP: Record<string, string[]> = {
    tomato: ["sauce", "soup", "ketchup", "puree", "paste"],
    lemon: ["pickle", "juice", "soda", "zest", "tart"],
    apple: ["pie", "cider", "crumble", "juice", "tart"],
    onion: ["ring", "soup", "gravy", "peel", "dip"],
    green: ["tea", "salad", "leaf", "pepper", "bean"],
    chili: ["oil", "flake", "paste", "powder", "sauce"],
    garlic: ["bread", "clove", "butter", "sauce", "press"],
    peanut: ["butter", "shell", "oil", "sauce", "brittle"],
    mango: ["shake", "pickle", "pulp", "lassi", "tart"],
    coffee: ["bean", "cup", "mug", "grind", "cake"],
    honey: ["comb", "bee", "dew", "glazed", "mustard"],
    ginger: ["ale", "tea", "garlic", "bread", "root"],
    cheese: ["burger", "cake", "slice", "spread", "fondue"],
    potato: ["chip", "mash", "fry", "skin", "salad"],
    orange: ["juice", "peel", "soda", "blossom", "zest"],
    pepper: ["corn", "mint", "spray", "pot", "grinder"],
    banana: ["split", "bread", "peel", "leaf", "shake"],
    chocolate: ["bar", "chip", "cake", "fudge", "truffle"]
};

/**
 * Generates a memorable thematic room code (e.g., 'tomato-sauce', 'lemon-pickle')
 */
export const generateThematicRoomCode = (): string => {
    const roots = Object.keys(THEMATIC_MAP);
    const randomRoot = roots[Math.floor(Math.random() * roots.length)];
    const suffixes = THEMATIC_MAP[randomRoot];
    const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    return `${randomRoot}-${randomSuffix}`;
};
