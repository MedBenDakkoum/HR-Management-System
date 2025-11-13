import React from "react";
import styled from "styled-components";
import { colors } from "../styles/GlobalStyle";

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f5f7fa;
  gap: 15px;
  padding: 20px;

  @media (max-width: 768px) {
    gap: 12px;
    padding: 15px;
  }

  @media (max-width: 480px) {
    gap: 10px;
    padding: 10px;
  }
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid ${colors.primary};
  border-top: 4px solid ${colors.tertialy};
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 768px) {
    width: 35px;
    height: 35px;
    border-width: 3px;
  }

  @media (max-width: 480px) {
    width: 30px;
    height: 30px;
    border-width: 3px;
  }
`;

const LoadingText = styled.p`
  color: #657786;
  font-size: 1rem;
  margin: 0;
  text-align: center;

  @media (max-width: 768px) {
    font-size: 0.9rem;
  }

  @media (max-width: 480px) {
    font-size: 0.85rem;
  }
`;

const Loading = ({ text = "Loading..." }) => {
  return (
    <LoadingContainer role="status" aria-live="polite">
      <Spinner />
      <LoadingText>{text}</LoadingText>
    </LoadingContainer>
  );
};

export default Loading;
