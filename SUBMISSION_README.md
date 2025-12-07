# PsiTurk Experiment Submission Package
## Robot Tutor Adaptiveness Study

**Student Name:** [Your Name]  
**Date:** December 7, 2025  
**Course:** [Course Number/Name]

---

## 📁 Submission Contents

### 1. Experiment Files

#### HTML Templates (templates/)
- `ad.html` - MTurk advertisement page
- `consent.html` - IRB consent form
- `demographics.html` - Demographic questionnaire
- `exp.html` - Main experiment page
- `postquestionnaire.html` - Post-task survey (7 task-specific questions)
- `debriefing.html` - Study debriefing
- `thanks.html` - Completion page

#### JavaScript Files (static/js/)
- `task.js` - **Main experiment logic** with:
  - Quiz question loading
  - Adaptive vs. static feedback logic
  - Trial data recording
  - Condition assignment

- `psiturk.js` - PsiTurk framework integration
- `utils.js` - Helper functions

#### CSS Files (static/css/)
- `style.css` - **Custom experiment styling**
- `bootstrap.min.css` - Bootstrap framework

#### Backend
- `custom.py` - **Python Flask routes** with condition assignment logic

---

### 2. Data Files

#### Raw Data
- `trialdata.csv` - **223 trial records** containing:
  - Participant IDs
  - Trial timestamps
  - Quiz responses (correct/incorrect)
  - Reaction times
  - Feedback types
  - Condition assignment

- `questiondata.csv` - **79 questionnaire records** containing:
  - Demographics (age, gender, experience)
  - Engagement ratings (2 items)
  - Usability ratings (2 items)
  - Adaptiveness/trust ratings (2 items)
  - Overall satisfaction (1 item)

#### Processed Data
- `analysis_output/cleaned_full_data.csv` - **Merged and cleaned dataset** ready for further analysis

---

### 3. Analysis Code

#### Python Script
**File:** `analysis_script.py`

**Dependencies:**
```python
pandas==2.0.3
numpy==1.24.4
matplotlib==3.7.5
seaborn==0.13.2
scipy==1.10.1
```

**To Run:**
```bash
# Activate virtual environment
source .venv/bin/activate

# Or use python3.8 directly
python3.8 analysis_script.py
```

**What It Does:**
1. **Data Loading & Cleaning**
   - Parses JSON trial data
   - Transforms questionnaire data from long to wide format
   - Handles missing values
   - Creates composite scores

2. **Demographic Analysis**
   - Calculates age M and SD
   - Generates gender frequency counts
   - Reports prior experience statistics

3. **Hypothesis Testing**
   - Independent t-tests for all 4 hypotheses
   - Effect size calculations
   - Statistical significance at α = 0.05

4. **Visualization Generation**
   - 6 publication-ready graphs (PNG, 300 DPI)
   - Bar charts, violin plots, correlation heatmaps
   - Demographic distributions

5. **Report Generation**
   - Comprehensive text summary
   - Statistical tables
   - Interpretation notes

---

### 4. Generated Visualizations

All graphs saved in `analysis_output/` directory:

1. **1_performance_by_condition.png**
   - Bar chart comparing quiz accuracy
   - Error bars show standard deviation
   - Adaptive vs. Static conditions

2. **2_engagement_by_condition.png**
   - Violin plot of engagement scores
   - Shows distribution shape
   - 1-10 scale ratings

3. **3_survey_comparison.png**
   - Grouped bar chart for all survey measures
   - Engagement, Usability, Trust, Satisfaction
   - Side-by-side comparison

4. **4_age_distribution.png**
   - Histogram of participant ages
   - Mean line indicator
   - Frequency counts

5. **5_gender_distribution.png**
   - Pie chart with percentages
   - Gender distribution visualization

6. **6_correlation_matrix.png**
   - Heatmap showing relationships
   - Performance, engagement, trust, satisfaction
   - Color-coded correlation coefficients

---

### 5. Statistical Results

**File:** `analysis_output/ANALYSIS_SUMMARY_REPORT.txt`

**Contents:**
- Research question
- Demographic statistics (M, SD, frequencies)
- All hypothesis test results
- t-statistics and p-values
- Effect sizes
- Interpretation notes

**Key Findings:**
- **Sample Size:** 4 participants with performance data, 12 with survey data
- **Conditions:** 2 adaptive, 2 static
- **Age:** M = 45.08, SD = 30.84
- **Gender:** 8 Male, 4 Female
- **All hypotheses:** Not statistically supported (p > 0.05)
- **Primary limitation:** Small sample size (underpowered)

---

### 6. Presentation Slides

**File:** `PRESENTATION_SLIDES.md`

**Slide Contents:**
1. Updated RQ & Hypotheses
2. Pivot from Initial Proposal
3. Demographics (Mean, SD, frequencies)
4. Data Collection & Scales Used
5. Performance Results with Graph
6. Engagement Results with Graph
7. All Survey Measures Comparison
8. Demographics Visualized
9. Correlation Matrix
10. Hypothesis Testing Summary Table
11. Conclusions & Future Directions
12. Questions & Appendix

**How to Present:**
- Open in Markdown viewer or convert to PowerPoint
- All graphs are embedded as image references
- Detailed speaker notes in appendix

---

## 📊 Research Summary

### Research Question
**How does the adaptiveness of a robot tutor's feedback affect learner engagement, trust, and performance during an educational task?**

