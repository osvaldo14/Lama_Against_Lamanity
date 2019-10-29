"use strict";

/*--------------------------------------------------------------*/
/*-------------------CONSTANTES ET VARIABLES--------------------*/
/*--------------------------------------------------------------*/

const express			= require('express');
const app				= express();
const http				= require('http').Server(app);
const io				= require('socket.io')(http);

const Cards				= require('./public/card.js');
const playCardsNb		= 8;	// Number of cards per player
const playersPerRoom	= 3;	// Number of players per room

const db 				= require('./db_functions.js');

//Données static
app.use(express.static('public'));
app.use(express.static('public/site_web'));


//Liste des joueurs et rooms

let rooms = {};
let players = {};

/*--------------------------------------------------------------*/
/*---------------------------ROUTING----------------------------*/
/*--------------------------------------------------------------*/

//Routing vers accueil du site
app.get('/', function(req,res){
	res.status(200).sendFile('main.html', {root: "public/site_web"});
});

app.get('/deck', function(req,res){
	res.status(200).sendFile('deck.html', {root : "public/site_web"});
});

app.get('/gamepage', function(req,res){
	res.status(200).sendFile('gamepage.html',{root : "public/site_web"});
});

app.get('/entername', function(req,res){
	res.status(200).sendFile('entername.html', {root : "public/site_web"});
});

app.get('/joinroom', function(req,res){
	res.status(200).sendFile('joinroom.html', {root : "public/site_web"});
});

app.get('/createDeck', function(req,res){
	res.status(200).sendFile('createDeck.html', {root : "public/site_web"});
});

app.get('/createRoom', function(req,res){
	res.status(200).sendFile('createRoom.html', {root : "public/site_web"});
});

/*--------------------------------------------------------------*/
/*--------------------------CONNEXION---------------------------*/
/*--------------------------------------------------------------*/

//Connexion IO
io.on('connection', function(socket){
	//console.log('a user connected :' + socket.id);
	//Si Deconnexion
	socket.on('disconnect', function(){
		//Enlever le joueur
		for(var p in players){
			if (players[p].socket.localeCompare(socket.id) === 0){delete players[p];}
		}
	});

	// on veut rejoindre une room
	socket.on('join', function(params) {

		// si la room n'existe pas
		if(!(params.roomName in rooms)){

			db.get_deck(params.deck_name).then(function(cards){

				rooms[params.roomName] = {
					playCardsNb		: 8,						// Number of cards per player
					playersPerRoom	: params.playersPerRoom,	// Number of players per room
					players			: [params.playerName],		// List of players
					playersDone		: 0,						// variables for running the game
					judgeIndex		: -1,
					playersChoice	: [],
					black_cards		: cards.black_cards,		// Deck of cards
					white_cards		: cards.white_cards
				};
			});
			
		} else {

			if( rooms[params.roomName].players.length < playersPerRoom ){
				rooms[params.roomName].players.push(params.playerName);
			} else {
				socket.emit('joinRes', 'the room is full !');
				return;
			}
		}

		// update liste des joueurs
		if(!(params.playerName in players)){
			players[params.playerName] = {
				room	: params.roomName,	// Room joined by the player
				socket	: socket.id			// The socket ID of the player
			};
		} else {
			socket.emit('joinRes', 'this name is already used !');
			return;
		}

		socket.join(params.roomName);
		socket.emit('joinRes', undefined);

	});

	socket.on('checkName', function( pName ){
		let playerName = pName.replace(/\+/g," ");
		if(!(playerName in players)){
			socket.emit('checkName', {res:true,pName:playerName});
		} else {
			socket.emit('checkName', false);
		}
	});


	//Nouveau joueur
	socket.on('new player', function( roomName ){
		//Rejoindre la room par défaut

			let Wcards 		= [];
			for(let i=0; i<playCardsNb; i++){
				Wcards.push(Cards.getRandomCard(rooms[roomName].white_cards));
			}
			socket.emit('startingPack',{
					cards		:	Wcards
			});
			//Si la room est complète, lancer le jeu
			if(rooms[roomName].players.length == playersPerRoom){
				var clients = io.sockets.adapter.rooms[roomName].sockets;
				io.to(roomName).emit("roundBegin", Cards.getRandomCard(rooms[roomName].black_cards));

				rooms[roomName].judgeIndex = (rooms[roomName].judgeIndex + 1) % playersPerRoom;
				console.log(players[rooms[roomName].players[rooms[roomName].judgeIndex]]);
				io.to(players[rooms[roomName].players[rooms[roomName].judgeIndex]].socket).emit("judgeReady");
			}
			/*
		}
		*/
	});

	socket.on("ready", function(){
		socket.emit("start");
	});
	
	//Quand le juge est prêt, prévenir les joueurs
	socket.on("judgeReady", function( room ){
		socket.to(room).emit("choiceBegin");
	});

	//Demande d'une carte blanche
	socket.on("whiteCard", function( room ){
		socket.emit("whiteCard", Cards.getRandomCard(rooms[room].white_cards));
	});

	//Début d'un nouveau round
	socket.on("choiceEnd",function(params){
		rooms[params.room].playersChoice.push(params.card);
		if (rooms[params.room].playersChoice.length === (playersPerRoom-1)){
			io.to(params.room).emit("judgementBegin", {judge : rooms[params.room].players[rooms[params.room].judgeIndex], playersChoices : rooms[params.room].playersChoice});
			rooms[params.room].playersChoice = [];
		}	
	});

	//Le juge a choisi sa carte, il faut prévenir les autres joueurs
	socket.on("judgementEnd", function(params){
		io.to(params.room).emit("judgeChoice", params.card);
	});

	//On veut que tout les joueurs aient fini leur round
	socket.on("roundEnd", function( room ){
		try{
			rooms[room].playersDone = (rooms[room].playersDone + 1) % playersPerRoom;
			if (rooms[room].playersDone === 0) {
				io.to(room).emit("roundBegin", Cards.getRandomCard(rooms[room].black_cards));
				rooms[room].judgeIndex = (rooms[room].judgeIndex + 1) % playersPerRoom

				console.log(players);
				io.to(players[rooms[room].players[rooms[room].judgeIndex]].socket).emit("judgeReady");
			}
		} catch( err ){

		}
	});

	//Fin de la partie
	socket.on("victory",function( room ){
		socket.to(room).emit("defeat");
		delete rooms[room];

	});


	/*-------------------- query pour les decks ---------------*/

	socket.on("getDeckList", function(){
		db.query("SELECT name,description FROM Deck").then(function( queryResult ){
			socket.emit("getDeckList", queryResult);
		});
	});

	socket.on("addDeck", function( params ) {
		console.log("Deck reçu");
		let result = db.add_deck(
			params.deck_name,
			params.white_cards,
			params.black_cards,
			params.description
		).then(function( result ){
			socket.emit("addDeck_result", result);
		});
	});

	socket.on("room_list", function(){
		socket.emit("room_list", Object.keys(rooms));
	});

	/*-------------------- requêtes pour la gamepage ---------------*/

	socket.on("getPlayerNumber", function(){
		let room = Object.keys( io.sockets.adapter.sids[socket.id] );
		let count = rooms[room[1]].playersPerRoom;
		socket.emit("getPlayerNumber", count);
	});

	socket.on("getPlayCardsNb", function(){
		let room = Object.keys( io.sockets.adapter.sids[socket.id] );
		let count = rooms[room[1]].playCardsNb;
		socket.emit("getPlayCardsNb", count);
	});



});


http.listen(8080, function(){
	console.log('listening on port *:8080');
});



