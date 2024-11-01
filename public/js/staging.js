document.getElementById('join-button').addEventListener('click', () => {
    const playerName = document.getElementById('player-name').value;
    const roomName = document.getElementById('room-name').value;

    if (playerName && roomName) {
        // Send a POST request to the join-room endpoint
        fetch('/join-room', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ playerName, roomName }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.redirectUrl) {
                // Initialize the socket
                socket = io({
                    query: {
                        playerName: playerName,
                        roomName: roomName
                    }
                });

                // Emit the joinRoom event after connecting to the socket
                socket.emit('joinRoom', {
                    playerName: data.playerName,
                    roomName: data.roomName,
                    socketId: socket.id  // Send socket ID for possible reconnections
                });

                // Store the socket ID in sessionStorage (optional)
                sessionStorage.setItem('socketId', socket.id);

                // Redirect to the lobby page
                window.location.href = data.redirectUrl;
            } else {
                alert('Failed to join the room. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    } else {
        alert('Please enter both player name and room name.');
    }
});
