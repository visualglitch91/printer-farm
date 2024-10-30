import {
  Connection,
  callService,
  createLongLivedTokenAuth,
  createConnection,
} from "home-assistant-js-websocket";
import fetch from "node-fetch";
import config from "../config.json";
import { sleep } from "./utils";

const wnd = globalThis;

if (!wnd.WebSocket) {
  wnd.WebSocket = require("ws");
}

class HomeAssistant {
  private _haRunning = false;
  private _host: string;
  private _token: string;
  private _connection: Connection | null = null;

  constructor({ host, token }: { host: string; token: string }) {
    this._host = host;
    this._token = token;
    this._connect();
  }

  private _log(...args: any[]) {
    console.log("[HomeAssistant]:", ...args);
  }

  getConnection() {
    if (!this._connection) {
      throw new Error("Connection not established");
    }

    return this._connection;
  }

  private async _connect() {
    if (this._connection) {
      throw new Error("Connection already established");
    }

    const waitForHomeAssistant = async () => {
      while (!this._haRunning) {
        try {
          this._log("checking if server is running...");

          const state = await fetch(this._host + "/api/config", {
            headers: { Authorization: `Bearer ${this._token}` },
            signal: AbortSignal.timeout(5000),
          })
            .then((res) => res.json())
            .then((res: any) => res.state);

          if (state === "RUNNING") {
            this._haRunning = true;
            break;
          }
        } catch (err) {
          //noop
        }

        await sleep(1000);
      }
    };

    await waitForHomeAssistant();

    const auth = createLongLivedTokenAuth(this._host, this._token);

    this._connection = await createConnection({ auth });

    this._connection.addEventListener("disconnected", () => {
      this._haRunning = false;
      this._log("disconnected");
      this.getConnection().suspendReconnectUntil(waitForHomeAssistant());
    });
  }

  service(domainAndService: string, data: any) {
    const domain = domainAndService.split(".")[0];
    const service = domainAndService.split(".")[1];
    return callService(this.getConnection(), domain, service, data).then(
      () => {},
      (err) => console.error(`Error calling service ${domainAndService}:`, err)
    );
  }
}

const hass = new HomeAssistant({
  host: config.hass.host,
  token: config.hass.token,
});

export default hass;
