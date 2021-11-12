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
    // fetch(`http://localhost:2021/conectar?host=http://${endpoint.current}`);
  };

  const submitMessage = (e) => {
    e.preventDefault();
    console.log(socket);
    socket.current.emit('Mensaje ASCP', value);
    setValue('');
  };

  useEffect(() => {
    socket.current = Socket('http://localhost:2021');
    socket.current.on('Mensaje ASCP', (msg) => {
      console.log('se recibio un mensaje', typeof msg);
      const p = document.createElement('p');
      p.innerHTML = msg;
      messagesRef.current.appendChild(p);
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
