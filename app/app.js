'use strict';

/* This Alexa skill implements simple guess number game. */

// =================================================================================
// App Configuration
// =================================================================================

const {App} = require('jovo-framework');

const config = {
    logging: false,
};

const app = new App(config);

const debug = true;



// =================================================================================
// App Logic
// =================================================================================

/* defines highest possible number */
const HIGH_LIMIT = 100;

/* ssml for asking for new game*/
const NEW_GAME_REQUEST_TEXT = 'Would you like to play a new guess number game?';

/* reprompt ssml for asking for new number */
const GIVE_NUMBER_MESS = 'guess number, please!';

/* list of reaction on user's numeric voice input */
const REACTIONS_LIST = ['', '', 'Try again', 'You have one more chance',
    'May you\'ll be lucky next time', 'Guess new number'];

/* generate variable response for user numeric input */
function generateMessage(numberOfGuesses) {
    const finalText = (numberOfGuesses <= 5) ?
        REACTIONS_LIST[Math.round(Math.random() * REACTIONS_LIST.length)]:
        'don\'t give up!';
    if (debug) {console.log(finalText)}
    return finalText;
}


app.setHandler({
    /* start point of app */
    'LAUNCH': function() {
        this.toIntent('HelloWorldIntent');
    },

    /* greeting and asking for name */
    'HelloWorldIntent': function() {
        const speech = 'Hi! What\'s your name?';
        this.ask(speech, 'Please tell me your name.');
    },

    /* saves users name and ask for new game */
    'MyNameIsIntent': function(name) {
        if (debug) {console.log(`MyNameIsIntent called. User name is ${name.value}`)}
        this.setSessionAttribute('name', name.value);
        this.followUpState('StartNewGameIntent')
            .ask(`Hey ${name.value}. ${NEW_GAME_REQUEST_TEXT}`,
                'Do you want to play?');
    },

    /* first step in running game, setting random number and number of guesses
     * this intent redirects to GuessGameIntent */
    'StartNewGameIntent': {
        'AMAZON.YesIntent': function() {
            if (debug) {console.log('StartNewGameIntent was called. Answer is yes')}
            this.setSessionAttribute('randomNumber', Math.round(Math.random() * HIGH_LIMIT));
            this.setSessionAttribute('numberOfGuesses', 1);
            if (debug) {console.log(`Random choice is ${this.getSessionAttribute('randomNumber')}`)}

            const speech = `Guess number between zero and ${HIGH_LIMIT}`;
            this.followUpState('GuessGameIntent').ask(speech, 'Guess number, please!');
        },

        /* running if user don't wont to play game */
        'AMAZON.NoIntent': function () {
            if (debug) {console.log('StartNewGameIntent was called. Answer is no')}
            const speech = 'OK, we\'ll play another time';
            this.tell(speech);
        },
    },

    /* main 'loop' of guess number game */
    'GuessGameIntent': {
        'NumberGuessIntent': function (number) {
            const numberGuess = Number(number.value);
            if (debug) {console.log(`NumberGuessIntent was called. Guessed number is ${numberGuess}`)}

            // negative number handling
            if (numberGuess < 0) {
                const speech = 'Number should be non negative, try again please!';
                this.followUpState('GuessGameIntent')
                    .ask(speech, GIVE_NUMBER_MESS);
            }
            // higher then HIGH_LIMIT number handling
            else if (numberGuess > HIGH_LIMIT) {
                const speech1 = 'Number should be up to one hundred, guess again';
                this.followUpState('GuessGameIntent')
                    .ask(speech1, GIVE_NUMBER_MESS);
            }
            // too low number handling
            else if (numberGuess < this.getSessionAttribute('randomNumber')) { // to low handler
                this.setSessionAttribute('numberOfGuesses', this.getSessionAttribute('numberOfGuesses') + 1);
                const speech2 = `Too low. ${generateMessage(this.getSessionAttribute('numberOfGuesses'))}`;
                this.followUpState('GuessGameIntent')
                    .ask(speech2, GIVE_NUMBER_MESS);
            }
            // too high number handling
            else if (numberGuess > this.getSessionAttribute('randomNumber')) {
                this.setSessionAttribute('numberOfGuesses', this.getSessionAttribute('numberOfGuesses') + 1);
                const speech3 = `Too high. ${generateMessage(this.getSessionAttribute('numberOfGuesses'))}`;
                this.followUpState('GuessGameIntent')
                    .ask(speech3, GIVE_NUMBER_MESS);
            }
            else { // user found number handling
                this.followUpState('StartNewGameIntent')
                    .ask(`Hurray ${this.getSessionAttribute('name')}, you find the number just in 
                    ${this.getSessionAttribute('numberOfGuesses')} steps. 
                    Congratulation! ${NEW_GAME_REQUEST_TEXT}`,
                        'You win! Do you want to play a new game?');
            }
        },

        'Unhandled': function () {
            this.followUpState('GuessGameIntent').ask('Your guess isn\'t a number, try again', 'Say number!');
        }
    },

    'Unhandled': function () {
        this.toIntent('MyNameIsIntent');
    },
});

module.exports.app = app;
