const AWS = require('./AWS_API.js');
const GIT = require('./GITHUB_API.js');
const SLACK = require('./SlackInterface.js');
const Interpreter = require('./interpreter.js');
const DEBUG = module.exports.DEBUG;
AWS.DEBUG = DEBUG;

//Interpreter Setup
var INTERPRETER = new Interpreter();
var builtinPhrases = require('./phrases');
console.log('Jarvis is learning...');
Teach = INTERPRETER.teach.bind(INTERPRETER);
eachKey(builtinPhrases, Teach);
INTERPRETER.think();
console.log('Jarvis finished learning, time to listen...');

//Main Controller Code

exports.parseCommand = function(message) {
    var text = message.text;
     if (DEBUG) { console.log("Parsing Command: "+text)}
    if (keyMessage(text, 'aws ')) {
        text = text.substring('aws '.length, text.length);
        if (keyMessage(text, 'check ec2 ')) {
            text = text.substring('check ec2 '.length, text.length);
            if (keyMessage(text, 'instance ')) {
                SLACK.handleMessagePromise(AWS.checkEC2Instance(text.substring('instance '.length, text.length)), message);
            } else {
                SLACK.handleMessagePromise(AWS.checkEC2(), message);
            }
        } else if (keyMessage(text, 'check number of instances ')) {
            SLACK.handleMessagePromise(AWS.checkNumInstances(), message);
        } else {
            SLACK.sendMessage("AWS command does not exist", message);
        }
    } else if (keyMessage(text, 'slack ')) {
        text = text.substring('slack '.length, text.length);
        var userRegex = /<@([A-Z|1-9]+.)>/i;
        var channelRegex = /<?#([A-Z0-9]+)(\|\w+>)?/i;
        if (userRegex.test(text)) {
            SLACK.handleMessagePromise(SLACK.slackUserName(text.replace(userRegex, '$1')), message);
        } else if (channelRegex.test(text)) {
            var key = text.replace(channelRegex, '$1');
            SLACK.handleMessagePromise(SLACK.slackChannelInfo(key), message);
        } else if (keyMessage(text, 'list users ')) {
            SLACK.handleMessagePromise(SLACK.slackTeamList(), message);
        } else if (keyMessage(text, 'whoami ')) {
            SLACK.handleMessagePromise(SLACK.slackWhoAmI(), message);
        } else if (keyMessage(text, 'whos online ')) {
            SLACK.handleMessagePromise(SLACK.slackWhoseOnline(), message);
        } else if (keyMessage(text, 'debug ')) {
            SLACK.sendMessage("Debug: "+JSON.stringify(message), message);
        } else {
            SLACK.sendMessage("Slack command does not exist", message);
        }
    } else if (keyMessage(text, 'git ')) {
		text = text.substring('git '.length, text.length);
			if (keyMessage(text, 'branches')) {
				SLACK.handleMessagePromise(GIT.checkNumberofFeatureBranches(), message);
			}else if (keyMessage(text, 'list branches')) {
				SLACK.handleMessagePromise(GIT.listBranches(), message);
			}else if (keyMessage(text, 'pushed')){
                text = text.substring('pushed '.length, text.length);
				SLACK.handleMessagePromise(GIT.checkLastPushedtoBranchName(text), message);
			}else if (keyMessage(text, 'open pull')){
				SLACK.handleMessagePromise(GIT.checkLatestPullRequest(), message);
			}else if (keyMessage(text, 'closed pull')){
				SLACK.handleMessagePromise(GIT.checkLatestClosedPullRequest(), message);
			}else if (keyMessage(text, 'time')){
                text = text.substring('time '.length, text.length);
			     SLACK.handleMessagePromise(GIT.checkLatestBranchUpdatgeTime(text), message);	
			}else if (keyMessage(text, 'contributors')){
			     SLACK.handleMessagePromise(GIT.checkContributors(), message);
			}else {
				SLACK.sendMessage("Git Command does not exist", message);
			}
    }else if (keyMessage(text, 'help ')) {
        SLACK.handleMessagePromise(getActiveCommands(), message);
    }
    //SAMPLE CONVERSATION CONSTRUCT
    else if (keyMessage(text, 'wait ')) {
		text = text.substring('wait '.length, text.length);
        if(text.length == 0){
            SLACK.startConversation("wait -1 ",message);
            SLACK.sendMessage("I'm Listening for another command", message);
        }else if (keyMessage(text, '-1 ')){
            text = text.substring('-1 '.length, text.length);
            console.log(text);
                if(keyMessage(text,'sample command ')){
                    SLACK.sendMessage("This is a command accessed by conversation", message);
                }else{
                    SLACK.sendMessage("Try using `wait`, then `sample command` :wink: :wink:", message);
                }
            }
    } else {
    	console.log("Text being sent to interpreter...");
    	var interpretation = INTERPRETER.interpret(text);
    	if(interpretation.guess){
    		INTERPRETER.invoke(interpretation.guess, interpretation, message);
    	}
    	else{
    		SLACK.sendMessage("Sorry, I'm not sure what that means.", message);
    	}
    }
}

/*******************************************************************************
 * Helper functions
 */

function keyMessage(text, key) {
    var temptext = text + ' ';
    if (temptext.length >= key.length && temptext.substring(0, key.length).toLowerCase() === key) {
        return true;
    }
    return false;
}

function eachKey(object, callback) {
	  Object.keys(object).forEach(function(key) {
	    callback(key, object[key]);
	  });
	}


getActiveCommands = function(){
	if (exports.DEBUG) {console.log('getActiveCommands called.')}
	return new Promise (function(fulfill,reject){
		
			fulfill("Here are my Current Commands:\n\n \
aws (Cloud - Amazon Web Services) \n \
\tcheck ec2 [instance] \n \
\tcheck number of instances \n \
\n \
git (GitHub) \n\
\tbranches\n\
\tlist branches \n\
\tpushed [branch-name]\n\
\topen pull \n\
\tclosed pull \n\
\ttime [branch-name]\n\
\tcontributors\n\
\n\
slack \n\
\t#(Channel Name)\n\
\t@(Username)\n\
\twhoami\n\
\twhos online\n\
\tlist users\n\
\twait\n");
                    
        
            
    });
 }