import { CSSProperties } from "preact/compat";
import { useEffect, useRef, useState } from "preact/hooks";
import { Client as WSClient } from "rpc-websockets";
import { Button, Flex, Badge, Stack, Title, Paper } from "@mantine/core";
import { PrinterData, PrintJobDetails } from "./utils/types";
import {
  formatCounterSeconds,
  formatAbsoluteDateTime,
} from "./utils/formatTime";
import buildPrintJob from "./utils/buildPrintJob";
import { InfoTable } from "./InfoTable";
import TempCell from "./TempCell";
import { JobControls } from "./JobControls";
import Macros from "./Macros";

const stateBadgeMap = {
  standby: { label: "Standby", color: "gray" },
  printing: { label: "Printing", color: "blue" },
  paused: { label: "Paused", color: "yellow" },
  complete: { label: "Complete", color: "green" },
  cancelled: { label: "Cancelled", color: "orange" },
  error: { label: "Error", color: "red" },
  printer_offline: { label: "Printer Offline", color: "gray" },
  klippy_offline: { label: "Klippy Offline", color: "gray" },
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

  const [details, setDetails] = useState<PrintJobDetails>();
  const [restarting, setRestarting] = useState(false);
  const stateRef = useRef(state);

  const { extruder, heater_bed } = data;
  const job = data.print_stats?.filename ? buildPrintJob(data, details) : null;
  const stateBadge = stateBadgeMap[state];
  const offline = state === "klippy_offline" || state === "printer_offline";
  const printing = state === "printing";
  const paused = state === "paused";
  const printingOrPaused = printing || paused;

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
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const interval = window.setInterval(async () => {
      const state = stateRef.current;

      if (["standby", "klippy_offline", "printer_offline"].includes(state)) {
        setDetails(undefined);
      } else {
        call("get_current_job").then(
          (data: any) => setDetails(data),
          console.error
        );
      }
    }, 1500);

    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!offline) {
      setRestarting(false);
    }
  }, [offline]);

  return (
    <div>
      <Flex
        gap={8}
        align="center"
        justify="space-between"
        bg="var(--page-background)"
        mb={16}
        style={{ top: 0, zIndex: 2, position: "sticky" }}
      >
        <Title order={3}>{data.config.name}</Title>
        <Badge color={stateBadge.color}>{stateBadge.label}</Badge>
      </Flex>
      <Stack gap={18}>
        {state === "klippy_offline" ? (
          <Button
            disabled={restarting}
            onClick={() => {
              setRestarting(true);
              call("firmware_restart");
              call("klipper_restart");
            }}
          >
            Restart klipper and firmware
          </Button>
        ) : state === "printer_offline" ? (
          <Button
            disabled={restarting}
            color="green"
            onClick={() => {
              setRestarting(true);
              call("turn_on");
            }}
          >
            Turn on
          </Button>
        ) : (
          <>
            {job && (
              <>
                {job.thumbnail && (
                  <Paper style={{ overflow: "hidden" }}>
                    <img
                      style={thumbnailStyle}
                      src={job.thumbnail}
                      alt="thumbnail"
                    />
                  </Paper>
                )}
                <JobControls
                  job={job}
                  state={state}
                  confirmAndCall={confirmAndCall}
                />
                <InfoTable
                  data={
                    printing
                      ? [
                          ["File", job.filename],
                          job.actualLeft
                            ? [
                                "Remaining (actual)",
                                formatCounterSeconds(job.actualLeft),
                              ]
                            : null,
                          [
                            "Remaining (file)",
                            job.fileLeft
                              ? formatCounterSeconds(job.fileLeft)
                              : "-",
                          ],
                          [
                            "Remaining (slicer)",
                            job.slicerLeft
                              ? formatCounterSeconds(job.slicerLeft)
                              : "-",
                          ],
                          [
                            "Elapsed",
                            job.printDuration
                              ? formatCounterSeconds(job.printDuration)
                              : "-",
                          ],
                          [
                            "ETA",
                            job.eta ? formatAbsoluteDateTime(job.eta) : "-",
                          ],
                          ["Layer", job.layer],
                        ]
                      : [
                          ["File", job.filename],
                          [
                            "Slicer estimate",
                            details?.metadata.estimated_time
                              ? formatCounterSeconds(
                                  details.metadata.estimated_time
                                )
                              : "-",
                          ],
                          [
                            "Print duration",
                            details?.print_duration
                              ? formatCounterSeconds(details.print_duration)
                              : "-",
                          ],
                          [
                            "Total duration",
                            details?.total_duration
                              ? formatCounterSeconds(details.total_duration)
                              : "-",
                          ],
                        ]
                  }
                />
              </>
            )}
            <InfoTable
              data={[
                [
                  "Tool",
                  <TempCell
                    current={extruder?.temperature || 0}
                    target={extruder?.target || 0}
                    onEdit={() => setTemperature("extruder")}
                  />,
                ],
                [
                  "Bed",
                  <TempCell
                    current={heater_bed?.temperature || 0}
                    target={heater_bed?.target || 0}
                    onEdit={() => setTemperature("heater_bed")}
                  />,
                ],
              ]}
            />
            {!printingOrPaused && (
              <Macros
                macros={data.config.macros || []}
                confirmAndCall={confirmAndCall}
              />
            )}
            <Button
              color="red"
              onClick={() =>
                confirmAndCall(
                  "Are you sure you want to stop the printer?",
                  "emergency_stop"
                )
              }
            >
              Emergency stop
            </Button>
            <Button
              color="red"
              onClick={() =>
                confirmAndCall(
                  "Are you sure you want to turn off the printer?",
                  "turn_off"
                )
              }
            >
              Turn off
            </Button>
          </>
        )}
      </Stack>
    </div>
  );
}
