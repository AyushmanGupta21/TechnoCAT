"use client";

import React, { useState, useEffect } from "react";
import styles from "./AiMotivationWidget.module.css";

interface AiMotivationWidgetProps {
  firstName: string;
  streak: number;
  points: number;
}

const MESSAGES = [
  "Wow, {streak} days in a row! 🔥 Keep up the incredible momentum, {name}.",
  "You've earned {points} points so far. 🏆 You're on track for that 99+ percentile!",
  "Great to see you again, {name}. A quick 20-minute session today can make all the difference. 💡",
  "Hard work beats talent when talent doesn't work hard. Let's crush today's topics! 🚀",
  "Consistency is your superpower. Your {streak}-day streak is proof of your dedication. 💪"
];

export default function AiMotivationWidget({ firstName, streak, points }: AiMotivationWidgetProps) {
  const [isThinking, setIsThinking] = useState(true);
  const [message, setMessage] = useState("");
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    // 1. Pick a message
    const rawMsg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
    const personalizedMsg = rawMsg
      .replace("{name}", firstName)
      .replace("{streak}", streak.toString())
      .replace("{points}", points.toString());
    
    setMessage(personalizedMsg);

    // 2. Simulate AI "thinking" time (1.5 to 2.5 seconds)
    const thinkTimer = setTimeout(() => {
      setIsThinking(false);
    }, 1500 + Math.random() * 1000);

    return () => clearTimeout(thinkTimer);
  }, [firstName, streak, points]);

  useEffect(() => {
    // 3. Typewriter effect
    if (!isThinking && message) {
      let i = 0;
      setDisplayedText(""); // reset
      
      const typeTimer = setInterval(() => {
        setDisplayedText(prev => prev + message.charAt(i));
        i++;
        if (i >= message.length) {
          clearInterval(typeTimer);
        }
      }, 30); // typing speed

      return () => clearInterval(typeTimer);
    }
  }, [isThinking, message]);

  return (
    <div className={styles.widgetContainer}>
      <div className={styles.avatarBox}>
        <svg className={styles.sparkleIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
        </svg>
      </div>
      
      <div className={styles.messageBox}>
        <div className={styles.aiHeader}>
          TechnoCAT AI Assistant
        </div>
        
        {isThinking ? (
          <div className={styles.typingIndicator}>
            <span className={styles.dot}></span>
            <span className={styles.dot}></span>
            <span className={styles.dot}></span>
          </div>
        ) : (
          <p className={styles.messageContent}>
            {/* Highlight numbers and emojis if needed, but simple string is fine for now */}
            {displayedText}
          </p>
        )}
      </div>
    </div>
  );
}