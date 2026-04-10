// ==========================================================================
// Application State & Data
// ==========================================================================

const state = {
    currentView: 'landing', // 'landing', 'questionnaire', 'results'
    currentQuestionIndex: 0,
    answers: {}, // { questionId: selectedOptionImpactValue }
    answerCategories: {}, // { categoryName: accumulatedValue }
    user: null
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

function init() {
    loadState();
    setupGlobalListeners();
    handleRoute();
}

function setupGlobalListeners() {
    window.addEventListener('hashchange', handleRoute);

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

    if (['landing', 'questionnaire', 'results', 'solutions', 'profile'].includes(hash)) {
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
            // Fallback for solutions tab mock
            const div = document.createElement('div');
            div.innerHTML = '<div style="text-align:center; padding: 100px;"><h2>Community & Solutions</h2><p>Coming Soon</p></div>';
            DOM.main.appendChild(div);
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
                <p>Your conscious efforts are visible. Your carbon footprint is <strong>down 12%</strong> this month. Keep shaping a greener tomorrow.</p>
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
                            <p>Carbon Saved</p>
                            <div><strong>12.4</strong> <span>kg</span></div>
                        </div>
                        <div class="score-stat-col">
                            <p>Trees Saved</p>
                            <div><strong>3.2</strong> <span>units</span></div>
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

    // Ensure icon execution since they were populated via innerHTML
    setTimeout(() => {
        lucide.createIcons();

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
        let currentBase64Avatar = state.user?.avatar || null;

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

        form.addEventListener('submit', (e) => {
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

            state.user.name = name;
            state.user.email = email;
            state.user.phone = phone;
            state.user.dob = dob;
            state.user.gender = gender;
            state.user.score = score;
            state.user.address = address;
            state.user.about = about;
            state.user.achievements = achievements;

            if (currentBase64Avatar) {
                state.user.avatar = currentBase64Avatar;
            } else {
                delete state.user.avatar;
            }

            saveState();
            updateAuthUI();

            window.location.hash = '#landing';
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
            <button class="btn-primary" style="padding: 0.6rem 1.2rem; font-size: 0.9rem;">Get AI Recommendations</button>
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
                        Continue with Email
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
        const backBtn = overlay.querySelector('#back-to-providers');
        const buttonsContainer = overlay.querySelector('#auth-buttons-container');
        const emailForm = overlay.querySelector('#email-login-form');

        emailBtn.addEventListener('click', () => {
            buttonsContainer.style.display = 'none';
            emailForm.style.display = 'flex';
        });

        backBtn.addEventListener('click', () => {
            emailForm.style.display = 'none';
            buttonsContainer.style.display = 'flex';
        });

        // Mock Login Logic
        const handleLogin = (e) => {
            if (e) e.preventDefault();
            state.user = { name: "Anubhav Shreshtha" };
            updateAuthUI();
            closeModal();
            resetState();
            window.location.hash = '#questionnaire';
        };

        overlay.querySelector('#mock-login-google').addEventListener('click', handleLogin);
        emailForm.addEventListener('submit', handleLogin);
    }
}

// Call init initially
init();
