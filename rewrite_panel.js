const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, 'src/app/intelligence/page.tsx');
let pageContent = fs.readFileSync(pagePath, 'utf8');

// We are going to replace the ENTIRE slide out panel overlay section.
// It starts with `{/* SLIDE OUT PANEL OVERLAY for Challenge */}` and ends with `</main>`
const startMarker = "{/* SLIDE OUT PANEL OVERLAY for Challenge */}";
const endMarker = "        </main>";
const startIndex = pageContent.indexOf(startMarker);
const endIndex = pageContent.indexOf(endMarker, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `{/* SLIDE OUT PANEL OVERLAY for Challenge */}
            {selectedChallengeDay !== null && challengeData && (
              <>
                <div className={styles.panelOverlay} style={{display: "block", position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", zIndex: 50, backdropFilter: 'blur(4px)'}} onClick={() => setSelectedChallengeDay(null)}></div>
                
                <div className={styles.detailPanel} style={{
                  position: "fixed", 
                  top: '16px', 
                  right: '16px', 
                  bottom: '16px', 
                  zIndex: 51, 
                  background: "#FFFFFF", 
                  boxShadow: "-10px 0 30px rgba(0,0,0,0.1)", 
                  width: '460px', 
                  maxWidth: 'calc(100vw - 32px)', 
                  display: 'flex', 
                  flexDirection: 'column',
                  borderRadius: '24px',
                  overflow: 'hidden'
                }}>
                  
                  {(() => {
                    const dayInfo = challengeData.days.find((d: any) => d.day === selectedChallengeDay);
                    if (!dayInfo) return null;
                    
                    const isCompleted = dayInfo.progress.tasksDone === dayInfo.progress.tasksTotal;
                    const task1 = dayInfo.tasks[0];
                    const task2 = dayInfo.tasks[1];
  
                    return (
                      <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
                        {/* Header (Fixed) */}
                        <div style={{padding: '24px 32px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', flexShrink: 0}}>
                          <button className={styles.panelClose} style={{position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748B'}} onClick={() => setSelectedChallengeDay(null)}>&times;</button>
                          
                          <div style={{display: 'flex', gap: '16px', alignItems: 'center'}}>
                            <div style={{background: '#EFF6FF', color: '#2563EB', padding: '14px', borderRadius: '16px'}}>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                            </div>
                            <div>
                              <h2 style={{fontSize: '20px', fontWeight: '700', color: '#0F172A', margin: 0}}>Today's Challenge</h2>
                              <p style={{fontSize: '14px', color: '#64748B', margin: '4px 0 0 0'}}>Day {dayInfo.day} of 7</p>
                            </div>
                          </div>
                          
                          <div style={{background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '8px 12px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', marginRight: '32px'}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                              <span style={{fontSize: '13px', fontWeight: '700', color: '#0F172A'}}>{new Date(dayInfo.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}</span>
                            </div>
                            <span style={{fontSize: '10px', color: '#94A3B8'}}>Your Learning Journey</span>
                          </div>
                        </div>
  
                        {/* Scrollable Content */}
                        <div style={{flexGrow: 1, overflowY: 'auto', padding: '24px 32px'}}>
                          
                          {/* Today's Focus Card */}
                          <div style={{background: '#F8FAFC', borderRadius: '20px', padding: '24px', marginBottom: '32px'}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px'}}>
                              <div style={{background: '#D1FAE5', color: '#059669', borderRadius: '50%', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
                              </div>
                              <span style={{fontSize: '14px', fontWeight: '700', color: '#0F172A'}}>Today's Focus</span>
                            </div>
                            
                            <h3 style={{fontSize: '20px', fontWeight: '700', color: '#2563EB', margin: '0 0 12px 0'}}>{dayInfo.title}</h3>
                            <p style={{fontSize: '14px', color: '#475569', margin: '0 0 20px 0', lineHeight: '1.5'}}>{dayInfo.desc}</p>
                            
                            <div style={{borderTop: '1px solid #E2E8F0', paddingTop: '16px', display: 'flex', gap: '12px'}}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="3" style={{flexShrink: 0, marginTop: '2px'}}><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 -1 8 1 8z"></path><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h2c0 7-1 8 1 8z"></path></svg>
                              <div style={{flexGrow: 1}}>
                                <p style={{fontSize: '14px', fontStyle: 'italic', color: '#3B82F6', margin: '0 0 8px 0'}}>"Track your progress, learn from your mistakes, and come back stronger."</p>
                                <p style={{fontSize: '13px', color: '#3B82F6', textAlign: 'right', margin: 0}}>— TechnoCAT</p>
                              </div>
                            </div>
                          </div>
  
                          {/* Tasks Section */}
                          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px'}}>
                            <h3 style={{fontSize: '16px', fontWeight: '700', color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '8px'}}>
                              Tasks ({dayInfo.progress.tasksDone} / {dayInfo.progress.tasksTotal})
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
                            </h3>
                            <span style={{fontSize: '13px', color: '#64748B'}}>Complete both tasks to finish Day {dayInfo.day}</span>
                          </div>
                          
                          <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                            {/* Task 1 */}
                            {task1 && (
                              <Link href={task1.done ? "#" : "/dashboard"} style={{textDecoration: 'none', color: 'inherit'}}>
                                <div style={{background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '20px', display: 'flex', gap: '20px', alignItems: 'center', transition: 'border-color 0.2s, box-shadow 0.2s', borderColor: task1.done ? '#10B981' : '#E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'}}>
                                  
                                  {/* Check circle */}
                                  <div style={{flexShrink: 0}}>
                                    {task1.done ? (
                                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                    ) : (
                                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle></svg>
                                    )}
                                  </div>
                                  
                                  {/* Icon Block */}
                                  <div style={{background: '#EFF6FF', borderRadius: '12px', padding: '12px', flexShrink: 0}}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                  </div>
                                  
                                  <div style={{flexGrow: 1}}>
                                    <h5 style={{fontSize: '15px', fontWeight: '700', color: '#0F172A', margin: '0 0 4px 0'}}>{task1.name}</h5>
                                    <p style={{fontSize: '13px', color: '#64748B', margin: '0 0 12px 0'}}>Attempt and submit a full-length CAT mock test.</p>
                                    <div style={{display: 'flex', gap: '8px'}}>
                                      <span style={{fontSize: '11px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px'}}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> ~ 2 hours
                                      </span>
                                      <span style={{fontSize: '11px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px'}}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg> All sections
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <div style={{flexShrink: 0, paddingLeft: '8px'}}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                  </div>
                                </div>
                              </Link>
                            )}
                            
                            {/* Task 2 */}
                            {task2 && (
                              <Link href={task2.done ? "#" : (task1.done ? "/intelligence/ai-analysis" : "#")} style={{textDecoration: 'none', pointerEvents: (!task1.done && !task2.done) ? 'none' : 'auto', opacity: (!task1.done && !task2.done) ? 0.6 : 1, color: 'inherit'}}>
                                <div style={{background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '20px', display: 'flex', gap: '20px', alignItems: 'center', transition: 'border-color 0.2s, box-shadow 0.2s', borderColor: task2.done ? '#10B981' : '#E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'}}>
                                  
                                  {/* Check circle */}
                                  <div style={{flexShrink: 0}}>
                                    {task2.done ? (
                                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                    ) : (
                                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle></svg>
                                    )}
                                  </div>
                                  
                                  {/* Icon Block */}
                                  <div style={{background: '#F5F3FF', borderRadius: '12px', padding: '12px', flexShrink: 0}}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                                  </div>
                                  
                                  <div style={{flexGrow: 1}}>
                                    <h5 style={{fontSize: '15px', fontWeight: '700', color: '#0F172A', margin: '0 0 4px 0'}}>{task2.name}</h5>
                                    <p style={{fontSize: '13px', color: '#64748B', margin: '0 0 12px 0'}}>Review your performance, check detailed analysis and identify weak areas.</p>
                                    <div style={{display: 'flex', gap: '8px'}}>
                                      <span style={{fontSize: '11px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px'}}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> ~ 10-15 mins
                                      </span>
                                      <span style={{fontSize: '11px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px'}}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> AI Insights
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <div style={{flexShrink: 0, paddingLeft: '8px'}}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                  </div>
                                </div>
                              </Link>
                            )}
                          </div>

                          {/* Motivation Card */}
                          <div style={{background: '#ECFDF5', borderRadius: '16px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px'}}>
                            <div>
                              <h4 style={{fontSize: '15px', fontWeight: '700', color: '#065F46', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px'}}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Complete today's challenge to:
                              </h4>
                              <ul style={{listStyle: 'none', padding: 0, margin: 0, fontSize: '14px', color: '#065F46', display: 'flex', flexDirection: 'column', gap: '8px'}}>
                                <li style={{display: 'flex', alignItems: 'center', gap: '8px'}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3"><path d="M20 6L9 17l-5-5"></path></svg> Improve your CAT readiness</li>
                                <li style={{display: 'flex', alignItems: 'center', gap: '8px'}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3"><path d="M20 6L9 17l-5-5"></path></svg> Unlock tomorrow's challenge</li>
                                <li style={{display: 'flex', alignItems: 'center', gap: '8px'}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3"><path d="M20 6L9 17l-5-5"></path></svg> Build a consistent study habit</li>
                              </ul>
                            </div>
                            <div style={{textAlign: 'center', flexShrink: 0, paddingLeft: '16px', borderLeft: '1px solid #D1FAE5'}}>
                              <div style={{fontSize: '40px', marginBottom: '8px'}}>🏆</div>
                              <div style={{fontSize: '14px', fontWeight: '700', color: '#065F46'}}>Keep Going!</div>
                              <div style={{fontSize: '11px', color: '#047857', marginTop: '4px'}}>Consistency creates results.</div>
                            </div>
                          </div>
                          
                        </div>
                        
                        {/* Bottom CTA (Fixed at bottom) */}
                        <div style={{padding: '24px 32px', borderTop: '1px solid #F1F5F9', background: '#FFFFFF', flexShrink: 0}}>
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
                              borderRadius: '16px', 
                              fontWeight: '700', 
                              fontSize: '16px', 
                              textDecoration: 'none',
                              transition: 'background 0.2s',
                              cursor: isCompleted ? 'default' : 'pointer'
                            }}
                          >
                            {isCompleted ? "Challenge Completed ✓" : (task1.done ? "Continue Analysis" : "Start Today's Challenge")}
                            {!isCompleted && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="5 12 19 12"></polyline><polyline points="12 5 19 12 12 19"></polyline></svg>}
                          </Link>
                          <p style={{fontSize: '12px', color: '#94A3B8', margin: '12px 0 0 0', textAlign: 'center'}}>You'll be redirected to the relevant section. Your progress will be tracked automatically.</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </>
            )}

        </main>`;
  
  pageContent = pageContent.substring(0, startIndex) + replacement;
  fs.writeFileSync(pagePath, pageContent);
  console.log("Replaced panel logic.");
}
