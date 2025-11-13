import React from "react";
import styled from "styled-components";

const PopupOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  padding: 20px;
`;

const PopupContent = styled.div`
  background: #fff;
  padding: 20px 30px;
  border-radius: 10px;
  min-width: 300px;
  max-width: 500px;
  text-align: center;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);

  @media (max-width: 768px) {
    min-width: 280px;
    padding: 18px 25px;
  }

  @media (max-width: 480px) {
    min-width: 260px;
    padding: 16px 20px;
    margin: 10px;
  }
`;

const PopupTitle = styled.h3`
  color: ${(props) => (props.type === "success" ? "#28a745" : "#dc3545")};
  margin: 0 0 10px 0;
  font-size: 1.2rem;

  @media (max-width: 480px) {
    font-size: 1.1rem;
  }
`;

const PopupMessage = styled.p`
  margin: 0 0 15px 0;
  font-size: 1rem;
  line-height: 1.4;

  @media (max-width: 480px) {
    font-size: 0.9rem;
  }
`;

const PopupButton = styled.button`
  margin-top: 15px;
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  background: ${(props) => (props.type === "success" ? "#28a745" : "#dc3545")};
  color: #fff;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  @media (max-width: 480px) {
    padding: 10px 20px;
    font-size: 0.85rem;
  }
`;

const Popup = ({ show, type, message, onClose }) => {
  if (!show) return null;

  return (
    <PopupOverlay onClick={onClose}>
      <PopupContent onClick={(e) => e.stopPropagation()}>
        <PopupTitle type={type}>
          {type === "success" ? "Success" : "Error"}
        </PopupTitle>
        <PopupMessage>{message}</PopupMessage>
        <PopupButton type={type} onClick={onClose}>
          OK
        </PopupButton>
      </PopupContent>
    </PopupOverlay>
  );
};

export default Popup;
