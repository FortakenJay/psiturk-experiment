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
    "instructions/instruct-ready.html",
    "stage.html",
    "postquestionnaire.html"
];

var instructionPages = [
    "instructions/instruct-1.html",
    "instructions/instruct-ready.html"
];

const init = (async () => {
    await psiTurk.preloadPages(pages);

    var runDemographics = function() {
        psiTurk.showPage('demographics.html');

        // Function to validate and update button state
        function validateAndUpdateButton() {
            var age = $('#age').val();
            var gender = $('#gender').val();
            var psiturk_exp = $('#psiturk_exp').val();
            var robot_exp = $('#robot_exp').val();
            
            var ageValid = age && !isNaN(age) && age >= 18 && age <= 80;
            var allFieldsFilled = ageValid && gender && psiturk_exp && robot_exp;
            
            if (allFieldsFilled) {
                $('#submit-demographics').prop('disabled', false).css('opacity', '1');
            } else {
                $('#submit-demographics').prop('disabled', true).css('opacity', '0.5');
            }
        }
        
        // Initial check - button starts disabled
        $('#submit-demographics').prop('disabled', true).css('opacity', '0.5');
        
        // Update on any input change
        $('#age, #gender, #psiturk_exp, #robot_exp').on('input change', validateAndUpdateButton);

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
            
            // After instructions load, customize based on condition
            setTimeout(function() {
                // Update robot image based on condition
                var robotImageSrc = (assignedCondition === CONDITIONS.ADAPTIVE) 
                    ? '/static/images/adaptive.jpeg' 
                    : '/static/images/static.jpeg';
                $("#robot-image-instructions").attr('src', robotImageSrc);
                
                if (assignedCondition === CONDITIONS.ADAPTIVE) {
                    $(".condition-specific-adaptive").show();
                    $(".condition-specific-static").hide();
                } else {
                    $(".condition-specific-adaptive").hide();
                    $(".condition-specific-static").show();
                }
            }, 300);
        });
    };

    // Start with demographics (intro is shown before consent now)
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
    // Check URL parameters for testing (e.g., ?forceCondition=adaptive)
    var urlParams = new URLSearchParams(window.location.search);
    var forceCondition = urlParams.get('forceCondition');
    if (forceCondition) {
        console.log("FORCING CONDITION FROM URL: " + forceCondition);
        if (forceCondition.toLowerCase() === 'adaptive' || forceCondition === '0') {
            return CONDITIONS.ADAPTIVE;
        } else if (forceCondition.toLowerCase() === 'static' || forceCondition === '1') {
            return CONDITIONS.STATIC;
        }
    }
    
    if (raw === null || raw === undefined) {
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
console.log("Mode: " + (typeof mode !== 'undefined' ? mode : 'unknown'));
console.log("To force a condition, add ?forceCondition=adaptive or ?forceCondition=static to the URL");

// Show condition in page title for easy debugging
if (typeof mode !== 'undefined' && mode === 'debug') {
    document.title = "EXPERIMENT - CONDITION: " + assignedCondition.toUpperCase();
}

// Quiz questions array - Basic Algebra (Easy to Medium)
var questions = [
    // SOLVING LINEAR EQUATIONS - EASY
    {
        id: 'q1', 
        question: 'Solve for x: x + 5 = 12', 
        answer: '7', 
        difficulty: 'easy', 
        topic_link: 'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:solve-equations-one-variable'
    },
    {
        id: 'q2', 
        question: 'Solve for x: 2x = 10', 
        answer: '5', 
        difficulty: 'easy', 
        topic_link: 'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:solve-equations-one-variable'
    },
    {
        id: 'q3', 
        question: 'Solve for x: x - 3 = 8', 
        answer: '11', 
        difficulty: 'easy', 
        topic_link: 'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:solve-equations-one-variable'
    },
    {
        id: 'q4', 
        question: 'Solve for x: 3x + 2 = 11', 
        answer: '3', 
        difficulty: 'easy', 
        topic_link: 'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:solve-equations-one-variable'
    },
    
    // SIMPLIFYING EXPRESSIONS - EASY TO MEDIUM
    {
        id: 'q5', 
        question: 'Simplify: 2x + 3x (Format: nx)', 
        answer: '5x', 
        difficulty: 'easy', 
        topic_link: 'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:foundation-algebra/x2f8bb11595b61c86:combine-like-terms'
    },
    {
        id: 'q6', 
        question: 'Simplify: 4(x + 2) (Format: nx+n)', 
        answer: '4x+8', 
        difficulty: 'easy', 
        topic_link: 'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:foundation-algebra/x2f8bb11595b61c86:distributive-property'
    },
    {
        id: 'q7',
        question: 'Solve for x: 2x - 4 = 10',
        answer: '7',
        difficulty: 'medium',
        topic_link: 'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:solve-equations-one-variable'
    },
    
    // EXPONENTS - MEDIUM
    {
        id: 'q8',
        question: 'Simplify: x^2 * x^3 (Format: x^n)',
        answer: 'x^5',
        difficulty: 'medium',
        topic_link: 'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:exponent-properties'
    },
    {
        id: 'q9',
        question: 'Expand: (x + 3)^2 (Format: x^2+nx+n)',
        answer: 'x^2+6x+9',
        difficulty: 'medium',
        topic_link: 'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:quadratics-multiplying-factoring'
    },
    {
        id: 'q10',
        question: 'Solve for x: x^2 = 16 (Enter positive answer only)',
        answer: '4',
        difficulty: 'medium',
        topic_link: 'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:quadratics-solving-factoring'
    },
    
    // FRACTIONS AND MORE
    {
        id: 'q11',
        question: 'Solve for x: x/2 = 6',
        answer: '12',
        difficulty: 'easy',
        topic_link: 'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:solve-equations-one-variable'
    },
    {
        id: 'q12',
        question: 'Simplify: (x^4)/(x^2) (Format: x^n)',
        answer: 'x^2',
        difficulty: 'medium',
        topic_link: 'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:exponent-properties'
    },
    {
        id: 'q13',
        question: 'Solve for x: 5x - 3 = 2x + 9',
        answer: '4',
        difficulty: 'medium',
        topic_link: 'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:solve-equations-one-variable'
    },
    {
        id: 'q14',
        question: 'Factor: x^2 + 5x + 6 (Format: (x+n)(x+n))',
        answer: '(x+2)(x+3)',
        acceptableAnswers: ['(x+2)(x+3)', '(x+3)(x+2)'], // Both orders are correct
        difficulty: 'medium',
        topic_link: 'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:quadratics-multiplying-factoring/x2f8bb11595b61c86:factor-quadratics-intro'
    },
    {
        id: 'q15',
        question: 'Solve for x: 2(x + 4) = 18',
        answer: '5',
        difficulty: 'medium',
        topic_link: 'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:solve-equations-one-variable'
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
    var correctCount = 0; // Track total correct answers
    var totalQuestions = questions.length;
    
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
            
            // Record timeout event
            psiTurk.recordTrialData({
                phase: "TIMEOUT", 
                event: "time_expired", 
                questions_completed: trialIndex,
                total_questions: questions.length,
                total_correct: correctCount,
                condition: assignedCondition
            });
            
            // Calculate score for timeout scenario
            var percentage = trialIndex > 0 ? Math.round((correctCount / trialIndex) * 100) : 0;
            
            // Show timeout message with score
            $('body').html(`
                <div style="max-width: 700px; margin: 80px auto; padding: 40px; background: #fff3cd; border: 3px solid #ffc107; border-radius: 15px; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
                    <h2 style="color: #856404; margin-bottom: 20px;">⏱️ Time's Up!</h2>
                    
                    <div style="background: white; padding: 25px; border-radius: 10px; margin: 25px 0; border: 2px solid #ffc107;">
                        <div style="font-size: 56px; font-weight: bold; color: #856404; margin-bottom: 10px;">${percentage}%</div>
                        <p style="font-size: 18px; margin: 10px 0; color: #666;">
                            You completed <strong>${trialIndex}</strong> out of <strong>${questions.length}</strong> questions
                        </p>
                        <p style="font-size: 18px; margin: 10px 0; color: #666;">
                            <strong>${correctCount}</strong> correct, <strong>${trialIndex - correctCount}</strong> incorrect
                        </p>
                    </div>
                    
                    <p style="font-size: 16px; color: #666; margin: 20px 0;">
                        The 5-minute time limit has expired. Great effort! Please continue to complete the survey.
                    </p>
                    
                    <button id="continue-after-timeout" class="btn btn-warning btn-lg" style="margin-top: 20px; font-size: 18px; padding: 12px 30px;">
                        Continue to Survey →
                    </button>
                </div>
            `);
            
            $("#continue-after-timeout").on("click", function() {
                finish(); // Proceed to questionnaire (will show score again)
            });
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
        
        // Use condition-specific robot image
        var robotImageSrc = (assignedCondition === CONDITIONS.ADAPTIVE) 
            ? '/static/images/adaptive.jpeg' 
            : '/static/images/static.jpeg';
        
        robotContainer.append("img")
            .attr("src", robotImageSrc)
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
        
        // Normalize both for comparison (case-insensitive, remove extra spaces)
        var normalizedResponse = response.toLowerCase().replace(/\s+/g, '');
        var normalizedAnswer = q.answer.toLowerCase().replace(/\s+/g, '');
        
        // Check if answer is correct - support multiple acceptable formats
        var correct = false;
        if (q.acceptableAnswers && Array.isArray(q.acceptableAnswers)) {
            // Check against all acceptable answers
            correct = q.acceptableAnswers.some(function(acceptableAnswer) {
                return normalizedResponse === acceptableAnswer.toLowerCase().replace(/\s+/g, '');
            });
        } else {
            // Standard comparison
            correct = (normalizedResponse === normalizedAnswer);
        }
        
        console.log("Question:", q.question);
        console.log("User response:", response);
        console.log("Correct answer:", q.answer);
        console.log("Is correct:", correct);

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

        // Track score
        if (correct) {
            correctCount++;
        }

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

    // Adaptive robot feedback - POLITE, APOLOGETIC, HELPFUL
    function adaptiveFeedback(q, correct) {
        var proportionCorrect = runningCorrectness.reduce((a,b) => a+b, 0) / runningCorrectness.length;

        // Positive feedback - encouraging and warm
        if (correct) {
            var positiveMessages = [
                "Excellent work! That's absolutely correct! 🎉 You're doing great!",
                "Perfect! You got it right! Keep up the wonderful work! ✨",
                "That's right! Fantastic job! You're really getting the hang of this! 👏",
                "Correct! I'm so proud of your progress! You're doing amazing! 🌟"
            ];
            var message = positiveMessages[Math.floor(Math.random() * positiveMessages.length)];
            showRobotText(message);
            psiTurk.recordTrialData({phase: "FEEDBACK", feedback_type: "adaptive_positive", question_id: q.id, condition: assignedCondition});
            setTimeout(nextTrial, 1500);
            return;
        } else {
            // Incorrect - APOLOGETIC, SUPPORTIVE, shows correct answer, offers help
            var feedbackText = "I'm sorry, that's not quite right. Don't worry though! ";
            feedbackText += "The correct answer is <strong>" + q.answer + "</strong>. ";
            
            if (runningCorrectness.length === ADAPTIVE_WINDOW && proportionCorrect <= ADAPTIVE_THRESHOLD) {
                feedbackText += "I notice you might benefit from some extra support on this topic. Would you like to review it together? I'm here to help you succeed! 💪";
                psiTurk.recordTrialData({phase: "FEEDBACK", feedback_type: "adaptive_encourage_offer_review", question_id: q.id, condition: assignedCondition});
            } else {
                feedbackText += "These can be tricky! Would you like to take a look at the reference guide? I believe in you! 😊";
                psiTurk.recordTrialData({phase: "FEEDBACK", feedback_type: "adaptive_review_offer", question_id: q.id, condition: assignedCondition});
            }
            showRobotText(feedbackText);
            showSimpleReviewOption(q.topic_link);
        }
    }

    // Static robot feedback - TERSE, DIRECT, MINIMAL
    function staticFeedback(q, correct) {
        if (correct) {
            showRobotText("Correct.");
            psiTurk.recordTrialData({phase: "FEEDBACK", feedback_type: "static_positive", question_id: q.id, condition: assignedCondition});
            setTimeout(nextTrial, 800);
            return;
        } else {
            // Static: terse, no apology, just facts
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
        
        // Calculate score
        var questionsAttempted = trialIndex; // Number of questions completed
        var percentage = Math.round((correctCount / questionsAttempted) * 100);
        
        // save the last trial as ended
        psiTurk.recordTrialData({
            phase: "TEST", 
            status: "finished", 
            condition: assignedCondition,
            total_correct: correctCount,
            total_attempted: questionsAttempted,
            percentage: percentage
        });

        // Show score summary screen
        $('body').html(`
            <div style="max-width: 700px; margin: 50px auto; padding: 40px; background: white; border-radius: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); text-align: center;">
                <h2 style="color: #333; margin-bottom: 30px;">📊 Quiz Complete!</h2>
                
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; margin: 30px 0;">
                    <div style="font-size: 72px; font-weight: bold; margin-bottom: 10px;">${percentage}%</div>
                    <div style="font-size: 24px;">Your Score</div>
                </div>
                
                <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin: 20px 0;">
                    <p style="font-size: 20px; margin: 10px 0;"><strong>Correct Answers:</strong> ${correctCount} out of ${questionsAttempted}</p>
                    <p style="font-size: 20px; margin: 10px 0;"><strong>Incorrect Answers:</strong> ${questionsAttempted - correctCount}</p>
                </div>
                
                <p style="font-size: 18px; color: #666; margin: 30px 0;">
                    Great job completing the quiz! Now please answer a few questions about your experience.
                </p>
                
                <button id="continue-to-survey" class="btn btn-success btn-lg" style="font-size: 20px; padding: 15px 40px; margin-top: 20px;">
                    Continue to Survey →
                </button>
            </div>
        `);
        
        $("#continue-to-survey").on("click", function() {
            // Move to questionnaire view
            currentview = new Questionnaire();
        });
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
