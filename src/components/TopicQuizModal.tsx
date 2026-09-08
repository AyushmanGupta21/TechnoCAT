"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./TopicQuizModal.module.css";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface TopicQuizModalProps {
  topicId: string;
  topicTitle: string;
  onClose: () => void;
}

export default function TopicQuizModal({ topicId, topicTitle, onClose }: TopicQuizModalProps) {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Fetch quiz from AI endpoint
    async function generateQuiz() {
      try {
        const res = await fetch("/api/generate-quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topicId, topicTitle })
        });
        const data = await res.json();
        if (data.questions) {
          setQuestions(data.questions);
        }
      } catch (err) {
        console.error("Failed to fetch quiz", err);
      } finally {
        setLoading(false);
      }
    }
    generateQuiz();
  }, [topicId, topicTitle]);

  if (!mounted) return null;

  const handleSelectOption = (idx: number) => {
    if (showFeedback) return; // Prevent changing answer after submitting
    setSelectedOption(idx);
  };

  const handleSubmit = () => {
    if (selectedOption === null) return;
    
    setShowFeedback(true);
    if (selectedOption === questions[currentIndex].correctIndex) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowFeedback(false);
    } else {
      setIsFinished(true);
    }
  };

  const currentQ = questions[currentIndex];

  const modalContent = (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>AI Practice Quiz</h2>
            <p className={styles.modalSubtitle}>{topicTitle}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className={styles.modalBody}>
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner} />
              <h3>Generating Questions...</h3>
              <p>Using RAG to pull 80% from course material and 20% from PYQs.</p>
            </div>
          ) : isFinished ? (
            <div className={styles.resultsState}>
              <div className={styles.resultsScore}>{score} / {questions.length}</div>
              <p className={styles.resultsText}>
                {score === questions.length ? "Perfect score! You're ready." : "Good job! Keep practicing."}
              </p>
              <button className={styles.btnPrimary} onClick={onClose}>Back to Course</button>
            </div>
          ) : currentQ ? (
            <>
              <div className={styles.questionHeader}>
                <span>Question {currentIndex + 1} of {questions.length}</span>
              </div>
              <h3 className={styles.questionText}>{currentQ.question}</h3>
              
              <div className={styles.optionsGrid}>
                {currentQ.options.map((opt, idx) => {
                  let btnClass = styles.optionBtn;
                  if (selectedOption === idx) btnClass += ` ${styles.optionSelected}`;
                  
                  if (showFeedback) {
                    if (idx === currentQ.correctIndex) {
                      btnClass += ` ${styles.optionCorrect}`;
                    } else if (selectedOption === idx) {
                      btnClass += ` ${styles.optionIncorrect}`;
                    }
                  }

                  return (
                    <button 
                      key={idx} 
                      className={btnClass}
                      onClick={() => handleSelectOption(idx)}
                      disabled={showFeedback}
                    >
                      {opt}
                      {showFeedback && idx === currentQ.correctIndex && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      )}
                      {showFeedback && selectedOption === idx && idx !== currentQ.correctIndex && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      )}
                    </button>
                  );
                })}
              </div>

              {showFeedback && (
                <div className={styles.feedbackBox}>
                  <strong>Explanation:</strong> {currentQ.explanation}
                </div>
              )}
            </>
          ) : (
            <div className={styles.loadingState}>Failed to load questions.</div>
          )}
        </div>

        {!loading && !isFinished && (
          <div className={styles.modalFooter}>
            {!showFeedback ? (
              <button 
                className={styles.btnPrimary} 
                disabled={selectedOption === null}
                onClick={handleSubmit}
              >
                Submit Answer
              </button>
            ) : (
              <button className={styles.btnPrimary} onClick={handleNext}>
                {currentIndex < questions.length - 1 ? "Next Question" : "Finish Quiz"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}