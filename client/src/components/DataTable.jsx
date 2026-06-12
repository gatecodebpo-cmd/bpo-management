import { useMemo, useState } from "react";

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}>
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const DataTable = ({ title, columns, data, statusOptions = [], onStatusChange, searchKeys = [], showAction = true }) => {
  const items = Array.isArray(data) ? data : [];
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "asc" });
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const filtered = useMemo(() => {
    let list = [...items];
    if (statusFilter) {
      list = list.filter((item) =>
        (item.orderStatus || item.returnStatus || "").toLowerCase() === statusFilter.toLowerCase()
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((item) =>
        searchKeys.some((key) => String(item[key] ?? "").toLowerCase().includes(q))
      );
    }
    if (sortConfig.key) {
      list.sort((a, b) => {
        const av = String(a[sortConfig.key] ?? "");
        const bv = String(b[sortConfig.key] ?? "");
        return sortConfig.direction === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return list;
  }, [items, search, searchKeys, sortConfig, statusFilter]);

  const maxPage = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pagedRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <section className="table-shell glass-card">
      <div className="table-header">
        <h3>{title} <span style={{ fontWeight: 400, fontSize: 13, color: "var(--text-muted)" }}>({items.length})</span></h3>
        <div className="table-controls">
          <div style={{ position: "relative" }}>
            <SearchIcon />
            <input
              placeholder="Search..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ paddingLeft: 32 }}
            />
          </div>
          {statusOptions.length > 0 && (
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All Statuses</option>
              {statusOptions.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
          )}
        </div>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} onClick={() => setSortConfig((prev) => ({
                  key: col.key,
                  direction: prev.key === col.key && prev.direction === "asc" ? "desc" : "asc",
                }))}>
                  {col.label}
                  {sortConfig.key === col.key && (
                    <span style={{ marginLeft: 4, fontSize: 10 }}>{sortConfig.direction === "asc" ? "▲" : "▼"}</span>
                  )}
                </th>
              ))}
              {showAction && <th style={{ textAlign: "center" }}>Action</th>}
            </tr>
          </thead>
          <tbody>
            {pagedRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (showAction ? 1 : 0)} style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px 24px", fontSize: 14 }}>
                  {search || statusFilter ? "No matching records found" : "No records yet"}
                </td>
              </tr>
            ) : (
              pagedRows.map((row) => (
                <tr key={row._id}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render ? col.render(row) : row[col.key] ? String(row[col.key]) : "-"}
                    </td>
                  ))}
                  {showAction && (
                    <td style={{ textAlign: "center" }}>
                      <select
                        value={row.orderStatus || row.returnStatus}
                        onChange={(e) => onStatusChange(row._id, e.target.value)}
                        style={{ minWidth: 130, fontSize: 12, padding: "5px 8px" }}
                      >
                        {statusOptions.map((s) => (<option key={s} value={s}>{s}</option>))}
                      </select>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="pagination">
        <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
          Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
          <span style={{ padding: "6px 8px", fontSize: 13, color: "var(--text)" }}>{page} / {maxPage}</span>
          <button disabled={page === maxPage} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      </div>
    </section>
  );
};

export default DataTable;
