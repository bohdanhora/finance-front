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

export const downloadReportPdf = async ({ fileName, ...args }: ExportReportArgs) => {
    const [pdfMake, vfsModule] = await Promise.all([
        import("pdfmake/build/pdfmake"),
        import("pdfmake/build/vfs_fonts"),
    ]);

    pdfMake.addVirtualFileSystem(vfsModule.default);
    pdfMake.createPdf(buildReportDocument(args)).download(fileName);
};
