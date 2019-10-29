"use strict";

const mysql = require('mysql');
const util  = require('util');

const ip	= "172.20.8.239";
const user 	= "root";
const pwd 	= "lama123";
const db    = "LamaDB";

const conn	= mysql.createConnection({
	host 		: ip,
	user 		: user,
	password 	: pwd,
	database 	: db
});


const default_deck_description = "Ce deck ne possède pas de description car le créateur est une grosse feignasse";

const query = util.promisify(conn.query).bind(conn);


/*--------------------------FUNCTIONS------------------------*/


/*
	Retourne l'id de l'élément en réponse à query_request
	ou -1 si aucun élément trouvé
*/
async function get_element_id(query_request){
	try{
		let query_response = await query(query_request);
		if(query_response.length === 0){
			return -1;
		}else{
			return query_response[0].id;
		}
	}catch(err){
		console.log('ERROR', err);
		throw err;
	}
}

/*
	Retourne le id de l'utilisateur u_name
	ou -1 si l'utilisateur n'existe pas
*/
async function get_user_id(u_name){
	let query_request = 'SELECT id FROM User u WHERE u.username = \'' + u_name + '\'';
	try{
		return get_element_id(query_request);
	}catch(err){
		console.log('ERROR', err);
		throw err;
	}
}


/*
	Retourne le id de la carte c_name
	ou -1 si la carte n'existe pas
*/
async function get_card_id(text, type){
	let query_request = 'SELECT id FROM Card c WHERE c.text = \'' + text + '\' AND c.type = \'' + type + '\'';
	try{
		return get_element_id(query_request);
	}catch(err){
		console.log('ERROR', err);
		throw err;
	}
}

/*
	Retourne le id du deck d_name
	ou -1 si le deck n'existe pas
*/
async function get_deck_id(d_name){
	let query_request = 'SELECT id FROM Deck d WHERE d.name = \'' + d_name + '\'' ;
	try{
		return get_element_id(query_request);
	}catch(err){
		console.log('ERROR', err);
		throw err;
	}
}

/*
	Vérifie si un utilisateur existe déjà
	Retourne true ou false
*/
async function user_exists(u_name){

	try{
		let u_id = await get_user_id(u_name);
		return (u_id > -1);
	}catch (err){
		console.log('ERROR', err);
		throw err;
	}
}

/*
	Vérifie si une carte existe déjà
	Retourne true ou false
*/
async function card_exists(text, type){
	
	try{
		let c_id = await get_card_id(text,type);
		return (c_id > -1);
	}catch(err){
		console.log('ERROR', err);
		throw err;
	}
}
/*
	Vérifie si un deck existe déjà
	Retourne true ou false
*/
async function deck_exists(d_name){

	try{
		let d_id = await get_deck_id(d_name);
		return (d_id > -1);
	}catch(err){
		console.log('ERROR', err);
		throw err;
	}
}

/*
	Ajoue un utilisateur à la base de données,
	si celui-ci n'y est pas déjà.
	Retourne l'id de l'utilisateur ou -1 en cas d'échec
*/
async function add_user(u_name, hash){

	try{
		let u_exists = await user_exists(u_name);
		if(u_exists){
			//console.log("l'utilisateur " + u_name + " existe déjà GROS BAKA  >//< !");
			return -1;
		}else{
			let query_request	= 'INSERT INTO User (username, password_hash) VALUES (\''+ u_name +'\',\''+ hash +'\')';
			let query_response	= await query(query_request);
			//console.log("Utilisateur" + u_name + "ajouté");
			return query_response.insertId;
		}
	}catch(err){
		console.log(err);
		throw err;
	}
}

/*
	Ajoute une carte à la base de données,
	si celle-ci n'est pas déjà présente
	Retourne l'id de la carte
*/
async function add_card(text, type){

	try{
		let c_id = await get_card_id(text, type);
		if(c_id !== -1){
			//console.log("Cette carte existe déjà petit nigaud O_>O : " + text);
			return c_id;
		}else{
			let query_request	= 'INSERT INTO Card (text, type) VALUES (\''+text+'\',\''+type+'\')';
			console.log(query_request);
			let query_response 	= await query(query_request);
			//console.log("Carte ajouté");
			return query_response.insertId;
		}
	} catch(err){
		console.log('ERROR', err);
		throw err;
	}
}

/*
	Retourne vrai si une carte est dans un deck, faux sinon
*/
async function is_card_in_deck(card_id, deck_id){

	try{
		let query_request 	= 'SELECT * FROM Deck_Card_Association x WHERE x.card_id=\''+card_id+'\' AND x.deck_id =\''+deck_id+'\'';
		let query_response	= await query(query_request);
		return (query_response.length !==0);
	}catch(err){
		console.log('ERROR', err);
		throw err;
	}
}

