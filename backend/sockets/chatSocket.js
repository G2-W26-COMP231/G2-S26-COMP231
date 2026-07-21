const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Membership = require("../models/Membership");
const { persistAndBroadcast } = require("../controllers/messageController");

function initChatSocket(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;                          
      if (!token) return next(new Error("Authentication required."));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.sub);
      if (!user || user.isBanned) return next(new Error("Authentication required."));
      socket.userId = user._id.toString();
      next();
    } catch (err) {
      next(new Error("Authentication required."));
    }
  });

  io.on("connection", (socket) => {
    socket.on("group:join", async (groupId, ack) => {
      const membership = await Membership.findOne({ groupId, userId: socket.userId });
      if (!membership) {     
        return ack?.({ error: "You are not a member of this group." });
      }
      socket.join(`group:${groupId}`);    
      ack?.({ ok: true });   
    });
    socket.on("group:leave", (groupId) => { 
      socket.leave(`group:${groupId}`); 
    });
    
    socket.on("message:send", async ({ groupId, body, clientSentAt }, ack) => {
      try {
        const membership = await Membership.findOne({ groupId, userId: socket.userId }); 
        if (!membership) {       
          return ack?.({ error: "You are not a member of this group." });
        }
        const message = await persistAndBroadcast({                       
          groupId,
          senderId: socket.userId,
          body,
          io,
          clientSentAt,
        });
        ack?.({ ok: true, message });                                                 
      } catch (err) {
        ack?.({ error: err.message || "Could not send message." });
      }
    });
});
};

module.exports = initChatSocket;
