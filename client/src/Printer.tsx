import { useEffect, useState } from "preact/hooks";
import { CSSProperties } from "preact/compat";
import { Client as WSClient } from "rpc-websockets";
import { FileMetadata, PrinterData, PrintJob } from "./utils/types";
import { PaperTable } from "./PaperTable";
import { Progress } from "./Progress";
import IconButton from "./IconButton";
import formatDuration from "./utils/formatDuration";
import { orderBy } from "lodash";

function parseTemperature(value: number | null | undefined) {
  return typeof value === "number" ? `${Math.round(value * 10) / 10}°C` : "-";
}

const stateChipMap = {
  standby: { label: "Standby", color: "dark" },
  printing: { label: "Printing", color: "primary" },
  paused: { label: "Paused", color: "warning" },
  complete: { label: "Complete", color: "success" },
  cancelled: { label: "Cancelled", color: "secondary" },
  error: { label: "Error", color: "error" },
  printer_offline: { label: "Printer Offline", color: "dark" },
  klippy_offline: { label: "Klippy Offline", color: "dark" },
} as const;

const thumbnailStyle: CSSProperties = {
  width: "100%",
  maxHeight: "200px",
  aspectRatio: "16 / 9",
  display: "block",
  objectFit: "contain",
  backgroundColor: "var(--bulma-box-background-color)",
};

