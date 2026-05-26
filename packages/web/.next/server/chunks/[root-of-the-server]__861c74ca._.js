module.exports = [
"[project]/packages/web/.next-internal/server/app/api/search/route/actions.js [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__, module, exports) => {

}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[project]/packages/agent-core/dist/scoring/scorer.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "parseDurationMinutes",
    ()=>parseDurationMinutes,
    "scoreOffers",
    ()=>scoreOffers
]);
const WEIGHTS = {
    price: 0.35,
    duration: 0.25,
    stops: 0.20,
    time: 0.10,
    airline: 0.05,
    rewards: 0.05
};
function scoreOffers(offers, preferences, cardProfile) {
    if (offers.length === 0) return [];
    const priceRange = getRange(offers.map((o)=>o.price.total));
    const durationRange = getRange(offers.map((o)=>parseDurationMinutes(o.outbound.duration)));
    const scored = offers.map((offer)=>{
        const priceScore = normalizeInverse(offer.price.total, priceRange);
        const durationScore = normalizeInverse(parseDurationMinutes(offer.outbound.duration), durationRange);
        const stopsScore = scoreStops(offer.outbound.stops, preferences.maxStops);
        const timeScore = scoreTime(offer.outbound.segments[0].departure.at, preferences);
        const airlineScore = scoreAirline(offer.validatingCarrier, preferences);
        let rewardsScore = 0;
        let cardRecommendation;
        if (cardProfile && cardProfile.cards.length > 0) {
            cardRecommendation = getBestCard(offer, cardProfile);
            rewardsScore = cardRecommendation ? Math.min(cardRecommendation.totalEstimatedValue / offer.price.total, 1) : 0;
        }
        const breakdown = {
            priceScore,
            durationScore,
            stopsScore,
            timeScore,
            airlineScore,
            rewardsScore
        };
        const score = priceScore * WEIGHTS.price + durationScore * WEIGHTS.duration + stopsScore * WEIGHTS.stops + timeScore * WEIGHTS.time + airlineScore * WEIGHTS.airline + rewardsScore * WEIGHTS.rewards;
        return {
            offer,
            score,
            breakdown,
            cardRecommendation
        };
    });
    scored.sort((a, b)=>b.score - a.score);
    return scored;
}
function getBestCard(offer, profile) {
    let best;
    for (const card of profile.cards){
        const rewardsValue = estimateRewardsValue(offer, card, profile.preferredPointValuation);
        const applicablePerks = getApplicablePerks(offer, card);
        const perkValue = applicablePerks.reduce((sum, p)=>sum + (p.value || 0), 0);
        const totalEstimatedValue = rewardsValue + perkValue;
        if (!best || totalEstimatedValue > best.totalEstimatedValue) {
            best = {
                card,
                estimatedRewardsValue: rewardsValue,
                applicablePerks,
                totalEstimatedValue,
                rationale: buildRationale(card, rewardsValue, applicablePerks)
            };
        }
    }
    return best;
}
function estimateRewardsValue(offer, card, valuations) {
    const travelCategory = card.categories.find((c)=>c.category === 'travel' || c.category === 'airlines');
    const generalCategory = card.categories.find((c)=>c.category === 'general');
    const multiplier = travelCategory?.multiplier || generalCategory?.multiplier || 1;
    const centsPerPoint = valuations[card.issuer] || 1.0;
    return offer.price.total * multiplier * centsPerPoint / 100;
}
function getApplicablePerks(offer, card) {
    return card.perks.filter((perk)=>{
        if (perk.airlines && perk.airlines.length > 0) {
            return perk.airlines.includes(offer.validatingCarrier || '');
        }
        return true;
    });
}
function buildRationale(card, rewardsValue, perks) {
    const parts = [
        `Use ${card.name}: ~$${rewardsValue.toFixed(2)} in rewards`
    ];
    if (perks.length > 0) {
        const perkNames = perks.map((p)=>p.description).slice(0, 3);
        parts.push(`+ perks: ${perkNames.join(', ')}`);
    }
    return parts.join(' ');
}
function scoreStops(stops, maxPreferred) {
    if (stops === 0) return 1.0;
    if (stops <= maxPreferred) return 0.6;
    return 0.2;
}
function scoreTime(departureAt, preferences) {
    if (!preferences.preferredDepartureWindow) return 0.5;
    const hour = new Date(departureAt).getHours();
    const earliest = parseInt(preferences.preferredDepartureWindow.earliest.split(':')[0], 10);
    const latest = parseInt(preferences.preferredDepartureWindow.latest.split(':')[0], 10);
    if (hour >= earliest && hour <= latest) return 1.0;
    const distance = Math.min(Math.abs(hour - earliest), Math.abs(hour - latest));
    return Math.max(0, 1 - distance * 0.15);
}
function scoreAirline(carrier, preferences) {
    if (!carrier) return 0.5;
    if (preferences.preferredAirlines.includes(carrier)) return 1.0;
    return 0.5;
}
function getRange(values) {
    return [
        Math.min(...values),
        Math.max(...values)
    ];
}
function normalizeInverse(value, [min, max]) {
    if (max === min) return 1;
    return 1 - (value - min) / (max - min);
}
function parseDurationMinutes(isoDuration) {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!match) return 0;
    return parseInt(match[1] || '0', 10) * 60 + parseInt(match[2] || '0', 10);
} //# sourceMappingURL=scorer.js.map
}),
"[project]/packages/agent-core/dist/scoring/index.js [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$agent$2d$core$2f$dist$2f$scoring$2f$scorer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/agent-core/dist/scoring/scorer.js [app-route] (ecmascript)"); //# sourceMappingURL=index.js.map
;
}),
"[externals]/node:crypto [external] (node:crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:crypto", () => require("node:crypto"));

module.exports = mod;
}),
"[externals]/node:fs/promises [external] (node:fs/promises, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:fs/promises", () => require("node:fs/promises"));

