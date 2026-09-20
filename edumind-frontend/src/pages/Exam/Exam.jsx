import React from "react";

export default function Exam() {
  return (
    <div className="exam-coming-soon">
      <style>{`
        .exam-coming-soon {
          min-height: calc(100vh - 80px);
          padding: 50px 55px 60px;
          background:
            radial-gradient(circle at 8% 8%, rgba(46, 166, 135, 0.08), transparent 24%),
            radial-gradient(circle at 92% 90%, rgba(46, 166, 135, 0.07), transparent 25%),
            #f8fbfa;
          position: relative;
          overflow: hidden;
          font-family: inherit;
          color: #1f2937;
        }

        .exam-coming-soon::before {
          content: "";
          position: absolute;
          width: 280px;
          height: 280px;
          border: 1px solid rgba(42, 163, 132, 0.12);
          border-radius: 50%;
          top: -150px;
          left: -100px;
        }

        .exam-coming-soon::after {
          content: "";
          position: absolute;
          width: 220px;
          height: 220px;
          border: 1px solid rgba(42, 163, 132, 0.12);
          border-radius: 50%;
          bottom: -130px;
          right: -80px;
        }

        .exam-content {
          max-width: 1180px;
          margin: 0 auto;
          position: relative;
          z-index: 2;
        }

        .exam-badge {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 10px 18px;
          border-radius: 999px;
          background: #e9f7f2;
          color: #18866c;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 22px;
          border: 1px solid rgba(24, 134, 108, 0.08);
        }

        .exam-badge-icon {
          font-size: 18px;
        }

        .exam-hero {
          text-align: center;
          padding: 20px 20px 10px;
        }

        .exam-title {
          margin: 0;
          font-size: clamp(42px, 6vw, 72px);
          line-height: 1.05;
          letter-spacing: -2.5px;
          font-weight: 800;
          color: #1f2937;
        }

        .exam-title span {
          color: #209b7b;
        }

        .exam-subtitle {
          max-width: 650px;
          margin: 22px auto 0;
          font-size: 18px;
          line-height: 1.7;
          color: #6b7280;
        }

        .exam-subtitle strong {
          color: #209b7b;
          font-weight: 700;
        }

        .exam-illustration {
          position: relative;
          width: min(720px, 100%);
          height: 290px;
          margin: 35px auto 40px;
        }

        .exam-glow {
          position: absolute;
          width: 520px;
          height: 230px;
          left: 50%;
          top: 30px;
          transform: translateX(-50%);
          border-radius: 50%;
          background: rgba(53, 181, 150, 0.09);
          filter: blur(2px);
        }

        .exam-books {
          position: absolute;
          left: 50%;
          bottom: 25px;
          transform: translateX(-165px);
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .book {
          width: 150px;
          height: 30px;
          border-radius: 8px 12px 12px 8px;
          box-shadow: 0 8px 18px rgba(20, 100, 80, 0.12);
        }

        .book:nth-child(1) {
          background: #249c7c;
          transform: rotate(-3deg);
        }

        .book:nth-child(2) {
          background: #4db89d;
          transform: rotate(2deg);
          width: 175px;
        }

        .book:nth-child(3) {
          background: #177f68;
          transform: rotate(-2deg);
          width: 155px;
        }

        .exam-paper {
          position: absolute;
          left: 50%;
          top: 5px;
          transform: translateX(-50%) rotate(-3deg);
          width: 230px;
          height: 275px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          box-shadow: 0 22px 45px rgba(25, 75, 65, 0.14);
          padding: 28px;
          text-align: left;
          z-index: 3;
        }

        .paper-title {
          color: #209b7b;
          font-size: 19px;
          font-weight: 800;
          margin-bottom: 20px;
        }

        .paper-line {
          height: 10px;
          border-radius: 6px;
          background: #e9eef0;
          margin: 14px 0;
        }

        .paper-line.short {
          width: 68%;
        }

        .paper-check {
          display: flex;
          align-items: center;
          gap: 11px;
          margin: 17px 0;
        }

        .check {
          width: 20px;
          height: 20px;
          border-radius: 6px;
          background: #39af91;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 800;
        }

        .check-line {
          height: 8px;
          width: 125px;
          background: #e9eef0;
          border-radius: 5px;
        }

        .exam-pencil {
          position: absolute;
          left: calc(50% + 145px);
          top: 72px;
          width: 22px;
          height: 175px;
          background: linear-gradient(
            to right,
            #20a17f 0%,
            #20a17f 70%,
            #16866a 70%,
            #16866a 100%
          );
          border-radius: 10px;
          transform: rotate(25deg);
          z-index: 4;
          box-shadow: 0 12px 20px rgba(25, 100, 80, 0.16);
        }

        .exam-pencil::before {
          content: "";
          position: absolute;
          top: -22px;
          left: 0;
          border-left: 11px solid transparent;
          border-right: 11px solid transparent;
          border-bottom: 23px solid #e6b78c;
        }

        .exam-pencil::after {
          content: "";
          position: absolute;
          top: -27px;
          left: 7px;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-bottom: 8px solid #333;
        }

        .side-note {
          position: absolute;
          padding: 16px 20px;
          border-radius: 18px;
          background: rgba(255,255,255,0.8);
          border: 1px solid rgba(32, 155, 123, 0.12);
          color: #39796a;
          font-weight: 700;
          font-size: 14px;
          line-height: 1.5;
          box-shadow: 0 12px 30px rgba(20, 80, 70, 0.07);
        }

        .side-note.left {
          left: 8%;
          top: 100px;
          transform: rotate(-6deg);
        }

        .side-note.right {
          right: 7%;
          top: 85px;
          transform: rotate(5deg);
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
          margin-top: 10px;
        }

        .feature-card {
          background: rgba(255,255,255,0.92);
          border: 1px solid #e7eeee;
          border-radius: 20px;
          padding: 28px 20px;
          text-align: center;
          box-shadow: 0 10px 30px rgba(30, 80, 70, 0.06);
          transition:
            transform 0.25s ease,
            box-shadow 0.25s ease;
        }

        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 18px 35px rgba(30, 80, 70, 0.1);
        }

        .feature-icon {
          width: 58px;
          height: 58px;
          margin: 0 auto 17px;
          border-radius: 50%;
          background: #eaf7f3;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #209b7b;
          font-size: 25px;
        }

        .feature-card h3 {
          margin: 0 0 9px;
          font-size: 16px;
          color: #24313d;
        }

        .feature-card p {
          margin: 0;
          color: #7b8490;
          font-size: 13px;
          line-height: 1.6;
        }

        .update-banner {
          max-width: 720px;
          margin: 34px auto 0;
          padding: 18px 25px;
          border-radius: 18px;
          background: linear-gradient(
            135deg,
            #eaf8f4,
            #f4fbf9
          );
          border: 1px solid rgba(32, 155, 123, 0.1);
          text-align: center;
          color: #207c68;
        }

        .update-banner strong {
          display: block;
          font-size: 15px;
          margin-bottom: 4px;
        }

        .update-banner span {
          font-size: 13px;
          color: #72958d;
        }

        .quote {
          text-align: center;
          margin: 35px auto 0;
          color: #7a8490;
          font-size: 14px;
          font-style: italic;
        }

        .quote-author {
          margin-top: 7px;
          color: #209b7b;
          font-style: normal;
          font-weight: 700;
        }

        @media (max-width: 1000px) {
          .feature-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .side-note {
            display: none;
          }
        }

        @media (max-width: 650px) {
          .exam-coming-soon {
            padding: 35px 20px 50px;
          }

          .exam-title {
            font-size: 46px;
          }

          .exam-subtitle {
            font-size: 16px;
          }

          .exam-illustration {
            transform: scale(0.82);
            transform-origin: center;
            margin-top: 5px;
            margin-bottom: 5px;
          }

          .feature-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="exam-content">
        <section className="exam-hero">
          <div className="exam-badge">
            <span className="exam-badge-icon">🎓</span>
            Mock Exams
          </div>

          <h1 className="exam-title">
            Coming <span>Soon</span> ✨
          </h1>

          <p className="exam-subtitle">
            Your personalized exam experience is being prepared.
            <br />
            <strong>Practice smarter. Perform better.</strong>
          </p>

          <div className="exam-illustration">
            <div className="exam-glow" />

            <div className="side-note left">
              Practice
              <br />
              Analyze
              <br />
              Improve
            </div>

            <div className="side-note right">
              Better Results
              <br />
              Ahead! ↑
            </div>

            <div className="exam-books">
              <div className="book" />
              <div className="book" />
              <div className="book" />
            </div>

            <div className="exam-paper">
              <div className="paper-title">MOCK EXAM</div>

              <div className="paper-check">
                <span className="check">✓</span>
                <span className="check-line" />
              </div>

              <div className="paper-check">
                <span className="check">✓</span>
                <span className="check-line" />
              </div>

              <div className="paper-check">
                <span className="check">✓</span>
                <span className="check-line" />
              </div>

              <div className="paper-line" />
              <div className="paper-line short" />
            </div>

            <div className="exam-pencil" />
          </div>
        </section>

        <section className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">📄</div>
            <h3>Real Exam Experience</h3>
            <p>
              Take mock tests designed to feel similar to actual exams.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Detailed Analytics</h3>
            <p>
              Track your performance and identify your weak areas.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Personalized Practice</h3>
            <p>
              Get AI-recommended questions based on your learning.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">💡</div>
            <h3>Improve with Insights</h3>
            <p>
              Learn from your mistakes and keep getting better.
            </p>
          </div>
        </section>

        <div className="update-banner">
          <strong>
            🔔 We're working hard to bring you an amazing mock exam
            experience.
          </strong>
          <span>Stay tuned for updates!</span>
        </div>

        <div className="quote">
          “Success is the sum of small efforts, repeated day in and day out.”
          <div className="quote-author">— Robert Collier</div>
        </div>
      </div>
    </div>
  );
}