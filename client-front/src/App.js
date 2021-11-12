import { useEffect, useRef, useState } from 'react';
import Socket from 'socket.io-client';
import ReactModal from 'react-modal';
import './App.css';

function App() {
  const [isOpen, setIsOpen] = useState(true);
  const endpoint = useRef('');
  const inputRef = useRef(null);

  const handleClick = () => {
    endpoint.current = `http://${inputRef.current.value}:2021`;
    fetch(`http://localhost:2021/conectar?host=http://${endpoint.current}`);
  };

  useEffect(() => {
    const socket = Socket();
    socket.on('Mensaje ASCP', function (msg) {
      window.scrollTo(0, document.body.scrollHeight);
    });
  });

  return (
    <div className="app">
      <ReactModal isOpen={isOpen} className={'connection-modal'}>
        <div className={'connection-modal-content'}>
          <h3>Introduce la ip a conectar</h3>
          <input ref={inputRef} type="text" name="host" className="ip-input" />
          <button
            type="submit"
            className="connect-button"
            onClick={handleClick}
          >
            Conectar
          </button>
        </div>
      </ReactModal>
      <div className={'message-ui'}></div>
    </div>
  );
}

export default App;
