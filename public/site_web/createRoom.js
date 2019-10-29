let url = new URL(window.location.href);
let PlayerName = url.searchParams.get("PlayerName");
console.log("joinroom : " + PlayerName);
document.getElementById("pName").value = PlayerName;

const socket 	= io();
const form 		= document.getElementById('formulaire');

/*
	Récupération de la liste des decks
*/

let deck_selector = document.getElementById("deck_selector");
let option;

socket.on("getDeckList", function(result){
	console.log(result);
	result.forEach(function(deck){
		option = document.createElement("option");
		option.text = deck.name;
		deck_selector.add(option);
	});
});

form.addEventListener('submit', e=>{



	if(document.getElementById("enter_room_name").value === ""){
		e.preventDefault();
		alert('I said "Enter room name" god dammit !');
		return;
	}

	if(document.getElementById('room_size_selector').value === ""){
		e.preventDefault();	
		alert('You forgot to select a number of player...');
		return;
	}


	if(document.getElementById("deck_selector").value === ""){
		e.preventDefault();
		alert('For the love of God, you must select a deck.');
		return;
	}
});


socket.emit("getDeckList");