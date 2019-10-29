"use strict";


//const fs     = require('fs');
const mysql = require('mysql');

const conn    = mysql.createConnection({
    host : "172.20.11.186",
    user : "root",
    password : "lama123",
    database : "LamaDB"
});

let query = 'SELECT * FROM User u WHERE u.username = "' + 'Gilles' + '"' ;

console.log(query);

conn.query(query, function(err, result, fields) {
    if (err) throw err;
    console.log(result);
});

conn.end();
