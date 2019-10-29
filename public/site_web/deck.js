"use strict";

let socket	= io();		//La socket

let htmlDeckList="";
let htmlDeckDesc="";
let active = "";
let show = "";

socket.emit("getDeckList");

socket.on("getDeckList", function( deckList ){
    deckList.forEach( function(deck, index){
        if(index === 0){
            active = " active";
            show = " show";
        } else {
            active = "";
            show = "";
        }

        htmlDeckList +=
            "<a class=\"nav-link" + active + "\" " +
            "id=\"v-pills-" + index + "\" " +
            "data-toggle=\"pill\" " +
            "href=\"#v-pills-content-" + index + "\" " +
            "role=\"tab\" " +
            "aria-controls=\"v-pills-" + index + "\" " +
            "aria-selected=\"false\">" +
            deck.name +
            "</a>"

        htmlDeckDesc +=
            "<a class=\"tab-pane fade " + show + active + "\" " +
            "id=\"v-pills-content-" + index + "\" " +
            "role=\"tabpanel\" " +
            "aria-labelledby=\"v-pills-" + index + "\">" +
            deck.description +
            "</a>"
    });

    document.getElementById("v-pills-tab").innerHTML = htmlDeckList;
    document.getElementById("v-pills-tab-content").innerHTML = htmlDeckDesc;
});