/*
	Ajoute une carte à un deck (les deux sont supposés existants),
	si elle n'y est pas déjà présente
*/
async function add_card_to_deck(card_id, deck_id){
	try{
		let bool = await is_card_in_deck(card_id, deck_id);
		if(!bool){
			let query_request 	= 'INSERT INTO Deck_Card_Association (card_id, deck_id) VALUES (\''+card_id+'\',\''+deck_id+'\')';
			let query_response	= await query(query_request);
		}

	}catch(err){
		console.log('ERROR', err);
		throw err;
	}
}

async function delete_card_from_deck(card_name, card_type, deck_name){
	try{

		let c_id = await get_card_id(card_name, card_type);
		let d_id = await get_deck_id(deck_name);
		if(c_id !== -1 && d_id !== -1){
			let query_request 	= 'DELETE FROM Deck_Card_Association WHERE deck_id =\''+d_id+'\' AND card_id =\''+c_id+'\'';
			let query_response	= await query(query_request);
		}

	}catch(err){
		console.log('ERROR', err);
		throw err;
	}
}

/* 
	retourne la liste des cartes noires et blanches d'un deck
*/

async function get_deck(deck_name){
	try{

		let d_id = await get_deck_id(deck_name);
		console.log(d_id);
		let w_cards_query = 'SELECT c.text FROM Card c JOIN Deck_Card_Association dca on c.id=dca.card_id WHERE dca.deck_id = \''+d_id+'\' AND c.type= \'1\'';
		let b_cards_query = 'SELECT c.text FROM Card c JOIN Deck_Card_Association dca on c.id=dca.card_id WHERE dca.deck_id = \''+d_id+'\' AND c.type= \'0\'';

		let white_cards = await query(w_cards_query);
		let black_cards = await query(b_cards_query);

		let white_cards_text = white_cards.map(x => x.text);
		let black_cards_text = black_cards.map(x => x.text);
		
		return {white_cards : white_cards_text, black_cards : black_cards_text};
	}catch(err){
		throw err;
	}
}


/*
	Ajoute un deck à la base de données, si celui n'existe pas déjà
	Retourne l'id du deck ou -1 si le deck existe déjà
*/

async function add_deck(d_name, white_cards, black_cards, description = default_deck_description, u_name = "Common", privacy = 0){
	try{
		// Si lê créateur n'existe pas le deck ne peut être crée
		let u_id = await get_user_id(u_name);
		if(u_id < 0) return -1;
		// Deck déjà existant ?
		let d_exists = await deck_exists(d_name);
		if(d_exists){

			//console.log("Le deck " + d_name +" existe déjà, pauvre fou ! O_O");
			return -1;

		}else{

			let query_request	= 'INSERT INTO Deck (name, creator, privacy, description) VALUES (\''+d_name+'\',\''+u_id+'\',\''+privacy+'\',\''+description+'\')';
			let query_response 	= await query(query_request);
			console.log("Deck " +d_name+ " ajouté");

			let deck_id 		= query_response.insertId;

			for(const card of white_cards){
				try{
					let card_id = await add_card(card,1);
					await add_card_to_deck(card_id, deck_id);
				}catch (err){
					console.log('ERROR',err);
					//console.log("La carte '"+ card + "' n'a pas pu être ajouté au deck '"+d_name+"'");
				}
				
			}

			for(const card of black_cards){
				try{
					let card_id = await add_card(card,0);
					await add_card_to_deck(card_id, deck_id);
				}catch (err){
					console.log('ERROR',err);
					//console.log("La carte '"+ card + "' n'a pas pu être ajouté au deck");
				}
			}

			return deck_id;

		}
	} catch(err){
		console.log('ERROR', err);
	}

}

/*
	Efface le deck d_name de la table des données
*/
async function delete_deck(d_name){
	try{

		if(deck_exists(d_name)){
			let d_id = await get_deck_id(d_name);
			let query_request 	= 'DELETE FROM Deck WHERE id = \''+d_id+'\'';
			let query_response	= await query(query_request);
			query_request		= 'DELETE FROM Deck_Card_Association WHERE deck_id =\''+d_id+'\'';
			query_response		= await query(query_request);
		}

	}catch(err){
		console.log('ERROR', err);
		throw err;
	}
}

exports.query 		= query;
exports.add_deck	= add_deck;
exports.delete_deck	= delete_deck;
exports.get_deck 	= get_deck;