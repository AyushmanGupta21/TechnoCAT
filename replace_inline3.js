const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, 'src/app/intelligence/page.tsx');
let pageContent = fs.readFileSync(pagePath, 'utf8');

// Use regex to carefully target the OLD selectedChallengeDay block.
// It starts with "{/* Dynamic Challenge Detail Panel */}" and we know roughly what's inside.
const startMarker = "{/* Dynamic Challenge Detail Panel */}";
const startIndex = pageContent.indexOf(startMarker);

// We know it is followed by `</>` then `) : (` then `Loading your journey` ... `</section>`
// Wait, the block is `{selectedChallengeDay !== null && ...` ending at `)}`
// Let's replace the whole `challengeDetailCard` logic if it exists.
if (startIndex !== -1) {
  // Let's just find the exact chunk using string search
  const endPattern = "                                </>"; // last part of it
  const indexOfEndPattern = pageContent.indexOf(endPattern, startIndex);
  if (indexOfEndPattern !== -1) {
      // Find the closing brackets
      const chunkEnd = pageContent.indexOf(")}", indexOfEndPattern) + 2;
      
      const newStaticBlock = `
                    {/* Static Today's Challenge Summary Card */}
                    {(() => {
                      const todayInfo = challengeData.days.find((d: any) => d.status === 'today') || challengeData.days.find((d: any) => d.day === challengeData.currentDay);
                      if (!todayInfo) return null;
                      const isComplete = todayInfo.progress.tasksDone === todayInfo.progress.tasksTotal;

                      return (
                        <div className={styles.challengeDetailCard} style={{
                          marginTop: '24px',
                          padding: '24px',
                          background: '#F8FAFC',
                          borderRadius: '16px',
                          border: '1px solid #E2E8F0',
                          cursor: 'pointer',
                          transition: 'transform 0.2s',
                        }} onClick={() => setSelectedChallengeDay(todayInfo.day)}>
                          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
                            <h4 style={{fontSize: '16px', fontWeight: '700', color: '#0F172A', margin: 0}}>
                              Today's Focus: <span style={{color: '#2563EB'}}>{todayInfo.title}</span>
                            </h4>
                          </div>
                          
                          <p style={{fontSize: '14px', color: '#475569', marginBottom: '20px'}}>{todayInfo.desc}</p>
                          
                          <div style={{fontSize: '12px', fontWeight: '600', color: '#64748B', marginBottom: '8px', textTransform: 'uppercase'}}>
                            Tasks Progress ({todayInfo.progress.tasksDone} / {todayInfo.progress.tasksTotal})
                          </div>
                          <ul style={{listStyle: 'none', padding: 0, margin: '0 0 24px 0'}}>
                            {todayInfo.tasks.map((t: any, idx: number) => (
                              <li key={idx} style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', fontSize: '14px', color: '#334155'}}>
                                {t.done ? (
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                ) : (
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle></svg>
                                )}
                                <span style={{textDecoration: t.done ? 'line-through' : 'none', opacity: t.done ? 0.7 : 1}}>{t.name}</span>
                              </li>
                            ))}
                          </ul>
                          
                          <div className={styles.challengeCta} style={{display: 'inline-flex', pointerEvents: 'none'}}>
                            {isComplete ? "Challenge Completed ✓" : (todayInfo.tasks[0].done ? "Continue Analysis" : "Start Today's Challenge")}
                          </div>
                        </div>
                      );
                    })()}
`;
      
      pageContent = pageContent.substring(0, startIndex) + newStaticBlock + pageContent.substring(chunkEnd);
      fs.writeFileSync(pagePath, pageContent);
      console.log("Successfully replaced the inline logic!");
  } else {
      console.log("Could not find end pattern.");
  }
} else {
  console.log("Could not find start pattern.");
}
