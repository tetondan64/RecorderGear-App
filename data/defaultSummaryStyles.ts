
import { SummaryStyle } from '@/types/summary';

export function getDefaultSummaryStyles(): SummaryStyle[] {
  const now = new Date().toISOString();
  
  return [
    {
      id: 'executive-summary',
      title: 'Executive Summary',
      subtitle: 'Concise overview with key points',
      instructions: `Create a professional executive summary with the following structure:

**EXECUTIVE SUMMARY**

**Key Points:**
• [List 3-5 main points from the content]

**Decisions Made:**
• [Any decisions or conclusions reached]

**Action Items:**
• [Next steps or actions identified]

**Key Metrics/Numbers:**
• [Important numbers, dates, or quantifiable information]

Keep it concise, professional, and focused on actionable insights. Use bullet points for clarity.`,
      isDefault: true,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'meeting-notes',
      title: 'Meeting Notes',
      subtitle: 'Structured meeting recap',
      instructions: `Format the content as structured meeting notes:

**MEETING NOTES**

**Date/Time:** [Extract any dates/times mentioned]

**Participants:** [List any names or roles mentioned]

**Agenda Items Discussed:**
1. [Topic 1]
2. [Topic 2]
3. [Topic 3]

**Key Discussions:**
• [Main discussion points]

**Decisions Made:**
• [Any decisions reached]

**Action Items:**
• [Who does what by when]

**Next Steps:**
• [Follow-up actions]

**Questions/Issues to Resolve:**
• [Outstanding items]

Format as clear, scannable meeting minutes that someone who wasn't present could understand.`,
      isDefault: true,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'key-insights',
      title: 'Key Insights',
      subtitle: 'Extract main insights and takeaways',
      instructions: `Extract and present the key insights and takeaways:

**KEY INSIGHTS & TAKEAWAYS**

**Primary Insights:**
• [Most important insight #1]
• [Most important insight #2]
• [Most important insight #3]

**Supporting Details:**
• [Supporting information for the insights above]

**Patterns/Trends Identified:**
• [Any recurring themes or patterns]

**Implications:**
• [What these insights mean]
• [Why they matter]

**Learning Points:**
• [Lessons learned]
• [New knowledge gained]

**Quotable Moments:**
• [Any particularly insightful quotes or statements]

Focus on extracting wisdom and understanding rather than just summarizing facts.`,
      isDefault: true,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'interview-summary',
      title: 'Interview Summary',
      subtitle: 'Q&A format with key responses',
      instructions: `Structure the content as an interview summary with questions and answers:

**INTERVIEW SUMMARY**

**Interviewee:** [Name/role if mentioned]
**Topic:** [Main subject matter]

**KEY QUESTIONS & RESPONSES:**

**Q: [Question 1 or topic area]**
A: [Key response/answer]

**Q: [Question 2 or topic area]**
A: [Key response/answer]

**Q: [Question 3 or topic area]**
A: [Key response/answer]

**NOTABLE QUOTES:**
• "[Direct quote 1]"
• "[Direct quote 2]"

**KEY THEMES:**
• [Main theme 1]
• [Main theme 2]
• [Main theme 3]

**BACKGROUND/EXPERIENCE:**
• [Relevant background information shared]

**RECOMMENDATIONS/ADVICE:**
• [Any advice or recommendations given]

Present in a Q&A format that captures the essence of an interview or conversation.`,
      isDefault: true,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'lecture-notes',
      title: 'Lecture Notes',
      subtitle: 'Educational content with main topics',
      instructions: `Format as comprehensive lecture notes for educational content:

**LECTURE NOTES**

**Subject:** [Main topic/subject]
**Date:** [Date if mentioned]

**MAIN TOPICS COVERED:**

**I. [Major Topic 1]**
   A. [Subtopic A]
      • [Key point 1]
      • [Key point 2]
   B. [Subtopic B]
      • [Key point 1]
      • [Key point 2]

**II. [Major Topic 2]**
   A. [Subtopic A]
      • [Key point 1]
      • [Key point 2]

**III. [Major Topic 3]**
   A. [Subtopic A]
      • [Key point 1]

**KEY CONCEPTS:**
• [Important concept 1] - [Definition/explanation]
• [Important concept 2] - [Definition/explanation]

**EXAMPLES GIVEN:**
• [Example 1]
• [Example 2]

**IMPORTANT FORMULAS/PROCESSES:**
• [Any formulas, steps, or processes mentioned]

**STUDY POINTS:**
• [Items that seem particularly important to remember]

Structure like academic notes that would be useful for studying or reference.`,
      isDefault: true,
      createdAt: now,
      updatedAt: now
    }
  ];
}
