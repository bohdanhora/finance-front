import { useState } from "react";

export const useToggle = (initial = false) => {
    const [state, setState] = useState(initial);
    const toggle = () => setState((s) => !s);
    return [state, toggle] as const;
};
