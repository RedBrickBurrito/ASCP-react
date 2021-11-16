import { useEffect, useRef, useState } from 'react';
import Socket from 'socket.io-client';
import ReactModal from 'react-modal';
import './App.css';

function App() {
  const [ipModalOpen, setIpModalOpen] = useState(true);
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [value, setValue] = useState(' ');
  const endpoint = useRef('');
  const key = useRef('');
  const ipInputRef = useRef(null);
  const keyInputRef = useRef(null);
  const messagesRef = useRef(null);
  const socket = useRef();

  const handleIpClick = async () => {
    endpoint.current = `http://${ipInputRef.current.value}:2021`;
    await fetch(`http://localhost:2021/conectar?host=${endpoint.current}`);
    setIpModalOpen(false);
    setKeyModalOpen(true);
  };

  const handleKeyClick = () => {
    key.current = keyInputRef.current.value;
    fetch('http://localhost:2021/enviar_mensaje', {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({ function: 2, data: key.current }),
    });
    setKeyModalOpen(false);
  };

  const submitMessage = async (e) => {
    e.preventDefault();
    await fetch('http://localhost:2021/enviar_mensaje', {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({ function: 1, data: value }),
    });
    addMessageToList(value);
    setValue('');
  };

  const addMessageToList = (message) => {
    const p = document.createElement('p');
    p.innerHTML = message;
    messagesRef.current.appendChild(p);
  };

  useEffect(() => {
    socket.current = Socket('http://localhost:2021');
    socket.current.on('recibir-mensaje', (msg) => {
      addMessageToList(msg.data);
    });
  }, []);

  return (
    <div className="app">
      <ReactModal isOpen={ipModalOpen} className={'connection-modal'}>
        <div className={'connection-modal-content'}>
          <h3>Introduce la ip a conectar</h3>
          <input
            ref={ipInputRef}
            type="text"
            id="host"
            name="host"
            className="ip-input"
          />
          <button
            type="submit"
            className="connect-button"
            onClick={handleIpClick}
          >
            Conectar
          </button>
        </div>
      </ReactModal>
      <ReactModal isOpen={keyModalOpen} className={'connection-modal'}>
        <div className={'connection-modal-content'}>
          <h3>Introduce la llave para encriptar</h3>
          <input
            ref={keyInputRef}
            type="text"
            id="key"
            name="key"
            maxLength={8}
            className="ip-input"
          />
          <button
            type="submit"
            className="connect-button"
            onClick={handleKeyClick}
          >
            Enviar llave
          </button>
        </div>
      </ReactModal>
      <div className={'message-ui'}>
        <div ref={messagesRef}></div>
        <form onSubmit={submitMessage}>
          <input
            autoFocus
            value={value}
            placeholder="Type your message"
            onChange={(e) => {
              setValue(e.currentTarget.value);
            }}
          />
        </form>
      </div>
    </div>
  );
}

export default App;
