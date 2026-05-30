/**
 * Nutino — IPTC Media Topics Taxonomy
 *
 * Industry-standard classification used by Reuters, AP, AFP, and NYT.
 * Level 1 + Level 2 root mappings for onboarding chip selectors.
 *
 * Keys are official IPTC Media Topic codes.
 * sub_topics are curated Level 2 terms relevant to Nutino's audience.
 */

const IPTCMediaTopics = {
    "04000000": {
        name: "Economy, Business and Finance",
        sub_topics: [
            "Venture Capital",
            "Corporate Earnings",
            "Semiconductors",
            "Cryptocurrency",
            "Stock Markets",
            "Mergers & Acquisitions",
            "Startups",
            "Central Banking",
        ],
    },
    "11000000": {
        name: "Politics",
        sub_topics: [
            "Tech Policy",
            "Antitrust Laws",
            "Global Trade Agreements",
            "Elections",
            "Legislation",
            "Diplomacy",
        ],
    },
    "13000000": {
        name: "Science and Technology",
        sub_topics: [
            "Large Language Models",
            "Agentic Systems",
            "Biotech",
            "Quantum Computing",
            "Space Exploration",
            "Robotics",
            "Climate Tech",
        ],
    },
    "16000000": {
        name: "Conflict and Defence",
        sub_topics: [
            "Aerospace & Defense",
            "Cybersecurity",
            "Geopolitical Unrest",
            "Arms Trade",
            "Intelligence Agencies",
        ],
    },
    "07000000": {
        name: "Health",
        sub_topics: [
            "Public Health",
            "Pharmaceuticals",
            "Mental Health",
            "Medical Research",
            "Healthcare Policy",
        ],
    },
    "01000000": {
        name: "Arts, Culture and Entertainment",
        sub_topics: [
            "Streaming & Media",
            "Gaming Industry",
            "Film & Television",
            "Music Industry",
        ],
    },
    "06000000": {
        name: "Environmental Issues",
        sub_topics: [
            "Climate Change",
            "Renewable Energy",
            "Carbon Markets",
            "Sustainability",
        ],
    },
    "10000000": {
        name: "Lifestyle and Leisure",
        sub_topics: [
            "Future of Work",
            "Digital Nomads",
            "Personal Finance",
            "Consumer Tech",
        ],
    },
};

/**
 * Helper: Flatten all sub_topics into a single Set for O(1) validation.
 * Used server-side to verify onboarding selections.
 */
export function getAllSubTopics() {
    const topics = new Set();
    for (const category of Object.values(IPTCMediaTopics)) {
        for (const topic of category.sub_topics) {
            topics.add(topic);
        }
    }
    return topics;
}

/**
 * Helper: Get all Level 1 category names.
 */
export function getCategoryNames() {
    return Object.values(IPTCMediaTopics).map((cat) => cat.name);
}

export default IPTCMediaTopics;
