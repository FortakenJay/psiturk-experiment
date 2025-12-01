# PsiTurk Robot Tutor Experiment

**Updated:** November 30, 2025  
**Status:** Production Ready ✅  
**Python Version:** 3.8.20

---

## ⚡ Quick Start

```bash
# 1. Activate virtual environment
source .venv/bin/activate

# 2. Start PsiTurk
psiturk

# 3. In PsiTurk shell, start server
server on

# 4. Open browser to URL shown (e.g., http://localhost:22362)
```

---

## 📋 Recent Updates (Nov 30, 2025)

All user feedback from testing session has been addressed:

✅ Demographics validation (age 18-80, all fields required)  
✅ Visible timer (countdown in top-right)  
✅ Clear instructions (robot, study purpose, task)  
✅ Easier math questions  
✅ Condensed review pages  
✅ Robot photos throughout  
✅ Fixed post-questionnaire (layout + validation)  
✅ Working submit button  
✅ Separate CSV export for trial/questionnaire data  
✅ Added .venv to .gitignore

**See `FIXES_SUMMARY.md` for complete details.**

---

## 🔧 Requirements

- **OS:** Linux
- **Python:** 3.8.20
- **Virtual Environment:** `.venv/` (already created)

---

## 📦 Installation

### First Time Setup

```bash
# 1. Install Python 3.8 (if not already installed)
sudo apt update
sudo apt install python3.8 python3.8-venv

# 2. Create virtual environment
python3.8 -m venv .venv

# 3. Activate virtual environment
source .venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt
```

### Subsequent Uses

```bash
# Just activate the environment
source .venv/bin/activate
```

---

## 🚀 Running the Experiment

```bash
# 1. Activate environment
source .venv/bin/activate

# 2. Start PsiTurk
psiturk

# 3. In PsiTurk shell
server on

# 4. Open experiment in browser
# URL will be shown (typically http://localhost:22362)
```

---

## 📊 Exporting Data

After participants complete the experiment:

1. Make sure PsiTurk server is running
2. Visit: `http://localhost:XXXX/export_data`
3. Download the text file
4. File contains TWO CSV sections:
   - **Trial Data** (participant responses, correctness, reaction times)
   - **Questionnaire Data** (demographics + survey responses)

---

## 📚 Documentation

- **`FIXES_SUMMARY.md`** - Executive summary of all improvements
- **`IMPROVEMENTS.md`** - Detailed changelog for each fix
- **`TESTING_GUIDE.md`** - How to test each feature
- **`BEFORE_AFTER.md`** - Visual before/after comparison
- **`GIT_COMMIT_GUIDE.md`** - How to commit changes to git

---

## 🧪 Testing

See `TESTING_GUIDE.md` for comprehensive testing checklist.

Quick test:
```bash
source .venv/bin/activate
psiturk
# In shell: server on
# Open browser to shown URL
```

---

## 📁 Project Structure

```
.
├── custom.py                    # Backend routes (includes /export_data)
├── static/
│   ├── js/
│   │   └── task.js             # Main experiment logic
│   └── images/
│       └── pnw.png             # Robot image
├── templates/
│   ├── demographics.html       # Demographics form (validated)
│   ├── postquestionnaire.html  # Post-experiment survey
│   ├── stage.html              # Main experiment stage
│   └── instructions/           # Instruction pages
│       ├── instruct-1.html     # Study overview + robot intro
│       ├── instruct-2.html     # Integration review (condensed)
│       ├── instruct-3.html     # Derivative review (condensed)
│       └── instruct-ready.html # Final instructions
├── requirements.txt            # Python dependencies
└── .venv/                      # Virtual environment (not in git)
```

---

## ✨ Features

- **Adaptive Robot Tutor** - Adjusts feedback based on performance
- **Static Control Condition** - For comparison
- **Timer** - Visible 5-minute countdown
- **Validation** - All forms validated before proceeding
- **Professional UI** - Bootstrap styling throughout
- **Clean Data Export** - Separate CSVs for easy analysis

---

## 🎯 For Class Demo (December 2nd)

Everything is ready! Demo flow:

1. Show demographics validation
2. Walk through improved instructions
3. Start quiz, point out timer
4. Show robot integration
5. Complete quiz, show post-questionnaire
6. Demonstrate data export

---

## 🐛 Troubleshooting

**Timer not showing?**
- Check browser console for errors
- Verify D3.js is loading

**Robot image not showing?**
- Verify `/static/images/pnw.png` exists
- Check browser network tab for 404s

**Submit button not working?**
- Check browser console for JavaScript errors
- Ensure all question IDs match in HTML and JS

**Data export empty?**
- Ensure at least one participant completed experiment
- Check PsiTurk database has data

---

## 📞 Support

For issues or questions:
1. Check documentation files (FIXES_SUMMARY.md, IMPROVEMENTS.md, etc.)
2. Check browser console for errors (F12)
3. Check PsiTurk server logs
4. Try restarting PsiTurk server

---

## 📄 License

[Your license here]

---

**Last Updated:** November 30, 2025  
**Version:** 2.0 (All feedback addressed)  
**Status:** ✅ Production Ready
