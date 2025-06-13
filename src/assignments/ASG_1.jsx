import BackToHome from "../component/BackToHome";
import "../assignments/Pages.css";
import "../assignments/AGS_1.css";
import React, { useEffect, useState } from "react";

export default function ASG_1() {
  const [visibleSections, setVisibleSections] = useState({
    section1: false,
    section2: false,
    section3: false,
  });

  const toggleBox = (sectionNumber) => {
    setVisibleSections((prev) => ({
      ...prev,
      [sectionNumber]: !prev[sectionNumber],
    }));
  };

  useEffect(() => {
    console.log(`Visible Sections Updated :`, visibleSections);
  }, [visibleSections]);

  return (
    <>
      <BackToHome />
      <h1 className="assignment-title">Assignment#1</h1>
      <hr />
      <br />

      {/*Section #1*/}

      <div className="button-text-pair">
        <button className="btn-ags1" onClick={ ()=>toggleBox("section1")}>
          Section #1
          <span>
            {visibleSections.section1 ? "Hide TextBox #1" : "Show Text Box #1"}
          </span>
        </button>
        {visibleSections.section1 && (
          <div className="text-box-container">
            <p className="text-box">
              Beneath the bustling city streets, a secret world thrived. Tunnels
              stretched for miles, harboring stories lost to time. Echoes
              bounced off damp stone walls, whispering secrets only the shadows
              knew. Lanterns flickered dimly, lighting the path for those who
              dared explore. Graffiti painted over centuries of grime hinted at
              lives once lived, revolutions sparked, and dreams pursued. Rats
              scurried into crevices, fleeing unseen threats. A lonely violin
              note wafted through the air—someone was there. Footsteps followed
              the music, unsure whether to run or remain. Curiosity often
              outweighed fear in such places. Underground, everything felt
              possible, mysterious, even magical in its decay.
            </p>
          </div>
        )}
      </div>

      {/*Section #2*/}

      <div className="button-text-pair">
        <button className="btn-ags1" onClick={() => toggleBox("section2")}>
          Section #2
          <span>
            {visibleSections.section2 ? "Hide TextBox #2" : "Show TextBox #2"}
          </span>
          {}
        </button>

        {visibleSections.section2 && (
          <div className="text-box-container">
            <p className="text-box">
              The sun dipped below the horizon, casting a golden glow over the
              quiet lake. Birds chirped their final melodies of the day, echoing
              through the rustling leaves. A gentle breeze stirred the tall
              grasses along the water’s edge. In the distance, a canoe glided
              silently, its paddler silhouetted against the fiery sky. Nature’s
              calm enveloped the scene, inviting peace and reflection. Somewhere
              nearby, a frog croaked, joining the evening chorus. The day ended
              slowly, thoughtfully, as stars peeked through the fading blue. It
              was a moment of stillness, untouched by noise or haste—just time,
              light, and the world unwinding together.
            </p>
          </div>
        )}
      </div>

      {/*Section #3*/}
      <div className="button-text-pair">
        <button className="btn-ags1" onClick={() => toggleBox("section3")}>
          Section #3
          <span>
            {" "}
            {visibleSections.section3
              ? "Hide TextBox #3"
              : "Show TextBox #3"}{" "}
          </span>
        </button>

        {visibleSections.section3 && (
          <div className="text-box-container">
            <p className="text-box">
              Rain poured relentlessly, drenching the city in sheets of silver.
              People hurried beneath umbrellas, their footsteps lost in the
              downpour’s rhythm. Neon signs blurred behind water-streaked glass,
              casting colorful reflections onto slick pavement. Taxis splashed
              by, sending waves toward already soaked pedestrians. Inside a tiny
              café, warmth and coffee wrapped around customers like a comforting
              embrace. Steam curled from mugs, fogging windows. Conversations
              were hushed, intimate, like secrets shared under stormy skies.
              Outside, thunder grumbled distantly, a reminder of nature’s power.
              But within, calm prevailed. The rain may have ruled the streets,
              but the café remained an island of serenity.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
