const socket = io('http://localhost:3000');

let senderId, receiverId;

function startChat() {
  senderId = document.getElementById('senderId').value;
  receiverId = document.getElementById('receiverId').value;
  if (senderId && receiverId) {
    socket.emit('join', { senderId, receiverId });
    document.getElementById('messages').innerHTML = '';
  } else {
    alert('لطفاً هر دو آی‌دی را وارد کنید');
  }
}

function sendMessage() {
  const messageInput = document.getElementById('messageInput');
  const message = messageInput.value;
  if (message && senderId && receiverId) {
    socket.emit('sendMessage', { senderId, receiverId, message });
    messageInput.value = '';
  }
}

socket.on('loadMessages', (messages) => {
  const messagesDiv = document.getElementById('messages');
  messages.forEach((msg) => {
    const div = document.createElement('div');
    div.className = msg.sender === senderId ? 'message sent' : 'message received';
    div.textContent = `${msg.sender}: ${msg.message}`;
    messagesDiv.appendChild(div);
  });
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

socket.on('receiveMessage', (msg) => {
  const messagesDiv = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = msg.sender === senderId ? 'message sent' : 'message received';
  div.textContent = `${msg.sender}: ${msg.message}`;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

socket.on('chatPartners', (partners) => {
  const chatPartnersDiv = document.getElementById('chatPartners');
  chatPartnersDiv.innerHTML = '';
  partners.forEach((partnerId) => {
    const div = document.createElement('div');
    div.className = 'partner';
    div.textContent = partnerId;
    div.onclick = () => {
      document.getElementById('receiverId').value = partnerId;
      startChat();
    };
    chatPartnersDiv.appendChild(div);
  });
});