const Message = require('../models/Message');

const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const loggedInUserId = req.user.id;

    const messages = await Message.find({
      $or: [
        { sender: loggedInUserId, recipient: userId },
        { sender: userId, recipient: loggedInUserId },
      ],
    }).sort({ timestamp: 'asc' }).populate('sender', 'fullName avatar').populate('recipient', 'fullName avatar');

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { recipient, message } = req.body;
    const sender = req.body.sender;
console.log("sending message:", sender);
    const newMessage = new Message({
      sender,
      recipient,
      message,
    });

    await newMessage.save();
    // Populate sender and recipient details before sending the response
    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'fullName avatar')
      .populate('recipient', 'fullName avatar');
    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  getMessages,
  sendMessage,
};
