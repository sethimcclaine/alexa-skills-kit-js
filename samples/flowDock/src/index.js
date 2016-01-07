// App ID for the skill
var APP_ID = undefined; //replace with 'amzn1.echo-sdk-ams.app.[your-unique-value-here]';
var https = require('https');
/*
var EventSource = require('eventsource');
/*/
var EventSource = require('event-source-stream')
//*/

var AlexaSkill = require('./AlexaSkill'); // Module with AlexaSkill prototype and helper functions

// FlowdockSkill is a child of AlexaSkill.
var FlowdockSkill = function() { AlexaSkill.call(this, APP_ID); };


    var cred = '189d5c6a1f949e47c62eb886bbc81351',
        userId = '191227',
        pass = 'password',
        org = 'rally-software',
        flow = 'ie';

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
    "ObserveFlowIntent": handleObserveFlowIntentRequest,
    "ListUsersIntent": handleListUsersIntent,
    "AMAZON.HelpIntent": handleHelpRequest,
    "AMAZON.StopIntent": handleEndSession,
    "AMAZON.CancelIntent": handleEndSession 
};

function getWelcomeResponse(response) {
    var speechOutput = {
        speech: "<speak><p>Flowdock.</p> <p>Which flow do you want to monitor?</p></speak>",
        type: AlexaSkill.speechOutputType.SSML
    };
    var repromptOutput = {
        speech: "With Flowdock, you can monitor flows for your organization",
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    };
//@TODO replace card title
    var cardTitle = "This Day in History";
    var cardOutput = "Flowdock. Which flow do you want to monitor?";
    response.askWithCard(speechOutput, repromptOutput, cardTitle, cardOutput);
}

function handleHelpRequest (intent, session, response) {
    var speechOutput = {
        speech: "With Flowdock, you can monitor flows for your organization",
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    };
    var repromptOutput = {
        speech: "Which flow would you like to monitor?",
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    };
    response.ask(speechOutput, repromptOutput);
}

function handleEndSession(intent, session, response) {
    response.tell({
            speech: "Flowdock... OUT!",
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
    });
}

function handleObserveFlowIntentRequest(intent, session, response) {
    var callback = function (message) {
        response.tell({
            speech: message,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        });
    };
    /*
    var jsonStream = new EventSource('https://'+cred+':'+pass+'@stream.flowdock.com/flows?filter='+org+'/'+flow);
    jsonStream.onmessage = function (e) {

        callback("You've receive a message");
        //handleMessage(JSON.parse(e.data));
    }
    */
        callback("You've receive a message");
}

function handleListUsersIntent(intent, session, response) {
    var callback = function(message) {
        response.tell({
            speech: message,  
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        });
    }
    getUserListFromFlowdock('array', callback);
}

function getUserListFromFlowdock(returnType, callback) {

    var url = 'https://'+cred+":"+pass+'@api.flowdock.com/users/';

    https.get(url, function (res) {
        var body = "";
        res.on('data', function (chunk) {
            body += chunk;
        });
        res.on('end', function () {
           if(returnType !== 'array') { 
                var users = {};
                body = JSON.parse(body);
                for (var i = 0; i < body.length; i++) {
                    users[body[i].id] = body[i];
                }
                callback(users);
            } else { 
                var userArray = JSON.parse(body);
                var message = "";
                for (var i = 0; i < userArray.length; i++) {
                    message += ", " + userArray[i].name;
                }
                callback(message);
            }
        });
    }).on('error', function (e) {
        callback('callback failed');
        console.log("Got error: ", e);
    });
}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the HistoryBuff Skill.
    var skill = new FlowdockSkill();
    skill.execute(event, context);
};

