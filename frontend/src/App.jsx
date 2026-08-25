import { useEffect, useState } from "react";
import { checkBackendHealth } from "./api";

function App() {
  const [backendStatus, setBackendStatus] = useState("checking");

  useEffect(() => {
    checkBackendHealth()
      .then((data) => {
        if (data.status === "healthy") {
          setBackendStatus("connected");
        } else {
          setBackendStatus("error");
        }
      })
      .catch(() => {
        setBackendStatus("error");
      });
  }, []);

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>AI DevOps Platform</h1>

      <h2>System Status</h2>

      {backendStatus === "checking" && <p>Checking backend...</p>}

      {backendStatus === "connected" && (
        <p style={{ color: "green" }}>● Backend Connected</p>
      )}

      {backendStatus === "error" && (
        <p style={{ color: "red" }}>● Backend Connection Failed</p>
      )}
    </div>
  );
}

export default App;
