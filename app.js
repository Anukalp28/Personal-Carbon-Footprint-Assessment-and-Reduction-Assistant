// ==========================================================================
// Application State & Data
// ==========================================================================

const state = {
    currentView: 'landing', // 'landing', 'questionnaire', 'results', 'manual-entry'
    currentQuestionIndex: 0,
    answers: {}, // { questionId: selectedOptionImpactValue }
    answerCategories: {}, // { categoryName: accumulatedValue }
    user: null
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
    dashboardBtn: document.getElementById('dashboard-nav-btn'),
    logo: document.querySelector('.logo'),
    signinBtn: document.getElementById('signin-nav-btn'),
    signoutBtn: document.getElementById('signout-nav-btn'),
    userProfile: document.getElementById('user-profile'),
    userAvatar: document.getElementById('user-avatar-icon')
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

    if (DOM.dashboardBtn) {
        DOM.dashboardBtn.addEventListener('click', () => {
            window.location.hash = '#dashboard';
        });
    }

    if (DOM.signinBtn) {
        DOM.signinBtn.addEventListener('click', openAuthModal);
    }

    if (DOM.signoutBtn) {
        DOM.signoutBtn.addEventListener('click', () => {
            state.user = null;
            updateAuthUI();
        });
    }
}

function handleRoute() {
    const hash = window.location.hash.slice(1) || 'landing';

    // Only allow valid views
    if (['landing', 'questionnaire', 'results', 'manual-entry', 'dashboard', 'solutions', 'about-us'].includes(hash)) {
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
    if (state.currentView === 'landing' || state.currentView === 'results' || state.currentView === 'dashboard' || state.currentView === 'solutions' || state.currentView === 'about-us') {
        DOM.navBtn.style.display = 'block';
        DOM.navBtn.textContent = 'Start Assessment';
    } else {
        DOM.navBtn.style.display = 'none';
    }

    switch (state.currentView) {
        case 'landing':
            DOM.main.appendChild(createLandingView());
            break;
        case 'dashboard':
            DOM.main.appendChild(createDashboardView());
            break;
        case 'solutions':
            DOM.main.appendChild(createSolutionsView());
            break;
        case 'about-us':
            DOM.main.appendChild(createAboutUsView());
            break;
        case 'questionnaire':
            DOM.main.appendChild(createQuestionnaireView());
            break;
        case 'manual-entry':
            DOM.main.appendChild(createManualEntryView());
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
        <p class="landing-subtitle">Choose how you'd like to calculate your carbon footprint:</p>
        
        <div class="calculation-options" style="display: flex; gap: 1rem; justify-content: center; margin-bottom: 2rem; flex-wrap: wrap;">
            <button class="btn-primary" id="guided-btn" style="font-size: 1.1rem; padding: 1rem 2rem; display: flex; align-items: center; gap: 0.5rem;">
                <i data-lucide="list-checks"></i> Guided Assessment
            </button>
            <button class="btn-secondary" id="manual-btn" style="font-size: 1.1rem; padding: 1rem 2rem; display: flex; align-items: center; gap: 0.5rem;">
                <i data-lucide="calculator"></i> Manual Entry
            </button>
        </div>

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
        container.querySelector('#guided-btn').addEventListener('click', () => {
            resetState();
            window.location.hash = '#questionnaire';
        });
        container.querySelector('#manual-btn').addEventListener('click', () => {
            resetState();
            window.location.hash = '#manual-entry';
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


function createManualEntryView() {
    const container = document.createElement('div');
    container.className = 'manual-entry-view';

    container.innerHTML = `
        <div class="glass-card" style="margin: 0 auto;">
            <div class="question-header">
                <h2>Manual Energy Usage Entry</h2>
                <p>Enter your estimated annual usage for the following categories to calculate your footprint.</p>
            </div>
            <form id="manual-entry-form" class="manual-form">
                <div class="form-group">
                    <label>Transportation (Miles driven per year)</label>
                    <div class="input-with-icon">
                        <i data-lucide="car"></i>
                        <input type="number" id="manual-transport" placeholder="e.g., 10000" class="manual-input" required min="0">
                    </div>
                </div>
                <div class="form-group">
                    <label>Home Energy (kWh per year)</label>
                    <div class="input-with-icon">
                        <i data-lucide="zap"></i>
                        <input type="number" id="manual-energy" placeholder="e.g., 10500" class="manual-input" required min="0">
                    </div>
                </div>
                <div class="form-group">
                    <label>Flights (Hours flown per year)</label>
                    <div class="input-with-icon">
                        <i data-lucide="plane"></i>
                        <input type="number" id="manual-flights" placeholder="e.g., 10" class="manual-input" required min="0">
                    </div>
                </div>
                
                <div class="question-actions" style="margin-top: 2rem; justify-content: center;">
                    <button type="submit" class="btn-primary" style="font-size: 1.1rem; padding: 1rem 2rem; width: 100%; max-width: 300px;">
                        Calculate Results
                    </button>
                </div>
            </form>
        </div>
    `;

    setTimeout(() => {
        const form = container.querySelector('#manual-entry-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            // Basic generic calculations, mapping values to estimated kg CO2e
            const transportMiles = parseFloat(container.querySelector('#manual-transport').value) || 0;
            const transportImpact = Math.round(transportMiles * 0.404); // ~0.404 kg CO2 per mile driven

            const energyKwh = parseFloat(container.querySelector('#manual-energy').value) || 0;
            const energyImpact = Math.round(energyKwh * 0.385); // ~0.385 kg CO2 per kWh

            const flightsHours = parseFloat(container.querySelector('#manual-flights').value) || 0;
            const flightImpact = Math.round(flightsHours * 250); // ~250 kg CO2 per hour of flying

            // Set state categories directly (adding some average assumptions for un-entered items like Diet/Shopping)
            state.answerCategories = {
                transportation: transportImpact,
                energy: energyImpact,
                travel: flightImpact,
                diet: 1500, // Average kg
                shopping: 1000 // Average kg
            };

            // Set state answers to be total sum parts
            state.answers = {
                transport: transportImpact,
                energy: energyImpact,
                travel: flightImpact,
                diet: 1500,
                shopping: 1000
            };

            // Navigate to results
            window.location.hash = '#results';
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
                        <div class="breakdown-val">${state.answerCategories[cat]} <span style="font-size:0.7em;color:var(--text-secondary)">kg CO₂</span></div>
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

        <div style="text-align: center; margin-top: 2rem;">
            <button class="btn-primary" id="download-pdf-btn" style="font-size: 1.1rem; padding: 1rem 2rem; display: inline-flex; align-items: center; gap: 0.5rem;">
                <i data-lucide="download"></i> Download Report (PDF)
            </button>
        </div>
    `;

    setTimeout(() => {
        const downloadBtn = container.querySelector('#download-pdf-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', async () => {
                const originalText = downloadBtn.innerHTML;
                downloadBtn.innerHTML = 'Generating PDF...';
                downloadBtn.disabled = true;
                
                try {
                    const { jsPDF } = window.jspdf;
                    const doc = new jsPDF('p', 'mm', 'a4');
                    
                    // Target each card tile natively to prevent ambient background bleed
                    const cards = container.querySelectorAll('.glass-card');
                    
                    let currentY = 10; // Start 10mm from top
                    const pdfWidth = doc.internal.pageSize.getWidth();
                    const margin = 10;
                    
                    for (let i = 0; i < cards.length; i++) {
                        const card = cards[i];
                        
                        // Temporarily assign a solid dark slate background to the card.
                        // This prevents html2canvas from misinterpreting backdrop-filters
                        // or rendering dark transparent layers across the PDF.
                        const originalBg = card.style.background;
                        const originalBorder = card.style.border;
                        card.style.background = '#1a1a24';
                        card.style.border = '1px solid #2d2d3a';
                        
                        const canvas = await html2canvas(card, {
                            scale: 2,
                            backgroundColor: '#0a0a0c',
                            useCORS: true
                        });
                        
                        // Restore original web styling
                        card.style.background = originalBg;
                        card.style.border = originalBorder;
                        
                        const imgData = canvas.toDataURL('image/png');
                        const imgWidth = pdfWidth - (margin * 2);
                        const imgHeight = (canvas.height * imgWidth) / canvas.width;
                        
                        // If it exceeds the page height, create a new page natively instead of cutting it off
                        if (currentY + imgHeight > doc.internal.pageSize.getHeight() - margin) {
                            doc.addPage();
                            currentY = 10;
                        }
                        
                        doc.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight);
                        currentY += imgHeight + 10; // Add 10mm gap between tiles
                    }

                    doc.save('EcoTrack-Carbon-Report.pdf');
                } catch (err) {
                    console.error('Error generating PDF:', err);
                    alert('Could not generate PDF.');
                    downloadBtn.style.display = 'inline-flex';
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

function createDashboardView() {
    const container = document.createElement('div');
    container.className = 'dashboard-view';

    container.innerHTML = `
        <div class="dashboard-header">
            <h2>Welcome back, ${state.user ? state.user.name : 'User'}!</h2>
            <p style="color: var(--text-secondary);">Here is your personal EcoTrack dashboard.</p>
        </div>
        
        <div class="dashboard-grid">
            <div class="dash-card" id="dash-solutions-btn" style="cursor: pointer; border-color: var(--border-hover); background: rgba(59, 130, 246, 0.05);">
                <i data-lucide="lightbulb" class="dash-icon" style="color: #3b82f6;"></i>
                <h3 style="color: #3b82f6;">SOLUTIONS</h3>
                <p>Discover personalized strategies and technologies designed to minimize your environmental footprint.</p>
            </div>
            <div class="dash-card">
                <i data-lucide="layers" class="dash-icon"></i>
                <h3>OUR PLATFORMS</h3>
                <p>Explore tools and services integrated within EcoTrack for seamless tracking.</p>
            </div>
            <div class="dash-card" id="dash-calc-btn" style="cursor: pointer; border-color: var(--border-hover); background: rgba(16, 185, 129, 0.05);">
                <i data-lucide="calculator" class="dash-icon" style="color: var(--accent-primary);"></i>
                <h3 style="color: var(--accent-primary);">CALCULATORS</h3>
                <p>Use our advanced footprint and emissions calculators to assess your impact.</p>
            </div>
            <div class="dash-card">
                <i data-lucide="info" class="dash-icon"></i>
                <h3>INFORMATION</h3>
                <p>Read articles, research, and data regarding extreme climate shifts and sustainability.</p>
            </div>
            <div class="dash-card" id="dash-about-btn" style="cursor: pointer; border-color: var(--border-hover); background: rgba(16, 185, 129, 0.05);">
                <i data-lucide="users" class="dash-icon" style="color: var(--accent-primary);"></i>
                <h3 style="color: var(--accent-primary);">ABOUT US</h3>
                <p>Learn more about our mission, vision, and the team driving EcoTrack forward.</p>
            </div>
        </div>
    `;

    setTimeout(() => {
        container.querySelector('#dash-calc-btn').addEventListener('click', () => {
            resetState();
            window.location.hash = '#questionnaire';
        });
        const solBtn = container.querySelector('#dash-solutions-btn');
        if (solBtn) {
            solBtn.addEventListener('click', () => {
                window.location.hash = '#solutions';
            });
        }
        const aboutBtn = container.querySelector('#dash-about-btn');
        if (aboutBtn) {
            aboutBtn.addEventListener('click', () => {
                window.location.hash = '#about-us';
            });
        }
    }, 0);

    return container;
}

function createAboutUsView() {
    const container = document.createElement('div');
    container.className = 'about-us-view';
    // inline styles just for padding and width, similar to dashboard-view
    container.style = "width: 100%; max-width: 900px; margin: 2rem auto; padding: 0 1rem; animation: fadeIn 0.4s ease-out;";

    container.innerHTML = `
        <div class="dashboard-header">
            <h2><i data-lucide="globe" style="width: 36px; height: 36px; vertical-align: text-bottom; color: var(--accent-primary); margin-right: 0.5rem;"></i>About Us</h2>
            <p style="color: var(--text-secondary);">Personal Carbon Footprint Assessment & Reduction Assistant 🌱💡</p>
        </div>
        
        <div class="glass-card" style="margin-bottom: 2rem;">
            <p style="color: var(--text-primary); font-size: 1.1rem; line-height: 1.6; margin-bottom: 1rem;">
                Welcome to our smart web-based platform designed to help individuals <strong>understand, measure, and reduce</strong> their environmental impact.
            </p>
            <p style="color: var(--text-secondary); line-height: 1.6;">
                Our website calculates carbon emissions generated from daily activities such as 🚗 <strong>transportation</strong>, ⚡ <strong>energy consumption</strong>, 🥗 <strong>diet</strong>, 🛒 <strong>shopping</strong>, and ✈️ <strong>travel</strong>. With just a few inputs, users can discover how their lifestyle affects the planet <i data-lucide="globe" style="width: 16px; height: 16px; vertical-align: middle;"></i>.
            </p>
        </div>

        <div class="glass-card" style="margin-bottom: 2rem;">
            <h3 class="section-title" style="color: var(--accent-primary); border-bottom-color: var(--accent-primary);">
                🎯 Our Mission
            </h3>
            <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 1rem;">
                Our goal is simple yet powerful — to <strong>raise awareness about climate change</strong> 🌡️ and inspire people to adopt <strong>eco-friendly and sustainable habits</strong> ♻️.
            </p>
            <p style="color: var(--text-secondary); line-height: 1.6;">
                By providing <strong>accurate carbon estimates</strong> 📊 along with <strong>personalized suggestions</strong> 💡, we aim to guide users toward a <strong>greener, cleaner, and healthier future</strong> 🌿✨.
            </p>
        </div>

        <div class="glass-card" style="margin-bottom: 2rem;">
            <h3 class="section-title" style="color: var(--accent-primary); border-bottom-color: var(--accent-primary);">
                ⚙️ How It Works
            </h3>
            <ul style="color: var(--text-primary); line-height: 1.6; margin-left: 1.5rem; list-style-type: none;">
                <li style="margin-bottom: 0.5rem;">🔹 Users enter their daily activity data</li>
                <li style="margin-bottom: 0.5rem;">🔹 The system calculates their <strong>carbon footprint (kg CO₂)</strong></li>
                <li style="margin-bottom: 1rem;">🔹 Smart suggestions are provided to <strong>reduce emissions</strong></li>
            </ul>
            <p style="color: var(--accent-primary); font-style: italic; text-align: center; margin-top: 1rem;">
                👉 Measure ➝ Understand ➝ Improve 🌸
            </p>
        </div>

        <div class="glass-card" style="margin-bottom: 2rem;">
            <h3 class="section-title" style="color: var(--accent-primary); border-bottom-color: var(--accent-primary);">
                👨‍💻 Our Team
            </h3>
            <p style="color: var(--text-secondary); line-height: 1.6;">
                This project is developed by <strong>B.Tech (AI & ML) students</strong> 🎓 of <strong>Arka Jain University</strong> as part of an academic initiative focused on <strong>environmental sustainability <i data-lucide="globe" style="width: 16px; height: 16px; vertical-align: middle;"></i></strong> and <strong>innovation 💻</strong>.
            </p>
        </div>

        <div class="glass-card" style="margin-bottom: 2rem;">
            <h3 class="section-title" style="color: var(--accent-primary); border-bottom-color: var(--accent-primary);">
                🌱 Our Belief
            </h3>
            <p style="color: var(--text-secondary); line-height: 1.6;">
                We believe that <strong>small individual actions</strong> 🌼, when combined, can create <strong>big positive changes</strong> for our planet <i data-lucide="globe" style="width: 16px; height: 16px; vertical-align: middle;"></i> 💚.
            </p>
        </div>

        <div class="glass-card" style="margin-bottom: 2rem;">
            <h3 class="section-title" style="color: var(--accent-primary); border-bottom-color: var(--accent-primary);">
                🔮 Future Vision
            </h3>
            <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 1rem;">
                In the future, we plan to enhance this platform with:
            </p>
            <ul style="color: var(--text-primary); line-height: 1.6; margin-left: 1.5rem; list-style-type: none;">
                <li>✨ Real-time data tracking 📡</li>
                <li>📱 Mobile application integration</li>
                <li>🤖 AI-based smart recommendations</li>
            </ul>
            <p style="color: var(--text-secondary); line-height: 1.6; margin-top: 1rem;">
                to make the system more <strong>intelligent, efficient, and user-friendly</strong> 🚀.
            </p>
        </div>
        
        <p style="color: var(--accent-primary); font-size: 1.2rem; font-style: italic; text-align: center; margin: 3rem 0; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
            🌿 Together, let’s build a sustainable future! <i data-lucide="globe" style="width: 20px; height: 20px;"></i> 💚
        </p>

        <div style="text-align: center; margin-top: 2rem;">
            <button class="btn-outline" id="back-to-dashboard-btn" style="padding: 0.8rem 1.5rem;">
                <i data-lucide="arrow-left"></i> Back to Dashboard
            </button>
        </div>
    `;

    setTimeout(() => {
        container.querySelector('#back-to-dashboard-btn').addEventListener('click', () => {
            window.location.hash = '#dashboard';
        });
    }, 0);

    return container;
}

function createSolutionsView() {
    const container = document.createElement('div');
    container.className = 'solutions-view';
    // inline styles just for padding and width, similar to dashboard-view
    container.style = "width: 100%; max-width: 1200px; margin: 2rem auto; padding: 0 1rem; animation: fadeIn 0.4s ease-out;";

    container.innerHTML = `
        <div class="dashboard-header">
            <h2>UN Global Climate Solutions</h2>
            <p style="color: var(--text-secondary);">Core pillars and strategies based on the United Nations Framework</p>
        </div>
        
        <div class="glass-card" style="margin-bottom: 2rem;">
            <h3 class="section-title" style="color: var(--accent-primary); border-bottom-color: var(--accent-primary);">
                <i data-lucide="scissors"></i> 1. Cutting Emissions (Mitigation)
            </h3>
            <p style="color: var(--text-secondary); margin-bottom: 1rem;">
                Focuses on stopping the rise of greenhouse gases and limiting global temperature increase to 1.5°C.
            </p>
            <ul style="color: var(--text-primary); line-height: 1.6; margin-left: 1.5rem;">
                <li style="margin-bottom: 0.5rem;"><strong>Net Zero:</strong> Reaching a balance between greenhouse gases emitted and those removed from the atmosphere. This requires a 45% reduction in emissions by 2030 and net zero by 2050.</li>
                <li><strong>Scientific Urgency:</strong> Utilizing real-time scientific indicators to drive rapid decarbonization across all sectors, including transport, industry, and agriculture.</li>
            </ul>
        </div>

        <div class="glass-card" style="margin-bottom: 2rem;">
            <h3 class="section-title" style="color: var(--accent-primary); border-bottom-color: var(--accent-primary);">
                <i data-lucide="zap"></i> 2. Clean Energy Transition
            </h3>
            <p style="color: var(--text-secondary); margin-bottom: 1rem;">
                A massive shift from fossil fuels to renewable sources is the primary solution for a safer future.
            </p>
            <ul style="color: var(--text-primary); line-height: 1.6; margin-left: 1.5rem;">
                <li style="margin-bottom: 0.5rem;"><strong>Renewable Energy:</strong> Scaling up solar, wind, hydropower, and geothermal energy, which are now cheaper and more sustainable than coal and oil.</li>
                <li style="margin-bottom: 0.5rem;"><strong>Phase Out Coal & Subsidies:</strong> Ending the construction of new coal plants, phasing out existing ones, and redirecting trillions in fossil fuel subsidies to renewables.</li>
                <li><strong>Nature Restoration:</strong> Protecting forests and oceans as natural carbon sinks.</li>
            </ul>
        </div>

        <div class="glass-card" style="margin-bottom: 2rem;">
            <h3 class="section-title" style="color: var(--accent-primary); border-bottom-color: var(--accent-primary);">
                <i data-lucide="shield-alert"></i> 3. Adapting to Climate Change (Resilience)
            </h3>
            <p style="color: var(--text-secondary); margin-bottom: 1rem;">
                Since some climate impacts are already unavoidable, countries must build resilience to survive increasingly extreme weather.
            </p>
            <ul style="color: var(--text-primary); line-height: 1.6; margin-left: 1.5rem;">
                <li style="margin-bottom: 0.5rem;"><strong>Infrastructure Resilience:</strong> Building flood defenses, restoring mangroves, and developing drought-resistant crops.</li>
                <li><strong>Early Warnings for All:</strong> A UN initiative striving to protect every person on Earth with early warning systems by 2027 to save lives during disasters.</li>
            </ul>
        </div>

        <div class="glass-card" style="margin-bottom: 2rem;">
            <h3 class="section-title" style="color: var(--accent-primary); border-bottom-color: var(--accent-primary);">
                <i data-lucide="landmark"></i> 4. Financing Climate Action
            </h3>
            <p style="color: var(--text-secondary); margin-bottom: 1rem;">
                Finance is the "great enabler" that allows developing nations to bypass fossil-fuel-led growth.
            </p>
            <ul style="color: var(--text-primary); line-height: 1.6; margin-left: 1.5rem;">
                <li style="margin-bottom: 0.5rem;"><strong>Scaling Investment:</strong> Moving from billions to trillions in investments for both mitigation and adaptation.</li>
                <li><strong>Loss and Damage:</strong> Providing financial support to vulnerable nations already suffering from severe impacts.</li>
            </ul>
        </div>
        
        <div style="text-align: center; margin-top: 2rem;">
            <button class="btn-outline" id="back-to-dashboard-btn" style="padding: 0.8rem 1.5rem;">
                <i data-lucide="arrow-left"></i> Back to Dashboard
            </button>
        </div>
    `;

    setTimeout(() => {
        container.querySelector('#back-to-dashboard-btn').addEventListener('click', () => {
            window.location.hash = '#dashboard';
        });
    }, 0);

    return container;
}

function updateAuthUI() {
    // Keep Dashboard nav button permanently visible
    if (DOM.dashboardBtn) {
        DOM.dashboardBtn.style.display = 'block';
    }

    if (state.user) {
        DOM.signinBtn.style.display = 'none';
        DOM.userProfile.style.display = 'flex';
        DOM.userAvatar.textContent = state.user.name ? state.user.name.charAt(0).toUpperCase() : 'U';
    } else {
        DOM.signinBtn.style.display = 'block';
        DOM.userProfile.style.display = 'none';
    }
}

function openAuthModal() {
    let overlay = document.getElementById('auth-modal');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'auth-modal-overlay';
        overlay.id = 'auth-modal';
        overlay.innerHTML = `
            <div class="glass-card auth-modal-card">
                <button class="close-modal-btn" id="close-auth"><i data-lucide="x"></i></button>
                <div class="auth-header" style="text-align: center; margin-bottom: 2rem;">
                    <h2 id="auth-title">Welcome to EcoTrack</h2>
                    <p style="color: var(--text-secondary); margin-top: 0.5rem;" id="auth-subtitle">Sign in to continue</p>
                </div>
                
                <div class="auth-providers">
                    <button class="btn-provider google-provider" id="google-login-btn">
                        <img src="https:&#x2F;&#x2F;www.svgrepo.com/show/475656/google-color.svg" alt="Google" width="20" height="20">
                        Continue with Google
                    </button>
                </div>
                
                <div class="auth-divider">
                    <span>or sign in with email</span>
                </div>
                
                <form id="auth-form" class="auth-form" style="display: flex; flex-direction: column; gap: 1rem;">
                    <div class="form-group">
                        <label>Email Address</label>
                        <div class="input-with-icon">
                            <i data-lucide="mail"></i>
                            <input type="email" id="auth-email" class="manual-input" style="padding-left: 3.5rem;" placeholder="you@example.com" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <div class="input-with-icon">
                            <i data-lucide="lock"></i>
                            <input type="password" id="auth-password" class="manual-input" style="padding-left: 3.5rem;" placeholder="••••••••" required>
                        </div>
                    </div>
                    <button type="submit" class="btn-primary" style="width: 100%; margin-top: 1rem; padding: 0.8rem; font-size: 1.05rem;" id="auth-submit-btn">
                        Sign In
                    </button>
                </form>
                
                <p class="auth-footer" style="text-align: center; margin-top: 2rem; color: var(--text-secondary); font-size: 0.9rem;">
                    Don't have an account? <a href="#" id="toggle-auth-mode" style="color: var(--accent-primary); text-decoration: none; font-weight: 500;">Sign Up</a>
                </p>
            </div>
        `;
        document.body.appendChild(overlay);
        lucide.createIcons();

        // Listeners for Modal
        overlay.querySelector('#close-auth').addEventListener('click', closeAuthModal);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeAuthModal();
        });

        const form = overlay.querySelector('#auth-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = overlay.querySelector('#auth-email').value;
            // Mock Login Process
            state.user = { email: email, name: email.split('@')[0] };
            updateAuthUI();
            closeAuthModal();
        });

        overlay.querySelector('#google-login-btn').addEventListener('click', () => {
            // Mock Google Login
            state.user = { email: 'user@gmail.com', name: 'Google User' };
            updateAuthUI();
            closeAuthModal();
        });

        let isSignUp = false;
        overlay.querySelector('#toggle-auth-mode').addEventListener('click', function toggleMode(e) {
            e.preventDefault();
            isSignUp = !isSignUp;
            const title = overlay.querySelector('#auth-title');
            const submitBtn = document.getElementById('auth-submit-btn');
            const toggleText = overlay.querySelector('.auth-footer');
            if (isSignUp) {
                title.textContent = 'Create an Account';
                submitBtn.textContent = 'Sign Up';
                toggleText.innerHTML = 'Already have an account? <a href="#" id="toggle-auth-mode-inner" style="color: var(--accent-primary); text-decoration: none; font-weight: 500;">Sign In</a>';
            } else {
                title.textContent = 'Welcome to EcoTrack';
                submitBtn.textContent = 'Sign In';
                toggleText.innerHTML = "Don't have an account? <a href=\"#\" id=\"toggle-auth-mode-inner\" style=\"color: var(--accent-primary); text-decoration: none; font-weight: 500;\">Sign Up</a>";
            }
            // re-attach listener
            overlay.querySelector('#toggle-auth-mode-inner').addEventListener('click', toggleMode);
        });
    }
    overlay.style.display = 'flex';
}

function closeAuthModal() {
    const overlay = document.getElementById('auth-modal');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// Boot application
init();
