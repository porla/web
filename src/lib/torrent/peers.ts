import type { Peer, PeerFlag } from "@/api";
import { duration } from "@/lib/format";

const has = (p: Peer, flag: PeerFlag) => p.flags.includes(flag);

const count = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export const peerAddress = ([ip, port]: [string, number]) =>
  ip.includes(":") ? `[${ip}]:${port}` : `${ip}:${port}`;

// Sorts IPv4 numerically (not "10." before "9."), IPv6 after it.
const ipKey = (ip: string) =>
  ip.includes(":")
    ? `6${ip}`
    : `4${ip
        .split(".")
        .map((o) => o.padStart(3, "0"))
        .join(".")}`;

const seed = (p: Peer) => has(p, "seed") || p.progress >= 1;

// Least complete first and seeds last; ties by address, so the order holds
// still between polls.
export const comparePeers = (a: Peer, b: Peer) =>
  Number(seed(a)) - Number(seed(b)) ||
  a.progress - b.progress ||
  ipKey(a.remote_endpoint[0]).localeCompare(ipKey(b.remote_endpoint[0])) ||
  a.remote_endpoint[1] - b.remote_endpoint[1];

// What's going on with a peer, in plain words; the tooltip has the longer
// story. The dot is a status color ("" for the plain one); none means the
// row is shown muted.
export type PeerState = { label: string; dot?: string; why: string };

export function peerState(p: Peer): PeerState {
  if (has(p, "connecting")) {
    return { label: "Connecting", why: "Not connected yet" };
  }

  if (has(p, "handshake")) {
    return {
      label: "Handshaking",
      why: "Connected, exchanging the BitTorrent handshake",
    };
  }

  const down = has(p, "interesting") && !has(p, "remote_choked");
  const up = has(p, "remote_interested") && !has(p, "choked");

  if (has(p, "interesting") && has(p, "snubbed")) {
    return {
      label: "Snubbed",
      dot: "status-error",
      why: "The peer stopped answering our requests, so it's asked for less until it does",
    };
  }
  if (down && up) {
    return {
      label: "Exchanging",
      dot: "status-success",
      why: "Downloading from and uploading to this peer",
    };
  }
  if (down) {
    return {
      label: "Downloading",
      dot: "status-success",
      why: "The peer has pieces we're missing and is sending them",
    };
  }
  if (up) {
    return {
      label: "Uploading",
      dot: "status-info",
      why: "The peer wants pieces we have and we're sending them",
    };
  }
  if (has(p, "interesting")) {
    return {
      label: "Choked us",
      dot: "status-warning",
      why: "The peer has pieces we're missing but isn't sending: we're waiting for one of its upload slots",
    };
  }
  if (has(p, "remote_interested")) {
    return {
      label: "Wants data",
      dot: "",
      why: "The peer wants pieces we have, but we've choked it: it's waiting for one of our upload slots",
    };
  }
  return {
    label: "Idle",
    why: has(p, "seed")
      ? "Neither side needs anything: the peer is a seed and we have what it has"
      : "Neither side has pieces the other is missing",
  };
}

export function peerStateDetails(p: Peer, s: PeerState) {
  return [
    s.why,
    has(p, "optimistic_unchoke") &&
      "Optimistic unchoke: we're giving this peer a try",
    has(p, "on_parole") &&
      "On parole: it sent corrupt data before, so it only gets whole pieces now",
    has(p, "endgame_mode") &&
      "Endgame: the last blocks are requested from several peers at once",
    p.download_queue_length > 0 &&
      `${count(p.download_queue_length, "block request")} outstanding`,
    `Last active ${p.last_active > 0 ? `${duration(p.last_active)} ago` : "just now"}`,
  ]
    .filter(Boolean)
    .join("\n");
}

const sources: Record<string, string> = {
  tracker: "tracker",
  dht: "DHT",
  pex: "peer exchange",
  lsd: "local discovery",
  resume_data: "resume data",
  incoming: "incoming connection",
};

export function peerOrigin(p: Peer) {
  const via = p.source.map((s) => sources[s] ?? s);
  return [
    via.length > 0 && `Found via ${via.join(", ")}`,
    has(p, "outgoing_connection") ? "We connected to it" : "It connected to us",
    `Local endpoint ${peerAddress(p.local_endpoint)}`,
  ]
    .filter(Boolean)
    .join("\n");
}

// qBittorrent's flag letters (src/base/bittorrent/peerinfo.cpp), so they read
// the same as in the client people know; the tooltip spells them out.
export const peerFlagLetters: [string, string, (p: Peer) => boolean][] = [
  [
    "D",
    "Downloading: interested, and the peer unchoked us",
    (p) => has(p, "interesting") && !has(p, "remote_choked"),
  ],
  [
    "d",
    "Interested, but the peer choked us",
    (p) => has(p, "interesting") && has(p, "remote_choked"),
  ],
  [
    "U",
    "Uploading: the peer is interested and unchoked",
    (p) => has(p, "remote_interested") && !has(p, "choked"),
  ],
  [
    "u",
    "The peer is interested, but we choked it",
    (p) => has(p, "remote_interested") && has(p, "choked"),
  ],
  [
    "K",
    "The peer unchoked us, but we're not interested",
    (p) => !has(p, "remote_choked") && !has(p, "interesting"),
  ],
  [
    "?",
    "We unchoked the peer, but it's not interested",
    (p) => !has(p, "choked") && !has(p, "remote_interested"),
  ],
  ["O", "Optimistic unchoke", (p) => has(p, "optimistic_unchoke")],
  ["S", "Snubbed", (p) => has(p, "snubbed")],
  ["I", "Incoming connection", (p) => !has(p, "outgoing_connection")],
  ["H", "Found through DHT", (p) => p.source.includes("dht")],
  ["X", "Found through peer exchange", (p) => p.source.includes("pex")],
  ["L", "Found through local discovery", (p) => p.source.includes("lsd")],
  ["E", "Encrypted traffic", (p) => has(p, "rc4_encrypted")],
  ["e", "Encrypted handshake", (p) => has(p, "plaintext_encrypted")],
  ["P", "µTP", (p) => has(p, "utp_socket")],
  ["h", "NAT hole punching", (p) => has(p, "holepunched")],
];

// "Web" as in qBittorrent; the tooltip says which kind.
export function peerConnection(p: Peer) {
  if (p.connection_type !== "standard_bittorrent") return "Web";
  if (has(p, "i2p_socket")) return "I2P";
  return has(p, "utp_socket") ? "µTP" : "TCP";
}

export const webSeedKinds = {
  web_seed: "Web seed (BEP 19)",
  http_seed: "HTTP seed (BEP 17)",
};

export function peerEncryption(p: Peer) {
  if (has(p, "ssl_socket")) return "SSL";
  if (has(p, "rc4_encrypted")) return "Encrypted traffic (RC4)";
  if (has(p, "plaintext_encrypted"))
    return "Encrypted handshake, plain traffic";
  return null;
}