module.exports = mod;
}),
"[project]/packages/agent-core/dist/vault/vault.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "IdentityVault",
    ()=>IdentityVault
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:crypto [external] (node:crypto, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs$2f$promises__$5b$external$5d$__$28$node$3a$fs$2f$promises$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:fs/promises [external] (node:fs/promises, cjs)");
;
;
const DEFAULT_CONFIG = {
    vaultPath: './vault.enc',
    algorithm: 'aes-256-gcm',
    kdf: 'argon2id',
    kdfParams: {
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 1
    }
};
class IdentityVault {
    config;
    data = null;
    derivedKey = null;
    constructor(config = {}){
        this.config = {
            ...DEFAULT_CONFIG,
            ...config
        };
    }
    async unlock(masterPassword) {
        this.derivedKey = await this.deriveKey(masterPassword);
        if (await this.vaultExists()) {
            const encrypted = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs$2f$promises__$5b$external$5d$__$28$node$3a$fs$2f$promises$2c$__cjs$29$__["readFile"])(this.config.vaultPath);
            this.data = this.decrypt(encrypted);
        } else {
            this.data = null;
        }
    }
    lock() {
        this.data = null;
        this.derivedKey = null;
    }
    isUnlocked() {
        return this.derivedKey !== null;
    }
    getData() {
        this.ensureUnlocked();
        return this.data;
    }
    async setData(data) {
        this.ensureUnlocked();
        this.data = {
            ...data,
            updatedAt: new Date().toISOString()
        };
        const encrypted = this.encrypt(this.data);
        await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs$2f$promises__$5b$external$5d$__$28$node$3a$fs$2f$promises$2c$__cjs$29$__["writeFile"])(this.config.vaultPath, encrypted);
    }
    async deriveKey(password) {
        try {
            const argon2 = await __turbopack_context__.A("[externals]/argon2 [external] (argon2, cjs, async loader)");
            const salt = await this.getOrCreateSalt();
            const hash = await argon2.hash(password, {
                type: 2,
                memoryCost: this.config.kdfParams.memoryCost,
                timeCost: this.config.kdfParams.timeCost,
                parallelism: this.config.kdfParams.parallelism,
                salt,
                raw: true,
                hashLength: 32
            });
            return Buffer.from(hash);
        } catch  {
            const { pbkdf2Sync } = await __turbopack_context__.A("[externals]/node:crypto [external] (node:crypto, cjs, async loader)");
            const salt = await this.getOrCreateSalt();
            return pbkdf2Sync(password, salt, 100_000, 32, 'sha256');
        }
    }
    async getOrCreateSalt() {
        const saltPath = this.config.vaultPath + '.salt';
        try {
            return await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs$2f$promises__$5b$external$5d$__$28$node$3a$fs$2f$promises$2c$__cjs$29$__["readFile"])(saltPath);
        } catch  {
            const salt = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["randomBytes"])(32);
            await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs$2f$promises__$5b$external$5d$__$28$node$3a$fs$2f$promises$2c$__cjs$29$__["writeFile"])(saltPath, salt);
            return salt;
        }
    }
    encrypt(data) {
        if (!this.derivedKey) throw new Error('Vault is locked');
        const iv = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["randomBytes"])(12);
        const cipher = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["createCipheriv"])('aes-256-gcm', this.derivedKey, iv);
        const plaintext = Buffer.from(JSON.stringify(data), 'utf-8');
        const encrypted = Buffer.concat([
            cipher.update(plaintext),
            cipher.final()
        ]);
        const tag = cipher.getAuthTag();
        return Buffer.concat([
            iv,
            tag,
            encrypted
        ]);
    }
    decrypt(raw) {
        if (!this.derivedKey) throw new Error('Vault is locked');
        const iv = raw.subarray(0, 12);
        const tag = raw.subarray(12, 28);
        const ciphertext = raw.subarray(28);
        const decipher = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["createDecipheriv"])('aes-256-gcm', this.derivedKey, iv);
        decipher.setAuthTag(tag);
        const decrypted = Buffer.concat([
            decipher.update(ciphertext),
            decipher.final()
        ]);
        return JSON.parse(decrypted.toString('utf-8'));
    }
    async vaultExists() {
        try {
            await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs$2f$promises__$5b$external$5d$__$28$node$3a$fs$2f$promises$2c$__cjs$29$__["access"])(this.config.vaultPath);
            return true;
        } catch  {
            return false;
        }
    }
    ensureUnlocked() {
        if (!this.derivedKey) {
            throw new Error('Vault is locked. Call unlock() first.');
        }
    }
} //# sourceMappingURL=vault.js.map
}),
"[project]/packages/agent-core/dist/vault/index.js [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$agent$2d$core$2f$dist$2f$vault$2f$vault$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/agent-core/dist/vault/vault.js [app-route] (ecmascript)"); //# sourceMappingURL=index.js.map
;
}),
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[externals]/os [external] (os, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("os", () => require("os"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[project]/packages/agent-core/dist/config/loader.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "defaultPreferences",
    ()=>defaultPreferences,
    "loadConfig",
    ()=>loadConfig
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$dotenv$2f$lib$2f$main$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/dotenv/lib/main.js [app-route] (ecmascript)");
;
function loadConfig() {
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$dotenv$2f$lib$2f$main$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["config"])();
    return {
        duffelToken: process.env.DUFFEL_ACCESS_TOKEN,
        duffelEnv: process.env.DUFFEL_ENV || 'test',
        anthropicApiKey: process.env.ANTHROPIC_API_KEY,
        defaultOrigin: process.env.DEFAULT_ORIGIN,
        defaultCurrency: process.env.DEFAULT_CURRENCY || 'USD',
        defaultCabin: process.env.DEFAULT_CABIN || 'ECONOMY',
        provider: process.env.DUFFEL_ACCESS_TOKEN ? 'duffel' : 'mock'
    };
}
function defaultPreferences(config) {
    return {
        homeAirports: config.defaultOrigin ? [
            config.defaultOrigin
        ] : [],
        preferredAirlines: [],
        preferredAlliances: [],
        maxStops: 2,
        maxLayoverMinutes: 240,
        currency: config.defaultCurrency
    };
} //# sourceMappingURL=loader.js.map
}),
"[project]/packages/agent-core/dist/config/cards.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEFAULT_POINT_VALUATIONS",
    ()=>DEFAULT_POINT_VALUATIONS,
    "SAMPLE_CARDS",
    ()=>SAMPLE_CARDS,
    "buildCardProfile",
    ()=>buildCardProfile
]);
const SAMPLE_CARDS = [
    {
        id: 'chase-sapphire-preferred',
        name: 'Chase Sapphire Preferred',
        issuer: 'Chase',
        network: 'Visa',
        annualFee: 95,
        categories: [
            {
                category: 'travel',
                multiplier: 5,
                description: '5x on travel booked via Chase Travel'
            },
            {
                category: 'dining',
                multiplier: 3
            },
            {
                category: 'general',
                multiplier: 1
            }
        ],
        perks: [
            {
                type: 'trip_delay_insurance',
                description: 'Trip delay reimbursement',
                value: 25
            },
            {
                type: 'no_foreign_transaction_fee',
                description: 'No foreign transaction fees'
            }
        ]
    },
    {
        id: 'chase-sapphire-reserve',
        name: 'Chase Sapphire Reserve',
        issuer: 'Chase',
        network: 'Visa',
        annualFee: 550,
        categories: [
            {
                category: 'travel',
                multiplier: 10,
                description: '10x on hotels and car rentals via Chase Travel'
            },
            {
                category: 'airlines',
                multiplier: 5,
                description: '5x on flights via Chase Travel'
            },
            {
                category: 'dining',
                multiplier: 3
            },
            {
                category: 'general',
                multiplier: 1
            }
        ],
        perks: [
            {
                type: 'travel_credit',
                description: '$300 annual travel credit',
                value: 300
            },
            {
                type: 'lounge_access',
                description: 'Priority Pass lounge access',
                value: 150
            },
            {
                type: 'global_entry_credit',
                description: 'Global Entry/TSA PreCheck credit',
                value: 20
            },
            {
                type: 'no_foreign_transaction_fee',
                description: 'No foreign transaction fees'
            },
            {
                type: 'trip_delay_insurance',
                description: 'Trip delay reimbursement',
                value: 50
            }
        ]
    },
    {
        id: 'amex-platinum',
        name: 'Amex Platinum',
        issuer: 'Amex',
        network: 'Amex',
        annualFee: 695,
        categories: [
            {
                category: 'airlines',
                multiplier: 5,
                description: '5x on flights booked directly with airlines'
            },
            {
                category: 'travel',
                multiplier: 5,
                description: '5x on prepaid hotels via Amex Travel'
            },
            {
                category: 'general',
                multiplier: 1
            }
        ],
        perks: [
            {
                type: 'lounge_access',
                description: 'Centurion Lounge + Priority Pass',
                value: 300
            },
            {
                type: 'travel_credit',
                description: '$200 airline fee credit',
                value: 200
            },
            {
                type: 'global_entry_credit',
                description: 'Global Entry/TSA PreCheck credit',
                value: 20
            },
            {
                type: 'no_foreign_transaction_fee',
                description: 'No foreign transaction fees'
            }
        ]
    },
    {
        id: 'capital-one-venture',
        name: 'Capital One Venture',
        issuer: 'Capital One',
        network: 'Visa',
        annualFee: 95,
        categories: [
            {
                category: 'travel',
                multiplier: 5,
                description: '5x on hotels and car rentals via Capital One Travel'
            },
            {
                category: 'airlines',
                multiplier: 5,
                description: '5x on flights via Capital One Travel'
            },
            {
                category: 'general',
                multiplier: 2
            }
        ],
        perks: [
            {
                type: 'global_entry_credit',
                description: 'Global Entry/TSA PreCheck credit',
                value: 20
            },
            {
                type: 'no_foreign_transaction_fee',
                description: 'No foreign transaction fees'
            }
        ]
    },
    {
        id: 'capital-one-venture-x',
        name: 'Capital One Venture X',
        issuer: 'Capital One',
        network: 'Visa',
        annualFee: 395,
        categories: [
            {
                category: 'travel',
                multiplier: 10,
                description: '10x on hotels and car rentals via Capital One Travel'
            },
            {
                category: 'airlines',
                multiplier: 5,
                description: '5x on flights via Capital One Travel'
            },
            {
                category: 'general',
                multiplier: 2
            }
        ],
        perks: [
            {
                type: 'travel_credit',
                description: '$300 annual travel credit',
                value: 300
            },
            {
                type: 'lounge_access',
                description: 'Capital One Lounge + Priority Pass + Plaza Premium',
                value: 250
            },
            {
                type: 'global_entry_credit',
                description: 'Global Entry/TSA PreCheck credit',
                value: 20
            },
            {
                type: 'no_foreign_transaction_fee',
                description: 'No foreign transaction fees'
            }
        ]
    },
    {
        id: 'united-explorer',
        name: 'United Explorer Card',
        issuer: 'Chase',
        network: 'Visa',
        annualFee: 95,
        categories: [
            {
                category: 'airlines',
                multiplier: 2,
                description: '2x on United purchases',
                airlines: [
                    'UA'
                ]
            },
            {
                category: 'travel',
                multiplier: 2,
                description: '2x on other travel'
            },
            {
                category: 'dining',
                multiplier: 2
            },
            {
                category: 'general',
                multiplier: 1
            }
        ],
        perks: [
            {
                type: 'free_checked_bag',
                description: 'Free first checked bag on United',
                value: 70,
                airlines: [
                    'UA'
                ]
            },
            {
                type: 'priority_boarding',
                description: 'Priority boarding on United',
                airlines: [
                    'UA'
                ]
            },
            {
                type: 'no_foreign_transaction_fee',
                description: 'No foreign transaction fees'
            }
        ]
    },
    {
        id: 'delta-skymiles-gold',
        name: 'Delta SkyMiles Gold',
        issuer: 'Amex',
        network: 'Amex',
        annualFee: 150,
        categories: [
            {
                category: 'airlines',
                multiplier: 2,
                description: '2x on Delta purchases',
                airlines: [
                    'DL'
                ]
            },
            {
                category: 'dining',
                multiplier: 2
            },
            {
                category: 'general',
                multiplier: 1
            }
        ],
        perks: [
            {
                type: 'free_checked_bag',
                description: 'Free first checked bag on Delta',
                value: 70,
                airlines: [
                    'DL'
                ]
            },
            {
                type: 'priority_boarding',
                description: 'Priority boarding on Delta',
                airlines: [
                    'DL'
                ]
            },
            {
                type: 'no_foreign_transaction_fee',
                description: 'No foreign transaction fees'
            }
        ]
    }
];
const DEFAULT_POINT_VALUATIONS = {
    Chase: 1.5,
    Amex: 1.5,
    'Capital One': 1.5,
    Citi: 1.2
};
function buildCardProfile(cardIds) {
    const cards = SAMPLE_CARDS.filter((c)=>cardIds.includes(c.id));
    return {
        cards,
        preferredPointValuation: DEFAULT_POINT_VALUATIONS
    };
} //# sourceMappingURL=cards.js.map
}),
"[externals]/node:path [external] (node:path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:path", () => require("node:path"));

