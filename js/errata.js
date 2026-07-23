// Interactive Errata Management
document.addEventListener('DOMContentLoaded', () => {
  const errataListContainer = document.getElementById('errata-list');
  if (!errataListContainer) return; // Only execute on pages that have the errata log

  const tabButtons = document.querySelectorAll('.tab-btn');
  const errataForm = document.getElementById('errata-report-form');
  
  // Default base errata list
  const defaultErrata = [
    {
      id: 1,
      page: 42,
      author: 'Lucas Vance',
      date: '2026-06-12',
      status: 'fixed',
      desc: 'Typo in section 2.3 header. It reads "Collablorative workflows" instead of "Collaborative workflows".',
      resolution: 'Fixed in v1.0.1. Updated repository markdown templates and printing pipeline configuration.'
    },
    {
      id: 2,
      page: 87,
      author: 'Sophia Chen',
      date: '2026-06-20',
      status: 'open',
      desc: 'The Git command <code>git checkout -b feature/auth</code> can be simplified to <code>git switch -c feature/auth</code> as per Git 2.23+ recommendations, matching other switch commands in chapter 4.',
      resolution: 'Scheduled for revision in v1.1.0 release branch.'
    },
    {
      id: 3,
      page: 112,
      author: 'Dr. Ahmet Yılmaz',
      date: '2026-07-02',
      status: 'fixed',
      desc: 'The GitHub Action configuration file on page 112 missing the <code>permissions:</code> scope header, causing an authentication error when writing deployment packages to the GitHub Packages registry.',
      resolution: 'Fixed in commit <code>8f7e2da</code> on companion repository. Patch tagged in v1.0.1.'
    }
  ];

  // Load errata items from localStorage or fallback to defaults
  function getErrata() {
    const local = localStorage.getItem('git_teams_errata');
    if (!local) {
      localStorage.setItem('git_teams_errata', JSON.stringify(defaultErrata));
      return defaultErrata;
    }
    return JSON.parse(local);
  }

  // Save errata to localStorage
  function saveErrata(errataArray) {
    localStorage.setItem('git_teams_errata', JSON.stringify(errataArray));
  }

  // Render errata based on active filter
  let currentFilter = 'all';
  
  function renderErrata() {
    const items = getErrata();
    errataListContainer.innerHTML = '';
    
    // Filter items
    const filtered = items.filter(item => {
      if (currentFilter === 'all') return true;
      return item.status === currentFilter;
    });

    if (filtered.length === 0) {
      errataListContainer.innerHTML = `
        <div style="text-align: center; padding: 2.5rem; color: var(--slate); font-family: var(--mono); font-size: 0.9rem;">
          No errata found in this section.
        </div>
      `;
      return;
    }

    // Sort by page number
    filtered.sort((a, b) => a.page - b.page);

    filtered.forEach(item => {
      const card = document.createElement('article');
      card.className = 'errata-item reveal in';
      
      const badgeText = item.status === 'fixed' ? 'Merged & Fixed' : (item.status === 'open' ? 'Open & Confirmed' : 'Proposed');
      const badgeClass = item.status;
      
      card.innerHTML = `
        <div class="errata-meta">
          <span class="errata-badge ${badgeClass}">${badgeText}</span>
          <span>Page ${item.page}</span>
          <span>Reported by ${item.author}</span>
          <span>${item.date}</span>
        </div>
        <p class="errata-desc">${item.desc}</p>
        ${item.resolution ? `
          <div class="errata-resolution">
            <strong>Resolution Log:</strong>
            ${item.resolution}
          </div>
        ` : ''}
      `;
      errataListContainer.appendChild(card);
    });
  }

  // Handle Tab Navigation Filtering
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.getAttribute('data-filter');
      renderErrata();
    });
  });

  // Handle Form Submissions
  if (errataForm) {
    errataForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Grab inputs
      const reporterInput = document.getElementById('errata-reporter');
      const pageInput = document.getElementById('errata-page');
      const descInput = document.getElementById('errata-desc-input');
      const emailInput = document.getElementById('errata-email');
      
      let isValid = true;
      
      // Validate Reporter Name
      if (!reporterInput.value.trim()) {
        showError(reporterInput, 'Reporter name is required.');
        isValid = false;
      } else {
        clearError(reporterInput);
      }

      // Validate Page Number
      const pageVal = parseInt(pageInput.value);
      if (isNaN(pageVal) || pageVal < 1 || pageVal > 250) {
        showError(pageInput, 'Enter a valid page number (1-250).');
        isValid = false;
      } else {
        clearError(pageInput);
      }

      // Validate Description
      if (descInput.value.trim().length < 10) {
        showError(descInput, 'Please provide a detailed description (min 10 chars).');
        isValid = false;
      } else {
        clearError(descInput);
      }

      // Validate Email
      const emailVal = emailInput.value.trim();
      if (!emailVal || !emailVal.includes('@')) {
        showError(emailVal ? emailInput : emailInput, 'Enter a valid email address.');
        isValid = false;
      } else {
        clearError(emailInput);
      }

      if (!isValid) return;

      // Add proposed item
      const currentList = getErrata();
      const newItem = {
        id: currentList.length + 1,
        page: pageVal,
        author: reporterInput.value.trim(),
        date: new Date().toISOString().split('T')[0],
        status: 'proposed',
        desc: escapeHTML(descInput.value.trim()),
        resolution: 'Report registered in public queue. Awaiting review by compiler build tools and Prof. İsmail Kırbaş.'
      };

      currentList.push(newItem);
      saveErrata(currentList);
      
      // Reset form
      errataForm.reset();

      // Show success feedback
      const submitBtn = errataForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = '✓ Submitted to Pipeline!';
      submitBtn.style.backgroundColor = 'var(--color-success)';
      submitBtn.style.color = '#FFFFFF';
      submitBtn.disabled = true;

      setTimeout(() => {
        submitBtn.textContent = originalText;
        submitBtn.style.backgroundColor = '';
        submitBtn.style.color = '';
        submitBtn.disabled = false;
        
        // Switch filter to 'proposed' and scroll to the new item
        const proposedTab = document.querySelector('[data-filter="proposed"]');
        if (proposedTab) {
          proposedTab.click();
        }
        
        // Scroll to errata board header
        document.getElementById('errata').scrollIntoView({ behavior: 'smooth' });
      }, 1500);
    });
  }

  // Error messaging helpers
  function showError(inputElement, msg) {
    const parent = inputElement.parentElement;
    parent.classList.add('has-error');
    let errorSpan = parent.querySelector('.error-msg');
    if (!errorSpan) {
      errorSpan = document.createElement('span');
      errorSpan.className = 'error-msg';
      errorSpan.style.color = 'var(--color-error)';
      errorSpan.style.fontSize = '0.75rem';
      errorSpan.style.display = 'block';
      errorSpan.style.marginTop = '0.25rem';
      errorSpan.style.fontFamily = 'var(--mono)';
      parent.appendChild(errorSpan);
    }
    errorSpan.textContent = msg;
    errorSpan.style.display = 'block';
    inputElement.style.borderColor = 'var(--color-error)';
  }

  function clearError(inputElement) {
    const parent = inputElement.parentElement;
    parent.classList.remove('has-error');
    const errorSpan = parent.querySelector('.error-msg');
    if (errorSpan) {
      errorSpan.style.display = 'none';
    }
    inputElement.style.borderColor = '';
  }

  function escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Initial draw
  renderErrata();
});
