const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, 'src/app/intelligence/page.tsx');
let pageContent = fs.readFileSync(pagePath, 'utf8');

const startMarker = "{/* Static Today's Challenge Summary Card */}";
const startIndex = pageContent.indexOf(startMarker);

// The end of the inline section is right before `{/* SLIDE OUT PANEL OVERLAY for Challenge */}`
// But wait, there are closing tags before it.
// Let's just find `})()}` after `Static Today's Challenge Summary Card` and the `</div>` after it!
const endMarker = "})()}";
let endIndex = pageContent.indexOf(endMarker, startIndex);
if (endIndex !== -1) {
  // skip `})()}`
  endIndex += 5;
  // then there's `</div>` or something. Let's just replace up to `})()}`
  
  const replacement = `{/* Static Today's Challenge Summary Card */}
                    {(() => {
                      const todayInfo = challengeData.days.find((d: any) => d.status === 'today') || challengeData.days.find((d: any) => d.day === challengeData.currentDay);
                      if (!todayInfo) return null;
                      const isComplete = todayInfo.progress.tasksDone === todayInfo.progress.tasksTotal;

                      return (
                        <div className={styles.challengeDetailCard} style={{
                          marginTop: '24px',
                          padding: '24px 32px',
                          background: '#F8FAFC',
                          borderRadius: '16px',
                          border: '1px solid #E2E8F0',
                          position: 'relative',
                          cursor: 'pointer'
                        }} onClick={() => setSelectedChallengeDay(todayInfo.day)}>
                          <div style={{marginBottom: '12px'}}>
                            <h4 style={{fontSize: '16px', fontWeight: '700', color: '#0F172A', margin: 0}}>
                              Today's Focus: <span style={{color: '#2563EB'}}>{todayInfo.title}</span>
                            </h4>
                          </div>
                          
                          <p style={{fontSize: '14px', color: '#475569', marginBottom: '24px'}}>{todayInfo.desc}</p>
                          
                          <div style={{fontSize: '12px', fontWeight: '700', color: '#64748B', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                            TASKS PROGRESS ({todayInfo.progress.tasksDone} / {todayInfo.progress.tasksTotal})
                          </div>
                          <ul style={{listStyle: 'none', padding: 0, margin: '0 0 24px 0'}}>
                            {todayInfo.tasks.map((t: any, idx: number) => (
                              <li key={idx} style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', fontSize: '14px', color: '#334155'}}>
                                {t.done ? (
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                ) : (
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle></svg>
                                )}
                                <span style={{textDecoration: t.done ? 'line-through' : 'none', opacity: t.done ? 0.7 : 1}}>{t.name}</span>
                              </li>
                            ))}
                          </ul>
                          
                          <button onClick={(e) => { e.stopPropagation(); setSelectedChallengeDay(todayInfo.day); }} style={{
                            position: 'absolute',
                            bottom: '24px',
                            right: '32px',
                            background: 'transparent',
                            color: '#2563EB',
                            border: '1px solid #BFDBFE',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            fontWeight: '600',
                            fontSize: '14px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'background 0.2s'
                          }}>
                            {isComplete ? "Challenge Completed ✓" : "Start Today's Challenge"}
                            {!isComplete && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="5 12 19 12"></polyline><polyline points="12 5 19 12 12 19"></polyline></svg>}
                          </button>
                        </div>
                      );
                    })()}`;
  pageContent = pageContent.substring(0, startIndex) + replacement + pageContent.substring(endIndex);
  fs.writeFileSync(pagePath, pageContent);
  console.log("Replaced inline logic.");
} else {
  console.log("Could not find inline markers.");
}
