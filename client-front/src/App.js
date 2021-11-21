import { useEffect, useRef, useState } from 'react';
import Socket from 'socket.io-client';
import ReactModal from 'react-modal';
import './App.css';

const ENDPOINT = 'http://localhost:2021';

function App() {
  const [ipModalOpen, setIpModalOpen] = useState(true);
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [value, setValue] = useState(' ');
  const [whoAmI, setWhoAmI] = useState('');
  const endpoint = useRef('');
  const secretKey = useRef('');
  const key = useRef('');
  const ipInputRef = useRef(null);
  const keyInputRef = useRef(null);
  const messagesRef = useRef(null);
  const socket = useRef();

  const handleIpClick = async () => {
    endpoint.current = `http://${ipInputRef.current.value}:2021`;
    await fetch(`${ENDPOINT}/conectar?host=${endpoint.current}`);
    setIpModalOpen(false);
    setKeyModalOpen(true);
  };

  const handleKeyComp = async () => {
    secretKey.current = keyInputRef.current.value;
    const response = await fetch(ENDPOINT + '/key_comp', {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        function: 3,
        data: { q: 2426697107, a: 17123207, y: secretKey.current },
      }),
    });
    if (response.status === 400) {
      const text = await response.text();
      alert(text);
      return;
    }
    setKeyModalOpen(false);
  };

  const handleInitComm = async () => {
    secretKey.current = keyInputRef.current.value;
    const response = await fetch(ENDPOINT + '/init_comm', {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      method: 'POST',
      body: JSON.stringify({
        function: 2,
        data: { q: 2426697107, a: 17123207, y: secretKey.current },
      }),
    });
    if (response.status === 400) {
      const text = await response.text();
      alert(text);
      return;
    }
    setWhoAmI('A');
    setKeyModalOpen(false);
  };

  const submitMessage = async (e) => {
    e.preventDefault();
    // key = the key both parties have agreed on through diffie-hellman
    if (!key.current) {
      alert('Aun no se recibe una llave del otro lado :(');
      return;
    }
    await fetch('http://localhost:2021/enviar_mensaje', {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({ function: 1, data: value }),
    });
    clientSentMessage(value);
    setValue("");
  };

  const clientSentMessage = (message) => {
    const p = document.createElement("p");
    p.innerHTML = message;
    p.className = "message-bubble-client";
    messagesRef.current.appendChild(p);
  };

  const addMessageToList = (message) => {
    const p = document.createElement("p");
    p.innerHTML = message;
    p.className = "message-bubble-received";
    messagesRef.current.appendChild(p);
  };

  useEffect(() => {
    socket.current = Socket("http://localhost:2021");
    socket.current.on("recibir-mensaje", (msg) => {
      addMessageToList(msg.data);
    });
    socket.current.on("set-bob", (publicKey) => {
      setWhoAmI("B");
      key.current = publicKey;
    });
    socket.current.on('shared-key', (sharedKey) => {
      console.log('se recibio la llave compartida ', sharedKey);
      key.current = sharedKey;
    });
  }, []);

  return (
    <div className="app">
      <ReactModal isOpen={ipModalOpen} className={"connection-modal"}>
        <div className={"connection-modal-content"}>
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
      <ReactModal isOpen={keyModalOpen} className={"connection-modal"}>
        <div className={"connection-modal-content"}>
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
            onClick={whoAmI ? handleKeyComp : handleInitComm}
          >
            Enviar llave
          </button>
        </div>
      </ReactModal>
      <div className={"message-ui"}>
        <div ref={messagesRef} className="message-bubble"></div>
      </div>
    <div style={{bottom: 0, position: 'fixed', width: "100%", backgroundColor: "#0000007e"}}>
    <form onSubmit={submitMessage}>
          <input
            className="input-message-box"
            autoFocus
            value={value}
            placeholder="Type your message"
            onChange={(e) => {
              setValue(e.currentTarget.value);
            }}
          />
          <button
            type="submit"
            className="send-message-button"
            >
              Send
            </button>
        </form>
      </div>
      </div>
  );
}

export default App;
