"use strict";

/*--------------------------------------------------------------*/
/*-------------------------VARIABLES----------------------------*/
/*--------------------------------------------------------------*/

let socket				= io();		//La socket
let stopTimer			= false;	//condition d'arrêt pour le timer
let pts					= 0;		//Score du client
let clickedCardIndex;				//Indice de la carte à changer
let isJudge 			= false;	//Variable d'état
const victoryPoints		= 3;

//Cartes du client
let white_cards	= [];
//Cartes du juge
let czard_cards	= [];

//Les deux "écrans" qui vont s'alterner durant le jeu
let main 	= $("#main");
let czard	= $("#czard");
let upper	= $("#upper");
czard.hide();

/*--------------------------------------------------------------*/
/*-------------------------FONCTIONS----------------------------*/
/*--------------------------------------------------------------*/

//Fonction permettant d'afficher le score et envoi un message au serveur si le joueur atteint le score requis
function score(){
	document.getElementById("score").innerHTML ="Score : " + pts;
	if(pts == victoryPoints){
		socket.emit("victory", roomName);
		main.hide();
		czard.hide();
		upper.hide();
		console.log(screen.height);
		document.body.style.background = "url('./images/victory.jpg') no-repeat top center";
		setTimeout(function(){
			window.location.href = "entername.html";
		}, 5000)

	}
}

//Désactive la clickabilité (vrai mot français) d'une carte
function disableClick(card){
	card.style.pointerEvents = "none";
}

//Je vous laisse deviner ce que fait cette fonction là
function enableClick(card){
	card.style.pointerEvents = "auto";
}

/*-------------------- mise en page -----------------------*/

// returns a string containing html for count white cards
function addCard( count ){
    let html="";
    for(let i=0;i<count;i++){
        html+=  "<div class=\"light card\">" +
                "<p class=\"text\"></p>" +
                "</div>"
    }
    return html;
}

// returns a string containing html for one black card
function addBlackCard( text ){
    let html =  "<div class=\"dark card\">" +
                "<p class=\"text\">" + text + "</p>" +
                "</div>";
    return html;
}


/*--------------------------------------------------------------*/
/*--------------------REGLES (SOCKET.ON)------------------------*/
/*--------------------------------------------------------------*/

// traitement de la réponse du join
socket.on("joinRes", function( response ) {
	if (!response) {
		socket.emit("getPlayerNumber");
	} else {
		alert("Could not join room because " + response);
		// go back to main.html
		window.location.href = "entername.html";
	}
});

socket.on("start", function(){
	white_cards = Array.from(document.getElementById("main").getElementsByClassName("light card"));
	czard_cards = Array.from(document.getElementById("czard").getElementsByClassName("light card"));

	//Implémente le comportement des cartes du client, au clic
	white_cards.forEach(function(card,index){
		card.addEventListener("click", function(){
			card.style.border = "3px solid green";
			white_cards.forEach(disableClick);
			clickedCardIndex	= index;
			stopTimer			= true;
			socket.emit("choiceEnd", {card:card.firstElementChild.textContent, room:roomName});
		});
	});

	//Implémente le comportement, des cartes de la phase de jugement, au clic
	czard_cards.forEach(function(card){
		card.addEventListener("click", function(){

			//card.style.backgroundColor = "lightGreen";
			czard_cards.forEach(disableClick);
			socket.emit("judgementEnd", {card:card.firstElementChild.textContent,room:roomName});
		});
	});

	/*Le joueur est en attente de début de partie,
	  donc l'interactivité des cartes est désactivée pour l'insant*/
	czard_cards.forEach(disableClick);
	white_cards.forEach(disableClick);

	socket.emit("new player", roomName);

});


//Si on reçoit une carte blanche
socket.on("whiteCard", function(cardText){
	white_cards[clickedCardIndex].firstElementChild.textContent = cardText;	
});

//Quand on se fait baptiser
socket.on("startingPack", function(data){
	white_cards.forEach(function(card,i){
		card.firstElementChild.textContent = data.cards[i];
	});
	console.log("tu seras " + playerName + ", mon fils");
});

//Quand le round commence
socket.on("roundBegin", function(card){
	score();
	main.show();
	czard.hide();
	let bcards = Array.from(document.getElementsByClassName("dark card"));
	bcards[0].firstElementChild.textContent = card;
	bcards[1].firstElementChild.textContent = card;
});

