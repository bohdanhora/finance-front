import { useEffect, useState } from "react";

export function useResendTimer(seconds = 60) {
    const [resendTimer, setResendTimer] = useState(0);
    const [codeSent, setCodeSent] = useState(false);

    const startTimer = () => {
        setResendTimer(seconds);
        setCodeSent(true);
    };

    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [resendTimer]);

    return { resendTimer, codeSent, startTimer };
}
