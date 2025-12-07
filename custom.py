# this file imports custom routes into the experiment server
from __future__ import generator_stop
from flask import Blueprint, render_template, request, jsonify, Response, abort, current_app
from jinja2 import TemplateNotFound
from functools import wraps
from sqlalchemy import or_

from psiturk.psiturk_config import PsiturkConfig
from psiturk.experiment_errors import ExperimentError, InvalidUsageError
from psiturk.user_utils import PsiTurkAuthorization, nocache

# # Database setup
from psiturk.db import db_session, init_db
from psiturk.models import Participant
from json import dumps, loads

# load the configuration options
config = PsiturkConfig()
config.load_config()
# if you want to add a password protect route, uncomment and use this
#myauth = PsiTurkAuthorization(config)

# explore the Blueprint
custom_code = Blueprint('custom_code', __name__,
                        template_folder='templates', static_folder='static')


###########################################################
#  serving warm, fresh, & sweet custom, user-provided routes
#  add them here
###########################################################

# ----------------------------------------------
# example custom route
# ----------------------------------------------
@custom_code.route('/my_custom_view')
def my_custom_view():
    # Print message to server.log for debugging
    current_app.logger.info("Reached /my_custom_view")
    try:
        return render_template('custom.html')
    except TemplateNotFound:
        abort(404)

# ----------------------------------------------
# preview route - shows task overview before consent
# ----------------------------------------------
@custom_code.route('/preview')
def preview():
    """Show preview of experiment before consent form"""
    current_app.logger.info("Reached /preview")
    hitId = request.args.get('hitId', '')
    assignmentId = request.args.get('assignmentId', '')
    workerId = request.args.get('workerId', '')
    try:
        return render_template('preview.html', hitid=hitId, assignmentid=assignmentId, workerid=workerId)
    except TemplateNotFound:
        abort(404)

# ----------------------------------------------
# intro route - shows experiment intro with screenshot and robot explanation
# ----------------------------------------------
@custom_code.route('/intro')
def intro():
    """Show intro page with screenshot and condition-specific robot explanation before consent"""
    current_app.logger.info("Reached /intro")
    hitId = request.args.get('hitId', '')
    assignmentId = request.args.get('assignmentId', '')
    workerId = request.args.get('workerId', '')
    mode = request.args.get('mode', 'debug')  # Get mode parameter, default to 'debug'
    
    # Assign participant to condition
    # This happens before consent, so we check if they already exist
    current_app.logger.info("Accessing /intro route")
    
    # Check if assignment is not available (preview mode)
    if not assignmentId or assignmentId == "ASSIGNMENT_ID_NOT_AVAILABLE":
        # In preview mode, randomly assign for demonstration
        import random
        condition = random.randint(0, 1)
    else:
        # Check if participant already exists
        uniqueId = f"{workerId}:{assignmentId}"
        participant = Participant.query.filter(Participant.uniqueid == uniqueId).first()
        
        if participant:
            # Use existing condition
            condition = participant.cond
        else:
            # Assign new condition (simple alternating assignment)
            # Count existing participants to alternate
            count = Participant.query.count()
            condition = count % 2
    
    # Determine which robot image to show
    robot_image = 'adaptive.jpeg' if condition == 0 else 'static.jpeg'
    
    try:
        return render_template('intro.html', 
                             hitid=hitId, 
                             assignmentid=assignmentId, 
                             workerid=workerId,
                             mode=mode,
                             condition=condition,
                             robot_image=robot_image)
    except TemplateNotFound:
        abort(404)

# ----------------------------------------------
# instructions route - shows robot and study instructions after consent
# ----------------------------------------------
@custom_code.route('/instructions')
def instructions():
    """Show instructions page with robot after consent"""
    current_app.logger.info("Reached /instructions")
    hitId = request.args.get('hitId', '')
    assignmentId = request.args.get('assignmentId', '')
    workerId = request.args.get('workerId', '')
    mode = request.args.get('mode', 'debug')
    
    # Assign participant to condition
    if not assignmentId or assignmentId == "ASSIGNMENT_ID_NOT_AVAILABLE":
        import random
        condition = random.randint(0, 1)
    else:
        uniqueId = f"{workerId}:{assignmentId}"
        participant = Participant.query.filter(Participant.uniqueid == uniqueId).first()
        
        if participant:
            condition = participant.cond
        else:
            count = Participant.query.count()
            condition = count % 2
    
    robot_image = 'adaptive.jpeg' if condition == 0 else 'static.jpeg'
    
    try:
        return render_template('instructions.html', 
                             hitid=hitId, 
                             assignmentid=assignmentId, 
                             workerid=workerId,
                             mode=mode,
                             condition=condition,
                             robot_image=robot_image)
    except TemplateNotFound:
        abort(404)

# ----------------------------------------------
# example using HTTP authentication
# ----------------------------------------------
#@custom_code.route('/my_password_protected_route')
#@myauth.requires_auth
#def my_password_protected_route():
#    try:
#        return render_template('custom.html')
#    except TemplateNotFound:
#        abort(404)

