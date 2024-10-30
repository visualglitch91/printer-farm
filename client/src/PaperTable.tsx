export function PaperTable({ children }: { children?: React.ReactNode }) {
  return (
    <div className="box mb-0 p-2">
      <table className="table is-narrow is-fullwidth">{children}</table>
    </div>
  );
}
