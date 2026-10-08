import type { ReactNode } from "react";

export interface DataTableColumn<Row> {
  key: string;
  header: string;
  render: (row: Row) => ReactNode;
}

export interface DataTableProps<Row> {
  columns: DataTableColumn<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  emptyText?: string;
}

export function DataTable<Row>({ columns, rows, rowKey, emptyText = "Sem registros" }: DataTableProps<Row>) {
  return (
    <div className="smart-table-wrap">
      <table className="smart-table">
        <thead>
          <tr>{columns.map((c) => <th key={c.key}>{c.header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td className="smart-table__empty" colSpan={columns.length}>{emptyText}</td></tr>
          ) : (
            rows.map((r) => (
              <tr key={rowKey(r)}>{columns.map((c) => <td key={c.key}>{c.render(r)}</td>)}</tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