# ----------------------------------------------
# example accessing data
# ----------------------------------------------
#@custom_code.route('/view_data')
#@myauth.requires_auth
#def list_my_data():
#    users = Participant.query.all()
#    try:
#        return render_template('list.html', participants=users)
#    except TemplateNotFound:
#        abort(404)

# ----------------------------------------------
# example computing bonus
# ----------------------------------------------


@custom_code.route('/compute_bonus', methods=['GET'])
def compute_bonus():
    # check that user provided the correct keys
    # errors will not be that gracefull here if being
    # accessed by the Javascrip client
    if not 'uniqueId' in request.args:
        # i don't like returning HTML to JSON requests...  maybe should change this
        raise ExperimentError('improper_inputs')
    uniqueId = request.args['uniqueId']

    try:
        # lookup user in database
        user = Participant.query.\
            filter(Participant.uniqueid == uniqueId).\
            one()
        user_data = loads(user.datastring)  # load datastring from JSON
        bonus = 0

        for record in user_data['data']:  # for line in data file
            trial = record['trialdata']
            if trial['phase'] == 'TEST':
                if 'correct' in trial and trial['correct'] == True:
                    bonus += 0.02
        user.bonus = bonus
        db_session.add(user)
        db_session.commit()
        resp = {"bonusComputed": "success"}
        return jsonify(**resp)
    except:
        abort(404)  # again, bad to display HTML, but...


# ----------------------------------------------
# export data to CSV (separate trial data from questionnaire)
# ----------------------------------------------
import csv
from io import StringIO

@custom_code.route('/export_data')
def export_data():
    """Export trial data and questionnaire data as separate CSV files"""
    participants = Participant.query.all()
    
    # Create trial data CSV
    trial_output = StringIO()
    trial_writer = csv.writer(trial_output)
    trial_writer.writerow(['participant_id', 'condition', 'trial_index', 'question_id', 
                          'question_text', 'correct_answer', 'response', 'correct', 
                          'difficulty', 'rt', 'timestamp'])
    
    # Create questionnaire data CSV
    quest_output = StringIO()
    quest_writer = csv.writer(quest_output)
    quest_writer.writerow(['participant_id', 'condition', 'age', 'gender', 'psiturk_exp', 
                          'robot_exp', 'engagement_q1', 'engagement_q2', 'usability_q1', 
                          'usability_q2', 'adaptiveness_q1', 'adaptiveness_q2', 
                          'satisfaction_overall', 'general_comments'])
    
    for participant in participants:
        try:
            user_data = loads(participant.datastring)
            participant_id = participant.uniqueid
            condition = None
            demographics = {}
            questionnaire = {}
            
            # Parse data
            for record in user_data.get('data', []):
                trial = record.get('trialdata', {})
                phase = trial.get('phase', '')
                
                # Get condition assignment
                if phase == 'ASSIGNMENT':
                    condition = trial.get('condition', 'unknown')
                
                # Get trial data
                elif phase == 'TEST' and 'question_id' in trial:
                    trial_writer.writerow([
                        participant_id,
                        condition or 'unknown',
                        trial.get('trial_index', ''),
                        trial.get('question_id', ''),
                        trial.get('question_text', ''),
                        trial.get('correct_answer', ''),
                        trial.get('response', ''),
                        trial.get('correct', ''),
                        trial.get('difficulty', ''),
                        trial.get('rt', ''),
                        record.get('dateTime', '')
                    ])
            
            # Get demographics from questiondata
            for item in user_data.get('questiondata', {}).items():
                key, value = item
                demographics[key] = value
            
            # Get questionnaire from eventdata (if stored there) or questiondata
            for record in user_data.get('data', []):
                trial = record.get('trialdata', {})
                if trial.get('phase') == 'postquestionnaire':
                    survey_str = trial.get('survey', '{}')
                    try:
                        questionnaire = loads(survey_str)
                    except:
                        pass
            
            # Write questionnaire row
            quest_writer.writerow([
                participant_id,
                condition or 'unknown',
                demographics.get('age', ''),
                demographics.get('gender', ''),
                demographics.get('psiturk_exp', ''),
                demographics.get('robot_exp', ''),
                questionnaire.get('engagement_q1', ''),
                questionnaire.get('engagement_q2', ''),
                questionnaire.get('usability_q1', ''),
                questionnaire.get('usability_q2', ''),
                questionnaire.get('adaptiveness_q1', ''),
                questionnaire.get('adaptiveness_q2', ''),
                questionnaire.get('satisfaction_overall', ''),
                demographics.get('general_comments', '')
            ])
            
        except Exception as e:
            current_app.logger.error(f"Error processing participant {participant.uniqueid}: {str(e)}")
            continue
    
    # Return both CSVs as a downloadable response
    response_text = "=== TRIAL DATA ===\n\n" + trial_output.getvalue()
    response_text += "\n\n=== QUESTIONNAIRE DATA ===\n\n" + quest_output.getvalue()
    
    return Response(
        response_text,
        mimetype="text/plain",
        headers={"Content-disposition": "attachment; filename=experiment_data.txt"})

