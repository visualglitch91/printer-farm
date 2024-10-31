import { Badge, Flex, MantineColor, Progress } from "@mantine/core";
import { PrintJob } from "./utils/types";
import IconButton from "./IconButton";

export function JobControls({
  job,
  state,
  size,
  color = "pink",
  confirmAndCall,
}: {
  job: PrintJob;
  state: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  color?: MantineColor;
  confirmAndCall: (message: string, method: string) => void;
}) {
  const paused = state === "paused";
  const printing = state === "printing";
  const printingOrPaused = printing || paused;

  return (
    <Flex align="stretch" gap={8}>
      {printing && (
        <IconButton
          name="pause"
          size={size}
          color={color}
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
          name="play"
          size={size}
          color={color}
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
          name="stop"
          size={size}
          color={color}
          onClick={() => {
            confirmAndCall(
              "Are you sure you want to cancel the print?",
              "cancel_print"
            );
          }}
        />
      )}
      <Progress
        style={{
          flex: 1,
          height: "auto",
          border: `1px solid var(--mantine-color-${color}-filled)`,
        }}
        size={size}
        color={color}
        value={job.progress}
      />
      <Badge size={size} color={color} style={{ height: "auto" }}>
        {Math.round(job.progress)}%
      </Badge>
    </Flex>
  );
}
