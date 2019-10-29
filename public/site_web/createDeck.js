"use strict";

const socket 	= io();
const form 		= document.getElementById('formulaire');

socket.on("addDeck_result", function(deck_id){
	let result = document.getElementById('result');
	if(deck_id === -1){
		result.innerHTML 			= "Name already used !";
		result.style.background		= "red";
		result.style.display		= "block";		
	}else{
		result.innerHTML 			= "Deck added!";
		result.style.background		= "lime";
		result.style.display		= "block";
		form.reset();
			  
	}
});


form.addEventListener('submit', e => {
	e.preventDefault();

	const deck_name = document.getElementById('deck_name').value;
	const file	 	= document.getElementById('deck_file').files[0];
	let description	= document.getElementById('description').value;

	if( deck_name === ""){
		alert("I said 'choose a name for your deck' !");
		return;
	}

	if( file === undefined){
		alert("Select a file you smartass");
		return;
	}

	if( description === " "){
		description = undefined;
	}

	let reader = new FileReader();
	reader.onload = function(event){
		let cards 		= this.result.replace(/\'/g, " ").split('\n<>\n');
		let black_cards	= cards[0].split('\n');
		let white_cards	= cards[1].split('\n');

		let sql_safe_black_cards = [];
		let sql_safe_white_cards = [];

		console.log(black_cards);

		
		socket.emit("addDeck", {
			deck_name	: deck_name,
			white_cards	: white_cards,
			black_cards	: black_cards,
			description : description 
		});

	};



	reader.readAsText(file);

});


