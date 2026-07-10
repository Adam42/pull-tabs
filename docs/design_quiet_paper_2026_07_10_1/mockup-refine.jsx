/* =====================================================================
   Mockup B — "Refine": keeps the current window skeleton (ink header,
   800px paper body) but merges Simple + Advanced into ONE model:
   - tabs are the first thing on the page
   - "apply to all" is a row of labeled chips ABOVE the list (was: a
     button grid + a redundant column-header row)
   - rows live flat inside one card — dividers, not per-row shadows
   - the CTA is docked in a sticky footer bar, never below the fold
   ===================================================================== */

function RefineChip({ action, on, onClick }) {
  return (
    <button type="button" className={"rf-chip" + (on ? " on" : "")} data-action={action.id} onClick={onClick}
      title={`Set every tab to ${action.label}`}>
      <Icon name={action.icon} size={15} invert={on} />
      <span>{action.label}</span>
    </button>
  );
}

function RefineRow({ row, onToggle, onAction }) {
  const cls = row.state === "successful" ? " done" : row.state === "failed" ? " fail" : row.checked ? "" : " off";
  return (
    <div className={"rf-row" + cls}>
      <Check checked={row.checked} onChange={onToggle} />
      <Favicon seed={row.id} site={row.fav} />
      <div className="rf-row-text" onClick={onToggle}>
        <div className="rf-title">{row.title}</div>
        <div className="rf-url">{row.url}</div>
      </div>
      {row.state ? (
        <span className="rf-result">{row.state === "successful" ? "✓ done" : "✕ failed"}</span>
      ) : (
        <div className="rf-seg">
          {PT_ACTIONS_TAB.map((a) => (
            <button key={a.id} type="button" title={a.label} data-action={a.id}
              className={row.action === a.id ? "on" : ""}
              onClick={() => onAction(a.id)}>
              <Icon name={a.icon} size={15} invert={row.action === a.id} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* Demo preset — varied per-row actions so the mixed state is visible; tab 6 starts unchecked */
const RF_PRESET = { 1: "bookmark", 2: "instapaper", 3: "clipboard", 4: "download", 5: "close" };
const rfInitRows = () => PT_SAMPLE_TABS.map((t) => ({ ...t, checked: t.id !== 6, action: RF_PRESET[t.id] || "bookmark", state: null }));

function MockupRefine({ skin, density }) {
  const [rows, setRows] = React.useState(rfInitRows());
  const [pulled, setPulled] = React.useState(false);
  const checked = rows.filter((r) => r.checked && r.action !== "ignore");
  const allSame = rows.length && rows.every((r) => r.action === rows[0].action) ? rows[0].action : null;

  const setAllAction = (id) => { setRows((rs) => rs.map((r) => ({ ...r, action: id, state: null }))); setPulled(false); };

  const pull = () => {
    if (pulled) {
      setRows(rfInitRows());
      setPulled(false);
      return;
    }
    setRows((rs) => rs.map((r) => (r.checked && r.action !== "ignore")
      ? { ...r, state: Math.random() > 0.15 ? "successful" : "failed" }
      : r));
    setPulled(true);
  };

  return (
    <div className={"rf-window" + (skin ? " " + skin : "") + (density === "compact" ? " rf-compact" : "")}>
      {/* ink header — same skeleton, nav demoted to the right */}
      <div className="rf-head">
        <img className="rf-logo" src={(window.__resources && window.__resources.logo) || "img/logo.svg"} alt="" />
        <span className="rf-brand">Pull Tabs</span>
        <span className="rf-count"><b>{rows.length}</b> tabs open</span>
        <nav className="rf-nav">
          <a className="active" href="#pull" onClick={(e) => e.preventDefault()}>Pull</a>
          <a href="#options" onClick={(e) => e.preventDefault()}>Options</a>
          <a href="#about" onClick={(e) => e.preventDefault()}>About</a>
        </nav>
      </div>

      <div className="rf-body">
        <SectionHeader kicker={`${checked.length}/${rows.length} selected`}>Open tabs</SectionHeader>

        {/* one toolbar: apply-to-all chips (replaces Simple grid + colhead row) */}
        <div className="rf-toolbar">
          <span className="label" style={{ color: "var(--ink-3)" }}>Set all →</span>
          <div className="rf-chips">
            {PT_ACTIONS.map((a) => (
              <RefineChip key={a.id} action={a} on={allSame === a.id} onClick={() => setAllAction(a.id)} />
            ))}
          </div>
        </div>

        {/* flat list in one card */}
        <div className="rf-card">
          {rows.map((r) => (
            <RefineRow key={r.id} row={r}
              onToggle={() => { setRows((rs) => rs.map((x) => x.id === r.id ? { ...x, checked: !x.checked, state: null } : x)); setPulled(false); }}
              onAction={(id) => { setRows((rs) => rs.map((x) => x.id === r.id ? { ...x, action: id, state: null } : x)); setPulled(false); }} />
          ))}
        </div>
      </div>

      {/* sticky footer bar */}
      <div className="rf-foot">
        <span className="meta">
          {pulled ? "done — click reset to start over" : allSame
            ? `${checked.length} tabs → ${PT_ACTIONS_TAB.find((a) => a.id === allSame).label}`
            : `${checked.length} tabs → mixed actions`}
        </span>
        <span className="rf-footright">
          <span className="meta">AUTOCLOSE ON</span>
          {pulled ? (
            <button type="button" className="btn" onClick={pull}>Reset</button>
          ) : (
            <button type="button" className="btn btn-primary" disabled={!checked.length} onClick={pull}>
              Pull {checked.length} tab{checked.length === 1 ? "" : "s"}
            </button>
          )}
        </span>
      </div>
    </div>
  );
}

Object.assign(window, { MockupRefine });
