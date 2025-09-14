<template>
  <div class="mps-container">
    <div class="header-container">
      <div class="header-content">
        <div class="header-title">
          <h1>Mean Percentage Score<span class="material-icons">analytics</span></h1>
          <button @click="$router.back()" class="back-btn">
            <span class="material-icons">arrow_back</span> Back
          </button>
        </div>
        <div class="divider"></div>
        <div class="header-text">
          <p class="subtitle">Analyze student performance across sections</p>
        </div>
      </div>
      <div class="header-background">MPS</div>
    </div>

    <div class="header-actions">
      <button class="action-btn print-btn" @click="printReport">
        <i class="fas fa-print"></i> Print Report
      </button>
      <button class="action-btn export-btn" @click="exportData">
        <i class="fas fa-file-export"></i> Export Data
      </button>
      <button class="action-btn pdf-btn" @click="downloadPDF">
        <i class="fas fa-file-pdf"></i> Download PDF
      </button>
      <button class="action-btn ai-btn" @click="toggleAIAnalysis" :disabled="loading || !mpsData">
        <i class="fas fa-brain"></i> AI Analysis
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <span class="material-icons-round rotating">sync</span>
      <p>Loading MPS data...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <span class="material-icons-round">error_outline</span>
      <p>{{ error }}</p>
      <button @click="loadMPSData" class="retry-btn">
        <span class="material-icons-round">refresh</span>
        Retry
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="!mpsData" class="empty-state">
      <span class="material-icons-round">analytics</span>
      <p>No MPS data available</p>
      <p class="empty-subtext">There are no scores recorded for this exam yet.</p>
    </div>

    <!-- AI Analysis Panel -->
    <div v-if="showAIAnalysis && mpsData" class="ai-analysis-panel">
      <div class="card-header">
        <h2>
          <span class="material-icons">psychology</span>
          AI Analysis & Insights
        </h2>
        <button class="close-btn" @click="showAIAnalysis = false">
          <span class="material-icons">close</span>
        </button>
      </div>

      <div class="ai-content">
        <div class="ai-tabs">
          <button 
            v-for="tab in aiTabs" 
            :key="tab.id" 
            :class="['ai-tab', { active: currentAITab === tab.id }]"
            @click="switchAITab(tab.id)"
          >
            <span class="material-icons">{{ tab.icon }}</span>
            {{ tab.label }}
          </button>
        </div>

        <div class="ai-panel-content">
          <!-- AI Loading State -->
          <div v-if="aiLoading" class="ai-loading">
            <div class="ai-loading-animation">
              <span class="material-icons rotating">psychology</span>
            </div>
            <p>Analyzing exam data with AI...</p>
            <p class="ai-loading-subtitle">This may take a few moments</p>
          </div>

          <!-- AI Error State -->
          <div v-else-if="aiError" class="ai-error">
            <span class="material-icons">error_outline</span>
            <p>{{ aiError }}</p>
            <button @click="generateAnalysis(currentAITab)" class="retry-btn">
              <span class="material-icons">refresh</span>
              Retry Analysis
            </button>
          </div>

          <!-- AI Analysis Result: Full Analysis -->
          <div v-else-if="currentAITab === 'full' && aiResults.full" class="ai-result">
            <div class="ai-summary-card">
              <h3><span class="material-icons">summarize</span> Summary</h3>
              <p>{{ aiResults.full.summary || 'No summary available' }}</p>
            </div>
            
            <div class="ai-insights" v-if="aiResults.full.insights && aiResults.full.insights.length > 0">
              <h3><span class="material-icons">lightbulb</span> Key Insights</h3>
              <div class="insights-list">
                <div v-for="(insight, idx) in aiResults.full.insights" :key="'insight-'+idx" class="insight-item">
                  <div class="insight-title">{{ insight.title }}</div>
                  <div class="insight-desc">{{ insight.description }}</div>
                </div>
              </div>
            </div>

            <div class="ai-section-analysis" v-if="aiResults.full.sectionAnalysis">
              <h3><span class="material-icons">compare</span> Section Analysis</h3>
              <div class="section-comparison">
                <div class="top-section" v-if="aiResults.full.sectionAnalysis.topSection">
                  <div class="section-header">
                    <span class="material-icons">trending_up</span>
                    Top Performing: <strong>{{ aiResults.full.sectionAnalysis.topSection }}</strong>
                  </div>
                </div>
                <div class="bottom-section" v-if="aiResults.full.sectionAnalysis.bottomSection">
                  <div class="section-header">
                    <span class="material-icons">trending_down</span>
                    Needs Improvement: <strong>{{ aiResults.full.sectionAnalysis.bottomSection }}</strong>
                  </div>
                </div>
                <div class="section-analysis-text" v-if="aiResults.full.sectionAnalysis.analysis">
                  {{ aiResults.full.sectionAnalysis.analysis }}
                </div>
                <div class="section-analysis-text" v-else>
                  No detailed section analysis available.
                </div>
              </div>
            </div>
            <div class="ai-section-analysis" v-else>
              <h3><span class="material-icons">compare</span> Section Analysis</h3>
              <div class="section-comparison">
                <p class="no-data-message">No section analysis data available.</p>
              </div>
            </div>

            <div class="ai-recommendations" v-if="aiResults.full.recommendations && aiResults.full.recommendations.length > 0">
              <h3><span class="material-icons">psychology_alt</span> Recommendations</h3>
              <div class="recommendations-list">
                <div v-for="(rec, idx) in aiResults.full.recommendations" :key="'rec-'+idx" class="rec-item">
                  <div class="rec-title">{{ rec.title }}</div>
                  <div class="rec-desc">{{ rec.description }}</div>
                </div>
              </div>
            </div>

            <div class="ai-future" v-if="aiResults.full.futureSuggestions">
              <h3><span class="material-icons">update</span> Future Suggestions</h3>
              <p>{{ aiResults.full.futureSuggestions }}</p>
            </div>

            <!-- Top & Low Performers in Full Analysis -->
            <div class="ai-performers" v-if="mpsData && (mpsData.topPerformers || mpsData.lowPerformers)">
              <h3><span class="material-icons">emoji_events</span> Student Performance Highlights</h3>
              
              <!-- Top Performers -->
              <div class="performers-section top-performers" v-if="mpsData.topPerformers && mpsData.topPerformers.length > 0">
                <h4><span class="material-icons">trending_up</span> Top Performers</h4>
                <div class="performers-list">
                  <div v-for="(student, idx) in mpsData.topPerformers" :key="'top-'+idx" class="performer-item top">
                    <div class="performer-rank">{{ idx + 1 }}</div>
                    <div class="performer-info">
                      <div class="performer-name">{{ student.name }}</div>
                      <div class="performer-details">
                        <span class="performer-section">{{ student.gradeLevel }}-{{ student.section }}</span>
                        <span class="performer-score">{{ student.score }}/{{ student.total }} ({{ student.percentage.toFixed(1) }}%)</span>
                      </div>
                    </div>
                    <div class="performer-badge excellent">
                      <span class="material-icons">star</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Low Performers -->
              <div class="performers-section low-performers" v-if="mpsData.lowPerformers && mpsData.lowPerformers.length > 0">
                <h4><span class="material-icons">trending_down</span> Students Needing Support</h4>
                <div class="performers-list">
                  <div v-for="(student, idx) in mpsData.lowPerformers" :key="'low-'+idx" class="performer-item low">
                    <div class="performer-rank">{{ mpsData.topPerformers.length + idx + 1 }}</div>
                    <div class="performer-info">
                      <div class="performer-name">{{ student.name }}</div>
                      <div class="performer-details">
                        <span class="performer-section">{{ student.gradeLevel }}-{{ student.section }}</span>
                        <span class="performer-score">{{ student.score }}/{{ student.total }} ({{ student.percentage.toFixed(1) }}%)</span>
                      </div>
                    </div>
                    <div class="performer-badge needs-improvement">
                      <span class="material-icons">support</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Performance Insights -->
              <div class="performance-insights" v-if="mpsData.topPerformers && mpsData.lowPerformers">
                <h4><span class="material-icons">analytics</span> Performance Insights</h4>
                <div class="insights-grid">
                  <div class="insight-card">
                    <div class="insight-value">{{ mpsData.topPerformers.length }}</div>
                    <div class="insight-label">Top Performers</div>
                    <div class="insight-desc">Students scoring in the top tier</div>
                  </div>
                  <div class="insight-card">
                    <div class="insight-value">{{ mpsData.lowPerformers.length }}</div>
                    <div class="insight-label">Need Support</div>
                    <div class="insight-desc">Students requiring additional help</div>
                  </div>
                  <div class="insight-card">
                    <div class="insight-value">{{ ((mpsData.topPerformers[0]?.percentage || 0) - (mpsData.lowPerformers[0]?.percentage || 0)).toFixed(1) }}%</div>
                    <div class="insight-label">Score Gap</div>
                    <div class="insight-desc">Difference between highest and lowest</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- AI Analysis Result: Insights Only -->
          <div v-else-if="currentAITab === 'insights' && aiResults.insights" class="ai-result">
            <div class="ai-insights">
              <h3><span class="material-icons">lightbulb</span> Key Insights</h3>
              <div class="insights-list" v-if="Array.isArray(aiResults.insights) && aiResults.insights.length > 0">
                <div v-for="(insight, idx) in aiResults.insights" :key="'insight-'+idx" class="insight-item">
                  <div class="insight-title">{{ insight.title }}</div>
                  <div class="insight-desc">{{ insight.description }}</div>
                </div>
              </div>
              <p class="no-data-message" v-else>No insights data available.</p>
            </div>
          </div>

          <!-- AI Analysis Result: Recommendations Only -->
          <div v-else-if="currentAITab === 'recommendations' && aiResults.recommendations" class="ai-result">
            <div class="ai-recommendations">
              <h3><span class="material-icons">psychology_alt</span> Teaching Recommendations</h3>
              <div class="recommendations-list" v-if="Array.isArray(aiResults.recommendations) && aiResults.recommendations.length > 0">
                <div v-for="(rec, idx) in aiResults.recommendations" :key="'rec-'+idx" class="rec-item">
                  <div class="rec-title">{{ rec.title }}</div>
                  <div class="rec-desc">{{ rec.description }}</div>
                </div>
              </div>
              <p class="no-data-message" v-else>No recommendation data available.</p>
            </div>
          </div>

          <!-- AI Analysis Result: Improvements -->
          <div v-else-if="currentAITab === 'improvements' && aiResults.improvements" class="ai-result">
            <div class="ai-improvements">
              <h3><span class="material-icons">trending_up</span> Improvement Strategies</h3>
              <div v-if="aiResults.improvements.message" class="message-card">
                <p>{{ aiResults.improvements.message }}</p>
              </div>
              <div class="improvements-list" v-else-if="Array.isArray(aiResults.improvements) && aiResults.improvements.length > 0">
                <div v-for="(imp, idx) in aiResults.improvements" :key="'imp-'+idx" class="improvement-item">
                  <div class="improvement-strategy">{{ imp.strategy }}</div>
                  <div class="improvement-implementation">
                    <strong>Implementation:</strong> {{ imp.implementation }}
                  </div>
                  <div class="improvement-outcome">
                    <strong>Expected Outcome:</strong> {{ imp.expectedOutcome }}
                  </div>
                </div>
              </div>
              <p class="no-data-message" v-else>No improvement strategies available.</p>
            </div>
          </div>

          <!-- AI Analysis Result: Next Steps -->
          <div v-else-if="currentAITab === 'nextSteps' && aiResults.nextSteps" class="ai-result">
            <div class="ai-next-steps">
              <h3><span class="material-icons">checklist</span> Recommended Next Steps</h3>
              <div class="next-steps-list" v-if="Array.isArray(aiResults.nextSteps) && aiResults.nextSteps.length > 0">
                <div v-for="(step, idx) in aiResults.nextSteps" :key="'step-'+idx" class="next-step-item">
                  <div class="step-number">{{ idx + 1 }}</div>
                  <div class="step-content">
                    <div class="step-title">{{ step.title }}</div>
                    <div class="step-action"><strong>Action:</strong> {{ step.action }}</div>
                    <div class="step-rationale"><strong>Rationale:</strong> {{ step.rationale }}</div>
                  </div>
                </div>
              </div>
              <p class="no-data-message" v-else>No next steps data available.</p>
            </div>
          </div>

          <!-- AI Analysis Result: Top & Low Performers -->
          <div v-else-if="currentAITab === 'performers' && mpsData" class="ai-result">
            <div class="performers-analysis">
              <h3><span class="material-icons">emoji_events</span> Student Performance Analysis</h3>
              
              <!-- Top Performers -->
              <div class="performers-section top-performers" v-if="mpsData.topPerformers && mpsData.topPerformers.length > 0">
                <h4><span class="material-icons">trending_up</span> Top Performers</h4>
                <div class="performers-list">
                  <div v-for="(student, idx) in mpsData.topPerformers" :key="'top-'+idx" class="performer-item top">
                    <div class="performer-rank">{{ idx + 1 }}</div>
                    <div class="performer-info">
                      <div class="performer-name">{{ student.name }}</div>
                      <div class="performer-details">
                        <span class="performer-section">{{ student.gradeLevel }}-{{ student.section }}</span>
                        <span class="performer-score">{{ student.score }}/{{ student.total }} ({{ student.percentage.toFixed(1) }}%)</span>
                      </div>
                    </div>
                    <div class="performer-badge excellent">
                      <span class="material-icons">star</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Low Performers -->
              <div class="performers-section low-performers" v-if="mpsData.lowPerformers && mpsData.lowPerformers.length > 0">
                <h4><span class="material-icons">trending_down</span> Students Needing Support</h4>
                <div class="performers-list">
                  <div v-for="(student, idx) in mpsData.lowPerformers" :key="'low-'+idx" class="performer-item low">
                    <div class="performer-rank">{{ mpsData.topPerformers.length + idx + 1 }}</div>
                    <div class="performer-info">
                      <div class="performer-name">{{ student.name }}</div>
                      <div class="performer-details">
                        <span class="performer-section">{{ student.gradeLevel }}-{{ student.section }}</span>
                        <span class="performer-score">{{ student.score }}/{{ student.total }} ({{ student.percentage.toFixed(1) }}%)</span>
                      </div>
                    </div>
                    <div class="performer-badge needs-improvement">
                      <span class="material-icons">support</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Performance Insights -->
              <div class="performance-insights" v-if="mpsData.topPerformers && mpsData.lowPerformers">
                <h4><span class="material-icons">analytics</span> Performance Insights</h4>
                <div class="insights-grid">
                  <div class="insight-card">
                    <div class="insight-value">{{ mpsData.topPerformers.length }}</div>
                    <div class="insight-label">Top Performers</div>
                    <div class="insight-desc">Students scoring in the top tier</div>
                  </div>
                  <div class="insight-card">
                    <div class="insight-value">{{ mpsData.lowPerformers.length }}</div>
                    <div class="insight-label">Need Support</div>
                    <div class="insight-desc">Students requiring additional help</div>
                  </div>
                  <div class="insight-card">
                    <div class="insight-value">{{ ((mpsData.topPerformers[0]?.percentage || 0) - (mpsData.lowPerformers[0]?.percentage || 0)).toFixed(1) }}%</div>
                    <div class="insight-label">Score Gap</div>
                    <div class="insight-desc">Difference between highest and lowest</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- No AI data yet state -->
          <div v-else class="ai-empty">
            <span class="material-icons">psychology</span>
            <p>Click "Generate Analysis" to get AI-powered insights for this exam</p>
            <button @click="generateAnalysis(currentAITab)" class="generate-btn">
              Generate Analysis
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MPS Data Display -->
    <div v-else-if="mpsData" class="mps-data">
      <!-- Exam Summary Card -->
      <div class="exam-info-card">
        <div class="exam-title">{{ mpsData.exam.title }}</div>
        <div class="exam-code">Test Code: {{ mpsData.exam.testCode }}</div>
        <div class="exam-teacher" v-if="mpsData.exam.teacher">
          <span class="material-icons">person</span>
          Teacher: {{ mpsData.exam.teacher.name }}
        </div>
        <div class="exam-stats">
          <div class="stat-item">
            <div class="stat-label">Overall MPS</div>
            <div class="stat-value" :class="getScoreClass(mpsData.overallMPS)">
              {{ mpsData.overallMPS.toFixed(1) }}%
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Total Students</div>
            <div class="stat-value">{{ mpsData.totalStudents }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Highest Score</div>
            <div class="stat-value excellent">
              {{ mpsData.overallStats.highestScoreRaw || 0 }}/{{ mpsData.overallStats.totalPossible || 0 }}
              ({{ mpsData.overallStats.highestPercentage?.toFixed(1) || 0 }}%)
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Lowest Score</div>
            <div class="stat-value needs-improvement">
              {{ mpsData.overallStats.lowestScoreRaw || 0 }}/{{ mpsData.overallStats.totalPossible || 0 }}
              ({{ mpsData.overallStats.lowestPercentage?.toFixed(1) || 0 }}%)
            </div>
          </div>
        </div>
      </div>

      <!-- Score Distribution Card -->
      <div class="distribution-card">
        <h2>Score Distribution</h2>
        <div class="distribution-grid">
          <div class="dist-category excellent">
            <div class="dist-info">
              <span class="dist-label">Excellent (90-100%)</span>
              <span class="dist-count">{{ mpsData.overallStats.scoreDistribution.excellent }}</span>
            </div>
            <div class="dist-bar-container">
              <div class="dist-bar" 
                :style="{width: getDistributionPercentage('excellent') + '%'}">
              </div>
            </div>
          </div>
          
          <div class="dist-category good">
            <div class="dist-info">
              <span class="dist-label">Good (80-89%)</span>
              <span class="dist-count">{{ mpsData.overallStats.scoreDistribution.good }}</span>
            </div>
            <div class="dist-bar-container">
              <div class="dist-bar" 
                :style="{width: getDistributionPercentage('good') + '%'}">
              </div>
            </div>
          </div>
          
          <div class="dist-category satisfactory">
            <div class="dist-info">
              <span class="dist-label">Satisfactory (70-79%)</span>
              <span class="dist-count">{{ mpsData.overallStats.scoreDistribution.satisfactory }}</span>
            </div>
            <div class="dist-bar-container">
              <div class="dist-bar" 
                :style="{width: getDistributionPercentage('satisfactory') + '%'}">
              </div>
            </div>
          </div>
          
          <div class="dist-category fair">
            <div class="dist-info">
              <span class="dist-label">Fair (60-69%)</span>
              <span class="dist-count">{{ mpsData.overallStats.scoreDistribution.fair }}</span>
            </div>
            <div class="dist-bar-container">
              <div class="dist-bar" 
                :style="{width: getDistributionPercentage('fair') + '%'}">
              </div>
            </div>
          </div>
          
          <div class="dist-category needs-improvement">
            <div class="dist-info">
              <span class="dist-label">Poor (Below 60%)</span>
              <span class="dist-count">{{ mpsData.overallStats.scoreDistribution.poor }}</span>
            </div>
            <div class="dist-bar-container">
              <div class="dist-bar" 
                :style="{width: getDistributionPercentage('poor') + '%'}">
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- View Controls -->
      <div class="view-controls">
        <button 
          class="view-toggle-btn" 
          :class="{ active: viewMode === 'chart' }"
          @click="switchView('chart')"
        >
          <span class="material-icons">bar_chart</span>
          Chart View
        </button>
        <button 
          class="view-toggle-btn" 
          :class="{ active: viewMode === 'table' }"
          @click="switchView('table')"
        >
          <span class="material-icons">table_rows</span>
          Table View
        </button>
      </div>

      <!-- Move chart container above settings -->
      <div v-if="viewMode === 'chart'" class="chart-container">
        <h2>Section Performance</h2>
        <div class="chart-wrapper">
          <canvas ref="mpsChart" width="400" height="200"></canvas>
        </div>
      </div>

      <!-- Move the settings card below the chart -->
      <div v-if="viewMode === 'chart'" class="settings-card">
        <div class="card-header">
          <h2>
            <span class="material-icons">tune</span>
            Chart Settings
          </h2>
        </div>
        
        <div class="settings-content">
          <div class="settings-section">
            <h3>Chart Type</h3>
            <div class="chart-type-buttons">
              <button 
                v-for="option in chartTypeOptions" 
                :key="option.value"
                @click="chartType = option.value"
                :class="['chart-type-btn', { active: chartType === option.value }]"
                :title="option.label"
              >
                <span class="material-icons">{{ option.icon }}</span>
                <span class="btn-label">{{ option.label }}</span>
              </button>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="settings-section">
            <h3>Appearance</h3>
            <div class="appearance-options">
              <div class="theme-selector">
                <label for="themeSelect">Color Theme</label>
                <select id="themeSelect" v-model="colorTheme" class="theme-select">
                  <option v-for="option in colorThemeOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </div>
              
              <div class="options-grid">
                <div class="toggle-option">
                  <label>
                    <input type="checkbox" v-model="showStudentLine">
                    <span>Student Count Line</span>
                  </label>
                </div>
                
                <div class="toggle-option">
                  <label>
                    <input type="checkbox" v-model="chartSettings.showLegend">
                    <span>Show Legend</span>
                  </label>
                </div>
                
                <div class="toggle-option">
                  <label>
                    <input type="checkbox" v-model="chartSettings.showGridLines">
                    <span>Grid Lines</span>
                  </label>
                </div>
                
                <div class="toggle-option">
                  <label>
                    <input type="checkbox" v-model="chartSettings.enableAnimations">
                    <span>Animations</span>
                  </label>
                </div>
                
                <div class="toggle-option">
                  <label>
                    <input type="checkbox" v-model="chartSettings.rounded">
                    <span>Rounded Bars</span>
                  </label>
                </div>
                
                <div class="toggle-option">
                  <label>
                    <input type="checkbox" v-model="useUniqueColors">
                    <span>Unique Section Colors</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div class="settings-section">
            <h3>Data Display</h3>
            <div class="toggle-option">
              <label>
                <input type="checkbox" v-model="showRawScores">
                <span>Emphasize Raw Scores</span>
              </label>
              <div class="option-help">When enabled, raw scores (e.g., 18/20) will be emphasized in charts</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Table View -->
      <div v-else class="table-view">
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Section</th>
                <th>MPS</th>
                <th>Students</th>
                <th>Highest</th>
                <th>Lowest</th>
                <th>
                  Score Distribution
                  <div class="distribution-legend">
                    <span class="legend-item excellent">E</span>
                    <span class="legend-item good">G</span>
                    <span class="legend-item satisfactory">S</span>
                    <span class="legend-item fair">F</span>
                    <span class="legend-item needs-improvement">P</span>
                  </div>
                </th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(section, index) in mpsData.sectionMPS" :key="index">
                <td class="section-cell">{{ section.section }}</td>
                <td class="mps-cell" :class="getScoreClass(section.mps)">
                  <strong>{{ section.mps.toFixed(1) }}%</strong>
                </td>
                <td>{{ section.studentCount }}</td>
                <td class="excellent">
                  {{ section.highestScoreRaw || 0 }}/{{ section.totalPossible || 0 }}
                  ({{ section.highestPercentage?.toFixed(1) || 0 }}%)
                </td>
                <td class="needs-improvement">
                  {{ section.lowestScoreRaw || 0 }}/{{ section.totalPossible || 0 }}
                  ({{ section.lowestPercentage?.toFixed(1) || 0 }}%)
                </td>
                <td>
                  <div class="distribution-badges">
                    <span class="badge excellent">{{ section.distribution.excellent }}</span>
                    <span class="badge good">{{ section.distribution.good }}</span>
                    <span class="badge satisfactory">{{ section.distribution.satisfactory }}</span>
                    <span class="badge fair">{{ section.distribution.fair }}</span>
                    <span class="badge needs-improvement">{{ section.distribution.poor }}</span>
                  </div>
                </td>
                <td>
                  <div class="performance-bar-container">
                    <div 
                      class="performance-bar" 
                      :class="getScoreClass(section.mps)"
                      :style="{ width: `${section.mps}%` }"
                    ></div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Professional PDF Export Template -->
    <div v-if="mpsData" class="print-only">
      <div class="print-header">
        <div class="print-title">
          <h1>NEW CABALAN NATIONAL HIGH SCHOOL</h1>
          <h2>EXAM MEAN PERCENTAGE SCORE REPORT</h2>
          <div class="print-exam-info">
            <p><strong>Exam:</strong> {{ mpsData.exam.title }}</p>
            <p><strong>Test Code:</strong> {{ mpsData.exam.testCode }}</p>
            <p><strong>Teacher:</strong> {{ mpsData.exam.teacher ? mpsData.exam.teacher.name : 'N/A' }}</p>
            <p><strong>Date Generated:</strong> {{ new Date().toLocaleDateString() }}</p>
          </div>
        </div>
      </div>

      <div class="print-summary">
        <table class="summary-table">
          <thead>
            <tr>
              <th>Overall MPS (%)</th>
              <th>Total Students</th>
              <th>Highest Score</th>
              <th>Lowest Score</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="center">{{ mpsData.overallMPS.toFixed(1) }}%</td>
              <td class="center">{{ mpsData.totalStudents }}</td>
              <td class="center">
                {{ mpsData.overallStats.highestScoreRaw || 0 }}/{{ mpsData.overallStats.totalPossible || 0 }}
                ({{ mpsData.overallStats.highestPercentage?.toFixed(1) || 0 }}%)
              </td>
              <td class="center">
                {{ mpsData.overallStats.lowestScoreRaw || 0 }}/{{ mpsData.overallStats.totalPossible || 0 }}
                ({{ mpsData.overallStats.lowestPercentage?.toFixed(1) || 0 }}%)
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="print-distribution">
        <table class="distribution-table">
          <thead>
            <tr>
              <th>Excellent<br>(90-100%)</th>
              <th>Good<br>(80-89%)</th>
              <th>Satisfactory<br>(70-79%)</th>
              <th>Fair<br>(60-69%)</th>
              <th>Poor<br>(Below 60%)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="center">{{ mpsData.overallStats.scoreDistribution.excellent }}</td>
              <td class="center">{{ mpsData.overallStats.scoreDistribution.good }}</td>
              <td class="center">{{ mpsData.overallStats.scoreDistribution.satisfactory }}</td>
              <td class="center">{{ mpsData.overallStats.scoreDistribution.fair }}</td>
              <td class="center">{{ mpsData.overallStats.scoreDistribution.poor }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="print-details">
        <table class="details-table">
          <thead>
            <tr>
              <th>Section</th>
              <th>MPS (%)</th>
              <th>Students</th>
              <th>Highest Score</th>
              <th>Lowest Score</th>
              <th>Excellent</th>
              <th>Good</th>
              <th>Satisfactory</th>
              <th>Fair</th>
              <th>Poor</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(section, index) in mpsData.sectionMPS" :key="index">
              <td class="section-name">{{ section.section }}</td>
              <td class="center">{{ section.mps.toFixed(1) }}%</td>
              <td class="center">{{ section.studentCount }}</td>
              <td class="center">
                {{ section.highestScoreRaw || 0 }}/{{ section.totalPossible || 0 }}
                ({{ section.highestPercentage?.toFixed(1) || 0 }}%)
              </td>
              <td class="center">
                {{ section.lowestScoreRaw || 0 }}/{{ section.totalPossible || 0 }}
                ({{ section.lowestPercentage?.toFixed(1) || 0 }}%)
              </td>
              <td class="center">{{ section.distribution.excellent }}</td>
              <td class="center">{{ section.distribution.good }}</td>
              <td class="center">{{ section.distribution.satisfactory }}</td>
              <td class="center">{{ section.distribution.fair }}</td>
              <td class="center">{{ section.distribution.poor }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="print-footer">
        <p>Report Generated: {{ new Date().toLocaleString() }}</p>
        <p>New Cabalan National High School - Examination Analysis System</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, computed } from 'vue';
import { useRoute } from 'vue-router';
import { getExamMPS } from '@/services/authService';
import Chart from 'chart.js/auto';
import NcnhsLogo from '@/assets/ncnhs-icon.png';
import html2pdf from 'html2pdf.js';
import aiAnalysisService from '@/services/aiAnalysisService';

const route = useRoute();
const loading = ref(true);
const error = ref(null);
const mpsData = ref(null);
const mpsChart = ref(null);
let chartInstance = null;
const viewMode = ref('chart');

// AI Analysis related refs
const showAIAnalysis = ref(false);
const aiLoading = ref(false);
const aiError = ref(null);
const aiResults = ref({
  full: null,
  insights: null,
  recommendations: null,
  improvements: null,
  nextSteps: null,
  performers: null
});
const currentAITab = ref('full');

// AI tabs configuration
const aiTabs = [
  { id: 'full', label: 'Full Analysis', icon: 'psychology' },
  { id: 'insights', label: 'Key Insights', icon: 'lightbulb' },
  { id: 'recommendations', label: 'Recommendations', icon: 'psychology_alt' },
  { id: 'improvements', label: 'Improvement Strategies', icon: 'trending_up' },
  { id: 'nextSteps', label: 'Next Steps', icon: 'checklist' },
  { id: 'performers', label: 'Top & Low Performers', icon: 'emoji_events' }
];

// Get exam ID from route params
const examId = ref(route.params.examId);

// Compute total students for percentage calculations
const totalStudents = computed(() => {
  if (!mpsData.value) return 0;
  return mpsData.value.totalStudents;
});

// Calculate distribution percentage for progress bars
const getDistributionPercentage = (category) => {
  if (!mpsData.value) return 0;
  
  const count = mpsData.value.overallStats.scoreDistribution[category] || 0;
  return (count / totalStudents.value) * 100;
};

// Add these new refs after the existing ones
const chartType = ref('bar'); // Default chart type
const showStudentLine = ref(true); // Toggle for student count line
const colorTheme = ref('default'); // Color theme for charts
const chartSettings = ref({
  showLegend: true,
  showGridLines: true,
  enableAnimations: true,
  rounded: true
});
const showRawScores = ref(false);

// Add chart type options
const chartTypeOptions = [
  { value: 'bar', label: 'Bar Chart', icon: 'bar_chart' },
  { value: 'horizontalBar', label: 'Horizontal Bar', icon: 'stacked_bar_chart' },
  { value: 'line', label: 'Line Chart', icon: 'show_chart' },
  { value: 'radar', label: 'Radar Chart', icon: 'radar' },
  { value: 'pie', label: 'Pie Chart', icon: 'pie_chart' }
];

// Color theme options
const colorThemeOptions = [
  { value: 'default', label: 'Default Theme' },
  { value: 'pastel', label: 'Pastel Colors' },
  { value: 'bright', label: 'Bright Colors' },
  { value: 'cool', label: 'Cool Tones' },
  { value: 'warm', label: 'Warm Tones' }
];

// Get colors based on selected theme
const getChartColors = (scores, sections, theme) => {
  // Define a set of distinctive colors for sections
  const sectionColors = [
    { bg: 'rgba(255, 99, 132, 0.7)', border: 'rgb(255, 99, 132)' }, // Red
    { bg: 'rgba(54, 162, 235, 0.7)', border: 'rgb(54, 162, 235)' }, // Blue
    { bg: 'rgba(255, 206, 86, 0.7)', border: 'rgb(255, 206, 86)' }, // Yellow
    { bg: 'rgba(75, 192, 192, 0.7)', border: 'rgb(75, 192, 192)' }, // Teal
    { bg: 'rgba(153, 102, 255, 0.7)', border: 'rgb(153, 102, 255)' }, // Purple
    { bg: 'rgba(255, 159, 64, 0.7)', border: 'rgb(255, 159, 64)' }, // Orange
    { bg: 'rgba(76, 175, 80, 0.7)', border: 'rgb(76, 175, 80)' }, // Green
    { bg: 'rgba(233, 30, 99, 0.7)', border: 'rgb(233, 30, 99)' }, // Pink
    { bg: 'rgba(0, 188, 212, 0.7)', border: 'rgb(0, 188, 212)' }, // Cyan
    { bg: 'rgba(121, 85, 72, 0.7)', border: 'rgb(121, 85, 72)' }, // Brown
    { bg: 'rgba(3, 169, 244, 0.7)', border: 'rgb(3, 169, 244)' }, // Light Blue
    { bg: 'rgba(205, 220, 57, 0.7)', border: 'rgb(205, 220, 57)' }, // Lime
  ];
  
  // If unique section colors are enabled, use the section colors
  if (useUniqueColors.value) {
    const backgroundColors = [];
    const borderColors = [];
    
    for (let i = 0; i < sections.length; i++) {
      const colorIndex = i % sectionColors.length;
      backgroundColors.push(sectionColors[colorIndex].bg);
      borderColors.push(sectionColors[colorIndex].border);
    }
    
    return {
      background: backgroundColors,
      border: borderColors
    };
  }
  
  // Otherwise use theme-based colors
  if (theme === 'pastel') {
    return {
      background: scores.map(() => 'rgba(171, 217, 233, 0.7)'),
      border: scores.map(() => 'rgba(87, 160, 211, 1)')
    };
  } else if (theme === 'bright') {
    return {
      background: scores.map(() => 'rgba(255, 99, 132, 0.7)'),
      border: scores.map(() => 'rgba(255, 99, 132, 1)')
    };
  } else if (theme === 'cool') {
    return {
      background: scores.map(() => 'rgba(103, 71, 183, 0.7)'),
      border: scores.map(() => 'rgba(103, 71, 183, 1)')
    };
  } else if (theme === 'warm') {
    return {
      background: scores.map(() => 'rgba(255, 159, 64, 0.7)'),
      border: scores.map(() => 'rgba(255, 159, 64, 1)')
    };
  } else {
    // Default theme - score-based colors
    return {
      background: scores.map(score => {
        if (score >= 90) return 'rgba(76, 175, 80, 0.7)';
        if (score >= 80) return 'rgba(33, 150, 243, 0.7)';
        if (score >= 70) return 'rgba(255, 193, 7, 0.7)';
        if (score >= 60) return 'rgba(255, 152, 0, 0.7)';
        return 'rgba(244, 67, 54, 0.7)';
      }),
      border: scores.map(score => {
        if (score >= 90) return 'rgb(76, 175, 80)';
        if (score >= 80) return 'rgb(33, 150, 243)';
        if (score >= 70) return 'rgb(255, 193, 7)';
        if (score >= 60) return 'rgb(255, 152, 0)';
        return 'rgb(244, 67, 54)';
      })
    };
  }
};

// Load MPS data
const loadMPSData = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const data = await getExamMPS(examId.value);
    mpsData.value = data;
    
    // Use double nextTick to ensure DOM is fully updated
    nextTick(() => {
      nextTick(() => {
        console.log('Data loaded, attempting to render chart');
        renderChart();
      });
    });
  } catch (err) {
    console.error('Error loading MPS data:', err);
    error.value = err.message || 'Failed to load MPS data';
  } finally {
    loading.value = false;
  }
};

