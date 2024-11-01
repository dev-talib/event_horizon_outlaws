window.onload = function() {
    fetch('/playerInfo')
    .then(response => response.json())
    .then(data => {
        if (data.playerName && data.roomName) {
            const { playerName, roomName } = data;

            // Reconnect with stored socket ID (if available)
            const storedSocketId = sessionStorage.getItem('socketId');
            socket = io({ query: { playerName, roomName } });

            if (socket) {
                // Reconnect and emit joinRoom with stored socketId (if exists)
                socket.emit('joinRoom', {
                    playerName,
                    roomName,
                    socketId: storedSocketId || socket.id  // Send stored or new socket ID
                });

                document.getElementById('room-info').textContent = `Room: ${roomName}, Player: ${playerName}`;

                socket.on('updatePlayerList', (players) => {
                    const playerList = document.getElementById('player-list');
                    playerList.innerHTML = '';  // Clear the list
                    players.forEach((player) => {
                        const li = document.createElement('li');
                        li.textContent = player;
                        playerList.appendChild(li);
                    });
                });
            } else {
                window.location.href = '/staging.html';  // Redirect if socket fails
            }
        } else {
            window.location.href = '/staging.html';  // Redirect if player info is missing
        }
    })
    .catch(error => {
        console.error('Error fetching player info:', error);
        window.location.href = '/staging.html';
    });
};
