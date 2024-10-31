import { Button, ButtonProps } from "@mantine/core";
import Icon from "./Icon";

export default function IconButton({
  name,
  size = "xs",
  ...props
}: Omit<ButtonProps, "children"> & {
  name: string;
  onClick?: () => void;
}) {
  return (
    <Button
      {...props}
      size={size}
      p={0}
      w="var(--button-height, var(--button-height-sm))"
      radius="100%"
    >
      <Icon name={name} className="is-small" />
    </Button>
  );
}
