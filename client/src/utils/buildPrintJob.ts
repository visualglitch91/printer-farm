import { orderBy } from "lodash";
import { PrintJob, PrintJobDetails, PrinterData } from "./types";

function getFileRelativePrintProgress(
  virtualSDCard: PrinterData["virtual_sdcard"] | undefined,
  jobDetails: PrintJobDetails | undefined
) {
  const { file_position, progress } = virtualSDCard ?? {};
  const { gcode_start_byte, gcode_end_byte } = jobDetails?.metadata ?? {};

  if (gcode_start_byte && gcode_end_byte && file_position) {
    if (file_position <= gcode_start_byte) return 0;
    if (file_position >= gcode_end_byte) return 1;

    const currentPosition = file_position - gcode_start_byte;
    const endPosition = gcode_end_byte - gcode_start_byte;

    if (currentPosition > 0 && endPosition > 0)
      return currentPosition / endPosition;
  }

  return progress || 0;
}

export default function buildPrintJob(
  data: PrinterData,
  jobDetails?: PrintJobDetails
): PrintJob {
  const fileProgress = getFileRelativePrintProgress(
    data.virtual_sdcard,
    jobDetails
  );

  const totalDuration =
    (data.print_stats?.total_duration as number | undefined) ?? 0;
  const printDuration =
    (data.print_stats?.print_duration as number | undefined) ?? 0;

  const fileLeft =
    printDuration > 0 && fileProgress > 0
      ? printDuration / fileProgress - printDuration
      : 0;

  const currentFileStatus = jobDetails?.status;
  const currentFileTotalDuration = jobDetails?.total_duration;

  const actualLeft =
    currentFileStatus === "completed" && currentFileTotalDuration != null
      ? currentFileTotalDuration - printDuration
      : 0;

  const slicerTotal = jobDetails?.metadata.estimated_time;

  const slicerLeft =
    slicerTotal != null && slicerTotal > 0 ? slicerTotal - printDuration : 0;

  const printEtaCalculationResults = ["file"]
    .map((type) => {
      switch (type) {
        case "file":
          return actualLeft > 0 ? actualLeft : fileLeft;

        case "slicer":
          return slicerLeft;

        default:
          return 0;
      }
    })
    .filter((result) => result > 0);

  const etaLeft =
    printEtaCalculationResults.reduce((a, b) => a + b, 0) /
      printEtaCalculationResults.length || 0;

  const eta = Date.now() + etaLeft * 1000;

  return {
    filename: data.print_stats?.filename ?? "",
    thumbnail:
      orderBy(jobDetails?.metadata?.thumbnails, "size")
        .pop()
        ?.relative_path.replace(
          ".thumbs/",
          `/printers/${data.config.key}/thumbnail/`
        ) || null,
    progress: Math.floor(fileProgress * 100),
    printDuration,
    totalDuration,
    slicerLeft,
    fileLeft,
    actualLeft,
    eta,
  };
}
