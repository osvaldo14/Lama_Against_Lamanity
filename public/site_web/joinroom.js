let url = new URL(window.location.href);
let PlayerName = url.searchParams.get("PlayerName");
console.log("joinroom : " + PlayerName);
document.getElementById("pName").value = PlayerName;
document.getElementById("pName2").value = PlayerName;

/*
	Récupération de la liste des rooms
*/
const socket = io();

let room_selector = document.getElementById("room_selector");
let option;

socket.on("room_list", function(result){
	result.forEach(function(room_name){
		option = document.createElement("option");
		option.text = room_name;
		room_selector.add(option);
	});
});

document.getElementById('formulaire').addEventListener('submit', e=>{

	if(document.getElementById('room_selector').value === ""){
		e.preventDefault();	
	}
});

socket.emit("room_list");



