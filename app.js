// ==========================================================================
// Database & App State
// ==========================================================================

// Initialize Local Database directly in the browser via Dexie.js
const db = new Dexie("EcoTrackDB");
db.version(1).stores({
    users: '++id, email', // auto-incrementing ID, indexed by email
    tracking_logs: '++id, user_id, date, timestamp' // indexed for dashboard filtering
});

const state = {
    currentView: 'landing', // 'landing', 'questionnaire', 'results'
    currentQuestionIndex: 0,
    answers: {},
    answerCategories: {},
    user: null // Holds the currently DB-authenticated user object
};

const questions = [
    {
        id: 'q1',
        category: 'transportation',
        title: 'How do you primarily navigate the world?',
        description: 'Select your primary mode of daily transit. This insight allows us to sculpt a precise portrait of your ecological footprint.',
        options: [
            { id: 'bike', label: 'Walk / Bike', icon: 'bike', impact: 0, desc: 'Elegant, carbon-neutral mobility powered by human vitality.' },
            { id: 'car', label: 'Gasoline Car', icon: 'car', impact: 2000, desc: 'The traditional combustion narrative of modern travel.' },
            { id: 'diesel', label: 'Diesel Car', icon: 'fuel', impact: 2200, desc: 'Long-range efficiency for extensive geographical reach.' },
            { id: 'ev', label: 'Electric Car', icon: 'zap', impact: 800, desc: 'Purely digital propulsion powered by renewable energy potential.', recommended: true },
            { id: 'hybrid', label: 'Hybrid Car', icon: 'battery-charging', impact: 1200, desc: 'Sophisticated duality of electric silence and range stability.' },
            { id: 'motorcycle', label: 'Motorcycle', icon: 'bike', impact: 900, desc: 'Streamlined individual transit for agile urban movement.' }
        ],
        showCadence: true
    },
    {
        id: 'q2',
        category: 'diet',
        title: 'What orchestrates your dietary profile?',
        description: 'The narrative of our plates deeply impacts global emissions. Select your primary culinary philosophy.',
        options: [
            { id: 'meat-heavy', label: 'Meat Heavy', icon: 'drumstick', impact: 2500, desc: 'A rich traditional palette frequently featuring animal proteins.' },
            { id: 'balanced', label: 'Balanced Omnivore', icon: 'utensils', impact: 1500, desc: 'A mindful equilibrium of plant and animal sources.' },
            { id: 'vegetarian', label: 'Vegetarian', icon: 'leaf', impact: 800, desc: 'A compassionate approach avoiding meat, utilizing dairy.' },
            { id: 'vegan', label: 'Plant-Based / Vegan', icon: 'carrot', impact: 400, desc: 'A strictly botanical philosophy minimizing direct animal impact.', recommended: true }
        ],
        showCadence: false
    },
    {
        id: 'q3',
        category: 'energy',
        title: 'How is your sanctuary energized?',
        description: 'Residential power flows constitute a substantial portion of your footprint. What illuminates your home?',
        options: [
            { id: 'grid-coal', label: 'Standard Grid', icon: 'plug', impact: 3000, desc: 'The default infrastructural flow, often reliant on fossil fuels.' },
            { id: 'mixed', label: 'Mixed Hybrid', icon: 'factory', impact: 1800, desc: 'A standard utility mix offset by some efficient practices.' },
            { id: 'renewable', label: '100% Renewable', icon: 'sun', impact: 200, desc: 'Powered entirely by wind, solar, or verified green infrastructure.', recommended: true }
        ],
        showCadence: false
    },
    {
        id: 'q4',
        category: 'shopping',
        title: 'What is your consumption cadence?',
        description: 'The lifecycle of material goods requires immense energy. How often do you acquire new items?',
        options: [
            { id: 'frequent', label: 'High Frequency', icon: 'shopping-bag', impact: 2500, desc: 'Regular acquisition of fast fashion and new technologies.' },
            { id: 'average', label: 'Moderate', icon: 'package', impact: 1200, desc: 'Occasional, necessary purchases interspersed over time.' },
            { id: 'sustainable', label: 'Minimal / Circular', icon: 'recycle', impact: 400, desc: 'Prioritizing longevity, second-hand, and ethical creation.', recommended: true }
        ],
        showCadence: false
    },
    {
        id: 'q5',
        category: 'travel',
        title: 'How expansive is your air travel?',
        description: 'Aviation creates significant high-altitude emissions. What is your annual flight frequency?',
        options: [
            { id: 'frequent', label: 'Extensive (3+ flights)', icon: 'plane-takeoff', impact: 4500, desc: 'Frequent global traversal for business or broad exploration.' },
            { id: 'occasional', label: 'Moderate (1-2 flights)', icon: 'plane', impact: 1500, desc: 'Occasional journeys or annual extended vacations.' },
            { id: 'rare', label: 'Minimal / Local', icon: 'map-pin', impact: 200, desc: 'Primarily terrestrial movement focused within regional borders.', recommended: true }
        ],
        showCadence: false
    }
];

// ==========================================================================
// Core Render Logic & Routing
// ==========================================================================

const DOM = {
    main: document.getElementById('main-content')
};

function saveState() {
    localStorage.setItem('ecoTrackState', JSON.stringify(state));
    if (state.user && state.user.id) {
        db.users.put(state.user).catch(err => {
            console.error('User DB sync error:', err);
        });
    }
}

function loadState() {
    const saved = localStorage.getItem('ecoTrackState');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            state.user = parsed.user || null;
            state.answers = parsed.answers || {};
            state.answerCategories = parsed.answerCategories || {};
        } catch (e) {
            console.error('Failed to load state', e);
        }
    }
}

async function hydrateUserFromDb() {
    if (!state.user) return;

    try {
        let dbUser = null;

        if (state.user.id) {
            dbUser = await db.users.get(state.user.id);
        } else if (state.user.email) {
            dbUser = await db.users.where('email').equalsIgnoreCase(state.user.email).first();
        }

        if (dbUser) {
            state.user = { ...dbUser, ...state.user };
            saveState();
        }
    } catch (e) {
        console.error('Failed to hydrate user from DB', e);
    }
}

async function init() {
    loadState();
    await hydrateUserFromDb();
    initThemePreference();
    setupGlobalListeners();
    handleRoute();
}

function setupGlobalListeners() {
    window.addEventListener('hashchange', handleRoute);
    setupCursorGlow();
    setupThemeToggle();

    const signinBtn = document.getElementById('signin-nav-btn');
    if (signinBtn) {
        signinBtn.addEventListener('click', openAuthModal);
    }

    const signoutBtn = document.getElementById('signout-nav-btn');
    if (signoutBtn) {
        signoutBtn.addEventListener('click', () => {
            state.user = null;
            saveState();
            updateAuthUI();
            if (state.currentView !== 'landing') {
                window.location.hash = '#landing';
            } else {
                renderView(); // force re-render if already on landing
            }
        });
    }

    // Initial UI check
    updateAuthUI();

    // Setup AI Chatbot
    setupChatbot();
}

function getStoredTheme() {
    return localStorage.getItem('ecoTrackTheme');
}

function resolvePreferredTheme() {
    if (state.user && state.user.theme) return state.user.theme;
    const stored = getStoredTheme();
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function updateThemeToggleUI(theme) {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;
    const isDark = theme === 'dark';
    toggle.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    toggle.setAttribute('aria-label', isDark ? 'Activate light mode' : 'Activate dark mode');
    const icon = toggle.querySelector('.theme-toggle-icon');
    if (icon) {
        icon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
    }
    toggle.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }
}

function applyTheme(theme, { persist = true } = {}) {
    const normalized = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', normalized);
    updateThemeToggleUI(normalized);

    if (!persist) return;

    localStorage.setItem('ecoTrackTheme', normalized);
    if (state.user) {
        state.user.theme = normalized;
        saveState();
    }
}

function initThemePreference() {
    const preferred = resolvePreferredTheme();
    applyTheme(preferred, { persist: false });

    if (state.user && !state.user.theme) {
        state.user.theme = preferred;
        saveState();
    }
}

function setupThemeToggle() {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    updateThemeToggleUI(resolvePreferredTheme());

    toggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
    });
}

