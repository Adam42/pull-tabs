/* =====================================================================
   Pull Tabs UI Kit — shared primitives ("Pull" theme)
   ===================================================================== */

/* Icon source files. In a bundled/standalone export these are lifted to
   window.__resources (see the ext-resource-dependency meta tags); in the
   normal dev view they resolve as relative paths. */
const PT_ICON_FILES = {
  pocket:    "img/pocket.svg",
  instapaper:"img/instapaper.svg",
  bookmark:  "img/bookmark.svg",
  download:  "img/download.svg",
  clipboard: "img/clipboard.svg",
  close:     "img/close.svg",
  ignore:    "img/ignore.svg",
};
function ptAsset(id, fallback) {
  return (typeof window !== "undefined" && window.__resources && window.__resources[id]) || fallback;
}
function ptIconUrl(name) {
  return ptAsset("icon_" + name, PT_ICON_FILES[name]);
}
const PT_ICONS = PT_ICON_FILES; // back-compat alias

// Action catalogue — mirrors src/js/services/* providers.js
// (Pocket shut down in 2025; the read-later slot is now Instapaper.)
const PT_ACTIONS = [
  { id: "instapaper", label: "Instapaper", icon: "instapaper" },
  { id: "bookmark",  label: "Bookmark",  icon: "bookmark"  },
  { id: "download",  label: "Download",  icon: "download"  },
  { id: "clipboard", label: "Clipboard", icon: "clipboard" },
  { id: "close",     label: "Close",     icon: "close"     },
];
// per-tab adds "ignore"
const PT_ACTIONS_TAB = [...PT_ACTIONS, { id: "ignore", label: "Ignore", icon: "ignore" }];

function Icon({ name, size = 18, invert = false, style }) {
  if (!name || !PT_ICON_FILES[name]) return null;
  return (
    <img src={ptIconUrl(name)} alt="" width={size} height={size}
      style={{ height: size, width: size, filter: invert ? "brightness(0) invert(1)" : "none", ...style }} />
  );
}

function Button({ variant = "default", size, block, children, icon, invertIcon, ...rest }) {
  const cls = ["btn",
    variant === "primary" ? "btn-primary" : variant === "ghost" ? "btn-ghost" : "",
    size === "lg" ? "btn-lg" : size === "sm" ? "btn-sm" : "",
    block ? "btn-block" : "",
  ].filter(Boolean).join(" ");
  return (
    <button className={cls} {...rest}>
      {icon ? <Icon name={icon} invert={invertIcon} /> : null}
      {children}
    </button>
  );
}

function Header({ active, onNavigate, numTabs, autoclose }) {
  const NavLink = ({ id, children }) => (
    <a href={`#${id}`} className={active === id ? "active" : ""}
       onClick={(e) => { e.preventDefault(); onNavigate(id); }}>{children}</a>
  );
  return (
    <div className="pt-header">
      <div className="pt-brand" onClick={() => onNavigate("popup")}>
        <img src={ptAsset("logo", "img/logo.svg")} alt="" />
        <span className="name">Pull Tabs</span>
      </div>
      <nav className="pt-nav">
        <NavLink id="popup">Pull</NavLink>
        <NavLink id="options">Options</NavLink>
        <NavLink id="about">About</NavLink>
      </nav>
      <div className="pt-header-right">
        {autoclose ? <span className="pt-flag">autoclose on</span> : null}
        {typeof numTabs === "number" ? (
          <span className="pt-count"><b>{numTabs}</b> tabs open</span>
        ) : null}
      </div>
    </div>
  );
}

function SectionHeader({ children, kicker }) {
  return (
    <div className="section-header">
      <h3>{children}</h3>
      {kicker ? <span className="kicker">{kicker}</span> : null}
    </div>
  );
}

function Check({ checked, onChange }) {
  return (
    <label className="check" onClick={(e) => e.stopPropagation()}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="box"></span>
    </label>
  );
}

function Switch({ checked, onChange }) {
  return (
    <label className="switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="track"></span>
      <span className="thumb"></span>
    </label>
  );
}

// deterministic warm favicon chip; pass `site` (img/fav/<site>.svg) for a real favicon tile
function Favicon({ seed = 0, site }) {
  if (site) {
    return (
      <span className="fav fav-real">
        <img src={ptAsset("fav_" + site, "img/fav/" + site + ".svg")} alt="" />
      </span>
    );
  }
  const hues = ["#F4502A", "#2E8B57", "#2C6E7A", "#C2371F", "#D98A2B", "#4F483D"];
  return <span className="fav" style={{ background: hues[seed % hues.length] }} />;
}

Object.assign(window, {
  PT_ICONS, PT_ACTIONS, PT_ACTIONS_TAB, Icon, Button, Header, SectionHeader, Check, Switch, Favicon,
});
