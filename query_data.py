#!/usr/bin/env python
"""
Data Query Tool for PsiTurk Experiment
Usage: python query_data.py [command]

Commands:
  list          - List all participants
  export-csv    - Export to separate CSV files (trial + questionnaire)
  export-json   - Export all data to JSON
  participant <id> - Show detailed data for specific participant
  stats         - Show summary statistics
"""

import sqlite3
import json
import csv
import sys
from datetime import datetime

DB_PATH = 'participants.db'

def get_connection():
    """Get database connection"""
    return sqlite3.connect(DB_PATH)

def list_participants():
    """List all participants"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT uniqueid, beginhit, status, mode, codeversion, endhit 
        FROM assignments 
        ORDER BY beginhit DESC
    """)
    
    participants = cursor.fetchall()
    
    if not participants:
        print("No participants found in database.")
        return
    
    print(f"\n{'='*80}")
    print(f"{'Participant ID':<25} {'Started':<20} {'Status':<15} {'Mode':<10}")
    print(f"{'='*80}")
    
    for p in participants:
        participant_id = p[0] or 'N/A'
        start_time = p[1] or 'N/A'
        status = p[2] or 'N/A'
        mode = p[3] or 'N/A'
        print(f"{participant_id:<25} {start_time:<20} {status:<15} {mode:<10}")
    
    print(f"{'='*80}")
    print(f"Total participants: {len(participants)}\n")
    conn.close()

def get_participant_data(participant_id):
    """Get detailed data for a specific participant"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT uniqueid, assignmentid, workerid, hitid, ipaddress, browser, 
               platform, language, cond, counterbalance, codeversion, beginhit, 
               beginexp, endhit, bonus, status, datastring, mode
        FROM assignments 
        WHERE uniqueid = ?
    """, (participant_id,))
    
    result = cursor.fetchone()
    conn.close()
    
    if not result:
        print(f"Participant {participant_id} not found.")
        return None
    
    columns = ['uniqueid', 'assignmentid', 'workerid', 'hitid', 'ipaddress', 'browser',
               'platform', 'language', 'cond', 'counterbalance', 'codeversion', 'beginhit',
               'beginexp', 'endhit', 'bonus', 'status', 'datastring', 'mode']
    
    participant = dict(zip(columns, result))
    
    # Parse datastring JSON which contains questiondata and eventdata
    if participant['datastring']:
        datastring = json.loads(participant['datastring'])
        participant['datastring'] = datastring
        # Extract questiondata and eventdata from datastring
        participant['questiondata'] = datastring.get('questiondata', {})
        participant['eventdata'] = datastring.get('eventdata', {})
    else:
        participant['questiondata'] = {}
        participant['eventdata'] = {}
    
    return participant

def show_participant(participant_id):
    """Display detailed participant information"""
    data = get_participant_data(participant_id)
    
    if not data:
        return
    
    print(f"\n{'='*80}")
    print(f"PARTICIPANT: {participant_id}")
    print(f"{'='*80}\n")
    
    print("BASIC INFO:")
    print(f"  Status: {data['status']}")
    print(f"  Mode: {data['mode']}")
    print(f"  Condition: {data['cond']}")
    print(f"  Browser: {data['browser']}")
    print(f"  Started: {data['beginhit']}")
    print(f"  Ended: {data['endhit']}")
    print(f"  Bonus: ${data['bonus']}")
    
    print("\nDEMOGRAPHICS:")
    if data['questiondata']:
        for key, value in data['questiondata'].items():
            print(f"  {key}: {value}")
    else:
        print("  No demographics data")
    
    print("\nTRIAL DATA:")
    if data['datastring'] and 'data' in data['datastring']:
        trials = [t for t in data['datastring']['data'] 
                 if t.get('trialdata', {}).get('phase') == 'TEST']
        print(f"  Total trials: {len(trials)}")
        
        if trials:
            correct = sum(1 for t in trials if t.get('trialdata', {}).get('correct'))
            print(f"  Correct answers: {correct}/{len(trials)}")
            print(f"  Accuracy: {correct/len(trials)*100:.1f}%")
    else:
        print("  No trial data")
    
    print("\nQUESTIONNAIRE DATA:")
    if data['datastring'] and 'data' in data['datastring']:
        quest = [t for t in data['datastring']['data'] 
                if t.get('trialdata', {}).get('phase') == 'postquestionnaire']
        if quest:
            for q in quest:
                survey = q.get('trialdata', {}).get('survey')
                if survey:
                    survey_data = json.loads(survey)
                    for key, value in survey_data.items():
                        print(f"  {key}: {value}")
        else:
            print("  No questionnaire data")
    else:
        print("  No questionnaire data")
    
    print(f"\n{'='*80}\n")

