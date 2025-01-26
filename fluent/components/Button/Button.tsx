"use client";

import "./ButtonStyles.css";
import React from "react";

interface ButtonProps {
  content: string;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ content, className }) => {
  // Determine the button text based on the `id` and `content`
  const buttonText = content;

  return (
    <div id="container">
      <button className={`main learn-more ${className}`}>
        <span className="main circle" aria-hidden="true">
          <span className="main icon arrow"></span>
        </span>
        <span className="main button-text font-[bw]">{buttonText}</span>
      </button>
    </div>
  );
};

export default Button;
