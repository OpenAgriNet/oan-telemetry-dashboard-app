import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { buildDateRangeParams } from "@/lib/utils";
import { createExport, type ExportModuleName } from "@/services/api";

interface DownloadCsvButtonProps {
  moduleName: ExportModuleName;
  filters?: Record<string, string>;
  disabled?: boolean;
}

const DownloadCsvButton = ({
  moduleName,
  filters = {},
  disabled = false,
}: DownloadCsvButtonProps) => {
  const { dateRange } = useDateFilter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDownloadCsv = async () => {
    if (!dateRange.from || !dateRange.to) {
      toast.error("Please select a date range before exporting.");
      return;
    }

    const dateParams = buildDateRangeParams(dateRange);

    try {
      setIsSubmitting(true);
      await createExport({
        moduleName,
        fromDate: dateParams.startDate,
        toDate: dateParams.endDate,
        filters,
      });

      toast.success(
        "CSV export has been initiated successfully. Please go to the Exports page to monitor status and download the file.",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to initiate CSV export";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Button
      onClick={handleDownloadCsv}
      disabled={disabled || isSubmitting}
      variant="outline"
    >
      {isSubmitting ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Download className="h-4 w-4 mr-2" />
      )}
      Download CSV
    </Button>
  );
};

export default DownloadCsvButton;