//Quand on est le juge du tour
socket.on("judgeReady", function(){
	isJudge = true;
	$(".upper").children(":first").text("pour ce tour, VOUS ÊTES LE JUGE ! Attendez que les joueurs choisissent leur cartes =)");
	socket.emit("judgeReady", roomName);
});

//Quand la phase de choix de carte par les joueurs commence
socket.on("choiceBegin", function(){
	//Setup
	isJudge = false;
	main.show();
	czard.hide();
	$(".upper").children(":first").text("Oh mon salaud, choisis voir une carte blanche pour compléter la carte noire !");
	//Modifier les clickabilités
	czard_cards.forEach(disableClick);
	white_cards.forEach(enableClick);
	//Lancer le timer
	let i = 60;
	function onTimer() {
		document.getElementById("timer").innerHTML ="Time " + i;
		i--;
		console.log(timer);
		if (i < 0) {
			white_cards.forEach(disableClick);
			clickedCardIndex	= 0;
			socket.emit("choiceEnd", {card:white_cards[0].firstElementChild.textContent, room:roomName});
			return;
		}
		else if(stopTimer === true){
			stopTimer = false;
			return;
		}
		else {
			setTimeout(onTimer, 1000);
	  	}
	}
	onTimer();	
});

//Quand la phase de choix du juge commence
socket.on("judgementBegin", function(cards){
	main.hide();
	czard.show();
	if(!isJudge){white_cards[clickedCardIndex].style.border = "3px solid transparent";}
	$(".upper.text").children(":first").text("Hé dis donc Billy le Juge, ça y'en est quoi ta carte préférée ?");
	//Remplir les cartes avec les choix des joueurs
	cards.playersChoices.forEach(function(cardText,index){
		czard_cards[index].firstElementChild.textContent = cardText;
		if(isJudge){
			enableClick(czard_cards[index]);
		}
	});
});

//Quand le juge a choisi la carte gagnante
socket.on("judgeChoice", function(cardText){
	czard_cards.forEach(function(card){
		if(card.firstElementChild.textContent.localeCompare(cardText) === 0){
			card.style.backgroundColor = "lightGreen";
			//Attribution de pts
			if(!isJudge){
				let myCard = white_cards[clickedCardIndex].firstElementChild.textContent;
				if(cardText.localeCompare(myCard) === 0){pts++;}
				socket.emit("whiteCard", roomName);
			}
			score();
			setTimeout(function(){
			card.style.backgroundColor = "white";
			socket.emit("roundEnd", roomName);
		}, 2500);
		}
	});
});

//Quand on a perdu
socket.on("defeat", function(){
	main.empty();
	czard.empty();
	upper.empty();
	document.body.style.background = "url('./images/defeat.jpeg')";
	setTimeout(function(){
		window.location.href = "entername.html";
	}, 5000)
});

/*-------------------------- mise en page --------------------------*/

// populate the jusge's cards #czard section
socket.on("getPlayerNumber", function( count ){
    let html =  "<div class=\"row\">";
    html += 		addBlackCard();
    html += 	"</div>" +
				"<div class=\"row\">";
    html += 		addCard( count - 1 );
    html += 	"</div>";

    document.getElementById( "czard" ).innerHTML = html;
    socket.emit("getPlayCardsNb");
});

// populate player's cards #main section
socket.on("getPlayCardsNb", function( count ){
    let html =  "<div class=\"row\">";
    html += 		addBlackCard("En attente du début de partie");
    html += 		//"<div class=\"col-3\"></div>" +
					"<div class=\"dark card\">\n" +
						"<p class=\"text\" id=\"score\">Score : 0</p>" +
						"<p class=\"text\" id=\"timer\"></p>" +
					"</div>" +
				"</div>" +
				"<div class=\"row\">";
    html += 		addCard( count );
    html += 	"</div>";
    document.getElementById( "main" ).innerHTML = html;
    socket.emit("ready");
});

/*--------------------------------------------------------------*/
/*----------------------------MAIN------------------------------*/
/*--------------------------------------------------------------*/




let url = new URL(window.location.href);

let playerName = url.searchParams.get("PlayerName");
let roomName = url.searchParams.get("RoomName");

let join_params = {playerName:playerName,roomName:roomName};

let playersPerRoom = url.searchParams.get("playersPerRoom");
let deck_name = url.searchParams.get("DeckName");

console.log(playersPerRoom);
console.log(deck_name);

if(playersPerRoom && deck_name) {
	join_params.playersPerRoom 	= playersPerRoom;
	join_params.deck_name		= deck_name;
}

socket.emit('join', join_params);




