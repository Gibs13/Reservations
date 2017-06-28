'use strict';

process.env.DEBUG = 'actions-on-google:*';
let ApiAiApp = require('actions-on-google').ApiAiApp;
let express = require('express');
let bodyParser = require('body-parser');
let horaires = require('./horaires.js');

let app = express();
app.use(bodyParser.json({type: 'application/json'}));

let sprintf = require('sprintf-js').sprintf;



const WELCOME_STATE = 'welcome';
const RESERVE_STATE = 'reserve';
const CHOOSE_STATE = 'choose';
const CONFIRM_STATE = 'confirm';


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

    function confirmation (assistant) {

        let message = "au restaurant " + assistant.data.restaurant + " le " + assistant.data.date + " à " + assistant.data.time + ". ";
        if (assistant.data.problem != false) {
            assistant.ask(assistant.data.problem);
            return;
        }
        if (assistant.data.proposition) {
            assistant.ask(assistant.data.message + "Je peux vous proposer d'aller manger " + message + "Etes vous d'accord ? ");
            return;
        }
        if (!assistant.data.name) {
            assistant.setContext("information");
            assistant.data.state = CONFIRM_STATE;
            assistant.ask("Une table est prête pour " + assistant.data.places + " personne" + (assistant.data.places>1 ? "s ":" ") + message + "A quel nom dois-je reserver ? ");
            return;
        }
        if (assistant.data.state == CONFIRM_STATE) {
            reserver(assistant);
            return;
        } else {
            assistant.data.state = CONFIRM_STATE;
            assistant.ask("Une table est prête pour " + assistant.data.places + " personne" + (assistant.data.places>1 ? "s ":" ") + message + "Dois-je finaliser la réservation ?");
            return;
        }        
        

    }

    function reserver (assistant) {
        let restaurant = assistant.data.restaurant;
        let date = assistant.data.date;
        let creneau = assistant.data.creneau;
        console.log(restaurant + " " + date + " " + creneau);
        let placeRestante = parseInt(horaires[restaurant][assistant.data.date][assistant.data.creneau].substring(18));
        let places = assistant.data.places;
        console.log("reservation à " + horaires[restaurant][date][creneau]);
        if (placeRestante-places>=0) {
            console.log("valide");
            horaires[restaurant][date][creneau] = horaires[restaurant][date][creneau].substring(0,18) + (placeRestante-places).toString();
            console.log(horaires[restaurant][date][creneau]);
            assistant.tell("Votre table à été reservée avec succès au nom de " + assistant.data.name);
        } else {
            console.log("invalide");
            assistant.ask("Il y a eu un problème, le nombre de place n'est plus bon.");
        }
    
    }

    function disponible(horairesJour, time) {
        let min;
        let max;
        let possibleTime = [];
        let placeRestante;
        if (isNaN(time)) {
            console.log("Nan");
        }
        if (horairesJour == undefined) {return false;}
        if (horairesJour.length == 0) {return false;}
        for (let i = 0; i<horairesJour.length;i++) {
            placeRestante = parseInt(horairesJour[i].substring(18));
            min = parseInt(horairesJour[i].substring(0,2))*60 + parseInt(horairesJour[i].substring(3,5));
            max = parseInt(horairesJour[i].substring(9,11))*60 + parseInt(horairesJour[i].substring(12,14));
            
            console.log("min : "+min+" max : "+max+" time : "+time);

            if (min<=time && time<=max && placeRestante >= assistant.data.places) {
                assistant.data.creneau = i;
                return true;
            } else if (placeRestante >= assistant.data.places) {
                if (time<min && possibleTime[0] == undefined) {
                    possibleTime[0] = min;
                    possibleTime[2] = i;
                } else if (time>max) {
                    possibleTime[1] = max;
                    possibleTime[3] = i;
                }
            }
        }
        let rightTime;
        if (possibleTime == []) {
            return false;
        } else if (!possibleTime[0]) {
            rightTime = possibleTime[1];
        } else if (!possibleTime[1]) {
            rightTime = possibleTime[0];
        } else {
            rightTime = possibleTime[1]-time <= time-possibleTime[0] ? possibleTime[1] : possibleTime[0];
        }
        assistant.data.creneau = rightTime == possibleTime[0] ? possibleTime[2] : possibleTime[3];
        let answer = ('0' + (rightTime/60).toString()).substring(-2) + ':' + ('0' + (rightTime-(rightTime/60)*60).toString()).substring(-2);
        console.log("temps proposé : " + answer);
        return answer;
    }

    // intents

    function start (assistant) {
        assistant.data.state = WELCOME_STATE;
        assistant.ask("Bienvenue, souhaitez vous reserver un restaurant ?");
    }
    
    function choose (assistant) {
        if (assistant.data.state == WELCOME_STATE) {

        }
    }

    function reserve (assistant) {

        assistant.setContext("asknumber",0)
        assistant.data.proposition = false;
        assistant.data.message = "";
        assistant.data.problem = false;
        let today = new Date();
        let resto = assistant.getArgument('resto');
        let datebis = assistant.getArgument('datebis');
        let timebis = assistant.getArgument('timebis');
        let lastname = assistant.getArgument('last-name');
        let number = assistant.getArgument('number');
        let todayNormalized = today.getFullYear().toString()+'-'+('0' + (today.getMonth()+1).toString()).slice(-2)+'-'+('0' + (today.getDate()).toString()).slice(-2);
        
        if (lastname) {
            assistant.data.name = lastname;
        }        

        if (number) {
            assistant.data.places = parseInt(number);
        }

        if (datebis) {
            assistant.data.date = datebis;
        } else if (!assistant.data.date) {
            assistant.data.date = todayNormalized;
        }
        
        let date = assistant.data.date;
        
        if (timebis) {
            assistant.data.time = timebis;
        } else if (!assistant.data.time) {
            assistant.data.proposition = true;
            if (date == todayNormalized) {
                assistant.data.time = ('0' + today.getHours().toString()).slice(-2) + ":" + ('0' + today.getMinutes().toString()).slice(-2);
            } else {
                assistant.data.time = "12:30";
            }
        }


        if (resto) {
            assistant.data.restaurant = resto.toUpperCase();
        } else if (!assistant.data.restaurant) {
            let rand = select(Object.keys(horaires));
            console.log("random restaurant selected : " +rand);
            if (horaires[rand][date] && 0 in horaires[rand][date]){
                assistant.data.restaurant = rand;
                assistant.data.proposition = true;
            } else {
                assistant.ask("Dans quel restaurant souhaiteriez vous aller ? ");
                return;
            }
        }

        let restaurant = assistant.data.restaurant;
        console.log(restaurant);
        let dispo = horaires[restaurant][date];

        if (!assistant.data.places) {
            assistant.setContext("asknumber",5);
            assistant.ask("Combien serez-vous ? ");
            return;
        }

        if (true) {
            let time = assistant.data.time;
            let minutes = parseInt(time.substring(0,2))*60 + parseInt(time.substring(3,5));
            let T = disponible(dispo,minutes);
            if (T === true) {
                //Tout est bon
                console.log("tout est bon");
                confirmation(assistant);
            } else if (T === false) {
                //Pas de place ce jour
                console.log("Pas de place ce jour");
                assistant.data.problem = "Il n'y a pas de place ce jour-çi. ";
                confirmation(assistant);
            } else {
                //Pas de place à cette heure mais à une autre heure le même jour
                console.log("Une place à une autre heure");
                assistant.data.proposition = true;
                assistant.data.time = T;
                assistant.data.message += "Il n'y a pas de place à cette heure là. ";
                confirmation(assistant);
            }
        }

        
        
        
        
    /*console.log('horaires : ' + dispo)

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
    */
    
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
    actionMap.set('confirmation', confirmation);

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