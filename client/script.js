const socket = io('http://localhost:3000'); // آدرس سرور به صراحت مشخص شده

let senderId, receiverId;

async function addUser() {
  const userId = document.getElementById('newUserId').value;
  const username = document.getElementById('newUsername').value;
  if (!userId || !username) {
    alert('لطفاً آی‌دی کاربر و نام کاربری را وارد کنید');
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, username }),
    });
    const data = await response.json();
    if (response.ok) {
      alert('کاربر با موفقیت اضافه شد');
      document.getElementById('newUserId').value = '';
      document.getElementById('newUsername').value = '';
    } else {
      alert(data.error);
    }
  } catch (error) {
    alert('خطا در افزودن کاربر: ' + error.message);
  }
}

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
  messagesDiv.innerHTML = '';
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