### Hypotheses
- **H1:** Adaptive feedback → Higher performance (✗ Not supported)
- **H2:** Adaptive feedback → Higher engagement (✗ Not supported)
- **H3:** Adaptive feedback → Higher trust (✗ Not supported)
- **H4:** Adaptive feedback → Higher satisfaction (✗ Not supported)

### Major Pivot from Proposal
1. **Removed pre-consent robot introduction** to reduce expectation bias
2. **Replaced Godspeed scales** with 7 task-specific questions
3. **Changed to button-based ratings** (1-10 scale) for better UX
4. **Focus shifted** from general HRI to educational effectiveness

### Demographics
- **Age:** M = 45.08 (SD = 30.84), Range = 18-80
- **Gender:** 8 Male, 4 Female
- **PsiTurk Experience:** 100% had prior experience
- **Robot Experience:** 91.7% had prior experience

### Results
**No significant differences found** between adaptive and static conditions on any measure (all p > 0.05).

**Primary Limitation:** Sample size too small (n=4 with performance data)
- Insufficient statistical power
- High variability obscures true effects
- Need minimum n=30 per condition

**Unexpected Finding:** Static condition showed numerically higher trust (M=3.75) and satisfaction (M=3.00) than adaptive condition

---

## 🔧 Technical Implementation

### Experiment Flow
```
MTurk Ad → Consent → Demographics → Quiz Task → Post-Questionnaire → Debriefing → Thanks
```

### Condition Assignment
- Balanced assignment using participant count
- Even-numbered participants → Adaptive
- Odd-numbered participants → Static

### Adaptive Feedback Types
1. **Correct + High Confidence:** "Excellent work! You're mastering this material."
2. **Correct + Low Confidence:** "Great job! Your understanding is improving."
3. **Incorrect + First Attempt:** "Not quite. Would you like to try again?"
4. **Incorrect + Multiple Attempts:** "Let's review the concept together."

### Static Feedback
- Uniform message regardless of performance
- "Thank you for your response. Next question."

### Data Recording
- **trialdata.csv:** Every trial event with timestamp
- **questiondata.csv:** All survey responses in long format
- **eventdata.csv:** Page views and interaction logs

---

## 📈 How to Reproduce Analysis

### Step 1: Install Dependencies
```bash
cd /home/saken/Desktop/psiturk-experiment
source .venv/bin/activate
pip install pandas numpy matplotlib seaborn scipy
```

### Step 2: Run Analysis Script
```bash
python3.8 analysis_script.py
```

### Step 3: Check Outputs
```bash
ls analysis_output/
# Should see:
# - 6 PNG graph files
# - ANALYSIS_SUMMARY_REPORT.txt
# - cleaned_full_data.csv
```

### Step 4: Review Presentation
```bash
# Open PRESENTATION_SLIDES.md in any Markdown viewer
# Or convert to PowerPoint using pandoc:
pandoc PRESENTATION_SLIDES.md -o PRESENTATION.pptx
```

---

## 🎯 Grading Checklist

- [x] **Updated PsiTurk files**
  - [x] Task.js with adaptive/static logic
  - [x] CSS styling (style.css)
  - [x] HTML templates (consent, demographics, questionnaire)

- [x] **Latest data files**
  - [x] trialdata.csv (223 records)
  - [x] questiondata.csv (79 records)

- [x] **Analysis code**
  - [x] Python script (analysis_script.py)
  - [x] Properly commented and documented
  - [x] Generates all required outputs

- [x] **Generated graphs**
  - [x] Performance by condition
  - [x] Engagement by condition
  - [x] Survey measures comparison
  - [x] Age distribution
  - [x] Gender distribution
  - [x] Correlation matrix

- [x] **Slide deck** (PRESENTATION_SLIDES.md)
  - [x] Updated RQ and Hypotheses
  - [x] Pivot explanation
  - [x] Demographics with M, SD, frequencies
  - [x] Data collection methods
  - [x] Scales used
  - [x] Graphs embedded
  - [x] Hypothesis testing results
  - [x] Conclusions

- [x] **Statistical reporting**
  - [x] Demographic M and SD for age
  - [x] Gender frequencies
  - [x] t-test results for all hypotheses
  - [x] p-values and effect sizes
  - [x] Interpretation

---

## 📚 References & Resources

### Framework
- **PsiTurk:** https://psiturk.org/
- **PsiTurk Documentation:** https://psiturk.readthedocs.io/

### Statistical Analysis
- **SciPy Stats:** Independent t-tests
- **Pandas:** Data manipulation
- **Seaborn/Matplotlib:** Visualization

### Study Design
- **Between-subjects design**
- **Random assignment to conditions**
- **Quantitative self-report measures**

---

## 💡 Lessons Learned

### What Worked Well
1. **Button-based interface** improved user experience
2. **Task-specific questions** more interpretable than abstract scales
3. **Removing pre-consent bias** strengthened methodology
4. **Automated data pipeline** made analysis reproducible

### What Could Be Improved
1. **Larger sample size** (need 60+ participants)
2. **Longer task duration** to see adaptive benefits
3. **Multi-session design** for learning trajectories
4. **Validated scales** with known reliability
5. **Manipulation check** to verify adaptiveness perception

### Future Recommendations
- Pilot test with 5-10 participants before full launch
- Calculate required sample size a priori (power analysis)
- Include attention checks to ensure data quality
- Consider mixed-methods (qualitative + quantitative)
- Track dropout rates and completion times

---

## 📞 Contact Information

For questions about this submission:
- **GitHub Repository:** fortakenJay/psiturk-experiment
- **Email:** [Your Email]
- **Office Hours:** [Time/Location]

---

**End of Submission Package**
