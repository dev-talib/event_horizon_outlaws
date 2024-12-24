// Function to update the player list in the lobby
function updatePlayerList(players) {
    console.log("***updatePlayerList***", players);
    const playerListElement = document.querySelector('.player-list');
    playerListElement.innerHTML = ''; // Clear previous list

    if (players.length > 0) {
        players.forEach(player => {
            const playerItem = document.createElement('div');
            playerItem.classList.add('player-item');
            playerItem.textContent = player.username; // Display player username
            playerListElement.appendChild(playerItem);
        });
    } else {
        playerListElement.innerHTML = '<div class="player-item">No players joined yet...</div>';
    }
}

// Function to show current user's username and lobby code
function displayLobbyDetails(data) {
    if (data.success) {
        // Display the lobby code and player list
        document.getElementById('lobbyCode').textContent = `Lobby Code: ${data.lobbyCode}`;
        document.getElementById('usernameDisplay').textContent = `Username: ${data.username}`;
    } else {
        alert(data.message || 'Error joining the lobby.');
    }
}

// Listen for when the lobby is updated (players joining/leaving)
socket.on('lobbyUpdate', (players) => {
    console.log("***lobbyUpdate***", players);
    updatePlayerList(players); // Update player list with the received data
});

// Listen for when the game is starting
socket.on('gameStart', (data) => {
    alert(data.message);
    // Optionally, redirect the user to the game view after starting
    navigateTo('game');
});

// Handle game start error (e.g., not enough players)
socket.on('gameStartError', (data) => {
    alert(data.message);
});

// Listen for lobby details (including lobby code and current player's username)
socket.on('lobbyDetails', (data) => {
    if (data.success) {
        console.log(data);
        console.log('Reconnected to lobby:', data.lobbyCode);
        displayLobbyDetails(data);  // Implement this to update the UI
        updatePlayerList(data.players);
    } else {
        console.error('Failed to load lobby details:', data.message);
    }
});

// Emit the event to load lobby details when reconnecting or initially connecting
socket.emit('loadLobbyDetails');