// Switch between chart and table views
const switchView = (view) => {
  viewMode.value = view;
  
  if (view === 'chart') {
    // Give DOM time to update before rendering chart
    nextTick(() => {
      nextTick(() => {
        console.log('Switched to chart view, re-rendering chart');
        renderChart();
      });
    });
  }
};

// Update the renderChart function
const renderChart = () => {
  console.log('Rendering chart, chart element exists:', !!mpsChart.value);
  
  if (!mpsData.value || !mpsData.value.sectionMPS.length) {
    console.log('No data available to render chart');
    return;
  }
  
  if (!mpsChart.value) {
    console.log('Chart canvas not available yet');
    return;
  }
  
  try {
    // Destroy existing chart if it exists
    if (chartInstance) {
      console.log('Destroying previous chart instance');
      chartInstance.destroy();
    }
    
    const ctx = mpsChart.value.getContext('2d');
    if (!ctx) {
      console.error('Failed to get canvas context');
      return;
    }
    
    console.log('Creating new chart with type:', chartType.value);
    
    // Prepare data for chart
    const sections = mpsData.value.sectionMPS.map(s => s.section);
    const scores = mpsData.value.sectionMPS.map(s => Number(s.mps.toFixed(2)));
    const studentCounts = mpsData.value.sectionMPS.map(s => s.studentCount);
    
    // Calculate raw score percentages for display
    const rawScoreData = mpsData.value.sectionMPS.map(s => {
      const total = s.totalPossible || 1; // Avoid division by zero
      
      return {
        section: s.section,
        avgRawScore: (s.mps * total / 100).toFixed(1),
        highRaw: s.highestScoreRaw || 0,
        lowRaw: s.lowestScoreRaw || 0,
        total: total
      };
    });
    
    // Get colors based on theme, passing sections for unique colors
    const colors = getChartColors(scores, sections, colorTheme.value);
    
    // Create datasets based on chart type
    let datasets = [];
    
    // Main dataset (MPS scores)
    const mainDataset = {
      label: 'Mean Percentage Score',
      data: scores,
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderWidth: 2
    };
    
    // Apply chart-specific settings
    if (['bar', 'horizontalBar'].includes(chartType.value)) {
      if (chartSettings.value.rounded) {
        mainDataset.borderRadius = 8;
        mainDataset.borderSkipped = false;
      }
      mainDataset.barPercentage = 0.6;
      mainDataset.categoryPercentage = 0.8;
    }
    
    datasets.push(mainDataset);
    
    // Add student count line if enabled and chart type is appropriate
    if (showStudentLine.value && ['bar', 'line'].includes(chartType.value)) {
      datasets.push({
        label: 'Number of Students',
        data: studentCounts,
        type: 'line',
        borderColor: 'rgba(153, 102, 255, 1)',
        backgroundColor: 'rgba(153, 102, 255, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: 'rgba(153, 102, 255, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        fill: true,
        tension: 0.4,
        yAxisID: 'y1'
      });
    }
    
    // Chart options
    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: chartSettings.value.enableAnimations ? 1000 : 0
      },
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: chartSettings.value.showLegend,
          position: 'top',
          align: 'center',
          labels: {
            boxWidth: 15,
            usePointStyle: true,
            padding: 20,
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          titleColor: '#333',
          titleFont: {
            size: 14,
            weight: 'bold'
          },
          bodyColor: '#666',
          bodyFont: {
            size: 13
          },
          borderColor: 'rgba(0, 0, 0, 0.1)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              const datasetLabel = context.dataset.label || '';
              const value = context.parsed.y || context.parsed || 0;
              const index = context.dataIndex;
              
              if (datasetLabel === 'Mean Percentage Score') {
                if (showRawScores.value && index >= 0 && index < rawScoreData.length) {
                  const rawData = rawScoreData[index];
                  return `${datasetLabel}: ${rawData.avgRawScore}/${rawData.total} (${value.toFixed(2)}%)`;
                }
                return `${datasetLabel}: ${typeof value === 'number' ? value.toFixed(2) : value}%`;
              } else if (datasetLabel === 'Number of Students') {
                return `${datasetLabel}: ${value}`;
              }
              
              return `${datasetLabel}: ${value}`;
            },
            // Update footer to show 2 decimal places
            footer: function(tooltipItems) {
              const idx = tooltipItems[0].dataIndex;
              if (idx >= 0 && idx < mpsData.value.sectionMPS.length) {
                const section = mpsData.value.sectionMPS[idx];
                const rawHigh = section.highestScoreRaw || 0;
                const rawLow = section.lowestScoreRaw || 0;
                const total = section.totalPossible || 0;
                return [
                  `High Score: ${rawHigh}/${total} (${section.highestPercentage?.toFixed(2) || 0}%)`,
                  `Low Score: ${rawLow}/${total} (${section.lowestPercentage?.toFixed(2) || 0}%)`
                ];
              }
              return [];
            }
          }
        },
        datalabels: {
          display: true,
          color: '#333',
          align: 'center',
          anchor: 'center',
          formatter: (value) => {
            return typeof value === 'number' ? value.toFixed(2) : value;
          },
          font: {
            weight: 'bold',
            size: 12
          }
        }
      }
    };
    
    // Add scales for appropriate chart types
    if (!['pie', 'doughnut', 'radar'].includes(chartType.value)) {
      chartOptions.scales = {
        y: {
          beginAtZero: true,
          max: chartType.value !== 'horizontalBar' ? 100 : undefined,
          grid: {
            display: chartSettings.value.showGridLines,
            color: 'rgba(0, 0, 0, 0.05)',
            drawBorder: false
          },
          ticks: {
            callback: value => `${value}%`,
            font: {
              size: 12
            }
          },
          title: {
            display: true,
            text: 'Mean Percentage Score (%)',
            color: '#666',
            font: {
              size: 14,
              weight: 'bold'
            }
          }
        },
        x: {
          grid: {
            display: chartSettings.value.showGridLines && chartType.value !== 'bar',
            color: 'rgba(0, 0, 0, 0.05)',
            drawBorder: false
          },
          ticks: {
            font: {
              size: 12
            }
          }
        }
      };
      
      // Add secondary y-axis for student count if needed
      if (showStudentLine.value && ['bar', 'line'].includes(chartType.value)) {
        chartOptions.scales.y1 = {
          beginAtZero: true,
          position: 'right',
          grid: {
            display: false,
            drawBorder: false
          },
          ticks: {
            font: {
              size: 12
            }
          },
          title: {
            display: true,
            text: 'Number of Students',
            color: '#666',
            font: {
              size: 14,
              weight: 'bold'
            }
          }
        };
      }
    }
    
    // Handle horizontal bar chart
    let actualChartType = chartType.value;
    if (chartType.value === 'horizontalBar') {
      actualChartType = 'bar';
      chartOptions.indexAxis = 'y';
    }
    
    // Create the chart
    chartInstance = new Chart(ctx, {
      type: actualChartType,
      data: {
        labels: sections,
        datasets: datasets
      },
      options: chartOptions
    });
  } catch (err) {
    console.error('Error rendering chart:', err);
  }
};

