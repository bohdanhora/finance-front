/**
 * Print palette for the PDF report. It is deliberately independent of the app
 * theme: the document is always rendered on white paper.
 *
 * The two-series pair (income / expense) is `accent` vs `expense`. The obvious
 * green/red pair was rejected because it is not separable for deuteranopia
 * (dE 5.6); this pair clears every check (dE 26.7 protan, 35.9 normal vision).
 */
export const REPORT_COLORS = {
    accent: "#4f46e5",
    accentSoft: "#eef2ff",
    expense: "#e34948",
    expenseSoft: "#fdeceb",
    ink: "#111827",
    inkSecondary: "#4b5563",
    inkMuted: "#6b7280",
    inverted: "#ffffff",
    surface: "#f8fafc",
    track: "#e9eaf5",
    rule: "#e5e7eb",
    zebra: "#fbfbfd",
} as const;

export const REPORT_PAGE = {
    /** A4 width minus both margins. */
    contentWidth: 523,
    margin: 36,
} as const;
