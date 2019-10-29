"use strict";

/*--------------------------------------------------------------*/
/*-------------------CONSTANTES ET VARIABLES--------------------*/
/*--------------------------------------------------------------*/

const express			= require('express');
const app				= express();
const http				= require('http').Server(app);
const io				= require('socket.io')(http);

const Cards				= require('./public/card.js');
const Rooms				= require('./public/room.js');
const DefaultRoom		= 'lama';
const playCardsNb		= 8;	// Number of cards per player
const playersPerRoom	= 3;	// Number of players per room

//Données static
app.use(express.static('public/site_web'));
app.use(express.static('public'));

//Deck de base
let black_cards	= Cards.black_cards;
let white_cards	= Cards.white_cards;

//Liste des joueurs
let players			= [];
let playersChoice	= [];
let playersName		= ['Gusbando','Ostavo','Gusvaldo','Osbando'];
let playersDone		=  0;
let judgeIndex		= -1;

//Set room.js
Rooms.room.init(io, playersPerRoom, DefaultRoom);

/*--------------------------------------------------------------*/
/*---------------------------ROUTING----------------------------*/
/*--------------------------------------------------------------*/

//Routing vers accueil du site
app.get('/', function(req,res){
	res.status(200).sendFile('main.html', {root: "public/site_web"});
});

//Routing vers la page de jeu
//app.get('/play', function(req,res){
//	res.status(200).sendFile('play.html', {root : "public/site_web"});
//});

//app.get('/deck', function(req,res){
//	res.status(200).sendFile('deck.html', {root : "public/site_web"});
//});

/*--------------------------------------------------------------*/
/*--------------------------CONNEXION---------------------------*/
/*--------------------------------------------------------------*/

//Connexion IO
io.on('connection', function(socket){
	console.log('a user connected :' + socket.id);
	//Si Deconnexion
	socket.on('disconnect', function(){
		console.log('user disconnected: ' + socket.id);
		//Enlever le joueur
		players.forEach( function(p,i){
			if (p.id.localeCompare(socket.id) === 0){delete players[i];}
		});
	});
	//Nouveu joueur
	socket.on('new player', function(){
		//Rejoindre la room par défaut

		if(Rooms.room.joinRoom(socket, DefaultRoom)){
			let playerName = playersName[Rooms.getPlayersNb(DefaultRoom)-1];
			players.push({id : socket.id, tagName : playerName});
			//Données au joueur son nom et ses cartes
			playerName 	= playersName[Rooms.getPlayersNb(DefaultRoom)-1];
			players.push({id : socket.id, tagName : playerName});
			let Wcards 		= [];
			for(let i=0; i<playCardsNb; i++){
				Wcards.push(Cards.getRandomCard(white_cards));
			}
			socket.emit('startingPack',{ 
					playerName	:	playersName[Rooms.getPlayersNb(DefaultRoom)-1],
					cards		:	Wcards
			});
			//Si la room est complète, lancer le jeu
			if(Rooms.isFull(DefaultRoom)){
				io.to(DefaultRoom).emit("roundBegin", Cards.getRandomCard(black_cards));
				judgeIndex = (judgeIndex + 1) % playersPerRoom
				io.to(players[judgeIndex].id).emit("judgeReady");
			}
		}
	});
	
	//Quand le juge est prêt, prévenir les joueurs
	socket.on("judgeReady", function(){
		socket.to(socket.room).emit("choiceBegin");
	});


	//Demande d'une carte blanche
	socket.on("whiteCard", function(){
		socket.emit("whiteCard", Cards.getRandomCard(white_cards));
	});


	//Début d'un nouveau round
	socket.on("choiceEnd",function(cardText){
		playersChoice.push(cardText);
		if (playersChoice.length === (playersPerRoom-1)){
			io.to(DefaultRoom).emit("judgementBegin", {judge : players[judgeIndex].tagName, playersChoices : playersChoice});
			playersChoice = [];
		}	
	});

	//Le juge a choisi sa carte, il faut prévenir les autres joueurs
	socket.on("judgementEnd", function(cardText){
		io.to(socket.room).emit("judgeChoice", cardText);
	});

	//On veut que tout les joueurs aient fini leur round
	socket.on("roundEnd", function(){
		playersDone = (playersDone + 1) % playersPerRoom;
		if (playersDone === 0){
			io.to(DefaultRoom).emit("roundBegin", Cards.getRandomCard(black_cards));
			judgeIndex = (judgeIndex + 1) % playersPerRoom
			players.forEach(function(p,index){
				console.log("id :" + p.id + " , name :" + p.tagName);
			});
			io.to(players[judgeIndex].id).emit("judgeReady");
		}
	});

	//Fin de la partie
	socket.on("10pts",function(){
		socket.to(socket.room).emit("defeat");
	});
});


http.listen(8080, function(){
	console.log('listening on port *:8080');
});



