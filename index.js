'use strict';

process.env.DEBUG = 'actions-on-google:*';
let ApiAiApp = require('actions-on-google').ApiAiApp;
let express = require('express');
let bodyParser = require('body-parser');
let horraires = require('./horraires.js');
let restaurants = require('./restaurants.js');

let app = express();
app.use(bodyParser.json({type: 'application/json'}));

let sprintf = require('sprintf-js').sprintf;



const WELCOME_STATE = 'welcome';
const CHOOSE_R_STATE = 'r';
const CHOOSE_D_STATE = 'd';
const CHOOSE_N_STATE = 'n';


// Function Handler


app.post('/', function (req, res) {
    const assistant = new ApiAiApp({request: req, response: res});

    function goodDate(assistant) {

        let date = assistant.getArgument('date').date;
        console.log(date);
        let today = new Date();
        
        today = [today.getDate(),today.getMonth()];
        date = [date.substring(8,10),date.substring(5,7)-1];
        console.log(today + '  ' + date)
        if (date[1]<today[1] || date[0]<today[0]-7) {
            console.log('plus un mois');
        } else if (date[0]<today[0]) {
            console.log('plus une semaine');
        }
    }

    function select(array) {
        /*if (assistant.data.state == WELCOME_STATE) {
            
            assistant.data.state = RESERVE_STATE;
            assistant.ask("Voici une liste de vos restaurants préférés proches : " );
        } else if (assistant.data.state == RESERVE_STATE) {
            assistant.data.restaurant = restaurants[Math.floor(Math.random()*restaurants.length)];
        }*/
        return array[Math.floor(Math.random()*array.length)];
    }

    function get_City (assistant) {

    }

    function get_Restaurant (assistant) {
        if (assistant.getArgument('restaurant') == null) {
            assistant.data.state = CHOOSE_R_STATE;
            return true;
        }
        assistant.data.restaurant = assistant.getArgument('city');
    }

    function get_Date (assistant) {
        if (assistant.getArgument('date') == null) {
            assistant.data.state = CHOOSE_D_STATE;
            return true;
        }
        assistant.data.date = assistant.getArgument('date');
    }

    function get_Name (assistant) {
        if (assistant.getArgument('name') == null) {
            assistant.data.state = CHOOSE_N_STATE;
            return true;
        }
        assistant.data.name = assistant.getArgument('name');

    }

    function confirmation () {

    }

    function reserver (assistant) {

        /*if (assistant.data.state != RESERVE_STATE && assistant.data.state != WELCOME_STATE) {
            assistant.ask("are you sure ?");
            return;
        }*/

        goodDate(assistant);
        assistant.data.city = assistant.getArgument('city');
        assistant.data.restaurant 




        assistant.ask(assistant.data.city);
    }

    // intents

    function start (assistant) {
        assistant.data.state = WELCOME_STATE;
        assistant.ask("Bienvenue, souhaitez vous reservez un restaurant ?")
    }
    
    function choose (assistant) {
        if (assistant.data.state == WELCOME_STATE) {

        }
    }

    function reserve (assistant) {
        if (assistant.data.state != WELCOME_STATE) {
            confirmation();
        }
        if (get_Restaurant(assistant)){
            assistant.ask("Quel restaurant ?")
            return;
        }
        if (get_Date(assistant)){
            assistant.ask("A quelle date ?")
            return;
        }
        let restaurant = assistant.data.restaurant;
        let date = assistant.data.date;
        assistant.ask("A" + date + "au " + restaurant)
    }

    function yes (assistant) {
        if (assistant.data.state == WELCOME_STATE) {
            reserve();
        }

    }

    function no (assistant) {
        if (assistant.data.state == WELCOME_STATE) {
            quit(assistant);
            return;
        }

    }

    function quit (assistant) {
        assistant.tell('Goodbye!');
    }


    // Mapping intentions

    let actionMap = new Map();

    actionMap.set('reserve', reserve);
    actionMap.set('quit', quit);

    assistant.handleRequest(actionMap);
});

// Server 

if (module === require.main) {
  // [START server]
  // Start the server
  let server = app.listen(process.env.PORT || 8080, function () {
    let port = server.address().port;
    console.log('app listening on port %s', port);
  });
  // [END server]
}