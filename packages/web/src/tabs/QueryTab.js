import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import axios from '../utility/axios';
import { useConnectionInfo } from '../utility/metadataLoaders';
import SqlEditor from '../sqleditor/SqlEditor';
import { useUpdateDatabaseForTab, useSetOpenedTabs, useOpenedTabs } from '../utility/globalState';
import QueryToolbar from '../query/QueryToolbar';
import SessionMessagesView from '../query/SessionMessagesView';
import { TabPage } from '../widgets/TabControl';
import ResultTabs from '../sqleditor/ResultTabs';
import { VerticalSplitter } from '../widgets/Splitter';
import keycodes from '../utility/keycodes';
import { changeTab } from '../utility/common';
import useSocket from '../utility/SocketProvider';
import SaveSqlFileModal from '../modals/SaveSqlFileModal';
import useModalState from '../modals/useModalState';

export default function QueryTab({ tabid, conid, database, tabVisible, toolbarPortalRef, initialScript, storageKey }) {
  const localStorageKey = storageKey || `sql_${tabid}`;
  const [queryText, setQueryText] = React.useState(() => localStorage.getItem(localStorageKey) || initialScript || '');
  const queryTextRef = React.useRef(queryText);
  const [sessionId, setSessionId] = React.useState(null);
  const [executeNumber, setExecuteNumber] = React.useState(0);
  const setOpenedTabs = useSetOpenedTabs();
  const openedTabs = useOpenedTabs();
  const socket = useSocket();
  const [busy, setBusy] = React.useState(false);
  const saveSqlFileModalState = useModalState();

  const saveToStorage = React.useCallback(() => localStorage.setItem(localStorageKey, queryTextRef.current), [
    localStorageKey,
    queryTextRef,
  ]);
  const saveToStorageDebounced = React.useMemo(() => _.debounce(saveToStorage, 5000), [saveToStorage]);

  React.useEffect(() => {
    window.addEventListener('beforeunload', saveToStorage);
    return () => {
      saveToStorage();
      window.removeEventListener('beforeunload', saveToStorage);
    };
  }, []);

  const handleSessionDone = React.useCallback(() => {
    setBusy(false);
  }, []);

  React.useEffect(() => {
    if (sessionId && socket) {
      socket.on(`session-done-${sessionId}`, handleSessionDone);
      return () => {
        socket.off(`session-done-${sessionId}`, handleSessionDone);
      };
    }
  }, [sessionId, socket]);

  React.useEffect(() => {
    if (!storageKey)
      changeTab(tabid, setOpenedTabs, (tab) => ({
        ...tab,
        props: {
          ...tab.props,
          storageKey: localStorageKey,
        },
      }));
  }, [storageKey]);

  React.useEffect(() => {
    changeTab(tabid, setOpenedTabs, (tab) => ({ ...tab, busy }));
  }, [busy]);

  const editorRef = React.useRef(null);

  useUpdateDatabaseForTab(tabVisible, conid, database);
  const connection = useConnectionInfo({ conid });

  const handleChange = (text) => {
    if (text != null) queryTextRef.current = text;
    setQueryText(text);
    saveToStorageDebounced();
  };

  const handleExecute = async () => {
    setExecuteNumber((num) => num + 1);
    const selectedText = editorRef.current.editor.getSelectedText();

    let sesid = sessionId;
    if (!sesid) {
      const resp = await axios.post('sessions/create', {
        conid,
        database,
      });
      sesid = resp.data.sesid;
      setSessionId(sesid);
    }
    setBusy(true);
    await axios.post('sessions/execute-query', {
      sesid,
      sql: selectedText || queryText,
    });
  };

  const handleCancel = () => {
    axios.post('sessions/cancel', {
      sesid: sessionId,
    });
  };

  const handleKeyDown = (data, hash, keyString, keyCode, event) => {
    if (keyCode == keycodes.f5) {
      event.preventDefault();
      handleExecute();
    }
  };

  const handleMesageClick = (message) => {
    // console.log('EDITOR', editorRef.current.editor);
    if (editorRef.current && editorRef.current.editor) {
      editorRef.current.editor.gotoLine(message.line);
    }
  };

  return (
    <>
      <VerticalSplitter>
        <SqlEditor
          value={queryText}
          onChange={handleChange}
          tabVisible={tabVisible}
          engine={connection && connection.engine}
          onKeyDown={handleKeyDown}
          editorRef={editorRef}
        />
        <ResultTabs sessionId={sessionId} executeNumber={executeNumber}>
          <TabPage label="Messages" key="messages">
            <SessionMessagesView
              sessionId={sessionId}
              onMessageClick={handleMesageClick}
              executeNumber={executeNumber}
            />
          </TabPage>
        </ResultTabs>
      </VerticalSplitter>
      {toolbarPortalRef &&
        toolbarPortalRef.current &&
        tabVisible &&
        ReactDOM.createPortal(
          <QueryToolbar
            isDatabaseDefined={conid && database}
            execute={handleExecute}
            busy={busy}
            cancel={handleCancel}
            save={saveSqlFileModalState.open}
          />,
          toolbarPortalRef.current
        )}
      <SaveSqlFileModal
        modalState={saveSqlFileModalState}
        storageKey={localStorageKey}
        name={openedTabs.find((x) => x.tabid == tabid).title}
        onSave={(name) => changeTab(tabid, setOpenedTabs, (tab) => ({ ...tab, title: name }))}
      />
    </>
  );
}