function setupCursorGlow() {
    const root = document.documentElement;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let targetX = window.innerWidth * 0.5;
    let targetY = window.innerHeight * 0.35;
    let currentX = targetX;
    let currentY = targetY;
    let lastTime = performance.now();

    root.style.setProperty('--glow-x', `${targetX}px`);
    root.style.setProperty('--glow-y', `${targetY}px`);

    const handleMove = (point) => {
        targetX = point.clientX;
        targetY = point.clientY;
        if (prefersReducedMotion) {
            root.style.setProperty('--glow-opacity', '0.25');
        }
    };

    window.addEventListener('mousemove', (e) => handleMove(e), { passive: true });
    window.addEventListener('touchmove', (e) => {
        if (e.touches && e.touches[0]) handleMove(e.touches[0]);
    }, { passive: true });

    window.addEventListener('mouseleave', () => {
        root.style.setProperty('--glow-opacity', '0.2');
    });

    window.addEventListener('blur', () => {
        root.style.setProperty('--glow-opacity', '0.15');
    });

    if (prefersReducedMotion) return;

    const minSize = 260;
    const maxSize = 520;

    const update = (time) => {
        const dt = Math.max(16, time - lastTime);
        lastTime = time;

        const dx = targetX - currentX;
        const dy = targetY - currentY;
        currentX += dx * 0.12;
        currentY += dy * 0.12;

        const dist = Math.hypot(dx, dy);
        const speed = Math.min(1, (dist / dt) * 0.4);
        const size = maxSize - (maxSize - minSize) * speed;
        const opacity = 0.35 + speed * 0.45;

        root.style.setProperty('--glow-x', `${currentX.toFixed(1)}px`);
        root.style.setProperty('--glow-y', `${currentY.toFixed(1)}px`);
        root.style.setProperty('--glow-size', `${size.toFixed(0)}px`);
        root.style.setProperty('--glow-opacity', opacity.toFixed(2));

        requestAnimationFrame(update);
    };

    requestAnimationFrame(update);
}

function handleRoute() {
    const hash = window.location.hash.slice(1) || 'landing';

    // Simple navigation update
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + hash) {
            link.classList.add('active');
        }
    });

    if (['landing', 'questionnaire', 'results', 'solutions', 'about', 'profile'].includes(hash)) {
        state.currentView = hash;
    } else {
        state.currentView = 'landing';
        window.location.hash = '#landing';
    }

    renderView();
}

function resetState() {
    state.currentQuestionIndex = 0;
    state.answers = {};
    state.answerCategories = {};
}

function renderView() {
    DOM.main.innerHTML = '';

    switch (state.currentView) {
        case 'landing':
            if (state.user) {
                DOM.main.appendChild(createDashboardView());
            } else {
                DOM.main.appendChild(createLandingView());
            }
            break;
        case 'questionnaire':
            DOM.main.appendChild(createQuestionnaireView());
            break;
        case 'results':
            DOM.main.appendChild(createResultsView());
            break;
        case 'solutions':
            DOM.main.appendChild(createSolutionsView());
            break;
        case 'about':
            DOM.main.appendChild(createAboutView());
            break;
        case 'profile':
            if (!state.user) {
                window.location.hash = '#landing';
            } else {
                DOM.main.appendChild(createProfileView());
            }
            break;
    }

    lucide.createIcons();
}

// ==========================================================================
// Views
// ==========================================================================

function createSolutionsView() {
    const container = document.createElement('div');
    container.innerHTML = `
        <div style="max-width: 1100px; margin: 4rem auto; padding: 2rem;">
            
            <div style="text-align: center; margin-bottom: 3rem;">
                <h2 style="font-size: 2.8rem; color: var(--accent-primary); margin-bottom: 1rem;">UN Climate Solutions</h2>
                <p style="font-size: 1.2rem; color: var(--text-secondary); max-width: 700px; margin: 0 auto; line-height: 1.6;">
                    Everyone can help limit climate change. From the way we travel, to the electricity we use and the food we eat, we can make a difference. Start with these targeted global actions.
                </p>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
                
                <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 1.5rem; transition: transform 0.3s, box-shadow 0.3s; cursor: default;" onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='var(--shadow-md)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                    <i data-lucide="home" style="color: var(--accent-primary); width: 32px; height: 32px; margin-bottom: 1rem;"></i>
                    <h3 style="font-size: 1.2rem; margin-bottom: 0.5rem; color: var(--text-primary);">Save energy at home</h3>
                    <p style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.5;">Much of our electricity and heat are powered by coal, oil and gas. Use less energy by lowering your heating and cooling, switching to LED light bulbs and energy-efficient electric appliances.</p>
                </div>

                <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 1.5rem; transition: transform 0.3s, box-shadow 0.3s; cursor: default;" onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='var(--shadow-md)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                    <i data-lucide="bike" style="color: var(--accent-primary); width: 32px; height: 32px; margin-bottom: 1rem;"></i>
                    <h3 style="font-size: 1.2rem; margin-bottom: 0.5rem; color: var(--text-primary);">Walk, bike, or take transit</h3>
                    <p style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.5;">The world’s roads are clogged with vehicles, most of them burning fossil fuels. Walking or riding a bike instead of driving will reduce greenhouse gas emissions immediately.</p>
                </div>

                <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 1.5rem; transition: transform 0.3s, box-shadow 0.3s; cursor: default;" onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='var(--shadow-md)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                    <i data-lucide="salad" style="color: var(--accent-primary); width: 32px; height: 32px; margin-bottom: 1rem;"></i>
                    <h3 style="font-size: 1.2rem; margin-bottom: 0.5rem; color: var(--text-primary);">Eat more vegetables</h3>
                    <p style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.5;">Eating more plant-based meals – vegetables, fruits, whole grains, legumes, nuts and seeds – and less meat and dairy, can significantly lower your environmental impact.</p>
                </div>

                <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 1.5rem; transition: transform 0.3s, box-shadow 0.3s; cursor: default;" onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='var(--shadow-md)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                    <i data-lucide="plane" style="color: var(--accent-primary); width: 32px; height: 32px; margin-bottom: 1rem;"></i>
                    <h3 style="font-size: 1.2rem; margin-bottom: 0.5rem; color: var(--text-primary);">Consider your travel</h3>
                    <p style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.5;">Airplanes emit large amounts of greenhouse gases, producing significant climate change impacts. Traveling virtually or choosing localized journeys is a fast reduction strategy.</p>
                </div>

                <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 1.5rem; transition: transform 0.3s, box-shadow 0.3s; cursor: default;" onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='var(--shadow-md)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                    <i data-lucide="trash-2" style="color: var(--accent-primary); width: 32px; height: 32px; margin-bottom: 1rem;"></i>
                    <h3 style="font-size: 1.2rem; margin-bottom: 0.5rem; color: var(--text-primary);">Throw away less food</h3>
                    <p style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.5;">When you throw food away, you're also wasting the resources and energy that were used to grow, produce, package, and transport it.</p>
                </div>

                <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 1.5rem; transition: transform 0.3s, box-shadow 0.3s; cursor: default;" onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='var(--shadow-md)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                    <i data-lucide="refresh-cw" style="color: var(--accent-primary); width: 32px; height: 32px; margin-bottom: 1rem;"></i>
                    <h3 style="font-size: 1.2rem; margin-bottom: 0.5rem; color: var(--text-primary);">Reduce, reuse, recycle</h3>
                    <p style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.5;">Electronics, clothes and other items we buy cause carbon emissions at each point in production, from the extraction of raw materials to manufacturing.</p>
                </div>
                
                <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 1.5rem; transition: transform 0.3s, box-shadow 0.3s; cursor: default;" onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='var(--shadow-md)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                    <i data-lucide="sun" style="color: var(--accent-primary); width: 32px; height: 32px; margin-bottom: 1rem;"></i>
                    <h3 style="font-size: 1.2rem; margin-bottom: 0.5rem; color: var(--text-primary);">Green energy sources</h3>
                    <p style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.5;">If possible, see if you can switch your home grid to renewable sources such as wind or solar. Alternatively, install localized solar panels to decrease grid reliance.</p>
                </div>

                <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 1.5rem; transition: transform 0.3s, box-shadow 0.3s; cursor: default;" onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='var(--shadow-md)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                    <i data-lucide="zap" style="color: var(--accent-primary); width: 32px; height: 32px; margin-bottom: 1rem;"></i>
                    <h3 style="font-size: 1.2rem; margin-bottom: 0.5rem; color: var(--text-primary);">Electric transportation</h3>
                    <p style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.5;">If you plan to buy a car, consider going electric. In many countries, electric cars help reduce air pollution and cause drastically fewer greenhouse gas emissions.</p>
                </div>

            </div>
            
            <div style="text-align:center; margin-top:4rem;">
                <a href="https://www.un.org/en/climatechange/climate-solutions" target="_blank" style="color: var(--accent-primary); text-decoration: none; font-weight: 600; font-size: 1.1rem; display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.8rem 1.5rem; border: 2px solid var(--accent-primary); border-radius: var(--radius-full); transition: all 0.3s;" onmouseover="this.style.background='var(--accent-primary)'; this.style.color='#fff';" onmouseout="this.style.background='transparent'; this.style.color='var(--accent-primary)';">
                    Read the official UN Report <i data-lucide="external-link" style="width:18px;"></i>
                </a>
            </div>

        </div>
    `;
    setTimeout(() => lucide.createIcons(), 0);
    return container;
}

