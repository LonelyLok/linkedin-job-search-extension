// Function to inject CSS
let injectedStyle: any = null;
let isFeatureEnabled = true;

function injectCSS() {
  if (!injectedStyle) {
    injectedStyle = document.createElement('style');
    injectedStyle.textContent = `
      .job-card-container.job-card-list--is-dismissed {
        display: none !important;
        visibility: hidden !important;
        height: 1px !important;
        overflow: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(injectedStyle);
  }
}

// Function to apply 'inert' attribute
function applyInert() {
  const dismissedCards = document.querySelectorAll(
    '.job-card-container.job-card-list--is-dismissed'
  );
  dismissedCards.forEach((card) => {
    card.setAttribute('inert', '');
    card.setAttribute('aria-hidden', 'true');
  });
}

function fullInject() {
  injectCSS();
  applyInert();
}

function removeCSS() {
  if (injectedStyle?.parentNode) {
    injectedStyle.parentNode.removeChild(injectedStyle);
    injectedStyle = null;
  }
}
function removeInert() {
  const dismissedCards = document.querySelectorAll(
    '.job-card-container.job-card-list--is-dismissed'
  );
  dismissedCards.forEach((card) => {
    card.removeAttribute('inert');
    card.removeAttribute('aria-hidden');
  });
}

function fullRemove() {
  removeCSS();
  removeInert();
}

// Function to check if we're on a LinkedIn job search page
function isJobSearchPage() {
  return window.location.href.includes('linkedin.com/jobs');
}

function updateFeatureState(enabled: boolean) {
  isFeatureEnabled = enabled;
  if (isFeatureEnabled) {
    fullInject();
  } else {
    fullRemove();
  }
}

// Main function to run our code
function main() {
  if (isJobSearchPage()) {
    if (isFeatureEnabled) {
      fullInject();
    }

    // Set up observer for future changes
    const observer = new MutationObserver(() => {
      if (isJobSearchPage() && isFeatureEnabled) {
        applyInert();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }
}

// Run main function when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}

// Listen for URL changes (LinkedIn uses client-side routing)
window.addEventListener('popstate', main);

chrome?.runtime?.onMessage.addListener((request, _sender, _sendResponse) => {
  if (request.action === 'toggleHideJobs') {
    updateFeatureState(request.hideJobs);
  }
});

chrome?.storage?.sync.get(['hideJobs'], (result) => {
  if (result.hideJobs !== undefined) {
    updateFeatureState(result.hideJobs);
  }
});
