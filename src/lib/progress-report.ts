/**
 * Progress Report generator.
 * Builds structured HTML from Brain data and session stats,
 * then prints to PDF via window.print().
 */
import type { BrainSummary } from '@/components/brain/BrainViewer';
import type { Milestone } from '@/store/streaksStore';

export interface ProgressReportData {
  /** Role/companion display name */
  roleName: string;
  /** Companion's custom name (user-given) */
  companionName?: string;
  /** Role category for section-specific content */
  roleCategory?: 'education' | 'language' | 'health' | 'career' | 'general';
  /** Date range label e.g. "March 1 - March 29, 2026" */
  dateRange: string;
  /** Brain file summary */
  brain: BrainSummary;
  /** Session stats */
  stats: {
    totalSessions: number;
    totalMinutes: number;
    currentStreak: number;
    longestStreak: number;
  };
  /** Milestones achieved */
  milestones: Milestone[];
  /** Accent color for the role */
  accentColor?: string;

  // --- Category-specific fields ---

  /** Education-specific */
  education?: {
    topicsCovered: string[];
    topicsMastered: string[];
    topicsRemaining: string[];
    examReadinessScore?: number;
  };
  /** Language-specific */
  language?: {
    cefrLevel?: string;
    vocabularyCount?: number;
    pronunciationNotes?: string;
  };
  /** Health-specific */
  health?: {
    sessionThemes: string[];
    wellbeingTrend: 'stable' | 'improving' | 'declining';
    keyDiscussionAreas: string[];
  };
  /** Career-specific */
  career?: {
    applicationReadiness?: string;
    cvVersions?: number;
    interviewPrepStatus?: string;
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatMinutes(mins: number): string {
  const hours = Math.floor(mins / 60);
  const remaining = Math.round(mins % 60);
  if (hours === 0) return `${remaining}m`;
  if (remaining === 0) return `${hours}h`;
  return `${hours}h ${remaining}m`;
}

/**
 * Generate a complete HTML document suitable for window.print() PDF export.
 */
export function generateReportHtml(data: ProgressReportData): string {
  const accent = data.accentColor || '#1E6FFF';
  const title = data.companionName
    ? `${data.companionName} - Progress Report`
    : `${data.roleName} - Progress Report`;

  let categorySections = '';

  // Education section
  if (data.roleCategory === 'education' && data.education) {
    const edu = data.education;
    categorySections += `
      <div class="section">
        <h2>Learning Progress</h2>
        ${edu.examReadinessScore !== undefined ? `
          <div class="stat-row">
            <span class="stat-label">Exam Readiness</span>
            <span class="stat-value" style="color: ${edu.examReadinessScore >= 70 ? '#00AA78' : edu.examReadinessScore >= 40 ? '#F59E0B' : '#CC3333'}">${edu.examReadinessScore}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${edu.examReadinessScore}%; background: ${edu.examReadinessScore >= 70 ? '#00AA78' : edu.examReadinessScore >= 40 ? '#F59E0B' : '#CC3333'}"></div>
          </div>
        ` : ''}
        ${edu.topicsMastered.length > 0 ? `
          <h3>Topics Mastered (${edu.topicsMastered.length})</h3>
          <ul>${edu.topicsMastered.map((t) => `<li class="success">${escapeHtml(t)}</li>`).join('')}</ul>
        ` : ''}
        ${edu.topicsCovered.length > 0 ? `
          <h3>Topics In Progress (${edu.topicsCovered.length})</h3>
          <ul>${edu.topicsCovered.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul>
        ` : ''}
        ${edu.topicsRemaining.length > 0 ? `
          <h3>Topics Remaining (${edu.topicsRemaining.length})</h3>
          <ul class="muted">${edu.topicsRemaining.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul>
        ` : ''}
      </div>
    `;
  }

  // Language section
  if (data.roleCategory === 'language' && data.language) {
    const lang = data.language;
    categorySections += `
      <div class="section">
        <h2>Language Progress</h2>
        ${lang.cefrLevel ? `
          <div class="stat-row">
            <span class="stat-label">CEFR Level</span>
            <span class="stat-value badge">${escapeHtml(lang.cefrLevel)}</span>
          </div>
        ` : ''}
        ${lang.vocabularyCount ? `
          <div class="stat-row">
            <span class="stat-label">Vocabulary</span>
            <span class="stat-value">${lang.vocabularyCount.toLocaleString()} words</span>
          </div>
        ` : ''}
        ${lang.pronunciationNotes ? `
          <h3>Pronunciation Notes</h3>
          <p>${escapeHtml(lang.pronunciationNotes)}</p>
        ` : ''}
      </div>
    `;
  }

  // Health section
  if (data.roleCategory === 'health' && data.health) {
    const h = data.health;
    const trendColor = h.wellbeingTrend === 'improving' ? '#00AA78' : h.wellbeingTrend === 'declining' ? '#CC3333' : '#F59E0B';
    categorySections += `
      <div class="section">
        <h2>Wellbeing Summary</h2>
        <div class="stat-row">
          <span class="stat-label">Trend</span>
          <span class="stat-value" style="color: ${trendColor}; text-transform: capitalize">${h.wellbeingTrend}</span>
        </div>
        ${h.sessionThemes.length > 0 ? `
          <h3>Session Themes</h3>
          <div class="tag-list">${h.sessionThemes.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>
        ` : ''}
        ${h.keyDiscussionAreas.length > 0 ? `
          <h3>Key Discussion Areas</h3>
          <ul>${h.keyDiscussionAreas.map((a) => `<li>${escapeHtml(a)}</li>`).join('')}</ul>
        ` : ''}
      </div>
    `;
  }

  // Career section
  if (data.roleCategory === 'career' && data.career) {
    const c = data.career;
    categorySections += `
      <div class="section">
        <h2>Career Progress</h2>
        ${c.applicationReadiness ? `
          <div class="stat-row">
            <span class="stat-label">Application Readiness</span>
            <span class="stat-value">${escapeHtml(c.applicationReadiness)}</span>
          </div>
        ` : ''}
        ${c.cvVersions ? `
          <div class="stat-row">
            <span class="stat-label">CV Versions</span>
            <span class="stat-value">${c.cvVersions}</span>
          </div>
        ` : ''}
        ${c.interviewPrepStatus ? `
          <div class="stat-row">
            <span class="stat-label">Interview Prep</span>
            <span class="stat-value">${escapeHtml(c.interviewPrepStatus)}</span>
          </div>
        ` : ''}
      </div>
    `;
  }

  // Milestones section
  let milestonesSection = '';
  if (data.milestones.length > 0) {
    milestonesSection = `
      <div class="section">
        <h2>Milestones Achieved</h2>
        <div class="milestone-grid">
          ${data.milestones.map((ms) => `
            <div class="milestone-card">
              <div class="milestone-icon">${ms.type === 'session' ? '&#127942;' : ms.type === 'streak' ? '&#9889;' : '&#9202;'}</div>
              <div class="milestone-label">${escapeHtml(ms.label)}</div>
              <div class="milestone-date">${new Date(ms.achievedAt).toLocaleDateString()}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <style>
    @page { margin: 20mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1a1a2e;
      line-height: 1.6;
      padding: 0;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 16px;
      border-bottom: 2px solid ${accent};
      margin-bottom: 24px;
    }
    .header-left h1 {
      font-size: 20px;
      font-weight: 800;
      color: ${accent};
    }
    .header-left .subtitle {
      font-size: 12px;
      color: #666;
      margin-top: 2px;
    }
    .header-right {
      text-align: right;
      font-size: 11px;
      color: #999;
    }
    .logo-mark {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: ${accent};
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 14px;
      margin-bottom: 4px;
      margin-left: auto;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: #f8f9fb;
      border: 1px solid #e8ecf0;
      border-radius: 8px;
      padding: 12px;
      text-align: center;
    }
    .stat-card .stat-number {
      font-size: 24px;
      font-weight: 800;
      color: ${accent};
      line-height: 1;
    }
    .stat-card .stat-desc {
      font-size: 10px;
      color: #888;
      margin-top: 4px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .section { margin-bottom: 24px; }
    .section h2 {
      font-size: 14px;
      font-weight: 700;
      color: ${accent};
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 1px solid #e8ecf0;
    }
    .section h3 {
      font-size: 12px;
      font-weight: 600;
      color: #444;
      margin: 12px 0 6px;
    }
    .section p {
      font-size: 12px;
      color: #555;
    }
    .section ul {
      list-style: none;
      padding: 0;
    }
    .section ul li {
      font-size: 12px;
      color: #444;
      padding: 3px 0 3px 16px;
      position: relative;
    }
    .section ul li::before {
      content: '';
      position: absolute;
      left: 0;
      top: 10px;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: ${accent};
    }
    .section ul li.success::before { background: #00AA78; }
    .section ul.muted li { color: #999; }
    .section ul.muted li::before { background: #ccc; }
    .stat-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 0;
    }
    .stat-label { font-size: 12px; color: #666; }
    .stat-value { font-size: 13px; font-weight: 700; color: #1a1a2e; }
    .stat-value.badge {
      background: ${accent}15;
      color: ${accent};
      padding: 2px 10px;
      border-radius: 100px;
    }
    .progress-bar {
      height: 6px;
      background: #e8ecf0;
      border-radius: 3px;
      overflow: hidden;
      margin: 8px 0 16px;
    }
    .progress-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 300ms ease;
    }
    .tag-list { display: flex; flex-wrap: wrap; gap: 6px; }
    .tag {
      font-size: 11px;
      padding: 3px 10px;
      border-radius: 100px;
      background: #f0f2f5;
      color: #555;
    }
    .milestone-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    .milestone-card {
      background: #f8f9fb;
      border: 1px solid #e8ecf0;
      border-radius: 8px;
      padding: 10px;
      text-align: center;
    }
    .milestone-icon { font-size: 20px; margin-bottom: 4px; }
    .milestone-label { font-size: 11px; font-weight: 600; color: #333; }
    .milestone-date { font-size: 9px; color: #999; margin-top: 2px; }
    .footer {
      margin-top: 32px;
      padding-top: 12px;
      border-top: 1px solid #e8ecf0;
      font-size: 10px;
      color: #bbb;
      text-align: center;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>${escapeHtml(data.companionName || data.roleName)}</h1>
      <div class="subtitle">Progress Report - ${escapeHtml(data.dateRange)}</div>
    </div>
    <div class="header-right">
      <div class="logo-mark">TA</div>
      <div>Trust Agent</div>
    </div>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-number">${data.stats.totalSessions}</div>
      <div class="stat-desc">Sessions</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${formatMinutes(data.stats.totalMinutes)}</div>
      <div class="stat-desc">Total Time</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${data.stats.currentStreak}</div>
      <div class="stat-desc">Day Streak</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${data.milestones.length}</div>
      <div class="stat-desc">Milestones</div>
    </div>
  </div>

  ${data.brain.progressPercent !== undefined ? `
    <div class="section">
      <h2>Overall Progress</h2>
      <div class="stat-row">
        <span class="stat-label">Completion</span>
        <span class="stat-value">${data.brain.progressPercent}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${data.brain.progressPercent}%; background: ${accent}"></div>
      </div>
    </div>
  ` : ''}

  ${categorySections}

  ${data.brain.goals && data.brain.goals.length > 0 ? `
    <div class="section">
      <h2>Goals</h2>
      <ul>${data.brain.goals.map((g) => `<li>${escapeHtml(g)}</li>`).join('')}</ul>
    </div>
  ` : ''}

  ${milestonesSection}

  ${data.brain.lastSessionSummary ? `
    <div class="section">
      <h2>Last Session</h2>
      <p>${escapeHtml(data.brain.lastSessionSummary)}</p>
    </div>
  ` : ''}

  ${data.brain.nextSessionFocus ? `
    <div class="section">
      <h2>Next Session Focus</h2>
      <p style="font-weight: 600; color: ${accent}">${escapeHtml(data.brain.nextSessionFocus)}</p>
    </div>
  ` : ''}

  <div class="footer">
    Generated by Trust Agent Desktop - ${new Date().toLocaleDateString()}
  </div>
</body>
</html>`;
}

/**
 * Open the report in a new window and trigger print (save as PDF).
 */
export function printReport(data: ProgressReportData): void {
  const html = generateReportHtml(data);
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.warn('[ProgressReport] Could not open print window');
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  // Wait for content to render before printing
  printWindow.onload = () => {
    printWindow.print();
  };
}

/**
 * Copy a shareable text summary to clipboard.
 */
export async function copyReportSummary(data: ProgressReportData): Promise<boolean> {
  const lines = [
    `Trust Agent Progress Report`,
    `${data.companionName || data.roleName} - ${data.dateRange}`,
    ``,
    `Sessions: ${data.stats.totalSessions}`,
    `Total time: ${formatMinutes(data.stats.totalMinutes)}`,
    `Current streak: ${data.stats.currentStreak} days`,
    `Milestones: ${data.milestones.length}`,
  ];

  if (data.brain.progressPercent !== undefined) {
    lines.push(`Progress: ${data.brain.progressPercent}%`);
  }
  if (data.brain.cefrLevel) {
    lines.push(`Language level: ${data.brain.cefrLevel}`);
  }
  if (data.education?.examReadinessScore !== undefined) {
    lines.push(`Exam readiness: ${data.education.examReadinessScore}%`);
  }

  try {
    await navigator.clipboard.writeText(lines.join('\n'));
    return true;
  } catch {
    return false;
  }
}
