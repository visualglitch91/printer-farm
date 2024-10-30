import classNames from "classnames";
import Icon from "./Icon";

export default function IconButton({
  name,
  className,
  onClick,
}: {
  name: string;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button className={classNames("button", className)} onClick={onClick}>
      <Icon name={name} className="is-small" />
    </button>
  );
}
