import React from 'react';
import ModalBase from './ModalBase';
import { FormTextField, FormSubmit, FormArchiveFolderSelect, FormRow, FormLabel } from '../utility/forms';
import { Formik, Form } from 'formik';
import styled from 'styled-components';
import ModalHeader from './ModalHeader';
import ModalContent from './ModalContent';
import ModalFooter from './ModalFooter';

const SelectWrapper = styled.div`
  width: 150px;
  position: relative;
  flex: 1;
`;

export default function SaveArchiveModal({ file = 'new-table', folder = 'default', modalState, onSave }) {
  const handleSubmit = async (values) => {
    const { file, folder } = values;
    modalState.close();
    if (onSave) onSave(folder, file);
  };
  return (
    <ModalBase modalState={modalState}>
      <ModalHeader modalState={modalState}>Save to archive</ModalHeader>
      <Formik onSubmit={handleSubmit} initialValues={{ file, folder }}>
        <Form>
          <ModalContent>
            {/* <Label>Archive folder</Label> */}
            <FormRow>
              <FormLabel>Folder</FormLabel>
              <SelectWrapper>
                <FormArchiveFolderSelect name="folder" />
              </SelectWrapper>
            </FormRow>
            <FormTextField label="File name" name="file" />
          </ModalContent>
          <ModalFooter>
            <FormSubmit text="Save" />
          </ModalFooter>
        </Form>
      </Formik>
    </ModalBase>
  );
}