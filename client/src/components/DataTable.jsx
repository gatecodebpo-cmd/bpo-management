import { useMemo, useState } from "react";
import { toAbsoluteAssetUrl } from "../api/client";

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}>
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const DetailModal = ({ title, columns, data, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px" }}>
        <h3 className="modal-title">View Details - {title}</h3>
        <div className="modal-fields" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", maxHeight: "60vh", overflowY: "auto", paddingRight: "8px" }}>
          {columns.map((col) => {
            if (col.key === "paymentScreenshot") return null;
            return (
              <div key={col.key} className="field-wrap" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                  {col.label}
                </span>
                <div style={{ fontSize: "14px", color: "var(--text-heading)", fontWeight: 500 }}>
                  {col.render ? col.render(data) : data[col.key] ? String(data[col.key]) : "-"}
                </div>
              </div>
            );
          })}
          {data.paymentScreenshot && (
            <div style={{ gridColumn: "1 / -1", marginTop: "12px" }}>
              <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "8px" }}>
                Payment Screenshot
              </span>
              <div style={{ display: "flex", justifyContent: "center", background: "rgba(0,0,0,0.2)", borderRadius: "8px", padding: "12px", border: "1px solid var(--border)" }}>
                <a href={toAbsoluteAssetUrl(data.paymentScreenshot)} target="_blank" rel="noreferrer">
                  <img
                    src={toAbsoluteAssetUrl(data.paymentScreenshot)}
                    alt="Payment Screenshot"
                    style={{ maxWidth: "100%", maxHeight: "250px", objectFit: "contain", borderRadius: "4px" }}
                  />
                </a>
              </div>
            </div>
          )}
        </div>
        <div className="modal-actions" style={{ marginTop: "24px" }}>
          <button className="primary-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const DataTable = ({ title, columns, data, statusOptions = [], onStatusChange, searchKeys = [], showAction = true, onEdit, onDelete }) => {
  const items = Array.isArray(data) ? data : [];
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "asc" });
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [viewRow, setViewRow] = useState(null);
  const pageSize = 12;

  const filtered = useMemo(() => {
    let list = [...items];
    if (statusFilter) {
      list = list.filter((item) =>
        (item.orderStatus || item.returnStatus || item.parcelStatus || "").toLowerCase() === statusFilter.toLowerCase()
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((item) =>
        searchKeys.some((key) => {
          const val = String(item[key] ?? "").toLowerCase().trim();
          return val.startsWith(q);
        })
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
          <div className="table-search-wrap">
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
                    <td>
                      <div style={{ display: "flex", flexDirection: "row", gap: 10, justifyContent: "center", alignItems: "center", flexWrap: "nowrap" }}>
                        <button
                          className="table-action-icon-btn"
                          title="View Details"
                          onClick={() => setViewRow(row)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "6px",
                            borderRadius: "6px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#06b6d4"
                          }}
                        >
                          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                        {onEdit && (
                          <button
                            className="table-action-icon-btn"
                            title="Edit"
                            onClick={() => onEdit(row)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: "6px",
                              borderRadius: "6px",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#f59e0b"
                            }}
                          >
                            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
                            </svg>
                          </button>
                        )}
                        {onDelete && (
                          <button
                            className="table-action-icon-btn"
                            title="Delete"
                            onClick={() => onDelete(row)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: "6px",
                              borderRadius: "6px",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#ef4444"
                            }}
                          >
                            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="pagination">
        <span className="pagination-info">
          Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
        </span>
        <div className="pagination-controls">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
          <span className="pagination-page">{page} / {maxPage}</span>
          <button disabled={page === maxPage} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      </div>

      {viewRow && (
        <DetailModal
          title={title}
          columns={columns}
          data={viewRow}
          onClose={() => setViewRow(null)}
        />
      )}
    </section>
  );
};

export default DataTable;
