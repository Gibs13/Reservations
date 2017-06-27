'use strict';

process.env.DEBUG = 'actions-on-google:*';
let ApiAiApp = require('actions-on-google').ApiAiApp;
let express = require('express');
let bodyParser = require('body-parser');
const horaires = require('./horaires.js');

let app = express();
app.use(bodyParser.json({type: 'application/json'}));

let sprintf = require('sprintf-js').sprintf;



const WELCOME_STATE = 'welcome';
const RESERVE_STATE = 'reserve';
const CHOOSE_STATE = 'choose';


// Function Handler


app.post('/', function (req, res) {
    const assistant = new ApiAiApp({request: req, response: res});

    /*function goodDate(assistant) {

        let date = assistant.data.date;
        console.log(date);
        let today = new Date();
        
        today = [today.getDate(),today.getMonth()+1];
        date = [parseInt(date.substring(8,10)),parseInt(date.substring(5,7))];
        console.log(today + '  ' + date)
        if (date[1]<today[1] || date[0]<today[0]-7) {
            console.log('plus un mois');
        } else if (date[0]<today[0]) {
            console.log('plus une semaine');
        }
    }*/

    function select(array) {
        /*if (assistant.data.state == WELCOME_STATE) {
            
            assistant.data.state = RESERVE_STATE;
            assistant.ask("Voici une liste de vos restaurants préférés proches : " );
        } else if (assistant.data.state == RESERVE_STATE) {
            assistant.data.restaurant = restaurants[Math.floor(Math.random()*restaurants.length)];
        }*/
        return array[Math.floor(Math.random()*array.length)];
    }

    function get_Restaurant (assistant) {
        let resto = assistant.getArgument('resto');
        if (!assistant.data.restaurant && resto == null) {
            assistant.data.state = CHOOSE_STATE;
            return true;
        }
        console.log(assistant.data.restaurant);
        if (assistant.data.restaurant == undefined || assistant.data.state == CHOOSE_STATE) {
            assistant.data.restaurant = resto;
            assistant.data.state = RESERVE_STATE;
        } else if (assistant.data.restaurant != undefined && resto != null) {
            assistant.data.restaurant_ = resto;
        }
        return false;
    }

    function get_Date (assistant) {
        if (!assistant.data.date && (assistant.getArgument('datebis') == null)) {
            if (assistant.getArgument('timebis')) {
                let today = new Date();
                let month = (today.getMonth()+1) < 10 ? '0' + (today.getMonth()+1).toString() : (today.getMonth()+1).toString();
                let day = today.getDate() < 10 ? '0' + today.getDate().toString() : today.getDate().toString();
                assistant.data.date = today.getFullYear().toString()+'-'+month+'-'+day;
                return false;
            }
            assistant.data.state = CHOOSE_STATE;
            return true;
        }
        console.log(assistant.data.date);
        if (assistant.data.date == undefined || assistant.data.state == CHOOSE_STATE) {
            assistant.data.date = assistant.getArgument('datebis');
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

    function disponible(horaires, time) {
        let min;
        let max;
        let possibleTime = [];
        if (isNaN(time)) {
            console.log("Nan");
        }
        for (let i = 0; i<dispo.length;i++) {
            min = parseInt(horaires[i].substring(0,2))*60 + parseInt(horaires[i].substring(3,5));
            max = parseInt(horaires[i].substring(9,11))*60 + parseInt(horaires[i].substring(12,14));
            
            console.log("min : "+min+" max : "+max+" time : "+time);

                if (min<=time && time<=max) {
                    return true;
                } else if (time<min && possibleTime[0] == undefined) {
                    possibleTime[0] = min;
                } else if (time>max) {
                    possibleTime[1] = max;
                }
            }
        let answer = possibleTime[1]-time < time-possibleTime[0] ? possibleTime[1] : possibleTime [0];
        return answer;
    }

    // intents

    function start (assistant) {
        assistant.data.state = WELCOME_STATE;
        assistant.ask("Bienvenue, souhaitez vous reserver un restaurant ?")
    }
    
    function choose (assistant) {
        if (assistant.data.state == WELCOME_STATE) {

        }
    }

    function reserve (assistant) {

        let today = new Date();
        let resto = assistant.getArgument('resto');
        let datebis = assistant.getArgument('datebis');
        let timebis = assistant.getArgument('timebis');
        
        if (timebis) {
            assistant.data.time = timebis;
        }

        if (datebis) {
            assistant.data.date = datebis;
        } else if (!assistant.data.date) {
            let month = (today.getMonth()+1) < 10 ? '0' + (today.getMonth()+1).toString() : (today.getMonth()+1).toString();
            let day = today.getDate() < 10 ? '0' + today.getDate().toString() : today.getDate().toString();
            assistant.data.date = today.getFullYear().toString()+'-'+month+'-'+day;
        }

        let date = assistant.data.date;

        if (resto) {
            assistant.data.restaurant = resto;
        } else if (!assistant.data.restaurant) {
            let rand = select(Object.keys(horaires));
            if (horaires.rand[date] && 0 in horaires.rand[date]){
                assistant.data.restaurant = rand;
                assistant.data.proposition = true;
            } else {
                assistant.ask("Dans quel restaurant souhaiteriez vous aller ?");
                return;
            }
        }

        let restaurant = assistant.data.restaurant;
        let dispo = horaires[restaurant][date];

        if (assistant.data.time) {
            let time = assistant.data.time;
            let minutes = parseInt(time.substring(0,2))*60 + parseInt(time.substring(3,5));
            if (disponible(dispo,minutes)) {
                confirmation()
            } else {}
        }

        
        
        
        
        
        console.log('horaires : ' + dispo)

        if (!dispo) {
            assistant.ask("Pas ouvert ce jour-ci")
            return;
        } else if (time == undefined) {
            let today = new Date();
            let minutes = today.getHours()*60 + today.getMinutes();
            if (minutes < 720 && disponible(dispo,Math.max(minutes+45,720))) {
                if (disponible(dispo,12)) {
                }
            } else if (today.getHours() < 11) {}
            for (let i = 0; i<dispo.length;i++) {
            hours += 'de ' + dispo[i].substring(0,2) + ' à ' + dispo[i].substring(9,11) + '.\n' ;
            }
            
            
            return;
        } else {
            if (disponible(dispo,parseInt(time.substring(0,2))*60 + parseInt(time.substring(3,5)))) {
                    assistant.ask("A " + date + " au " + restaurant);
                    return;
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