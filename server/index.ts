import cors from "cors";
import http from "http";
import express from "express";
import ViteExpress from "vite-express";
import fetch from "node-fetch";
import { get, mapValues } from "lodash";
import { Server as WSServer } from "rpc-websockets";
import config from "../config.json";
import { Printer } from "./Printer";

const app = express();
const server = http.createServer(app);
const { port } = config;

app.use(cors());
app.use(express.json());

ViteExpress.config({
  mode: process.env.NODE_ENV === "production" ? "production" : "development",
});

ViteExpress.bind(app, server);

const wsServer = new WSServer({ server });

wsServer.event("printer_updated");

const printers = mapValues(config.printers, (value, key) => {
  const printer = new Printer({ key, ...value });

  printer.on("change", () => {
    wsServer.emit("printer_updated", { [key]: printer.getData() });
  });

  return printer;
});

function getPrinter(key: string) {
  const printer = get(printers, key) as Printer | undefined;

  if (!printer) {
    throw new Error("Printer not found");
  }

  return printer;
}

wsServer.register("get_printers", () => {
  return mapValues(printers, (it) => it.getData());
});

wsServer.register("get_current_job_metadata", ({ printer }) => {
  return getPrinter(printer).getCurrentJobMetadata();
});

wsServer.register("pause_print", ({ printer }) => {
  return getPrinter(printer).pause();
});

wsServer.register("resume_print", ({ printer }) => {
  return getPrinter(printer).resume();
});

wsServer.register("cancel_print", ({ printer }) => {
  return getPrinter(printer).cancel();
});

wsServer.register("set_temperature", ({ printer, heater, value }) => {
  return getPrinter(printer).setTemperature({ heater, value });
});

wsServer.register("run_macro", ({ printer, macro }) => {
  return getPrinter(printer).runMacro(macro);
});

wsServer.register("emergency_stop", ({ printer }) => {
  return getPrinter(printer).emergencyStop();
});

wsServer.register("firmware_restart", ({ printer }) => {
  return getPrinter(printer).firmwareRestart();
});

wsServer.register("klipper_restart", ({ printer }) => {
  return getPrinter(printer).klipperRestart();
});

wsServer.register("turn_on", ({ printer }) => {
  return getPrinter(printer).turnOn();
});

wsServer.register("turn_off", ({ printer }) => {
  return getPrinter(printer).turnOff();
});

app.get("/printers/:key/thumbnail/:path", (req, res) => {
  try {
    const printer = getPrinter(req.params.key);
    const { host } = printer.getData().config;
    const url = `${host}/server/files/gcodes/.thumbs/${req.params.path}`;

    return fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch thumbnail");
        }

        return response.arrayBuffer();
      })
      .then((arrayBuffer) => res.send(Buffer.from(arrayBuffer)))
      .catch((error) => {
        console.error(error);
        res.status(500).send("Failed to fetch thumbnail");
      });
  } catch (err) {
    return res.status(404).send("Printer not found");
  }
});

server.listen({ host: "0.0.0.0", port }, () => {
  console.log(`Server listening at ${port}`);
});

const shutdown = () => process.exit();

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
