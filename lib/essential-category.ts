import { CategoryKey } from "../constants/categories";
import { TransactionType } from "../types/transactions";

export const ESSENTIALS_CATEGORY = "essentials";

const CATEGORY_KEYWORDS: Array<[CategoryKey, string[]]> = [
    [
        "credit",
        [
            "кредит",
            "credit",
            "loan",
            "позик",
            "позык",
            "розстроч",
            "рассроч",
            "ипотек",
            "іпотек",
            "mortgage",
            "долг",
            "борг",
        ],
    ],
    ["insurance", ["страхов", "insurance", "каско", "осаго", "осцпв"]],
    ["taxes", ["налог", "податок", "податк", "tax", "єсв", "есв", "фоп"]],
    [
        "subscriptions",
        [
            "подписк",
            "підписк",
            "subscription",
            "netflix",
            "spotify",
            "youtube",
            "megogo",
            "sweet.tv",
            "sweet tv",
            "apple",
            "icloud",
            "google one",
            "openai",
            "chatgpt",
            "gpt",
            "claude",
            "anthropic",
            "cursor",
            "copilot",
            "github",
            "railway",
            "vercel",
            "notion",
            "figma",
            "adobe",
            "steam",
            "xbox",
            "playstation",
            "ps plus",
            "nintendo",
            "disney",
            "hbo",
            "кинопоиск",
            "яндекс плюс",
            "telegram premium",
            "discord",
        ],
    ],
    ["housing", ["аренд", "оренд", "rent", "квартплат", "квартир", "жиль", "житл", "осбб", "hoa"]],
    [
        "utilities",
        [
            "коммунал",
            "комунал",
            "utilities",
            "свет",
            "світл",
            "электр",
            "електр",
            "газ",
            "отоплен",
            "опален",
            "водоканал",
            "интернет",
            "інтернет",
            "internet",
            "мобильн",
            "мобільн",
            "связь",
            "зв'язок",
            "kyivstar",
            "київстар",
            "киевстар",
            "vodafone",
            "lifecell",
        ],
    ],
    [
        "health",
        [
            "пилатес",
            "pilates",
            "фитнес",
            "фітнес",
            "fitness",
            "gym",
            "спортзал",
            "йог",
            "yoga",
            "бассейн",
            "басейн",
            "стоматолог",
            "врач",
            "лікар",
            "клиник",
            "клінік",
        ],
    ],
    ["education", ["курс", "школ", "универ", "універ", "tuition", "репетитор", "english", "англ", "обучен", "навчан"]],
    ["children", ["садик", "садок", "детск", "дитяч", "няня"]],
    ["pets", ["корм", "ветеринар", "грумин"]],
    ["transport", ["проездн", "проїзн", "метро", "transport", "парковк", "parking"]],
    ["charity", ["донат", "donat", "благотвор", "зсу", "фонд"]],
];

export const suggestEssentialCategory = (title: string): CategoryKey | null => {
    const normalized = title.trim().toLocaleLowerCase();
    if (!normalized) return null;

    for (const [category, keywords] of CATEGORY_KEYWORDS) {
        if (keywords.some((keyword) => normalized.includes(keyword))) return category;
    }

    return null;
};

export const isEssentialTransaction = (transaction: Pick<TransactionType, "essential" | "categorie">) =>
    transaction.essential === true || transaction.categorie === ESSENTIALS_CATEGORY;
