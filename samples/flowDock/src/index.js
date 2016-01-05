// App ID for the skill
var APP_ID = undefined; //replace with 'amzn1.echo-sdk-ams.app.[your-unique-value-here]';
var https = require('https');

// The AlexaSkill Module that has the AlexaSkill prototype and helper functions
var AlexaSkill = require('./AlexaSkill');

// URL prefix to download history content from Wikipedia
var urlPrefix = 'https://en.wikipedia.org/w/api.php?action=query&prop=extracts&format=json&explaintext=&exsectionformat=plain&redirects=&titles=';

// Variable defining number of events to be read at one time
var paginationSize = 3;
// Variable defining the length of the delimiter between events
var delimiterSize = 2;

/**
 * FlowdockSkill is a child of AlexaSkill.
 */
var FlowdockSkill = function() {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
FlowdockSkill.prototype = Object.create(AlexaSkill.prototype);
FlowdockSkill.prototype.constructor = FlowdockSkill;

FlowdockSkill.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("FlowdockSkill onSessionStarted requestId: " + sessionStartedRequest.requestId + ", sessionId: " + session.sessionId);
    // any session init logic would go here
};

FlowdockSkill.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("FlowdockSkill onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    getWelcomeResponse(response);
};

FlowdockSkill.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
};

FlowdockSkill.prototype.intentHandlers = {
    "ObserveFlowIntent": function (intent, session, response) {
        handleObserveFlowIntentRequest(intent, session, response);
    },
    "GetFirstEventIntent": function (intent, session, response) {
        handleFirstEventRequest(intent, session, response);
    },
    "ListUsersIntent": function (intent, session, response) { 
        handleListUsersIntent(intenet, session, response);
    },
    "GetNextEventIntent": function (intent, session, response) {
        handleNextEventRequest(intent, session, response);
    },
    "AMAZON.HelpIntent": function (intent, session, response) {
        var speechOutput = {
            speech: "With Flowdock, you can monitor flows for your organization",
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        var repromptOutput = {
            speech: "Which flow would you like to monitor?",
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.ask(speechOutput, repromptOutput);
    },
    "AMAZON.StopIntent": function (intent, session, response) {
        var speechOutput = {
                speech: "Goodbye",
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.tell(speechOutput);
    },
    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = {
                speech: "Goodbye",
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.tell(speechOutput);
    }
};

/**
 * Function to handle the onLaunch skill behavior
 */

function getWelcomeResponse(response) {
    // If we wanted to initialize the session to have some attributes we could add those here.

    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var speechOutput = {
        //speech: "<speak><p>History buff.</p> <p>What day do you want events for?</p></speak>",
        speech: "<speak><p>Flowdock.</p> <p>Which flow do you want to monitor?</p></speak>",
        type: AlexaSkill.speechOutputType.SSML
    };
    var repromptOutput = {
        //speech: "With History Buff, you can get historical events for any day of the year.  For example, you could say today, or August thirtieth. Now, which day do you want?",
        speech: "With Flowdock, you can monitor flows for your organization",
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    };

    var cardTitle = "This Day in History";
    //var cardOutput = "History Buff. What day do you want events for?";
    var cardOutput = "Flowdock. Which flow do you want to monitor?";
    response.askWithCard(speechOutput, repromptOutput, cardTitle, cardOutput);
}

function handleObserveFlowIntentRequest(intent, session, response) {
    response.tell({
        speech: "TODO Observe Flow",
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    });
}
function handleListUsersIntent(intent, session, response) {
    response.tell({
        speech: "in progress:: List Users",
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    });
    /*
    getUserListFromFlowdock(function(users) {

        var speach = ""
        for (var i = 0; i < users.length; i++) {
            speach += "<p>"+users[i].name+"</p>";
        }
        response.tell({
            speech: speach,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        });
    });
    */
}
/**
 * Gets a poster prepares the speech to reply to the user.
 */
function handleFirstEventRequest(intent, session, response) {
    var daySlot = intent.slots.day;
    var repromptText = "With History Buff, you can get historical events for any day of the year.  For example, you could say today, or August thirtieth. Now, which day do you want?";
    var monthNames = ["January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"
    ];
    var sessionAttributes = {};
    // Read the first 3 events, then set the count to 3
    sessionAttributes.index = paginationSize;
    var date = "";

    // If the user provides a date, then use that, otherwise use today
    // The date is in server time, not in the user's time zone. So "today" for the user may actually be tomorrow
    if (daySlot && daySlot.value) {
        date = new Date(daySlot.value);
    } else {
        date = new Date();
    }

    var prefixContent = "<p>For " + monthNames[date.getMonth()] + " " + date.getDate() + ", </p>";
    var cardContent = "For " + monthNames[date.getMonth()] + " " + date.getDate() + ", ";

    var cardTitle = "Events on " + monthNames[date.getMonth()] + " " + date.getDate();

    getJsonEventsFromWikipedia(monthNames[date.getMonth()], date.getDate(), function (events) {
        var speechText = "",
            i;
        sessionAttributes.text = events;
        session.attributes = sessionAttributes;
        if (events.length == 0) {
            speechText = "There is a problem connecting to Wikipedia at this time. Please try again later.";
            cardContent = speechText;
            response.tell(speechText);
        } else {
            for (i = 0; i < paginationSize; i++) {
                cardContent = cardContent + events[i] + " ";
                speechText = "<p>" + speechText + events[i] + "</p> ";
            }
            speechText = speechText + " <p>Wanna go deeper in history?</p>";
            var speechOutput = {
                speech: "<speak>" + prefixContent + speechText + "</speak>",
                type: AlexaSkill.speechOutputType.SSML
            };
            var repromptOutput = {
                speech: repromptText,
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            };
            response.askWithCard(speechOutput, repromptOutput, cardTitle, cardContent);
        }
    });
}

/**
 * Gets a poster prepares the speech to reply to the user.
 */
function handleNextEventRequest(intent, session, response) {
    var cardTitle = "More events on this day in history",
        sessionAttributes = session.attributes,
        result = sessionAttributes.text,
        speechText = "",
        cardContent = "",
        repromptText = "Do you want to know more about what happened on this date?",
        i;
    if (!result) {
        speechText = "With History Buff, you can get historical events for any day of the year.  For example, you could say today, or August thirtieth. Now, which day do you want?";
        cardContent = speechText;
    } else if (sessionAttributes.index >= result.length) {
        speechText = "There are no more events for this date. Try another date by saying <break time = \"0.3s\"/> get events for august thirtieth.";
        cardContent = "There are no more events for this date. Try another date by saying, get events for august thirtieth.";
    } else {
        for (i = 0; i < paginationSize; i++) {
            if (sessionAttributes.index>= result.length) {
                break;
            }
            speechText = speechText + "<p>" + result[sessionAttributes.index] + "</p> ";
            cardContent = cardContent + result[sessionAttributes.index] + " ";
            sessionAttributes.index++;
        }
        if (sessionAttributes.index < result.length) {
            speechText = speechText + " Wanna go deeper in history?";
            cardContent = cardContent + " Wanna go deeper in history?";
        }
    }
    var speechOutput = {
        speech: "<speak>" + speechText + "</speak>",
        type: AlexaSkill.speechOutputType.SSML
    };
    var repromptOutput = {
        speech: repromptText,
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    };
    response.askWithCard(speechOutput, repromptOutput, cardTitle, cardContent);
}

function getUserListFromFlowdock(callback) {
    var cred = '189d5c6a1f949e47c62eb886bbc81351',
        pass = 'password',
        org = 'rally-software',
        flow = 'ie';

    http.get('https://'+cred+":"+pass+'@api.flowdock.com/users/', function (res) {
        var body = "";
        res.on('data', function (chunk) {
            body += JSON.parse(chunk);
        });
        res.on('end', function () {
            for (var i = 0; i < res.length; i++) {
                users[res[i].id] = res[i];
            }
            callback(users);
        });
    }
    ).on('error', function (e) {
        console.log("Got error: ", e);
    });
}

function getJsonEventsFromWikipedia(day, date, eventCallback) {
    var url = urlPrefix + day + '_' + date;

    https.get(url, function(res) {
        var body = '';

        res.on('data', function (chunk) {
            body += chunk;
        });

        res.on('end', function () {
            var stringResult = parseJson(body);
            eventCallback(stringResult);
        });
    }).on('error', function (e) {
        console.log("Got error: ", e);
    });
}

function parseJson(inputText) {
    // sizeOf (/nEvents/n) is 10
    var text = inputText.substring(inputText.indexOf("\\nEvents\\n")+10, inputText.indexOf("\\n\\n\\nBirths")),
        retArr = [],
        retString = "",
        endIndex,
        startIndex = 0;

    if (text.length == 0) {
        return retArr;
    }

    while(true) {
        endIndex = text.indexOf("\\n", startIndex+delimiterSize);
        var eventText = (endIndex == -1 ? text.substring(startIndex) : text.substring(startIndex, endIndex));
        // replace dashes returned in text from Wikipedia's API
        eventText = eventText.replace(/\\u2013\s*/g, '');
        // add comma after year so Alexa pauses before continuing with the sentence
        eventText = eventText.replace(/(^\d+)/,'$1,');
        eventText = 'In ' + eventText;
        startIndex = endIndex+delimiterSize;
        retArr.push(eventText);
        if (endIndex == -1) {
            break;
        }
    }
    if (retString != "") {
        retArr.push(retString);
    }
    retArr.reverse();
    return retArr;
}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the HistoryBuff Skill.
    var skill = new FlowdockSkill();
    skill.execute(event, context);
};

