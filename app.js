// ==========================================================================
// Application State & Data
// ==========================================================================

const state = {
    currentView: 'landing', // 'landing', 'questionnaire', 'results'
    currentQuestionIndex: 0,
    answers: {}, // { questionId: selectedOptionImpactValue }
    answerCategories: {} // { categoryName: accumulatedValue }
};

const questions = [
    {
        id: 'q1',
        category: 'transportation',
        title: 'How do you usually commute?',
        description: 'Select your primary mode of transportation for daily travel.',
        options: [
            { id: 'car', label: 'Personal Car', icon: 'car-front', impact: 2000, desc: 'Gas or diesel vehicle' },
            { id: 'ev', label: 'Electric Vehicle', icon: 'zap', impact: 800, desc: 'EV or Hybrid' },
            { id: 'transit', label: 'Public Transit', icon: 'bus', impact: 500, desc: 'Bus, train, or subway' },
            { id: 'bike', label: 'Bike / Walk', icon: 'bike', impact: 0, desc: 'Active commute' }
        ]
    },
    {
        id: 'q2',
        category: 'diet',
        title: 'What best describes your diet?',
        description: 'Meat consumption is a significant factor in carbon footprints.',
        options: [
            { id: 'meat-heavy', label: 'Meat Heavy', icon: 'drumstick', impact: 2500, desc: 'Meat most days' },
            { id: 'balanced', label: 'Average', icon: 'utensils', impact: 1500, desc: 'Mix of meat & plant-based' },
            { id: 'vegetarian', label: 'Vegetarian', icon: 'leaf', impact: 800, desc: 'No meat, just dairy/eggs' },
            { id: 'vegan', label: 'Vegan', icon: 'carrot', impact: 400, desc: 'Plant-based only' }
        ]
    },
    {
        id: 'q3',
        category: 'energy',
        title: 'How is your home powered?',
        description: 'Household energy usage and sourcing.',
        options: [
            { id: 'grid-coal', label: 'Standard Grid', icon: 'plug', impact: 3000, desc: 'Mostly fossil fuels' },
            { id: 'mixed', label: 'Mixed Energy', icon: 'factory', impact: 1800, desc: 'Standard mix, some energy-saving' },
            { id: 'renewable', label: 'Renewable', icon: 'sun', impact: 200, desc: 'Solar, wind, or green plan' }
        ]
    },
    {
        id: 'q4',
        category: 'shopping',
        title: 'What are your shopping habits?',
        description: 'Consider clothing, electronics, and general goods.',
        options: [
            { id: 'frequent', label: 'Frequent', icon: 'shopping-bag', impact: 1500, desc: 'Buy new items often' },
            { id: 'average', label: 'Average', icon: 'package', impact: 800, desc: 'Buy what I need occasionally' },
            { id: 'thrifting', label: 'Sustainable', icon: 'recycle', impact: 300, desc: 'Second-hand and repaired items' }
        ]
    },
    {
        id: 'q5',
        category: 'travel',
        title: 'How often do you fly?',
        description: 'Air travel significantly boosts your annual footprint.',
        options: [
            { id: 'frequent-flyer', label: 'Frequent', icon: 'plane-takeoff', impact: 4000, desc: '3+ round trips a year' },
            { id: 'occasional', label: 'Occasional', icon: 'plane', impact: 1200, desc: '1-2 round trips a year' },
            { id: 'rare', label: 'Rarely / Never', icon: 'palmtree', impact: 100, desc: 'Mostly local travel' }
        ]
    }
];

// ==========================================================================
// Core Render Logic & Routing
// ==========================================================================

const DOM = {
    main: document.getElementById('main-content'),
    navBtn: document.getElementById('start-nav-btn'),
    logo: document.querySelector('.logo')
};

function init() {
    setupGlobalListeners();
    handleRoute(); // initial render based on current hash
}

function setupGlobalListeners() {
    // Listen for hash changes to drive routing
    window.addEventListener('hashchange', handleRoute);

    DOM.navBtn.addEventListener('click', () => {
        if (state.currentView !== 'questionnaire') {
            resetState();
            window.location.hash = '#questionnaire';
        }
    });

    DOM.logo.addEventListener('click', () => {
        window.location.hash = '#landing';
    });
}

