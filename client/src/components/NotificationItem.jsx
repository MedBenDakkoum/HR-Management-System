import React from "react";
import styled from "styled-components";
import { colors } from "../styles/GlobalStyle";

const NotificationWrapper = styled.div`
  background-color: white;
  padding: 10px;
  margin: 10px 0;
  border-radius: 5px;
  border: 1px solid ${colors.secondary};
`;

const NotificationItem = ({ message }) => {
  return <NotificationWrapper>{message}</NotificationWrapper>;
};

export default NotificationItem;
