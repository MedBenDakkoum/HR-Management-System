import { createGlobalStyle } from "styled-components";

const colors = {
  background: "#F8F7F6",
  primary: "#85929E",
  secondary: "#657786",
  tertialy: "#f18500",
  text: "#000000",
  accent: "#FF4500" /*#FF4500 , #f18500*/,
};

const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
  }

  html {
    font-size: 16px;
    
    @media (max-width: 768px) {
      font-size: 14px;
    }
    
    @media (max-width: 480px) {
      font-size: 13px;
    }
  }

  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    background-color: ${colors.background};
    color: ${colors.text};
    line-height: 1.6;
    overflow-x: hidden;
  }

  a {
    color: ${colors.primary};
    text-decoration: none;
  }

  button {
    background-color: ${colors.accent};
    color: white;
    border: none;
    padding: 10px 20px;
    cursor: pointer;
    border-radius: 5px;
    font-size: inherit;
    transition: all 0.3s ease;
  }

  button:hover {
    background-color: ${colors.primary};
  }

  button:disabled {
    /* opacity: 0.6; */
    cursor: not-allowed;
  }

  input, select, textarea {
    font-size: inherit;
    font-family: inherit;
    width: 100%;
    box-sizing: border-box;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  /* Responsive utilities */
  .mobile-only {
    display: none;
    
    @media (max-width: 768px) {
      display: block;
    }
  }

  .desktop-only {
    display: block;
    
    @media (max-width: 768px) {
      display: none;
    }
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
`;

export default GlobalStyle;
export { colors };
