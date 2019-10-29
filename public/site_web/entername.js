"use strict";

let socket				= io();		//La socket

const form 		= document.getElementById('nameForm');

form.addEventListener('submit', e => {
	e.preventDefault();

	let playerName = document.getElementById('playerName').value;
	console.log("pname : " + playerName);
	let pName = playerName.replace(/[*ç%&#!"^\']/g,"").trim().replace(/ /g,"+");

	if( pName === ""){
		alert("How hard is it to chose a valid name ?");
		return;
	} else {
		console.log("name not empty");
		socket.emit("checkName",  pName);
    }
});


socket.on("checkName", function( res ){
	if( res.res ){
        window.location.href = "/joinroom.html?PlayerName=" + res.pName;
	} else {
		alert("This name is already taken you unoriginal swine.");
		return;
	}
});





