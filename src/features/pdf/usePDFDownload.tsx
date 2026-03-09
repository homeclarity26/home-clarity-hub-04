import { useState, useCallback } from "react";
import { pdf } from "@react-pdf/renderer";
import PDFReport, { type PDFReportData } from "./PDFReport";

type PDFStatus = "idle" | "generating" | "done" | "error";

export function usePDFDownload() {
  const [status, setStatus] = useState<PDFStatus>("idle");

  const generate = useCallback(async (data: PDFReportData) => {
    setStatus("generating");
    try {
      const blob = await pdf(<PDFReport data={data} />).toBlob();
      
      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Home-Clarity-Report_${data.propertyName.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatus("done");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err) {
      console.error("PDF generation error:", err);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 5000);
    }
  }, []);

  return { status, generate };
}
