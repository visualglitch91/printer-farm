import { Flex } from "@mantine/core";
import IconButton from "./IconButton";

function parseTemperature(value: number | null | undefined) {
  return typeof value === "number" ? `${Math.round(value * 10) / 10}°C` : "-";
}

export default function TempCell({
  current,
  target,
  onEdit,
}: {
  current: number;
  target: number;
  onEdit: () => void;
}) {
  return (
    <Flex gap={8} align="center" justify="flex-end">
      {parseTemperature(current)}
      {" › "}
      {parseTemperature(target)}
      <IconButton name="edit" onClick={onEdit} />
    </Flex>
  );
}
