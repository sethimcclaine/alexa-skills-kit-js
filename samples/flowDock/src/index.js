// App ID for the skill
var APP_ID = undefined; //replace with 'amzn1.echo-sdk-ams.app.[your-unique-value-here]';

var https = require('https');
var EventSource = require('eventsource');
var ESS = require('event-source-stream')
var request = require("request");

var AlexaSkill = require('./AlexaSkill'); // Module with AlexaSkill prototype and helper functions

// FlowdockSkill is a child of AlexaSkill.
var FlowdockSkill = function() { AlexaSkill.call(this, APP_ID); };


    var cred = '189d5c6a1f949e47c62eb886bbc81351',
        userId = '191227',
        pass = 'password',
        org = 'rally-software',
        //flow = 'ie';
        flow = 'amazingwalnuts';

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
    "ListUsersIntent": handleListUsersRequest,
    "PostMessageIntent": handlePostMessageRequest,
    "AMAZON.HelpIntent": handleHelpRequest,
    "AMAZON.StopIntent": handleEndSession,
    "AMAZON.CancelIntent": handleEndSession 
};

function getWelcomeResponse(response) {
    var speechOutput = {
        speech: "<speak><p>Flowdock.</p> <p>Available options are watch, users, and send</p></speak>",
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

    ESS('https://'+cred+':'+pass+'@stream.flowdock.com/flows?filter='+org+'/'+flow)
    .on('data', function(data) {
        callback("You've receive a message, it's legit");
    });
    //callback("You've receive a message, not really");
}

function handleListUsersRequest(intent, session, response) {
    var callback = function(message) {
        response.tell({
            speech: message,  
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        });
    }
    getUserListFromFlowdock('array', callback);
}

function handlePostMessageRequest(intent, session, response) {
    var message = "Hi KG";
    var callback = function(message) {
        response.tell({
            speech: message,  
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        });
    }
    postMessageToFlowdock(message, callback);
}

function postMessageToFlowdock(message, callback) {
    var url = 'https://'+cred+':'+pass+'@api.flowdock.com/flows/'+org+'/'+flow+'/messages';
    var date = new Date();

     var hour = date.getHours();
     hour = (hour < 10 ? "0" : "") + hour;

     var min  = date.getMinutes();
     min = (min < 10 ? "0" : "") + min;

    var options = { method: 'POST',
        url: url,
        qs: { 
            event: 'message',
            content: message + ' (message sent via Alexa)' 
        },
        headers: { 
            'postman-token': '565ef014-b85a-14b8-69c8-29a393241cec',
            'cache-control': 'no-cache' 
        } 
    };

    request(options, function (error, response, body) {
        var message = 'Message sent successfully';
        if (error) {
            //console.log('Error: '+error);
            callback('Error sending message: ' + message);
        } else {
            callback('Message Sent: ' + message);
        }
        //console.log(body);
    });
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

