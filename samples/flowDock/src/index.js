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
    "PostFlowMessageIntent": handlePostFlowMessageRequest,
    "PostPrivateMessageIntent": handlePostPrivateMessageRequest,
    "AMAZON.HelpIntent": handleHelpRequest,
    "AMAZON.StopIntent": handleEndSession,
    "AMAZON.CancelIntent": handleEndSession 
};

function getWelcomeResponse(response) {
    var speechOutput = {
        speech: "<speak><p>Flowdock... Ready for duty!</p></speak>",
        type: AlexaSkill.speechOutputType.SSML
    };
    var repromptOutput = {
        speech: "Available options are 'watch', 'users', 'private message' and 'flow message'",
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    };
    var cardTitle = "This Day in History";//@TODO replace card title
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

function handlePostPrivateMessageRequest(intent, session, response) {
    var message = intent.slots.msg.value;
    var callback = function(message) {
        response.tell({
            speech: message,  
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        });
    }
    postPrivateMessageToFlowdock(message, callback);
}
function handlePostFlowMessageRequest(intent, session, response) {
    var message = intent.slots.msg.value;
    var callback = function(message) {
        response.tell({
            speech: message,  
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        });
    }
    postFlowMessageToFlowdock(message, callback);
}
function postMessageToFlowdock(url, message, callback) {

    var options = { method: 'POST',
        url: url,
        qs: { 
            event: 'message',
            tags: '#alexa',
            content: message 
        },
        headers: { 
            'postman-token': '565ef014-b85a-14b8-69c8-29a393241cec',
            'cache-control': 'no-cache' 
        } 
    };

    request(options, function (error, response, body) {
        if (error) {
            callback('Error sending message: ' + message);
        } else {
            callback('Message Sent: ' + message);
        }
    });
}

function postFlowMessageToFlowdock(message, callback) {
    var url = 'https://'+cred+':'+pass+'@api.flowdock.com/flows/'+org+'/'+flow+'/messages';

    postMessageToFlowdock(url, message, callback);
}

function postPrivateMessageToFlowdock(message, callback) {
    var ashley = 128632;
    var user = ashley;
    var url = 'https://'+cred+':'+pass+'@api.flowdock.com/private/'+user+'/messages';

    postMessageToFlowdock(url, message, callback);
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