function createAboutView() {
    const container = document.createElement('div');
    container.innerHTML = `
        <div style="max-width: 800px; margin: 4rem auto; padding: 3rem; background: var(--bg-secondary); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); text-align: left;">
            
            <div style="text-align: center; margin-bottom: 2rem;">
                <h2 style="font-size: 2.5rem; color: var(--text-primary);">🌍 About Us</h2>
            </div>
            
            <p style="font-size: 1.15rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 2rem; text-align: center;">
                Welcome to our <strong>Personal Carbon Footprint Assessment & Reduction Assistant</strong> 🌱💡 — a smart web-based platform designed to help individuals <strong>understand, measure, and reduce</strong> their environmental impact.
            </p>
            
            <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 2rem;">
                Our website calculates carbon emissions generated from daily activities such as 🚗 <strong>transportation</strong>, ⚡ <strong>energy consumption</strong>, 🥗 <strong>diet</strong>, 🛒 <strong>shopping</strong>, and ✈️ <strong>travel</strong>. With just a few inputs, users can discover how their lifestyle affects the planet 🌎.
            </p>

            <hr style="border: 0; border-top: 1px solid var(--border-subtle); margin: 2rem 0;">

            <h3 style="margin-bottom: 1rem; color: var(--text-primary);">🎯 Our Mission</h3>
            <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 1rem;">
                Our goal is simple yet powerful — to <strong>raise awareness about climate change</strong> 🌡️ and inspire people to adopt <strong>eco-friendly and sustainable habits</strong> ♻️.
            </p>
            <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 2rem;">
                By providing <strong>accurate carbon estimates</strong> 📊 along with <strong>personalized suggestions</strong> 💡, we aim to guide users toward a <strong>greener, cleaner, and healthier future</strong> 🌿✨.
            </p>

            <hr style="border: 0; border-top: 1px solid var(--border-subtle); margin: 2rem 0;">

            <h3 style="margin-bottom: 1rem; color: var(--text-primary);">⚙️ How It Works</h3>
            <ul style="color: var(--text-secondary); line-height: 1.8; list-style-type: none; padding-left: 0; margin-bottom: 1.5rem;">
                <li>🔹 Users enter their daily activity data</li>
                <li>🔹 The system calculates their <strong>carbon footprint (kg CO₂)</strong></li>
                <li>🔹 Smart suggestions are provided to <strong>reduce emissions</strong></li>
            </ul>
            <p style="color: var(--accent-primary); font-weight: 500; font-style: italic;">👉 Measure ➝ Understand ➝ Improve 🌸</p>

            <hr style="border: 0; border-top: 1px solid var(--border-subtle); margin: 2rem 0;">

            <h3 style="margin-bottom: 1rem; color: var(--text-primary);">👨💻 Our Team</h3>
            <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 2rem;">
                This project is developed by <strong>B.Tech (AI & ML) students</strong> 🎓 of <strong>Arka Jain University</strong> as part of an academic initiative focused on <strong>environmental sustainability 🌍</strong> and <strong>innovation 💻</strong>.
            </p>

            <hr style="border: 0; border-top: 1px solid var(--border-subtle); margin: 2rem 0;">

            <h3 style="margin-bottom: 1rem; color: var(--text-primary);">🌱 Our Belief</h3>
            <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 2rem;">
                We believe that <strong>small individual actions</strong> 🌼, when combined, can create <strong>big positive changes</strong> for our planet 🌎💚.
            </p>

            <hr style="border: 0; border-top: 1px solid var(--border-subtle); margin: 2rem 0;">

            <h3 style="margin-bottom: 1rem; color: var(--text-primary);">🔮 Future Vision</h3>
            <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 1rem;">
                In the future, we plan to enhance this platform with:
            </p>
            <ul style="color: var(--text-secondary); line-height: 1.8; list-style-type: none; padding-left: 0; margin-bottom: 1rem;">
                <li>✨ Real-time data tracking 📡</li>
                <li>📱 Mobile application integration</li>
                <li>🤖 AI-based smart recommendations</li>
            </ul>
            <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 2rem;">
                to make the system more <strong>intelligent, efficient, and user-friendly</strong> 🚀.
            </p>

            <hr style="border: 0; border-top: 1px solid var(--border-subtle); margin: 2rem 0;">
            
            <p style="text-align: center; color: var(--accent-primary); font-weight: 600; font-style: italic; font-size: 1.2rem;">
                🌿 Together, let’s build a sustainable future! 🌍💚
            </p>
        </div>
    `;
    setTimeout(() => lucide.createIcons(), 0);
    return container;
}

