import { useEffect, useState } from "react";
import Socket from "socket.io-client";
import ReactModal from "react-modal";
import "./App.css";

const ENDPOINT = "http://localhost:3000";

function App() {
  const [isOpen, setIsOpen] = useState(true);
  var socket = Socket(ENDPOINT);

  useEffect(() => {
    socket.on("Mensaje ASCP", function (msg) {
      window.scrollTo(0, document.body.scrollHeight);
    });
  });

  return (
    <div className="app">
      <ReactModal isOpen={isOpen} className={"connection-modal"}>
        <div className={"connection-modal-content"}>
          <h3>Introduce la ip a conectar</h3>
          <input type="text" name="host" class="ip-input" />
          <button
            type="submit"
            class="connect-button"
            onClick={() => setIsOpen(false)}
          >
            Conectar
          </button>
        </div>
      </ReactModal>
    </div>
  );
}

export default App;
