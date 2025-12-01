/*
 * Updated task.js for Adaptive vs Static robot experiment
 * - Random assignment to Adaptive / Static via mycondition or fallback random
 * - Quiz with easy/difficult questions
 * - Adaptive robot adjusts feedback based on running correctness counter
 * - Static robot gives terse feedback and always gives review link
 * - Records RT, correctness, clicks, whether user clicked review, and survey responses
 *
 * Make sure psiTurk, _, d3, jQuery are available (same requirements as before)
 */

// Initialize psiTurk object (unchanged)
$(window).on('load', async () => {
var psiTurk = new PsiTurk(uniqueId, adServerLoc, mode);

var mycondition = (typeof condition !== 'undefined') ? condition : null;  
var mycounterbalance = (typeof counterbalance !== 'undefined') ? counterbalance : null; 

var pages = [
    "demographics.html",
    "instructions/instruct-1.html",
    "instructions/instruct-2.html",
    "instructions/instruct-3.html",
    "instructions/instruct-ready.html",
    "stage.html",
    "postquestionnaire.html"
];

var instructionPages = [
    "instructions/instruct-1.html",
    "instructions/instruct-2.html",
    "instructions/instruct-3.html",
    "instructions/instruct-ready.html"
];

const init = (async () => {
    await psiTurk.preloadPages(pages);

    var runDemographics = function() {
        psiTurk.showPage('demographics.html');

        $("#submit-demographics").on("click", function() {
            // Validate all fields are filled
            var age = $('#age').val();
            var gender = $('#gender').val();
            var psiturk_exp = $('#psiturk_exp').val();
            var robot_exp = $('#robot_exp').val();
            
            // Hide all error messages first
            $('#age-error, #gender-error, #psiturk-error, #robot-error').hide();
            
            var isValid = true;
            
            // Validate age (must be a number between 18-80)
            if (!age || isNaN(age) || age < 18 || age > 80) {
                $('#age-error').show();
                isValid = false;
            }
            
            // Validate gender
            if (!gender) {
                $('#gender-error').show();
                isValid = false;
            }
            
            // Validate psiturk experience
            if (!psiturk_exp) {
                $('#psiturk-error').show();
                isValid = false;
            }
            
            // Validate robot experience
            if (!robot_exp) {
                $('#robot-error').show();
                isValid = false;
            }
            
            // If validation fails, show alert and return
            if (!isValid) {
                alert("Please fill out all required fields before continuing.");
                return;
            }

            // 1. Capture Data
            psiTurk.recordUnstructuredData('age', age);
            psiTurk.recordUnstructuredData('gender', gender);
            psiTurk.recordUnstructuredData('psiturk_exp', psiturk_exp);
            psiTurk.recordUnstructuredData('robot_exp', robot_exp);

            // 2. Save
            psiTurk.saveData();

            // 3. Move to Instructions
            psiTurk.doInstructions(instructionPages, function() {
                currentview = new QuizExperiment();
            });
        });
    };

    // Actually run it!
    runDemographics();
})();

/**************
 * Experiment configuration
 **************/
const CONDITIONS = {
    ADAPTIVE: 'adaptive',
    STATIC: 'static'
};

// If mycondition is supplied as 0/1 or 'adaptive'/'static', normalize:
function resolveCondition(raw) {
    if (!raw) {
        // fallback: random
        return Math.random() < 0.5 ? CONDITIONS.ADAPTIVE : CONDITIONS.STATIC;
    }
    if (typeof raw === 'string') {
        raw = raw.toLowerCase();
        if (raw === 'adaptive' || raw === 'a' || raw === '1') return CONDITIONS.ADAPTIVE;
        if (raw === 'static' || raw === 's' || raw === '0') return CONDITIONS.STATIC;
    }
    if (typeof raw === 'number') {
        return (raw === 1) ? CONDITIONS.ADAPTIVE : CONDITIONS.STATIC;
    }
    // default random
    return Math.random() < 0.5 ? CONDITIONS.ADAPTIVE : CONDITIONS.STATIC;
}

var assignedCondition = resolveCondition(mycondition);
console.log("!!! CURRENT CONDITION IS: " + assignedCondition + " !!!");

// Quiz questions array (easy and difficult). Customize/extend.
// Quiz questions: Basic Calc I (Derivatives) & Calc II (Integrals)
// Updated to be more accessible and easier to understand
var questions = [
    {
        id: 'q1', 
        question: 'What is the derivative of 3x? (Enter just the number)', 
        answer: '3', 
        difficulty: 'easy', 
        topic_link: 'https://tutorial.math.lamar.edu/Classes/CalcI/DerivativeIntro.aspx'
    },
    {
        id: 'q2', 
        question: 'What is the derivative of x^2? (Use format: 2x)', 
        answer: '2x', 
        difficulty: 'easy', 
        topic_link: 'https://tutorial.math.lamar.edu/Classes/CalcI/PowerRule.aspx'
    },
    {
        id: 'q3', 
        question: 'What is the derivative of sin(x)? (Use format: cos(x))', 
        answer: 'cos(x)', 
        difficulty: 'easy', 
        topic_link: 'https://tutorial.math.lamar.edu/Classes/CalcI/DiffTrigFcns.aspx'
    },
    {
        id: 'q4', 
        question: 'What is the integral of 2 dx? (Format: 2x, omit +C)', 
        answer: '2x', 
        difficulty: 'easy', 
        topic_link: 'https://tutorial.math.lamar.edu/Classes/CalcI/IndefiniteIntegrals.aspx'
    },
    {
        id: 'q5', 
        question: 'What is the integral of x dx? (Format: x^2/2, omit +C)', 
        answer: 'x^2/2', 
        difficulty: 'medium', 
        topic_link: 'https://tutorial.math.lamar.edu/Classes/CalcI/IndefiniteIntegrals.aspx'
    },
    {
        id: 'q6', 
        question: 'What is the integral of cos(x) dx? (Format: sin(x), omit +C)', 
        answer: 'sin(x)', 
        difficulty: 'medium', 
        topic_link: 'https://tutorial.math.lamar.edu/Classes/CalcI/IntegralsOfTrig.aspx'
    }
];



// shuffle the order for each participant
questions = _.shuffle(questions);

// parameters for adaptive policy
const ADAPTIVE_WINDOW = 3;           // number of recent trials to consider
const ADAPTIVE_THRESHOLD = 0.33;    // if proportion correct <= threshold, robot gives encouragement/offers review

/**************
 * UI & Task flow
 **************/
var QuizExperiment = function() {
    // state
    var trialIndex = 0;
    // --- TIMER LOGIC START ---
    var totalTime = 300; // 300 seconds (5 minutes)
    // Display the timer on the screen
    d3.select("body").append("div")
        .attr("id", "time-container")
        .style({
            "position": "fixed", 
            "top": "10px", 
            "right": "10px", 
            "font-size": "20px", 
            "font-weight": "bold",
            "color": "red",
            "background": "white",
            "padding": "5px",
            "border": "1px solid red"
        });

    var timerInterval = setInterval(function() {
        totalTime--;
        
        var minutes = Math.floor(totalTime / 60);
        var seconds = totalTime % 60;
        // Pad seconds with leading zero
        seconds = seconds < 10 ? '0' + seconds : seconds;
        
        $("#time-container").text("Time Left: " + minutes + ":" + seconds);

        if (totalTime <= 0) {
            clearInterval(timerInterval);
            alert("Time is up! Proceeding to the next section.");
            finish(); // Auto-advance
        }
    }, 1000);
    // --- TIMER LOGIC END ---
    var listening = false;
    var wordon = null;
    var runningCorrectness = []; // keep last ADAPTIVE_WINDOW correctness flags
    var trialStartTime = null;

    // Prepare page
    psiTurk.showPage('stage.html');

    // Build initial UI (assumes #stim, #robotFeedback, #controls exist in stage.html)
    function renderQuestion(q) {
        // Clear previous
        d3.select("#stim").html('');
        d3.select("#robotFeedback").html('');
        d3.select("#controls").html('');

        // Show robot image and question
        d3.select("#stim")
            .append("div")
            .attr("id", "robot-container")
            .style("text-align", "center")
            .style("margin", "20px 0")
            .append("img")
            .attr("src", "/static/images/pnw.png")
            .attr("alt", "Robot Tutor")
            .style("max-width", "200px")
            .style("border", "2px solid #ccc")
            .style("border-radius", "8px")
            .style("padding", "5px");

        d3.select("#stim")
            .append("div")
            .attr("id","question-text")
            .style("font-size","24px")
            .style("margin","20px")
            .style("font-weight", "500")
            .text("Robot asks: " + q.question);

        // input field
        d3.select("#controls")
            .append("input")
            .attr("type","text")
            .attr("id","response-input")
            .attr("placeholder","Type your answer here")
            .style("font-size","18px")
            .style("padding","10px")
            .style("width", "300px")
            .style("margin-right", "10px");

        // submit button
        d3.select("#controls")
            .append("button")
            .attr("id","submit-answer")
            .attr("class", "btn btn-primary btn-lg")
            .text("Submit Answer")
            .on("click", handleSubmit);

        // set focus and start timer
        $("#response-input").focus();
        trialStartTime = new Date().getTime();
    }

    function handleSubmit() {
        var q = questions[trialIndex];
        var response = $("#response-input").val().trim();
        if (response.length === 0) {
            alert("Please type an answer (or type 'skip' to skip).");
            return;
        }
        var rt = new Date().getTime() - trialStartTime;
        var correct = (response === q.answer);

        // record trial data
        psiTurk.recordTrialData({
            phase: "TEST",
            trial_index: trialIndex,
            question_id: q.id,
            question_text: q.question,
            correct_answer: q.answer,
            response: response,
            correct: correct,
            difficulty: q.difficulty,
            rt: rt,
            condition: assignedCondition
        });

        // update running correctness window
        runningCorrectness.push(correct ? 1 : 0);
        if (runningCorrectness.length > ADAPTIVE_WINDOW) runningCorrectness.shift();

        // Decide feedback depending on condition
        if (assignedCondition === CONDITIONS.ADAPTIVE) {
            adaptiveFeedback(q, correct);
        } else {
            staticFeedback(q, correct);
        }
    }

    // Adaptive robot feedback
    function adaptiveFeedback(q, correct) {
        var proportionCorrect = runningCorrectness.reduce((a,b) => a+b, 0) / runningCorrectness.length;

        // default feedback for correct / incorrect
        if (correct) {
            showRobotText("Nice! That's correct. Keep going!");
            psiTurk.recordTrialData({phase: "FEEDBACK", feedback_type: "adaptive_positive", question_id: q.id, condition: assignedCondition});
            // small delay then next
            setTimeout(nextTrial, 900);
            return;
        } else {
            // if recent performance low, be encouraging and offer to review
            if (runningCorrectness.length === ADAPTIVE_WINDOW && proportionCorrect <= ADAPTIVE_THRESHOLD) {
                // Encouraging + offer review
                showRobotText("Don't worry — you'll get it next time. Would you like to review the topic?");
                showReviewLink(q.topic_link, /*offerReview=*/ true);
                psiTurk.recordTrialData({phase: "FEEDBACK", feedback_type: "adaptive_encourage_offer_review", question_id: q.id, condition: assignedCondition});
            } else {
                // Gentle corrective: show correct answer + offer to repeat question
                showRobotText("That's not quite right. Want to try another similar question or review the topic?");
                // show two buttons: Try another similar / Review the topic
                showRetryOrReviewButtons(q.topic_link);
                psiTurk.recordTrialData({phase: "FEEDBACK", feedback_type: "adaptive_suggest_retry", question_id: q.id, condition: assignedCondition});
            }
        }
    }

    // Static robot feedback
    function staticFeedback(q, correct) {
        if (correct) {
            showRobotText("Correct.");
            psiTurk.recordTrialData({phase: "FEEDBACK", feedback_type: "static_positive", question_id: q.id, condition: assignedCondition});
            setTimeout(nextTrial, 700);
            return;
        } else {
            // Static: tell them wrong and give link only (no encouragement)
            showRobotText("Wrong. Here's a link to review the topic.");
            showReviewLink(q.topic_link, /*offerReview=*/ false);
            psiTurk.recordTrialData({phase: "FEEDBACK", feedback_type: "static_negative_with_link", question_id: q.id, condition: assignedCondition});
        }
    }

    // UI helper: show robot text bubble
    function showRobotText(text) {
        d3.select("#robotFeedback").html('');
        d3.select("#robotFeedback")
            .append("div")
            .attr("class","robot-bubble")
            .style("border","1px solid #ddd")
            .style("padding","10px")
            .style("margin","10px")
            .style("border-radius","8px")
            .text(text);
    }

    // Show a single review link (and track clicks)
    function showReviewLink(url, offerReview) {
        var container = d3.select("#robotFeedback");
        container.append("div").style("marginTop","10px")
            .append("a")
            .attr("href", url)
            .attr("target", "_blank")
            .attr("id","review-link")
            .attr("class", "btn btn-info")
            .text("📚 Open Topic Review");

        // track clicks
        $("#review-link").on("click", function() {
            psiTurk.recordTrialData({phase: "INTERACTION", event: "clicked_review_link", question_id: questions[trialIndex].id, condition: assignedCondition});
        });

        // Next button to continue - centered and prominent
        container.append("div")
            .style("marginTop","20px")
            .style("text-align", "center")
            .append("button")
            .attr("id","continue-btn")
            .attr("class", "btn btn-success btn-lg")
            .text("Continue to Next Question →")
            .on("click", function() {
                psiTurk.recordTrialData({phase: "INTERACTION", event: "clicked_continue_after_review_offer", question_id: questions[trialIndex].id, condition: assignedCondition});
                nextTrial();
            });
    }

    // Show choice to retry a similar question or review
    function showRetryOrReviewButtons(reviewUrl) {
        var container = d3.select("#robotFeedback");
        var btnDiv = container.append("div")
            .style("marginTop","20px")
            .style("text-align", "center");
        
        btnDiv.append("button")
            .attr("id","retry-btn")
            .attr("class", "btn btn-success btn-lg")
            .text("Continue to Next Question →")
            .on("click", function() {
                psiTurk.recordTrialData({phase: "INTERACTION", event: "retry_clicked", question_id: questions[trialIndex].id, condition: assignedCondition});
                nextTrial();
            });
        
        btnDiv.append("button")
            .attr("id","review-btn")
            .attr("class", "btn btn-info btn-lg")
            .style("margin-left","15px")
            .text("📚 Review Topic")
            .on("click", function() {
                psiTurk.recordTrialData({phase: "INTERACTION", event: "review_clicked", question_id: questions[trialIndex].id, condition: assignedCondition});
                window.open(reviewUrl, '_blank');
            });
    }

    function nextTrial() {
        trialIndex++;
        if (trialIndex >= questions.length) {
            finish();
        } else {
            renderQuestion(questions[trialIndex]);
        }
    }

    function start() {
        trialIndex = 0;
        runningCorrectness = [];
        renderQuestion(questions[trialIndex]);

        // Also record condition assignment to server-side logs for balancing analysis
        psiTurk.recordTrialData({
            phase: "ASSIGNMENT",
            condition: assignedCondition
        });
    }

    function finish() {
        // save the last trial as ended
        clearInterval(timerInterval);
        psiTurk.recordTrialData({phase: "TEST", status: "finished", condition: assignedCondition});

        // Move to questionnaire view
        currentview = new Questionnaire();
    }

    // Kick off
    start();
};

/************************
 * Questionnaire (post-quiz survey)
 ************************/
var Questionnaire = function() {

    var error_message = "<h1>Oops!</h1><p>Something went wrong submitting your HIT. This might happen if you lose your internet connection. Press the button to resubmit.</p><button id='resubmit'>Resubmit</button>";

    record_responses = function() {
        // Validate all required fields are filled
        var allFilled = true;
        var requiredFields = ['engagement_q1', 'engagement_q2', 'usability_q1', 'usability_q2', 'adaptiveness_q1', 'adaptiveness_q2', 'satisfaction_overall'];
        
        requiredFields.forEach(function(id) {
            var el = document.getElementById(id);
            if (!el || !el.value || el.value === "") {
                allFilled = false;
                if (el) {
                    el.style.border = "2px solid red";
                }
            } else if (el) {
                el.style.border = "";
            }
        });
        
        if (!allFilled) {
            alert("Please answer all required questions before submitting.");
            return false;
        }
        
        psiTurk.recordTrialData({'phase':'postquestionnaire', 'status':'submit'});

        // record structured survey responses: assume inputs have specific ids
        var surveyData = {};
        // 4 scales (example: engagement, usability, perceived adaptiveness, cognitive load) + overall satisfaction
        requiredFields.forEach(function(id) {
            var el = document.getElementById(id);
            var val = el ? el.value : "";
            surveyData[id] = val;
            // also store individually as unstructured (for older psiTurk versions)
            psiTurk.recordUnstructuredData(id, val);
        });

        // record survey object
        psiTurk.recordTrialData({
            phase: 'postquestionnaire',
            survey: JSON.stringify(surveyData),
            condition: assignedCondition
        });

        // Also record any long textarea answers
        $('textarea').each( function(i, val) {
            psiTurk.recordUnstructuredData(this.id, this.value);
        });
        $('select').each( function(i, val) {
            psiTurk.recordUnstructuredData(this.id, this.value);        
        });
        
        return true;
    };

    prompt_resubmit = function() {
        document.body.innerHTML = error_message;
        $("#resubmit").click(resubmit);
    };

    resubmit = function() {
        document.body.innerHTML = "<h1>Trying to resubmit...</h1>";
        reprompt = setTimeout(prompt_resubmit, 10000);

        psiTurk.saveData({
            success: function() {
                clearInterval(reprompt); 
                psiTurk.computeBonus('compute_bonus', function(){
                    psiTurk.completeHIT();
                });
            }, 
            error: prompt_resubmit
        });
    };

    // Load questionnaire snippet 
    psiTurk.showPage('postquestionnaire.html');
    psiTurk.recordTrialData({'phase':'postquestionnaire', 'status':'begin', 'condition': assignedCondition});

    $("#next").click(function () {
        // Validate responses first
        if (!record_responses()) {
            return; // Don't proceed if validation fails
        }
        
        psiTurk.saveData({
            success: function(){
                psiTurk.computeBonus('compute_bonus', function() { 
                    psiTurk.completeHIT();
                }); 
            }, 
            error: prompt_resubmit});
    });

};

/*******************
 * Run Task on load
 *******************/
var currentview;

});
