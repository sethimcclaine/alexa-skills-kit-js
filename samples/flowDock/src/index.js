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
        users = {
            ashley: 128632,
            kg: 30173,
        }
        flows = {
            amazingwalnuts: 'amazingwalnuts',
            developers: 'developers',
            Foosball: 'fooseball',
            Snowman: '(☃)',
            Boulder: 'boulder'
        },
        flow = 'amazingwalnuts',
        recipient = users['ashley'];

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
    "SetFlowIntent": handleSetFlowRequest,
    "PostPrivateMessageIntent": handlePostPrivateMessageRequest,
    "SetRecipientIntent": handleSetRecipientRequest,
    "AMAZON.HelpIntent": handleHelpRequest,
    "AMAZON.StopIntent": handleEndSession,
    "AMAZON.CancelIntent": handleEndSession 
};

CANNED_MESSAGES = {
    welcome: "<speak><p>Flowdock... Ready for duty!</p></speak>",
    reprompt: "<speak><p>Available options are 'watch', 'users', 'private message' and 'flow message'</p></speak>",
    help: "<speak><p>We can now interact with Flowdock, available options include 'watch', 'users', 'private message' and 'flow message'</p></speak>",
    goodbye: "<speak><p>Flowdock... OUT!</p></speak>",
}

function getOutput(message) {
    return {
        speech: CANNED_MESSAGES[message],
        type: AlexaSkill.speechOutputType.SSML
    }
}
function responseCallback(message) {
        response.ask({
            speech: message,  
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        }, getOutput('reprompt'));
}

function getWelcomeResponse(response) {
    /*
    //@TODO do we need a card?
    var cardTitle = "This Day in History";//@TODO replace card title
    var cardOutput = "Flowdock. Which flow do you want to monitor?";
    response.askWithCard(getOutput('welcome'), getOutput('reprompt'), cardTitle, cardOutput);
    */
    response.ask(getOutput('welcome'), getOutput('reprompt'));
}

function handleHelpRequest (intent, session, response) {
    response.ask(getOutput('help'), getOutput('reprompt'));
}

function handleEndSession(intent, session, response) {
    response.tell(getOuptut('gooodbye'));
}

function handleListUsersRequest(intent, session, response) {
    getUserListFromFlowdock('array', responseCallback);
}

function handlePostPrivateMessageRequest(intent, session, response) {
    postPrivateMessageToFlowdock(intent.slots.msg.value + '(message sent with Alexa)', responseCallback);
}
function handleSetRecipientRequest(intent, session, response) {
    recipient = intent.slots.recipient.value;
    //@TODO should this be `askWithCard`
    response.ask({
        speech: 'Current recipient has been set to: '+recipient,  
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    }, getOutput('reprompt'));
}


function handleSetFlowRequest (intent, session, response) {
    flow = intent.slots.flow.value;
    //@TODO should this be `askWithCard`
    response.ask({
        speech: 'Current flow has been set to: '+flow,  
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    }, getOutput('reprompt'));
}

function handlePostFlowMessageRequest(intent, session, response) {
    postFlowMessageToFlowdock(intent.slots.msg.value, responseCallback);
}

function handleObserveFlowIntentRequest(intent, session, response) {
    var callback = function (message) {
        response.tell({
            speech: message,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        });
    };
    ESS('https://'+cred+':'+pass+'@stream.flowdock.com/flows?filter='+org+'/'+flow)
    .on('data', function(data) {
        callback("You've receive a message, it's legit");
    });
}

function postMessageToFlowdock(url, message, callback) {

    var options = { method: 'POST',
        url: url,
        qs: { 
            event: 'message',
            tags: '#sent-with-alexa',
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
    var url = 'https://'+cred+':'+pass+'@api.flowdock.com/private/'+recipient+'/messages';
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

