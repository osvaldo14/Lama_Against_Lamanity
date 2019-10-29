"use strict";
exports.room = (()=>{

    let name;
    let io; // socket
    let playersPerRoom; // max number of players in the room
    let players = []; // players in the room



	function init( newIO, nb, roomName ){
        setIO(newIO);
        setPlayersPerRoom(nb);
	    setName( roomName );
	}

    // Set name
    function setName( newName ){
	    name = newName;
    }

	//Set io
    function setIO(newIO){
        io = newIO;
    }

	//Set max number of players per room
    function setPlayersPerRoom( nb ){
        playersPerRoom = nb;
    }

	//Compte le nombre de joueurs dans une room
    function getRoomPlayersNumber( roomName ){
        let room = io.sockets.adapter.rooms[roomName];
        return (room === undefined)? 0 : room.length;
    }

	//Join room
	//Return true if joining was successfull
    function joinRoom(socket, roomName){
        if (getRoomPlayersNumber(roomName) < playersPerRoom){
            socket.join(roomName);
            socket.room = roomName;
            return true;
        }
        return false
    }

	//checks if room is full
    function isFull(roomName){
        return getRoomPlayersNumber(roomName) === playersPerRoom;
    }

    // returns players list
    function getPlayers(){
	    return players;
    }


	return {
		init:		        function(newIO, nb, roomName){ init(newIO, nb, roomName) },
		getPlayersNb:       function(){ getRoomPlayersNumber() },
		setPlayersPerRoom:  function( nb ){ setPlayersPerRoom( nb ) },
		setIO:              function( newIO ){ setIO( newIO ) },
		joinRoom:           function( socket, roomName ){ joinRoom( socket, roomName ) },
		isFull:             function(){ isFull() },
		getPlayers:            function(){ getPlayers() }

	}


})();