def export_to_csv():
    """Export data to separate CSV files"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM assignments")
    participants = cursor.fetchall()
    conn.close()
    
    if not participants:
        print("No participants found.")
        return
    
    # Create trial data CSV
    trial_filename = f"trial_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    quest_filename = f"questionnaire_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    with open(trial_filename, 'w', newline='') as trial_file:
        trial_writer = csv.writer(trial_file)
        trial_writer.writerow(['participant_id', 'condition', 'trial_index', 'question_id',
                              'question_text', 'correct_answer', 'response', 'correct',
                              'difficulty', 'rt', 'timestamp'])
        
        with open(quest_filename, 'w', newline='') as quest_file:
            quest_writer = csv.writer(quest_file)
            quest_writer.writerow(['participant_id', 'condition', 'age', 'gender',
                                  'psiturk_exp', 'robot_exp', 'engagement_q1', 'engagement_q2',
                                  'usability_q1', 'usability_q2', 'adaptiveness_q1',
                                  'adaptiveness_q2', 'satisfaction_overall', 'general_comments'])
            
            for p in participants:
                participant_id = p[0]
                datastring_raw = p[17]  # datastring column (now at index 17, not 16)
                
                if not datastring_raw:
                    continue
                
                try:
                    data = json.loads(datastring_raw)
                    condition = None
                    demographics = data.get('questiondata', {})
                    questionnaire = {}
                    
                    # Extract trial data
                    for record in data.get('data', []):
                        trial = record.get('trialdata', {})
                        phase = trial.get('phase', '')
                        
                        if phase == 'ASSIGNMENT':
                            condition = trial.get('condition', 'unknown')
                        
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
                        
                        elif phase == 'postquestionnaire':
                            survey_str = trial.get('survey', '{}')
                            try:
                                questionnaire = json.loads(survey_str)
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
                    print(f"Error processing participant {participant_id}: {e}")
                    continue
    
    print(f"\n✅ Data exported successfully!")
    print(f"   Trial data: {trial_filename}")
    print(f"   Questionnaire data: {quest_filename}\n")

def export_to_json():
    """Export all data to JSON"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM assignments")
    participants = cursor.fetchall()
    conn.close()
    
    all_data = []
    
    for p in participants:
        participant_id = p[0]
        data = get_participant_data(participant_id)
        if data:
            all_data.append(data)
    
    filename = f"all_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    
    with open(filename, 'w') as f:
        json.dump(all_data, f, indent=2)
    
    print(f"\n✅ Data exported to: {filename}\n")

def show_stats():
    """Show summary statistics"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM assignments")
    total = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM assignments WHERE status = 'complete'")
    completed = cursor.fetchone()[0]
    
    cursor.execute("SELECT * FROM assignments")
    participants = cursor.fetchall()
    
    total_trials = 0
    total_correct = 0
    conditions = {'adaptive': 0, 'static': 0, 'unknown': 0}
    
    for p in participants:
        datastring = p[16]
        if datastring:
            try:
                data = json.loads(datastring)
                condition = None
                
                for record in data.get('data', []):
                    trial = record.get('trialdata', {})
                    
                    if trial.get('phase') == 'ASSIGNMENT':
                        condition = trial.get('condition', 'unknown')
                        conditions[condition] = conditions.get(condition, 0) + 1
                    
                    elif trial.get('phase') == 'TEST' and 'question_id' in trial:
                        total_trials += 1
                        if trial.get('correct'):
                            total_correct += 1
            except:
                pass
    
    conn.close()
    
    print(f"\n{'='*80}")
    print("EXPERIMENT STATISTICS")
    print(f"{'='*80}\n")
    
    print(f"Total Participants: {total}")
    print(f"Completed: {completed}")
    print(f"In Progress: {total - completed}")
    
    print(f"\nCondition Distribution:")
    for cond, count in conditions.items():
        if count > 0:
            print(f"  {cond.capitalize()}: {count}")
    
    print(f"\nTrial Performance:")
    print(f"  Total trials: {total_trials}")
    print(f"  Correct answers: {total_correct}")
    if total_trials > 0:
        print(f"  Overall accuracy: {total_correct/total_trials*100:.1f}%")
    
    print(f"\n{'='*80}\n")

def main():
    """Main function"""
    if len(sys.argv) < 2:
        print(__doc__)
        return
    
    command = sys.argv[1].lower()
    
    if command == 'list':
        list_participants()
    
    elif command == 'export-csv':
        export_to_csv()
    
    elif command == 'export-json':
        export_to_json()
    
    elif command == 'participant':
        if len(sys.argv) < 3:
            print("Please provide participant ID")
            print("Usage: python query_data.py participant <id>")
            return
        show_participant(sys.argv[2])
    
    elif command == 'stats':
        show_stats()
    
    else:
        print(f"Unknown command: {command}")
        print(__doc__)

if __name__ == '__main__':
    main()
