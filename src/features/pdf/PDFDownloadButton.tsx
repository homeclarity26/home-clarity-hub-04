import { Download, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePDFDownload } from "@/features/pdf/usePDFDownload";
import type { PDFReportData } from "@/features/pdf/PDFReport";
import { toast } from "sonner";

interface PDFDownloadButtonProps {
  data: PDFReportData;
  variant?: "ghost" | "outline" | "default";
  size?: "sm" | "default";
  className?: string;
  label?: string;
}

const PDFDownloadButton = ({
  data,
  variant = "ghost",
  size = "sm",
  className = "",
  label = "PDF",
}: PDFDownloadButtonProps) => {
  const { status, generate } = usePDFDownload();

  const handleClick = async () => {
    toast.info("Generating your Home Clarity Report PDF...");
    await generate(data);
    if (status !== "error") {
      toast.success("PDF downloaded!");
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={`gap-1.5 font-sans ${className}`}
      onClick={handleClick}
      disabled={status === "generating"}
    >
      {status === "generating" ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : status === "done" ? (
        <CheckCircle className="h-3.5 w-3.5" />
      ) : (
        <Download className="h-3.5 w-3.5" />
      )}
      {status === "generating" ? "Generating..." : label}
    </Button>
  );
};

export default PDFDownloadButton;
