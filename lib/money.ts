export const roundMoney = (value: number) => Math.round(value * 100) / 100;

export const toMoneyInput = (value: number) => (Number.isFinite(value) ? String(roundMoney(value)) : "");

export const roundRate = (value: number) => Math.round(value * 10000) / 10000;

export const toRateInput = (value: number) => (Number.isFinite(value) && value > 0 ? String(roundRate(value)) : "");
