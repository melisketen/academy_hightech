// bookMaker Pipeline Terminal Emulator & Flow Simulator
document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // 1. Homepage Terminal Compilation Emulator
  // ==========================================
  const termBody = document.getElementById('terminal-content');
  if (termBody) {
    const compileLogs = [
      { type: 'input', text: 'bookmaker compile --book git-for-teams --version 1.0.1' },
      { type: 'output', text: 'Initializing bookMaker production pipeline (v2.4.0)...' },
      { type: 'output', text: 'Loading bookMaker.config.json configurations...' },
      { type: 'output', text: 'Checking companion repository: github.com/academyhightech/git-for-teams' },
      { type: 'output', text: 'Resolving commits... active release branch [v1.0.1]' },
      { type: 'output', text: '----------------------------------------', bold: true },
      { type: 'output', text: 'STAGE 1/6: Markdown parsing & structuring...', bold: true },
      { type: 'output', text: 'Found 12 chapters, 180 total pages. Checking syntax structures...' },
      { type: 'output', text: 'Parsed 42 markdown anchors. References verified.' },
      { type: 'output', text: 'STAGE 2/6: Code block extraction & validation...', bold: true },
      { type: 'output', text: 'Extracted 65 code chunks (bash: 24, gitconfig: 8, yaml: 33).' },
      { type: 'output', text: 'Running tests on chapter 3 repository hooks...' },
      { type: 'output', text: '✓ Hook validation: pre-commit syntax parser verified.', success: true },
      { type: 'output', text: '✓ GitHub Actions workflow validation output: SUCCESS.', success: true },
      { type: 'output', text: 'STAGE 3/6: Linting & verification gates...', bold: true },
      { type: 'output', text: 'Checking spelling against technical dictionary (en_US)...' },
      { type: 'output', text: 'Checking url references for anchor rot...' },
      { type: 'output', text: '✓ 12 urls verified. No redirects or 404s found.', success: true },
      { type: 'output', text: 'STAGE 4/6: Layout compile (Pandoc -> LaTeX)...', bold: true },
      { type: 'output', text: 'Compiling fonts: Fraunces (serif), Inter (sans), JetBrains Mono (mono).' },
      { type: 'output', text: 'Generating index arrays, glossary, and errata references...' },
      { type: 'output', text: 'Writing output buffers to final LaTeX file...' },
      { type: 'output', text: 'STAGE 5/6: Document generation targets...', bold: true },
      { type: 'output', text: 'Compiling target PDF: git-for-teams-v1.0.1.pdf (8.2MB)' },
      { type: 'output', text: 'Compiling target EPUB: git-for-teams-v1.0.1.epub (2.4MB)' },
      { type: 'output', text: 'Compiling target JSON: git-for-teams-errata-v1.0.1.json (12KB)' },
      { type: 'output', text: 'STAGE 6/6: Distribution and tagging...', bold: true },
      { type: 'output', text: 'Pushed release tags to repository.' },
      { type: 'output', text: 'Synced public changelog records.' },
      { type: 'output', text: '----------------------------------------', bold: true },
      { type: 'output', text: 'Compilation SUCCESS. bookMaker finished in 4.82 seconds.', success: true, bold: true },
      { type: 'output', text: 'Distribution targets written to: /dist/git-for-teams/v1.0.1/' }
    ];

    let logIndex = 0;
    
    function appendTerminalLine() {
      if (logIndex >= compileLogs.length) {
        // Wait, then loop the animation
        setTimeout(() => {
          termBody.innerHTML = '';
          logIndex = 0;
          appendTerminalLine();
        }, 8000);
        return;
      }

      const log = compileLogs[logIndex];
      const line = document.createElement('div');
      line.className = 'terminal-line';
      
      if (log.type === 'input') {
        line.innerHTML = `
          <span class="terminal-prompt">$</span>
          <span class="terminal-input">${log.text}<span class="cursor-blink"></span></span>
        `;
        termBody.appendChild(line);
        logIndex++;
        // Allow user to see "typing" delay before outputs begin
        setTimeout(appendTerminalLine, 1200);
      } else {
        // Outputs
        // Remove previous cursor
        const previousCursor = termBody.querySelector('.cursor-blink');
        if (previousCursor) previousCursor.remove();
        
        let classStr = 'terminal-output';
        if (log.success) classStr += ' success';
        if (log.warning) classStr += ' warning';
        if (log.bold) classStr += ' bold';
        
        line.innerHTML = `<span class="${classStr}">${log.text}</span>`;
        termBody.appendChild(line);
        
        // Auto scroll terminal to bottom
        termBody.scrollTop = termBody.scrollHeight;
        
        logIndex++;
        // Shorter delay for subsequent log entries
        const delay = log.text.includes('STAGE') ? 800 : (log.text.includes('---') ? 200 : 150);
        setTimeout(appendTerminalLine, delay);
      }
    }

    // Trigger emulator loop
    appendTerminalLine();
  }

  // ==========================================
  // 2. Author Profile bookMaker Step Simulator
  // ==========================================
  const steps = document.querySelectorAll('.pipeline-step');
  const detailsTitle = document.getElementById('pipeline-details-title');
  const detailsBody = document.getElementById('pipeline-details-body');
  const runDemoBtn = document.getElementById('run-pipeline-demo');
  const demoConsole = document.getElementById('pipeline-demo-console');

  const stepDescriptions = {
    1: {
      title: 'Stage 1: Markdown Structuring & Frontmatter Parsing',
      body: '<p>The pipeline parses semantic book structures from Markdown files. It validates frontmatter schemas (e.g. authors, versions, and dependencies), processes header hierarchies, and indexes cross-references automatically.</p><p>This guarantees that page outlines remain logically consistent and no internal hyperlinks are broken.</p>'
    },
    2: {
      title: 'Stage 2: Code Validation & Compile Verification',
      body: '<p>Every block of code inside the book is extracted and compiled against local compilers or runtime engines. If the book contains a Python snippet, it runs in an isolated sandbox. If it references a Git command, the sequence is executed in a mock repository to verify command results.</p><p><strong>Zero placeholder code:</strong> If a syntax or runtime error occurs, the book build fails instantly.</p>'
    },
    3: {
      title: 'Stage 3: Linting & Reference Verification',
      body: '<p>Runs custom linting gates to verify spellings, grammar structures, formatting rules, and checks external hyperlink references to prevent link rot.</p><p>Links are actively pinged. Redirects and 404 targets block building, ensuring companion site references remain fully operational.</p>'
    },
    4: {
      title: 'Stage 4: LaTeX Compile & Layout Typesetting',
      body: '<p>Utilizing custom LaTeX and Pandoc wrappers, the text is typeset into beautiful book spreads. Custom typography (Fraunces and Inter headers), geometric grid margins, index sheets, and glossary entries are calculated and baked into the PDF layouts.</p>'
    },
    5: {
      title: 'Stage 5: Packaging & Asset Generation',
      body: '<p>Constructs and optimizes distribution files: highly optimized PDFs (with clickable index links), EPUB files for mobile ereaders, and JSON datasets containing errata logs and tagged changelogs for indexing engines.</p>'
    },
    6: {
      title: 'Stage 6: Tagged Distribution & CI Integration',
      body: '<p>The compiled targets are tagged using Semantic Version rules and deployed. Pushes are made directly to GitHub Releases, the companion repo tag log is updated, and email subscribers are queued for notifications about the update.</p>'
    }
  };

  if (steps.length > 0 && detailsTitle && detailsBody) {
    steps.forEach(step => {
      step.addEventListener('click', () => {
        // Toggle active classes
        steps.forEach(s => s.classList.remove('active'));
        step.classList.add('active');
        
        const num = step.getAttribute('data-step');
        const data = stepDescriptions[num];
        
        if (data) {
          detailsTitle.innerHTML = data.title;
          detailsBody.innerHTML = data.body;
        }
      });
    });
  }

  // Interactive Live Compiler Demo
  if (runDemoBtn && demoConsole) {
    const demoOutputs = [
      { text: '> Initiating bookMaker test build...', color: '#14B8A6' },
      { text: '> Checking markdown content files... 12/12 loaded' },
      { text: '> Scanning code examples for compiler checks...' },
      { text: '> Compile: python data_check.py -> SUCCESS', color: '#10B981' },
      { text: '> Compile: npm run build-auth -> SUCCESS', color: '#10B981' },
      { text: '> Check links: github.com/academyhightech -> 200 OK' },
      { text: '> Running LaTeX typesetting processes...' },
      { text: '> Output created: /dist/git-for-teams-test.pdf' },
      { text: '> Pipeline result: SUCCESS (Zero warnings)', color: '#10B981', bold: true }
    ];

    runDemoBtn.addEventListener('click', () => {
      runDemoBtn.disabled = true;
      runDemoBtn.textContent = 'Running Compiler...';
      demoConsole.innerHTML = '';
      
      let index = 0;
      function runLog() {
        if (index >= demoOutputs.length) {
          runDemoBtn.textContent = 'Run bookMaker Demo';
          runDemoBtn.disabled = false;
          return;
        }
        
        const log = demoOutputs[index];
        const line = document.createElement('div');
        line.style.marginBottom = '4px';
        line.style.fontSize = '0.78rem';
        if (log.color) line.style.color = log.color;
        if (log.bold) line.style.fontWeight = 'bold';
        line.textContent = log.text;
        
        demoConsole.appendChild(line);
        demoConsole.scrollTop = demoConsole.scrollHeight;
        
        index++;
        setTimeout(runLog, 400);
      }
      
      runLog();
    });
  }
});
