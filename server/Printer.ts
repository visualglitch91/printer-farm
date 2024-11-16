import EventEmitter from "events";
import { merge } from "lodash";
import { Client as WSClient } from "rpc-websockets";
import hass from "./hass";
import fetch from "node-fetch";

interface PrinterConfig {
  key: string;
  name: string;
  host: string;
  entity_id: string;
  macros: [string, string][];
}

type MoonrakerStatus = "disconnected" | "connected";
type KlippyStatus = "disconnected" | "ready" | "shutdown";

export class Printer extends EventEmitter {
  private _config: PrinterConfig;
  private _ws: WSClient;
  private _moonrakerStatus: MoonrakerStatus = "disconnected";
  private _klippyStatus: KlippyStatus = "disconnected";
  private _state: any = null;
  private _connected = false;

  constructor(config: PrinterConfig) {
    super();

    this._config = config;

    this._ws = new WSClient(config.host.replace("http", "ws") + "/websocket", {
      autoconnect: false,
      reconnect: false,
    });

    this._ws.on("open", () => this._handleConnectionOpen());
    this._ws.on("close", () => this._handleConnectionClosed());

    this._ws.on("notify_klippy_ready", () => {
      this._setKlippyStatus("ready");
    });

    this._ws.on("notify_klippy_shutdown", () => {
      this._setKlippyStatus("shutdown");
    });

    this._ws.on("notify_klippy_disconnected", () => {
      this._setKlippyStatus("disconnected");
    });

    this._ws.on("notify_status_update", ([status]) => {
      this._patchState(status);
    });

    this._heartbeat(false);
  }

  private _heartbeat(prev?: boolean) {
    fetch(`${this._config.host}/api/server`, {
      signal: AbortSignal.timeout(500),
    })
      .then(
        (res) => res.status === 200,
        () => false
      )
      .then((online) => {
        if (prev !== online) {
          this._log("server online", online);

          try {
            if (online) {
              this._ws.connect();
            } else {
              this._ws.close();
              this._handleConnectionClosed();
            }
          } catch (err) {
            //noop
          }
        }

        setTimeout(() => this._heartbeat(online), 1500);
      });
  }

  private _setKlippyStatus(next: KlippyStatus) {
    const prev = this._klippyStatus;
    this._klippyStatus = next;

    if (prev !== "ready" && next === "ready") {
      this._handleKlippyReady();
    } else if (next !== "ready" && prev === "ready") {
      this._state = null;
    }

    this.emit("change");
  }

  private _emitChange() {
    this.emit("change");
  }

  private _log(...args: any[]) {
    console.log(`[${this._config.name}]:`, ...args);
  }

  private _patchState(partial: any) {
    this._state = merge({}, this._state, partial);
    this.emit("change");
  }

  private _handleConnectionOpen() {
    if (this._connected) {
      return;
    }

    this._log("connected");

    this._connected = true;
    this._moonrakerStatus = "connected";
    this._klippyStatus = "disconnected";

    this._ws.call("printer.info").then(
      (info: any) => this._setKlippyStatus(info.state),
      () => setTimeout(() => this._handleConnectionOpen(), 1000)
    );

    this._emitChange();
  }

  private _handleConnectionClosed() {
    if (!this._connected) {
      return;
    }

    this._log("disconnected");
    this._connected = false;
    this._moonrakerStatus = "disconnected";
    this._klippyStatus = "disconnected";
    this._state = null;
    this._emitChange();
  }

  private _handleKlippyReady() {
    this._ws
      .call("printer.objects.subscribe", {
        objects: {
          print_stats: null,
          display_status: null,
          virtual_sdcard: ["file_position", "progress"],
          gcode_move: ["gcode_position"],
          toolhead: ["estimated_print_time"],
          extruder: ["temperature", "target"],
          heater_bed: ["temperature", "target"],
        },
      })
      .then(
        (res: any) => this._patchState(res.status),
        () => setTimeout(() => this._handleKlippyReady(), 1000)
      );
  }

  getData() {
    return {
      config: this._config,
      klippy: this._klippyStatus,
      moonraker: this._moonrakerStatus,
      ...this._state,
    };
  }

  async getCurrentJob() {
    return await this._ws
      .call("server.history.list", { limit: 1 })
      .then((res: any) => res.jobs.pop());
  }

  pause() {
    return this._ws.call("printer.print.pause");
  }

  resume() {
    return this._ws.call("printer.print.resume");
  }

  cancel() {
    return this._ws.call("printer.print.cancel");
  }

  emergencyStop() {
    return this._ws.call("printer.emergency_stop");
  }

  firmwareRestart() {
    return this._ws.call("printer.firmware_restart");
  }

  klipperRestart() {
    return this._ws.call("machine.services.restart", { service: "klipper" });
  }

  setTemperature({
    heater,
    value,
  }: {
    heater: "extruder" | "heater_bed";
    value: number;
  }) {
    if (isNaN(value)) {
      throw new Error("Invalid temperature value");
    }

    if (!["extruder", "heater_bed"].includes(heater)) {
      throw new Error("Invalid heater value");
    }

    return this._ws.call("printer.gcode.script", {
      script: `SET_HEATER_TEMPERATURE HEATER=${heater} TARGET=${value}`,
    });
  }

  runMacro(macro: string) {
    const macros = this._config.macros.map((it) => it[0]);

    if (!macros.includes(macro)) {
      throw new Error("Invalid macro");
    }

    return this._ws.call("printer.gcode.script", { script: macro });
  }

  turnOn() {
    hass.service("homeassistant.turn_on", {
      entity_id: this._config.entity_id,
    });
  }

  turnOff() {
    hass.service("homeassistant.turn_off", {
      entity_id: this._config.entity_id,
    });
  }
}
