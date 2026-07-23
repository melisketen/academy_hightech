// dashboard.js - Academy High Tech User Dashboard & Reader Matrix Environment
document.addEventListener('DOMContentLoaded', () => {

    // 1. Mock System Data Sources
    const catalogData = [
        { id: 'git-teams', title: 'Git for Teams', category: 'new', format: 'PDF/EPUB/JSON', pages: 180, lastPageRead: 42, chapters: ['Introduction to Versioning', 'Branching Frameworks', 'Continuous Build Hooks', 'Distributed Environments'] },
        { id: 'ai-native', title: 'AI-Native Loop Architectures', category: 'new', format: 'PDF/JSON', pages: 240, lastPageRead: 12, chapters: ['Neural Infrastructure', 'Vector Context Engineering', 'Agent Routing Strategy', 'Evaluation Pipelines'] },
        { id: 'python-data', title: 'Pragmatic Python Data Channels', category: 'popular', format: 'PDF', pages: 310, lastPageRead: 195, chapters: ['Stream Architecture', 'Concurrency Paradigms', 'DataFrame Validations', 'Production Deployments'] },
        { id: 'compiler-design', title: 'Modern Text Processing & bookMaker OSS', category: 'user', format: 'PDF/HTML', pages: 150, lastPageRead: 150, chapters: ['Ast Transformations', 'Markdown Extensions', 'PDF Typset Engines', 'Release Tag Operations'] }
    ];

    const operationalFeedLogs = [
        { timestamp: '10 mins ago', message: 'Git for Teams compiled successfully to release candidate v1.0.2.' },
        { timestamp: '2 hours ago', message: 'New Chapter layout added to AI-Native Loop Architectures.' },
        { timestamp: 'Yesterday', message: 'LaTeX template patch applied cleanly across Academic Textbooks index.' }
    ];

    // Global Session User Tracking State Simulation
    let currentUserSession = {
        username: 'john_doe_tech',
        memberIdNum: 'AHT-2026-994812-XF',
        subscriptionTier: 'Standard',
        activeReadingTarget: null,
        currentPageIndex: 1
    };

    // 2. DOM Selection Points
    const newReleaseContainer = document.getElementById('container-new');
    const popularContainer = document.getElementById('container-popular');
    const userContainer = document.getElementById('container-user');
    const activityStreamContainer = document.getElementById('dynamic-activity-stream');
    const searchInput = document.getElementById('dashboard-search');

    // 3. Render Catalog Systems
    function renderShelves(filterText = '') {
        // Clear targets
        newReleaseContainer.innerHTML = '';
        popularContainer.innerHTML = '';
        userContainer.innerHTML = '';

        catalogData.forEach(book => {
            if (filterText && !book.title.toLowerCase().includes(filterText.toLowerCase())) {
                return;
            }

            const progressPercent = Math.round((book.lastPageRead / book.pages) * 100);

            const cardHTML = `
        <div class="book-card">
          <div class="book-cover-placeholder">${book.title}</div>
          <h5 style="margin:0; font-size:1rem; font-family:var(--sans);">${book.title}</h5>
          <div style="font-size:0.75rem; color:var(--slate); font-family:var(--mono);">Formats: ${book.format}</div>
          
          <div style="margin-top:auto;">
            <div style="display:flex; justify-content:space-between; font-size:0.7rem; color:var(--slate); margin-bottom:4px;">
              <span>Progress</span>
              <span>${progressPercent}%</span>
            </div>
            <div style="width:100%; background:var(--slate-200); height:4px; border-radius:2px;">
              <div style="background:var(--teal); width:${progressPercent}%; height:100%;"></div>
            </div>
          </div>
          <button class="btn-primary open-book-trigger" data-id="${book.id}" style="padding:0.5rem; font-size:0.8rem; justify-content:center; margin-top:0.5rem;">Launch Core Reader</button>
        </div>
      `;

            if (book.category === 'new') newReleaseContainer.insertAdjacentHTML('beforeend', cardHTML);
            if (book.category === 'popular') popularContainer.insertAdjacentHTML('beforeend', cardHTML);
            if (book.category === 'user' || progressPercent > 0) userContainer.insertAdjacentHTML('beforeend', cardHTML);
        });

        attachReaderTriggers();
    }

    // 4. Activity Stream Feed Engine
    function renderActivityFeed() {
        if (!activityStreamContainer) return;
        activityStreamContainer.innerHTML = operationalFeedLogs.map(log => `
      <div class="feed-item">
        <div class="feed-meta">${log.timestamp}</div>
        <div style="margin-top:4px; color:var(--navy-soft);">${log.message}</div>
      </div>
    `).join('');
    }

    // 5. Native Dynamic Search Filtering
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderShelves(e.target.value);
        });
    }

    // 6. Subscription Matrix Modal Controller Actions
    const subModal = document.getElementById('subscription-modal');
    const triggerSubBtn = document.getElementById('trigger-sub-view');
    const closeSubBtn = document.getElementById('close-sub-modal');
    const checkoutGatewayRack = document.getElementById('checkout-gateway-rack');
    let selectedTierAllocation = '';

    if (triggerSubBtn && subModal) {
        triggerSubBtn.addEventListener('click', () => subModal.style.display = 'flex');
        closeSubBtn.addEventListener('click', () => {
            subModal.style.display = 'none';
            checkoutGatewayRack.style.display = 'none';
        });
    }

    document.querySelectorAll('.select-tier-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tierContainer = e.target.closest('.tier-card');
            selectedTierAllocation = tierContainer.getAttribute('data-tier');

            document.querySelectorAll('.tier-card').forEach(c => c.style.borderColor = 'var(--slate-200)');
            tierContainer.style.borderColor = 'var(--teal)';

            // Reveal embedded payment form section
            checkoutGatewayRack.style.display = 'block';
            checkoutGatewayRack.scrollIntoView({ behavior: 'smooth' });
        });
    });

    const paymentForm = document.getElementById('mock-payment-form');
    if (paymentForm) {
        paymentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('submit-payment-btn');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Verifying Gateway Auth...';

            setTimeout(() => {
                currentUserSession.subscriptionTier = selectedTierAllocation.toUpperCase();
                alert(`Payment Success! Your subscription has been updated to: ${currentUserSession.subscriptionTier}`);
                submitBtn.disabled = false;
                submitBtn.textContent = 'Process Authorization';
                subModal.style.display = 'none';
                checkoutGatewayRack.style.display = 'none';
            }, 1500);
        });
    }

    // 7. Core Interactive Reading Frame Controller Subsystems
    const fullscreenReader = document.getElementById('fullscreen-reader');
    const exitReaderBtn = document.getElementById('exit-reader-mode');
    const readerBookTitle = document.getElementById('reader-book-title');
    const readerTocContainer = document.getElementById('reader-toc');
    const pageContentDynamicBody = document.getElementById('page-content-dynamic-body');
    const pageCounterUi = document.getElementById('page-counter-ui');
    const progressPercentText = document.getElementById('progress-percent');
    const progressBarFill = document.getElementById('progress-bar-fill');

    // Asset Protection Elements
    const dynamicWatermarkText = document.getElementById('dynamic-watermark-text');
    const forensicInvisibleUid = document.getElementById('forensic-invisible-uid');

    function attachReaderTriggers() {
        document.querySelectorAll('.open-book-trigger').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const bookId = e.target.getAttribute('data-id');
                const bookObj = catalogData.find(b => b.id === bookId);
                if (bookObj) launchReaderView(bookObj);
            });
        });
    }

    function launchReaderView(book) {
        currentUserSession.activeReadingTarget = book;
        currentUserSession.currentPageIndex = book.lastPageRead;

        // Inject document metadata fields safely
        readerBookTitle.textContent = book.title;

        // Inject visual forensic and steganographic identification tokens
        dynamicWatermarkText.textContent = `academyhightech / member: ${currentUserSession.username} / context: ${currentUserSession.memberIdNum}`;
        forensicInvisibleUid.textContent = `HIDDEN-IDENTIFIER-HASH::${btoa(currentUserSession.memberIdNum + '-' + book.id)}`;

        // Build functional clickable Table of Contents layout structural components
        readerTocContainer.innerHTML = book.chapters.map((chap, idx) => `
      <div class="toc-item ${idx === 0 ? 'active' : ''}" data-target-page="${Math.round((book.pages / book.chapters.length) * idx) + 1}">
        CH ${idx + 1}: ${chap}
      </div>
    `).join('');

        document.querySelectorAll('.toc-item').forEach(item => {
            item.addEventListener('click', (e) => {
                document.querySelectorAll('.toc-item').forEach(i => i.classList.remove('active'));
                e.target.classList.add('active');
                currentUserSession.currentPageIndex = parseInt(e.target.getAttribute('data-target-page'));
                renderCurrentPageFrame();
            });
        });

        fullscreenReader.style.display = 'grid';
        renderCurrentPageFrame();
    }

    function renderCurrentPageFrame() {
        const book = currentUserSession.activeReadingTarget;
        if (!book) return;

        // Enforce layout constraints safety checks dynamically
        if (currentUserSession.currentPageIndex < 1) currentUserSession.currentPageIndex = 1;
        if (currentUserSession.currentPageIndex > book.pages) currentUserSession.currentPageIndex = book.pages;

        // Track state metrics 
        book.lastPageRead = currentUserSession.currentPageIndex;
        const progressVal = Math.round((book.lastPageRead / book.pages) * 100);

        // Update navigation feedback indicators
        pageCounterUi.textContent = `Page ${book.lastPageRead} of ${book.pages}`;
        progressPercentText.textContent = `${progressVal}%`;
        progressBarFill.style.width = `${progressVal}%`;

        // Render simulated content markup 
        pageContentDynamicBody.innerHTML = `
      <h2 style="font-family:var(--display); margin-bottom:1.5rem;">Document Stream Segment Framework</h2>
      <p style="margin-bottom:1.5rem; font-size:1.1rem; line-height:1.8;">
        This page represents an active viewport into <strong>${book.title}</strong>, calibrated for rendering at high typesetting standards. All operations are being routed via our <code>bookMaker</code> processing engine context pipelines.
      </p>
      <div style="background:var(--paper-soft); padding:1rem; border-left:4px solid var(--teal); font-family:var(--mono); font-size:0.85rem; margin-bottom:1.5rem;">
        // Technical Runtime Node Snapshot<br>
        Current Buffer Page Offset: ${book.lastPageRead}<br>
        Identity Payload Vector Signature Verification: Validated
      </div>
      <p style="font-size:1.1rem; line-height:1.8;">
        The visual text elements display crisp rendering parameters, utilizing system-assigned variable line metrics to match specific high-density print constraints layout environments cleanly.
      </p>
    `;
    }

    // Page flipping handlers
    document.getElementById('prev-page-btn').addEventListener('click', () => {
        currentUserSession.currentPageIndex--;
        renderCurrentPageFrame();
    });

    document.getElementById('next-page-btn').addEventListener('click', () => {
        currentUserSession.currentPageIndex++;
        renderCurrentPageFrame();
    });

    if (exitReaderBtn) {
        exitReaderBtn.addEventListener('click', () => {
            fullscreenReader.style.display = 'none';
            renderShelves(); // Refresh dashboard view percentages
        });
    }

    // Initialize runtime execution states
    renderShelves();
    renderActivityFeed();
});