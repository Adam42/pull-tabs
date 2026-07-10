/* =====================================================================
   Mockup 2A pages — Results ("the list is the receipt") + Options.
   Replaces the old banner-per-tab spam: one summary strip, per-row
   past-tense results, inline retry on failures.
   Needs components.jsx (+ theme.css / mockups.css) loaded first.
   ===================================================================== */

const RS_PAST = { bookmark: "bookmarked", instapaper: "saved", clipboard: "copied", download: "downloaded", close: "closed", ignore: "skipped" };
const RS_PRESET = { 1: "bookmark", 2: "instapaper", 3: "clipboard", 4: "download", 5: "close" };
const rsInitRows = () => PT_SAMPLE_TABS.map((t) => ({
  ...t, checked: t.id !== 6, action: RS_PRESET[t.id] || "bookmark", state: t.id === 6 ? null : "queued",
}));

function PagesHead({ active, count, note }) {
  return (
    <div className="rf-head">
      <img className="rf-logo" src={ptAsset("logo", "img/logo.svg")} alt="" />
      <span className="rf-brand">Pull Tabs</span>
      <span className="rf-count">{note || <><b>{count}</b> tabs open</>}</span>
      <nav className="rf-nav">
        {["Pull", "Options", "About"].map((n) => (
          <a key={n} className={n === active ? "active" : ""} href={"#" + n.toLowerCase()} onClick={(e) => e.preventDefault()}>{n}</a>
        ))}
      </nav>
    </div>
  );
}

/* ---------------------------------------------------------------------
   3A — Results state
   --------------------------------------------------------------------- */
function ResultRow({ row, autoclose, onRetry }) {
  const gone = row.state === "successful" && (autoclose || row.action === "close");
  const cls = row.state === "successful" ? " done" : row.state === "failed" ? " fail"
    : row.state === "pending" ? " pending" : row.state === "queued" ? " queued" : row.checked ? "" : " off";
  return (
    <div className={"rf-row" + cls + (gone ? " gone" : "")}>
      <Icon name={row.action} size={17} />
      <Favicon seed={row.id} site={row.fav} />
      <div className="rf-row-text" style={{ cursor: "default" }}>
        <div className="rf-title">{row.title}</div>
        <div className="rf-url">{row.url}</div>
      </div>
      {row.state === "pending" ? (
        <span className="rf-reswrap"><span className="rf-spin"></span><span className="rf-result" style={{ color: "var(--info)" }}>pulling…</span></span>
      ) : row.state === "queued" ? (
        <span className="rf-result" style={{ color: "var(--ink-3)" }}>queued</span>
      ) : row.state === "successful" ? (
        <span className="rf-result">✓ {RS_PAST[row.action]}{gone && row.action !== "close" ? " · tab closed" : ""}</span>
      ) : row.state === "failed" ? (
        <span className="rf-reswrap">
          <span style={{ textAlign: "right" }}>
            <span className="rf-result">✕ failed</span>
            <span className="rf-reason">not authorized (401)</span>
          </span>
          <button type="button" className="btn btn-sm" onClick={onRetry}>Retry</button>
        </span>
      ) : (
        <span className="rf-result" style={{ color: "var(--ink-3)" }}>skipped</span>
      )}
    </div>
  );
}

