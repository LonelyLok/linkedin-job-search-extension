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
// function buttonListener(type: string) {
//   const buttons = document.querySelectorAll('.job-card-container__action');
//   buttons.forEach((button) => {
//     button.removeEventListener('click', selectNextNonHiddenJob);
//     if (type === 'add') {
//       button.addEventListener('click', selectNextNonHiddenJob);
//     }
//   });
// }

function applyInert() {
  const dismissedCards = document.querySelectorAll(
    '.job-card-container.job-card-list--is-dismissed'
  );
  dismissedCards.forEach((card) => {
    card.setAttribute('inert', '');
    card.setAttribute('aria-hidden', 'true');
  });
  // buttonListener('add');
}

function fullInject() {
  injectCSS();
  applyInert();
}

function selectNextNonHiddenJob() {
  const jobCards = document.querySelectorAll('.job-card-container')
  const currentSelectedJob = document.querySelector(
    '.jobs-search-results-list__list-item--active'
  );
  const currentJobId = (currentSelectedJob as any)?.dataset?.jobId;
  const allJobIds = Array.from(jobCards).map((job: any) => job?.dataset?.jobId);

  const isCurrentJobDismissed = !!currentSelectedJob?.classList.contains('job-card-list--is-dismissed');

  if (isCurrentJobDismissed) {
    const startIndex = currentJobId
      ? allJobIds.indexOf(currentJobId)
      : -1;

    for (let i = startIndex + 1; i < jobCards.length; i++) {
      const job = jobCards[i] as HTMLElement;
      if (!job.classList.contains('job-card-list--is-dismissed')) {
        job.click();
        job.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }
  }
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
  // buttonListener('remove');
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
    const observer = new MutationObserver((mutations:any) => {
      if (isJobSearchPage() && isFeatureEnabled) {
        const relevantMutations = mutations.filter((mutation:any) => {
          const target = mutation.target as HTMLElement;
          return target.classList?.contains('job-card-container__action');
        });
        const buttonIds = relevantMutations.map((mutation:any)=>mutation.target).filter((i:any)=>!!i).map((i:any)=>i.id)

        const isUnique = !!(new Set(buttonIds).size === 1)

        if(isUnique){
          selectNextNonHiddenJob();
        }
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

chrome?.storage?.local.get(['hideJobs'], (result) => {
  if (result.hideJobs !== undefined) {
    updateFeatureState(result.hideJobs);
  }
});
