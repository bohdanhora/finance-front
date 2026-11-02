export type ListKind = "essentials" | "nextMonthEssentials" | "expectedIncome";
export type ListAction = "edit" | "remove";

type ListActionDetail = { kind: ListKind; action: ListAction; id: string };

const LIST_ACTION_EVENT = "finance:list-action";

export const requestListAction = (kind: ListKind, action: ListAction, id: string) => {
    window.dispatchEvent(new CustomEvent<ListActionDetail>(LIST_ACTION_EVENT, { detail: { kind, action, id } }));
};

export const subscribeListAction = (kind: ListKind, handler: (action: ListAction, id: string) => void) => {
    const listener = (event: Event) => {
        const detail = (event as CustomEvent<ListActionDetail>).detail;
        if (detail?.kind === kind) handler(detail.action, detail.id);
    };
    window.addEventListener(LIST_ACTION_EVENT, listener);
    return () => window.removeEventListener(LIST_ACTION_EVENT, listener);
};
