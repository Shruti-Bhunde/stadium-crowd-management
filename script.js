document.addEventListener('DOMContentLoaded', () => {
    const svgWrapper = document.getElementById('stadium-svg-wrapper');
    const simButtons = document.querySelectorAll('.btn-sim');
    const navItems = document.querySelectorAll('.nav-item');
    const alertsFeed = document.getElementById('alerts-feed');
    const notifTrigger = document.getElementById('notif-trigger');
    const notifDropdown = document.getElementById('notif-dropdown');
    const dashboardTitle = document.querySelector('.card-header h3');
    
    // KPI Elements
    const occupancyEl = document.getElementById('total-occupancy');
    const queueTimeEl = document.getElementById('avg-queue-time');
    const gateFlowEl = document.getElementById('gate-flow');
    const alertCountEl = document.getElementById('alert-count');
    const kpiLabels = document.querySelectorAll('.kpi-label');

    let currentTab = 'tab-dashboard';
    let currentMode = 'mode-normal';

    // Stadium Sectors Configuration (Symmetrical Annulus Segments)
    const centerX = 250, centerY = 250, outerR = 200, innerR = 160;
    
    const getPath = (startAngle, endAngle) => {
        const startOuter = { 
            x: centerX + outerR * Math.cos(startAngle * Math.PI / 180), 
            y: centerY + outerR * Math.sin(startAngle * Math.PI / 180) 
        };
        const endOuter = { 
            x: centerX + outerR * Math.cos(endAngle * Math.PI / 180), 
            y: centerY + outerR * Math.sin(endAngle * Math.PI / 180) 
        };
        const startInner = { 
            x: centerX + innerR * Math.cos(startAngle * Math.PI / 180), 
            y: centerY + innerR * Math.sin(startAngle * Math.PI / 180) 
        };
        const endInner = { 
            x: centerX + innerR * Math.cos(endAngle * Math.PI / 180), 
            y: centerY + innerR * Math.sin(endAngle * Math.PI / 180) 
        };
        
        return `M ${startOuter.x} ${startOuter.y} 
                A ${outerR} ${outerR} 0 0 1 ${endOuter.x} ${endOuter.y} 
                L ${endInner.x} ${endInner.y} 
                A ${innerR} ${innerR} 0 0 0 ${startInner.x} ${startInner.y} Z`;
    };

    const sectors = [
        { id: 'north-stand', name: 'N Stand', path: getPath(230, 310) },
        { id: 'east-stand', name: 'E Stand', path: getPath(320, 40) },
        { id: 'south-stand', name: 'S Stand', path: getPath(50, 130) },
        { id: 'west-stand', name: 'W Stand', path: getPath(140, 220) }
    ];

    const generateStadium = () => {
        const svg = `
            <svg viewBox="0 0 500 500" width="100%" height="100%" style="max-width: 500px">
                <!-- Layers -->
                <g id="base-layer">
                    <circle cx="250" cy="250" r="210" fill="#f8f9fa" stroke="#e4e6eb" stroke-width="2" />
                    <circle cx="250" cy="250" r="100" fill="#a5d6a7" stroke="#2e7d32" stroke-width="3" />
                    <rect x="235" y="220" width="30" height="60" fill="#f1d4af" />
                    ${sectors.map(s => `<path id="${s.id}" d="${s.path}" class="stadium-sector" fill="#e8f5e9" stroke="#fff" stroke-width="2" />`).join('')}
                </g>

                <g id="concessions-layer" class="map-layer" style="display: none">
                    <circle cx="150" cy="80" r="8" fill="#f9a825" stroke="white" stroke-width="2" />
                    <circle cx="350" cy="80" r="8" fill="#f9a825" stroke="white" stroke-width="2" />
                    <circle cx="430" cy="300" r="8" fill="#f9a825" stroke="white" stroke-width="2" />
                    <circle cx="70" cy="300" r="8" fill="#f9a825" stroke="white" stroke-width="2" />
                </g>

                <g id="security-layer" class="map-layer" style="display: none">
                    <!-- High-priority Alert Pin (SOS) -->
                    <path d="M 185 55 L 195 55 L 190 85 Z" fill="#d32f2f" />
                    <circle cx="190" cy="92" r="3" fill="#d32f2f" />
                    <circle cx="250" cy="30" r="5" fill="#d32f2f" />
                    <circle cx="470" cy="250" r="5" fill="#d32f2f" />
                    <circle cx="250" cy="470" r="5" fill="#d32f2f" />
                    <circle cx="30" cy="250" r="5" fill="#d32f2f" />
                </g>

                <g id="flow-layer" class="map-layer" style="display: none">
                    <line x1="250" y1="50" x2="250" y2="90" stroke="#1565c0" stroke-width="3" marker-end="url(#arrow)" />
                    <line x1="450" y1="250" x2="410" y2="250" stroke="#1565c0" stroke-width="3" marker-end="url(#arrow)" />
                    <line x1="250" y1="450" x2="250" y2="410" stroke="#1565c0" stroke-width="3" marker-end="url(#arrow)" />
                    <line x1="50" y1="250" x2="90" y2="250" stroke="#1565c0" stroke-width="3" marker-end="url(#arrow)" />
                    <defs>
                        <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <path d="M 0 0 L 10 5 L 0 10 z" fill="#1565c0" />
                        </marker>
                    </defs>
                </g>
            </svg>
        `;
        svgWrapper.innerHTML = svg;
    };

    const updateView = (tabId) => {
        currentTab = tabId;
        navItems.forEach(item => item.classList.toggle('active', item.id === tabId));
        
        // Hide all layers first
        document.querySelectorAll('.map-layer').forEach(layer => layer.style.display = 'none');
        
        const views = {
            'tab-dashboard': { title: 'Live Stadium Heatmap', labels: ['Occupancy', 'Avg Queue', 'Gate Traffic', 'Alert Zones'] },
            'tab-heatmaps': { title: 'Relative Crowd Density', labels: ['Density Index', 'Peak Load', 'Flow Rate', 'Hotspots'] },
            'tab-flow': { title: 'Pedestrian Flow Direction', labels: ['Ingress', 'Egress', 'Cross-Flow', 'Bottlenecks'], layer: 'flow-layer' },
            'tab-concessions': { title: 'Food & Beverage Wait Times', labels: ['Active Stalls', 'Peak Queue', 'Sales Vol', 'Avg Serving'], layer: 'concessions-layer' },
            'tab-security': { title: 'Security & Surveillance', labels: ['Personnel', 'Incidents', 'Response T', 'SOS Alerts'], layer: 'security-layer' }
        };

        const config = views[tabId];
        dashboardTitle.innerText = config.title;
        if (config.layer) document.getElementById(config.layer).style.display = 'block';

        // Update KPI labels contextually
        kpiLabels.forEach((label, i) => {
            if (config.labels[i]) label.innerText = config.labels[i];
        });

        updateSimulation(currentMode);
    };

    const updateSimulation = (modeId) => {
        currentMode = modeId;
        const states = {
            'mode-normal': { occ: 42500, queue: '4m 20s', flow: '120 p/min', alerts: 0, colors: ['#e8f5e9', '#e8f5e9', '#e8f5e9', '#e8f5e9'] },
            'mode-break': { occ: 48000, queue: '12m 45s', flow: '450 p/min', alerts: 2, colors: ['#fff9c4', '#fff9c4', '#ffcdd2', '#fff9c4'] },
            'mode-egress': { occ: 36000, queue: '1m 10s', flow: '950 p/min', alerts: 1, colors: ['#bbdefb', '#ffcdd2', '#bbdefb', '#bbdefb'] }
        };

        const s = states[modeId];
        occupancyEl.innerText = s.occ.toLocaleString();
        queueTimeEl.innerText = s.queue;
        gateFlowEl.innerText = s.flow;
        alertCountEl.innerText = s.alerts;

        sectors.forEach((sector, i) => {
            const el = document.getElementById(sector.id);
            if (el) el.setAttribute('fill', s.colors[i]);
        });
    };

    // Event Listeners
    navItems.forEach(item => item.addEventListener('click', (e) => { e.preventDefault(); updateView(item.id); }));
    simButtons.forEach(btn => btn.addEventListener('click', () => { 
        simButtons.forEach(b => b.classList.remove('active')); btn.classList.add('active'); updateSimulation(btn.id); 
    }));
    
    notifTrigger.addEventListener('click', (e) => { e.stopPropagation(); notifDropdown.classList.toggle('active'); });
    document.addEventListener('click', () => notifDropdown.classList.remove('active'));

    // Initialize
    generateStadium();
    updateView('tab-dashboard');
});
