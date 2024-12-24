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

// Function to display countdown and navigate to the game page after 5 seconds
function startCountdownAndNavigate() {
    let countdown = 5;
    const countdownElement = document.createElement('div');
    countdownElement.style.position = 'fixed';
    countdownElement.style.top = '50%';
    countdownElement.style.left = '50%';
    countdownElement.style.transform = 'translate(-50%, -50%)';
    countdownElement.style.fontSize = '30px';
    countdownElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    countdownElement.style.color = 'white';
    countdownElement.style.padding = '20px';
    countdownElement.style.borderRadius = '10px';
    countdownElement.innerHTML = `Game starting in ${countdown}...`;
    document.body.appendChild(countdownElement);

    // Update the countdown every second
    const timerInterval = setInterval(() => {
        countdown -= 1;
        countdownElement.innerHTML = `Game starting in ${countdown}...`;

        if (countdown <= 0) {
            clearInterval(timerInterval);
            document.body.removeChild(countdownElement); // Remove countdown after timer ends

            // Navigate to the 'game' page after 5 seconds
            navigateTo('game');
        }
    }, 1000);
}

// Listen for when the lobby is updated (players joining/leaving)
socket.on('lobbyUpdate', (players) => {
    console.log("***lobbyUpdate***", players);
    updatePlayerList(players); // Update player list with the received data
});

// // Listen for when the game is starting
// socket.on('gameStart', (data) => {
//     alert(data.message);
//     navigateTo('game');
// });

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


// Listen for when the game is starting
socket.on('startGame', (data) => {
    console.log('gameStart event from backend',data)
    // Start the countdown and navigate after 5 seconds
    startCountdownAndNavigate();
});