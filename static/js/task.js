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
    if (!raw || raw === null || raw === undefined) {
        // Use counterbalance for true 50/50 distribution
        // counterbalance is set by PsiTurk and alternates 0/1
        if (typeof mycounterbalance !== 'undefined' && mycounterbalance !== null) {
            return (mycounterbalance % 2 === 0) ? CONDITIONS.ADAPTIVE : CONDITIONS.STATIC;
        }
        // fallback: random (only if counterbalance not available)
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
console.log("Counterbalance value: " + mycounterbalance);

// Quiz questions array (easy and difficult). Customize/extend.
// Calculus 1-2 Questions: Derivatives and Integrals (Easy to Medium)
var questions = [
    // EASY DERIVATIVES
    {
        id: 'q1', 
        question: 'What is the derivative of x^3? (Format: 3x^2)', 
        answer: '3x^2', 
        difficulty: 'easy', 
        topic_link: 'https://tutorial.math.lamar.edu/Classes/CalcI/PowerRule.aspx'
    },
    {
        id: 'q2', 
        question: 'What is the derivative of 5x? (Just enter the number)', 
        answer: '5', 
        difficulty: 'easy', 
        topic_link: 'https://tutorial.math.lamar.edu/Classes/CalcI/DerivativeIntro.aspx'
    },
    {
        id: 'q3', 
        question: 'What is the derivative of cos(x)? (Format: -sin(x))', 
        answer: '-sin(x)', 
        difficulty: 'easy', 
        topic_link: 'https://tutorial.math.lamar.edu/Classes/CalcI/DiffTrigFcns.aspx'
    },
    {
        id: 'q4', 
        question: 'What is the derivative of e^x? (Format: e^x)', 
        answer: 'e^x', 
        difficulty: 'easy', 
        topic_link: 'https://tutorial.math.lamar.edu/Classes/CalcI/DiffExpLogFcns.aspx'
    },
    
    // EASY TO MEDIUM INTEGRALS
    {
        id: 'q5', 
        question: 'What is the integral of 3x^2 dx? (Format: x^3, omit +C)', 
        answer: 'x^3', 
        difficulty: 'easy', 
        topic_link: 'https://tutorial.math.lamar.edu/Classes/CalcI/IndefiniteIntegrals.aspx'
    },
    {
        id: 'q6', 
        question: 'What is the integral of sin(x) dx? (Format: -cos(x), omit +C)', 
        answer: '-cos(x)', 
        difficulty: 'easy', 
        topic_link: 'https://tutorial.math.lamar.edu/Classes/CalcI/IntegralsOfTrig.aspx'
    },
    {
        id: 'q7',
        question: 'What is the integral of 1/x dx? (Format: ln(x), omit +C)',
        answer: 'ln(x)',
        difficulty: 'medium',
        topic_link: 'https://tutorial.math.lamar.edu/Classes/CalcI/IntegralsWithExpFcns.aspx'
    },
    
    // MEDIUM DERIVATIVES
    {
        id: 'q8',
        question: 'What is the derivative of x^2*sin(x) using product rule? (Format: 2x*sin(x)+x^2*cos(x))',
        answer: '2x*sin(x)+x^2*cos(x)',
        difficulty: 'medium',
        topic_link: 'https://tutorial.math.lamar.edu/Classes/CalcI/ProductQuotientRule.aspx'
    },
    {
        id: 'q9',
        question: 'What is the derivative of ln(x^2)? (Format: 2/x)',
        answer: '2/x',
        difficulty: 'medium',
        topic_link: 'https://tutorial.math.lamar.edu/Classes/CalcI/DiffExpLogFcns.aspx'
    },
    {
        id: 'q10',
        question: 'What is the derivative of tan(x)? (Format: sec(x)^2)',
        answer: 'sec(x)^2',
        difficulty: 'medium',
        topic_link: 'https://tutorial.math.lamar.edu/Classes/CalcI/DiffTrigFcns.aspx'
    },
    
    // MEDIUM INTEGRALS
    {
        id: 'q11',
        question: 'What is the integral of e^x dx? (Format: e^x, omit +C)',
        answer: 'e^x',
        difficulty: 'medium',
        topic_link: 'https://tutorial.math.lamar.edu/Classes/CalcI/IntegralsWithExpFcns.aspx'
    },
    {
        id: 'q12',
        question: 'What is the integral of sec(x)^2 dx? (Format: tan(x), omit +C)',
        answer: 'tan(x)',
        difficulty: 'medium',
        topic_link: 'https://tutorial.math.lamar.edu/Classes/CalcI/IntegralsOfTrig.aspx'
    },
    {
        id: 'q13',
        question: 'What is the derivative of sqrt(x)? (Format: 1/(2*sqrt(x)))',
        answer: '1/(2*sqrt(x))',
        difficulty: 'medium',
        topic_link: 'https://tutorial.math.lamar.edu/Classes/CalcI/PowerRule.aspx'
    },
    {
        id: 'q14',
        question: 'What is the integral of x^3 dx? (Format: x^4/4, omit +C)',
        answer: 'x^4/4',
        difficulty: 'easy',
        topic_link: 'https://tutorial.math.lamar.edu/Classes/CalcI/IndefiniteIntegrals.aspx'
    },
    {
        id: 'q15',
        question: 'What is the derivative of 1/x? (Format: -1/x^2)',
        answer: '-1/x^2',
        difficulty: 'medium',
        topic_link: 'https://tutorial.math.lamar.edu/Classes/CalcI/PowerRule.aspx'
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
    var listening = false;
    var wordon = null;
    var runningCorrectness = []; // keep last ADAPTIVE_WINDOW correctness flags
    var trialStartTime = null;
    
    // --- TIMER LOGIC START ---
    var totalTime = 300; // 300 seconds (5 minutes)
    var timerInterval;
    
    // Prepare page first
    psiTurk.showPage('stage.html');
    
    // Remove ALL existing timers (both in body and container)
    $("#time-container").remove();
    $("body > #time-container").remove();
    
    // Display the timer INSIDE the container at the top
    $("#container-exp").prepend('<div id="time-container" style="text-align: center; font-size: 28px; font-weight: bold; color: #fff; background: #d9534f; padding: 20px; border: 3px solid #c9302c; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">⏱️ Time Left: 5:00</div>');

    timerInterval = setInterval(function() {
        totalTime--;
        
        var minutes = Math.floor(totalTime / 60);
        var seconds = totalTime % 60;
        // Pad seconds with leading zero
        seconds = seconds < 10 ? '0' + seconds : seconds;
        
        $("#time-container").html("⏱️ Time Left: " + minutes + ":" + seconds);
        
        // Change color when time is running out
        if (totalTime <= 60) {
            $("#time-container").css({
                'background': '#a94442',
                'animation': 'pulse 1s infinite'
            });
        }

        if (totalTime <= 0) {
            clearInterval(timerInterval);
            $("#time-container").remove(); // Remove timer when done
            alert("Time is up! Proceeding to the next section.");
            finish(); // Auto-advance
        }
    }, 1000);
    // --- TIMER LOGIC END ---

    // Build initial UI (assumes #stim, #robotFeedback, #controls exist in stage.html)
    function renderQuestion(q) {
        // Clear previous
        d3.select("#stim").html('');
        d3.select("#robotFeedback").html('');
        d3.select("#controls").html('');

        // Show robot image and question - enhanced styling
        var robotContainer = d3.select("#stim")
            .append("div")
            .attr("id", "robot-container")
            .style("text-align", "center")
            .style("margin", "20px auto")
            .style("padding", "20px")
            .style("background-color", "#f8f9fa")
            .style("border-radius", "15px")
            .style("max-width", "700px");
        
        robotContainer.append("img")
            .attr("src", "/static/images/pnw.png")
            .attr("alt", "Robot Tutor")
            .style("max-width", "250px")
            .style("border", "3px solid #007bff")
            .style("border-radius", "12px")
            .style("padding", "10px")
            .style("background-color", "white")
            .style("box-shadow", "0 4px 8px rgba(0,0,0,0.1)")
            .style("margin-bottom", "15px");

        robotContainer.append("div")
            .attr("id","question-text")
            .style("font-size","22px")
            .style("margin","20px")
            .style("font-weight", "600")
            .style("color", "#333")
            .html("🤖 <strong>Robot asks:</strong> " + q.question);

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
            showRobotText("Great job! That's correct. Keep it up!");
            psiTurk.recordTrialData({phase: "FEEDBACK", feedback_type: "adaptive_positive", question_id: q.id, condition: assignedCondition});
            // small delay then next
            setTimeout(nextTrial, 1200);
            return;
        } else {
            // Adaptive offers encouragement and optional review
            var feedbackText = "Not quite - the answer is <strong>" + q.answer + "</strong>. ";
            if (runningCorrectness.length === ADAPTIVE_WINDOW && proportionCorrect <= ADAPTIVE_THRESHOLD) {
                feedbackText += "Let's review this topic if you need help!";
                psiTurk.recordTrialData({phase: "FEEDBACK", feedback_type: "adaptive_encourage_offer_review", question_id: q.id, condition: assignedCondition});
            } else {
                feedbackText += "Want to review?";
                psiTurk.recordTrialData({phase: "FEEDBACK", feedback_type: "adaptive_review_offer", question_id: q.id, condition: assignedCondition});
            }
            showRobotText(feedbackText);
            showSimpleReviewOption(q.topic_link);
        }
    }

    // Static robot feedback
    function staticFeedback(q, correct) {
        if (correct) {
            showRobotText("Correct. Next question.");
            psiTurk.recordTrialData({phase: "FEEDBACK", feedback_type: "static_positive", question_id: q.id, condition: assignedCondition});
            setTimeout(nextTrial, 1000);
            return;
        } else {
            // Static: just say wrong and move on - no review, no encouragement
            showRobotText("Wrong. Next question.");
            psiTurk.recordTrialData({phase: "FEEDBACK", feedback_type: "static_negative", question_id: q.id, condition: assignedCondition});
            setTimeout(nextTrial, 1000);
        }
    }

    // UI helper: show robot text bubble
    function showRobotText(text) {
        d3.select("#robotFeedback").html('');
        d3.select("#robotFeedback")
            .append("div")
            .attr("class","robot-bubble")
            .style("border","2px solid #4CAF50")
            .style("padding","15px")
            .style("margin","20px auto")
            .style("max-width","600px")
            .style("border-radius","12px")
            .style("background-color","#f9f9f9")
            .style("font-size","18px")
            .html(text);
    }

    // Simplified review option with better button placement
    function showSimpleReviewOption(url) {
        var container = d3.select("#robotFeedback");
        
        // Button container - centered with both buttons side by side
        var btnContainer = container.append("div")
            .style("text-align", "center")
            .style("margin-top", "20px");
        
        // Continue button (primary action - larger and green)
        btnContainer.append("button")
            .attr("id","continue-btn")
            .attr("class", "btn btn-success btn-lg")
            .style("margin", "5px")
            .style("font-size", "18px")
            .style("padding", "12px 30px")
            .html("Continue →")
            .on("click", function() {
                psiTurk.recordTrialData({phase: "INTERACTION", event: "clicked_continue", question_id: questions[trialIndex].id, condition: assignedCondition});
                nextTrial();
            });
        
        // Review link button (secondary - smaller)
        btnContainer.append("a")
            .attr("href", url)
            .attr("target", "_blank")
            .attr("id","review-link")
            .attr("class", "btn btn-info")
            .style("margin", "5px")
            .style("font-size", "14px")
            .style("padding", "8px 20px")
            .text("📚 Review Topic")
            .on("click", function() {
                psiTurk.recordTrialData({phase: "INTERACTION", event: "clicked_review_link", question_id: questions[trialIndex].id, condition: assignedCondition});
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
        // Clear the timer interval and remove timer display
        clearInterval(timerInterval);
        $("#time-container").remove();
        
        // save the last trial as ended
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
        // Hide any previous error messages
        $("#error-message").hide();
        
        // Validate all required fields are filled
        var allFilled = true;
        var requiredFields = ['engagement_q1', 'engagement_q2', 'usability_q1', 'usability_q2', 'adaptiveness_q1', 'adaptiveness_q2', 'satisfaction_overall'];
        
        requiredFields.forEach(function(id) {
            var el = document.getElementById(id);
            if (!el || !el.value || el.value === "") {
                allFilled = false;
                if (el) {
                    el.style.border = "3px solid red";
                    el.style.backgroundColor = "#ffe6e6";
                }
            } else if (el) {
                el.style.border = "";
                el.style.backgroundColor = "";
            }
        });
        
        if (!allFilled) {
            $("#error-message").show();
            $('html, body').animate({ scrollTop: 0 }, 500);
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

        // Also record any long textarea answers (including optional comments)
        var comments = $('#general_comments').val();
        if (comments && comments.trim() !== "") {
            psiTurk.recordUnstructuredData('general_comments', comments);
        }
        
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
        console.log("Submit button clicked"); // Debug log
        
        // Validate responses first
        if (!record_responses()) {
            console.log("Validation failed");
            return; // Don't proceed if validation fails
        }
        
        console.log("Validation passed, saving data...");
        
        // Disable button and show loading state
        $("#next").prop('disabled', true).html('<span class="glyphicon glyphicon-refresh glyphicon-spin"></span> Submitting...');
        
        psiTurk.saveData({
            success: function(){
                console.log("Data saved successfully");
                psiTurk.computeBonus('compute_bonus', function() { 
                    console.log("Bonus computed, completing HIT");
                    psiTurk.completeHIT();
                }); 
            }, 
            error: function() {
                console.log("Error saving data");
                $("#next").prop('disabled', false).html('<span class="glyphicon glyphicon-ok"></span> Submit Survey and Complete Study');
                prompt_resubmit();
            }
        });
    });

};

/*******************
 * Run Task on load
 *******************/
var currentview;

});
