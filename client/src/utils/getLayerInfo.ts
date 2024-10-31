import { PrinterData, PrintJobDetails } from "./types";

function getPrintLayers(data: PrinterData, jobDetails?: PrintJobDetails) {
  const layersFromPrintStats = data.print_stats?.info?.total_layer;

  if (typeof layersFromPrintStats === "number") {
    return layersFromPrintStats;
  }

  const current_file = jobDetails?.metadata;

  if (!current_file) {
    return 0;
  }

  if ("layer_count" in current_file) {
    return current_file.layer_count;
  } else if (
    "first_layer_height" in current_file &&
    "layer_height" in current_file &&
    "object_height" in current_file
  ) {
    const lc = Math.ceil(
      (current_file.object_height - current_file.first_layer_height) /
        current_file.layer_height +
        1
    );
    if (lc > 0) return lc;
  }
  return 0;
}

function getPrintLayer(data: PrinterData, jobDetails?: PrintJobDetails) {
  const layerFromPrintStats = data.print_stats?.info?.current_layer;
  if (typeof layerFromPrintStats === "number") {
    return layerFromPrintStats;
  }

  if (!data.gcode_move) {
    return 0;
  }

  const current_file = jobDetails?.metadata;
  const duration = data.print_stats?.print_duration || 0;
  const pos = data.gcode_move.gcode_position;

  if (
    current_file &&
    duration > 0 &&
    "first_layer_height" in current_file &&
    "layer_height" in current_file &&
    pos &&
    pos.length >= 3
  ) {
    const z = data.gcode_move.gcode_position[2];
    const l = Math.ceil(
      (z - current_file.first_layer_height) / current_file.layer_height + 1
    );
    if (l > 0) return l;
  }

  return 0;
}

export default function getLayerInfo(
  data: PrinterData,
  jobDetails?: PrintJobDetails
) {
  const currentLayer = getPrintLayer(data, jobDetails);
  const totalLayers = getPrintLayers(data, jobDetails);

  if (!totalLayers) {
    return "-";
  }

  return `${currentLayer} / ${totalLayers}`;
}
