// inicialização do usuário (vindo do login)
        const user = JSON.parse(sessionStorage.getItem('gsb_user') || '{}');
        if (!user.email) {
            setTimeout(() => location.href = '../Login.html', 80);
        } else {
            document.getElementById('user_email').textContent = user.email;
            document.getElementById('avatar').textContent = user.email.charAt(0).toUpperCase();
        }

        function logout() {
            sessionStorage.removeItem('gsb_user');
            location.href = '../Login.html';
        }

        function showSection(key) {
            // nav highlights
            document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));
            document.getElementById('nav_' + (key === 'overview' ? 'overview' : key)).classList.add('active');
            // sections display
            document.getElementById('overview_section').style.display = key === 'overview' ? '' : 'none';
            document.getElementById('monitor_section').style.display = key === 'monitor' ? '' : 'none';
            document.getElementById('analytics_section').style.display = key === 'analytics' ? '' : 'none';
            document.getElementById('reports_section').style.display = key === 'reports' ? '' : 'none';
            document.getElementById('settings_section').style.display = key === 'settings' ? '' : 'none';
        }

        // LAST UPDATE
        function updateTimestamp() { document.getElementById('last_update').textContent = new Date().toLocaleString(); }
        updateTimestamp(); setInterval(updateTimestamp, 30_000);

        // MAP: initialize map with Ctrl+wheel zoom behavior and no predefined markers
        const map = L.map('map', { scrollWheelZoom: false }).setView([-14.2350, -51.9253], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '' }).addTo(map);

        // Global flag: disable all automatic/manual readings & hide reading UI when false
        const SHOW_READINGS = false;

        // Ensure any leftover auto intervals are cleared
        if (window.autoReadIntervalId) {
            clearInterval(window.autoReadIntervalId);
            window.autoReadIntervalId = null;
        }

        // If readings are disabled, hide charts and events and disable read form controls
        (function disableReadingsUIIfNeeded() {
            if (SHOW_READINGS) return;
            // hide charts canvases and their parent cards (if present)
            const levelsCanvas = document.getElementById('chartLevels');
            if (levelsCanvas) {
                const parent = levelsCanvas.closest('.card');
                if (parent) parent.style.display = 'none';
            }
            const alertsCanvas = document.getElementById('chartAlerts');
            if (alertsCanvas) {
                const parent = alertsCanvas.closest('.card');
                if (parent) parent.style.display = 'none';
            }
            // hide events card/table
            const eventsTable = document.getElementById('events_table');
            if (eventsTable) {
                const card = eventsTable.closest('.card');
                if (card) card.style.display = 'none';
                eventsTable.innerHTML = ''; // clear any previous rows
            }
            // disable reading form controls & buttons
            const readSite = document.getElementById('read_site');
            const readLevel = document.getElementById('read_level');
            const readTime = document.getElementById('read_time');
            if (readSite) readSite.disabled = true;
            if (readLevel) { readLevel.disabled = true; readLevel.value = ''; }
            if (readTime) { readTime.disabled = true; readTime.value = ''; }
            // disable add reading button(s)
            document.querySelectorAll('button').forEach(b => {
                const txt = (b.textContent || '').trim().toLowerCase();
                if (txt.includes('adicionar leitura') || (b.getAttribute('onclick') || '').includes('addReadingFromForm')) {
                    b.disabled = true;
                    b.style.opacity = '0.6';
                    b.title = 'Leituras desabilitadas';
                }
            });
        })();

        // focus site helper — handles empty lists safely
        function focusSite(id) {
            if (id === 'all') {
                const coords = Object.values(sites).map(s => s.coords);
                if (coords.length) map.fitBounds(coords, { padding: [40, 40] });
                return;
            }
            const s = sites[id];
            if (!s) return;
            map.setView(s.coords, 13, { animate: true });
            if (markers[id]) markers[id].openPopup();
        }

        // simulateAlert: guard for marker existence (no assumptions about pre-existing markers)
        function simulateAlert() {
            const now = new Date().toLocaleString();
            const ev = { time: now, place: '—', type: 'Nível alto', status: 'Novo' };
            const tbodyEl = document.getElementById('events_table');
            if (tbodyEl) {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td style="color:var(--white)">${ev.time}</td><td>${ev.place}</td><td>${ev.type}</td><td style="color:#ffb86b">${ev.status}</td>`;
                tbodyEl.prepend(tr);
            }
            const kpiAlertsEl = document.getElementById('kpi_alerts');
            const kpiIncidentsEl = document.getElementById('kpi_incidents');
            if (kpiAlertsEl) kpiAlertsEl.textContent = String(parseInt(kpiAlertsEl.textContent || '0', 10) + 1);
            if (kpiIncidentsEl) kpiIncidentsEl.textContent = String(parseInt(kpiIncidentsEl.textContent || '0', 10) + 1);

            // optional marker highlight
            if (markers['site2']) {
                markers['site2'].setStyle({ color: 'red', fillColor: 'red' });
                markers['site2'].openPopup();
            }
            updateTimestamp();
        }

        // atualizações periódicas simuladas (atualiza últimos valores)
        setInterval(() => {
            const newVal = (1200 + Math.round(Math.random() * 400));
            const kpiFlow = document.getElementById('kpi_flow');
            if (kpiFlow) kpiFlow.textContent = newVal.toLocaleString() + ' m³/s';
            const lvl = (70 + Math.round(Math.random() * 20));
            const kpiLevel = document.getElementById('kpi_level');
            if (kpiLevel) kpiLevel.textContent = lvl + '%';
        }, 12_000);

        // ---------- Controlled periodic readings (disabled) ----------
        if (window.autoReadIntervalId) {
            clearInterval(window.autoReadIntervalId);
            window.autoReadIntervalId = null;
        }
        window.autoReadIntervalId = null;
        function startPeriodicReadings() {
            console.log('Automatic periodic readings are disabled.');
            // no-op
        }
        function stopPeriodicReadings() {
            if (window.autoReadIntervalId) {
                clearInterval(window.autoReadIntervalId);
                window.autoReadIntervalId = null;
            }
        }
        function periodicReadings() { return; }
        // ---------- END OF CONTROLLED READINGS ----------

        // core helper: insert a reading programmatically (used by form and scheduler)
        // If SHOW_READINGS is false this function will not update charts or show readings.
        function insertReading(siteId, level, ts = new Date(), options = {}) {
            if (!SHOW_READINGS) {
                // still update model level and marker color silently, but do not show readings, charts or events
                if (sites[siteId]) sites[siteId].level = level;
                const color = level > 85 ? '#ff4b4b' : (level > 75 ? '#ffb86b' : '#10b981');
                if (markers[siteId]) {
                    markers[siteId].setStyle({ color: color, fillColor: color });
                    markers[siteId].bindPopup(`<strong>${sites[siteId].name}</strong><br>Nível: ${level}%`);
                }
                return;
            }

            // ensure charts exist and datasets match
            createChartsIfNeeded();
            syncDatasetsWithSites();

            const MAX_POINTS = 12;
            const label = (ts instanceof Date) ? ts.toLocaleTimeString() : (new Date(ts)).toLocaleTimeString();

            // push new time label and keep sliding window
            const labels = window.levelsChart.data.labels;
            labels.push(label);
            if (labels.length > MAX_POINTS) labels.shift();

            // update every dataset: push level for this site, repeat last value for others
            const siteName = sites[siteId] ? sites[siteId].name : null;
            window.levelsChart.data.datasets.forEach(ds => {
                if (ds.label === siteName) ds.data.push(level);
                else {
                    const last = ds.data.length ? ds.data[ds.data.length - 1] : 0;
                    ds.data.push(last);
                }
                if (ds.data.length > MAX_POINTS) ds.data.shift();
            });
            window.levelsChart.update();

            // alerts chart: record 1 if >85 else 0
            const isAlert = level > 85 ? 1 : 0;
            window.alertsChart.data.labels.push(label);
            window.alertsChart.data.datasets[0].data.push(isAlert);
            if (window.alertsChart.data.labels.length > MAX_POINTS) {
                window.alertsChart.data.labels.shift();
                window.alertsChart.data.datasets[0].data.shift();
            }
            window.alertsChart.update();

            // update data model and marker
            if (sites[siteId]) sites[siteId].level = level;
            const color = level > 85 ? '#ff4b4b' : (level > 75 ? '#ffb86b' : '#10b981');
            if (markers[siteId]) {
                markers[siteId].setStyle({ color: color, fillColor: color });
                markers[siteId].bindPopup(`<strong>${sites[siteId].name}</strong><br>Nível: ${level}%`);
            }

            // add event row unless silent (only if readings visible)
            if (SHOW_READINGS && !options.silent) {
                const tbodyEl = document.getElementById('events_table');
                const tr = document.createElement('tr');
                tr.innerHTML = `<td style="color:var(--white)">${(ts instanceof Date ? ts : new Date(ts)).toLocaleString()}</td><td>${sites[siteId] ? sites[siteId].name : '—'}</td><td>Leitura</td><td style="color:${isAlert ? '#ff4b4b' : '#10b981'}">${isAlert ? 'Alerta' : 'OK'}</td>`;
                if (tbodyEl) tbodyEl.prepend(tr);
            }

            // update KPI count for alerts only when readings shown
            if (SHOW_READINGS && isAlert) {
                const el = document.getElementById('kpi_alerts');
                if (el) el.textContent = String(parseInt(el.textContent || '0', 10) + 1);
            }

            updateTimestamp();
        }
        
        /* Safety: define helpers only if they don't already exist to avoid duplication errors */
        if (typeof createChartsIfNeeded === 'undefined') {
            function createChartsIfNeeded() {
                // guard DOM
                const levelsCanvas = document.getElementById('chartLevels');
                const alertsCanvas = document.getElementById('chartAlerts');
                if (!levelsCanvas || !alertsCanvas) return;

                // create levels chart if missing
                if (typeof window.levelsChart === 'undefined') {
                    const ctx = levelsCanvas.getContext('2d');
                    window.levelsChart = new Chart(ctx, {
                        type: 'line',
                        data: { labels: [], datasets: [] },
                        options: {
                            maintainAspectRatio: false,
                            plugins: { legend: { labels: { color: 'rgba(255,255,255,0.85)' } } },
                            scales: {
                                x: { ticks: { color: 'rgba(255,255,255,0.6)' } },
                                y: { ticks: { color: 'rgba(255,255,255,0.6)' }, beginAtZero: true, suggestedMax: 100 }
                            },
                            animation: { duration: 260 }
                        }
                    });
                }

                // create alerts chart if missing
                if (typeof window.alertsChart === 'undefined') {
                    const ctxA = alertsCanvas.getContext('2d');
                    window.alertsChart = new Chart(ctxA, {
                        type: 'bar',
                        data: { labels: [], datasets: [{ label: 'Alertas', data: [], backgroundColor: 'rgba(255,99,71,0.9)' }] },
                        options: {
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: {
                                x: { ticks: { color: 'rgba(255,255,255,0.6)' } },
                                y: { ticks: { color: 'rgba(255,255,255,0.6)' }, beginAtZero: true, suggestedMax: 3 }
                            },
                            animation: { duration: 260 }
                        }
                    });
                }
            }
        }

        if (typeof syncDatasetsWithSites === 'undefined') {
            function syncDatasetsWithSites() {
                createChartsIfNeeded();
                if (!window.levelsChart) return;
                const MAX_POINTS = 12;
                const labels = window.levelsChart.data.labels;
                const palette = ['#f97316', '#10b981', '#a78bfa', '#60a5fa', '#ef4444', '#f43f5e'];
                const existing = window.levelsChart.data.datasets.map(d => d.label);

                // add missing datasets
                Object.keys(sites).forEach((id) => {
                    const name = sites[id].name;
                    if (!existing.includes(name)) {
                        const arr = labels.map(() => 0);
                        if (labels.length) arr[arr.length - 1] = sites[id].level || 0;
                        const colorPick = palette[window.levelsChart.data.datasets.length % palette.length];
                        window.levelsChart.data.datasets.push({
                            label: name,
                            data: arr,
                            borderColor: colorPick,
                            backgroundColor: hexToRgba(colorPick, 0.06),
                            tension: 0.3,
                            pointRadius: 3
                        });
                    }
                });

                // remove datasets for deleted sites
                window.levelsChart.data.datasets = window.levelsChart.data.datasets.filter(ds => {
                    return Object.values(sites).some(s => s.name === ds.label);
                });

                // ensure dataset lengths match labels
                window.levelsChart.data.datasets.forEach(ds => {
                    while (ds.data.length < labels.length) ds.data.unshift(0);
                    while (ds.data.length > labels.length) ds.data.shift();
                    if (ds.data.length > MAX_POINTS) ds.data = ds.data.slice(-MAX_POINTS);
                });

                window.levelsChart.update();
            }
        }

        /* Clear form helpers (ensure exist) */
        if (typeof clearSiteForm === 'undefined') {
            function clearSiteForm() {
                const ids = ['new_name', 'new_lat', 'new_lng', 'new_level'];
                ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
                const first = document.getElementById('new_name');
                if (first) first.focus();
            }
        }

        if (typeof clearReadingForm === 'undefined') {
            function clearReadingForm() {
                const readSel = document.getElementById('read_site');
                if (readSel) readSel.value = '';
                ['read_level', 'read_time'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
            }
        }

        /* Ensure updateSiteSelectors exists and updates both selects and charts */
        if (typeof updateSiteSelectors === 'undefined') {
            function updateSiteSelectors() {
                const select = document.getElementById('select_site');
                const readSel = document.getElementById('read_site');
                if (!select || !readSel) return;
                // preserve currently selected values when possible
                const prevSel = select.value;
                const prevRead = readSel.value;

                select.innerHTML = '<option value="all">Todos os pontos</option>';
                readSel.innerHTML = '<option value="">Escolha um ponto</option>';

                Object.keys(sites).forEach(id => {
                    const opt = document.createElement('option');
                    opt.value = id; opt.textContent = sites[id].name;
                    select.appendChild(opt);
                    const opt2 = opt.cloneNode(true);
                    readSel.appendChild(opt2);
                });

                // restore if still valid
                if (prevSel && Array.from(select.options).some(o => o.value === prevSel)) select.value = prevSel;
                if (prevRead && Array.from(readSel.options).some(o => o.value === prevRead)) readSel.value = prevRead;

                // ensure charts exist and datasets sync
                createChartsIfNeeded();
                syncDatasetsWithSites();
            }
        }

        /* Make sure addSiteFromForm inserts dataset + updates selectors and charts */
        if (typeof addSiteFromForm === 'undefined') {
            function addSiteFromForm() {
                const name = document.getElementById('new_name').value.trim();
                const latRaw = document.getElementById('new_lat').value.trim();
                const lngRaw = document.getElementById('new_lng').value.trim();
                const levelRaw = document.getElementById('new_level').value.trim();
                const lat = parseFloat(latRaw.replace(',', '.'));
                const lng = parseFloat(lngRaw.replace(',', '.'));
                const level = Number(levelRaw);

                if (!name) { alert('Nome é obrigatório.'); return; }
                if (isNaN(lat) || lat < -90 || lat > 90) { alert('Latitude inválida.'); return; }
                if (isNaN(lng) || lng < -180 || lng > 180) { alert('Longitude inválida.'); return; }
                if (isNaN(level) || level < 0 || level > 9999) { alert('Nível inválido.'); return; }

                const id = 'site' + Date.now();
                sites[id] = { name, coords: [lat, lng], level };

                const color = level > 85 ? '#ff4b4b' : (level > 75 ? '#ffb86b' : '#10b981');
                const marker = L.circleMarker([lat, lng], { radius: 10, color, fillColor: color, fillOpacity: 0.9, weight: 1.5 })
                    .addTo(map)
                    .bindPopup(`<strong>${name}</strong><br>Nível: ${level}%`);
                markers[id] = marker;

                // update selectors and charts
                updateSiteSelectors();

                // immediately select the newly added site in the read selector
                const readSel = document.getElementById('read_site');
                const selectAll = document.getElementById('select_site');
                if (readSel) { readSel.value = id; readSel.dispatchEvent(new Event('change', { bubbles: true })); }
                if (selectAll) { selectAll.value = id; selectAll.dispatchEvent(new Event('change', { bubbles: true })); }

                // add dataset if charts exist
                createChartsIfNeeded();
                syncDatasetsWithSites();

                // add event row
                const tbody = document.getElementById('events_table');
                const tr = document.createElement('tr');
                tr.innerHTML = `<td style="color:var(--white)">${new Date().toLocaleString()}</td><td>${name}</td><td>Cadastro</td><td style="color:#10b981">Criado</td>`;
                tbody.prepend(tr);

                map.setView([lat, lng], 12, { animate: true });
                marker.openPopup();
                // automatic periodic readings are disabled (charts remain static until user adds leituras manualmente)
                clearSiteForm();
            }
        }

        /* Ensure addReadingFromForm uses insertReading helper (exists earlier). If not, create fallback */
        if (typeof addReadingFromForm === 'undefined') {
            function addReadingFromForm() {
                const siteId = document.getElementById('read_site').value;
                const level = Number(document.getElementById('read_level').value);
                const timeInput = document.getElementById('read_time').value.trim();
                if (!siteId || isNaN(level)) { alert('Escolha um ponto e informe um nível válido.'); return; }
                const ts = timeInput ? new Date(timeInput) : new Date();
                if (isNaN(ts)) { alert('Timestamp inválido.'); return; }
                if (typeof insertReading === 'function') {
                    insertReading(siteId, level, ts, { silent: false });
                } else {
                    // minimal fallback: push into charts directly
                    createChartsIfNeeded();
                    syncDatasetsWithSites();
                    insertReading(siteId, level, ts, { silent: false });
                }
                clearReadingForm();
            }
        }

        /* Ensure all top-level buttons have handlers (attach safe listeners) */
        document.addEventListener('DOMContentLoaded', () => {
            // nav already uses inline onclick, but ensure keyboard-friendly activation
            document.querySelectorAll('.nav button').forEach(b => {
                b.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') b.click(); });
            });

            // hook primary form buttons if inline handlers are missing
            const addSiteBtn = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent && btn.textContent.replace(/\s+/g, '').includes('Adicionarponto'));
            if (!addSiteBtn) {
                const fallback = document.querySelector('button[onclick*="addSiteFromForm"]');
                if (fallback) fallback.addEventListener('click', addSiteFromForm);
            }

            const addReadBtn = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent && btn.textContent.replace(/\s+/g, '').includes('Adicionarleitura'));
            if (!addReadBtn) {
                const fallback = document.querySelector('button[onclick*="addReadingFromForm"]');
                if (fallback) fallback.addEventListener('click', addReadingFromForm);
            }

            // Cancel / clear buttons
            document.querySelectorAll('button').forEach(btn => {
                if (btn.textContent && btn.textContent.trim().toLowerCase().includes('limpar')) {
                    btn.addEventListener('click', () => {
                        // try both forms
                        clearSiteForm();
                        clearReadingForm();
                    });
                }
                if (btn.textContent && btn.textContent.trim().toLowerCase().includes('cancelar')) {
                    btn.addEventListener('click', () => { location.href = '../Login.html'});
                }
            });

            // ensure select_site change focuses site
            const sel = document.getElementById('select_site');
            if (sel) sel.addEventListener('change', (e) => { focusSite(e.target.value); });

            // ensure simulate alert button exists and wired
            const simBtn = Array.from(document.querySelectorAll('button')).find(b => /Simular\s*Alerta/i.test(b.textContent || ''));
            if (simBtn) simBtn.addEventListener('click', simulateAlert);

            // initialize charts and selectors now that DOM is ready
            createChartsIfNeeded();
            updateSiteSelectors();
        });