// Get CSS class based on score
const getScoreClass = (score) => {
  if (score >= 90) return 'excellent';
  if (score >= 80) return 'good';
  if (score >= 70) return 'satisfactory';
  if (score >= 60) return 'fair';
  return 'needs-improvement';
};

// Export data as CSV
const exportData = () => {
  if (!mpsData.value) return;
  
  // Create HTML for a styled table export
  const htmlTable = `
    <html>
      <head>
        <style>
          body { 
            font-family: Arial, sans-serif;
            color: #333;
            line-height: 1.4;
          }
          table { 
            border-collapse: collapse; 
            width: 100%; 
            margin-bottom: 20px;
            border: 1px solid #ddd;
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: center;
          }
          th { 
            background-color: #f8f8f8; 
            font-weight: bold;
            text-align: center;
            border-bottom: 2px solid #ddd;
          }
          .center { text-align: center; }
          .header { 
            display: flex; 
            align-items: center; 
            margin-bottom: 20px; 
            border-bottom: 2px solid #ddd;
            padding-bottom: 15px;
          }
          .header img { height: 80px; margin-right: 20px; }
          .title { 
            font-size: 22px; 
            font-weight: bold; 
            color: #333;
            margin: 0;
          }
          .subtitle { 
            font-size: 16px; 
            margin: 5px 0 15px 0;
            color: #555;
          }
          .info { margin-bottom: 20px; }
          .section-title { 
            background-color: #f8f8f8; 
            padding: 8px; 
            font-weight: bold; 
            margin-top: 20px; 
            margin-bottom: 10px;
            border-left: 4px solid #ddd;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .footer {
            margin-top: 20px; 
            font-size: 12px; 
            color: #666; 
            text-align: center; 
            border-top: 1px solid #ddd; 
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${NcnhsLogo}" alt="School Logo" style="height: 80px; margin-right: 20px;">
          <div>
            <div class="title">New Cabalan National High School</div>
            <div class="subtitle">Exam Mean Percentage Score Report</div>
            <div class="info">
              <p><strong>Exam:</strong> ${mpsData.value.exam.title}</p>
              <p><strong>Test Code:</strong> ${mpsData.value.exam.testCode}</p>
              <p><strong>Teacher:</strong> ${mpsData.value.exam.teacher ? mpsData.value.exam.teacher.name : 'N/A'}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
        
        <div class="section-title">Summary Statistics</div>
        <table>
          <thead>
            <tr>
              <th>Overall MPS</th>
              <th>Total Students</th>
              <th>Highest Score</th>
              <th>Lowest Score</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="center">${mpsData.value.overallMPS.toFixed(1)}%</td>
              <td class="center">${mpsData.value.totalStudents}</td>
              <td class="center">${mpsData.value.overallStats.highestScoreRaw || 0}/${mpsData.value.overallStats.totalPossible || 0} (${mpsData.value.overallStats.highestPercentage?.toFixed(1) || 0}%)</td>
              <td class="center">${mpsData.value.overallStats.lowestScoreRaw || 0}/${mpsData.value.overallStats.totalPossible || 0} (${mpsData.value.overallStats.lowestPercentage?.toFixed(1) || 0}%)</td>
            </tr>
          </tbody>
        </table>
        
        <div class="section-title">Score Distribution</div>
        <table>
          <thead>
            <tr>
              <th>Excellent (90-100%)</th>
              <th>Good (80-89%)</th>
              <th>Satisfactory (70-79%)</th>
              <th>Fair (60-69%)</th>
              <th>Poor (Below 60%)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="center">${mpsData.value.overallStats.scoreDistribution.excellent}</td>
              <td class="center">${mpsData.value.overallStats.scoreDistribution.good}</td>
              <td class="center">${mpsData.value.overallStats.scoreDistribution.satisfactory}</td>
              <td class="center">${mpsData.value.overallStats.scoreDistribution.fair}</td>
              <td class="center">${mpsData.value.overallStats.scoreDistribution.poor}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="section-title">Section Performance</div>
        <table>
          <thead>
            <tr>
              <th>Section</th>
              <th>MPS (%)</th>
              <th>Students</th>
              <th>Highest Score</th>
              <th>Lowest Score</th>
              <th>Excellent</th>
              <th>Good</th>
              <th>Satisfactory</th>
              <th>Fair</th>
              <th>Poor</th>
            </tr>
          </thead>
          <tbody>
            ${mpsData.value.sectionMPS.map(section => {
              return `
                <tr>
                  <td>${section.section}</td>
                  <td class="center">${section.mps.toFixed(1)}%</td>
                  <td class="center">${section.studentCount}</td>
                  <td class="center">${section.highestScoreRaw || 0}/${section.totalPossible || 0} (${section.highestPercentage?.toFixed(1) || 0}%)</td>
                  <td class="center">${section.lowestScoreRaw || 0}/${section.totalPossible || 0} (${section.lowestPercentage?.toFixed(1) || 0}%)</td>
                  <td class="center">${section.distribution.excellent}</td>
                  <td class="center">${section.distribution.good}</td>
                  <td class="center">${section.distribution.satisfactory}</td>
                  <td class="center">${section.distribution.fair}</td>
                  <td class="center">${section.distribution.poor}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <p>Report Generated: ${new Date().toLocaleString()}</p>
          <p>New Cabalan National High School - Examination Analysis System</p>
        </div>
      </body>
    </html>
  `;
  
  // Create a Blob with the HTML content
  const blob = new Blob([htmlTable], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `MPS_${mpsData.value.exam.testCode}.xls`);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Print the report
const printReport = () => {
  // Switch to table view for printing
  const originalView = viewMode.value;
  viewMode.value = 'table';
  
  // Wait for DOM to update
  nextTick(() => {
    // Use a small delay to ensure styles are applied
    setTimeout(() => {
  window.print();
      
      // Reset to original view after printing dialog closes
      setTimeout(() => {
        viewMode.value = originalView;
      }, 500);
    }, 100);
  });
};

// Watch for changes in exam ID
watch(examId, () => {
  loadMPSData();
});

// Watch for view mode changes
watch(viewMode, (newMode) => {
  if (newMode === 'chart') {
    nextTick(() => {
      renderChart();
    });
  }
});

// Watch for changes in chart settings
watch([chartType, showStudentLine, colorTheme, showRawScores], () => {
  if (viewMode.value === 'chart') {
    console.log('Chart settings changed, re-rendering');
    nextTick(() => {
      renderChart();
    });
  }
}, { immediate: false });

// Add a separate deep watcher for the chartSettings object
watch(() => chartSettings.value, () => {
  if (viewMode.value === 'chart') {
    console.log('Chart settings object changed, re-rendering');
    nextTick(() => {
      renderChart();
    });
  }
}, { deep: true, immediate: false });

// Add ref for the school logo in base64 format
const schoolLogoBase64 = ref('');

// Function to convert image to base64
const getBase64Image = () => {
  return new Promise((resolve) => {
    // Since we're importing the image directly, we can use it as is
    resolve(NcnhsLogo);
  });
};

// In onMounted, load the school logo
onMounted(async () => {
  console.log('Component mounted, loading data');
  loadMPSData();
  
  // Load school logo
  try {
    schoolLogoBase64.value = await getBase64Image();
  } catch (err) {
    console.error('Failed to load school logo:', err);
  }
  
  // Add window resize handler to redraw chart when window is resized
  window.addEventListener('resize', () => {
    if (viewMode.value === 'chart' && mpsChart.value && mpsData.value) {
      nextTick(() => {
        renderChart();
      });
    }
  });
});

// Professional PDF generation function
const downloadPDF = () => {
  if (!mpsData.value) return;

  // First switch to table view for better PDF output
  const originalView = viewMode.value;
  viewMode.value = 'table';
  
  // Wait for DOM to update
  nextTick(() => {
    // Use a small delay to ensure styles are applied
    setTimeout(() => {
      try {
        // Create a clone of the print view to work with
        const element = document.createElement('div');
        element.innerHTML = document.querySelector('.print-only').innerHTML;
        element.classList.add('pdf-container');
        
        // Apply professional styling to the cloned element
        element.style.cssText = `
          font-family: Arial, Helvetica, sans-serif;
          font-size: 10pt;
          line-height: 1.2;
          color: #000;
          background: white;
          width: 100%;
          max-width: 100%;
          padding: 10px;
          box-sizing: border-box;
          overflow: hidden;
        `;
        
        // Fix potential HTML issues - ensure all tables have proper structure
        const tables = element.querySelectorAll('table');
        tables.forEach(table => {
          // Apply professional table styling
          table.style.cssText = `
            width: 100%;
            max-width: 100%;
            border-collapse: collapse;
            font-size: 10pt;
            margin-bottom: 15px;
            border: 2px solid #000;
            table-layout: fixed;
          `;
          
          // Style table headers
          const headers = table.querySelectorAll('th');
          headers.forEach(th => {
            th.style.cssText = `
              border: 1px solid #000;
              padding: 6px 4px;
              text-align: center;
              vertical-align: middle;
              background-color: #f0f0f0;
              font-weight: bold;
              font-size: 10pt;
              color: #000;
              word-wrap: break-word;
              overflow: hidden;
            `;
          });
          
          // Style table cells
          const cells = table.querySelectorAll('td');
          cells.forEach(td => {
            td.style.cssText = `
              border: 1px solid #000;
              padding: 6px 4px;
              text-align: center;
              vertical-align: middle;
              background-color: #fff;
              color: #000;
              word-wrap: break-word;
              overflow: hidden;
            `;
          });
          
          // Style section names
          const sectionNames = table.querySelectorAll('.section-name');
          sectionNames.forEach(td => {
            td.style.cssText = `
              border: 1px solid #000;
              padding: 6px 4px;
              text-align: left;
              vertical-align: middle;
              background-color: #f8f8f8;
              color: #000;
              font-weight: bold;
              word-wrap: break-word;
              overflow: hidden;
            `;
          });
        });
        
        document.body.appendChild(element);
      
        // Setup PDF options for landscape
        const options = {
          margin: [5, 5, 5, 5],
          filename: `MPS_Report_${mpsData.value.exam.testCode}.pdf`,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: { 
            scale: 1.2, 
            useCORS: true, 
            logging: false,
            backgroundColor: '#ffffff',
            width: 1200,
            height: 800
          },
          jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'landscape'
          }
        };
        
        // Generate PDF
        html2pdf()
          .set(options)
          .from(element)
          .save()
          .then(() => {
            // Cleanup - remove the cloned element
            document.body.removeChild(element);
            // Reset view mode
            viewMode.value = originalView;
          })
          .catch(error => {
            console.error('PDF generation failed:', error);
            // Cleanup even on error
            if (document.body.contains(element)) {
              document.body.removeChild(element);
            }
            viewMode.value = originalView;
          });
      } catch (error) {
        console.error('Error preparing PDF:', error);
        viewMode.value = originalView;
      }
    }, 100);
  });
};

// Toggle AI Analysis panel
const toggleAIAnalysis = () => {
  showAIAnalysis.value = !showAIAnalysis.value;
  
  // If showing panel and no data for current tab, generate it
  if (showAIAnalysis.value && !aiResults.value[currentAITab.value]) {
    generateAnalysis(currentAITab.value);
  }
};

// Switch between AI analysis tabs
const switchAITab = (tabId) => {
  currentAITab.value = tabId;
  
  // If no data for this tab yet, generate it
  if (!aiResults.value[tabId]) {
    generateAnalysis(tabId);
  }
};

// Generate AI analysis based on the selected tab
const generateAnalysis = async (type) => {
  aiLoading.value = true;
  aiError.value = null;
  
  try {
    let result;
    
    switch (type) {
      case 'insights':
        result = await aiAnalysisService.generateAIAnalysis(mpsData.value, 'insights');
        if (result.success) {
          // Check if we got the expected array format or need to handle a different format
          const insights = result.data;
          aiResults.value.insights = Array.isArray(insights) ? insights : 
                                    (insights.rawText ? [{ title: "Raw Analysis", description: insights.rawText }] : []);
        } else {
          throw new Error(result.error || 'Failed to generate insights');
        }
        break;
        
      case 'recommendations':
        result = await aiAnalysisService.generateAIAnalysis(mpsData.value, 'recommendations');
        if (result.success) {
          // Check if we got the expected array format or need to handle a different format
          const recommendations = result.data;
          aiResults.value.recommendations = Array.isArray(recommendations) ? recommendations : 
                                          (recommendations.rawText ? [{ title: "Recommendations", description: recommendations.rawText }] : []);
        } else {
          throw new Error(result.error || 'Failed to generate recommendations');
        }
        break;
        
      case 'improvements':
        result = await aiAnalysisService.generateImprovement(mpsData.value);
        if (result.success) {
          // Handle different response formats
          if (Array.isArray(result.data)) {
            aiResults.value.improvements = result.data;
          } else if (result.data.rawText) {
            aiResults.value.improvements = [{ 
              strategy: "AI Analysis", 
              implementation: result.data.rawText, 
              expectedOutcome: "Improved student performance" 
            }];
          } else if (result.data.message) {
            aiResults.value.improvements = { message: result.data.message };
          } else if (result.data.improvements) {
            aiResults.value.improvements = result.data.improvements;
          } else {
            aiResults.value.improvements = [];
          }
        } else {
          throw new Error(result.error || 'Failed to generate improvements');
        }
        break;
        
      case 'nextSteps':
        result = await aiAnalysisService.generateNextSteps(mpsData.value);
        if (result.success) {
          // Check if we got the expected array format or need to handle a different format
          const nextSteps = result.data;
          aiResults.value.nextSteps = Array.isArray(nextSteps) ? nextSteps : 
                                    (nextSteps.rawText ? [{ title: "Next Steps", action: nextSteps.rawText, rationale: "" }] : []);
        } else {
          throw new Error(result.error || 'Failed to generate next steps');
        }
        break;
        
      case 'performers':
        // For performers, we don't need AI analysis - just use the data directly
        aiResults.value.performers = {
          topPerformers: mpsData.value.topPerformers || [],
          lowPerformers: mpsData.value.lowPerformers || []
        };
        break;
        
      case 'full':
      default:
        result = await aiAnalysisService.generateAIAnalysis(mpsData.value, 'full');
        if (result.success) {
          // Process the full analysis response
          const fullData = result.data;
          
          // Create a structured object with default values
          const processedData = {
            summary: fullData.summary || fullData.rawText || "No summary available",
            insights: [],
            sectionAnalysis: {
              topSection: null,
              bottomSection: null,
              analysis: null
            },
            recommendations: [],
            futureSuggestions: null
          };
          
          // Process insights if available
          if (fullData.insights && Array.isArray(fullData.insights)) {
            processedData.insights = fullData.insights;
          }
          
          // Process section analysis
          if (fullData.sectionAnalysis) {
            processedData.sectionAnalysis = fullData.sectionAnalysis;
          }
          
          // Process recommendations
          if (fullData.recommendations && Array.isArray(fullData.recommendations)) {
            processedData.recommendations = fullData.recommendations;
          }
          
          // Process future suggestions
          if (fullData.futureSuggestions) {
            processedData.futureSuggestions = fullData.futureSuggestions;
          }
          
          aiResults.value.full = processedData;
        } else {
          throw new Error(result.error || 'Failed to generate analysis');
        }
        break;
    }
  } catch (err) {
    console.error('AI analysis error:', err);
    aiError.value = err.message || 'Failed to generate AI analysis';
  } finally {
    aiLoading.value = false;
  }
};

// Add the useUniqueColors ref
const useUniqueColors = ref(true); // Enabled by default
</script>

<style scoped>
.mps-container {
  max-width: auto;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  overflow-y: hidden;
  overflow-x: hidden;
}

.header-container {
  position: relative;
  margin-bottom: 30px;
  overflow: hidden;
}

.header-content {
  position: relative;
  z-index: 1;
}

.header-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.header-content h1 {
  color: #159750;
  font-size: 2.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  margin: 0;
}

.header-content h1 .material-icons {
  color: #159750;
  font-size: 2.5rem;
  font-weight: 700;
  padding-left: 1%;
}

.header-background {
  position: absolute;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  font-size: 8rem;
  font-weight: 900;
  color: rgba(0, 0, 0, 0.03);
  z-index: 0;
  user-select: none;
  pointer-events: none;
}

.divider {
  height: 1px;
  background-color: #e0e0e0;
  margin: 1.5rem 0;
  width: 100%;
  max-width: auto; 
}

.subtitle {
  color: #666;
  font-size: 1.1rem;
}

.header-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-bottom: 20px;
}

.action-btn {
  padding: 10px 16px;
  border-radius: 8px;
  border: none;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
}

.print-btn {
  background-color: #e8f5e9;
  color: #2E7D32;
}

.print-btn:hover {
  background-color: #c8e6c9;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.export-btn {
  background-color: #fff3e0;
  color: #E65100;
}

.export-btn:hover {
  background-color: #ffe0b2;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Loading, Error, Empty States */
.loading-state, .error-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  text-align: center;
  margin-bottom: 2rem;
}

.loading-state .material-icons-round, 
.error-state .material-icons-round, 
.empty-state .material-icons-round {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.loading-state .material-icons-round {
  color: #159750;
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state .material-icons-round {
  color: #f44336;
}

.empty-state .material-icons-round {
  color: #9e9e9e;
}

.retry-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.3s;
}

.retry-btn:hover {
  background: #d32f2f;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.empty-subtext {
  font-size: 0.9rem;
  color: #757575;
  margin-top: 0.5rem;
}

/* MPS Data Display */
.mps-data {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Exam Info Card */
.exam-info-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.exam-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.exam-code {
  display: inline-block;
  padding: 6px 12px;
  background-color: #e8f5e9;
  color: #2e7d32;
  font-size: 0.9rem;
  font-weight: 500;
  border-radius: 20px;
  margin-bottom: 12px;
}

.exam-teacher {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 0.95rem;
  margin-bottom: 20px;
  padding: 8px 12px;
  background-color: #f5f5f5;
  border-radius: 8px;
  border-left: 3px solid #159750;
}

.exam-teacher .material-icons {
  font-size: 18px;
  color: #159750;
}

.exam-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-item {
  background: #f9f9f9;
  padding: 16px;
  border-radius: 12px;
  text-align: center;
  transition: all 0.3s;
  min-height: 110px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.stat-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.3;
}

/* Distribution Card */
.distribution-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.distribution-card h2 {
  margin: 0 0 24px 0;
  font-size: 1.3rem;
  color: #333;
}

.distribution-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dist-category {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dist-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dist-label {
  font-size: 0.95rem;
  color: #555;
}

.dist-count {
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 0.85rem;
}

.dist-bar-container {
  height: 10px;
  background-color: #f0f0f0;
  border-radius: 5px;
  overflow: hidden;
}

.dist-bar {
  height: 100%;
  border-radius: 5px;
  transition: width 1s ease-out;
}

/* View Controls */
.view-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 0;
  background: white;
  border-radius: 16px 16px 0 0;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.view-toggle-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  background: none;
  font-weight: 500;
  cursor: pointer;
  color: #666;
  border-radius: 8px;
  transition: all 0.2s;
}

.view-toggle-btn:hover {
  background-color: #f5f5f5;
}

.view-toggle-btn.active {
  background-color: #e8f5e9;
  color: #2e7d32;
}

/* Chart Container */
.chart-container {
  background: white;
  border-radius: 0 0 16px 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-top: 0;
}

.chart-container h2 {
  font-size: 1.2rem;
  color: #333;
  margin-bottom: 1rem;
}

.chart-wrapper {
  height: 400px;
  position: relative;
}

/* Table View */
.table-view {
  background: white;
  border-radius: 0 0 16px 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-top: -12px;
}

.table-container {
  width: 100%;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
}

th, td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

th {
  font-weight: 600;
  color: #333;
  background-color: #f9f9f9;
  position: sticky;
  top: 0;
  z-index: 1;
}

.section-cell {
  font-weight: 600;
  min-width: 100px;
}

.mps-cell {
  font-size: 1.1rem;
}

.distribution-badges {
  display: flex;
  gap: 8px;
}

.badge {
  display: inline-block;
  min-width: 24px;
  padding: 2px 4px;
  text-align: center;
  font-weight: 600;
  font-size: 0.85rem;
  border-radius: 4px;
}

.performance-bar-container {
  width: 100%;
  background-color: #f0f0f0;
  height: 10px;
  border-radius: 5px;
  overflow: hidden;
}

.performance-bar {
  height: 100%;
  border-radius: 5px;
}

.distribution-legend {
  display: flex;
  gap: 6px;
  margin-top: 4px;
}

.legend-item {
  display: inline-block;
  width: 20px;
  height: 20px;
  text-align: center;
  line-height: 20px;
  font-size: 0.7rem;
  font-weight: 600;
  border-radius: 4px;
}

/* Color Classes */
.excellent {
  color: #2E7D32;
}
.good {
  color: #1565C0;
}
.satisfactory {
  color: #FFA000;
}
.fair {
  color: #F57C00;
}
.needs-improvement {
  color: #D32F2F;
}

.excellent .dist-count, .badge.excellent, .legend-item.excellent {
  background-color: rgba(46, 125, 50, 0.1);
  color: #2E7D32;
}
.good .dist-count, .badge.good, .legend-item.good {
  background-color: rgba(21, 101, 192, 0.1);
  color: #1565C0;
}
.satisfactory .dist-count, .badge.satisfactory, .legend-item.satisfactory {
  background-color: rgba(255, 160, 0, 0.1);
  color: #FFA000;
}
.fair .dist-count, .badge.fair, .legend-item.fair {
  background-color: rgba(245, 124, 0, 0.1);
  color: #F57C00;
}
.needs-improvement .dist-count, .badge.needs-improvement, .legend-item.needs-improvement {
  background-color: rgba(211, 47, 47, 0.1);
  color: #D32F2F;
}

.excellent .dist-bar {
  background-color: #4CAF50;
}
.good .dist-bar {
  background-color: #2196F3;
}
.satisfactory .dist-bar {
  background-color: #FFC107;
}
.fair .dist-bar {
  background-color: #FF9800;
}
.needs-improvement .dist-bar {
  background-color: #F44336;
}

/* Back button */
.back-btn {
  background-color: #f5f5f5;
  color: #333;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.back-btn:hover {
  background-color: #e0e0e0;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.back-btn .material-icons {
  font-size: 18px;
}

/* Professional Print Styles */
@media print {
  /* Hide non-printable elements */
  .header-container, .header-actions, .view-controls, 
  .settings-card, .chart-container, .table-view,
  .exam-info-card, .distribution-card, .back-btn,
  .ai-analysis-panel {
    display: none !important;
  }
  
  /* Show print-only elements */
  .print-only {
    display: block !important;
    width: 100%;
    max-width: 100%;
  }
  
  body {
    margin: 0;
    padding: 0;
    font-family: 'Arial', 'Helvetica', sans-serif;
    background: white;
    color: #000;
    font-size: 10pt;
    line-height: 1.2;
  }
  
  /* Page setup for landscape */
  @page {
    size: A4 landscape;
    margin: 0.5cm;
  }
  
  .print-header {
    text-align: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 2px solid #000;
  }
  
  .print-title h1 {
    font-size: 16pt;
    font-weight: bold;
    margin: 0 0 5px 0;
    color: #000;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  
  .print-title h2 {
    font-size: 12pt;
    font-weight: normal;
    margin: 0 0 15px 0;
    color: #000;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .print-exam-info {
    display: flex;
    justify-content: center;
    font-size: 11pt;
    gap: 30px;
    margin-top: 10px;
  }
  
  .print-exam-info p {
    margin: 0;
    color: #000;
  }
  
  .print-summary, .print-distribution, .print-details {
    margin-bottom: 15px;
  }
  
  /* Professional table styling */
  .summary-table, .distribution-table, .details-table {
    width: 100%;
    max-width: 100%;
    border-collapse: collapse;
    font-size: 10pt;
    margin-bottom: 15px;
    border: 2px solid #000;
    table-layout: fixed;
  }
  
  .summary-table th, .summary-table td,
  .distribution-table th, .distribution-table td,
  .details-table th, .details-table td {
    border: 1px solid #000;
    padding: 6px 4px;
    text-align: center;
    vertical-align: middle;
    word-wrap: break-word;
    overflow: hidden;
  }
  
  .summary-table th, .distribution-table th, .details-table th {
    background-color: #f0f0f0 !important;
    font-weight: bold;
    font-size: 10pt;
    color: #000;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  .summary-table td, .distribution-table td, .details-table td {
    background-color: #fff !important;
    color: #000;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  /* Section name styling */
  .section-name {
    text-align: left !important;
    font-weight: bold;
    background-color: #f8f8f8 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  .center {
    text-align: center;
  }
  
  /* Table headers repeat on page breaks */
  .summary-table thead, .distribution-table thead, .details-table thead {
    display: table-header-group;
  }
  
  .summary-table tbody, .distribution-table tbody, .details-table tbody {
    display: table-row-group;
  }
  
  /* Prevent row breaks */
  tr {
    page-break-inside: avoid;
  }
  
  /* Footer styling */
  .print-footer {
    margin-top: 20px;
    padding-top: 10px;
    border-top: 1px solid #000;
    font-size: 10pt;
    color: #000;
    text-align: center;
  }
  
  .print-footer p {
    margin: 2px 0;
  }
}

.print-only {
  display: none;
  padding: 20px;
}

/* High DPI and Zoom levels (125%, 150%) for laptops */
@media screen and (max-width: 1536px) and (min-width: 1025px) {
  .mps-container {
    padding: 16px;
  }
  
  .header-content h1 {
    font-size: 2.2rem;
  }
  
  .header-content h1 .material-icons {
    font-size: 2.2rem;
  }
  
  .header-background {
    font-size: 7rem;
    right: 2rem;
  }
  
  .subtitle {
    font-size: 1rem;
  }
  
  .divider {
    margin: 1.2rem 0;
  }
  
  .header-actions {
    gap: 10px;
    margin-bottom: 18px;
  }
  
  .action-btn {
    padding: 8px 14px;
    font-size: 0.9rem;
    gap: 6px;
  }
  
  .exam-info-card {
    padding: 20px;
    border-radius: 14px;
  }
  
  .exam-title {
    font-size: 1.4rem;
    margin-bottom: 6px;
  }
  
  .exam-code {
    font-size: 0.85rem;
    padding: 5px 10px;
    margin-bottom: 16px;
  }
  
  .exam-stats {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 14px;
  }
  
  .stat-item {
    padding: 14px;
    min-height: 95px;
  }
  
  .stat-label {
    font-size: 0.85rem;
    margin-bottom: 6px;
  }
  
  .stat-value {
    font-size: 1.4rem;
  }
  
  .distribution-card {
    padding: 20px;
    border-radius: 14px;
  }
  
  .distribution-card h2 {
    font-size: 1.2rem;
    margin-bottom: 20px;
  }
  
  .distribution-grid {
    gap: 14px;
  }
  
  .dist-label {
    font-size: 0.9rem;
  }
  
  .view-controls {
    padding: 14px 20px;
    border-radius: 14px 14px 0 0;
  }
  
  .view-toggle-btn {
    padding: 8px 16px;
    gap: 6px;
    font-size: 0.9rem;
  }
  
  .chart-container {
    padding: 20px;
    border-radius: 0 0 14px 14px;
  }
  
  .chart-container h2 {
    font-size: 1.1rem;
    margin-bottom: 0.8rem;
  }
  
  .chart-wrapper {
    height: 350px;
  }
  
  .table-view {
    padding: 20px;
  }
  
  th, td {
    padding: 14px;
  }
  
  .settings-card {
    margin: 16px 0;
    border-radius: 14px;
  }
  
  .card-header {
    padding: 14px 20px;
  }
  
  .card-header h2 {
    font-size: 1.1rem;
  }
  
  .settings-content {
    padding: 16px 20px;
  }
  
  .ai-analysis-panel {
    margin: 20px 0;
    border-radius: 14px;
  }
  
  .ai-analysis-panel .card-header {
    padding: 14px 20px;
  }
  
  .ai-analysis-panel .card-header h2 {
    font-size: 1.1rem;
  }
  
  .ai-panel-content {
    padding: 20px;
    min-height: 350px;
  }
  
  .ai-tab {
    padding: 10px 14px;
    font-size: 0.85rem;
  }
}

/* Compact layout for 14-inch laptops and lower resolutions */
@media screen and (max-width: 1366px) and (min-width: 1025px) {
  .mps-container {
    padding: 14px;
  }
  
  .header-content h1 {
    font-size: 2rem;
  }
  
  .header-content h1 .material-icons {
    font-size: 2rem;
  }
  
  .header-background {
    font-size: 6rem;
    right: 1.5rem;
  }
  
  .subtitle {
    font-size: 0.95rem;
  }
  
  .divider {
    margin: 1rem 0;
  }
  
  .header-actions {
    gap: 8px;
    margin-bottom: 16px;
  }
  
  .action-btn {
    padding: 6px 12px;
    font-size: 0.85rem;
    gap: 5px;
  }
  
  .exam-info-card {
    padding: 18px;
    border-radius: 12px;
  }
  
  .exam-title {
    font-size: 1.3rem;
    margin-bottom: 5px;
  }
  
  .exam-code {
    font-size: 0.8rem;
    padding: 4px 8px;
    margin-bottom: 10px;
  }
  
  .exam-teacher {
    font-size: 0.9rem;
    padding: 6px 10px;
    margin-bottom: 16px;
  }
  
  .exam-teacher .material-icons {
    font-size: 16px;
  }
  
  .exam-stats {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 12px;
  }
  
  .stat-item {
    padding: 12px;
    min-height: 85px;
  }
  
  .stat-label {
    font-size: 0.8rem;
    margin-bottom: 5px;
  }
  
  .stat-value {
    font-size: 1.3rem;
  }
  
  .distribution-card {
    padding: 18px;
    border-radius: 12px;
  }
  
  .distribution-card h2 {
    font-size: 1.1rem;
    margin-bottom: 18px;
  }
  
  .distribution-grid {
    gap: 12px;
  }
  
  .dist-label {
    font-size: 0.85rem;
  }
  
  .view-controls {
    padding: 12px 18px;
    border-radius: 12px 12px 0 0;
  }
  
  .view-toggle-btn {
    padding: 6px 14px;
    gap: 5px;
    font-size: 0.85rem;
  }
  
  .chart-container {
    padding: 18px;
    border-radius: 0 0 12px 12px;
  }
  
  .chart-container h2 {
    font-size: 1rem;
    margin-bottom: 0.6rem;
  }
  
  .chart-wrapper {
    height: 320px;
  }
  
  .table-view {
    padding: 18px;
  }
  
  th, td {
    padding: 12px;
  }
  
  .settings-card {
    margin: 14px 0;
    border-radius: 12px;
  }
  
  .card-header {
    padding: 12px 18px;
  }
  
  .card-header h2 {
    font-size: 1rem;
  }
  
  .settings-content {
    padding: 14px 18px;
  }
  
  .chart-type-buttons {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 8px;
  }
  
  .chart-type-btn {
    padding: 8px;
  }
  
  .ai-analysis-panel {
    margin: 18px 0;
    border-radius: 12px;
  }
  
  .ai-analysis-panel .card-header {
    padding: 12px 18px;
  }
  
  .ai-analysis-panel .card-header h2 {
    font-size: 1rem;
  }
  
  .ai-panel-content {
    padding: 18px;
    min-height: 320px;
  }
  
  .ai-tab {
    padding: 8px 12px;
    font-size: 0.8rem;
  }
  
  .ai-result h3 {
    font-size: 1rem;
    margin-bottom: 12px;
  }
  
  .insight-item, .rec-item, .improvement-item {
    padding: 14px;
  }
  
  .insight-title, .rec-title, .improvement-strategy {
    font-size: 1rem;
  }
}

/* Very high zoom levels (150%+) or very compact displays */
@media screen and (max-width: 1280px) and (min-width: 1025px) {
  .mps-container {
    padding: 12px;
  }
  
  .header-content h1 {
    font-size: 1.8rem;
  }
  
  .header-content h1 .material-icons {
    font-size: 1.8rem;
  }
  
  .header-background {
    font-size: 5rem;
    right: 1rem;
  }
  
  .subtitle {
    font-size: 0.9rem;
  }
  
  .divider {
    margin: 0.8rem 0;
  }
  
  .header-actions {
    gap: 6px;
    margin-bottom: 14px;
  }
  
  .action-btn {
    padding: 5px 10px;
    font-size: 0.8rem;
    gap: 4px;
  }
  
  .exam-info-card {
    padding: 16px;
    border-radius: 10px;
  }
  
  .exam-title {
    font-size: 1.2rem;
    margin-bottom: 4px;
  }
  
  .exam-code {
    font-size: 0.75rem;
    padding: 3px 6px;
    margin-bottom: 8px;
  }
  
  .exam-teacher {
    font-size: 0.85rem;
    padding: 5px 8px;
    margin-bottom: 12px;
  }
  
  .exam-teacher .material-icons {
    font-size: 14px;
  }
  
  .exam-stats {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 10px;
  }
  
  .stat-item {
    padding: 10px;
    min-height: 75px;
  }
  
  .stat-label {
    font-size: 0.75rem;
    margin-bottom: 4px;
  }
  
  .stat-value {
    font-size: 1.2rem;
  }
  
  .distribution-card {
    padding: 16px;
    border-radius: 10px;
  }
  
  .distribution-card h2 {
    font-size: 1rem;
    margin-bottom: 16px;
  }
  
  .distribution-grid {
    gap: 10px;
  }
  
  .dist-label {
    font-size: 0.8rem;
  }
  
  .dist-count {
    font-size: 0.8rem;
    padding: 1px 8px;
  }
  
  .view-controls {
    padding: 10px 16px;
    border-radius: 10px 10px 0 0;
  }
  
  .view-toggle-btn {
    padding: 5px 12px;
    gap: 4px;
    font-size: 0.8rem;
  }
  
  .chart-container {
    padding: 16px;
    border-radius: 0 0 10px 10px;
  }
  
  .chart-container h2 {
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
  }
  
  .chart-wrapper {
    height: 280px;
  }
  
  .table-view {
    padding: 16px;
  }
  
  th, td {
    padding: 10px;
  }
  
  .section-cell {
    min-width: 80px;
  }
  
  .mps-cell {
    font-size: 1rem;
  }
  
  .badge {
    min-width: 20px;
    padding: 1px 3px;
    font-size: 0.8rem;
  }
  
  .settings-card {
    margin: 12px 0;
    border-radius: 10px;
  }
  
  .card-header {
    padding: 10px 16px;
  }
  
  .card-header h2 {
    font-size: 0.9rem;
  }
  
  .settings-content {
    padding: 12px 16px;
  }
  
  .settings-section {
    margin-bottom: 16px;
  }
  
  .settings-section h3 {
    font-size: 0.9rem;
    margin-bottom: 10px;
  }
  
  .chart-type-buttons {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 6px;
  }
  
  .chart-type-btn {
    padding: 6px;
    border-radius: 6px;
  }
  
  .btn-label {
    font-size: 0.8rem;
  }
  
  .theme-select {
    padding: 6px 8px;
    font-size: 0.85rem;
  }
  
  .options-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 8px;
  }
  
  .toggle-option label {
    font-size: 0.85rem;
  }
  
  .ai-analysis-panel {
    margin: 16px 0;
    border-radius: 10px;
  }
  
  .ai-analysis-panel .card-header {
    padding: 10px 16px;
  }
  
  .ai-analysis-panel .card-header h2 {
    font-size: 0.9rem;
  }
  
  .ai-panel-content {
    padding: 16px;
    min-height: 280px;
  }
  
  .ai-tabs {
    padding: 0 16px;
  }
  
  .ai-tab {
    padding: 6px 10px;
    font-size: 0.75rem;
    gap: 4px;
  }
  
  .ai-loading, .ai-error, .ai-empty {
    padding: 2rem;
    height: 250px;
  }
  
  .ai-loading .material-icons,
  .ai-error .material-icons,
  .ai-empty .material-icons {
    font-size: 2.5rem;
    margin-bottom: 15px;
  }
  
  .ai-loading p {
    font-size: 1.1rem;
  }
  
  .ai-loading-subtitle {
    font-size: 0.8rem !important;
  }
  
  .ai-result {
    gap: 20px;
  }
  
  .ai-result h3 {
    font-size: 0.9rem;
    margin-bottom: 10px;
  }
  
  .ai-summary-card {
    padding: 16px;
    border-radius: 10px;
  }
  
  .ai-summary-card p {
    font-size: 0.9rem;
  }
  
  .insight-item, .rec-item, .improvement-item {
    padding: 12px;
    border-radius: 10px;
  }
  
  .insight-title, .rec-title, .improvement-strategy {
    font-size: 0.9rem;
    margin-bottom: 6px;
  }
  
  .insight-desc, .rec-desc, 
  .improvement-implementation, .improvement-outcome {
    font-size: 0.85rem;
    margin-bottom: 6px;
  }
  
  .section-comparison {
    padding: 12px;
    border-radius: 10px;
  }
  
  .section-header {
    font-size: 0.9rem;
  }
  
  .section-analysis-text {
    margin-top: 12px;
    padding-top: 12px;
    font-size: 0.85rem;
  }
  
  .next-step-item {
    padding: 12px;
    gap: 12px;
    border-radius: 10px;
  }
  
  .step-number {
    width: 28px;
    height: 28px;
    font-size: 0.9rem;
  }
  
  .step-title {
    font-size: 0.9rem;
    margin-bottom: 6px;
  }
  
  .step-action, .step-rationale {
    font-size: 0.85rem;
    margin-bottom: 6px;
  }
  
  .generate-btn {
    padding: 8px 20px;
    font-size: 0.9rem;
  }
  
  .back-btn {
    padding: 8px 12px;
    font-size: 0.85rem;
    gap: 6px;
  }
  
  .back-btn .material-icons {
    font-size: 16px;
  }
}

/* Responsive Styles */
@media (max-width: 768px) {
  .mps-container {
    padding: 10px 5px;
  }
  
  .header-background {
    font-size: 4rem;
    top: 60%;
    right: 1rem;
  }
  
  .header-content h1 {
    font-size: 2rem;
  }
  
  .header-content h1 .material-icons {
    font-size: 2rem;
  }
  
  .header-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .back-btn {
    align-self: flex-start;
  }
  
  .exam-stats {
    grid-template-columns: 1fr;
  }
  
  .view-controls {
    flex-wrap: wrap;
  }
  
  .chart-wrapper {
    height: 300px;
  }
  
  .distribution-badges {
    gap: 4px;
  }
  
  .badge {
    min-width: 20px;
    font-size: 0.75rem;
    padding: 2px;
  }
  
  .header-actions {
    flex-direction: column;
    align-items: stretch;
  }
}

/* Chart Settings Card - replacing previous chart-settings-panel styles */
.settings-card {
  background: white;
  border-radius: 16px;
  margin: 20px 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.card-header {
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  background-color: #f9f9f9;
}

.card-header h2 {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.2rem;
  color: #333;
  margin: 0;
}

.card-header .material-icons {
  color: #159750;
}

.settings-content {
  padding: 20px 24px;
}

.settings-section {
  margin-bottom: 20px;
}

.settings-section h3 {
  font-size: 1rem;
  color: #555;
  margin: 0 0 12px 0;
  font-weight: 500;
}

.chart-type-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
  margin-bottom: 10px;
}

.chart-type-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: #f5f5f5;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: #555;
}

.chart-type-btn:hover {
  background: #e0e0e0;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
}

.chart-type-btn.active {
  background-color: #e8f5e9;
  color: #2e7d32;
  font-weight: 500;
}

.btn-label {
  font-size: 0.9rem;
}

.divider {
  height: 1px;
  background-color: #f0f0f0;
  margin: 20px 0;
}

.appearance-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.theme-selector {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.theme-selector label {
  font-size: 0.9rem;
  color: #666;
}

.theme-select {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #ddd;
  background: white;
  font-size: 0.95rem;
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
  margin-top: 10px;
}

.toggle-option {
  display: flex;
  align-items: center;
}

.toggle-option label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  color: #555;
}

.toggle-option input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #159750;
}

/* Responsive design adjustments */
@media (max-width: 768px) {
  .chart-type-buttons {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
  
  .options-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .toggle-option label {
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .chart-type-buttons {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .btn-label {
    font-size: 0.8rem;
  }
  
  .options-grid {
    grid-template-columns: 1fr;
  }
}

.option-help {
  font-size: 0.8rem;
  color: #666;
  margin-top: 4px;
  margin-left: 26px;
  font-style: italic;
}

/* PDF Button and Container Styles */
.pdf-btn {
  background-color: #e8eaf6;
  color: #3f51b5;
}

.pdf-btn:hover {
  background-color: #c5cae9;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.pdf-container {
  position: absolute;
  top: -9999px;
  left: -9999px;
  width: 297mm; /* A4 landscape width */
  padding: 20px;
  background-color: white;
}

/* AI Analysis Button */
.ai-btn {
  background-color: #e8f0fe;
  color: #1a73e8;
}

.ai-btn:hover {
  background-color: #d2e3fc;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* AI Analysis Panel */
.ai-analysis-panel {
  background: white;
  border-radius: 16px;
  margin: 24px 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  position: relative;
}

.ai-analysis-panel .card-header {
  padding: 16px 24px;
  background-color: #f9f9f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ai-analysis-panel .card-header h2 {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.2rem;
  color: #333;
  margin: 0;
}

.ai-analysis-panel .card-header .material-icons {
  color: #1a73e8;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  padding: 4px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background-color: rgba(0, 0, 0, 0.1);
  color: #333;
}

.ai-content {
  padding: 0;
}

.ai-tabs {
  display: flex;
  overflow-x: auto;
  gap: 2px;
  padding: 0 24px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #f0f0f0;
}

.ai-tab {
  padding: 12px 16px;
  border: none;
  background: none;
  font-weight: 500;
  font-size: 0.9rem;
  color: #666;
  cursor: pointer;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.ai-tab:hover {
  color: #1a73e8;
  background-color: rgba(26, 115, 232, 0.05);
}

.ai-tab.active {
  color: #1a73e8;
  border-bottom: 2px solid #1a73e8;
}

.ai-panel-content {
  padding: 24px;
  min-height: 400px;
}

/* AI Loading State */
.ai-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  height: 300px;
}

.ai-loading-animation {
  margin-bottom: 20px;
}

.ai-loading .material-icons {
  font-size: 3rem;
  color: #1a73e8;
}

@keyframes brain-pulse {
  0% { transform: scale(0.95); opacity: 0.7; }
  50% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.7; }
}

.ai-loading .rotating {
  animation: rotate 2s linear infinite, brain-pulse 1.5s ease-in-out infinite;
}

.ai-loading p {
  font-size: 1.2rem;
  color: #333;
  margin: 0;
}

.ai-loading-subtitle {
  font-size: 0.9rem !important;
  color: #666 !important;
  margin-top: 8px !important;
}

/* AI Error State */
.ai-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  height: 300px;
}

.ai-error .material-icons {
  font-size: 3rem;
  color: #f44336;
  margin-bottom: 20px;
}

.ai-error p {
  font-size: 1.1rem;
  color: #666;
  margin: 0 0 20px 0;
  max-width: 400px;
}

/* AI Empty State */
.ai-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  height: 300px;
}

.ai-empty .material-icons {
  font-size: 3rem;
  color: #9e9e9e;
  margin-bottom: 20px;
}

.ai-empty p {
  font-size: 1.1rem;
  color: #666;
  margin: 0 0 20px 0;
  max-width: 400px;
}

.generate-btn {
  padding: 10px 24px;
  background-color: #1a73e8;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 10px;
}

.generate-btn:hover {
  background-color: #0d62c9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(26, 115, 232, 0.3);
}

/* AI Result Styles */
.ai-result {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.ai-result h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.1rem;
  color: #333;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.ai-result h3 .material-icons {
  color: #1a73e8;
  font-size: 1.2rem;
}

/* Summary Card */
.ai-summary-card {
  background-color: #f9f9f9;
  border-radius: 12px;
  padding: 20px;
  position: relative;
}

.ai-summary-card p {
  margin: 0;
  line-height: 1.6;
  font-size: 1rem;
  color: #333;
}

/* Insights */
.insights-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.insight-item {
  background-color: #f0f7ff;
  border-radius: 12px;
  padding: 16px;
  border-left: 4px solid #1a73e8;
}

.insight-title {
  font-weight: 600;
  font-size: 1.05rem;
  color: #1a73e8;
  margin-bottom: 8px;
}

.insight-desc {
  color: #444;
  line-height: 1.5;
}

/* Section Analysis */
.section-comparison {
  background-color: #f9f9f9;
  border-radius: 12px;
  padding: 16px;
}

.top-section, .bottom-section {
  margin-bottom: 12px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
}

.top-section .section-header {
  color: #2E7D32;
}

.top-section .section-header .material-icons {
  color: #2E7D32;
}

.bottom-section .section-header {
  color: #C62828;
}

.bottom-section .section-header .material-icons {
  color: #C62828;
}

.section-analysis-text {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
  line-height: 1.5;
  color: #444;
}

/* Recommendations */
.recommendations-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.rec-item {
  background-color: #f1f8e9;
  border-radius: 12px;
  padding: 16px;
  border-left: 4px solid #558b2f;
}

.rec-title {
  font-weight: 600;
  font-size: 1.05rem;
  color: #558b2f;
  margin-bottom: 8px;
}

.rec-desc {
  color: #444;
  line-height: 1.5;
}

/* Message displays */
.no-data-message {
  color: #666;
  font-style: italic;
  background-color: #f5f5f5;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
  margin: 0;
}

.message-card {
  background-color: #fff8e1;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 8px;
}

.message-card p {
  margin: 0;
  color: #333;
  line-height: 1.5;
}

/* Future Suggestions */
.ai-future {
  background-color: #f9f9f9;
  border-radius: 12px;
  padding: 20px;
}

.ai-future p {
  margin: 0;
  line-height: 1.6;
  color: #333;
}

/* Improvement Strategies */
.improvements-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.improvement-item {
  background-color: #fff8e1;
  border-radius: 12px;
  padding: 16px;
  border-left: 4px solid #ffa000;
}

.improvement-strategy {
  font-weight: 600;
  font-size: 1.05rem;
  color: #f57c00;
  margin-bottom: 12px;
}

.improvement-implementation, .improvement-outcome {
  margin-bottom: 8px;
  line-height: 1.5;
  color: #444;
}

/* Next Steps */
.next-steps-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.next-step-item {
  display: flex;
  gap: 16px;
  background-color: #e8f5e9;
  border-radius: 12px;
  padding: 16px;
}

.step-number {
  width: 32px;
  height: 32px;
  background-color: #2e7d32;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-title {
  font-weight: 600;
  font-size: 1.05rem;
  color: #2e7d32;
  margin-bottom: 8px;
}

.step-action, .step-rationale {
  margin-bottom: 8px;
  line-height: 1.5;
  color: #444;
}

/* Responsive styles for AI panel */
@media (max-width: 768px) {
  .ai-tabs {
    padding: 0;
    gap: 0;
  }
  
  .ai-tab {
    padding: 10px 12px;
    font-size: 0.8rem;
  }
  
  .ai-tab .material-icons {
    font-size: 16px;
  }
  
  .ai-panel-content {
    padding: 16px;
  }
  
  .insight-item, .rec-item, .improvement-item, .next-step-item {
    padding: 12px;
  }
}

/* Performers Analysis Styles */
.performers-analysis, .ai-performers {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.ai-performers {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e0e0e0;
}

.performers-section {
  background-color: #f9f9f9;
  border-radius: 12px;
  padding: 20px;
}

.performers-section h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.1rem;
  color: #333;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #e0e0e0;
}

.performers-section h4 .material-icons {
  font-size: 1.2rem;
}

.top-performers h4 {
  color: #2E7D32;
}

.top-performers h4 .material-icons {
  color: #2E7D32;
}

.low-performers h4 {
  color: #C62828;
}

.low-performers h4 .material-icons {
  color: #C62828;
}

.performers-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.performer-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
}

.performer-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.performer-item.top {
  border-left: 4px solid #4CAF50;
}

.performer-item.low {
  border-left: 4px solid #F44336;
}

.performer-rank {
  width: 32px;
  height: 32px;
  background-color: #e0e0e0;
  color: #666;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.performer-item.top .performer-rank {
  background-color: #4CAF50;
  color: white;
}

.performer-item.low .performer-rank {
  background-color: #F44336;
  color: white;
}

.performer-info {
  flex: 1;
}

.performer-name {
  font-weight: 600;
  font-size: 1.05rem;
  color: #333;
  margin-bottom: 4px;
}

.performer-details {
  display: flex;
  gap: 16px;
  font-size: 0.9rem;
  color: #666;
}

.performer-section {
  background-color: #f0f0f0;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
}

.performer-score {
  font-weight: 500;
}

.performer-badge {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.performer-badge.excellent {
  background-color: rgba(76, 175, 80, 0.1);
  color: #4CAF50;
}

.performer-badge.needs-improvement {
  background-color: rgba(244, 67, 54, 0.1);
  color: #F44336;
}

.performer-badge .material-icons {
  font-size: 20px;
}

.performance-insights {
  background-color: #f0f7ff;
  border-radius: 12px;
  padding: 20px;
  border-left: 4px solid #1a73e8;
}

.performance-insights h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.1rem;
  color: #1a73e8;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #e0e0e0;
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.insight-card {
  background: white;
  padding: 16px;
  border-radius: 10px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.insight-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1a73e8;
  margin-bottom: 4px;
}

.insight-label {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.insight-desc {
  font-size: 0.85rem;
  color: #666;
  line-height: 1.3;
}

/* Responsive styles for performers */
@media (max-width: 768px) {
  .performer-item {
    padding: 12px;
    gap: 12px;
  }
  
  .performer-rank {
    width: 28px;
    height: 28px;
    font-size: 0.8rem;
  }
  
  .performer-name {
    font-size: 1rem;
  }
  
  .performer-details {
    flex-direction: column;
    gap: 4px;
  }
  
  .performer-badge {
    width: 32px;
    height: 32px;
  }
  
  .performer-badge .material-icons {
    font-size: 16px;
  }
  
  .insights-grid {
    grid-template-columns: 1fr;
  }
  
  .ai-performers {
    margin-top: 20px;
    padding-top: 20px;
  }
}

/* Print styles for AI analysis */
@media print {
  .ai-analysis-panel {
    break-before: page;
    box-shadow: none;
    border: 1px solid #ddd;
  }
  
  .ai-tabs, .close-btn, .generate-btn {
    display: none;
  }
  
  .ai-panel-content {
    padding: 0;
  }
  
  .ai-result {
    gap: 16px;
    padding: 16px;
  }
  
  .insight-item, .rec-item, .improvement-item, .next-step-item {
    break-inside: avoid;
  }
  
  .performer-item {
    break-inside: avoid;
    box-shadow: none;
    border: 1px solid #ddd;
  }
}
</style> 