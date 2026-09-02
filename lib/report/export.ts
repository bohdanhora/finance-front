import { buildReportDocument, ReportFormatters } from "./document";
import { ReportLabels } from "./labels";
import { ReportModel, ReportSection } from "./types";

export type ExportReportArgs = {
    model: ReportModel;
    labels: ReportLabels;
    sections: ReportSection[];
    formatters: ReportFormatters;
    fileName: string;
};

/**
 * pdfmake and its fonts are ~900 KB, so they are pulled in only when a report is
 * actually exported instead of riding along in the page bundle.
 */
export const downloadReportPdf = async ({ fileName, ...args }: ExportReportArgs) => {
    const [pdfMake, vfsModule] = await Promise.all([
        import("pdfmake/build/pdfmake"),
        import("pdfmake/build/vfs_fonts"),
    ]);

    pdfMake.addVirtualFileSystem(vfsModule.default);
    pdfMake.createPdf(buildReportDocument(args)).download(fileName);
};
