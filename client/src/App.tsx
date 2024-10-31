import "@mantine/core/styles.css";

import { useEffect, useMemo, useState } from "preact/hooks";
import { Client as WSClient } from "rpc-websockets";
import { createTheme, MantineProvider, Paper, SimpleGrid } from "@mantine/core";
import { Printer } from "./Printer";
import { PrinterData } from "./utils/types";
import "./styles.css";

const theme = createTheme({
  primaryColor: "pink",
  defaultRadius: "lg",
  components: {
    Paper: {
      defaultProps: {
        withBorder: true,
      },
    },
  },
});

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

  const printers = Object.values(state);

  return (
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <SimpleGrid cols={printers.length}>
        {printers.map((it) => (
          <Printer key={it.config.key} ws={ws} data={it} />
        ))}
      </SimpleGrid>
    </MantineProvider>
  );
}
