import {
    ArrowLeftRight,
    Baby,
    BadgeDollarSign,
    BanknoteArrowUp,
    BriefcaseBusiness,
    Bus,
    Car,
    Gamepad2,
    Gift,
    GraduationCap,
    Hammer,
    HandHeart,
    HeartPulse,
    House,
    Landmark,
    Laptop,
    Lightbulb,
    PawPrint,
    Pill,
    PiggyBank,
    Plane,
    ReceiptText,
    Repeat2,
    Shapes,
    ShieldCheck,
    Shirt,
    ShoppingBasket,
    Sparkles,
    Utensils,
    type LucideIcon,
} from "lucide-react";

import { CategoryKey, isDefaultCategory } from "constants/categories";
import { categoryColorVar } from "lib/category-color";
import { twMerge } from "lib/tw";

const CATEGORY_ICONS: Record<CategoryKey, LucideIcon> = {
    groceries: ShoppingBasket,
    restaurant: Utensils,
    delivery: ReceiptText,
    housing: House,
    home: Shapes,
    utilities: Lightbulb,
    transport: Bus,
    car: Car,
    health: HeartPulse,
    pharmacy: Pill,
    education: GraduationCap,
    children: Baby,
    pets: PawPrint,
    cosmetics: Sparkles,
    clothing: Shirt,
    entertainment: Gamepad2,
    subscriptions: Repeat2,
    travel: Plane,
    gifts: Gift,
    charity: HandHeart,
    credit: Landmark,
    transfers: ArrowLeftRight,
    insurance: ShieldCheck,
    taxes: ReceiptText,
    electronics: Laptop,
    repairs: Hammer,
    work: BriefcaseBusiness,
    essentials: BadgeDollarSign,
    savings: PiggyBank,
    other: Shapes,
    income: BanknoteArrowUp,
};

export const CategoryIcon = ({ category, className }: { category: string; className?: string }) => {
    const Icon = isDefaultCategory(category) ? CATEGORY_ICONS[category] : Shapes;
    return <Icon className={className} />;
};

export const CategoryBadge = ({
    category,
    className,
    iconClassName,
    icon,
}: {
    category: string;
    className?: string;
    iconClassName?: string;
    icon?: React.ReactNode;
}) => (
    <span
        className={twMerge("hue-tile size-10", className)}
        style={{ "--hue": categoryColorVar(category) } as React.CSSProperties}
    >
        {icon ?? <CategoryIcon category={category} className={twMerge("size-4.5", iconClassName)} />}
    </span>
);
