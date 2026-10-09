function MySettingsView({ user, role }) {
      const [tsec, setTsec] = useState('all');
      const [tq, setTq] = useState('');
      const [previewThemeId, setPreviewThemeId] = useState(() => ls.get('app_theme_id') || 'UI 1');
      const [activeThemeId, setActiveThemeId] = useState(() => ls.get('app_theme_id') || 'UI 1');

      const pvTheme = findTheme(previewThemeId) || UI_THEMES[0];
      const filteredThemes = useMemo(() => {
        const q = tq.trim().toLowerCase();
        return UI_THEMES.filter(t => (tsec === 'all' || themeSec(t.id) === tsec) && (!q || t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q)));
      }, [tsec, tq]);

      const applyTheme = () => {
        const t = findTheme(previewThemeId) || UI_THEMES[0];
        const v = themeVars(t);
        applyThemeVars(v);
        cacheThemeVars(v);
        ls.set('app_theme_id', t.id);
        setActiveThemeId(t.id);
        Swal.fire({ icon: 'success', title: 'Theme Applied!', text: t.name, timer: 1400, showConfirmButton: false });
      };

      return (
        <div className="data-section">
          <div className="section-header">
            <h2><i className="fas fa-palette"></i> My Settings (Theme &amp; Appearance)</h2>
          </div>

          <div className="thm-bar" style={{ marginBottom: 16 }}>
            <div className="thm-chips">
              {THEME_SECTIONS.map(([k, lbl, ic]) => (
                <button key={k} type="button" className={'thm-chip' + (tsec === k ? ' on' : '')} onClick={() => setTsec(k)}>
                  <i className={'fas ' + ic}></i> {lbl}
                </button>
              ))}
            </div>
            <div className="thm-search">
              <i className="fas fa-magnifying-glass"></i>
              <input type="text" value={tq} placeholder="Search palettes..." onChange={e => setTq(e.target.value)} />
            </div>
          </div>

          <p style={{ fontSize: 12.5, color: '#718096', marginBottom: 12 }}>
            <i className="fas fa-swatchbook"></i> Showing {filteredThemes.length} of {UI_THEMES.length} palettes
          </p>

          <div className="theme-gallery">
            {filteredThemes.map(t => (
              <div
                key={t.id}
                className={'theme-card' + (activeThemeId === t.id ? ' active' : '') + (previewThemeId === t.id ? ' previewing' : '')}
                onClick={() => { setPreviewThemeId(t.id); applyThemeVars(themeVars(t)); }}
                title={'Preview ' + t.name}
              >
                <div className="theme-swatch">
                  <span style={{ background: t.primary }}></span>
                  <span style={{ background: t.secondary }}></span>
                  <span style={{ background: t.bg }}></span>
                  <span style={{ background: t.accent }}></span>
                </div>
                <div className="theme-body">
                  <div className="theme-name">{t.name}</div>
                  <div className="theme-id">
                    {t.id}
                    {activeThemeId === t.id && <span className="theme-default-badge" style={{ background: '#22c55e' }}>ACTIVE</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="theme-preview-panel" style={{ marginTop: 24 }}>
            <div className="tp-head" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="tp-title"><i className="fas fa-eye"></i> {pvTheme.name}</span>
                <span className="tp-chip">{pvTheme.id}</span>
                {activeThemeId === pvTheme.id && <span className="tp-tag applied"><i className="fas fa-check"></i> CURRENT</span>}
              </div>
              <button className="btn btn-primary" type="button" onClick={applyTheme}>
                <i className="fas fa-check"></i> Set Now ({pvTheme.name})
              </button>
            </div>

            <div className="tp-mock" style={{ background: pvTheme.bg }}>
              <div className="tp-side" style={{ background: pvTheme.primary }}>
                <div className="tp-logo"></div>
                {['fa-gauge-high', 'fa-table-cells-large', 'fa-boxes-stacked', 'fa-gear'].map(ic => <i className={'fas ' + ic} key={ic}></i>)}
              </div>
              <div className="tp-body2">
                <div className="tp-nav" style={{ background: pvTheme.card }}>
                  <span className="tp-h" style={{ background: pvTheme.secondary }}></span>
                  <span className="tp-av" style={{ background: pvTheme.accent }}></span>
                </div>
                <div className="tp-content">
                  <div className="tp-kpis">
                    {[['128', 'RECORDS', pvTheme.primary, '#fff'], ['₹9.4k', 'SALES', pvTheme.secondary, '#fff'], ['+18%', 'PROFIT', pvTheme.accent, pvTheme.onAccent]].map(([n, l, bg, c], i) => (
                      <div key={i} className="tp-kpi" style={{ background: bg, color: c }}>
                        <span className="tp-kpi-n">{n}</span>
                        <span className="tp-kpi-l">{l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // --- My Account View ---