function createLandingView() {
    const container = document.createElement('div');
    container.className = 'landing-view';

    container.innerHTML = `
        <div class="landing-bg"></div>
        <div class="landing-left">
            <div class="pill-badge">
                <i data-lucide="leaf" style="width:14px; height:14px;"></i> Carbon Footprint Calculator
            </div>
            <h1 class="landing-title">Measure Your Impact,<br><span>Change Your Future</span></h1>
            <p class="landing-subtitle">Understand how your daily choices affect the planet. Get a personalized carbon footprint analysis and AI-powered recommendations to live more sustainably.</p>
            
            <button class="btn-primary" id="start-btn" style="padding: 1rem 2rem; font-size: 1.1rem;">
                Start Your Assessment <i data-lucide="arrow-right" style="width: 18px; margin-left: 8px;"></i>
            </button>

            <div class="landing-stats">
                <div class="stat-item">
                    <h4>5 min</h4>
                    <p>Assessment</p>
                </div>
                <div class="stat-item">
                    <h4 style="color: var(--text-primary);">AI-Powered</h4>
                    <p>Insights</p>
                </div>
                <div class="stat-item">
                    <h4 style="color: var(--text-primary);">Free</h4>
                    <p>Forever</p>
                </div>
            </div>
        </div>

        <div class="landing-right">
            <div class="hero-image-container">
                <img src="sphere-moss.png" alt="Glass sphere resting on lush moss reflecting sunlight">
                <div class="hero-floating-card">
                    <i data-lucide="tree-pine"></i>
                    <div>
                        <div class="title">Average saved</div>
                        <div class="value">2.3 tons/year</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    setTimeout(() => {
        container.querySelector('#start-btn').addEventListener('click', () => {
            if (!state.user) {
                openAuthModal();
            } else {
                resetState();
                window.location.hash = '#questionnaire';
            }
        });
    }, 0);

    return container;
}

function createDashboardView() {
    const container = document.createElement('div');
    container.className = 'user-dashboard-view';

    // Default to 'Julian' if mock name isn't set, to reflect the screenshot precisely, but dynamic
    const userName = state.user && state.user.name ? state.user.name.split(' ')[0] : 'Julian';

    container.innerHTML = `
        <div class="dash-header-row">
            <div class="dash-header-text">
                <h1>Hello, ${userName}</h1>
                <p id="dash-trend-text">Your conscious efforts are visible. Loading historical data...</p>
            </div>
            <button class="btn-primary" onclick="window.location.hash='#questionnaire'" style="background: #0f3d2b; padding: 0.9rem 1.8rem; font-weight: 600;">Log Daily Activity</button>
        </div>

        <div class="dash-top-grid">
            <div class="dash-score-card">
                <div class="score-content">
                    <h4>Sustainability Score</h4>
                    <div class="score-main-val">840 <span>Eco Points</span></div>
                    
                    <div class="score-stats-row">
                        <div class="score-stat-col">
                            <p id="dash-metric1-label">Avg Footprint</p>
                            <div><strong id="dash-metric1-val">--</strong> <span>tons</span></div>
                        </div>
                        <div class="score-stat-col">
                            <p id="dash-metric2-label">Total Logs</p>
                            <div><strong id="dash-metric2-val">--</strong> <span>days</span></div>
                        </div>
                    </div>
                </div>
                
                <div class="chart-circle-container">
                    <svg viewBox="0 0 36 36" style="width: 100%; height: 100%; position: absolute; top:0; left:0; transform: rotate(-90deg);">
                        <path stroke="rgba(255,255,255,0.2)" stroke-width="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path stroke="#fff" stroke-dasharray="85, 100" stroke-width="3" stroke-linecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <div class="chart-circle-inner">
                        <i data-lucide="leaf" style="width: 24px;"></i>
                        <p>Excellent</p>
                    </div>
                </div>
            </div>

            <div class="dash-challenges-card">
                <div class="challenges-header">
                    <h3>Active Challenges</h3>
                    <i data-lucide="award" style="color:var(--text-secondary);"></i>
                </div>
                
                <div class="challenge-item">
                    <div class="challenge-info">
                        <strong>Plastic Free Week</strong>
                        <div class="challenge-toggle ${state.user?.challenges?.plasticFree ? 'active' : ''}" data-challenge="plasticFree"></div>
                    </div>
                    <div class="challenge-progress-bar"><div class="challenge-progress-fill" style="width: 70%; background: #0f3d2b;"></div></div>
                    <div class="challenge-detail">5 of 7 days completed</div>
                </div>
                
                <div class="challenge-item">
                    <div class="challenge-info">
                        <strong>Green Commute</strong>
                        <div class="challenge-toggle ${state.user?.challenges?.greenCommute ? 'active' : ''}" data-challenge="greenCommute"></div>
                    </div>
                    <div class="challenge-progress-bar"><div class="challenge-progress-fill" style="width: 20%; background: #e2e8f0;"></div></div>
                    <div class="challenge-detail">Keep going! You're making impact.</div>
                </div>
                
                <button class="btn-secondary-light">Browse All Challenges</button>
            </div>
        </div>

        <div class="metrics-grid">
            <div class="metric-card">
                <div class="icon-wrapper"><i data-lucide="car"></i></div>
                <p class="title">Travel</p>
                <p class="val">120.5 <span>kg CO2e</span></p>
                <div class="metric-trend up"><i data-lucide="trending-up" style="width:14px;"></i> 4% from last week</div>
            </div>
            <div class="metric-card">
                <div class="icon-wrapper"><i data-lucide="zap"></i></div>
                <p class="title">Energy</p>
                <p class="val">84.2 <span>kg CO2e</span></p>
                <div class="metric-trend down"><i data-lucide="trending-down" style="width:14px;"></i> 12% from last week</div>
            </div>
            <div class="metric-card">
                <div class="icon-wrapper"><i data-lucide="utensils"></i></div>
                <p class="title">Diet</p>
                <p class="val">45.0 <span>kg CO2e</span></p>
                <div class="metric-trend down"><i data-lucide="trending-down" style="width:14px;"></i> 8% from last week</div>
            </div>
            <div class="metric-card">
                <div class="icon-wrapper"><i data-lucide="trash-2"></i></div>
                <p class="title">Waste</p>
                <p class="val">18.1 <span>kg CO2e</span></p>
                <div class="metric-trend stable"><i data-lucide="minus" style="width:14px;"></i> Stable impact</div>
            </div>
        </div>

        <div class="insight-row">
            <div class="insight-content">
                <h4>Curator's Insight</h4>
                <h2>'The greatest threat to our planet is the belief that someone else will save it.'</h2>
                <p>— Robert Swan, Author & Explorer</p>
            </div>
            <div class="insight-img-container">
                <img src="forest-insight.png" alt="Black and white magnificent redwood forest scene">
            </div>
        </div>
    `;

    // Database Metrics Async Injection
    setTimeout(async () => {
        lucide.createIcons();
        if (!state.user) return;
        
        try {
            // Load and analyze all log entries dynamically
            const logs = await db.tracking_logs.where('user_id').equals(state.user.id).toArray();
            
            if (logs.length > 0) {
                logs.sort((a,b) => b.timestamp - a.timestamp);
                const latest = logs[0];
                const previous = logs.length > 1 ? logs[1] : latest;

                // Time trend
                const diff = (latest.tons - previous.tons);
                const diffPct = previous.tons > 0 ? ((diff / previous.tons) * 100).toFixed(1) : 0;
                let trendHtml = '';
                if (diff === 0) {
                    trendHtml = `remained <strong>stable</strong>`;
                } else if (diff < 0) {
                    trendHtml = `gone <strong>down ${Math.abs(diffPct)}%</strong>`;
                } else {
                    trendHtml = `gone <strong>up ${diffPct}%</strong>`;
                }
                
                const trendEl = container.querySelector('#dash-trend-text');
                if(trendEl) trendEl.innerHTML = `Your conscious efforts are visible. Your carbon footprint has ${trendHtml} compared to your last log. Keep shaping a greener tomorrow.`;
                
                // Aggregate sums
                const avg = (logs.reduce((sum, log) => sum + log.tons, 0) / logs.length).toFixed(1);
                container.querySelector('#dash-metric1-val').innerText = avg;
                container.querySelector('#dash-metric2-val').innerText = logs.length;
                
                // Bottom metrics categories update from last log
                if (latest.categories) {
                    const metricVals = container.querySelectorAll('.metric-card .val');
                    if (metricVals.length >= 4) {
                        metricVals[0].innerHTML = `${(latest.categories.transport/1000).toFixed(1)} <span>tons</span>`;
                        metricVals[1].innerHTML = `${(latest.categories.energy/1000).toFixed(1)} <span>tons</span>`;
                        metricVals[2].innerHTML = `${(latest.categories.diet/1000).toFixed(1)} <span>tons</span>`;
                        metricVals[3].innerHTML = `${((latest.categories.shopping || 0)/1000).toFixed(1)} <span>tons</span>`;
                    }
                }
            } else {
                const trendEl = container.querySelector('#dash-trend-text');
                if(trendEl) trendEl.innerHTML = `Welcome to the dashboard. Complete an assessment to begin tracking your data.`;
            }
        } catch(err) {
            console.error("Dashboard DB fetch error:", err);
        }

        const toggles = container.querySelectorAll('.challenge-toggle');
        toggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                toggle.classList.toggle('active');
                const chalName = toggle.getAttribute('data-challenge');
                if (!state.user.challenges) state.user.challenges = {};
                state.user.challenges[chalName] = toggle.classList.contains('active');
                saveState();
            });
        });
    }, 0);
    return container;
}

function createProfileView() {
    const container = document.createElement('div');
    container.className = 'profile-view';

    container.innerHTML = `
        <div class="profile-header">
            <h2>Account Settings</h2>
            <p>Update your profile details and preferences.</p>
        </div>
        
        <form id="profile-form" class="profile-form">
            <div class="form-group">
                <label>Profile Image</label>
                <div style="display:flex; gap:1rem; align-items:center;">
                    <img id="profile-preview-img" src="${state.user?.avatar || 'https://ui-avatars.com/api/?name=' + (state.user?.name || 'User') + '&background=0f3d2b&color=fff'}" alt="Preview" style="width:60px; height:60px; border-radius:50%; object-fit:cover;">
                    <input type="file" id="profile-avatar-file" accept="image/*" style="flex:1;">
                </div>
            </div>
            
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                <div class="form-group">
                    <label>Full Name</label>
                    <input type="text" id="profile-name" value="${state.user?.name || ''}" required placeholder="Jane Doe">
                </div>
                <div class="form-group">
                    <label>Email Registered</label>
                    <input type="email" id="profile-email" value="${state.user?.email || ''}" placeholder="you@example.com">
                </div>
                <div class="form-group">
                    <label>Phone Number</label>
                    <input type="tel" id="profile-phone" value="${state.user?.phone || ''}" placeholder="+1 (555) 000-0000">
                </div>
                <div class="form-group">
                    <label>Date of Birth</label>
                    <input type="date" id="profile-dob" value="${state.user?.dob || ''}">
                </div>
                <div class="form-group">
                    <label>Gender</label>
                    <select id="profile-gender" style="padding: 0.8rem 1rem; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); font-family: var(--font-body); font-size: 1rem; background: var(--bg-primary); color: var(--text-primary);">
                        <option value="" ${!state.user?.gender ? 'selected' : ''}>Prefer not to say</option>
                        <option value="male" ${state.user?.gender === 'male' ? 'selected' : ''}>Male</option>
                        <option value="female" ${state.user?.gender === 'female' ? 'selected' : ''}>Female</option>
                        <option value="nonbinary" ${state.user?.gender === 'nonbinary' ? 'selected' : ''}>Non-binary</option>
                        <option value="other" ${state.user?.gender === 'other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Current Emission Score (kg CO2e)</label>
                    <input type="number" id="profile-score" value="${state.user?.score || ''}" placeholder="e.g. 450">
                </div>
            </div>

            <div class="form-group">
                <label>Address</label>
                <input type="text" id="profile-address" value="${state.user?.address || ''}" placeholder="123 Eco Street, Green City">
            </div>
            <div class="form-group">
                <label>About You</label>
                <textarea id="profile-about" rows="3" placeholder="I am passionate about reducing my footprint...">${state.user?.about || ''}</textarea>
            </div>
            <div class="form-group">
                <label>Achievements</label>
                <textarea id="profile-achievements" rows="3" placeholder="Completed Veganuary 2024...">${state.user?.achievements || ''}</textarea>
            </div>
            
            <button type="submit" class="btn-primary" style="margin-top: 1rem;">Save Changes</button>
        </form>
    `;

    setTimeout(() => {
        const form = container.querySelector('#profile-form');
        const imgPreview = container.querySelector('#profile-preview-img');
        const fileInput = container.querySelector('#profile-avatar-file');
        let currentBase64Avatar = state.user?.avatar || '';

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (event) {
                    currentBase64Avatar = event.target.result;
                    imgPreview.src = currentBase64Avatar;
                };
                reader.readAsDataURL(file);
            }
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = container.querySelector('#profile-name').value;
            const email = container.querySelector('#profile-email').value;
            const phone = container.querySelector('#profile-phone').value;
            const dob = container.querySelector('#profile-dob').value;
            const gender = container.querySelector('#profile-gender').value;
            const score = container.querySelector('#profile-score').value;
            const address = container.querySelector('#profile-address').value;
            const about = container.querySelector('#profile-about').value;
            const achievements = container.querySelector('#profile-achievements').value;

            const saveBtn = form.querySelector('button[type="submit"]');
            const originalText = saveBtn ? saveBtn.innerHTML : '';
            if (saveBtn) {
                saveBtn.innerHTML = 'Saving...';
                saveBtn.disabled = true;
            }

            const updatedUser = {
                ...state.user,
                name,
                email,
                phone,
                dob,
                gender,
                score,
                address,
                about,
                achievements,
                avatar: currentBase64Avatar || ''
            };

            try {
                state.user = updatedUser;
                if (state.user && state.user.id) {
                    await db.users.put(state.user);
                }
                saveState();
                updateAuthUI();
                window.location.hash = '#landing';
            } catch (err) {
                console.error('Profile save error:', err);
                alert('Failed to save changes. Please try again.');
            } finally {
                if (saveBtn && saveBtn.isConnected) {
                    saveBtn.innerHTML = originalText;
                    saveBtn.disabled = false;
                }
            }
        });
    }, 0);

    return container;
}


function createQuestionnaireView() {
    const container = document.createElement('div');
    container.className = 'question-view-layout';

    const maxQuestions = questions.length;
    const currentStep = state.currentQuestionIndex + 1;
    const progressPercent = (currentStep / maxQuestions) * 100;
    const currentQ = questions[state.currentQuestionIndex];

    container.innerHTML = `
        <div class="q-header-top">
            <div class="q-perspective">Perspective Journey</div>
            <h2 class="q-title-large">
                <div>Step ${currentStep} <span>of ${maxQuestions}</span><br>${currentQ.category.charAt(0).toUpperCase() + currentQ.category.slice(1)}</div>
                
                <div class="calibration-bar">
                    <div class="cal-text"><span>Calibration</span> <span>${Math.round(progressPercent)}%</span></div>
                    <div class="progress-container">
                        <div class="progress-bar" style="width: ${progressPercent}%"></div>
                    </div>
                </div>
            </h2>
        </div>

        <div class="q-main-card">
            <h2>${currentQ.title}</h2>
            <p>${currentQ.description}</p>

            <div class="options-grid">
                ${currentQ.options.map(opt => {
        const isSelected = state.answers[currentQ.id] === opt.impact;
        return `
                        <div class="option-card ${isSelected ? 'selected' : ''}" data-impact="${opt.impact}">
                            <i data-lucide="check" class="check-icon" style="width: 16px;"></i>
                            <div class="icon-wrapper">
                                <i data-lucide="${opt.icon}" style="width: 24px; height: 24px;"></i>
                            </div>
                            <h3>${opt.label}</h3>
                            <p>${opt.desc}</p>
                        </div>
                    `;
    }).join('')}
            </div>

            ${currentQ.showCadence ? `
            <div class="cadence-section">
                <h4>Weekly driving cadence</h4>
                <div class="cadence-options">
                    <button class="cadence-pill">0 — 50 km</button>
                    <button class="cadence-pill selected">51 — 150 km</button>
                    <button class="cadence-pill">151 — 300 km</button>
                    <button class="cadence-pill">300+ km</button>
                    <button class="cadence-pill">I do not drive</button>
                </div>
            </div>
            ` : ''}

            <div class="question-actions-row">
                <button class="btn-outline" id="prev-btn" style="${state.currentQuestionIndex === 0 ? 'visibility:hidden;' : ''} display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem;">
                    <i data-lucide="arrow-left" style="width: 18px;"></i> Back
                </button>
                <button class="btn-primary" id="next-btn" style="padding: 1rem 2rem; border-radius: var(--radius-full);" ${state.answers[currentQ.id] !== undefined ? '' : 'disabled style="opacity:0.5; cursor:not-allowed;"'}>
                    ${state.currentQuestionIndex === maxQuestions - 1 ? 'Calculate Assessment' : 'Continue to Next Profile'}
                </button>
            </div>
        </div>

        <div class="info-cards-row">
            <div class="info-card">
                <div class="info-icon"><i data-lucide="sparkles"></i></div>
                <div>
                    <h4>The Significance of ${currentQ.category.charAt(0).toUpperCase() + currentQ.category.slice(1)}</h4>
                    <p>Your choices in this category dictate roughly 15-25% of the average global emission narrative. Mindful shifts here directly rewrite your ecological impact trajectory significantly over time.</p>
                </div>
            </div>
            <div class="info-card dark">
                <p>Sustainable Environmental Intelligence</p>
                <h3>Every conscious choice is a signature on the horizon.</h3>
            </div>
        </div>
    `;

    // Attach Event Listeners after DOM injection
    setTimeout(() => {
        const optionCards = container.querySelectorAll('.option-card');
        const nextBtn = container.querySelector('#next-btn');
        const cadencePills = container.querySelectorAll('.cadence-pill');

        optionCards.forEach(card => {
            card.addEventListener('click', () => {
                optionCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');

                const impact = parseInt(card.getAttribute('data-impact'), 10);
                state.answers[currentQ.id] = impact;
                state.answerCategories[currentQ.category] = impact;

                nextBtn.disabled = false;
                nextBtn.style.opacity = '1';
                nextBtn.style.cursor = 'pointer';
            });
        });

        cadencePills.forEach(pill => {
            pill.addEventListener('click', () => {
                cadencePills.forEach(p => p.classList.remove('selected'));
                pill.classList.add('selected');
            });
        });

        container.querySelector('#prev-btn').addEventListener('click', () => {
            if (state.currentQuestionIndex > 0) {
                state.currentQuestionIndex--;
                renderView();
            }
        });

        nextBtn.addEventListener('click', () => {
            if (state.answers[currentQ.id] !== undefined) {
                if (state.currentQuestionIndex < maxQuestions - 1) {
                    state.currentQuestionIndex++;
                    renderView();
                } else {
                    window.location.hash = '#results';
                }
            }
        });
    }, 0);

    return container;
}


function createResultsView() {
    const container = document.createElement('div');
    container.className = 'results-view-layout';

    let totalScore = 0;
    for (const val of Object.values(state.answers)) {
        totalScore += val;
    }

    // Simulated category breakdown if they skipped
    const cats = Object.keys(state.answerCategories).length > 0 ? state.answerCategories : {
        transport: 2423,
        diet: 2000,
        energy: 2568,
        shopping: 3500,
        travel: 10700
    };

    if (Object.keys(state.answerCategories).length === 0) totalScore = 21191;

    const tons = (totalScore / 1000).toFixed(1);
    const isHigh = totalScore > 10000;

    // Database tracking persistence
    if (state.user) {
        const todayStr = new Date().toISOString().split('T')[0];
        db.tracking_logs.where('user_id').equals(state.user.id).and(log => log.date === todayStr).first().then(existing => {
            if (!existing) {
                db.tracking_logs.add({
                    user_id: state.user.id,
                    date: todayStr,
                    timestamp: Date.now(),
                    tons: parseFloat(tons),
                    categories: cats
                });
            } else {
                db.tracking_logs.update(existing.id, {
                    tons: parseFloat(tons),
                    categories: cats,
                    timestamp: Date.now()
                });
            }
        }).catch(err => console.error("Tracking log error:", err));
    }

    container.innerHTML = `
        <div class="results-header-actions">
            <a href="#questionnaire" class="back-link"><i data-lucide="arrow-left" style="width:16px;"></i> Back to Assessment</a>
            <button class="btn-secondary" id="download-pdf-btn"><i data-lucide="download" style="width:18px; margin-right:8px;"></i> Download PDF</button>
        </div>

        <h2 class="page-title">Your Carbon Footprint</h2>
        <p class="page-subtitle" style="margin-bottom: 2rem;">Assessment from ${new Date().toLocaleDateString()}</p>

        <div class="top-cards-row">
            <div class="total-card">
                <div class="total-card-label">Total Footprint</div>
                <div class="total-val">${tons}</div>
                <div class="total-unit">tons CO2 / year</div>
                
                <div class="impact-badge ${isHigh ? 'high' : 'low'}">
                    <i data-lucide="${isHigh ? 'alert-triangle' : 'leaf'}" style="width:14px;"></i> 
                    ${isHigh ? 'High Impact' : 'Sustainable Impact'}
                </div>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 1rem;">Average is ~10 tons/year</p>
            </div>

            <div class="breakdown-card">
                <div class="card-title">Breakdown by Category</div>
                <div class="breakdown-content">
                    <div class="chart-container">
                        <canvas id="donutChart"></canvas>
                    </div>
                    <div class="legend-container">
                        ${Object.keys(cats).map((cat, i) => {
        const colors = ['#1e4d3a', '#2b6e54', '#e5cdb2', '#cf6641', '#a1b08b'];
        const color = colors[i % colors.length];
        const val = cats[cat];
        const pct = Math.round((val / totalScore) * 100);
        return `
                                <div class="legend-item">
                                    <div class="legend-label"><div class="legend-dot" style="background:${color};"></div> ${cat.charAt(0).toUpperCase() + cat.slice(1)}</div>
                                    <div class="legend-val">${val} kg <span style="color:var(--text-muted); font-size: 0.8em;">(${pct}%)</span></div>
                                </div>
                            `;
    }).join('')}
                    </div>
                </div>
            </div>
        </div>

        <div class="wide-card">
            <div class="card-title"><i data-lucide="globe"></i> Comparison with Global Averages</div>
            <div class="bar-chart-container">
                <canvas id="barChart"></canvas>
            </div>
        </div>

        <div class="ai-rec-banner">
            <div style="display:flex; align-items:center; gap: 1rem;">
                <i data-lucide="sparkles" style="color: var(--brand-orange)"></i>
                <span style="font-weight: 600; font-size: 1.1rem;">AI-Powered Recommendations</span>
            </div>
            <button id="trigger-ai-rec-btn" class="btn-primary" style="padding: 0.6rem 1.2rem; font-size: 0.9rem;">Get AI Recommendations</button>
        </div>

        <div id="ai-rec-output" style="display: none; margin-top: 1.5rem; padding: 1.5rem; background: rgba(207, 102, 65, 0.05); border: 1px dashed var(--brand-orange); border-radius: var(--radius-md); animation: fadeIn 0.4s;">
        </div>

        <div class="wide-card" style="margin-top: 2rem;">
            <div class="card-title" style="margin-bottom: 2rem;"><i data-lucide="tree-deciduous"></i> Carbon Offset Actions</div>
            <div class="offset-grid">
                <div class="offset-card">
                    <div class="offset-icon"><i data-lucide="trees"></i></div>
                    <h4>Tree Planting</h4>
                    <p class="desc">Each tree absorbs ~22 kg of CO2 per year. Support reforestation projects worldwide.</p>
                    <div class="offset-footer">
                        <span class="offset-cost">22 kg CO2/tree/year</span>
                        <a href="#" class="offset-link" onclick="event.preventDefault()">Learn More <i data-lucide="external-link" style="width:14px;"></i></a>
                    </div>
                </div>
                <div class="offset-card">
                    <div class="offset-icon"><i data-lucide="sun"></i></div>
                    <h4>Renewable Energy Credits</h4>
                    <p class="desc">Purchase renewable energy certificates to support clean energy production directly displacing fossil fuels.</p>
                    <div class="offset-footer">
                        <span class="offset-cost">Varies by project</span>
                        <a href="#" class="offset-link" onclick="event.preventDefault()">Learn More <i data-lucide="external-link" style="width:14px;"></i></a>
                    </div>
                </div>
                <div class="offset-card">
                    <div class="offset-icon"><i data-lucide="waves"></i></div>
                    <h4>Ocean Conservation</h4>
                    <p class="desc">Support ocean cleanup and conservation projects that protect marine ecosystems and carbon sinks.</p>
                    <div class="offset-footer">
                        <span class="offset-cost">Significant CO2 sequestration</span>
                        <a href="#" class="offset-link" onclick="event.preventDefault()">Learn More <i data-lucide="external-link" style="width:14px;"></i></a>
                    </div>
                </div>
            </div>
        </div>
    `;

    setTimeout(() => {
        // Init Charts
        const donutCtx = document.getElementById('donutChart');
        if (donutCtx) {
            new Chart(donutCtx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(cats),
                    datasets: [{
                        data: Object.values(cats),
                        backgroundColor: ['#1e4d3a', '#2b6e54', '#e5cdb2', '#cf6641', '#a1b08b'],
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                },
                options: {
                    cutout: '70%',
                    plugins: { legend: { display: false }, tooltip: { enabled: true } },
                    maintainAspectRatio: false
                }
            });
        }

        const barCtx = document.getElementById('barChart');
        if (barCtx) {
            new Chart(barCtx, {
                type: 'bar',
                data: {
                    labels: ['You', 'Global', 'US', 'EU', 'UK', 'China', 'India'],
                    datasets: [{
                        label: 'Tons of CO2 / Year',
                        data: [tons, 4.7, 14.9, 6.2, 5.2, 8.0, 1.9],
                        backgroundColor: [
                            '#cf6641', // You (Orange highlight)
                            '#a1b08b', '#a1b08b', '#a1b08b', '#a1b08b', '#a1b08b', '#a1b08b' // Others slightly faded green
                        ],
                        borderRadius: 4,
                        barPercentage: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 24,
                            grid: { color: 'rgba(0,0,0,0.05)' },
                            border: { display: false }
                        },
                        x: {
                            grid: { display: false },
                            border: { display: false }
                        }
                    }
                }
            });
        }

        const aiBtn = container.querySelector('#trigger-ai-rec-btn');
        const aiOutput = container.querySelector('#ai-rec-output');
        
        if (aiBtn && aiOutput) {
            aiBtn.addEventListener('click', () => {
                aiBtn.disabled = true;
                aiBtn.innerHTML = '<i data-lucide="loader" style="width:16px; animation: spin 1s linear infinite; margin-right:8px;"></i> Analyzing...';
                lucide.createIcons();

                setTimeout(() => {
                    aiBtn.style.display = 'none'; // hide button
                    aiOutput.style.display = 'block';
                    
                    let highestCat = '';
                    let highestVal = 0;
                    if (Object.keys(state.answerCategories).length > 0) {
                        for (const [cat, val] of Object.entries(state.answerCategories)) {
                            if (val > highestVal) {
                                highestVal = val;
                                highestCat = cat;
                            }
                        }
                    }

                    const adviceMap = {
                        transport: "Your transportation habits are your highest emission source. Try to replace one car trip a week with public transit, walking, or biking.",
                        diet: "Your diet is your highest emission category. Focus on incorporating more plant-based meals to drastically cut agriculture emissions.",
                        energy: "Home energy is your highest category! Switch to LED bulbs, unplug appliances, and request green energy from your utility provider.",
                        shopping: "Your shopping habits are generating a lot of emissions! Aim to buy local, second-hand, and avoid fast fashion.",
                        travel: "Air travel is heavily impacting your overall score. Reducing flights or choosing train travel has a massive positive impact."
                    };

                    let recText = "We lack the exact category breakdown from your session. However, addressing Transport and Diet typically yields the best results.";
                    
                    if (highestCat) {
                       recText = `
                                  <div style="display:flex; align-items:flex-start; gap:1.5rem;">
                                      <i data-lucide="bot" style="color:var(--brand-orange); width:32px; height:32px; flex-shrink:0;"></i>
                                      <div>
                                          <h4 style="color:var(--text-primary); margin-bottom:0.5rem; font-size: 1.1rem;">Insight Generated</h4>
                                          <p style="color:var(--text-secondary); line-height:1.6; margin-bottom:1rem;">Your highest impact area is <strong>${highestCat.charAt(0).toUpperCase() + highestCat.slice(1)}</strong> at ${(highestVal/1000).toFixed(2)} tons.</p>
                                          <div style="background: #fff; padding: 1.25rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); box-shadow: var(--shadow-sm);">
                                              <span style="color:var(--brand-orange); font-weight:bold;">💡 Recommendation:</span> ${adviceMap[highestCat] || "Focus on reducing this category first!"}
                                          </div>
                                      </div>
                                  </div>
                       `;
                    }
                    
                    aiOutput.innerHTML = recText;
                    lucide.createIcons();
                }, 1800);
            });
        }

        const downloadBtn = container.querySelector('#download-pdf-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', async () => {
                const originalText = downloadBtn.innerHTML;
                downloadBtn.innerHTML = '<i data-lucide="loader" style="width:18px; margin-right:8px; animation: spin 1s linear infinite;"></i> Generating PDF...';
                downloadBtn.disabled = true;
                lucide.createIcons();
                
                try {
                    // Slight delay to ensure charts are fully rendered
                    await new Promise(resolve => setTimeout(resolve, 300));

                    const { jsPDF } = window.jspdf;
                    
                    const canvas = await html2canvas(container, {
                        scale: 2,
                        backgroundColor: '#f8f9fa',
                        useCORS: true,
                        logging: false
                    });
                    
                    const imgData = canvas.toDataURL('image/png');
                    
                    // Width of A4 in mm
                    const pdfWidth = 210; 
                    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                    
                    // Create a PDF with custom dimensions to exactly fit the content as one continuous page
                    const doc = new jsPDF({
                        orientation: 'portrait',
                        unit: 'mm',
                        format: [pdfWidth, pdfHeight]
                    });
                    
                    doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                    doc.save('EcoTrack-Carbon-Report.pdf');
                    
                } catch (err) {
                    console.error('Error generating PDF:', err);
                    alert('Could not generate PDF: ' + err.message);
                } finally {
                    downloadBtn.innerHTML = originalText;
                    downloadBtn.disabled = false;
                    lucide.createIcons();
                }
            });
        }
    }, 0);

    return container;
}

// ==========================================================================
// Authentication
// ==========================================================================

function updateAuthUI() {
    const signinBtn = document.getElementById('signin-nav-btn');
    const userProfile = document.getElementById('user-profile');

    if (state.user) {
        if (signinBtn) signinBtn.style.display = 'none';
        if (userProfile) {
            userProfile.style.display = 'flex';
            const nameSpan = userProfile.querySelector('span');
            const navPic = userProfile.querySelector('#nav-profile-pic');
            if (nameSpan) nameSpan.textContent = state.user.name || 'User Profile';
            if (navPic) {
                if (state.user.avatar) {
                    navPic.src = state.user.avatar;
                } else {
                    navPic.src = 'https://ui-avatars.com/api/?name=' + (state.user.name || 'User') + '&background=0f3d2b&color=fff';
                }
            }
        }
    } else {
        if (signinBtn) signinBtn.style.display = 'flex';
        if (userProfile) userProfile.style.display = 'none';
    }
}

function openAuthModal() {
    let overlay = document.getElementById('auth-modal');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'auth-modal-overlay';
        overlay.id = 'auth-modal';
        overlay.innerHTML = `
            <div class="auth-modal-card">
                <button class="close-modal-btn"><i data-lucide="x" style="width:18px;"></i></button>
                <div style="text-align:center; margin-bottom: 2rem;">
                    <i data-lucide="leaf" style="color:var(--accent-primary); width:32px; height:32px; margin-bottom:1rem;"></i>
                    <h2 style="font-size: 1.8rem; margin-bottom: 0.5rem; color: var(--text-primary);">Welcome to EcoTrack</h2>
                    <p style="color:var(--text-secondary); font-size: 0.95rem;">Log in to calculate and save your carbon footprint.</p>
                </div>
                
                <div id="auth-buttons-container" style="display:flex; flex-direction:column; gap:0.8rem; margin-bottom: 2rem;">
                    <button class="btn-provider" id="mock-login-google">
                        <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                        Continue with Google
                    </button>
                    <button class="btn-provider" id="mock-login-email">
                        <i data-lucide="mail" style="width:20px;"></i>
                        Log In with Email
                    </button>
                    
                    <div style="display:flex; align-items:center; margin: 0.5rem 0;">
                        <div style="flex:1; height:1px; background:var(--border-subtle);"></div>
                        <span style="padding:0 1rem; color:var(--text-muted); font-size:0.85rem;">or</span>
                        <div style="flex:1; height:1px; background:var(--border-subtle);"></div>
                    </div>

                    <button class="btn-provider" id="signup-email" style="background: var(--bg-primary); border-color: var(--accent-primary); color: var(--accent-primary);">
                        <i data-lucide="user-plus" style="width:20px;"></i>
                        Create New Account
                    </button>
                </div>
                
                <form id="email-login-form" style="display:none; flex-direction:column; gap:1rem; margin-bottom: 2rem;">
                    <div style="text-align: left;">
                        <label style="font-size: 0.85rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 0.3rem; display: block;">Email Address</label>
                        <input type="email" required style="width:100%; padding:0.75rem 1rem; border:1px solid var(--border-subtle); border-radius:var(--radius-sm); font-family:var(--font-body); font-size:1rem; outline:none;" placeholder="you@example.com">
                    </div>
                    <div style="text-align: left;">
                        <label style="font-size: 0.85rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 0.3rem; display: block;">Password</label>
                        <input type="password" required style="width:100%; padding:0.75rem 1rem; border:1px solid var(--border-subtle); border-radius:var(--radius-sm); font-family:var(--font-body); font-size:1rem; outline:none;" placeholder="••••••••">
                    </div>
                    <button type="submit" class="btn-primary" style="justify-content:center; margin-top:0.5rem; width:100%;">Sign In</button>
                    <button type="button" id="back-to-providers" class="btn-outline" style="justify-content:center; width:100%; border:none;">Back to all options</button>
                </form>
                
                <p style="text-align:center; font-size: 0.8rem; color:var(--text-muted);">
                    By signing in, you agree to our Terms of Service and Privacy Policy.
                </p>
            </div>
        `;
        document.body.appendChild(overlay);
        lucide.createIcons();

        // Reveal transition
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
        });

        // Close logic
        const closeModal = () => {
            overlay.style.opacity = '0';
            setTimeout(() => { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 300);
        };
        overlay.querySelector('.close-modal-btn').addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });

        // Toggle forms logic
        const emailBtn = overlay.querySelector('#mock-login-email');
        const signupBtn = overlay.querySelector('#signup-email');
        const backBtn = overlay.querySelector('#back-to-providers');
        const buttonsContainer = overlay.querySelector('#auth-buttons-container');
        const emailForm = overlay.querySelector('#email-login-form');
        const submitBtn = emailForm.querySelector('button[type="submit"]');

        emailBtn.addEventListener('click', () => {
            submitBtn.textContent = 'Sign In';
            buttonsContainer.style.display = 'none';
            emailForm.style.display = 'flex';
        });
        
        signupBtn.addEventListener('click', () => {
            submitBtn.textContent = 'Create Account';
            buttonsContainer.style.display = 'none';
            emailForm.style.display = 'flex';
        });

        backBtn.addEventListener('click', () => {
            emailForm.style.display = 'none';
            buttonsContainer.style.display = 'flex';
        });

        // Database Login/Register Logic
        emailForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailInput = emailForm.querySelector('input[type="email"]').value.trim();
            const passInput = emailForm.querySelector('input[type="password"]').value.trim();
            
            const submitBtn = emailForm.querySelector('button[type="submit"]');
            const origText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i data-lucide="loader" style="width:18px; margin-right:8px; animation: spin 1s linear infinite;"></i> Processing...';
            submitBtn.disabled = true;
            lucide.createIcons();

            try {
                // Check if user exists in the local database
                let existingUser = await db.users.where('email').equalsIgnoreCase(emailInput).first();
                
                if (!existingUser) {
                    // Create new user (Sign Up)
                    const newId = await db.users.add({
                        email: emailInput,
                        password: passInput,
                        name: emailInput.split('@')[0], // Extract name from email
                        avatar: '',
                        address: '',
                        phone: '',
                        about: '',
                        achievements: '',
                        challenges: {},
                        joinedAt: Date.now()
                    });
                    existingUser = await db.users.get(newId);
                } else if (existingUser.password !== passInput) {
                    alert('Incorrect password for this email account.');
                    submitBtn.innerHTML = origText;
                    submitBtn.disabled = false;
                    return;
                }
                
                // Login Success
                state.user = existingUser;
                applyTheme(resolvePreferredTheme());
                saveState(); // sync active session to localStorage
                
                updateAuthUI();
                closeModal();
                resetState();
                window.location.hash = '#questionnaire'; // route to assess
                
            } catch (err) {
                console.error("Database Error:", err);
                alert("Failed to authenticate with local database.");
                submitBtn.innerHTML = origText;
                submitBtn.disabled = false;
            }
        });

        // Google Mock simulates an instant DB sync
        overlay.querySelector('#mock-login-google').addEventListener('click', async () => {
            try {
                const emailInput = "user@gmail.com";
                let existingUser = await db.users.where('email').equalsIgnoreCase(emailInput).first();
                if (!existingUser) {
                    const newId = await db.users.add({
                        email: emailInput,
                        name: 'Google User',
                        avatar: '', joinedAt: Date.now()
                    });
                    existingUser = await db.users.get(newId);
                }
                state.user = existingUser;
                applyTheme(resolvePreferredTheme());
                saveState();
                updateAuthUI();
                closeModal();
                resetState();
                window.location.hash = '#questionnaire';
            } catch(e) {}
        });
    }
}

// ==========================================================================
// AI Chatbot Simulation Engine
// ==========================================================================

function setupChatbot() {
    const chatBtn = document.getElementById('ai-chat-btn');
    const closeBtn = document.getElementById('close-chat-btn');
    const drawer = document.getElementById('chat-drawer');
    const sendBtn = document.getElementById('send-chat-btn');
    const inputField = document.getElementById('chat-input');
    const chatBody = document.getElementById('chat-body');

    if (!chatBtn || !drawer) return;

    // Toggle logic
    chatBtn.addEventListener('click', () => drawer.classList.add('open'));
    closeBtn.addEventListener('click', () => drawer.classList.remove('open'));

    // Chat rendering utilities
    const appendMessage = (text, isUser = false) => {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-msg ${isUser ? 'user-msg' : 'bot-msg'}`;
        msgDiv.innerHTML = text;
        chatBody.appendChild(msgDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    };

    const appendTypingIndicator = () => {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-msg bot-msg typing-indicator';
        msgDiv.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
        chatBody.appendChild(msgDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
        return msgDiv;
    };

    const processInput = () => {
        const text = inputField.value.trim();
        if (!text) return;

        appendMessage(text, true);
        inputField.value = '';

        const typingDiv = appendTypingIndicator();

        // Simulate AI "thinking" via random network delay
        setTimeout(() => {
            if (typingDiv) typingDiv.remove();
            const response = generateAIResponse(text.toLowerCase());
            appendMessage(response, false);
        }, 800 + Math.random() * 1000);
    };

    sendBtn.addEventListener('click', processInput);
    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') processInput();
    });

    // Semantic Contextual Brain
    function generateAIResponse(text) {
        // Read app state to make it personalized
        const hasScore = state.user && state.user.score && state.user.score !== '0.0';
        let scoreContext = "";
        
        if (hasScore) {
            scoreContext = `<br><br><small style="color:var(--accent-primary);"><em>(Based on your active score: ${state.user.score} tons/yr)</em></small>`;
        }

        // Semantic Keyword Parsing Sequences
        if (text.includes("assessment") || text.includes("analyze") || text.includes("categories")) {
            if (Object.keys(state.answerCategories).length > 0) {
                let highestCat = '';
                let highestVal = 0;
                for (const [cat, val] of Object.entries(state.answerCategories)) {
                    if (val > highestVal) {
                        highestVal = val;
                        highestCat = cat;
                    }
                }
                const adviceMap = {
                    transport: "Your transportation habits are your highest emission source. Try to replace one car trip a week with public transit, walking, or biking.",
                    diet: "Your diet is your highest emission category. Focus on incorporating more plant-based meals to drastically cut agriculture emissions.",
                    energy: "Home energy is your highest category! Switch to LED bulbs, unplug appliances, and request green energy from your utility provider.",
                    shopping: "Your shopping habits are generating a lot of emissions! Aim to buy local, second-hand, and avoid fast fashion.",
                    travel: "Air travel is heavily impacting your overall score. Reducing flights or choosing train travel has a massive positive impact."
                };
                return `Based on your latest assessment, your highest impact area is <strong>${highestCat.charAt(0).toUpperCase() + highestCat.slice(1)}</strong> at ${(highestVal/1000).toFixed(2)} tons. <br><br>💡 <strong>Recommendation:</strong> ${adviceMap[highestCat] || "Focus on reducing this category first for the biggest environmental impact!"}`;
            } else if (hasScore) {
                return "I see your footprint score, but I lack the exact category breakdown from your latest session. However, reducing Transport and Diet usually creates the biggest improvements!";
            }
        }

        if (text.includes("hello") || text.includes("hi ") || text === "hi") {
            return "Greetings! 🌱 I am EcoBot. " + (hasScore ? "I see your footprint score is " + state.user.score + " tons. How can I help you lower it?" : "I can help you analyze your carbon footprint. You should start by taking the Analysis assessment!");
        }

        if (text.includes("reduce") || text.includes("improve") || text.includes("tips") || text.includes("how can i")) {
            return "To rapidly reduce your footprint, target the 'Big Three':<br>1. <strong>Transport</strong>: Replace one car trip weekly with biking or transit.<br>2. <strong>Diet</strong>: Add 2 plant-based days a week.<br>3. <strong>Energy</strong>: Switch home appliances to Eco-mode." + scoreContext;
        }

        if (text.includes("food") || text.includes("diet") || text.includes("meat")) {
            return "Diet is a massive factor! Meat production (especially beef) produces significantly more GHG than plant agriculture. Try swapping beef for chicken, or choosing a vegan meal once a day." + scoreContext;
        }

        if (text.includes("car") || text.includes("drive") || text.includes("transport")) {
            return "Transportation heavily impacts footprints. If you drive a traditional gas car, consider carpooling or combining errands. Every mile walked or biked saves roughly 400g of CO₂!" + scoreContext;
        }

        if (text.includes("score") || text.includes("my footprint")) {
            if (hasScore) {
                const scoreNum = parseFloat(state.user.score);
                if (scoreNum > 15) return "Your score is " + scoreNum + " tons/yr. This is above the global target. We should investigate your daily commute and diet to find immediate reduction targets!";
                if (scoreNum < 8) return "Your score is " + scoreNum + " tons/yr. This is excellent! You are living very sustainably. Have you considered looking into community solutions to inspire others?";
                return "Your score is " + scoreNum + " tons/yr. This is a typical average. Just a few small routine adjustments can quickly bring this down!";
            }
            return "I don't see a footprint score for you yet! Navigate to the <strong>Analysis</strong> tab and complete the questionnaire so I can personalize my advice.";
        }
        
        if (text.includes("hackathon") || text.includes("arka jain")) {
            return "Ah! You're from Hack Horizon 2.0 at Arka JAIN University! Let's win this! 🚀";
        }

        // Generic Fallback
        return "That's an interesting point. As your Eco-Assistant, I recommend reviewing our <strong>Solutions</strong> tab for global strategies, or simply asking me specifically about 'diet', 'transport', or 'how to reduce my score'." + scoreContext;
    }
}

// Call init initially
init();
