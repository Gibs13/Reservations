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
const RESERVE_STATE = 'reserve'
const CHOOSE_R_STATE = 'r';
const CHOOSE_D_STATE = 'd';
const CHOOSE_N_STATE = 'n';
const CHOOSE_T_STATE = 't';


// Function Handler


app.post('/', function (req, res) {
    const assistant = new ApiAiApp({request: req, response: res});

    function goodDate(assistant) {

        let date = assistant.getArgument('date').date;
        console.log(date);
        let today = new Date();
        
        today = [today.getDate(),today.getMonth()+1];
        date = [date.substring(8,10),date.substring(5,7)];
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
        if (!assistant.data.restaurant && assistant.getArgument('city') == null) {
            assistant.data.state = CHOOSE_R_STATE;
            return true;
        }
        if (assistant.data.restaurant == undefined || assistant.data.state == CHOOSE_R_STATE) {
            assistant.data.restaurant = assistant.getArgument('city');
            assistant.data.state = RESERVE_STATE;
        }
        return false;
    }

    function get_Date (assistant) {
        if (!assistant.data.date && (assistant.getArgument('date') == null || assistant.getArgument('date').date == null )) {
            assistant.data.state = CHOOSE_D_STATE;
            return true;
        }
        if (!assistant.data.date == undefined || assistant.data.state == CHOOSE_D_STATE) {
            assistant.data.date = assistant.getArgument('date').date;
            assistant.data.state = RESERVE_STATE;
        }
        return false;
    }

    function get_Name (assistant) {
    }

    function confirmation () {

    }

    function reserver (assistant) {

        /*if (assistant.data.state != RESERVE_STATE && assistant.data.state != WELCOME_STATE) {
            assistant.ask("are you sure ?");
            return;
        }*/

        
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
            assistant.ask("Quel restaurant ?");
            return;
        }
        if (get_Date(assistant)){
            assistant.ask("A quelle date ?");
            return;
        }
        goodDate(assistant);
        let restaurant = assistant.data.restaurant;
        let date = assistant.data.date;
        let time = assistant.getArgument('date').time;
        let dispo = horraires[restaurant][date];
        
        console.log('horraires : ' + dispo)

        if (!dispo) {
            assistant.ask("Pas ouvert ce jour-ci")
            return;
        } else if (time == undefined) {
            let hours = 'Le restaurant est ouvert :\n'
            for (let i = 0; i<dispo.length;i++) {
            hours += 'de ' + dispo[i].substring(0,2) + ' à ' + dispo[i].substring(9,11) + '.\n' ;
            }
            assistant.data.state = CHOOSE_T_STATE;
            assistant.ask(hours + "A quelle heure souhaitez vous vous y rendre ?");
            return;
        } else {
            let min;
            let max;
            let timebis = parseInt(time.substring(0,2))*60 + parseInt(time.substring(3,5));
            for (let i = 0; i<dispo.length;i++) {
            min = parseInt(dispo[i].substring(0,2))*60 + parseInt(dispo[i].substring(3,5));
            max = parseInt(dispo[i].substring(9,11))*60 + parseInt(dispo[i].substring(12,14));

            console.log("min : "+min+" max : "+max+" timebis : "+timebis);

                if (min<time && time<max) {
                    assistant.ask("A " + date + " au " + restaurant);
                    return;
                }
            }
            assistant.ask("Pas ouvert a cette heure.");
            return;
        }
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