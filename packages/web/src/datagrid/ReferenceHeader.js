import React from 'react';
import ToolbarButton from '../widgets/ToolbarButton';
import styled from 'styled-components';
import { ReferenceIcon } from '../icons';
import theme from '../theme';

const Container = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ddeeee;
  height: ${theme.toolBar.height}px;
  min-height: ${theme.toolBar.height}px;
  overflow: hidden;
  border-top: 1px solid #ccc;
  border-bottom: 1px solid #ccc;
`;

const Header = styled.div`
  font-weight: bold;
  margin-left: 10px;
  display: flex;
`;

const HeaderText = styled.div`
  margin-left: 10px;
`;

export default function ReferenceHeader({ reference, onClose }) {
  return (
    <Container>
      <Header>
        <ReferenceIcon />
        <HeaderText>
          {reference.pureName} [{reference.columns.map((x) => x.refName).join(', ')}] = master [
          {reference.columns.map((x) => x.baseName).join(', ')}]
        </HeaderText>
      </Header>
      <ToolbarButton icon="fas fa-times" onClick={onClose} patchY={6}>
        Close
      </ToolbarButton>
    </Container>
  );
}