module.exports = mod;
}),
"[externals]/node:os [external] (node:os, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:os", () => require("node:os"));

module.exports = mod;
}),
"[project]/packages/agent-core/dist/config/profile.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getProfilePath",
    ()=>getProfilePath,
    "loadProfile",
    ()=>loadProfile,
    "saveProfile",
    ()=>saveProfile
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs$2f$promises__$5b$external$5d$__$28$node$3a$fs$2f$promises$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:fs/promises [external] (node:fs/promises, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:path [external] (node:path, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$os__$5b$external$5d$__$28$node$3a$os$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:os [external] (node:os, cjs)");
;
;
;
const PROFILE_DIR = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["join"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$os__$5b$external$5d$__$28$node$3a$os$2c$__cjs$29$__["homedir"])(), '.travel-agent');
const PROFILE_PATH = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["join"])(PROFILE_DIR, 'profile.json');
const DEFAULT_PROFILE = {
    cardIds: [],
    preferences: {
        homeAirports: [],
        preferredAirlines: [],
        preferredAlliances: [],
        maxStops: 2,
        maxLayoverMinutes: 240,
        currency: 'USD'
    }
};
async function loadProfile() {
    try {
        const raw = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs$2f$promises__$5b$external$5d$__$28$node$3a$fs$2f$promises$2c$__cjs$29$__["readFile"])(PROFILE_PATH, 'utf-8');
        return {
            ...DEFAULT_PROFILE,
            ...JSON.parse(raw)
        };
    } catch  {
        return {
            ...DEFAULT_PROFILE
        };
    }
}
async function saveProfile(profile) {
    await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs$2f$promises__$5b$external$5d$__$28$node$3a$fs$2f$promises$2c$__cjs$29$__["mkdir"])(PROFILE_DIR, {
        recursive: true
    });
    await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs$2f$promises__$5b$external$5d$__$28$node$3a$fs$2f$promises$2c$__cjs$29$__["writeFile"])(PROFILE_PATH, JSON.stringify(profile, null, 2), 'utf-8');
}
function getProfilePath() {
    return PROFILE_PATH;
} //# sourceMappingURL=profile.js.map
}),
"[project]/packages/agent-core/dist/config/index.js [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$agent$2d$core$2f$dist$2f$config$2f$loader$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/agent-core/dist/config/loader.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$agent$2d$core$2f$dist$2f$config$2f$cards$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/agent-core/dist/config/cards.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$agent$2d$core$2f$dist$2f$config$2f$profile$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/agent-core/dist/config/profile.js [app-route] (ecmascript)"); //# sourceMappingURL=index.js.map
;
;
;
}),
"[externals]/node:process [external] (node:process, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:process", () => require("node:process"));

module.exports = mod;
}),
"[externals]/node:tty [external] (node:tty, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:tty", () => require("node:tty"));

