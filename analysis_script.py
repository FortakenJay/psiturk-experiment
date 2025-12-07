"""
PsiTurk Experiment Data Analysis
Robot Tutor Adaptiveness Study
Author: Research Team
Date: December 2025

This script performs:
1. Data cleaning and preprocessing
2. Demographic analysis
3. Hypothesis testing (t-tests, correlation analysis)
4. Data visualization
5. Statistical reporting
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats
import json
import warnings
warnings.filterwarnings('ignore')

# Set style for visualizations
sns.set_style("whitegrid")
plt.rcParams['figure.figsize'] = (10, 6)
plt.rcParams['font.size'] = 12

class PsiTurkAnalysis:
    def __init__(self, trialdata_file, questiondata_file):
        """Initialize with data file paths"""
        self.trialdata_file = trialdata_file
        self.questiondata_file = questiondata_file
        self.trial_df = None
        self.question_df = None
        self.demographics = None
        self.performance_data = None
        self.survey_data = None
        
    def load_data(self):
        """Load and parse trial and question data"""
        print("="*60)
        print("LOADING DATA")
        print("="*60)
        
        # Load trial data
        self.trial_df = pd.read_csv(self.trialdata_file, header=None,
                                    names=['participant_id', 'trial_index', 'timestamp', 'data'])
        print(f"Loaded {len(self.trial_df)} trial records")
        
        # Load question data
        self.question_df = pd.read_csv(self.questiondata_file, header=None,
                                       names=['participant_id', 'question', 'response'])
        print(f"Loaded {len(self.question_df)} question records")
        print()
        
    def clean_trial_data(self):
        """Parse JSON data and extract relevant information"""
        print("="*60)
        print("CLEANING TRIAL DATA")
        print("="*60)
        
        # Parse JSON data column
        parsed_data = []
        for idx, row in self.trial_df.iterrows():
            try:
                data_dict = json.loads(row['data'].replace("'", '"'))
                data_dict['participant_id'] = row['participant_id']
                data_dict['trial_index'] = row['trial_index']
                data_dict['timestamp'] = row['timestamp']
                parsed_data.append(data_dict)
            except:
                continue
        
        trial_parsed = pd.DataFrame(parsed_data)
        
        # Extract test phase data (actual quiz responses)
        test_data = trial_parsed[trial_parsed['phase'] == 'TEST'].copy()
        
        # Calculate performance metrics
        self.performance_data = test_data.groupby('participant_id').agg({
            'correct': ['sum', 'count', 'mean'],
            'rt': 'mean',
            'condition': 'first'
        }).reset_index()
        
        self.performance_data.columns = ['participant_id', 'correct_count', 
                                         'total_questions', 'accuracy', 
                                         'mean_rt', 'condition']
        
        print(f"Processed {len(self.performance_data)} participants")
        print(f"Conditions: {self.performance_data['condition'].value_counts().to_dict()}")
        print()
        
    def clean_question_data(self):
        """Process questionnaire responses"""
        print("="*60)
        print("CLEANING QUESTIONNAIRE DATA")
        print("="*60)
        
        # Pivot question data
        question_pivot = self.question_df.pivot(index='participant_id', 
                                                columns='question', 
                                                values='response').reset_index()
        
        # Separate demographics and survey responses
        demographic_cols = ['age', 'gender', 'psiturk_exp', 'robot_exp']
        survey_cols = ['engagement_q1', 'engagement_q2', 'usability_q1', 'usability_q2',
                      'adaptiveness_q1', 'adaptiveness_q2', 'satisfaction_overall']
        
        self.demographics = question_pivot[['participant_id'] + demographic_cols].copy()
        self.survey_data = question_pivot[['participant_id'] + survey_cols].copy()
        
        # Convert numeric columns
        self.demographics['age'] = pd.to_numeric(self.demographics['age'], errors='coerce')
        for col in survey_cols:
            if col in self.survey_data.columns:
                self.survey_data[col] = pd.to_numeric(self.survey_data[col], errors='coerce')
        
        print(f"Demographics processed for {len(self.demographics)} participants")
        print(f"Survey data processed for {len(self.survey_data)} participants")
        print()
        
    def merge_all_data(self):
        """Merge performance, demographics, and survey data"""
        # Merge all datasets
        self.full_data = self.performance_data.merge(
            self.demographics, on='participant_id', how='left'
        ).merge(
            self.survey_data, on='participant_id', how='left'
        )
        
        # Ensure accuracy is numeric
        self.full_data['accuracy'] = pd.to_numeric(self.full_data['accuracy'], errors='coerce')
        self.full_data['mean_rt'] = pd.to_numeric(self.full_data['mean_rt'], errors='coerce')
        
        # Create composite scores
        if 'engagement_q1' in self.full_data.columns and 'engagement_q2' in self.full_data.columns:
            self.full_data['engagement_score'] = self.full_data[['engagement_q1', 'engagement_q2']].mean(axis=1)
        
        if 'usability_q1' in self.full_data.columns and 'usability_q2' in self.full_data.columns:
            self.full_data['usability_score'] = self.full_data[['usability_q1', 'usability_q2']].mean(axis=1)
        
        if 'adaptiveness_q1' in self.full_data.columns and 'adaptiveness_q2' in self.full_data.columns:
            self.full_data['adaptiveness_score'] = self.full_data[['adaptiveness_q1', 'adaptiveness_q2']].mean(axis=1)
        
        return self.full_data
        
    def analyze_demographics(self):
        """Calculate demographic statistics"""
        print("="*60)
        print("DEMOGRAPHIC ANALYSIS")
        print("="*60)
        
        # Age statistics
        age_mean = self.demographics['age'].mean()
        age_std = self.demographics['age'].std()
        age_min = self.demographics['age'].min()
        age_max = self.demographics['age'].max()
        
        print(f"Age Statistics:")
        print(f"  Mean (SD): {age_mean:.2f} ({age_std:.2f})")
        print(f"  Range: {age_min:.0f} - {age_max:.0f}")
        print()
        
        # Gender distribution
        print("Gender Distribution:")
        gender_counts = self.demographics['gender'].value_counts()
        for gender, count in gender_counts.items():
            print(f"  {gender}: {count}")
        print()
        
        # PsiTurk experience
        print("PsiTurk Experience:")
        psiturk_counts = self.demographics['psiturk_exp'].value_counts()
        for response, count in psiturk_counts.items():
            print(f"  {response}: {count}")
        print()
        
        # Robot experience
        print("Robot Experience:")
        robot_counts = self.demographics['robot_exp'].value_counts()
        for response, count in robot_counts.items():
            print(f"  {response}: {count}")
        print()
        
        return {
            'age_mean': age_mean,
            'age_std': age_std,
            'age_range': (age_min, age_max),
            'gender_counts': gender_counts.to_dict(),
            'psiturk_exp': psiturk_counts.to_dict(),
            'robot_exp': robot_counts.to_dict()
        }
    
    def test_hypotheses(self):
        """Perform statistical tests for hypotheses"""
        print("="*60)
        print("HYPOTHESIS TESTING")
        print("="*60)
        
        # Separate data by condition
        adaptive = self.full_data[self.full_data['condition'] == 'adaptive']
        static = self.full_data[self.full_data['condition'] == 'static']
        
        results = {}
        
        # H1: Performance (Quiz Scores)
        print("\nH1: Performance Hypothesis")
        print("-" * 40)
        if len(adaptive) > 0 and len(static) > 0:
            adaptive_acc = adaptive['accuracy'].dropna().astype(float)
            static_acc = static['accuracy'].dropna().astype(float)
            t_stat, p_value = stats.ttest_ind(adaptive_acc, static_acc)
            adaptive_mean = adaptive['accuracy'].mean()
            static_mean = static['accuracy'].mean()
            adaptive_std = adaptive['accuracy'].std()
            static_std = static['accuracy'].std()
            
            print(f"Adaptive: M = {adaptive_mean:.3f}, SD = {adaptive_std:.3f}, N = {len(adaptive)}")
            print(f"Static: M = {static_mean:.3f}, SD = {static_std:.3f}, N = {len(static)}")
            print(f"t({len(adaptive) + len(static) - 2}) = {t_stat:.3f}, p = {p_value:.4f}")
            print(f"Result: {'SUPPORTED' if p_value < 0.05 and adaptive_mean > static_mean else 'NOT SUPPORTED'}")
            
            results['H1_performance'] = {
                't_stat': t_stat,
                'p_value': p_value,
                'adaptive_mean': adaptive_mean,
                'static_mean': static_mean,
                'supported': p_value < 0.05 and adaptive_mean > static_mean
            }
        
        # H2: Engagement
        print("\nH2: Engagement Hypothesis")
        print("-" * 40)
        if 'engagement_score' in self.full_data.columns:
            t_stat, p_value = stats.ttest_ind(adaptive['engagement_score'].dropna(), 
                                             static['engagement_score'].dropna())
            adaptive_mean = adaptive['engagement_score'].mean()
            static_mean = static['engagement_score'].mean()
            adaptive_std = adaptive['engagement_score'].std()
            static_std = static['engagement_score'].std()
            
            print(f"Adaptive: M = {adaptive_mean:.3f}, SD = {adaptive_std:.3f}")
            print(f"Static: M = {static_mean:.3f}, SD = {static_std:.3f}")
            print(f"t = {t_stat:.3f}, p = {p_value:.4f}")
            print(f"Result: {'SUPPORTED' if p_value < 0.05 and adaptive_mean > static_mean else 'NOT SUPPORTED'}")
            
            results['H2_engagement'] = {
                't_stat': t_stat,
                'p_value': p_value,
                'adaptive_mean': adaptive_mean,
                'static_mean': static_mean,
                'supported': p_value < 0.05 and adaptive_mean > static_mean
            }
        
        # H3: Trust (measured through adaptiveness score)
        print("\nH3: Trust/Helpfulness Hypothesis")
        print("-" * 40)
        if 'adaptiveness_score' in self.full_data.columns:
            t_stat, p_value = stats.ttest_ind(adaptive['adaptiveness_score'].dropna(), 
                                             static['adaptiveness_score'].dropna())
            adaptive_mean = adaptive['adaptiveness_score'].mean()
            static_mean = static['adaptiveness_score'].mean()
            adaptive_std = adaptive['adaptiveness_score'].std()
            static_std = static['adaptiveness_score'].std()
            
            print(f"Adaptive: M = {adaptive_mean:.3f}, SD = {adaptive_std:.3f}")
            print(f"Static: M = {static_mean:.3f}, SD = {static_std:.3f}")
            print(f"t = {t_stat:.3f}, p = {p_value:.4f}")
            print(f"Result: {'SUPPORTED' if p_value < 0.05 and adaptive_mean > static_mean else 'NOT SUPPORTED'}")
            
            results['H3_trust'] = {
                't_stat': t_stat,
                'p_value': p_value,
                'adaptive_mean': adaptive_mean,
                'static_mean': static_mean,
                'supported': p_value < 0.05 and adaptive_mean > static_mean
            }
        
        # H4: Satisfaction
        print("\nH4: Satisfaction Hypothesis")
        print("-" * 40)
        if 'satisfaction_overall' in self.full_data.columns:
            t_stat, p_value = stats.ttest_ind(adaptive['satisfaction_overall'].dropna(), 
                                             static['satisfaction_overall'].dropna())
            adaptive_mean = adaptive['satisfaction_overall'].mean()
            static_mean = static['satisfaction_overall'].mean()
            adaptive_std = adaptive['satisfaction_overall'].std()
            static_std = static['satisfaction_overall'].std()
            
            print(f"Adaptive: M = {adaptive_mean:.3f}, SD = {adaptive_std:.3f}")
            print(f"Static: M = {static_mean:.3f}, SD = {static_std:.3f}")
            print(f"t = {t_stat:.3f}, p = {p_value:.4f}")
            print(f"Result: {'SUPPORTED' if p_value < 0.05 and adaptive_mean > static_mean else 'NOT SUPPORTED'}")
            
            results['H4_satisfaction'] = {
                't_stat': t_stat,
                'p_value': p_value,
                'adaptive_mean': adaptive_mean,
                'static_mean': static_mean,
                'supported': p_value < 0.05 and adaptive_mean > static_mean
            }
        
        print("\n")
        return results
    
    def create_visualizations(self):
        """Generate all visualization graphs"""
        print("="*60)
        print("GENERATING VISUALIZATIONS")
        print("="*60)
        
        # Create output directory
        import os
        os.makedirs('analysis_output', exist_ok=True)
        
        # 1. Performance by Condition (Bar Chart)
        plt.figure(figsize=(10, 6))
        performance_by_condition = self.full_data.groupby('condition')['accuracy'].agg(['mean', 'std']).reset_index()
        
        plt.bar(performance_by_condition['condition'], performance_by_condition['mean'], 
                yerr=performance_by_condition['std'], capsize=10, alpha=0.7,
                color=['#2E86AB', '#A23B72'])
        plt.ylabel('Mean Accuracy', fontsize=14)
        plt.xlabel('Robot Condition', fontsize=14)
        plt.title('Quiz Performance by Robot Condition', fontsize=16, fontweight='bold')
        plt.ylim(0, 1)
        plt.grid(axis='y', alpha=0.3)
        plt.tight_layout()
        plt.savefig('analysis_output/1_performance_by_condition.png', dpi=300, bbox_inches='tight')
        print("✓ Saved: 1_performance_by_condition.png")
        plt.close()
        
        # 2. Engagement Scores by Condition (Violin Plot)
        if 'engagement_score' in self.full_data.columns:
            plt.figure(figsize=(10, 6))
            sns.violinplot(data=self.full_data, x='condition', y='engagement_score', 
                          palette=['#2E86AB', '#A23B72'])
            plt.ylabel('Engagement Score (1-10)', fontsize=14)
            plt.xlabel('Robot Condition', fontsize=14)
            plt.title('Engagement Scores by Robot Condition', fontsize=16, fontweight='bold')
            plt.tight_layout()
            plt.savefig('analysis_output/2_engagement_by_condition.png', dpi=300, bbox_inches='tight')
            print("✓ Saved: 2_engagement_by_condition.png")
            plt.close()
        
        # 3. All Survey Measures Comparison (Grouped Bar Chart)
        plt.figure(figsize=(12, 6))
        survey_means = self.full_data.groupby('condition')[
            ['engagement_score', 'usability_score', 'adaptiveness_score', 'satisfaction_overall']
        ].mean()
        
        x = np.arange(len(survey_means.columns))
        width = 0.35
        
        plt.bar(x - width/2, survey_means.loc['adaptive'], width, label='Adaptive', 
                alpha=0.8, color='#2E86AB')
        plt.bar(x + width/2, survey_means.loc['static'], width, label='Static', 
                alpha=0.8, color='#A23B72')
        
        plt.xlabel('Measure', fontsize=14)
        plt.ylabel('Mean Score (1-10)', fontsize=14)
        plt.title('Survey Measures by Robot Condition', fontsize=16, fontweight='bold')
        plt.xticks(x, ['Engagement', 'Usability', 'Trust/\nHelpfulness', 'Satisfaction'], 
                   fontsize=12)
        plt.legend(fontsize=12)
        plt.ylim(0, 10)
        plt.grid(axis='y', alpha=0.3)
        plt.tight_layout()
        plt.savefig('analysis_output/3_survey_comparison.png', dpi=300, bbox_inches='tight')
        print("✓ Saved: 3_survey_comparison.png")
        plt.close()
        
        # 4. Demographics - Age Distribution (Histogram)
        plt.figure(figsize=(10, 6))
        plt.hist(self.demographics['age'].dropna(), bins=15, edgecolor='black', 
                alpha=0.7, color='#06A77D')
        plt.xlabel('Age', fontsize=14)
        plt.ylabel('Frequency', fontsize=14)
        plt.title('Age Distribution of Participants', fontsize=16, fontweight='bold')
        plt.axvline(self.demographics['age'].mean(), color='red', linestyle='--', 
                   linewidth=2, label=f'Mean = {self.demographics["age"].mean():.1f}')
        plt.legend(fontsize=12)
        plt.grid(axis='y', alpha=0.3)
        plt.tight_layout()
        plt.savefig('analysis_output/4_age_distribution.png', dpi=300, bbox_inches='tight')
        print("✓ Saved: 4_age_distribution.png")
        plt.close()
        
        # 5. Demographics - Gender Distribution (Pie Chart)
        plt.figure(figsize=(8, 8))
        gender_counts = self.demographics['gender'].value_counts()
        colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A']
        plt.pie(gender_counts, labels=gender_counts.index, autopct='%1.1f%%', 
               startangle=90, colors=colors[:len(gender_counts)], textprops={'fontsize': 14})
        plt.title('Gender Distribution', fontsize=16, fontweight='bold')
        plt.tight_layout()
        plt.savefig('analysis_output/5_gender_distribution.png', dpi=300, bbox_inches='tight')
        print("✓ Saved: 5_gender_distribution.png")
        plt.close()
        
        # 6. Correlation Heatmap (Survey Measures)
        if all(col in self.full_data.columns for col in ['engagement_score', 'usability_score', 
                                                          'adaptiveness_score', 'satisfaction_overall', 'accuracy']):
            plt.figure(figsize=(10, 8))
            corr_cols = ['accuracy', 'engagement_score', 'usability_score', 
                        'adaptiveness_score', 'satisfaction_overall']
            corr_matrix = self.full_data[corr_cols].corr()
            
            sns.heatmap(corr_matrix, annot=True, cmap='coolwarm', center=0, 
                       square=True, linewidths=1, cbar_kws={"shrink": 0.8},
                       xticklabels=['Performance', 'Engagement', 'Usability', 'Trust', 'Satisfaction'],
                       yticklabels=['Performance', 'Engagement', 'Usability', 'Trust', 'Satisfaction'])
            plt.title('Correlation Matrix: Key Variables', fontsize=16, fontweight='bold')
            plt.tight_layout()
            plt.savefig('analysis_output/6_correlation_matrix.png', dpi=300, bbox_inches='tight')
            print("✓ Saved: 6_correlation_matrix.png")
            plt.close()
        
        print("\nAll visualizations saved to 'analysis_output/' directory\n")
    
    def generate_summary_report(self, demo_stats, hypothesis_results):
        """Generate a text summary report"""
        report = []
        report.append("="*60)
        report.append("PSITURK EXPERIMENT ANALYSIS SUMMARY REPORT")
        report.append("Robot Tutor Adaptiveness Study")
        report.append("="*60)
        report.append("")
        
        report.append("RESEARCH QUESTION:")
        report.append("How does the adaptiveness of a robot tutor's feedback affect")
        report.append("learner engagement, trust, and performance during an educational task?")
        report.append("")
        
        report.append("DEMOGRAPHICS:")
        report.append(f"  Age: M = {demo_stats['age_mean']:.2f}, SD = {demo_stats['age_std']:.2f}")
        report.append(f"  Gender Distribution:")
        for gender, count in demo_stats['gender_counts'].items():
            report.append(f"    - {gender}: {count}")
        report.append("")
        
        report.append("HYPOTHESIS TESTING RESULTS:")
        report.append("-" * 60)
        for h_name, h_result in hypothesis_results.items():
            report.append(f"{h_name.upper()}:")
            report.append(f"  t-statistic: {h_result['t_stat']:.3f}")
            report.append(f"  p-value: {h_result['p_value']:.4f}")
            report.append(f"  Adaptive M: {h_result['adaptive_mean']:.3f}")
            report.append(f"  Static M: {h_result['static_mean']:.3f}")
            report.append(f"  Status: {'✓ SUPPORTED' if h_result['supported'] else '✗ NOT SUPPORTED'}")
            report.append("")
        
        report_text = "\n".join(report)
        
        with open('analysis_output/ANALYSIS_SUMMARY_REPORT.txt', 'w') as f:
            f.write(report_text)
        
        print(report_text)
        print("Summary report saved to: analysis_output/ANALYSIS_SUMMARY_REPORT.txt")
        
    def run_full_analysis(self):
        """Execute complete analysis pipeline"""
        self.load_data()
        self.clean_trial_data()
        self.clean_question_data()
        self.merge_all_data()
        
        demo_stats = self.analyze_demographics()
        hypothesis_results = self.test_hypotheses()
        self.create_visualizations()
        self.generate_summary_report(demo_stats, hypothesis_results)
        
        # Save cleaned data
        self.full_data.to_csv('analysis_output/cleaned_full_data.csv', index=False)
        print("\n✓ Cleaned data saved to: analysis_output/cleaned_full_data.csv")
        
        print("\n" + "="*60)
        print("ANALYSIS COMPLETE!")
        print("="*60)
        print("Check 'analysis_output/' folder for all results")


# Run the analysis
if __name__ == "__main__":
    analyzer = PsiTurkAnalysis('trialdata.csv', 'questiondata.csv')
    analyzer.run_full_analysis()
