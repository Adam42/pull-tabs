/* =====================================================================
   Pull Tabs UI Kit — Popup ("Pull" theme)
   Simple "Act on all tabs" + advanced "Choose tabs & actions" with a
   segmented per-tab action picker + clickable bulk-apply column headers.
   ===================================================================== */

const PT_SAMPLE_TABS = [
  { id: 1, title: "How browser tab management works — MDN", url: "developer.mozilla.org/docs/Web/API/Tab", fav: "mdnwebdocs" },
  { id: 2, title: "Instapaper — Home", url: "instapaper.com/u", fav: "instapaper" },
  { id: 3, title: "Space Grotesk — Google Fonts", url: "fonts.google.com/specimen/Space+Grotesk", fav: "googlefonts" },
  { id: 4, title: "GitHub · Adam42/pull-tabs", url: "github.com/Adam42/pull-tabs", fav: "github" },
  { id: 5, title: "The Noun Project", url: "thenounproject.com", fav: "nounproject" },
  { id: 6, title: "Hacker News", url: "news.ycombinator.com", fav: "ycombinator" },
];

function StatusBanner({ status }) {
  if (!status) return null;
  const cls = status.type === "fail" ? "banner-fail" : status.type === "info" ? "banner-info" : "banner-success";
  return <div className={`banner ${cls}`} style={{ marginBottom: 20 }}><span className="dot"></span>{status.message}</div>;
}

/* ---------- Simple view: one action for every tab ---------- */
function SimpleView({ count, onActOnAll }) {
  return (
    <div>
      <SectionHeader kicker={`× ${count} tabs`}>Act on all tabs</SectionHeader>
      <p className="meta" style={{ marginBottom: 16 }}>
        Pick one destination — it's applied to every open tab.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
        {PT_ACTIONS.map((a) => (
          <Button key={a.id} variant="default" icon={a.icon}
                  style={{ justifyContent: "flex-start", padding: "13px 16px" }}
                  onClick={() => onActOnAll(a)}>
            {a.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Advanced view ---------- */
function TabRow({ tab, index, checked, action, state, onToggle, onAction }) {
  const cls = state === "successful" ? "successful" : state === "failed" ? "failed" : checked ? "" : "off";
  return (
    <div className={`tabrow ${cls}`}>
      <Check checked={checked} onChange={onToggle} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="title">{tab.title}</div>
        <div className="url">{tab.url}</div>
      </div>
      {state ? (
        <span className="result">
          {state === "successful" ? "✓ done" : "✕ failed"}
        </span>
      ) : (
        <div className="seg">
          {PT_ACTIONS_TAB.map((a) => (
            <button key={a.id} type="button" title={a.label}
                    className={action === a.id ? "on" : ""}
                    onClick={() => onAction(a.id)}>
              <Icon name={a.icon} size={17} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AdvancedView({ rows, setRows, onSubmit }) {
  const checkedCount = rows.filter((r) => r.checked).length;
  const setAll = (checked) => setRows(rows.map((r) => ({ ...r, checked, state: null })));
  const setAllAction = (action) => setRows(rows.map((r) => ({ ...r, action, state: null })));
  // which action, if any, is set on every row — so its column header reads as "on"
  const allSame = rows.length && rows.every((r) => r.action === rows[0].action) ? rows[0].action : null;
  return (
    <div style={{ marginTop: 36 }}>
      <SectionHeader kicker={`${checkedCount}/${rows.length} selected`}>Choose tabs &amp; actions</SectionHeader>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center" }}>
        <Button variant="default" size="sm" onClick={() => setAll(true)}>Check all</Button>
        <Button variant="ghost" size="sm" onClick={() => setAll(false)}>Reset</Button>
      </div>

      {/* Clickable column headers: name the icons once, and bulk-apply to every tab */}
      <div className="colhead">
        <span className="colhead-hint">set all →</span>
        <div className="colhead-cols">
          {PT_ACTIONS_TAB.map((a) => (
            <button key={a.id} type="button" title={`Set every tab to ${a.label}`}
                    className={`colhead-col ${allSame === a.id ? "on" : ""}`}
                    onClick={() => setAllAction(a.id)}>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div className="tablist">
        {rows.map((r, i) => (
          <TabRow key={r.id} tab={r} index={i} checked={r.checked} action={r.action} state={r.state}
            onToggle={() => setRows(rows.map((x) => x.id === r.id ? { ...x, checked: !x.checked, state: null } : x))}
            onAction={(action) => setRows(rows.map((x) => x.id === r.id ? { ...x, action } : x))}
          />
        ))}
      </div>
      <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 14 }}>
        <Button variant="primary" size="lg" onClick={onSubmit}>Pull {checkedCount} tab{checkedCount === 1 ? "" : "s"}</Button>
        <span className="meta">or press <kbd>⏎</kbd></span>
      </div>
    </div>
  );
}

function Popup({ layout, autoclose, onNumTabs }) {
  const [tabs] = React.useState(PT_SAMPLE_TABS);
  const [status, setStatus] = React.useState(null);
  const [rows, setRows] = React.useState(
    PT_SAMPLE_TABS.map((t) => ({ ...t, checked: true, action: "instapaper", state: null }))
  );

  React.useEffect(() => { onNumTabs && onNumTabs(tabs.length); }, [tabs.length]);

  const flash = (message, type = "success") => {
    setStatus({ message, type });
    window.clearTimeout(flash._t);
    flash._t = window.setTimeout(() => setStatus(null), 3400);
  };

  const actOnAll = (action) => flash(`Sent all ${tabs.length} tabs to ${action.label}.`, "success");

  const submitAdvanced = () => {
    const active = rows.filter((r) => r.checked && r.action !== "ignore");
    setRows((prev) => prev.map((r) =>
      (!r.checked || r.action === "ignore") ? r : { ...r, state: Math.random() > 0.12 ? "successful" : "failed" }
    ));
    flash(`Pulled ${active.length} tab${active.length === 1 ? "" : "s"}.`, "success");
  };

  const showSimple = layout === "simple" || layout === "both";
  const showAdvanced = layout === "advanced" || layout === "both";

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "26px 28px 40px" }}>
      <StatusBanner status={status} />
      {showSimple && <SimpleView count={tabs.length} onActOnAll={actOnAll} />}
      {showAdvanced && <AdvancedView rows={rows} setRows={setRows} onSubmit={submitAdvanced} />}
    </div>
  );
}

Object.assign(window, { Popup, PT_SAMPLE_TABS });