export function Printer({ data, ws }: { data: PrinterData; ws: WSClient }) {
  const state =
    data.print_stats?.state ||
    (data.moonraker === "connected" ? "klippy_offline" : "printer_offline");

  const offline = state === "klippy_offline" || state === "printer_offline";
  const printing = state === "printing";
  const paused = state === "paused";
  const printingOrPaused = printing || paused;

  const job: PrintJob | null = data.print_stats?.filename
    ? {
        filename: data.print_stats.filename,
        progress: data.display_status?.progress || 0,
        print_duration: data.print_stats.print_duration || 0,
      }
    : null;

  const [metadata, setMetadata] = useState<FileMetadata | null>(null);
  const [restarting, setRestarting] = useState(false);
  const largerThumbnail = orderBy(metadata?.thumbnails, "size").pop();
  const { extruder, heater_bed } = data;

  const stateChip = stateChipMap[state];

  const call = (method: string, params?: Record<string, any>) => {
    return ws.call(method, { ...params, printer: data.config.key });
  };

  const confirmAndCall = (
    message: string,
    action: string,
    params?: Record<string, any>
  ) => {
    if (window.confirm(message)) {
      return call(action, params);
    }
  };

  const setTemperature = (heater: "extruder" | "heater_bed") => {
    const value = Number(
      prompt(`Set ${heater === "extruder" ? "extruder" : "bed"} temperature to`)
    );

    if (!isNaN(value)) {
      return call("set_temperature", { heater, value });
    }
  };

  useEffect(() => {
    const filename = job?.filename;

    setMetadata(null);

    if (filename) {
      call("get_current_job_metadata").then(
        (data: any) => setMetadata(data),
        console.error
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.filename]);

  useEffect(() => {
    if (!offline) {
      setRestarting(false);
    }
  }, [offline]);

  return (
    <div>
      <div
        className="is-flex is-flex-direction-row is-align-items-center mb-4 py-2"
        style={{
          top: 0,
          zIndex: 2,
          position: "sticky",
          background: "var(--page-background)",
        }}
      >
        <h1 className="title is-4 mb-0">{data.config.name}</h1>
        <span
          style={{ marginLeft: "auto" }}
          className={`tag is-${stateChip.color}`}
        >
          {stateChip.label}
        </span>
      </div>
      <div className="is-flex is-flex-direction-column" style={{ gap: 18 }}>
        {state === "klippy_offline" ? (
          <div style={{ textAlign: "center" }}>
            <button
              disabled={restarting}
              className="button is-link is-fullwidth"
              onClick={() => {
                setRestarting(true);
                call("firmware_restart");
                call("klipper_restart");
              }}
            >
              Restart klipper and firmware
            </button>
          </div>
        ) : state === "printer_offline" ? (
          <div style={{ textAlign: "center" }}>
            <button
              disabled={restarting}
              className="button is-info is-fullwidth"
              onClick={() => {
                setRestarting(true);
                call("turn_on");
              }}
            >
              Turn on
            </button>
          </div>
        ) : (
          <>
            {largerThumbnail && (
              <div className="box p-0 mb-0" style={{ overflow: "hidden" }}>
                <img
                  style={thumbnailStyle}
                  src={largerThumbnail.relative_path.replace(
                    ".thumbs/",
                    `/printers/${data.config.key}/thumbnail/`
                  )}
                  alt="thumbnail"
                />
              </div>
            )}
            {job && (
              <>
                <div className="job-controls">
                  {printing && (
                    <IconButton
                      className="is-small is-info is-outlined"
                      name="pause"
                      onClick={() => {
                        confirmAndCall(
                          "Are you sure you want to pause the print?",
                          "pause_print"
                        );
                      }}
                    />
                  )}
                  {paused && (
                    <IconButton
                      className="is-small is-info is-outlined"
                      name="play"
                      onClick={() => {
                        confirmAndCall(
                          "Are you sure you want to resume the print?",
                          "resume_print"
                        );
                      }}
                    />
                  )}
                  {printingOrPaused && (
                    <IconButton
                      className="is-small is-info is-outlined"
                      name="stop"
                      onClick={() => {
                        confirmAndCall(
                          "Are you sure you want to cancel the print?",
                          "cancel_print"
                        );
                      }}
                    />
                  )}
                  <Progress color="info" value={job.progress} />
                  <span
                    className="tag is-info"
                    style={{ fontWeight: "normal" }}
                  >
                    {Math.round(job.progress)}%
                  </span>
                </div>
                <PaperTable>
                  <tbody>
                    <tr>
                      <td>File</td>
                      <td>{job.filename}</td>
                    </tr>
                    <tr>
                      <td>Estimated</td>
                      <td>
                        {formatDuration((metadata?.estimated_time || 0) * 1000)}
                      </td>
                    </tr>
                    <tr>
                      <td>Ellapsed</td>
                      <td>
                        {formatDuration((job.print_duration || 0) * 1000)}
                      </td>
                    </tr>
                  </tbody>
                </PaperTable>
              </>
            )}
            <PaperTable>
              <tbody>
                <tr>
                  <td>Tool</td>
                  <td>
                    <div
                      className="is-flex is-align-items-center is-justify-content-flex-end"
                      style={{ gap: 8 }}
                    >
                      {parseTemperature(extruder?.temperature)}
                      {" › "}
                      {parseTemperature(extruder?.target)}
                      <IconButton
                        className="is-small is-link is-outlined"
                        name="edit"
                        onClick={() => setTemperature("extruder")}
                      />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>Bed</td>
                  <td>
                    <div
                      className="is-flex is-align-items-center is-justify-content-flex-end"
                      style={{ gap: 8 }}
                    >
                      {parseTemperature(heater_bed?.temperature)}
                      {" › "}
                      {parseTemperature(heater_bed?.target)}
                      <IconButton
                        className="is-small is-link is-outlined"
                        name="edit"
                        onClick={() => setTemperature("heater_bed")}
                      />
                    </div>
                  </td>
                </tr>
              </tbody>
            </PaperTable>
            {!printingOrPaused && (
              <div>
                <h3 className="title is-5">Macros</h3>
                <div className="is-flex is-flex-wrap-wrap" style={{ gap: 8 }}>
                  {data.config.macros.map((macro) => (
                    <button
                      key={macro}
                      className="button is-primary is-small"
                      onClick={() => {
                        confirmAndCall(
                          `Are you sure you want to run "${macro}"?`,
                          "run_macro",
                          { macro }
                        );
                      }}
                    >
                      {macro}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button
              className="button is-danger is-outlined is-fullwidth"
              onClick={() =>
                confirmAndCall(
                  "Are you sure you want to stop the printer?",
                  "emergency_stop"
                )
              }
            >
              Emergency stop
            </button>
            <button
              className="button is-danger is-outlined is-fullwidth"
              onClick={() =>
                confirmAndCall(
                  "Are you sure you want to turn off the printer?",
                  "turn_off"
                )
              }
            >
              Turn off
            </button>
          </>
        )}
      </div>
    </div>
  );
}
