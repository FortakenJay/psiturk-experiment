# 🚀 QUICK START GUIDE
## For Students Submitting PsiTurk Experiment

**Total Time:** ~5 minutes to verify everything is ready

---

## Step 1: Verify All Files (1 min)

Open terminal and run:
```bash
cd /home/saken/Desktop/psiturk-experiment

# Check main files exist
ls -1 | grep -E "\.csv$|\.py$|\.md$"
```

**Expected output:**
```
analysis_script.py ✓
custom.py ✓
eventdata.csv ✓
questiondata.csv ✓
trialdata.csv ✓
PRESENTATION_SLIDES.md ✓
SUBMISSION_CHECKLIST.md ✓
SUBMISSION_README.md ✓
```

---

## Step 2: Verify Analysis Output (1 min)

```bash
ls -1 analysis_output/
```

**Expected output:**
```
1_performance_by_condition.png ✓
2_engagement_by_condition.png ✓
3_survey_comparison.png ✓
4_age_distribution.png ✓
5_gender_distribution.png ✓
6_correlation_matrix.png ✓
ANALYSIS_SUMMARY_REPORT.txt ✓
cleaned_full_data.csv ✓
```

---

## Step 3: Re-run Analysis (Optional, 30 sec)

If you want fresh analysis with latest data:

```bash
python3.8 analysis_script.py
```

**Should see:**
- Loading data messages
- Demographics calculated
- Hypothesis tests run
- 6 graphs saved
- "ANALYSIS COMPLETE!" message

---

## Step 4: View Your Results (2 min)

### Check Statistical Summary
```bash
cat analysis_output/ANALYSIS_SUMMARY_REPORT.txt
```

### View Graphs
```bash
# Open file manager to view graphs
xdg-open analysis_output/
```

Or open each graph individually:
```bash
xdg-open analysis_output/1_performance_by_condition.png
xdg-open analysis_output/2_engagement_by_condition.png
# etc.
```

---

## Step 5: Review Presentation (1 min)

### Open in VS Code
The file `PRESENTATION_SLIDES.md` is already open - just click to review!

### Or open in browser for better formatting
```bash
# If you have a markdown viewer
google-chrome PRESENTATION_SLIDES.md
# OR
firefox PRESENTATION_SLIDES.md
```

---

## 📋 What to Submit

Package these files/folders:

### Required Files:
```
✅ static/js/task.js
✅ static/css/style.css
✅ templates/consent.html
✅ templates/postquestionnaire.html
✅ custom.py
✅ trialdata.csv
✅ questiondata.csv
✅ analysis_script.py
✅ analysis_output/ (entire folder with graphs)
✅ PRESENTATION_SLIDES.md
```

### Optional (but recommended):
```
📄 SUBMISSION_README.md (comprehensive documentation)
📄 SUBMISSION_CHECKLIST.md (quick reference)
```

---

## 💡 Quick Stats Reference

**For your presentation, here are the key numbers:**

### Demographics
- **N = 12** participants (questionnaires)
- **N = 4** participants (performance data)
- **Age:** M = 45.08, SD = 30.84
- **Gender:** 8 Male, 4 Female

### Conditions
- **Adaptive:** n = 2
- **Static:** n = 2

### Results (All p > 0.05)
- **H1 (Performance):** t(2) = 0.113, p = 0.921 ✗
- **H2 (Engagement):** t = 0.447, p = 0.699 ✗
- **H3 (Trust):** t = -3.000, p = 0.096 ✗
- **H4 (Satisfaction):** t = -1.000, p = 0.423 ✗

### Key Finding
No significant differences between adaptive and static conditions due to **small sample size**.

---

## 🎤 Presentation Tips

### Opening (30 sec)
"My study investigated whether adaptive robot tutors are more effective than static ones in educational tasks. Due to small sample size, I found no significant differences, but I'll explain the methodological improvements I made."

### Highlight the Pivot (1 min)
"I made three major improvements from my initial proposal:
1. Removed robot intro before consent to reduce bias
2. Changed from abstract Godspeed scales to task-specific questions
3. Improved UX with button-based ratings instead of text input"

### Be Honest About Limitations (30 sec)
"The main limitation was sample size - only 4 participants completed the quiz. I need at least 30 per condition for adequate statistical power."

### Strong Conclusion (30 sec)
"While hypotheses weren't supported, this pilot study established a solid methodology and identified key improvements for future research: larger sample, longer intervention, and multi-session design."

---

## 🔧 Troubleshooting

### If analysis script fails:
```bash
# Check Python version
python3.8 --version

# Reinstall packages
source .venv/bin/activate
pip install pandas numpy matplotlib seaborn scipy
```

### If graphs don't appear:
```bash
# Check if output folder exists
ls -la analysis_output/

# If missing, script will create it automatically when run
python3.8 analysis_script.py
```

### If data looks wrong:
```bash
# Check latest data
head -5 trialdata.csv
head -5 questiondata.csv

# Verify participant count
cut -d',' -f1 questiondata.csv | sort | uniq | wc -l
```

---

## ✅ Final Checklist Before Submission

- [ ] Ran `python3.8 analysis_script.py` successfully
- [ ] All 6 graphs generated in `analysis_output/`
- [ ] Reviewed `PRESENTATION_SLIDES.md`
- [ ] Checked demographics: Age M=45.08, SD=30.84
- [ ] Verified all hypothesis results (none supported)
- [ ] Read through pivot explanation
- [ ] Practiced 3-minute presentation
- [ ] Packaged all required files

---

## 📧 If You Need Help

**Check these files in order:**
1. **SUBMISSION_CHECKLIST.md** ← Quick reference
2. **SUBMISSION_README.md** ← Full documentation
3. **analysis_output/ANALYSIS_SUMMARY_REPORT.txt** ← Statistical results

**Common questions answered:**
- "Where are my graphs?" → `analysis_output/` folder
- "How do I run analysis?" → `python3.8 analysis_script.py`
- "What were my results?" → Check ANALYSIS_SUMMARY_REPORT.txt
- "What should I present?" → Follow PRESENTATION_SLIDES.md

---

## 🎉 You're Ready!

Everything is prepared and organized. Your submission package includes:
- ✅ Experiment code (JavaScript, HTML, CSS, Python)
- ✅ Data files (trial and questionnaire data)
- ✅ Analysis code (Python with full pipeline)
- ✅ Visualizations (6 publication-quality graphs)
- ✅ Presentation (12-slide deck with all requirements)
- ✅ Documentation (comprehensive README and checklist)

**Good luck with your presentation!** 🚀

---

**Last updated:** December 7, 2025