function handleRoute() {
    const hash = window.location.hash.slice(1) || 'landing';
    
    // Only allow valid views
    if (['landing', 'questionnaire', 'results'].includes(hash)) {
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
    DOM.main.innerHTML = ''; // Clear current content
    
    // Update Nav Button based on context
    if (state.currentView === 'landing' || state.currentView === 'results') {
        DOM.navBtn.style.display = 'block';
        DOM.navBtn.textContent = 'Start Assessment';
    } else {
        DOM.navBtn.style.display = 'none';
    }

    switch (state.currentView) {
        case 'landing':
            DOM.main.appendChild(createLandingView());
            break;
        case 'questionnaire':
            DOM.main.appendChild(createQuestionnaireView());
            break;
        case 'results':
            DOM.main.appendChild(createResultsView());
            break;
    }
    
    // Re-initialize Lucide icons for dynamically added content
    lucide.createIcons();
}

// ==========================================================================
// Views
// ==========================================================================

function createLandingView() {
    const container = document.createElement('div');
    container.className = 'landing-view';
    
    container.innerHTML = `
        <h1 class="landing-title">Understand Your<br><span>Environmental Impact</span></h1>
        <p class="landing-subtitle">Take our quick assessment to calculate your carbon footprint and discover actionable, personalized steps to a sustainable future.</p>
        
        <button class="btn-primary" id="start-btn" style="font-size: 1.1rem; padding: 1rem 2rem;">
            Calculate My Footprint
        </button>

        <div class="features-grid">
            <div class="feature-card">
                <i data-lucide="calculator"></i>
                <h3>Accurate Estimation</h3>
                <p>Based on standardized emissions data across major lifestyle categories.</p>
            </div>
            <div class="feature-card">
                <i data-lucide="target"></i>
                <h3>Personalized Plan</h3>
                <p>Get recommendations tailored specifically to your habits and choices.</p>
            </div>
            <div class="feature-card">
                <i data-lucide="tree-pine"></i>
                <h3>Offset Solutions</h3>
                <p>Discover real-world projects to neutralize your remaining emissions.</p>
            </div>
        </div>
    `;

    setTimeout(() => {
        container.querySelector('#start-btn').addEventListener('click', () => {
            resetState();
            window.location.hash = '#questionnaire';
        });
    }, 0);

    return container;
}


function createQuestionnaireView() {
    const container = document.createElement('div');
    container.className = 'question-view';
    
    const maxQuestions = questions.length;
    const progressPercent = (state.currentQuestionIndex / maxQuestions) * 100;
    const currentQ = questions[state.currentQuestionIndex];

    container.innerHTML = `
        <div class="glass-card">
            <div class="progress-container">
                <div class="progress-bar" style="width: ${progressPercent}%"></div>
            </div>
            
            <div class="question-header">
                <h2>${currentQ.title}</h2>
                <p>${currentQ.description}</p>
            </div>

            <div class="options-grid">
                ${currentQ.options.map(opt => {
                    const isSelected = state.answers[currentQ.id] === opt.impact;
                    return `
                        <div class="option-card ${isSelected ? 'selected' : ''}" data-impact="${opt.impact}">
                            <div class="option-icon">
                                <i data-lucide="${opt.icon}"></i>
                            </div>
                            <div>
                                <div class="option-title">${opt.label}</div>
                                <div class="option-desc">${opt.desc}</div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>

            <div class="question-actions">
                <button class="btn-secondary" id="prev-btn" ${state.currentQuestionIndex === 0 ? 'style="visibility:hidden"' : ''}>
                    Previous
                </button>
                <button class="btn-primary" id="next-btn" ${state.answers[currentQ.id] !== undefined ? '' : 'disabled style="opacity:0.5; cursor:not-allowed;"'}>
                    ${state.currentQuestionIndex === maxQuestions - 1 ? 'See Results' : 'Next Question'}
                </button>
            </div>
        </div>
    `;

    // Attach Event Listeners after DOM injection
    setTimeout(() => {
        const optionCards = container.querySelectorAll('.option-card');
        const nextBtn = container.querySelector('#next-btn');

        optionCards.forEach(card => {
            card.addEventListener('click', () => {
                // Remove selected class from all
                optionCards.forEach(c => c.classList.remove('selected'));
                // Add to clicked
                card.classList.add('selected');
                
                // Save state
                const impact = parseInt(card.getAttribute('data-impact'), 10);
                state.answers[currentQ.id] = impact;
                state.answerCategories[currentQ.category] = impact;

                // Enable next
                nextBtn.disabled = false;
                nextBtn.style.opacity = '1';
                nextBtn.style.cursor = 'pointer';
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
    container.className = 'results-view';
    
    // Calculate total score
    let totalScore = 0;
    for (const val of Object.values(state.answers)) {
        totalScore += val;
    }

    // Determine category based on roughly average numbers (Global avg is ~4.7 tons, US is ~15 tons, let's use kg).
    let scoreClass = 'low';
    if (totalScore > 6000) scoreClass = 'medium';
    if (totalScore > 10000) scoreClass = 'high';

    container.innerHTML = `
        <div class="glass-card" style="margin-bottom: 2rem;">
            <div class="results-header">
                <h2>Your Annual Carbon Footprint</h2>
                <div class="score-display ${scoreClass}">
                    <div class="score-value">${(totalScore / 1000).toFixed(1)}</div>
                    <div class="score-unit">Tons of CO₂e</div>
                </div>
                <p style="color: var(--text-secondary); max-width: 500px; margin: 0 auto;">
                    ${getScoreMessage(scoreClass)}
                </p>
            </div>

            <h3 class="section-title"><i data-lucide="pie-chart"></i> Impact Breakdown</h3>
            <div class="breakdown-grid">
                ${Object.keys(state.answerCategories).map(cat => `
                    <div class="breakdown-item">
                        <div class="breakdown-label">${cat}</div>
                        <div class="breakdown-val">${state.answerCategories[cat]} <span style="font-size:0.7em;color:var(--text-secondary)">kg</span></div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="glass-card">
            <h3 class="section-title" style="color: var(--accent-primary); border-bottom-color: var(--accent-primary);">
                <i data-lucide="sparkles"></i> Personalized Recommendations
            </h3>
            <div class="rec-list">
                ${generateRecommendations()}
            </div>
            
            <h3 class="section-title" style="color: #3b82f6; border-bottom-color: #3b82f6; margin-top: 3rem;">
                <i data-lucide="globe"></i> Offset Your Impact
            </h3>
            <div class="rec-list">
                ${generateOffsets()}
            </div>
        </div>
    `;

    return container;
}

// ==========================================================================
// Helpers
// ==========================================================================

function getScoreMessage(scoreClass) {
    if (scoreClass === 'low') return "Great job! Your footprint is lower than average. Keep prioritizing sustainable choices.";
    if (scoreClass === 'medium') return "You are around the average. There's definite room for improvement in key areas.";
    return "Your footprint is significantly higher than average. Small lifestyle changes can make a massive difference.";
}

function generateRecommendations() {
    let recsHTML = '';
    const cats = state.answerCategories;

    if (cats.transportation > 1000) {
        recsHTML += `
            <div class="rec-card">
                <div class="rec-icon"><i data-lucide="bus"></i></div>
                <div class="rec-content">
                    <h4>Switch Up Your Commute</h4>
                    <p>Your transport emissions are high. Try carpooling, e-biking, or taking public transit just 2 days a week to cut your commute emissions by 40%.</p>
                </div>
            </div>`;
    }

    if (cats.diet > 1500) {
        recsHTML += `
            <div class="rec-card">
                <div class="rec-icon"><i data-lucide="utensils-crossed"></i></div>
                <div class="rec-content">
                    <h4>Meatless Mondays</h4>
                    <p>A meat-heavy diet has a major impact. Replacing meat with plant-based alternatives a few times a week saves thousands of liters of water and cuts methane emissions.</p>
                </div>
            </div>`;
    }

    if (cats.energy > 1500) {
        recsHTML += `
            <div class="rec-card">
                <div class="rec-icon"><i data-lucide="lightbulb-off"></i></div>
                <div class="rec-content">
                    <h4>Home Energy Audit</h4>
                    <p>Switch to LED lighting, unplug phantom load devices, and consider checking your utility provider for a 'Green Energy' plan.</p>
                </div>
            </div>`;
    }

    if (cats.travel > 2000) {
         recsHTML += `
            <div class="rec-card">
                <div class="rec-icon"><i data-lucide="train"></i></div>
                <div class="rec-content">
                    <h4>Alternative Travel</h4>
                    <p>Frequent flights drive up footprints fast. For shorter trips, opt for trains. If you must fly, explore direct flights which are more fuel efficient.</p>
                </div>
            </div>`;
    }
    
    // Generic recommendation if score is somehow super low across the board
    if (recsHTML === '') {
        recsHTML += `
            <div class="rec-card">
                <div class="rec-icon"><i data-lucide="heart"></i></div>
                <div class="rec-content">
                    <h4>Advocate Mentorship</h4>
                    <p>You are already doing fantastic. Consider joining local community boards to advocate for better public transit or community solar projects.</p>
                </div>
            </div>`;
    }

    return recsHTML;
}

function generateOffsets() {
    return `
        <div class="rec-card offset">
            <div class="rec-icon"><i data-lucide="tree-deciduous"></i></div>
            <div class="rec-content">
                <h4>Support Reforestation</h4>
                <p>Invest in verified tree planting initiatives like <strong>One Tree Planted</strong> or <strong>Eden Reforestation Projects</strong>. These projects restore ecosystems and capture carbon long-term.</p>
                <a href="#" class="action-link" onclick="event.preventDefault();">Explore Projects <i data-lucide="arrow-right" style="width:16px;"></i></a>
            </div>
        </div>
        <div class="rec-card offset">
            <div class="rec-icon"><i data-lucide="wind"></i></div>
            <div class="rec-content">
                <h4>Renewable Infrastructure</h4>
                <p>Help fund solar and wind projects in developing nations through organizations like <strong>Gold Standard</strong> or <strong>Terrapass</strong>, displacing fossil-fuel dependence.</p>
                <a href="#" class="action-link" onclick="event.preventDefault();">Learn More <i data-lucide="arrow-right" style="width:16px;"></i></a>
            </div>
        </div>
    `;
}

// Boot application
init();
