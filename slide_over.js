const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, 'src/app/intelligence/page.tsx');
let pageContent = fs.readFileSync(pagePath, 'utf8');

// 1. Remove the inline challenge detail card
const inlineDetailRegex = /\{\/\* Dynamic Challenge Detail Panel \*\/\}\s*\{selectedChallengeDay !== null && \([\s\S]*?<\/>\s*\)\s*\}\s*<\/div>\s*\);\s*\}\)\(\)\}\s*<\/div>\s*\)\}/;
pageContent = pageContent.replace(inlineDetailRegex, '');

// 2. Inject the slide-over panel for the challenge at the end, just before </main>
const slideOverPanelHtml = `
          {/* SLIDE OUT PANEL OVERLAY for Challenge */}
          {selectedChallengeDay !== null && challengeData && (
            <>
              <div className={styles.panelOverlay} onClick={() => setSelectedChallengeDay(null)}></div>
              <div className={styles.detailPanel} style={{width: '420px', maxWidth: '100%', padding: '24px', display: 'flex', flexDirection: 'column'}}>
                <button className={styles.panelClose} onClick={() => setSelectedChallengeDay(null)}>&times;</button>
                
                {(() => {
                  const dayInfo = challengeData.days.find((d: any) => d.day === selectedChallengeDay);
                  if (!dayInfo) return null;
                  
                  const isCompleted = dayInfo.progress.tasksDone === dayInfo.progress.tasksTotal;
                  const task1 = dayInfo.tasks[0];
                  const task2 = dayInfo.tasks[1];

                  return (
                    <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
                      {/* Header */}
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px'}}>
                        <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
                          <div style={{background: '#EFF6FF', color: '#2563EB', padding: '12px', borderRadius: '12px'}}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                          </div>
                          <div>
                            <h2 style={{fontSize: '20px', fontWeight: '700', color: '#0F172A', margin: 0}}>Today's Challenge</h2>
                            <p style={{fontSize: '14px', color: '#64748B', margin: '4px 0 0 0'}}>Day {dayInfo.day} of 7</p>
                          </div>
                        </div>
                        <div style={{background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '6px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px'}}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                          <span style={{fontSize: '12px', fontWeight: '600', color: '#0F172A'}}>{new Date(dayInfo.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}</span>
                        </div>
                      </div>

                      {/* Today's Focus Card */}
                      <div style={{background: 'linear-gradient(135deg, #F0FDF4 0%, #F0F9FF 100%)', borderRadius: '16px', padding: '20px', marginBottom: '24px', border: '1px solid #E2E8F0'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
                          <div style={{background: '#D1FAE5', color: '#059669', borderRadius: '50%', padding: '6px'}}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
                          </div>
                          <span style={{fontSize: '13px', fontWeight: '700', color: '#0F172A'}}>Today's Focus</span>
                        </div>
                        <h3 style={{fontSize: '18px', fontWeight: '700', color: '#2563EB', margin: '0 0 8px 0'}}>{dayInfo.title}</h3>
                        <p style={{fontSize: '14px', color: '#475569', margin: '0 0 16px 0', lineHeight: 1.5}}>{dayInfo.desc}</p>
                        <p style={{fontSize: '13px', fontStyle: 'italic', color: '#2563EB', margin: 0}}>"Track your progress, learn from your mistakes, and come back stronger." <br/><span style={{float: 'right'}}>— TechnoCAT</span></p>
                      </div>

                      {/* Tasks */}
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
                        <h4 style={{fontSize: '16px', fontWeight: '700', color: '#0F172A', margin: 0}}>Tasks ({dayInfo.progress.tasksDone} / {dayInfo.progress.tasksTotal})</h4>
                        {dayInfo.status !== 'upcoming' && (
                          <span style={{fontSize: '12px', color: '#64748B'}}>Complete both tasks to finish Day {dayInfo.day}</span>
                        )}
                      </div>

                      <div style={{display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px'}}>
                        {/* Task 1 */}
                        {task1 && (
                          <Link href={task1.done ? "#" : "/browse"} style={{textDecoration: 'none'}}>
                            <div style={{background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'center', transition: 'border-color 0.2s', borderColor: task1.done ? '#10B981' : '#E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'}}>
                              <div style={{flexShrink: 0}}>
                                {task1.done ? (
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#10B981" stroke="#10B981" strokeWidth="1"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path></svg>
                                ) : (
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle></svg>
                                )}
                              </div>
                              <div style={{flexGrow: 1}}>
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px'}}>
                                  <h5 style={{fontSize: '14px', fontWeight: '600', color: '#0F172A', margin: 0}}>{task1.name}</h5>
                                  {!task1.done && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>}
                                </div>
                                <p style={{fontSize: '13px', color: '#64748B', margin: '0 0 8px 0'}}>Attempt and submit a full-length CAT mock test.</p>
                                <div style={{display: 'flex', gap: '8px'}}>
                                  <span style={{fontSize: '11px', background: '#F1F5F9', color: '#475569', padding: '4px 8px', borderRadius: '4px'}}>~ 2 hours</span>
                                  <span style={{fontSize: '11px', background: '#F1F5F9', color: '#475569', padding: '4px 8px', borderRadius: '4px'}}>All sections</span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        )}
                        
                        {/* Task 2 */}
                        {task2 && (
                          <Link href={task2.done ? "#" : (task1.done ? "/intelligence/ai-analysis" : "#")} style={{textDecoration: 'none', pointerEvents: (!task1.done && !task2.done) ? 'none' : 'auto', opacity: (!task1.done && !task2.done) ? 0.6 : 1}}>
                            <div style={{background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'center', transition: 'border-color 0.2s', borderColor: task2.done ? '#10B981' : '#E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'}}>
                              <div style={{flexShrink: 0}}>
                                {task2.done ? (
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#10B981" stroke="#10B981" strokeWidth="1"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path></svg>
                                ) : (
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle></svg>
                                )}
                              </div>
                              <div style={{flexGrow: 1}}>
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px'}}>
                                  <h5 style={{fontSize: '14px', fontWeight: '600', color: '#0F172A', margin: 0}}>{task2.name}</h5>
                                  {!task2.done && task1.done && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>}
                                </div>
                                <p style={{fontSize: '13px', color: '#64748B', margin: '0 0 8px 0'}}>Review your performance, check detailed analysis and identify weak areas.</p>
                                <div style={{display: 'flex', gap: '8px'}}>
                                  <span style={{fontSize: '11px', background: '#F1F5F9', color: '#475569', padding: '4px 8px', borderRadius: '4px'}}>~ 10-15 minutes</span>
                                  <span style={{fontSize: '11px', background: '#F1F5F9', color: '#475569', padding: '4px 8px', borderRadius: '4px'}}>AI Insights</span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        )}
                      </div>

                      {/* Motivation Card */}
                      <div style={{background: '#ECFDF5', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'auto'}}>
                        <div>
                          {isCompleted ? (
                             <h4 style={{fontSize: '14px', fontWeight: '700', color: '#065F46', margin: '0 0 4px 0'}}>✓ Day {dayInfo.day} Challenge Completed</h4>
                          ) : (
                             <h4 style={{fontSize: '14px', fontWeight: '600', color: '#065F46', margin: '0 0 8px 0'}}>Complete today's challenge to:</h4>
                          )}
                          {isCompleted ? (
                             <p style={{fontSize: '13px', color: '#047857', margin: 0}}>You did it! Your progress has been saved automatically.</p>
                          ) : (
                             <ul style={{listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', color: '#047857'}}>
                                <li style={{marginBottom: '4px'}}>✓ Improve your CAT readiness</li>
                                <li style={{marginBottom: '4px'}}>✓ Unlock tomorrow's challenge</li>
                                <li>✓ Build a consistent study habit</li>
                             </ul>
                          )}
                        </div>
                        <div style={{textAlign: 'center'}}>
                          <div style={{fontSize: '32px', marginBottom: '4px'}}>🏆</div>
                          <div style={{fontSize: '12px', fontWeight: '700', color: '#065F46'}}>Keep Going!</div>
                        </div>
                      </div>

                      {/* Bottom CTA */}
                      <div style={{marginTop: '24px', textAlign: 'center'}}>
                        <Link 
                          href={isCompleted ? '/intelligence' : (task1.done ? '/intelligence/ai-analysis' : '/browse')}
                          style={{
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center', 
                            gap: '8px', 
                            background: isCompleted ? '#F1F5F9' : '#2563EB', 
                            color: isCompleted ? '#475569' : '#FFFFFF', 
                            padding: '16px', 
                            borderRadius: '12px', 
                            fontWeight: '600', 
                            fontSize: '15px', 
                            textDecoration: 'none',
                            transition: 'background 0.2s',
                            cursor: isCompleted ? 'default' : 'pointer'
                          }}
                        >
                          {isCompleted ? "Challenge Completed ✓" : (task1.done ? "Continue Analysis →" : "Start Today's Challenge →")}
                        </Link>
                        <p style={{fontSize: '12px', color: '#94A3B8', margin: '12px 0 0 0'}}>You'll be redirected to the relevant section. Your progress will be tracked automatically.</p>
                      </div>

                    </div>
                  );
                })()}
              </div>
            </>
          )}
`;

pageContent = pageContent.replace(/<\/main>/, slideOverPanelHtml + '\n        </main>');

fs.writeFileSync(pagePath, pageContent);
console.log("Injected new slide-over panel into page.tsx");
