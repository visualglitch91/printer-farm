import classNames from "classnames";

export default function Icon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <span className={classNames("icon", className)}>
      <i className={`fas fa-${name}`}></i>
    </span>
  );
}
