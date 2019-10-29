"use strict";

const fs = require('fs');

// Création d'une carte
function Card(txt){
	return Object.freeze({ text : txt })
}

// Création d'un deck de cartes à partir d'un fichier texte
function getCardsFromFile(file){
	let cards;
	try{
		cards = fs.readFileSync(__dirname + "/" + file, "utf8");
	} catch(err){
		if(err != null){
			console.error("Could not open file: " + err);
			return undefined;
		}
	}
	return cards.split("=")[1].split("<>");
}
// Création deck d'origine : cartes noires
const black_cards	= getCardsFromFile("bcards.txt");
// Création deck d'origine : cartes blanches
const white_cards	= getCardsFromFile("wcards.txt");


//Retourne une carte au hasard parmi le deck "cards"
//Enlève la carte du deck
function getRandomCard(cards){
	if(cards.length < 1){
		return undefined;
	}
	let rand	= Math.floor(Math.random()*cards.length);
	let card	= cards[rand];
	cards.splice(rand,1);
	return card;
}


exports.black_cards		= black_cards;
exports.white_cards		= white_cards;
exports.getRandomCard	= getRandomCard;
exports.Card 			= Card;
