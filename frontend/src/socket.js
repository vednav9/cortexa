import { io } from "socket.io-client";
import { SOCKET_URL } from "./config/api";

export const socket = io(SOCKET_URL, {
    autoConnect: false, // ❗ VERY IMPORTANT
    transports: ["websocket"],
});
