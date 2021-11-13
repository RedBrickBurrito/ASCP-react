import { useEffect, useRef, useState } from 'react';
import Socket from 'socket.io-client';
import ReactModal from 'react-modal';
import './App.css';

function App() {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState([]);
  const [value, setValue] = useState(' ');
  const endpoint = useRef('');
  const inputRef = useRef(null);
  const messagesRef = useRef(null);
  const socket = useRef();

  const handleClick = () => {
    endpoint.current = `http://${inputRef.current.value}:2021`;
    setIsOpen(false);
    fetch(`http://localhost:2021/conectar?host=${endpoint.current}`);
  };

  const submitMessage = (e) => {
    e.preventDefault();
    fetch('http://localhost:2021/enviar_mensaje', {
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
      console.log('se recibio un mensaje', typeof msg);
      addMessageToList(msg.data);
    });
  }, []);

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