module.exports = mod;
}),
"[project]/packages/agent-core/dist/output/formatter.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "formatBookingDetails",
    ()=>formatBookingDetails,
    "formatRankedResults",
    ()=>formatRankedResults,
    "formatResultsJson",
    ()=>formatResultsJson
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/chalk/source/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$agent$2d$core$2f$dist$2f$scoring$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/agent-core/dist/scoring/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$agent$2d$core$2f$dist$2f$scoring$2f$scorer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/agent-core/dist/scoring/scorer.js [app-route] (ecmascript)");
;
;
function formatRankedResults(scored, topN = 5) {
    const lines = [];
    const top = scored.slice(0, topN);
    lines.push('');
    lines.push(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].bold.cyan(`  ✈  Top ${top.length} Flight Options`));
    lines.push(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].dim('  ─'.repeat(30)));
    lines.push('');
    for(let i = 0; i < top.length; i++){
        lines.push(formatOffer(top[i], i + 1));
        lines.push('');
    }
    lines.push(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].dim('  Select an option: travel-agent book --offer <number>'));
    lines.push('');
    return lines.join('\n');
}
function formatOffer(scored, rank) {
    const { offer, score, cardRecommendation } = scored;
    const lines = [];
    const rankLabel = rank <= 3 ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].bold.yellow(`  #${rank}`) : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].bold(`  #${rank}`);
    const carrier = offer.validatingCarrier || offer.outbound.segments[0].carrier;
    const carrierName = offer.outbound.segments[0].carrierName || carrier;
    lines.push(`${rankLabel}  ${__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].bold(carrierName)} — ${__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].green.bold(`$${offer.price.total.toFixed(2)}`)} ${__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].dim(offer.price.currency)}  ${__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].dim(`(score: ${(score * 100).toFixed(0)})`)}`);
    lines.push(formatItinerary('  OUT', offer.outbound));
    if (offer.inbound) {
        lines.push(formatItinerary('  RET', offer.inbound));
    }
    if (offer.seatsRemaining && offer.seatsRemaining <= 4) {
        lines.push(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].red(`      ⚠ Only ${offer.seatsRemaining} seats left`));
    }
    if (cardRecommendation) {
        const effectivePrice = offer.price.total - cardRecommendation.totalEstimatedValue;
        lines.push(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].magenta(`      💳 ${cardRecommendation.rationale}`));
        lines.push(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].dim(`         Effective price after rewards: `) + __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].green(`$${effectivePrice.toFixed(2)}`));
    }
    return lines.join('\n');
}
function formatItinerary(label, itinerary) {
    const first = itinerary.segments[0];
    const last = itinerary.segments[itinerary.segments.length - 1];
    const depTime = formatTime(first.departure.at);
    const arrTime = formatTime(last.arrival.at);
    const dur = formatDuration(itinerary.duration);
    const stopsLabel = itinerary.stops === 0 ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].green('nonstop') : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].yellow(`${itinerary.stops} stop${itinerary.stops > 1 ? 's' : ''}`);
    const flightNums = itinerary.segments.map((s)=>s.flightNumber).join(' → ');
    return `    ${__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].dim(label)}  ${first.departure.airport} ${depTime} → ${last.arrival.airport} ${arrTime}  ${dur}  ${stopsLabel}  ${__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].dim(flightNums)}`;
}
function formatTime(isoDate) {
    const d = new Date(isoDate);
    const h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? 'pm' : 'am';
    const h12 = h % 12 || 12;
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].bold(`${h12}:${m}${ampm}`);
}
function formatDuration(isoDuration) {
    const totalMin = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$agent$2d$core$2f$dist$2f$scoring$2f$scorer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseDurationMinutes"])(isoDuration);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].dim(`${h}h${m > 0 ? ` ${m}m` : ''}`);
}
function formatBookingDetails(scored, vaultData) {
    const { offer, cardRecommendation } = scored;
    const lines = [];
    lines.push('');
    lines.push(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].bold.cyan('  📋 Ready-to-Book Details'));
    lines.push(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].dim('  ─'.repeat(30)));
    lines.push('');
    // Itinerary
    lines.push(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].bold('  Itinerary'));
    const outSeg = offer.outbound.segments;
    lines.push(formatItinerary('  OUT', offer.outbound));
    if (outSeg.length > 1) {
        for(let i = 0; i < outSeg.length; i++){
            const s = outSeg[i];
            lines.push(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].dim(`         Leg ${i + 1}: ${s.flightNumber}  ${s.departure.airport}→${s.arrival.airport}  ${formatDuration(s.duration)}  ${s.carrierName || s.carrier}`));
        }
    }
    if (offer.inbound) {
        lines.push(formatItinerary('  RET', offer.inbound));
        const retSeg = offer.inbound.segments;
        if (retSeg.length > 1) {
            for(let i = 0; i < retSeg.length; i++){
                const s = retSeg[i];
                lines.push(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].dim(`         Leg ${i + 1}: ${s.flightNumber}  ${s.departure.airport}→${s.arrival.airport}  ${formatDuration(s.duration)}  ${s.carrierName || s.carrier}`));
            }
        }
    }
    lines.push('');
    // Fare breakdown
    lines.push(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].bold('  Fare'));
    lines.push(`    Total: ${__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].green.bold(`$${offer.price.total.toFixed(2)}`)} ${offer.price.currency}`);
    if (offer.price.base) {
        lines.push(`    Base:  $${offer.price.base.toFixed(2)}  |  Taxes: $${(offer.price.taxes || 0).toFixed(2)}`);
    }
    if (offer.price.perPassenger) {
        lines.push(`    Per passenger: $${offer.price.perPassenger.toFixed(2)}`);
    }
    lines.push('');
    // Payment / card recommendation
    if (cardRecommendation) {
        const effectivePrice = offer.price.total - cardRecommendation.totalEstimatedValue;
        lines.push(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].bold('  Payment Recommendation'));
        lines.push(`    ${__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].magenta.bold(cardRecommendation.card.name)} (${cardRecommendation.card.network})`);
        lines.push(`    Rewards earned:   ${__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].green(`$${cardRecommendation.estimatedRewardsValue.toFixed(2)}`)}`);
        if (cardRecommendation.applicablePerks.length > 0) {
            lines.push('    Applicable perks:');
            for (const perk of cardRecommendation.applicablePerks){
                lines.push(`      • ${perk.description}${perk.value ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].dim(` (~$${perk.value}/yr)`) : ''}`);
            }
        }
        lines.push(`    Total value:      ${__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].green(`$${cardRecommendation.totalEstimatedValue.toFixed(2)}`)}`);
        lines.push(`    Effective price:  ${__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].green.bold(`$${effectivePrice.toFixed(2)}`)}`);
        lines.push('');
    }
    // Passenger details from vault
    if (vaultData) {
        const p = vaultData.identity.passport;
        lines.push(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].bold('  Passenger Details (from vault)'));
        lines.push(`    Full name:    ${p.fullName}`);
        lines.push(`    Date of birth: ${p.dateOfBirth}`);
        lines.push(`    Gender:       ${p.gender}`);
        lines.push(`    Passport:     ${maskString(p.number)} (${p.issuingCountry}, exp ${p.expiryDate})`);
        if (vaultData.identity.knownTravelerNumber) {
            lines.push(`    KTN:          ${vaultData.identity.knownTravelerNumber}`);
        }
        if (vaultData.identity.redressNumber) {
            lines.push(`    Redress:      ${vaultData.identity.redressNumber}`);
        }
        const carrier = offer.validatingCarrier;
        const relevantFF = carrier ? vaultData.identity.frequentFlyer.find((ff)=>ff.airlineCode === carrier) : undefined;
        if (relevantFF) {
            lines.push(`    FF#:          ${relevantFF.airline} — ${relevantFF.number}`);
        }
        const otherFF = vaultData.identity.frequentFlyer.filter((ff)=>ff.airlineCode !== carrier);
        if (otherFF.length > 0) {
            lines.push(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].dim(`    Other FF#:    ${otherFF.map((ff)=>`${ff.airlineCode}:${ff.number}`).join(', ')}`));
        }
        lines.push('');
    }
    // Booking links
    lines.push(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].bold('  Book'));
    const carrier = offer.validatingCarrier || offer.outbound.segments[0].carrier;
    const deeplink = buildBookingDeeplink(offer);
    if (deeplink) {
        lines.push(`    ${__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].underline(deeplink)}`);
    }
    lines.push(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].dim(`    Search on Google Flights: ${buildGoogleFlightsLink(offer)}`));
    lines.push('');
    return lines.join('\n');
}
function formatResultsJson(scored, topN = 5) {
    const top = scored.slice(0, topN);
    return JSON.stringify(top.map(({ offer, score, breakdown, cardRecommendation })=>({
            id: offer.id,
            carrier: offer.validatingCarrier,
            price: offer.price,
            outbound: summarizeItinerary(offer.outbound),
            inbound: offer.inbound ? summarizeItinerary(offer.inbound) : null,
            score: Math.round(score * 100),
            breakdown,
            cardRecommendation: cardRecommendation ? {
                card: cardRecommendation.card.name,
                estimatedRewardsValue: cardRecommendation.estimatedRewardsValue,
                totalEstimatedValue: cardRecommendation.totalEstimatedValue,
                effectivePrice: offer.price.total - cardRecommendation.totalEstimatedValue,
                rationale: cardRecommendation.rationale
            } : null,
            bookingLinks: {
                googleFlights: buildGoogleFlightsLink(offer)
            }
        })), null, 2);
}
function summarizeItinerary(it) {
    const lastSeg = it.segments[it.segments.length - 1];
    return {
        route: it.segments.map((s)=>s.departure.airport).concat(lastSeg.arrival.airport).join('→'),
        flights: it.segments.map((s)=>s.flightNumber),
        stops: it.stops,
        duration: it.duration
    };
}
function maskString(s) {
    if (s.length <= 4) return '****';
    return '***' + s.slice(-4);
}
function buildBookingDeeplink(offer) {
    const carrier = offer.validatingCarrier || offer.outbound.segments[0].carrier;
    const airlineUrls = {
        AA: 'https://www.aa.com',
        UA: 'https://www.united.com',
        DL: 'https://www.delta.com',
        BA: 'https://www.britishairways.com',
        AF: 'https://www.airfrance.com',
        LH: 'https://www.lufthansa.com',
        IB: 'https://www.iberia.com',
        EK: 'https://www.emirates.com',
        SQ: 'https://www.singaporeair.com',
        QF: 'https://www.qantas.com',
        AC: 'https://www.aircanada.com',
        NH: 'https://www.ana.co.jp/en',
        JL: 'https://www.jal.co.jp/en',
        KL: 'https://www.klm.com',
        SK: 'https://www.flysas.com',
        FI: 'https://www.icelandair.com',
        AS: 'https://www.alaskaair.com',
        WN: 'https://www.southwest.com',
        B6: 'https://www.jetblue.com',
        NK: 'https://www.spirit.com',
        F9: 'https://www.flyfrontier.com'
    };
    return airlineUrls[carrier] || null;
}
function buildGoogleFlightsLink(offer) {
    const origin = offer.outbound.segments[0].departure.airport;
    const lastSeg = offer.outbound.segments[offer.outbound.segments.length - 1];
    const dest = lastSeg.arrival.airport;
    const depDate = offer.outbound.segments[0].departure.at.slice(0, 10);
    let url = `https://www.google.com/travel/flights?q=flights+from+${origin}+to+${dest}+on+${depDate}`;
    if (offer.inbound) {
        const retDate = offer.inbound.segments[0].departure.at.slice(0, 10);
        url += `+return+${retDate}`;
    }
    return url;
} //# sourceMappingURL=formatter.js.map
}),
"[project]/packages/agent-core/dist/output/flex-formatter.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "formatDateGrid",
    ()=>formatDateGrid,
    "formatDatePriceMatrix",
    ()=>formatDatePriceMatrix,
    "formatFlexResultsJson",
    ()=>formatFlexResultsJson
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/chalk/source/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$agent$2d$core$2f$dist$2f$scoring$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/agent-core/dist/scoring/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$agent$2d$core$2f$dist$2f$scoring$2f$scorer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/agent-core/dist/scoring/scorer.js [app-route] (ecmascript)");
;
;
function formatDateGrid(result, topN = 10) {
    const lines = [];
    const { cells, bestOverall, searchedCombinations, totalOffersFound, searchDurationMs, cachedHits } = result;
    lines.push('');
    lines.push(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].bold.cyan(`  📅 Flexible Date Search Results`));
    lines.push(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].dim('  ─'.repeat(30)));
    lines.push('');
    lines.push(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].dim(`  ${result.request.origin} → ${result.request.destination}  |  Mode: ${result.request.mode}`));
    lines.push(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].dim(`  Searched ${searchedCombinations} date combinations in ${(searchDurationMs / 1000).toFixed(1)}s  |  ${totalOffersFound} total flights  |  ${cachedHits} cached`));
    lines.push('');
    if (cells.length === 0) {
        lines.push(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].yellow('  No flights found for any date combination.'));
        lines.push('');
        return lines.join('\n');
    }
    if (bestOverall) {
        lines.push(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].bold.green(`  ⭐ Best: $${bestOverall.bestPrice.toFixed(2)}  —  ${bestOverall.datePair.departureDate}${bestOverall.datePair.returnDate ? ` → ${bestOverall.datePair.returnDate}` : ''}`));
        const carrier = bestOverall.bestOffer.validatingCarrier || bestOverall.bestOffer.outbound.segments[0].carrier;
        const carrierName = bestOverall.bestOffer.outbound.segments[0].carrierName || carrier;
        const dur = formatDuration(bestOverall.bestOffer.outbound.duration);
        const stops = bestOverall.bestOffer.outbound.stops === 0 ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].green('nonstop') : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].yellow(`${bestOverall.bestOffer.outbound.stops} stop${bestOverall.bestOffer.outbound.stops > 1 ? 's' : ''}`);
        lines.push(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].dim(`        ${carrierName}  ${dur}  ${stops}  (${bestOverall.offerCount} options)`));
        lines.push('');
    }
    lines.push(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].bold('  All Date Options (by price)'));
    lines.push('');
    const top = cells.slice(0, topN);
    for(let i = 0; i < top.length; i++){
        lines.push(formatGridCell(top[i], i + 1, bestOverall?.bestPrice));
    }
    if (cells.length > topN) {
        lines.push(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].dim(`  ... and ${cells.length - topN} more date combinations`));
    }
    lines.push('');
    return lines.join('\n');
}
function formatGridCell(cell, rank, bestPrice) {
    const { datePair, bestPrice: price, bestOffer, offerCount } = cell;
    const carrier = bestOffer.validatingCarrier || bestOffer.outbound.segments[0].carrier;
    const carrierName = bestOffer.outbound.segments[0].carrierName || carrier;
    const dur = formatDuration(bestOffer.outbound.duration);
    const stops = bestOffer.outbound.stops === 0 ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].green('nonstop') : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].yellow(`${bestOffer.outbound.stops} stop${bestOffer.outbound.stops > 1 ? 's' : ''}`);
    const dateRange = datePair.returnDate ? `${datePair.departureDate} → ${datePair.returnDate}` : datePair.departureDate;
    const priceDiff = bestPrice && price > bestPrice ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].dim(` (+$${(price - bestPrice).toFixed(0)})`) : '';
    const priceColor = rank <= 3 ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].green.bold : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].white;
    return `  ${__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].dim(`#${rank}`)}  ${priceColor(`$${price.toFixed(2)}`)}${priceDiff}  ${dateRange}  ${carrierName}  ${dur}  ${stops}  ${__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].dim(`(${offerCount} flights)`)}`;
}
function formatDatePriceMatrix(result) {
    const lines = [];
    const { cells, request } = result;
    if (cells.length === 0) return '  No data for matrix.\n';
    lines.push('');
    lines.push(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].bold.cyan('  📊 Date–Price Matrix'));
    lines.push(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].dim('  ─'.repeat(30)));
    lines.push('');
    if (request.mode === 'date-flex' && request.returnDate) {
        return lines.join('\n') + formatTwoDimensionalMatrix(cells, request.departureDate, request.returnDate);
    }
    for (const cell of cells){
        const bar = priceBar(cell.bestPrice, cells);
        const dateLabel = cell.datePair.returnDate ? `${cell.datePair.departureDate} → ${cell.datePair.returnDate}` : cell.datePair.departureDate;
        lines.push(`  ${dateLabel}  ${__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].green(`$${cell.bestPrice.toFixed(0)}`)}  ${bar}`);
    }
    lines.push('');
    return lines.join('\n');
}
function formatTwoDimensionalMatrix(cells, baseDep, baseRet) {
    const depDates = [
        ...new Set(cells.map((c)=>c.datePair.departureDate))
    ].sort();
    const retDates = [
        ...new Set(cells.map((c)=>c.datePair.returnDate))
    ].sort();
    const priceMap = new Map();
    let minPrice = Infinity;
    let maxPrice = 0;
    for (const cell of cells){
        const key = `${cell.datePair.departureDate}|${cell.datePair.returnDate}`;
        priceMap.set(key, cell.bestPrice);
        if (cell.bestPrice < minPrice) minPrice = cell.bestPrice;
        if (cell.bestPrice > maxPrice) maxPrice = cell.bestPrice;
    }
    const lines = [];
    const colWidth = 8;
    // Header
    const header = '  Dep \\ Ret  ' + retDates.map((d)=>d.slice(5).padStart(colWidth)).join('');
    lines.push(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].dim(header));
    for (const dep of depDates){
        let row = `  ${dep.slice(5)}       `;
        for (const ret of retDates){
            const key = `${dep}|${ret}`;
            const price = priceMap.get(key);
            if (price !== undefined) {
                const formatted = `$${price.toFixed(0)}`;
                const colored = price === minPrice ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].green.bold(formatted) : price <= minPrice * 1.1 ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].green(formatted) : price >= maxPrice * 0.9 ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].red(formatted) : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].white(formatted);
                row += colored.padStart(colWidth);
            } else {
                row += __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].dim('   ---').padStart(colWidth);
            }
        }
        lines.push(row);
    }
    lines.push('');
    lines.push(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].dim(`  ${__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].green('■')} cheapest   ${__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].white('■')} mid-range   ${__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].red('■')} most expensive`));
    lines.push('');
    return lines.join('\n');
}
function priceBar(price, allCells) {
    const prices = allCells.map((c)=>c.bestPrice);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (max === min) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].green('████████████████');
    const ratio = (price - min) / (max - min);
    const filled = Math.round((1 - ratio) * 16);
    const bar = '█'.repeat(filled) + '░'.repeat(16 - filled);
    if (ratio < 0.33) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].green(bar);
    if (ratio < 0.66) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].yellow(bar);
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].red(bar);
}
function formatFlexResultsJson(result) {
    return JSON.stringify({
        mode: result.request.mode,
        origin: result.request.origin,
        destination: result.request.destination,
        searchedCombinations: result.searchedCombinations,
        totalOffersFound: result.totalOffersFound,
        searchDurationMs: result.searchDurationMs,
        cachedHits: result.cachedHits,
        bestOverall: result.bestOverall ? {
            price: result.bestOverall.bestPrice,
            dates: result.bestOverall.datePair,
            carrier: result.bestOverall.bestOffer.validatingCarrier,
            stops: result.bestOverall.bestOffer.outbound.stops,
            duration: result.bestOverall.bestOffer.outbound.duration
        } : null,
        cells: result.cells.map((c)=>({
                dates: c.datePair,
                bestPrice: c.bestPrice,
                carrier: c.bestOffer.validatingCarrier,
                stops: c.bestOffer.outbound.stops,
                offerCount: c.offerCount
            }))
    }, null, 2);
}
function formatDuration(isoDuration) {
    const totalMin = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$agent$2d$core$2f$dist$2f$scoring$2f$scorer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseDurationMinutes"])(isoDuration);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chalk$2f$source$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"].dim(`${h}h${m > 0 ? ` ${m}m` : ''}`);
} //# sourceMappingURL=flex-formatter.js.map
}),
"[project]/packages/agent-core/dist/output/index.js [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$agent$2d$core$2f$dist$2f$output$2f$formatter$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/agent-core/dist/output/formatter.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$agent$2d$core$2f$dist$2f$output$2f$flex$2d$formatter$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/agent-core/dist/output/flex-formatter.js [app-route] (ecmascript)"); //# sourceMappingURL=index.js.map
;
;
}),
"[project]/packages/agent-core/dist/flexible/engine.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "FlexibleSearchEngine",
    ()=>FlexibleSearchEngine,
    "generateDateFlexPairs",
    ()=>generateDateFlexPairs,
    "generateDatePairs",
    ()=>generateDatePairs,
    "generateTripLengthPairs",
    ()=>generateTripLengthPairs,
    "generateWeekendPairs",
    ()=>generateWeekendPairs
]);
const DEFAULT_CONCURRENCY = 3;
const DEFAULT_MAX_COMBINATIONS = 30;
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
class FlexibleSearchEngine {
    provider;
    cache = new Map();
    concurrency;
    maxCombinations;
    cacheTtlMs;
    onProgress;
    constructor(provider, options){
        this.provider = provider;
        this.concurrency = options?.concurrency ?? DEFAULT_CONCURRENCY;
        this.maxCombinations = options?.maxCombinations ?? DEFAULT_MAX_COMBINATIONS;
        this.cacheTtlMs = options?.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
        this.onProgress = options?.onProgress;
    }
    async search(request) {
        const concurrency = request.concurrencyLimit ?? this.concurrency;
        const maxCombos = request.maxCombinations ?? this.maxCombinations;
        const cacheTtl = request.cacheTtlMs ?? this.cacheTtlMs;
        let datePairs = generateDatePairs(request);
        if (datePairs.length > maxCombos) {
            datePairs = datePairs.slice(0, maxCombos);
        }
        const startTime = Date.now();
        const cells = [];
        let totalOffers = 0;
        let cachedHits = 0;
        const queue = [
            ...datePairs
        ];
        let completed = 0;
        const worker = async ()=>{
            while(queue.length > 0){
                const pair = queue.shift();
                const cacheKey = this.buildCacheKey(request.origin, request.destination, pair);
                const cached = this.getFromCache(cacheKey, cacheTtl);
                let result;
                if (cached) {
                    result = cached;
                    cachedHits++;
                } else {
                    const searchReq = this.buildSearchRequest(pair, request);
                    result = await this.provider.search(searchReq);
                    this.setCache(cacheKey, result, cacheTtl);
                }
                if (result.offers.length > 0) {
                    const sorted = [
                        ...result.offers
                    ].sort((a, b)=>a.price.total - b.price.total);
                    cells.push({
                        datePair: pair,
                        bestPrice: sorted[0].price.total,
                        bestOffer: sorted[0],
                        offerCount: sorted.length
                    });
                    totalOffers += result.offers.length;
                }
                completed++;
                this.onProgress?.({
                    completed,
                    total: datePairs.length,
                    currentPair: pair
                });
            }
        };
        const workers = Array.from({
            length: Math.min(concurrency, datePairs.length)
        }, ()=>worker());
        await Promise.all(workers);
        cells.sort((a, b)=>a.bestPrice - b.bestPrice);
        return {
            request,
            cells,
            bestOverall: cells[0] ?? null,
            searchedCombinations: datePairs.length,
            totalOffersFound: totalOffers,
            searchDurationMs: Date.now() - startTime,
            cachedHits
        };
    }
    clearCache() {
        this.cache.clear();
    }
    buildSearchRequest(pair, flex) {
        return {
            tripType: pair.returnDate ? 'round-trip' : 'one-way',
            origin: flex.origin,
            destination: flex.destination,
            departureDate: pair.departureDate,
            returnDate: pair.returnDate,
            passengers: flex.passengers,
            cabin: flex.cabin,
            maxStops: flex.maxStops,
            maxPrice: flex.maxPrice,
            directOnly: flex.directOnly,
            preferredAirlines: flex.preferredAirlines,
            currency: flex.currency
        };
    }
    buildCacheKey(origin, dest, pair) {
        return `${origin}-${dest}-${pair.departureDate}-${pair.returnDate ?? 'ow'}`;
    }
    getFromCache(key, ttl) {
        const entry = this.cache.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        return entry.result;
    }
    setCache(key, result, ttl) {
        this.cache.set(key, {
            result,
            expiresAt: Date.now() + ttl
        });
    }
}
function generateDatePairs(request) {
    switch(request.mode){
        case 'exact':
            return [
                {
                    departureDate: request.departureDate,
                    returnDate: request.returnDate
                }
            ];
        case 'date-flex':
            return generateDateFlexPairs(request.departureDate, request.returnDate, request.flexDays ?? 2);
        case 'weekend':
            return generateWeekendPairs(request.targetMonth);
        case 'trip-length':
            return generateTripLengthPairs(request.targetMonth, request.tripLengthMin ?? 3, request.tripLengthMax ?? 5);
        default:
            return [
                {
                    departureDate: request.departureDate,
                    returnDate: request.returnDate
                }
            ];
    }
}
function generateDateFlexPairs(baseDeparture, baseReturn, flexDays) {
    const pairs = [];
    const baseDepDate = parseDate(baseDeparture);
    if (!baseReturn) {
        for(let d = -flexDays; d <= flexDays; d++){
            const dep = addDays(baseDepDate, d);
            pairs.push({
                departureDate: formatDate(dep)
            });
        }
        return pairs;
    }
    const baseRetDate = parseDate(baseReturn);
    for(let d = -flexDays; d <= flexDays; d++){
        for(let r = -flexDays; r <= flexDays; r++){
            const dep = addDays(baseDepDate, d);
            const ret = addDays(baseRetDate, r);
            if (ret > dep) {
                pairs.push({
                    departureDate: formatDate(dep),
                    returnDate: formatDate(ret)
                });
            }
        }
    }
    return pairs;
}
function generateWeekendPairs(targetMonth) {
    const [year, month] = targetMonth.split('-').map(Number);
    const pairs = [];
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0).getDate();
    for(let day = 1; day <= lastDay; day++){
        const date = new Date(year, month - 1, day);
        // Friday = 5
        if (date.getDay() === 5) {
            const friday = new Date(year, month - 1, day);
            const sunday = addDays(friday, 2);
            pairs.push({
                departureDate: formatDate(friday),
                returnDate: formatDate(sunday)
            });
        }
    }
    return pairs;
}
function generateTripLengthPairs(targetMonth, minDays, maxDays) {
    const [year, month] = targetMonth.split('-').map(Number);
    const pairs = [];
    const lastDay = new Date(year, month, 0).getDate();
    for(let day = 1; day <= lastDay; day++){
        const depDate = new Date(year, month - 1, day);
        for(let len = minDays; len <= maxDays; len++){
            const retDate = addDays(depDate, len);
            // Allow return dates to spill into the next month
            pairs.push({
                departureDate: formatDate(depDate),
                returnDate: formatDate(retDate)
            });
        }
    }
    return pairs;
}
// --- Date helpers ---
function parseDate(s) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
}
function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}
function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
} //# sourceMappingURL=engine.js.map
}),
"[project]/packages/agent-core/dist/flexible/index.js [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$agent$2d$core$2f$dist$2f$flexible$2f$engine$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/agent-core/dist/flexible/engine.js [app-route] (ecmascript)"); //# sourceMappingURL=index.js.map
;
}),
"[project]/packages/agent-core/dist/index.js [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$agent$2d$core$2f$dist$2f$scoring$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/agent-core/dist/scoring/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$agent$2d$core$2f$dist$2f$vault$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/agent-core/dist/vault/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$agent$2d$core$2f$dist$2f$config$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/agent-core/dist/config/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$agent$2d$core$2f$dist$2f$output$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/agent-core/dist/output/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$agent$2d$core$2f$dist$2f$flexible$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/agent-core/dist/flexible/index.js [app-route] (ecmascript) <locals>"); //# sourceMappingURL=index.js.map
;
;
;
;
;
}),
"[project]/packages/agent-core/dist/scoring/index.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "parseDurationMinutes",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$agent$2d$core$2f$dist$2f$scoring$2f$scorer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseDurationMinutes"],
    "scoreOffers",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$agent$2d$core$2f$dist$2f$scoring$2f$scorer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["scoreOffers"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$agent$2d$core$2f$dist$2f$scoring$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/agent-core/dist/scoring/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$agent$2d$core$2f$dist$2f$scoring$2f$scorer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/agent-core/dist/scoring/scorer.js [app-route] (ecmascript)");
}),
"[project]/packages/agent-core/dist/config/index.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEFAULT_POINT_VALUATIONS",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$agent$2d$core$2f$dist$2f$config$2f$cards$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DEFAULT_POINT_VALUATIONS"],
    "SAMPLE_CARDS",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$agent$2d$core$2f$dist$2f$config$2f$cards$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SAMPLE_CARDS"],
    "buildCardProfile",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$agent$2d$core$2f$dist$2f$config$2f$cards$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["buildCardProfile"],
    "defaultPreferences",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$agent$2d$core$2f$dist$2f$config$2f$loader$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["defaultPreferences"],
    "getProfilePath",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$agent$2d$core$2f$dist$2f$config$2f$profile$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getProfilePath"],
    "loadConfig",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$agent$2d$core$2f$dist$2f$config$2f$loader$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["loadConfig"],
    "loadProfile",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$agent$2d$core$2f$dist$2f$config$2f$profile$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["loadProfile"],
    "saveProfile",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$agent$2d$core$2f$dist$2f$config$2f$profile$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["saveProfile"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$agent$2d$core$2f$dist$2f$config$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/agent-core/dist/config/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$agent$2d$core$2f$dist$2f$config$2f$loader$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/agent-core/dist/config/loader.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$agent$2d$core$2f$dist$2f$config$2f$cards$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/agent-core/dist/config/cards.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$agent$2d$core$2f$dist$2f$config$2f$profile$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/agent-core/dist/config/profile.js [app-route] (ecmascript)");
}),
"[project]/packages/provider-mock/dist/fixtures.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "generateMockOffers",
    ()=>generateMockOffers
]);
function generateMockOffers(origin, destination, departureDate, returnDate, passengers = 1) {
    const carriers = [
        {
            code: 'AA',
            name: 'American Airlines'
        },
        {
            code: 'UA',
            name: 'United Airlines'
        },
        {
            code: 'DL',
            name: 'Delta Air Lines'
        },
        {
            code: 'WN',
            name: 'Southwest Airlines'
        },
        {
            code: 'AF',
            name: 'Air France'
        },
        {
            code: 'BA',
            name: 'British Airways'
        }
    ];
    const offers = [];
    const basePrice = 250 + Math.floor(Math.random() * 300);
    for(let i = 0; i < 8; i++){
        const carrier = carriers[i % carriers.length];
        const stops = i < 3 ? 0 : i < 6 ? 1 : 2;
        const durationHours = 3 + stops * 2 + Math.floor(Math.random() * 3);
        const priceMultiplier = stops === 0 ? 1.4 : stops === 1 ? 1.0 : 0.85;
        const price = Math.round(basePrice * priceMultiplier * (0.9 + Math.random() * 0.3));
        const departHour = 6 + Math.floor(Math.random() * 14);
        const arriveHour = (departHour + durationHours) % 24;
        const outboundSegments = [];
        if (stops === 0) {
            outboundSegments.push({
                carrier: carrier.code,
                carrierName: carrier.name,
                flightNumber: `${carrier.code}${1000 + i * 100}`,
                departure: {
                    airport: origin,
                    at: `${departureDate}T${String(departHour).padStart(2, '0')}:00:00`
                },
                arrival: {
                    airport: destination,
                    at: `${departureDate}T${String(arriveHour).padStart(2, '0')}:30:00`
                },
                duration: `PT${durationHours}H30M`,
                cabin: 'ECONOMY'
            });
        } else {
            const layoverAirport = 'ORD';
            const legOneHours = Math.ceil(durationHours / 2);
            const layoverMid = (departHour + legOneHours) % 24;
            outboundSegments.push({
                carrier: carrier.code,
                carrierName: carrier.name,
                flightNumber: `${carrier.code}${1000 + i * 100}`,
                departure: {
                    airport: origin,
                    at: `${departureDate}T${String(departHour).padStart(2, '0')}:00:00`
                },
                arrival: {
                    airport: layoverAirport,
                    at: `${departureDate}T${String(layoverMid).padStart(2, '0')}:15:00`
                },
                duration: `PT${legOneHours}H15M`,
                cabin: 'ECONOMY'
            });
            outboundSegments.push({
                carrier: carrier.code,
                carrierName: carrier.name,
                flightNumber: `${carrier.code}${1100 + i * 100}`,
                departure: {
                    airport: layoverAirport,
                    at: `${departureDate}T${String((layoverMid + 1) % 24).padStart(2, '0')}:30:00`
                },
                arrival: {
                    airport: destination,
                    at: `${departureDate}T${String(arriveHour).padStart(2, '0')}:30:00`
                },
                duration: `PT${durationHours - legOneHours}H0M`,
                cabin: 'ECONOMY'
            });
            if (stops === 2) {
                const midAirport = 'ATL';
                const origSecond = outboundSegments[1];
                outboundSegments[1] = {
                    ...origSecond,
                    arrival: {
                        airport: midAirport,
                        at: origSecond.arrival.at
                    }
                };
                outboundSegments.push({
                    carrier: carrier.code,
                    carrierName: carrier.name,
                    flightNumber: `${carrier.code}${1200 + i * 100}`,
                    departure: {
                        airport: midAirport,
                        at: `${departureDate}T${String((arriveHour - 1 + 24) % 24).padStart(2, '0')}:00:00`
                    },
                    arrival: {
                        airport: destination,
                        at: `${departureDate}T${String(arriveHour).padStart(2, '0')}:30:00`
                    },
                    duration: 'PT1H30M',
                    cabin: 'ECONOMY'
                });
            }
        }
        const offer = {
            id: `mock-${i + 1}`,
            provider: 'mock',
            outbound: {
                segments: outboundSegments,
                duration: `PT${durationHours}H30M`,
                stops
            },
            price: {
                total: price * passengers,
                currency: 'USD',
                base: Math.round(price * 0.85) * passengers,
                taxes: Math.round(price * 0.15) * passengers,
                perPassenger: price
            },
            seatsRemaining: 2 + Math.floor(Math.random() * 7),
            validatingCarrier: carrier.code
        };
        if (returnDate) {
            const returnHour = 8 + Math.floor(Math.random() * 12);
            const returnArriveHour = (returnHour + durationHours) % 24;
            offer.inbound = {
                segments: [
                    {
                        carrier: carrier.code,
                        carrierName: carrier.name,
                        flightNumber: `${carrier.code}${2000 + i * 100}`,
                        departure: {
                            airport: destination,
                            at: `${returnDate}T${String(returnHour).padStart(2, '0')}:00:00`
                        },
                        arrival: {
                            airport: origin,
                            at: `${returnDate}T${String(returnArriveHour).padStart(2, '0')}:00:00`
                        },
                        duration: `PT${durationHours}H0M`,
                        cabin: 'ECONOMY'
                    }
                ],
                duration: `PT${durationHours}H0M`,
                stops: 0
            };
        }
        offers.push(offer);
    }
    return offers;
} //# sourceMappingURL=fixtures.js.map
}),
"[project]/packages/provider-mock/dist/mock.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MockFlightProvider",
    ()=>MockFlightProvider
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$provider$2d$mock$2f$dist$2f$fixtures$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/provider-mock/dist/fixtures.js [app-route] (ecmascript)");
;
class MockFlightProvider {
    name = 'mock';
    async search(request) {
        await this.simulateLatency();
        let offers = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$provider$2d$mock$2f$dist$2f$fixtures$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["generateMockOffers"])(request.origin, request.destination, request.departureDate, request.returnDate, request.passengers);
        if (request.directOnly) {
            offers = offers.filter((o)=>o.outbound.stops === 0);
        }
        if (request.maxStops !== undefined) {
            offers = offers.filter((o)=>o.outbound.stops <= request.maxStops);
        }
        if (request.maxPrice !== undefined) {
            offers = offers.filter((o)=>o.price.total <= request.maxPrice);
        }
        return {
            request,
            offers,
            searchTimestamp: new Date().toISOString(),
            provider: this.name
        };
    }
    async simulateLatency() {
        const ms = 200 + Math.random() * 300;
        return new Promise((resolve)=>setTimeout(resolve, ms));
    }
} //# sourceMappingURL=mock.js.map
}),
"[project]/packages/provider-mock/dist/index.js [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$provider$2d$mock$2f$dist$2f$mock$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/provider-mock/dist/mock.js [app-route] (ecmascript)"); //# sourceMappingURL=index.js.map
;
}),
"[project]/packages/provider-duffel/dist/duffel.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DuffelFlightProvider",
    ()=>DuffelFlightProvider
]);
class DuffelFlightProvider {
    name = 'duffel';
    config;
    constructor(config){
        this.config = config;
    }
    get baseUrl() {
        return 'https://api.duffel.com';
    }
    async search(request) {
        const body = this.buildOfferRequestBody(request);
        const response = await this.fetchWithRetry(`${this.baseUrl}/air/offer_requests`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.config.token}`,
                'Duffel-Version': 'v2',
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                data: body
            })
        });
        if (!response.ok) {
            const errorBody = await response.text();
            let hint = '';
            if (response.status === 401) {
                hint = '\n  → Check DUFFEL_ACCESS_TOKEN — test tokens start with duffel_test_';
            } else if (response.status === 403) {
                hint = '\n  → Your Duffel token is missing required permissions.' + '\n  → Go to https://app.duffel.com → Developers → Access tokens' + '\n  → Create a new test token with "Full access" or at minimum the "Offer requests" permission.';
            } else if (response.status === 422) {
                hint = '\n  → Check that airport codes and dates are valid.';
            }
            throw new Error(`Duffel search failed (${response.status})${hint}\n  ${errorBody}`);
        }
        const json = await response.json();
        let offers = json.data.offers.map((raw)=>this.normalizeOffer(raw));
        if (request.directOnly) {
            offers = offers.filter((o)=>o.outbound.stops === 0 && (!o.inbound || o.inbound.stops === 0));
        }
        if (request.maxStops !== undefined) {
            offers = offers.filter((o)=>o.outbound.stops <= request.maxStops && (!o.inbound || o.inbound.stops <= request.maxStops));
        }
        if (request.maxPrice !== undefined) {
            offers = offers.filter((o)=>o.price.total <= request.maxPrice);
        }
        return {
            request,
            offers,
            searchTimestamp: new Date().toISOString(),
            provider: this.name
        };
    }
    async fetchWithRetry(url, init, retries = 2) {
        for(let attempt = 0; attempt <= retries; attempt++){
            const response = await fetch(url, init);
            if (response.status === 429 && attempt < retries) {
                const retryAfter = parseInt(response.headers.get('retry-after') || '2', 10);
                await new Promise((r)=>setTimeout(r, retryAfter * 1000));
                continue;
            }
            return response;
        }
        throw new Error('Duffel: max retries exceeded');
    }
    buildOfferRequestBody(request) {
        const maxConnections = request.directOnly ? 0 : request.maxStops;
        const slices = [
            {
                origin: request.origin,
                destination: request.destination,
                departure_date: request.departureDate,
                ...maxConnections !== undefined && {
                    max_connections: maxConnections
                }
            }
        ];
        if (request.returnDate) {
            slices.push({
                origin: request.destination,
                destination: request.origin,
                departure_date: request.returnDate,
                ...maxConnections !== undefined && {
                    max_connections: maxConnections
                }
            });
        }
        const passengers = Array.from({
            length: request.passengers
        }, ()=>({
                type: 'adult'
            }));
        return {
            slices,
            passengers,
            return_offers: true,
            ...request.cabin && {
                cabin_class: mapCabinClass(request.cabin)
            }
        };
    }
    normalizeOffer(raw) {
        const slices = raw.slices;
        const outbound = this.normalizeSlice(slices[0]);
        const inbound = slices.length > 1 ? this.normalizeSlice(slices[1]) : undefined;
        const totalAmount = parseFloat(raw.total_amount);
        const passengers = raw.passengers?.length || 1;
        return {
            id: raw.id,
            provider: this.name,
            outbound,
            inbound,
            price: {
                total: totalAmount,
                currency: raw.total_currency,
                base: raw.base_amount ? parseFloat(raw.base_amount) : undefined,
                taxes: raw.tax_amount ? parseFloat(raw.tax_amount) : undefined,
                perPassenger: passengers > 1 ? totalAmount / passengers : undefined
            },
            validatingCarrier: raw.owner?.iata_code,
            rawProviderData: raw
        };
    }
    normalizeSlice(slice) {
        const segments = slice.segments.map((seg)=>{
            const segDuration = seg.duration || computeDuration(seg.departing_at, seg.arriving_at);
            const cabin = extractCabinClass(seg.passengers) || 'ECONOMY';
            return {
                carrier: seg.marketing_carrier?.iata_code || seg.operating_carrier?.iata_code || 'XX',
                carrierName: seg.marketing_carrier?.name,
                flightNumber: `${seg.marketing_carrier?.iata_code || ''}${seg.marketing_carrier_flight_number || ''}`,
                departure: {
                    airport: seg.origin.iata_code,
                    terminal: seg.origin_terminal || undefined,
                    at: seg.departing_at
                },
                arrival: {
                    airport: seg.destination.iata_code,
                    terminal: seg.destination_terminal || undefined,
                    at: seg.arriving_at
                },
                duration: segDuration,
                aircraft: seg.aircraft?.iata_code,
                cabin
            };
        });
        const totalDuration = slice.duration || computeTotalDuration(segments);
        return {
            segments,
            duration: totalDuration,
            stops: segments.length - 1
        };
    }
}
function computeDuration(departAt, arriveAt) {
    const dep = new Date(departAt).getTime();
    const arr = new Date(arriveAt).getTime();
    const diffMin = Math.max(0, Math.round((arr - dep) / 60_000));
    const h = Math.floor(diffMin / 60);
    const m = diffMin % 60;
    return `PT${h}H${m}M`;
}
function computeTotalDuration(segments) {
    if (segments.length === 0) return 'PT0H0M';
    const first = new Date(segments[0].departure.at).getTime();
    const last = new Date(segments[segments.length - 1].arrival.at).getTime();
    const diffMin = Math.max(0, Math.round((last - first) / 60_000));
    const h = Math.floor(diffMin / 60);
    const m = diffMin % 60;
    return `PT${h}H${m}M`;
}
function extractCabinClass(passengers) {
    if (!passengers || passengers.length === 0) return undefined;
    const cabin = passengers[0].cabin_class;
    if (!cabin) return undefined;
    const map = {
        economy: 'ECONOMY',
        premium_economy: 'PREMIUM_ECONOMY',
        business: 'BUSINESS',
        first: 'FIRST'
    };
    return map[cabin];
}
function mapCabinClass(cabin) {
    const map = {
        ECONOMY: 'economy',
        PREMIUM_ECONOMY: 'premium_economy',
        BUSINESS: 'business',
        FIRST: 'first'
    };
    return map[cabin];
} //# sourceMappingURL=duffel.js.map
}),
"[project]/packages/provider-duffel/dist/index.js [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$provider$2d$duffel$2f$dist$2f$duffel$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/provider-duffel/dist/duffel.js [app-route] (ecmascript)"); //# sourceMappingURL=index.js.map
;
}),
"[project]/packages/web/src/app/api/search/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$agent$2d$core$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/agent-core/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$agent$2d$core$2f$dist$2f$scoring$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/agent-core/dist/scoring/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$agent$2d$core$2f$dist$2f$config$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/agent-core/dist/config/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$provider$2d$mock$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/provider-mock/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$provider$2d$mock$2f$dist$2f$mock$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/provider-mock/dist/mock.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$provider$2d$duffel$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/provider-duffel/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$provider$2d$duffel$2f$dist$2f$duffel$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/provider-duffel/dist/duffel.js [app-route] (ecmascript)");
;
;
;
;
function getProvider() {
    const config = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$agent$2d$core$2f$dist$2f$config$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["loadConfig"])();
    if (config.duffelToken && config.provider !== 'mock') {
        return new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$provider$2d$duffel$2f$dist$2f$duffel$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DuffelFlightProvider"]({
            token: config.duffelToken,
            environment: config.duffelEnv
        });
    }
    return new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$provider$2d$mock$2f$dist$2f$mock$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["MockFlightProvider"]();
}
async function POST(req) {
    try {
        const body = await req.json();
        const { cardIds, ...searchParams } = body;
        const request = {
            tripType: searchParams.returnDate ? 'round-trip' : 'one-way',
            origin: searchParams.origin?.toUpperCase(),
            destination: searchParams.destination?.toUpperCase(),
            departureDate: searchParams.departureDate,
            returnDate: searchParams.returnDate,
            passengers: searchParams.passengers || 1,
            cabin: searchParams.cabin || 'ECONOMY',
            maxStops: searchParams.maxStops,
            maxPrice: searchParams.maxPrice,
            directOnly: searchParams.directOnly || false,
            preferredAirlines: searchParams.preferredAirlines,
            currency: searchParams.currency || 'USD'
        };
        const provider = getProvider();
        const result = await provider.search(request);
        const config = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$agent$2d$core$2f$dist$2f$config$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["loadConfig"])();
        const preferences = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$agent$2d$core$2f$dist$2f$config$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["defaultPreferences"])(config);
        const cardProfile = cardIds && cardIds.length > 0 ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$agent$2d$core$2f$dist$2f$config$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["buildCardProfile"])(cardIds) : undefined;
        const scored = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$agent$2d$core$2f$dist$2f$scoring$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["scoreOffers"])(result.offers, preferences, cardProfile);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            offers: scored.slice(0, 20),
            totalOffers: result.offers.length,
            provider: result.provider,
            searchTimestamp: result.searchTimestamp
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Search failed';
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: message
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__861c74ca._.js.map