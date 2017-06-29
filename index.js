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
const YES_NO_STATE = 'yes_no';
const GIVE_NAME_STATE = 'give_name';
const CHANGE_STATE= "change";

const PROPOSITION = ["My suggestion is ","I may suggest you ","A possible choice would be ","I allowed myself to choose ","Maybe "];
const MISUNDERSTAND = ["Sorry, I didn't understand. ","What did you just said ? ","I didn't heared well. "];
const AGREE = ["Do you agree ? ","Is it ok for you ? ","Is it alright ? "];
const FINISH = ["May I place an order ? ","Is everything right ? ","May I proceed ? "];
const READY = ["A table is available ","There's still place ","It's possible to reserve"];
const SUCCESS = ["Your reservation was completed under the name of ","Everything went well. The table was ordered with the name ","The order was made under the name : "];
const WELCOME = ["Welcome ! You can order a restaurant in Strasbourg. ","Hello ! I'm able to get a reservation for a restaurant in Strasbourg. ","Howdy ! Do you want a reservation in a Strasbourg's restaurant ? "];
const BYE = ["Alright then, come back soon ! ","Well, goodbye. See you soon.","You're leaving yet ? Until next time !"];
const CHANGE = ["What should I change ? ","Tell me what hes to be modified. ","What has to be replaced ? "];
const NOROOM = ["There is no room ","They haven't got any seats ","It's not possible to order "];

const MONTH = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]


// Function Handler


