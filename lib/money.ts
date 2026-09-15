export const roundMoney = (value: number) => Math.round(value * 100) / 100;

export const toMoneyInput = (value: number) => (Number.isFinite(value) ? String(roundMoney(value)) : "");
