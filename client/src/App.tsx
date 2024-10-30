import { useEffect, useMemo, useState } from "preact/hooks";
import { Client as WSClient } from "rpc-websockets";
import { Printer } from "./Printer";
import { PrinterData } from "./utils/types";
import "./styles.css";

export default function App() {
  const [state, setState] = useState<Record<string, PrinterData>>({});

  const ws = useMemo(
    () =>
      new WSClient(window.location.origin.replace("http", "ws"), {
        reconnect_interval: 3000,
        max_reconnects: 0,
      }),
    []
  );

  useEffect(() => {
    ws.on("open", () => {
      ws.subscribe("printer_updated");
      ws.call("get_printers").then((data: any) => setState(data));
    });

    ws.on("printer_updated", (data: any) => {
      setState((state) => ({ ...state, ...data }));
    });

    ws.on("close", () => setState({}));

    return () => ws.close();
  }, [ws]);

  return (
    <div className="columns">
      {Object.values(state).map((it) => (
        <div key={it.config.key} className="column">
          <Printer ws={ws} data={it} />
        </div>
      ))}
    </div>
  );
}
