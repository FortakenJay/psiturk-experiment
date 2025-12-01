# Data Export Guide

## Exporting Your Experiment Data

After collecting data from participants, you can export it to CSV files for analysis.

### Quick Start

1. **Activate your virtual environment** (if not already activated):
   ```bash
   source .venv/bin/activate
   ```

2. **Export data to CSV files**:
   ```bash
   python query_data.py export-csv
   ```

This will create **THREE separate CSV files** with timestamps:

### Output Files

1. **`trial_data_YYYYMMDD_HHMMSS.csv`** - Quiz Performance Data
   - Contains one row per question answered
   - Columns: participant_id, condition, trial_index, question_id, question_text, correct_answer, response, correct, difficulty, rt, feedback_type, timestamp
   - Use this for analyzing performance, accuracy, response times

2. **`questionnaire_data_YYYYMMDD_HHMMSS.csv`** - Post-Survey Responses
   - Contains one row per participant
   - Columns: participant_id, condition, engagement_q1, engagement_q2, usability_q1, usability_q2, adaptiveness_q1, adaptiveness_q2, satisfaction_overall, general_comments
   - Use this for analyzing user satisfaction and experience ratings

3. **`demographics_data_YYYYMMDD_HHMMSS.csv`** - Participant Information
   - Contains one row per participant
   - Columns: participant_id, condition, age, gender, psiturk_exp, robot_exp, browser, platform, started, completed, bonus
   - Use this for participant demographics and session metadata

### Other Useful Commands

**List all participants:**
```bash
python query_data.py list
```

**View detailed data for a specific participant:**
```bash
python query_data.py participant <participant_id>
```

**Show summary statistics:**
```bash
python query_data.py stats
```

**Export all data to JSON:**
```bash
python query_data.py export-json
```

### Data Analysis Tips

- **Trial Data**: Perfect for Excel, SPSS, R, or Python pandas
- **Condition Comparison**: Compare 'adaptive' vs 'static' condition performance
- **Accuracy Analysis**: Use the 'correct' column (True/False)
- **Response Times**: 'rt' column shows milliseconds to answer
- **Engagement**: Questionnaire ratings are on 1-5 scale

### Example: Opening in Excel

1. Open Excel
2. Go to File → Open
3. Select the CSV file
4. Use "Text Import Wizard" if needed
5. Delimit by commas

### Troubleshooting

**No data exported?**
- Make sure participants completed the experiment
- Check that `participants.db` exists in the experiment folder

**Missing questionnaire data?**
- Participants must complete the post-survey for that data to appear
- Check trial data even if questionnaire is incomplete

**Need help?**
Run `python query_data.py` with no arguments to see all available commands.