function MockupResults({ autoclose = true, density }) {
  const [rows, setRows] = React.useState(rsInitRows());
  const [runId, setRunId] = React.useState(0);
  const timers = React.useRef([]);

  const setRow = (id, patch) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  React.useEffect(() => {
    setRows(rsInitRows());
    const ids = rsInitRows().filter((r) => r.checked).map((r) => r.id);
    let t = 350;
    ids.forEach((id) => {
      timers.current.push(setTimeout(() => setRow(id, { state: "pending" }), t));
      timers.current.push(setTimeout(() => setRow(id, { state: id === 2 ? "failed" : "successful" }), t + 550));
      t += 700;
    });
    return () => { timers.current.forEach(clearTimeout); timers.current = []; };
  }, [runId]);

  const retry = (id) => {
    setRow(id, { state: "pending" });
    timers.current.push(setTimeout(() => setRow(id, { state: "successful" }), 900));
  };

  const active = rows.filter((r) => r.checked);
  const done = active.filter((r) => r.state === "successful").length;
  const failed = active.filter((r) => r.state === "failed").length;
  const working = active.some((r) => r.state === "pending" || r.state === "queued");

  return (
    <div className={"rf-window" + (density === "compact" ? " rf-compact" : "")} data-screen-label="3A Results">
      <PagesHead active="Pull" count={PT_SAMPLE_TABS.length} note={working ? <>pulling <b>{active.length}</b> tabs…</> : <><b>{done}</b>/{active.length} pulled</>} />
      <div className="rf-body">
        <SectionHeader kicker={working ? `${done + failed}/${active.length} processed` : "finished"}>Pulling tabs</SectionHeader>

        <div className={"rf-summary" + (working ? "" : failed ? " bad" : " ok")}>
          {working ? (
            <><span className="rf-spin"></span><span>Pulling {active.length} tabs — {done + failed} of {active.length} done</span></>
          ) : failed ? (
            <><span>✕</span><span>{done} of {active.length} pulled — {failed} failed.</span><span className="meta">retry below, or reconnect Instapaper in Options</span></>
          ) : (
            <><span>✓</span><span>All {active.length} tabs pulled{autoclose ? " — tabs closed" : ""}.</span><span className="meta">autoclose {autoclose ? "on" : "off"}</span></>
          )}
        </div>

        <div className="rf-card">
          {rows.map((r) => (
            <ResultRow key={r.id} row={r} autoclose={autoclose} onRetry={() => retry(r.id)} />
          ))}
        </div>
      </div>
      <div className="rf-foot">
        <span className="meta">{working ? "working — leave this window open" : failed ? `${done} done · ${failed} failed` : "done"}</span>
        <span className="rf-footright">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRunId((n) => n + 1)}>Replay demo</button>
          {failed > 0 && !working ? (
            <button type="button" className="btn btn-primary" onClick={() => rows.filter((r) => r.state === "failed").forEach((r) => retry(r.id))}>
              Retry {failed} failed
            </button>
          ) : (
            <button type="button" className="btn" disabled={working}>Close window</button>
          )}
        </span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   3B — Options page (merged model: no Simple/Advanced toggles)
   --------------------------------------------------------------------- */
function OpRow({ title, desc, children }) {
  return (
    <div className="op-row">
      <div className="op-row-main">
        <div className="op-row-title">{title}</div>
        {desc ? <div className="meta" style={{ marginTop: 3 }}>{desc}</div> : null}
      </div>
      <div className="op-row-ctl">{children}</div>
    </div>
  );
}

function MockupOptionsPage({ density }) {
  const [autoclose, setAutoclose] = React.useState(true);
  const [defAction, setDefAction] = React.useState("bookmark");
  const [enabled, setEnabled] = React.useState({ instapaper: true, bookmark: true, download: true, clipboard: true, close: true, ignore: true });
  const [provider, setProvider] = React.useState("instapaper");
  const [authed, setAuthed] = React.useState({ instapaper: true, raindrop: false, readwise: false });
  const [hookUrl, setHookUrl] = React.useState("");
  const PROVIDERS = [
    { id: "instapaper", name: "Instapaper", desc: "Save each tab to your Instapaper reading queue." },
    { id: "raindrop", name: "Raindrop.io", desc: "File each tab as a bookmark in a Raindrop collection." },
    { id: "readwise", name: "Readwise Reader", desc: "Send each tab to your Reader inbox." },
    { id: "webhook", name: "Custom webhook", desc: "POST each tab\u2019s URL and title to an endpoint you control." },
  ];
  const setActive = (id) => setProvider(id);

  return (
    <div className={"rf-window" + (density === "compact" ? " rf-compact" : "")} data-screen-label="3B Options">
      <PagesHead active="Options" note={<>changes save automatically</>} />
      <div className="op-body">
        <SectionHeader kicker="save destination">Read-later service</SectionHeader>
        <div className="meta" style={{ marginBottom: 12 }}>
          The <strong style={{ color: "var(--ink)" }}>Save</strong> action sends a tab to one read-later service. Pick the one you use — only the active service runs.
        </div>
        <div className="card" style={{ overflow: "hidden" }}>
          {PROVIDERS.map((p, i) => {
            const active = provider === p.id;
            const needsAuth = p.id !== "webhook";
            const ok = p.id === "webhook" ? hookUrl.trim().length > 0 : authed[p.id];
            return (
              <div key={p.id} onClick={() => setActive(p.id)}
                style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 16px", cursor: "pointer",
                  background: active ? "var(--signal-tint)" : "transparent",
                  borderBottom: i < PROVIDERS.length - 1 ? "1px solid var(--line-soft)" : "none" }}>
                <span style={{ width: 16, height: 16, borderRadius: "50%", flex: "0 0 auto",
                  border: "1.5px solid var(--ink)", background: active ? "var(--signal)" : "transparent",
                  boxShadow: active ? "inset 0 0 0 2.5px var(--card)" : "none" }}></span>
                <img src={ptAsset("prov_" + p.id, "img/" + p.id + ".svg")} alt="" width={22} height={22} style={{ flex: "0 0 auto" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                    {p.name}
                    {active && ok ? <span className="chip on" style={{ fontSize: 10, padding: "1px 7px" }}>active</span> : null}
                  </div>
                  <div className="meta">{p.desc}</div>
                </div>
                {active ? (
                  needsAuth ? (
                    authed[p.id] ? (
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setAuthed({ ...authed, [p.id]: false }); }}>Sign out</Button>
                    ) : (
                      <Button variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); setAuthed({ ...authed, [p.id]: true }); }}>Connect</Button>
                    )
                  ) : null
                ) : (
                  <span className="meta" style={{ fontFamily: "var(--mono)", fontSize: 11 }}>select</span>
                )}
              </div>
            );
          })}
        </div>
        {provider === "webhook" ? (
          <div style={{ marginTop: 12 }}>
            <div className="label" style={{ marginBottom: 8 }}>Endpoint URL</div>
            <input className="input" type="url" placeholder="https://hooks.example.com/pull-tabs"
              value={hookUrl} onChange={(e) => setHookUrl(e.target.value)} style={{ width: "100%", boxSizing: "border-box" }} />
            <div className="meta" style={{ marginTop: 8 }}>Each saved tab sends a JSON <code>POST</code> with its <code>url</code>, <code>title</code>, and <code>favIconUrl</code>.</div>
          </div>
        ) : provider !== "webhook" && !authed[provider] ? (
          <div className="rf-summary bad" style={{ marginTop: 12, marginBottom: 0 }}>
            <span>✕</span><span>Not connected — Save will fail until you connect {PROVIDERS.find((p) => p.id === provider).name}.</span>
          </div>
        ) : null}

        <SectionHeader kicker="behavior">Pulling</SectionHeader>
        <OpRow title="Autoclose" desc="Close each tab after its action succeeds.">
          <Switch checked={autoclose} onChange={setAutoclose} />
        </OpRow>
        <OpRow title="Default action" desc="What every tab is set to when the window opens.">
          <select className="select" value={defAction} onChange={(e) => setDefAction(e.target.value)}>
            {PT_ACTIONS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
        </OpRow>

        <SectionHeader kicker="picker">Actions</SectionHeader>
        <div className="meta" style={{ marginBottom: 12 }}>Choose which actions appear in the set-all chips and each row's picker.</div>
        <div className="rf-chips">
          {PT_ACTIONS_TAB.map((a) => (
            <button key={a.id} type="button" data-action={a.id}
              className={"rf-chip" + (enabled[a.id] ? " on" : "")}
              title={(enabled[a.id] ? "Hide " : "Show ") + a.label}
              onClick={() => setEnabled({ ...enabled, [a.id]: !enabled[a.id] })}>
              <Icon name={a.icon} size={15} invert={enabled[a.id]} />
              <span>{a.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="rf-foot">
        <span className="meta">Pull Tabs v2.0 · settings sync with your browser profile</span>
        <span className="meta">AUTOCLOSE {autoclose ? "ON" : "OFF"}</span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   3C — About page (2A window shell; merged-model copy)
   --------------------------------------------------------------------- */
function AboutCredit({ name, who, src }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13 }}>
      <span style={{ fontWeight: 600 }}>{name}</span>
      <span className="meta" style={{ textAlign: "right" }}>{who} · {src}</span>
    </div>
  );
}

function MockupAbout({ density }) {
  const credits = [
    ["Pull Tab", "Chamaquito Pan de Dulce", "Noun Project"],
    ["Bookmark", "Muneer A.Safiah", "Noun Project"],
    ["Close", "Michael Wallner", "Noun Project"],
    ["Download", "Alex Fuller", "Noun Project"],
    ["Ignore", "Konstantinos Riginos", "Noun Project"],
    ["Copy to clipboard", "Andrew", "Noun Project"],
    ["Service & favicon marks", "Simple Icons", "simpleicons.org"],
  ];
  const flow = [
    { n: "1", t: "Pull", d: "Every open tab drops into one list, all checked and set to your default action." },
    { n: "2", t: "Set", d: "Change the action for all tabs at once, or override any single row. Uncheck the ones you want to keep." },
    { n: "3", t: "Go", d: "One button runs the whole pile. With autoclose on, tabs clear themselves as each action lands." },
  ];
  return (
    <div className={"rf-window" + (density === "compact" ? " rf-compact" : "")} data-screen-label="3C About">
      <PagesHead active="About" note={<>v2.0</>} />
      <div className="op-body">
        <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "8px 0 18px" }}>
          <img src={ptAsset("logo", "img/logo.svg")} alt="" style={{ width: 44, height: 44 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 22, lineHeight: 1.1 }}>Pull Tabs</div>
            <div className="meta">Empty your window in one pull.</div>
          </div>
        </div>

        <p className="lead" style={{ marginBottom: 22 }}>
          Pull Tabs gathers every tab in the current window into one list and lets you act on the
          whole pile at once — save to Instapaper, bookmark, download, copy the URL, or close.
        </p>

        <SectionHeader kicker="the whole idea">How it works</SectionHeader>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, margin: "4px 0 8px" }}>
          {flow.map((s) => (
            <div key={s.n} className="well" style={{ padding: 16 }}>
              <div className="chip on" style={{ width: 22, height: 22, padding: 0, justifyContent: "center", borderRadius: "50%", marginBottom: 10 }}>{s.n}</div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{s.t}</div>
              <div className="meta" style={{ lineHeight: 1.5 }}>{s.d}</div>
            </div>
          ))}
        </div>
        <p className="meta" style={{ margin: "14px 0 4px", lineHeight: 1.6 }}>
          No more Simple vs. Advanced modes — one list does both. Set everything at once when you want speed,
          or give individual tabs their own action when you don't. Same list, either way.
        </p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "18px 0 4px" }}>
          <span className="chip">save to instapaper</span>
          <span className="chip">bookmark</span>
          <span className="chip">download</span>
          <span className="chip">copy url</span>
          <span className="chip">close</span>
        </div>

        <SectionHeader kicker="attribution">Credits</SectionHeader>
        <div className="meta" style={{ marginBottom: 14, lineHeight: 1.8 }}>
          Built by <a href="https://adamp.com/" target="_blank" rel="noreferrer">Adam Pieniazek</a> ·
          <a href="https://adam42.github.io/pull-tabs/" target="_blank" rel="noreferrer"> adam42.github.io/pull-tabs</a>
        </div>
        <div className="well">
          <div className="label" style={{ marginBottom: 10 }}>Icons</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px" }}>
            {credits.map((c, i) => <AboutCredit key={i} name={c[0]} who={c[1]} src={c[2]} />)}
          </div>
        </div>
      </div>
      <div className="rf-foot">
        <span className="meta">Pull Tabs v2.0 · MIT licensed · open source</span>
        <span className="meta">MADE FOR TAB HOARDERS</span>
      </div>
    </div>
  );
}

Object.assign(window, { MockupResults, MockupOptionsPage, MockupAbout });
