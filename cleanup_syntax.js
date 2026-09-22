const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, 'src/app/intelligence/page.tsx');
let pageContent = fs.readFileSync(pagePath, 'utf8');

const strToRemove = `                              </>
                            )}
                            
                            {dayInfo.status === 'upcoming' && (
                              <div style={{padding: '16px', background: '#F1F5F9', borderRadius: '8px', color: '#64748B', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                                <span>dY"'</span> Complete previous days to unlock this challenge.
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}`;

// Also there's an extra bracket: `})()}`
// And the `o"` symbol check: `{isComplete ? "Challenge Completed o"" : (todayInfo.tasks[0].done ? "Continue Analysis" : "Start Today's Challenge")}`
// I'll just rewrite the whole section starting from `{/* Static Today's Challenge Summary Card */}` until `</>` to fix this.