app.post('/', function (req, res) {
    const assistant = new ApiAiApp({request: req, response: res});
    let today = new Date();
    console.log("today : " + today.getDay()+" "+today.getMonth()+" "+today.getHours()+" "+today.getMinutes());

    // Pour selectionner un element d'une liste
    function R(assistant, array) {
        return array[Math.floor(Math.random() * (array.length))];
    }

    function confirmation (assistant) {

        if (assistant.data.problem != false) {
            assistant.ask(assistant.data.problem);
            return;
        }
        let time = assistant.data.time;
        let minutes = parseInt(time.substring(0,2))*60 + parseInt(time.substring(3,5));
        let date = assistant.data.date;
        let T = false;
        let month = parseInt(date.substring(5,7));
        let day = parseInt(date.substring(8,10));
        let maxDays = new Date(date.substring(0,4),month,0).getDate();
        let tries = 0;

        while (T === false) {


        T = disponible(date,minutes);
        if (T === false) {
            //Pas de place ce jour
            console.log("Pas de place ce jour");
            if (tries == 7) {
                break;
            }
            tries++;
            day++;
            if (day > maxDays) {
                month++;
                day = 1;
            }
            date = date.substring(0,4)+'-'+('0'+month.toString()).slice(-2)+'-'+('0'+day.toString()).slice(-2);

        } else if (Math.abs(parseInt(T.substring(0,2))*60 + parseInt(T.substring(3,5)) - minutes) <= 15) {
             //Tout est bon
            console.log("tout est bon");
            assistant.data.time = T;
        } else {
            //Pas de place à cette heure mais à une autre heure le même jour
            console.log("Une place à une autre heure");
            assistant.data.time = T;
            if (!assistant.data.proposition) {
                assistant.data.proposition = true;
                assistant.data.message += R(assistant, NOROOM) + "at this hour. ";
            }
        }

        }  
        if (T === false) {
            assistant.ask(R(assistant, NOROOM) + "this day and the week after. You may try another date. ");
            return;
        }

        let message = createMessage(assistant);

        if (assistant.data.proposition) {
            assistant.data.state = YES_NO_STATE;
            assistant.ask(assistant.data.message + R(assistant, PROPOSITION) + message + R(assistant, AGREE));
            return;
        } else {
            assistant.data.state = YES_NO_STATE;
            assistant.ask(R(assistant, READY) + message + R(assistant, FINISH));
            return;
        }        
    }

    function createMessage(assistant) {
        let cd = assistant.getArgument('cd');
        let cr = assistant.getArgument('cr');
        let cln = assistant.getArgument('cln');
        let cn = assistant.getArgument('cn');
        let ct = assistant.getArgument('ct');
        return (cn?"for "+assistant.data.places+" person"+(assistant.data.places>1?"s ":" "):"")+(cr?"the restaurant "+assistant.data.restaurant+" ":"")+(cd?"on "+assistant.data.date.substring(5)+" ":"")+(ct?"at "+assistant.data.time+" ":"")+(cln?"with the name "+assistant.data.name+" ":"")+". ";
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
            assistant.tell(R(assistant, SUCCESS) + assistant.data.name);
        } else {
            console.log("invalide");
            assistant.ask("There was an error, the places are not available anymore. ");
        }
    
    }

    function disponible(date, time) {
        let min;
        let max;
        let possibleTime = [];
        let placeRestante;
        let horairesJour = horaires[assistant.data.restaurant][date];
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

            if (min<=time && time<=max && placeRestante >= assistant.data.places && (today.getDate() != parseInt(date.substring(8,10)) || (today.getMinutes()+30+(today.getHours())*60)<min ) ) {
                assistant.data.creneau = i;
                return ('0' + (min/60).toString()).slice(-2) + ':' + ('0' + (min-(min/60)*60).toString()).slice(-2);
            } else if (placeRestante >= assistant.data.places) {
                if (time>max && today.getDate() != parseInt(date.substring(8,10) )) {
                    possibleTime[0] = min;
                    possibleTime[2] = i;
                } else if (time<min && possibleTime[0] == undefined) {
                    possibleTime[1] = min;
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
        let answer = ('0' + (rightTime/60).toString()).slice(-2) + ':' + ('0' + (rightTime-(rightTime/60)*60).toString()).slice(-2);
        console.log("temps proposé : " + answer);
        return answer;
    }

    // intents

    function start (assistant) {
        
        assistant.data.proposition = false;
        assistant.data.message = "";
        assistant.data.problem = false;
        assistant.data.date ="";
        assistant.data.name ="";
        assistant.data.restaurant ="";
        assistant.data.places="";
        assistant.data.time ="";


        assistant.data.state = WELCOME_STATE;
        assistant.ask(R(assistant, WELCOME));
    }

    function reserve (assistant) {

        assistant.data.proposition = false;
        assistant.data.message = "";
        assistant.data.problem = false;
        assistant.data.state = RESERVE_STATE;
        assistant.data.restaurant = assistant.getArgument('resto').toUpperCase();
        let datebis = assistant.getArgument('datebis');
        let timebis = assistant.getArgument('timebis');
        assistant.data.name = assistant.getArgument('last-name');
        assistant.data.places = parseInt(assistant.getArgument('number'));
        let todayNormalized = today.getFullYear().toString()+'-'+('0' + (today.getMonth()+1).toString()).slice(-2)+'-'+('0' + (today.getDate()).toString()).slice(-2);

        if (isNaN(assistant.data.places)) {
                assistant.data.problem = "I didn't understand the number of persons. "
            }

        if (datebis == "today") {
            assistant.data.date = todayNormalized;
        } else if (parseInt(datebis) == NaN) {
            assistant.data.problem = "What was the date ? ";
        } else {
            assistant.data.date = datebis;
        }
        let date = assistant.data.date;
        
        if (timebis && !isNaN(parseInt(timebis))) {
            assistant.data.time = timebis.substring(0,5);
        } else {
            assistant.data.proposition = true;
            if (date == todayNormalized) {
                assistant.data.time = ('0' + (today.getHours()+3).toString()).slice(-2) + ":" + ('0' + today.getMinutes().toString()).slice(-2);
            } else {
                assistant.data.time = "12:30";
            }
        }

        let restaurant = assistant.data.restaurant;
        console.log(restaurant);

        if (!assistant.data.places) {
            assistant.setContext("asknumber");
            return;
        }

        confirmation(assistant);

    }

    function yes (assistant) {
        let state = assistant.data.state;
        if (state == WELCOME_STATE) {
            assistant.data.state = RESERVE_STATE;
            assistant.ask("Choose your restaurant. ")
            return;
        }
        if (state == RESERVE_STATE) {
            
        }
        if (state == YES_NO_STATE) {
            assistant.data.proposition = false;
            reserver(assistant);;
        }

    }

    function no (assistant) {
        let state = assistant.data.state;
        if (state == WELCOME_STATE) {
            quit(assistant);
            return;
        }
        if (state == YES_NO_STATE) {
            assistant.data.state = RESERVE_STATE;
            assistant.ask(R(assistant, CHANGE));
            return;
        }

    }

    function quit (assistant) {
        assistant.tell(R(assistant, BYE));
    }


    // Mapping intentions

    let actionMap = new Map();

    actionMap.set('start', start);
    actionMap.set('reserve', reserve);
    actionMap.set('quit', quit);
    actionMap.set('confirmation', confirmation);
    actionMap.set('yes', yes);
    actionMap.set('no', no);



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