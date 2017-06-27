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

        let message = assistant.data.restaurant + " le " + assistant.data.date + " à " + assistant.data.time + ". ";

        if (assistant.data.proposition) {
            assistant.ask(assistant.data.message + "Je peux vous proposer d'aller manger au restaurant " + message + "Etes vous d'accord ? ");
            return;
        }
        if (!assistant.data.name) {
            assistant.setContext("information");
            assistant.ask("Une table est prête pour " + assistant.data.places + " personne" + (assistant.data.places>1 ? "s ":"") + message + "A quel nom dois-je reserver ? ");
            assistant.data.state = CONFIRM_STATE;
            return;
        } 

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
        if (horaires == undefined) {return false;}
        if (horaires.length == 0) {return false;}
        for (let i = 0; i<horaires.length;i++) {
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
            assistant.data.places = number;
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
            assistant.data.restaurant = resto;
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
        restaurant = restaurant.toUpperCase();
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
                assistant.data.message += "Il n'y a pas de place ce jour-çi. ";
                confirmation(assistant);
            } else {
                //Pas de place à cette heure mais à une autre heure le même jour
                console.log("Une place à une autre heure");
                assistant.data.proposition = true;
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