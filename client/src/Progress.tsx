export function Progress({ value, color }: { value: number; color: string }) {
  return (
    <progress
      className={`progress is-large is-${color} has-text-${color}`}
      value={value}
      max="100"
    >
      {value}%
    </progress>
  );
}
