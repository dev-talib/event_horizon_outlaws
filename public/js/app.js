const socket = io();

// Initialize the current view with a default value
let currentView = 'welcome';

// Function to load the content of a view from an external HTML file
function loadView(view) {
    const appContainer = document.getElementById('app');

    // Dynamically fetch the view HTML file based on the view name
    fetch(`views/${view}.html`)
        .then(response => response.text())
        .then(html => {
            appContainer.innerHTML = html;
            // After the view is loaded, load the corresponding JavaScript file
            loadViewScript(view);
        })
        .catch(error => {
            console.error('Error loading view:', error);
            appContainer.innerHTML = '<p>Error loading the view. Please try again later.</p>';
        });
}

// Function to dynamically load the corresponding JavaScript file for the view
function loadViewScript(view) {
    const script = document.createElement('script');
    script.src = `../js/${view}.js`;  // Path to the JavaScript file (same name as the view)
    script.type = 'module';  // Use module type if your JS files are ES Modules
    script.onload = () => {
        console.log(`${view} script loaded successfully.`);
    };
    script.onerror = (error) => {
        console.error(`Error loading ${view} script:`, error);
    };

    // Append the script to the document head to execute it
    document.head.appendChild(script);
}

// Handle the routing/navigation between views
function navigateTo(view) {
    if (view === 'welcome' || view === 'staging' || view === 'lobby' || view === 'game') {
        currentView = view;
        loadView(view);

        // Store the current view in sessionStorage to persist across page refreshes
        sessionStorage.setItem('currentView', view);

        // Update browser history state
        history.pushState({ view: view }, '', `#${view}`);
    }
}

// Initialize the app by loading the current view
function initApp() {
    // Retrieve the saved view from sessionStorage, default to 'staging' if none exists
    const savedView = sessionStorage.getItem('currentView');
    
    // If there is a saved view (either 'lobby' or 'game'), use it, otherwise fallback to 'staging'
    currentView = savedView && (savedView === 'lobby' || savedView === 'game') ? savedView : 'welcome';
    
    loadView(currentView);

    // Handle browser back/forward navigation
    window.addEventListener('popstate', function(event) {
        if (event.state && event.state.view) {
            currentView = event.state.view;
            loadView(currentView);
        }
    });
}

// Run the app initialization
initApp();

let beforeUnloadListener;

function preventWarningOnReload() {
    // Temporarily remove the beforeunload event listener to prevent the warning
    window.removeEventListener('beforeunload', beforeUnloadListener);
}

// Warning message for beforeunload
window.addEventListener('beforeunload', beforeUnloadListener = function(event) {
    const message = 'Refreshing the page will disconnect you from the game. Reconnection is not available yet!';
    event.returnValue = message;  // For most browsers
    handlePlayerDataAndRedirect();
    return message;  // For some older browsers
});

// Disable F5 and Ctrl+R (refresh) using keydown event
window.addEventListener('keydown', function(event) {
    // Disable F5 key (refresh)
    if (event.key === 'F5' || (event.ctrlKey && event.key === 'r')) {
        event.preventDefault();  // Stop the default refresh action
        alert('Refreshing the page will disconnect you from the game. Reconnection is not available yet!');
        handlePlayerDataAndRedirect();
    }
});

function handlePlayerDataAndRedirect() {
    loadView('welcome');
    sessionStorage.removeItem('lobbyDetails');
    sessionStorage.removeItem('currentView');
}

function restartGame() {
    // Prevent the warning message before reloading
    preventWarningOnReload();
    handlePlayerDataAndRedirect();
    window.location.reload();  
    // Reload the page to restart the game
}
