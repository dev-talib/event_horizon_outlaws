// Global variables to store username and lobby code
let username = '';
let lobbyCode = '';

const joinLobbyButton = document.getElementById('joinLobbyButton');
const usernameInput = document.getElementById('username');
const lobbyCodeInput = document.getElementById('lobbyCode');
const statusElement = document.getElementById('status');

// Event listener for "Join or Create Lobby" button
joinLobbyButton.addEventListener('click', () => {
    const usernameInputValue = usernameInput.value.trim();
    const lobbyCodeInputValue = lobbyCodeInput.value.trim();

    // Validate username
    if (!usernameInputValue) {
        alert("Please enter a username.");
        return;
    }

    // Store the username and lobby code globally
    username = usernameInputValue;
    lobbyCode = lobbyCodeInputValue;

    // Emit the "joinLobby" event to the server
    console.log("EVENT JOIN LOBBY");

    // Emit the event to join a lobby (whether creating a new one or joining an existing one)
    socket.emit('joinLobby', { username, lobbyCode });

    // Disable the button while waiting for a response
    joinLobbyButton.disabled = true;

    // Clear any previous status messages
    statusElement.innerText = '';

    // Wait for server response
    socket.once('lobbyJoined', (response) => {
        if (response.success) {
            // Display the lobby code and player list
            navigateTo('lobby');
        } else {
            // Show an error message if the lobby join failed
            statusElement.innerText = response.message || 'Error joining the lobby.';
        }

        // Re-enable the button
        joinLobbyButton.disabled = false;
    });
});

