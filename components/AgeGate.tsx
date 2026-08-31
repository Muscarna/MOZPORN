"use client";

import { useEffect, useState } from "react";

export default function AgeGate() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(localStorage.getItem("mozpornAgeConfirmed") !== "yes");
  }, []);

  if (!visible) return null;

  return (
    <div className="age-gate">
      <div className="gate-card">
        <div className="logo">MOZ<span>PORN</span></div>
        <h1>Conteúdo para adultos</h1>
        <p>Esta plataforma é destinada exclusivamente a pessoas com 18 anos ou mais.</p>
        <div className="gate-actions">
          <button className="btn primary" onClick={() => { localStorage.setItem("mozpornAgeConfirmed", "yes"); setVisible(false); }}>Tenho 18+</button>
          <button className="btn" onClick={() => { window.location.href = "https://www.google.com"; }}>Sair</button>
        </div>
      </div>
    </div>
  );
}
