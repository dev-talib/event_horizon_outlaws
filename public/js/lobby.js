window.onload = function() {
    // Fetch player information from the server session
    fetch('/playerInfo')
        .then(response => response.json())
        .then(data => {
            // If valid player and room info is found, proceed to join the room
            if (data.playerName && data.roomName) {
                const { playerName, roomName } = data;

                // Initialize socket connection with the session player and room info
                socket = io({ query: { playerName, roomName } });

                // Emit reconnectPlayer on load
                socket.emit('reconnectPlayer', { playerName, roomName });

                // Update UI with player and room info
                document.getElementById('room-info').textContent = `Room: ${roomName}, Player: ${playerName}`;

                // Listen for player list updates
                socket.on('updatePlayerList', (players) => {
                    const playerList = document.getElementById('player-list');
                    playerList.innerHTML = ''; // Clear the list
                    players.forEach((player) => {
                        const li = document.createElement('li');
                        li.textContent = player;
                        playerList.appendChild(li);
                    });
                });

                // Handle "exit lobby" button click
                document.getElementById('exit-lobby-btn').addEventListener('click', () => {
                    socket.emit('leaveRoom', { roomName, playerName });
                    window.location.href = '/staging';
                });

                // Listen for the "startGame" event and redirect to the game page
                socket.on('startGame', () => {
                    window.location.href = `/game.html?room=${encodeURIComponent(roomName)}&player=${encodeURIComponent(playerName)}`;
                });
            } else {
                // If no valid session info, redirect to staging page
                window.location.href = '/staging.html';
            }
        })
        .catch(error => {
            console.error('Error fetching player info:', error);
            window.location.href = '/staging.html'; // Redirect to staging on error
        });
};
