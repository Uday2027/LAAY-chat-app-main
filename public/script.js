const socket = new WebSocket("wss://" + location.host);
let currentUser = "";

function register() {
  const username = document.getElementById("username").value.trim();
  if (!username) return alert("Enter a username");
  currentUser = username;

  socket.send(JSON.stringify({ type: "register", username }));

  document.querySelector(".login-section").style.display = "none";
  document.querySelector(".chat-section").style.display = "block";
}

function sendMessage() {
  const to = document.getElementById("recipient").value.trim();
  const message = document.getElementById("message").value.trim();
  if (!to || !message) return alert("Enter recipient and message");

  socket.send(
    JSON.stringify({ type: "message", from: currentUser, to, message })
  );
  appendMessage(`📤 To ${to}: ${message}`);
  document.getElementById("message").value = "";
}

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "onlineUsers") {
    updateOnlineList(data.users);
  } else if (data.error) {
    appendMessage("❗ " + data.error);
  } else {
    appendMessage(`📥 From ${data.from}: ${data.message}`);
  }
};

function appendMessage(msg) {
  const chatBox = document.getElementById("chatBox");
  const div = document.createElement("div");
  div.textContent = msg;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function updateOnlineList(users) {
  const userList = document.getElementById("userList");
  userList.innerHTML = "";
  users.forEach((user) => {
    const li = document.createElement("li");
    li.textContent = user;
    userList.appendChild(li);
  });
}
