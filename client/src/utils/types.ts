export interface PrinterData {
  config: {
    key: string;
    name: string;
    host: string;
    macros: string[];
  };
  klippy: "ready" | "disconnected" | "shutdown";
  moonraker: "connected" | "disconnected";
  toolhead?: {
    estimated_print_time: number;
  };
  print_stats?: {
    filename: string;
    total_duration: number;
    print_duration: number;
    filament_used: number;
    state:
      | "standby"
      | "printing"
      | "paused"
      | "complete"
      | "cancelled"
      | "error";
    message: string;
    info: {
      total_layer: number | null;
      current_layer: number | null;
    };
    power_loss: number;
    z_pos: number;
  };
  display_status?: {
    progress: number;
    message: string | null;
  };
  extruder?: {
    temperature: number;
    target: number;
  };
  heater_bed?: {
    temperature: number;
    target: number;
  };
  virtual_sdcard?: {
    file_position: number;
    progress: number;
  };
}

export interface FileMetadata {
  print_start_time: number | null;
  job_id: string | null;
  size: number;
  modified: number;
  slicer: string;
  slicer_version: string;
  layer_height: number;
  first_layer_height: number;
  object_height: number;
  filament_total: number;
  estimated_time: number;
  thumbnails: Thumbnail[];
  first_layer_bed_temp: number;
  first_layer_extr_temp: number;
  gcode_start_byte: number;
  gcode_end_byte: number;
  filename: string;
}

interface Thumbnail {
  width: number;
  height: number;
  size: number;
  relative_path: string;
}

export interface PrintJob {
  filename: string;
  thumbnail: string | null;
  progress: number;
  printDuration: number;
  totalDuration: number;
  slicerLeft: number;
  fileLeft: number;
  actualLeft: number;
  eta: number;
}

export interface PrintJobDetails {
  metadata: FileMetadata;
  status?: string;
  total_duration?: number;
  print_duration?: number;
}
