/**
 * DM Eye live link — short codes + MQTT pub/sub over a public broker.
 * Players publish retained character snapshots; the DM Eye app subscribes by code.
 */
(function (global) {
  const TOPIC_PREFIX = "general-questions/dmeye/v1/";
  const BROKER_URLS = [
    "wss://broker.emqx.io:8084/mqtt",
    "wss://broker.hivemq.com:8884/mqtt",
  ];
  const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const CODE_LEN = 6;
  const KEEP_ALIVE_SEC = 30;

  function generateCode() {
    const bytes = new Uint8Array(CODE_LEN);
    crypto.getRandomValues(bytes);
    let out = "";
    for (let i = 0; i < CODE_LEN; i++) out += CODE_CHARS[bytes[i] % CODE_CHARS.length];
    return out;
  }

  function normalizeCode(code) {
    return String(code || "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, CODE_LEN);
  }

  function isValidCode(code) {
    return /^[A-Z0-9]{6}$/.test(normalizeCode(code));
  }

  function topicFor(code) {
    return TOPIC_PREFIX + normalizeCode(code);
  }

  function abilityMod(score) {
    return Math.floor((Number(score) - 10) / 2);
  }

  function snapshotFromState(state, source) {
    const abilities = {
      str: Number(state.abilities?.str) || 10,
      dex: Number(state.abilities?.dex) || 10,
      con: Number(state.abilities?.con) || 10,
      int: Number(state.abilities?.int) || 10,
      wis: Number(state.abilities?.wis) || 10,
      cha: Number(state.abilities?.cha) || 10,
    };
    const snap = {
      v: 1,
      source: source || "unknown",
      name: String(state.name || "Adventurer").slice(0, 48),
      level: Math.max(1, Math.min(20, Number(state.level) || 1)),
      className: String(state.className || "").slice(0, 48),
      subclass: String(state.subclass || "").slice(0, 48),
      race: String(state.race || "").slice(0, 48),
      hp: {
        current: Number(state.hp?.current) || 0,
        max: Math.max(1, Number(state.hp?.max) || 1),
        temp: Math.max(0, Number(state.hp?.temp) || 0),
      },
      ac: Number(state.ac) || 10,
      speed: Number(state.speed) || 30,
      initiativeBonus: Number(state.initiativeBonus) || 0,
      abilities,
      deathSaves: {
        success: (state.deathSaves?.success || [false, false, false]).slice(0, 3).map(Boolean),
        fail: (state.deathSaves?.fail || [false, false, false]).slice(0, 3).map(Boolean),
      },
      hitDice: String(state.hitDice || "").slice(0, 24),
      updatedAt: Number(state.updatedAt) || Date.now(),
    };
    if (state.mana != null || state.maxMana != null) {
      snap.mana = Number(state.mana) || 0;
      snap.maxMana = Math.max(1, Number(state.maxMana) || 100);
    }
    return snap;
  }

  /* ---------- Minimal MQTT 3.1.1 over WebSocket ---------- */

  function encodeLength(len) {
    const out = [];
    do {
      let digit = len % 128;
      len = Math.floor(len / 128);
      if (len > 0) digit |= 0x80;
      out.push(digit);
    } while (len > 0);
    return out;
  }

  function utf8(str) {
    return new TextEncoder().encode(str);
  }

  function packet(typeFlags, variable) {
    const lenBytes = encodeLength(variable.length);
    const out = new Uint8Array(1 + lenBytes.length + variable.length);
    out[0] = typeFlags;
    out.set(lenBytes, 1);
    out.set(variable, 1 + lenBytes.length);
    return out;
  }

  function withString(str) {
    const b = utf8(str);
    const out = new Uint8Array(2 + b.length);
    out[0] = (b.length >> 8) & 0xff;
    out[1] = b.length & 0xff;
    out.set(b, 2);
    return out;
  }

  function concatBytes(parts) {
    const total = parts.reduce((n, p) => n + p.length, 0);
    const out = new Uint8Array(total);
    let off = 0;
    for (const p of parts) {
      out.set(p, off);
      off += p.length;
    }
    return out;
  }

  function makeConnect(clientId) {
    const proto = withString("MQTT");
    const rest = new Uint8Array([
      0x04, // protocol level 4
      0x02, // clean session
      (KEEP_ALIVE_SEC >> 8) & 0xff,
      KEEP_ALIVE_SEC & 0xff,
    ]);
    return packet(0x10, concatBytes([proto, rest, withString(clientId)]));
  }

  function makePublish(topic, payload, { retain = false } = {}) {
    const flags = 0x30 | (retain ? 0x01 : 0);
    const body = utf8(payload);
    return packet(flags, concatBytes([withString(topic), body]));
  }

  function makeSubscribe(topic, packetId) {
    const id = new Uint8Array([(packetId >> 8) & 0xff, packetId & 0xff]);
    const qos = new Uint8Array([0]);
    return packet(0x82, concatBytes([id, withString(topic), qos]));
  }

  function makeUnsubscribe(topic, packetId) {
    const id = new Uint8Array([(packetId >> 8) & 0xff, packetId & 0xff]);
    return packet(0xa2, concatBytes([id, withString(topic)]));
  }

  function makePing() {
    return new Uint8Array([0xc0, 0x00]);
  }

  function parsePackets(buffer, onPacket) {
    let offset = 0;
    while (offset < buffer.length) {
      if (offset + 1 >= buffer.length) break;
      const typeFlags = buffer[offset];
      let multiplier = 1;
      let len = 0;
      let i = 1;
      while (true) {
        if (offset + i >= buffer.length) return buffer.slice(offset);
        const encoded = buffer[offset + i];
        len += (encoded & 127) * multiplier;
        multiplier *= 128;
        i += 1;
        if ((encoded & 128) === 0) break;
        if (i > 4) return new Uint8Array(0);
      }
      const headerLen = i;
      if (offset + headerLen + len > buffer.length) return buffer.slice(offset);
      const variable = buffer.slice(offset + headerLen, offset + headerLen + len);
      offset += headerLen + len;
      const type = typeFlags >> 4;
      if (type === 2) {
        onPacket({ type: "connack", returnCode: variable[1] || 0 });
      } else if (type === 3) {
        const tLen = (variable[0] << 8) | variable[1];
        const topic = new TextDecoder().decode(variable.slice(2, 2 + tLen));
        const qos = (typeFlags >> 1) & 0x03;
        const payloadStart = 2 + tLen + (qos > 0 ? 2 : 0);
        const payload = new TextDecoder().decode(variable.slice(payloadStart));
        onPacket({ type: "publish", topic, payload });
      } else if (type === 9) {
        onPacket({ type: "suback" });
      } else if (type === 13) {
        onPacket({ type: "pingresp" });
      }
    }
    return new Uint8Array(0);
  }

  class MqttClient {
    constructor({ onStatus, onMessage } = {}) {
      this.onStatus = onStatus || (() => {});
      this.onMessage = onMessage || (() => {});
      this.ws = null;
      this.connected = false;
      this.wantOpen = false;
      this.brokerIndex = 0;
      this.packetId = 1;
      this.pending = [];
      this.subs = new Set();
      this.buf = new Uint8Array(0);
      this.pingTimer = null;
      this.reconnectTimer = null;
      this.clientId = "dmeye-" + Math.random().toString(36).slice(2, 10);
    }

    connect() {
      this.wantOpen = true;
      this._open();
    }

    _open() {
      if (!this.wantOpen) return;
      this._clearTimers();
      if (this.ws) {
        try {
          this.ws.onclose = null;
          this.ws.close();
        } catch (_) {}
      }
      const url = BROKER_URLS[this.brokerIndex % BROKER_URLS.length];
      this.onStatus("connecting");
      let ws;
      try {
        ws = new WebSocket(url, ["mqtt"]);
      } catch (err) {
        this.onStatus("error");
        this._scheduleReconnect();
        return;
      }
      this.ws = ws;
      ws.binaryType = "arraybuffer";
      ws.onopen = () => {
        ws.send(makeConnect(this.clientId));
      };
      ws.onmessage = (ev) => {
        const chunk = new Uint8Array(ev.data);
        const merged = new Uint8Array(this.buf.length + chunk.length);
        merged.set(this.buf);
        merged.set(chunk, this.buf.length);
        this.buf = parsePackets(merged, (pkt) => this._onPacket(pkt));
      };
      ws.onerror = () => {
        this.onStatus("error");
      };
      ws.onclose = () => {
        this.connected = false;
        this.onStatus("offline");
        this._scheduleReconnect();
      };
    }

    _onPacket(pkt) {
      if (pkt.type === "connack") {
        if (pkt.returnCode !== 0) {
          this.onStatus("error");
          try {
            this.ws.close();
          } catch (_) {}
          return;
        }
        this.connected = true;
        this.onStatus("online");
        this.pingTimer = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(makePing());
          }
        }, (KEEP_ALIVE_SEC * 1000) / 2);
        for (const topic of this.subs) {
          this._sendSubscribe(topic);
        }
        const queue = this.pending.splice(0);
        for (const item of queue) this._sendRaw(item);
        return;
      }
      if (pkt.type === "publish") {
        this.onMessage(pkt.topic, pkt.payload);
      }
    }

    _sendRaw(bytes) {
      if (this.ws && this.ws.readyState === WebSocket.OPEN && this.connected) {
        this.ws.send(bytes);
      } else {
        this.pending.push(bytes);
      }
    }

    _nextId() {
      this.packetId = (this.packetId % 65000) + 1;
      return this.packetId;
    }

    _sendSubscribe(topic) {
      this._sendRaw(makeSubscribe(topic, this._nextId()));
    }

    publish(topic, payload, opts) {
      this._sendRaw(makePublish(topic, payload, opts));
    }

    subscribe(topic) {
      this.subs.add(topic);
      if (this.connected) this._sendSubscribe(topic);
    }

    unsubscribe(topic) {
      this.subs.delete(topic);
      if (this.connected) {
        this._sendRaw(makeUnsubscribe(topic, this._nextId()));
      }
    }

    _scheduleReconnect() {
      if (!this.wantOpen) return;
      this._clearTimers();
      this.brokerIndex += 1;
      this.reconnectTimer = setTimeout(() => this._open(), 1800);
    }

    _clearTimers() {
      if (this.pingTimer) clearInterval(this.pingTimer);
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      this.pingTimer = null;
      this.reconnectTimer = null;
    }

    disconnect() {
      this.wantOpen = false;
      this._clearTimers();
      this.connected = false;
      this.subs.clear();
      this.pending = [];
      if (this.ws) {
        try {
          this.ws.onclose = null;
          this.ws.close();
        } catch (_) {}
      }
      this.ws = null;
      this.onStatus("offline");
    }
  }

  class DmLinkPublisher {
    constructor({ source, onStatus } = {}) {
      this.source = source || "unknown";
      this.code = "";
      this.lastSnapshot = null;
      this.client = new MqttClient({
        onStatus: (s) => {
          if (typeof onStatus === "function") onStatus(s);
        },
      });
    }

    start(code) {
      const normalized = normalizeCode(code);
      if (!isValidCode(normalized)) throw new Error("Invalid link code");
      this.code = normalized;
      this.client.connect();
      if (this.lastSnapshot) this.publish(this.lastSnapshot);
    }

    publish(snapshot) {
      this.lastSnapshot = snapshot;
      if (!this.code) return;
      const payload = JSON.stringify({
        ...snapshot,
        code: this.code,
        source: snapshot.source || this.source,
        updatedAt: snapshot.updatedAt || Date.now(),
      });
      this.client.publish(topicFor(this.code), payload, { retain: true });
    }

    stop() {
      if (this.code) {
        // Clear retained message so stale sheets don't linger forever.
        this.client.publish(topicFor(this.code), "", { retain: true });
      }
      this.client.disconnect();
      this.code = "";
      this.lastSnapshot = null;
    }
  }

  class DmLinkWatcher {
    constructor({ onSnapshot, onStatus } = {}) {
      this.onSnapshot = onSnapshot || (() => {});
      this.codes = new Set();
      this.client = new MqttClient({
        onStatus: (s) => {
          if (typeof onStatus === "function") onStatus(s);
        },
        onMessage: (topic, payload) => this._handle(topic, payload),
      });
      this.client.connect();
    }

    watch(code) {
      const normalized = normalizeCode(code);
      if (!isValidCode(normalized)) throw new Error("Invalid link code");
      if (this.codes.has(normalized)) return normalized;
      this.codes.add(normalized);
      this.client.subscribe(topicFor(normalized));
      return normalized;
    }

    unwatch(code) {
      const normalized = normalizeCode(code);
      if (!this.codes.has(normalized)) return;
      this.codes.delete(normalized);
      this.client.unsubscribe(topicFor(normalized));
    }

    _handle(topic, payload) {
      if (!payload) return;
      let data;
      try {
        data = JSON.parse(payload);
      } catch {
        return;
      }
      if (!data || typeof data !== "object") return;
      const code = normalizeCode(data.code || topic.split("/").pop());
      if (!this.codes.has(code)) return;
      this.onSnapshot(code, data);
    }

    stop() {
      this.client.disconnect();
      this.codes.clear();
    }
  }

  global.DmEyeLink = {
    generateCode,
    normalizeCode,
    isValidCode,
    topicFor,
    abilityMod,
    snapshotFromState,
    DmLinkPublisher,
    DmLinkWatcher,
    BROKER_URLS,
  };
})(typeof window !== "undefined" ? window : globalThis);
